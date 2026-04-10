import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.join(__dirname, '.kdbrowser-remote');
const STORAGE_STATE_DIR = path.join(STORAGE_ROOT, 'profiles');
const PLAYWRIGHT_CACHE_ROOT = path.join(process.env.HOME || '', '.cache', 'ms-playwright');
const PLAYWRIGHT_CHROMIUM_EXECUTABLE = path.join(PLAYWRIGHT_CACHE_ROOT, 'chromium-1217', 'chrome-linux64', 'chrome');
const DEFAULT_VIEWPORT = { width: 1180, height: 760 };
const FRAME_EVENT_MIN_INTERVAL_MS = 70;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
const DEFAULT_USER_AGENT_METADATA = {
  brands: [
    { brand: 'Chromium', version: '135' },
    { brand: 'Google Chrome', version: '135' },
    { brand: 'Not.A/Brand', version: '24' }
  ],
  fullVersion: '135.0.7049.95',
  fullVersionList: [
    { brand: 'Chromium', version: '135.0.7049.95' },
    { brand: 'Google Chrome', version: '135.0.7049.95' },
    { brand: 'Not.A/Brand', version: '24.0.0.0' }
  ],
  platform: 'Linux',
  platformVersion: '6.8.0',
  architecture: 'x86',
  model: '',
  mobile: false
};

let browserPromise = null;
const sessions = new Map();
const pendingSessionCreations = new Map();

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeSessionId(value = '') {
  const safeValue = String(value || '').trim().replace(/[^a-zA-Z0-9:_-]+/g, '-').slice(0, 120);
  if (!safeValue) {
    throw new Error('Expected a non-empty remote browser session id.');
  }
  return safeValue;
}

function sanitizeProfileId(value = 'main') {
  const safeValue = String(value || '').trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').slice(0, 80);
  return safeValue || 'main';
}

function sanitizeRemoteUrl(value = '', fallbackProtocol = 'https:') {
  const raw = String(value || '').trim();
  if (!raw) {
    throw new Error('Provide a URL for the remote browser session.');
  }

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) {
      throw new Error('Only http and https URLs are supported.');
    }
    return parsed.toString();
  } catch {
    const parsed = new URL(`${fallbackProtocol}//${raw}`);
    if (!/^https?:$/i.test(parsed.protocol)) {
      throw new Error('Only http and https URLs are supported.');
    }
    return parsed.toString();
  }
}

function sendResponse(requestId, ok, result) {
  if (typeof process.send !== 'function') return;
  process.send({
    type: 'response',
    requestId,
    ok,
    ...(ok ? { result } : { error: result instanceof Error ? result.message : String(result || 'Unknown remote browser error.') })
  });
}

function sendWorkerEvent(event, payload = {}) {
  if (typeof process.send !== 'function') return;
  process.send({
    type: 'event',
    event,
    ...payload
  });
}

function getStorageStatePath(profileId) {
  return path.join(STORAGE_STATE_DIR, `${sanitizeProfileId(profileId)}.json`);
}

async function ensureStorageRoot() {
  await fs.mkdir(STORAGE_STATE_DIR, { recursive: true });
}

async function resolveChromiumExecutablePath() {
  try {
    await fs.access(PLAYWRIGHT_CHROMIUM_EXECUTABLE);
    return PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  } catch {
    return undefined;
  }
}

async function readStorageState(profileId) {
  try {
    const raw = await fs.readFile(getStorageStatePath(profileId), 'utf8');
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

async function persistStorageState(profileId, context) {
  try {
    await ensureStorageRoot();
    const state = await context.storageState();
    await fs.writeFile(getStorageStatePath(profileId), JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Ignore storage persistence failures.
  }
}

async function ensureBrowser() {
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    const executablePath = await resolveChromiumExecutablePath();
    const hasDisplay = Boolean(String(process.env.DISPLAY || '').trim());
    return chromium.launch({
      headless: !hasDisplay,
      executablePath,
      chromiumSandbox: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame,PaintHolding',
        '--disable-gpu',
        '--disable-infobars',
        '--disable-site-isolation-trials',
        '--no-default-browser-check',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain'
      ]
    });
  })().catch((error) => {
    browserPromise = null;
    throw error;
  });

  return browserPromise;
}

