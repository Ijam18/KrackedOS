import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require('electron');

const sessions = new Map();
const REMOTE_PARTITION_PREFIX = 'persist:kdbrowser-remote:';
const DEFAULT_REMOTE_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
const MAX_CAPTURE_FPS = 12;
const MIN_CAPTURE_INTERVAL_MS = Math.round(1000 / MAX_CAPTURE_FPS);
const JPEG_QUALITY = 68;

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

function serializeSession(session) {
  if (!session) return null;
  return {
    sessionId: session.sessionId,
    profileId: session.profileId,
    partition: session.partition,
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

function sendResponse(requestId, ok, result) {
  if (typeof process.send !== 'function') return;
  process.send({
    type: 'response',
    requestId,
    ok,
    ...(ok ? { result } : { error: result instanceof Error ? result.message : String(result || 'Unknown remote browser error.') })
  });
}

function updateSessionState(session, patch = {}) {
  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
}

function refreshNavigationState(session) {
  if (!session?.window?.webContents) return;
  try {
    updateSessionState(session, {
      canGoBack: Boolean(session.window.webContents.canGoBack?.()),
      canGoForward: Boolean(session.window.webContents.canGoForward?.())
    });
  } catch {
    // Ignore transient state reads while Electron is still navigating.
  }
}

function commitFrame(session, image) {
  if (!session || !image || image.isEmpty?.()) return;
  session.frameBase64 = image.toJPEG(JPEG_QUALITY).toString('base64');
  session.revision += 1;
  session.lastCaptureAt = Date.now();
  session.updatedAt = new Date().toISOString();
}

function ensureFrame(session, image = null, { force = false } = {}) {
  if (!session) return;

  const now = Date.now();
  if (!force && session.capturePending) {
    return;
  }

  const elapsedMs = now - (session.lastCaptureAt || 0);
  if (!force && elapsedMs < MIN_CAPTURE_INTERVAL_MS) {
    if (session.captureTimer) {
      return;
    }

    const remainingDelay = Math.max(16, MIN_CAPTURE_INTERVAL_MS - elapsedMs);
    session.captureTimer = setTimeout(() => {
      session.captureTimer = null;
      ensureFrame(session, null, { force: true });
    }, remainingDelay);
    return;
  }

  if (image) {
    commitFrame(session, image);
    return;
  }

  session.capturePending = true;
  session.window?.webContents?.capturePage?.()
    .then((capturedImage) => {
      commitFrame(session, capturedImage);
    })
    .catch(() => {
      // Ignore capture failures while the page is still booting.
    })
    .finally(() => {
      session.capturePending = false;
    });
}

function attachWindowListeners(session) {
  const { window } = session;
  if (!window?.webContents) return;

  window.webContents.on('paint', (_event, _dirty, image) => {
    ensureFrame(session, image);
  });
  window.webContents.on('page-title-updated', (_event, title) => {
    updateSessionState(session, { title: title || session.title || 'KDBROWSER' });
  });
  window.webContents.on('did-start-loading', () => {
    updateSessionState(session, { isLoading: true, error: '' });
  });
  window.webContents.on('did-stop-loading', () => {
    refreshNavigationState(session);
    updateSessionState(session, {
      isLoading: false,
      error: '',
      url: session.window.webContents.getURL?.() || session.url,
      title: session.window.webContents.getTitle?.() || session.title
    });
    ensureFrame(session);
  });
  window.webContents.on('did-navigate', (_event, url) => {
    updateSessionState(session, { url });
    refreshNavigationState(session);
  });
  window.webContents.on('did-navigate-in-page', (_event, url) => {
    updateSessionState(session, { url });
    refreshNavigationState(session);
  });
  window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame === false || errorCode === -3) return;
    updateSessionState(session, {
      isLoading: false,
      error: errorDescription || 'Remote browser failed to load the requested page.',
      url: validatedURL || session.url
    });
    ensureFrame(session);
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    updateSessionState(session, {
      isLoading: false,
      error: details?.reason ? `Remote browser renderer exited: ${details.reason}` : 'Remote browser renderer exited unexpectedly.'
    });
  });
  window.webContents.setWindowOpenHandler((details) => {
    let targetUrl = '';
    try {
      targetUrl = sanitizeRemoteUrl(details.url);
    } catch {
      targetUrl = '';
    }

    if (targetUrl) {
      window.webContents.loadURL(targetUrl).catch(() => {});
    }

    return { action: 'deny' };
  });
}