function serializeSession(session) {
  if (!session) return null;
  return {
    sessionId: session.sessionId,
    profileId: session.profileId,
    partition: `chromium:${session.profileId}`,
    driver: 'chromium-cdp-stream',
    url: session.url,
    title: session.title,
    width: session.width,
    height: session.height,
    revision: session.revision,
    isLoading: session.isLoading,
    canGoBack: session.canGoBack,
    canGoForward: session.canGoForward,
    error: session.error,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function emitSessionState(session) {
  if (!session?.sessionId) return;
  sendWorkerEvent('session:state', {
    sessionId: session.sessionId,
    session: serializeSession(session)
  });
}

function updateSessionState(session, patch = {}) {
  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
  emitSessionState(session);
}

function getActivePage(session) {
  if (!session) return null;
  const activePage = session.activePage;
  if (activePage && !activePage.isClosed()) return activePage;

  const fallbackPage = session.pages.find((page) => page && !page.isClosed()) || null;
  session.activePage = fallbackPage;
  return fallbackPage;
}

async function ensureSessionPage(session, { navigate = false } = {}) {
  const currentPage = getActivePage(session);
  if (currentPage) {
    if (navigate) {
      updateSessionState(session, {
        isLoading: true,
        error: ''
      });
      try {
        await currentPage.goto(session.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      } catch (error) {
        updateSessionState(session, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Remote browser failed to restore the page.'
        });
      }
    }
    return currentPage;
  }

  updateSessionState(session, {
    isLoading: true,
    error: ''
  });

  const page = await session.context.newPage();
  attachPage(session, page);

  try {
    await page.goto(session.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const nextTitle = await page.title().catch(() => session.title);
    updateSessionState(session, {
      title: nextTitle || session.title,
      url: page.url() || session.url,
      isLoading: false,
      error: ''
    });
    trackHistory(session, page.url() || session.url);
  } catch (error) {
    updateSessionState(session, {
      isLoading: false,
      error: error instanceof Error ? error.message : 'Remote browser failed to restore the page.'
    });
  }

  await startSessionStream(session, page).catch(() => {});
  await captureFrame(session).catch(() => {});
  return page;
}

function refreshNavigationState(session) {
  const history = Array.isArray(session.history) ? session.history : [];
  const historyIndex = Number.isFinite(session.historyIndex) ? session.historyIndex : Math.max(0, history.length - 1);
  updateSessionState(session, {
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1
  });
}

function enqueueSessionOperation(session, operation) {
  const previousOperation = session.operationQueue || Promise.resolve();
  const nextOperation = previousOperation.then(operation, operation);
  session.operationQueue = nextOperation.catch(() => {});
  return nextOperation;
}

function emitSessionFrame(session) {
  if (!session?.frameBase64) return;
  const now = Date.now();
  if (now - Number(session.lastFrameEventAt || 0) < FRAME_EVENT_MIN_INTERVAL_MS) {
    return;
  }

  session.lastFrameEventAt = now;
  sendWorkerEvent('session:frame', {
    sessionId: session.sessionId,
    revision: session.revision,
    contentType: 'image/jpeg',
    data: session.frameBase64
  });
}

async function captureFrame(session) {
  const page = getActivePage(session);
  if (!page || session.capturePending) return;

  session.capturePending = true;
  try {
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 56,
      animations: 'disabled',
      scale: 'css'
    });
    session.frameBase64 = screenshot.toString('base64');
    session.revision += 1;
    session.updatedAt = new Date().toISOString();
    emitSessionFrame(session);
  } finally {
    session.capturePending = false;
  }
}

function mapModifierKeyName(modifier = '') {
  const normalized = String(modifier || '').toLowerCase();
  if (normalized === 'control') return 'Control';
  if (normalized === 'shift') return 'Shift';
  if (normalized === 'alt') return 'Alt';
  if (normalized === 'meta') return 'Meta';
  return '';
}

async function withKeyboardModifiers(page, modifiers = [], callback = async () => {}) {
  const modifierKeys = Array.isArray(modifiers)
    ? modifiers.map(mapModifierKeyName).filter(Boolean)
    : [];

  try {
    for (const modifierKey of modifierKeys) {
      await page.keyboard.down(modifierKey).catch(() => {});
    }
    await callback();
  } finally {
    for (const modifierKey of [...modifierKeys].reverse()) {
      await page.keyboard.up(modifierKey).catch(() => {});
    }
  }
}

function trackHistory(session, nextUrl) {
  if (!nextUrl) return;
  const currentHistory = Array.isArray(session.history) ? [...session.history] : [];
  const currentIndex = Number.isFinite(session.historyIndex) ? session.historyIndex : Math.max(0, currentHistory.length - 1);
  const visibleHistory = currentHistory.slice(0, currentIndex + 1);

  if (visibleHistory[visibleHistory.length - 1] !== nextUrl) {
    visibleHistory.push(nextUrl);
  }

  session.history = visibleHistory.slice(-64);
  session.historyIndex = session.history.length - 1;
  refreshNavigationState(session);
}

async function applyStealth(context) {
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });
    } catch {}

    try {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    } catch {}

    try {
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Linux x86_64'
      });
    } catch {}

    try {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin' },
          { name: 'Chrome PDF Viewer' },
          { name: 'Native Client' }
        ]
      });
    } catch {}

    try {
      if (!window.chrome) {
        Object.defineProperty(window, 'chrome', {
          value: {
            runtime: {},
            app: {},
            webstore: {}
          }
        });
      }
    } catch {}

    try {
      const originalQuery = window.navigator.permissions?.query?.bind(window.navigator.permissions);
      if (originalQuery) {
        window.navigator.permissions.query = (parameters) => (
          parameters && parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters)
        );
      }
    } catch {}
  });
}

async function getPageClient(page) {
  if (page.__kdosCdpClient) {
    return page.__kdosCdpClient;
  }

  const client = await page.context().newCDPSession(page);
  page.__kdosCdpClient = client;
  return client;
}

async function applyPageStealth(page) {
  try {
    const client = await getPageClient(page);
    await client.send('Network.enable').catch(() => {});
    await client.send('Network.setUserAgentOverride', {
      userAgent: DEFAULT_USER_AGENT,
      acceptLanguage: 'en-US,en;q=0.9',
      platform: 'Linux x86_64',
      userAgentMetadata: DEFAULT_USER_AGENT_METADATA
    }).catch(() => {});
  } catch {
    // Ignore CDP stealth failures and continue with the best effort browser surface.
  }
}

async function stopSessionStream(session) {
  const client = session?.streamClient || null;
  if (!client || !session?.streamActive) {
    session.streamActive = false;
    session.streamClient = null;
    session.streamPage = null;
    session.streamViewportSignature = '';
    return;
  }

  await client.send('Page.stopScreencast').catch(() => {});
  session.streamActive = false;
  session.streamClient = null;
  session.streamPage = null;
  session.streamViewportSignature = '';
}

async function startSessionStream(session, page = getActivePage(session)) {
  if (!session?.isActive || !page) {
    await stopSessionStream(session);
    return;
  }

  const client = await getPageClient(page);
  const viewportSignature = `${session.width}x${session.height}`;
  if (session.streamClient === client && session.streamActive && session.streamViewportSignature === viewportSignature) {
    return;
  }

  await stopSessionStream(session);
  await client.send('Page.enable').catch(() => {});

  if (!client.__kdosScreencastHandlerAttached) {
    client.on('Page.screencastFrame', async (payload = {}) => {
      const ownerSession = client.__kdosOwnerSession;
      const ownerPage = client.__kdosOwnerPage;
      const ownerSessionId = client.__kdosOwnerSessionId;
      const currentSession = ownerSessionId ? sessions.get(ownerSessionId) : null;
      const shouldIgnore = !currentSession
        || currentSession !== ownerSession
        || currentSession.streamClient !== client
        || currentSession.streamPage !== ownerPage
        || !currentSession.isActive;

      if (shouldIgnore) {
        await client.send('Page.screencastFrameAck', { sessionId: payload.sessionId }).catch(() => {});
        return;
      }

      currentSession.frameBase64 = payload.data || '';
      currentSession.revision += 1;
      currentSession.updatedAt = new Date().toISOString();
      emitSessionFrame(currentSession);
      await client.send('Page.screencastFrameAck', { sessionId: payload.sessionId }).catch(() => {});
    });
    client.__kdosScreencastHandlerAttached = true;
  }

  client.__kdosOwnerSession = session;
  client.__kdosOwnerPage = page;
  client.__kdosOwnerSessionId = session.sessionId;

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 56,
    maxWidth: session.width,
    maxHeight: session.height,
    everyNthFrame: 2
  }).catch(() => {});

  session.streamClient = client;
  session.streamPage = page;
  session.streamViewportSignature = viewportSignature;
  session.streamActive = true;
}

function markSessionDirty(session, patch = {}) {
  updateSessionState(session, patch);
  queueMicrotask(() => {
    if (!session?.isActive || session.streamActive) return;
    captureFrame(session).catch(() => {});
  });
}