async function createSession(payload = {}) {
  const sessionId = sanitizeSessionId(payload.sessionId || `remote-${Date.now().toString(36)}`);
  const existing = sessions.get(sessionId);
  if (existing) {
    return serializeSession(existing);
  }

  const profileId = sanitizeProfileId(payload.profileId || 'main');
  const url = sanitizeRemoteUrl(payload.url);
  const width = clampNumber(payload.width, 640, 2560, 1440);
  const height = clampNumber(payload.height, 420, 1600, 900);
  const partition = `${REMOTE_PARTITION_PREFIX}${profileId}:${sessionId}`;
  const win = new BrowserWindow({
    show: false,
    width,
    height,
    useContentSize: true,
    frame: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      partition,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  win.webContents.setFrameRate(24);
  win.webContents.setUserAgent(DEFAULT_REMOTE_USER_AGENT);

  const session = {
    sessionId,
    profileId,
    partition,
    window: win,
    width,
    height,
    url,
    title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'KDBROWSER',
    revision: 0,
    frameBase64: '',
    capturePending: false,
    captureTimer: null,
    lastCaptureAt: 0,
    isLoading: true,
    canGoBack: false,
    canGoForward: false,
    error: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sessions.set(sessionId, session);
  win.on('closed', () => {
    sessions.delete(session.sessionId);
  });
  attachWindowListeners(session);

  try {
    await win.webContents.loadURL(url);
  } catch (error) {
    updateSessionState(session, {
      isLoading: false,
      error: error instanceof Error ? error.message : 'Remote browser failed to open the requested page.'
    });
  }
  ensureFrame(session);
  refreshNavigationState(session);
  return serializeSession(session);
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
  if (session.captureTimer) {
    clearTimeout(session.captureTimer);
    session.captureTimer = null;
  }
  if (session.window && !session.window.isDestroyed()) {
    session.window.destroy();
  }
  return { ok: true, sessionId: session.sessionId };
}

async function navigateSession(sessionId, url) {
  const session = getSessionById(sessionId);
  const nextUrl = sanitizeRemoteUrl(url);
  updateSessionState(session, { isLoading: true, error: '', url: nextUrl });
  try {
    await session.window.webContents.loadURL(nextUrl);
  } catch (error) {
    updateSessionState(session, {
      isLoading: false,
      error: error instanceof Error ? error.message : 'Remote browser failed to navigate to the requested page.',
      url: nextUrl
    });
  }
  refreshNavigationState(session);
  ensureFrame(session);
  return serializeSession(session);
}

async function resizeSession(sessionId, payload = {}) {
  const session = getSessionById(sessionId);
  const width = clampNumber(payload.width, 640, 2560, session.width);
  const height = clampNumber(payload.height, 420, 1600, session.height);
  session.width = width;
  session.height = height;
  session.window.setContentSize(width, height);
  ensureFrame(session);
  return serializeSession(session);
}

async function runSessionAction(sessionId, action) {
  const session = getSessionById(sessionId);
  const webContents = session.window.webContents;

  if (action === 'back' && webContents.canGoBack()) {
    webContents.goBack();
  } else if (action === 'forward' && webContents.canGoForward()) {
    webContents.goForward();
  } else if (action === 'reload') {
    webContents.reload();
  } else {
    throw new Error(`Unsupported remote browser action: ${action}`);
  }

  updateSessionState(session, { isLoading: true, error: '' });
  ensureFrame(session);
  refreshNavigationState(session);
  return serializeSession(session);
}

function mapButton(button = 'left') {
  if (button === 'middle' || button === 'right') return button;
  return 'left';
}

async function sendInputEventToSession(sessionId, payload = {}) {
  const session = getSessionById(sessionId);
  const webContents = session.window.webContents;

  if (!payload || typeof payload !== 'object') {
    throw new Error('Expected an input payload object.');
  }

  const type = String(payload.type || '');
  const event = { type };

  if (type.startsWith('mouse')) {
    event.x = clampNumber(payload.x, 0, session.width, 0);
    event.y = clampNumber(payload.y, 0, session.height, 0);
    if (type === 'mouseDown' || type === 'mouseUp') {
      event.button = mapButton(payload.button);
      event.clickCount = clampNumber(payload.clickCount, 1, 3, 1);
    }
    if (type === 'mouseWheel') {
      event.deltaX = clampNumber(payload.deltaX, -4000, 4000, 0);
      event.deltaY = clampNumber(payload.deltaY, -4000, 4000, 0);
      event.canScroll = true;
    }
  } else if (type === 'keyDown' || type === 'keyUp' || type === 'char') {
    event.keyCode = typeof payload.keyCode === 'string' ? payload.keyCode : '';
    event.modifiers = Array.isArray(payload.modifiers) ? payload.modifiers : [];
  } else {
    throw new Error(`Unsupported input event type: ${type}`);
  }

  webContents.focus();
  webContents.sendInputEvent(event);
  return serializeSession(session);
}

async function readFrame(sessionId) {
  const session = getSessionById(sessionId);
  if (!session.frameBase64) {
    ensureFrame(session);
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
        transport: 'electron-offscreen',
        sessionCount: sessions.size
      };
    case 'session:create':
      return createSession(message.payload);
    case 'session:get':
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
    default:
      throw new Error(`Unsupported remote browser worker request: ${message.kind}`);
  }
}

function shutdown() {
  sessions.forEach((session) => {
    if (session.captureTimer) {
      clearTimeout(session.captureTimer);
      session.captureTimer = null;
    }
    if (session.window && !session.window.isDestroyed()) {
      session.window.destroy();
    }
  });
  sessions.clear();
  app.quit();
}

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.whenReady().then(() => {
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

process.on('disconnect', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