function attachPage(session, page) {
  if (!page || session.pages.includes(page)) return;
  session.pages.push(page);
  session.activePage = page;
  page.setViewportSize({ width: session.width, height: session.height }).catch(() => {});
  applyPageStealth(page).catch(() => {});
  startSessionStream(session, page).catch(() => {});

  page.on('close', () => {
    session.pages = session.pages.filter((candidate) => candidate !== page);
    session.activePage = session.pages.find((candidate) => !candidate.isClosed()) || null;
    startSessionStream(session).catch(() => {});
    const activePage = getActivePage(session);
    if (!activePage) return;

    const nextUrl = activePage.url() || session.url;
    Promise.resolve(activePage.title())
      .then((nextTitle) => {
        markSessionDirty(session, {
          url: nextUrl,
          title: nextTitle || session.title
        });
      })
      .catch(() => {
        markSessionDirty(session, {
          url: nextUrl,
          title: session.title
        });
      });
  });

  page.on('framenavigated', (frame) => {
    if (frame !== page.mainFrame()) return;
    const nextUrl = frame.url();
    trackHistory(session, nextUrl);
    Promise.resolve(page.title())
      .then((nextTitle) => {
        markSessionDirty(session, {
          url: nextUrl,
          title: nextTitle || session.title
        });
      })
      .catch(() => {
        markSessionDirty(session, {
          url: nextUrl,
          title: session.title
        });
      });
  });

  page.on('load', async () => {
    const nextTitle = await page.title().catch(() => session.title);
    markSessionDirty(session, {
      isLoading: false,
      title: nextTitle || session.title,
      url: page.url() || session.url,
      error: ''
    });
  });

  page.on('popup', (popupPage) => {
    attachPage(session, popupPage);
  });
}

async function createSession(payload = {}) {
  const sessionId = sanitizeSessionId(payload.sessionId || `remote-${Date.now().toString(36)}`);
  const existing = sessions.get(sessionId);
  if (existing) {
    existing.isActive = payload.active !== false;
    if (Number.isFinite(payload.width)) existing.width = clampNumber(payload.width, 640, 2560, existing.width);
    if (Number.isFinite(payload.height)) existing.height = clampNumber(payload.height, 420, 1600, existing.height);
    if (payload.url) {
      try {
        existing.url = sanitizeRemoteUrl(payload.url);
      } catch {
        // Keep existing URL on invalid input.
      }
    }
    await ensureSessionPage(existing).catch(() => {});
    await startSessionStream(existing).catch(() => {});
    return serializeSession(existing);
  }

  const pendingCreation = pendingSessionCreations.get(sessionId);
  if (pendingCreation) {
    return pendingCreation;
  }

  const creationPromise = (async () => {
    const browser = await ensureBrowser();
    const profileId = sanitizeProfileId(payload.profileId || 'main');
    const url = sanitizeRemoteUrl(payload.url);
    const width = clampNumber(payload.width, 640, 2560, DEFAULT_VIEWPORT.width);
    const height = clampNumber(payload.height, 420, 1600, DEFAULT_VIEWPORT.height);
    const storageState = await readStorageState(profileId);
    let context = null;
    let session = null;

    try {
      context = await browser.newContext({
        viewport: { width, height },
        screen: { width, height },
        deviceScaleFactor: 1,
        userAgent: DEFAULT_USER_AGENT,
        locale: 'en-US',
        timezoneId: 'Asia/Singapore',
        colorScheme: 'light',
        ignoreHTTPSErrors: true,
        storageState,
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      await context.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1'
      }).catch(() => {});

      await applyStealth(context);
      const page = await context.newPage();

      session = {
        sessionId,
        profileId,
        context,
        pages: [],
        activePage: page,
        width,
        height,
        url,
        title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'KDBROWSER',
        revision: 0,
        frameBase64: '',
        capturePending: false,
        streamClient: null,
        streamPage: null,
        streamActive: false,
        streamViewportSignature: '',
        lastFrameEventAt: 0,
        isActive: payload.active !== false,
        isLoading: true,
        canGoBack: false,
        canGoForward: false,
        error: '',
        operationQueue: Promise.resolve(),
        history: [url],
        historyIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      sessions.set(sessionId, session);
      attachPage(session, page);
      context.on('page', (popupPage) => {
        attachPage(session, popupPage);
      });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const nextTitle = await page.title().catch(() => session.title);
        updateSessionState(session, {
          title: nextTitle || session.title,
          url: page.url() || url,
          isLoading: false,
          error: ''
        });
        trackHistory(session, page.url() || url);
      } catch (error) {
        updateSessionState(session, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Remote browser failed to open the requested page.'
        });
      }

      await startSessionStream(session, page).catch(() => {});
      await captureFrame(session);
      await persistStorageState(profileId, context);
      return serializeSession(session);
    } catch (error) {
      if (session) {
        sessions.delete(session.sessionId);
        await stopSessionStream(session).catch(() => {});
      }
      if (context) {
        await context.close().catch(() => {});
      }
      throw error;
    }
  })();

  pendingSessionCreations.set(sessionId, creationPromise);

  try {
    return await creationPromise;
  } finally {
    if (pendingSessionCreations.get(sessionId) === creationPromise) {
      pendingSessionCreations.delete(sessionId);
    }
  }
}

function getSessionById(sessionId) {
  const safeSessionId = sanitizeSessionId(sessionId);
  const session = sessions.get(safeSessionId);
  if (!session) {
    throw new Error(`Remote browser session not found: ${safeSessionId}`);
  }
  return session;
}

async function closeSession(sessionId) {
  const session = getSessionById(sessionId);
  sessions.delete(session.sessionId);
  await stopSessionStream(session);
  await persistStorageState(session.profileId, session.context);
  await session.context.close().catch(() => {});
  return { ok: true, sessionId: session.sessionId };
}

async function setSessionActivity(sessionId, payload = {}) {
  const session = getSessionById(sessionId);
  session.isActive = payload.active !== false;
  if (session.isActive) {
    await ensureSessionPage(session).catch(() => {});
    await startSessionStream(session);
    await captureFrame(session).catch(() => {});
  } else {
    await stopSessionStream(session);
  }
  return serializeSession(session);
}

async function navigateSession(sessionId, url) {
  const session = getSessionById(sessionId);
  return enqueueSessionOperation(session, async () => {
    const nextUrl = sanitizeRemoteUrl(url);
    updateSessionState(session, { url: nextUrl });
    const page = await ensureSessionPage(session);

    updateSessionState(session, { isLoading: true, error: '', url: nextUrl });
    try {
      await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const nextTitle = await page.title().catch(() => session.title);
      updateSessionState(session, {
        isLoading: false,
        error: '',
        url: page.url() || nextUrl,
        title: nextTitle || session.title
      });
      trackHistory(session, page.url() || nextUrl);
    } catch (error) {
      updateSessionState(session, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Remote browser failed to navigate to the requested page.',
        url: nextUrl
      });
    }

    await startSessionStream(session);
    await captureFrame(session);
    await persistStorageState(session.profileId, session.context);
    return serializeSession(session);
  });
}

async function resizeSession(sessionId, payload = {}) {
  const session = getSessionById(sessionId);
  return enqueueSessionOperation(session, async () => {
    const width = clampNumber(payload.width, 640, 2560, session.width);
    const height = clampNumber(payload.height, 420, 1600, session.height);
    updateSessionState(session, { width, height });
    const pages = session.pages.filter((page) => page && !page.isClosed());
    await Promise.all(
      pages.map((page) => page.setViewportSize({ width, height }).catch(() => {}))
    );
    await startSessionStream(session);
    await captureFrame(session);
    return serializeSession(session);
  });
}

async function runSessionAction(sessionId, action) {
  const session = getSessionById(sessionId);
  return enqueueSessionOperation(session, async () => {
    const page = await ensureSessionPage(session);

    updateSessionState(session, { isLoading: true, error: '' });
    if (action === 'back') {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      session.historyIndex = Math.max(0, session.historyIndex - 1);
    } else if (action === 'forward') {
      await page.goForward({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      session.historyIndex = Math.min(session.history.length - 1, session.historyIndex + 1);
    } else if (action === 'reload') {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
    } else {
      throw new Error(`Unsupported remote browser action: ${action}`);
    }

    refreshNavigationState(session);
    const nextTitle = await page.title().catch(() => session.title);
    updateSessionState(session, {
      isLoading: false,
      url: page.url() || session.url,
      title: nextTitle || session.title
    });
    await startSessionStream(session);
    await captureFrame(session);
    await persistStorageState(session.profileId, session.context);
    return serializeSession(session);
  });
}

async function sendInputEventToSession(sessionId, payload = {}) {
  const session = getSessionById(sessionId);
  return enqueueSessionOperation(session, async () => {
    const page = await ensureSessionPage(session);

    const type = String(payload.type || '');
    if (type === 'mouseMove') {
      await page.mouse.move(
        clampNumber(payload.x, 0, session.width, 0),
        clampNumber(payload.y, 0, session.height, 0)
      );
    } else if (type === 'mouseDown') {
      await page.mouse.move(
        clampNumber(payload.x, 0, session.width, 0),
        clampNumber(payload.y, 0, session.height, 0)
      );
      await page.mouse.down({ button: payload.button || 'left', clickCount: clampNumber(payload.clickCount, 1, 3, 1) });
    } else if (type === 'mouseUp') {
      await page.mouse.move(
        clampNumber(payload.x, 0, session.width, 0),
        clampNumber(payload.y, 0, session.height, 0)
      );
      await page.mouse.up({ button: payload.button || 'left', clickCount: clampNumber(payload.clickCount, 1, 3, 1) });
    } else if (type === 'mouseWheel') {
      await page.mouse.wheel(
        clampNumber(payload.deltaX, -4000, 4000, 0),
        clampNumber(payload.deltaY, -4000, 4000, 0)
      );
    } else if (type === 'mouseClick') {
      await page.mouse.click(
        clampNumber(payload.x, 0, session.width, 0),
        clampNumber(payload.y, 0, session.height, 0),
        {
          button: payload.button || 'left',
          clickCount: clampNumber(payload.clickCount, 1, 3, 1),
          delay: 0
        }
      );
    } else if (type === 'keyPress') {
      if (payload.keyCode) {
        await withKeyboardModifiers(page, payload.modifiers, async () => {
          await page.keyboard.press(String(payload.keyCode)).catch(() => {});
        });
      }
    } else if (type === 'char') {
      if (payload.keyCode) {
        await page.keyboard.type(String(payload.keyCode), { delay: 0 }).catch(() => {});
      }
    } else {
      throw new Error(`Unsupported input event type: ${type}`);
    }

    if (!session.streamActive) {
      await captureFrame(session);
    }
    return serializeSession(session);
  });
}

async function readFrame(sessionId) {
  const session = getSessionById(sessionId);
  await ensureSessionPage(session).catch(() => {});
  if (!session.frameBase64) {
    await captureFrame(session);
  }

  return {
    sessionId: session.sessionId,
    revision: session.revision,
    contentType: 'image/jpeg',
    data: session.frameBase64
  };
}

async function handleRequest(message = {}) {
  switch (message.kind) {
    case 'status':
      return {
        available: true,
        transport: 'chromium-cdp-stream',
        sessionCount: sessions.size,
        hasDisplay: Boolean(String(process.env.DISPLAY || '').trim())
      };
    case 'session:create':
      return createSession(message.payload);
    case 'session:get':
      await ensureSessionPage(getSessionById(message.payload?.sessionId)).catch(() => {});
      return serializeSession(getSessionById(message.payload?.sessionId));
    case 'session:close':
      return closeSession(message.payload?.sessionId);
    case 'session:navigate':
      return navigateSession(message.payload?.sessionId, message.payload?.url);
    case 'session:resize':
      return resizeSession(message.payload?.sessionId, message.payload);
    case 'session:action':
      return runSessionAction(message.payload?.sessionId, message.payload?.action);
    case 'session:input':
      return sendInputEventToSession(message.payload?.sessionId, message.payload?.event);
    case 'session:frame':
      return readFrame(message.payload?.sessionId);
    case 'session:activity':
      return setSessionActivity(message.payload?.sessionId, message.payload);
    default:
      throw new Error(`Unsupported remote browser worker request: ${message.kind}`);
  }
}

async function shutdown() {
  const currentSessions = Array.from(sessions.values());
  sessions.clear();
  await Promise.all(currentSessions.map(async (session) => {
    await stopSessionStream(session).catch(() => {});
    await persistStorageState(session.profileId, session.context);
    await session.context.close().catch(() => {});
  }));

  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    await browser?.close?.().catch(() => {});
  }
  browserPromise = null;
  process.exit(0);
}

ensureStorageRoot().finally(() => {
  if (typeof process.send === 'function') {
    process.send({ type: 'ready' });
  }
});

process.on('message', async (message = {}) => {
  if (!message?.requestId) return;

  try {
    const result = await handleRequest(message);
    sendResponse(message.requestId, true, result);
  } catch (error) {
    sendResponse(message.requestId, false, error);
  }
});

process.on('disconnect', () => {
  shutdown().catch(() => process.exit(0));
});
process.on('SIGTERM', () => {
  shutdown().catch(() => process.exit(0));
});
process.on('SIGINT', () => {
  shutdown().catch(() => process.exit(0));
});
