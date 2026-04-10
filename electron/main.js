import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILT_IN_WALLPAPERS,
  DEFAULT_DESKTOP_LAYOUT,
  DEFAULT_EXPLORER_PREFERENCES,
  DEFAULT_PERSONALIZATION,
  DEFAULT_PROFILE,
  DEFAULT_SHELL_SESSION,
  DEFAULT_SESSION_STATE,
  MIGRATION_VERSION,
  OS_RUNTIME_MODES,
  WORKSPACE_PATHS,
  getDefaultWallpaperId
} from '../src/features/ijam-os/os-core/constants.js';
import {
  basenameFromPath,
  dataUrlToExtension,
  dirnameFromPath,
  extnameFromPath,
  joinOsPath,
  normalizeOsPath,
  sanitizeFileName
} from '../src/features/ijam-os/os-core/pathUtils.js';
import { createPowerApi } from './power.js';
import { createDeviceApi } from './device.js';
import { scrapeReferencePayload } from '../tools/referenceScraper.js';
import { loadMajiMemoryCard, onboardMajiUser, saveMajiMemoryCard } from '../tools/majiMemoryCard.js';
import {
  DEFAULT_BROWSER_PROFILE_ID,
  DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
  DEFAULT_BROWSER_STATE,
  DEFAULT_BROWSER_USER_AGENT,
  KDBROWSER_HOME_URL,
  createDefaultBrowserState,
  getBrowserPartition,
  getBrowserProfileIdFromPartition,
  sanitizeBrowserProfileId,
  sanitizeBrowserState
} from '../src/features/ijam-os/os-core/browserState.js';
import {
  DEFAULT_INSTALLED_APPS_STATE,
  applyCatalogAutoInstallSeed,
  hasInstalledAppsStateChanged,
  sanitizeInstalledAppsState
} from '../src/features/ijam-os/os-core/installedAppsState.js';

const require = createRequire(import.meta.url);
const { app, BrowserView, BrowserWindow, ipcMain, session, shell } = require('electron');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homeRoot = path.join(os.homedir(), 'KRACKED_OS');
const metadataPath = path.join(homeRoot, 'system', 'entry-metadata.json');
const devServerUrl = process.env.KRACKED_OS_DEV_SERVER_URL || '';
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
const powerApi = createPowerApi();
const deviceApi = createDeviceApi();
const nativeBrowserShellPath = path.join(__dirname, 'nativeBrowserShell.html');
const nativeBrowserShellPreloadPath = path.join(__dirname, 'nativeBrowserShellPreload.js');
const nativeBrowserGuestPreloadPath = path.join(__dirname, 'nativeBrowserGuestPreload.js');
const VALID_WALLPAPER_FITS = new Set(['fill', 'contain', 'cover']);
const BROWSER_WINDOW_OPEN_EVENT = 'os.browser.windowOpenRequested';
const NATIVE_BROWSER_STATE_EVENT = 'os.browser.native.state';
const BROWSER_SESSION_PARTITION_PREFIX = 'persist:kdbrowser:';
const NATIVE_BROWSER_SESSION_PARTITION_PREFIX = 'persist:kdbrowser-native:';
const NATIVE_BROWSER_TOOLBAR_HEIGHT = 56;
const ALLOWED_BROWSER_PERMISSIONS = new Set([
  'clipboard-read',
  'clipboard-sanitized-write',
  'fullscreen',
  'geolocation',
  'media',
  'mediaKeySystem',
  'notifications',
  'pointerLock'
]);
let mainWindow = null;
const configuredBrowserSessions = new Set();
const nativeBrowserWindows = new Map();

process.on('uncaughtException', (error) => {
  console.error('[electron:main] uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[electron:main] unhandledRejection', reason);
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeStringArray(value, maxLength = 64, maxItemLength = 260) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, maxItemLength))
    .slice(0, maxLength);
}

function sanitizeWindowStates(value) {
  if (!isPlainObject(value)) return {};
  const next = {};

  Object.entries(value).forEach(([key, rawState]) => {
    if (typeof key !== 'string' || !isPlainObject(rawState)) return;
    const state = {
      isOpen: Boolean(rawState.isOpen),
      isMinimized: Boolean(rawState.isMinimized),
      isMaximized: Boolean(rawState.isMaximized),
      zIndex: clampNumber(rawState.zIndex, 0, 10000, 0)
    };

    if (Number.isFinite(rawState.x)) state.x = rawState.x;
    if (Number.isFinite(rawState.y)) state.y = rawState.y;
    if (Number.isFinite(rawState.w)) state.w = rawState.w;
    if (Number.isFinite(rawState.h)) state.h = rawState.h;

    next[key] = state;
  });

  return next;
}

function sanitizeExplorerPreferences(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    path: sanitizeStringArray(source.path),
    view: source.view === 'list' ? 'list' : DEFAULT_EXPLORER_PREFERENCES.view,
    showDetailsPane: typeof source.showDetailsPane === 'boolean'
      ? source.showDetailsPane
      : DEFAULT_EXPLORER_PREFERENCES.showDetailsPane,
    sort: source.sort === 'name-desc' ? 'name-desc' : DEFAULT_EXPLORER_PREFERENCES.sort
  };
}

function sanitizeShellState(value) {
  const source = isPlainObject(value?.shell) ? value.shell : (isPlainObject(value) ? value : {});
  return {
    focusedWindow: typeof source.focusedWindow === 'string' ? source.focusedWindow : null,
    startMenu: {
      isOpen: Boolean(source.startMenu?.isOpen),
      search: typeof source.startMenu?.search === 'string' ? source.startMenu.search.slice(0, 120) : ''
    },
    windowStates: sanitizeWindowStates(source.windowStates || value?.windowLayout),
    explorerPreferences: sanitizeExplorerPreferences(source.explorerPreferences || value?.explorerPreferences),
    windowZCounter: clampNumber(source.windowZCounter ?? value?.windowZCounter, 100, 10000, DEFAULT_SHELL_SESSION.windowZCounter)
  };
}

function sanitizeSessionState(value) {
  const source = isPlainObject(value) ? value : {};
  const shell = sanitizeShellState(source);
  return {
    ...DEFAULT_SESSION_STATE,
    ...source,
    isBooted: Boolean(source.isBooted),
    lastBootedAt: typeof source.lastBootedAt === 'string' ? source.lastBootedAt : null,
    lastRuntimeMode: Object.values(OS_RUNTIME_MODES).includes(source.lastRuntimeMode)
      ? source.lastRuntimeMode
      : DEFAULT_SESSION_STATE.lastRuntimeMode,
    windowLayout: shell.windowStates,
    explorerPreferences: shell.explorerPreferences,
    windowZCounter: shell.windowZCounter,
    focusedWindow: shell.focusedWindow,
    shell
  };
}

function sanitizeDesktopLayoutState(value) {
  const source = isPlainObject(value) ? value : {};
  const slots = Array.isArray(source.slots)
    ? source.slots.slice(0, 256).map((item) => (typeof item === 'string' ? item : null))
    : [];
  const legacyOrder = sanitizeStringArray(source.legacyOrder, 256, 120);
  const positions = isPlainObject(source.positions)
    ? Object.fromEntries(
        Object.entries(source.positions)
          .filter(([key, pos]) => typeof key === 'string' && isPlainObject(pos))
          .map(([key, pos]) => [key, {
            column: clampNumber(pos.column, 0, 256, 0),
            row: clampNumber(pos.row, 0, 256, 0)
          }])
      )
    : null;

  return {
    ...DEFAULT_DESKTOP_LAYOUT,
    ...source,
    slots,
    legacyOrder,
    positions,
    layoutVersion: Number.isFinite(source.layoutVersion) ? clampNumber(source.layoutVersion, 0, 1000, 0) : source.layoutVersion,
    grid: isPlainObject(source.grid)
      ? {
          columns: clampNumber(source.grid.columns, 0, 256, 0),
          rows: clampNumber(source.grid.rows, 0, 256, 0)
        }
      : null,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null
  };
}

function sanitizePersonalizationState(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    ...DEFAULT_PERSONALIZATION,
    ...source,
    currentWallpaperId: typeof source.currentWallpaperId === 'string' && source.currentWallpaperId
      ? source.currentWallpaperId
      : getDefaultWallpaperId(),
    fit: VALID_WALLPAPER_FITS.has(source.fit) ? source.fit : DEFAULT_PERSONALIZATION.fit,
    history: Array.isArray(source.history)
      ? source.history
          .filter((entry) => isPlainObject(entry) && typeof entry.id === 'string' && entry.id)
          .slice(0, 20)
          .map((entry) => ({ id: entry.id, changedAt: typeof entry.changedAt === 'string' ? entry.changedAt : null }))
      : [],
    importedWallpaperIds: sanitizeStringArray(source.importedWallpaperIds, 100, 260),
    lastUpdatedAt: typeof source.lastUpdatedAt === 'string' ? source.lastUpdatedAt : null
  };
}

function assertOsPathInput(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Expected a non-empty workspace path string.');
  }
  return normalizeOsPath(value);
}

function assertFilePayload(data) {
  const validBinaryLike = data instanceof Uint8Array || Buffer.isBuffer(data);
  if (typeof data !== 'string' && !validBinaryLike) {
    throw new Error('Unsupported file payload type.');
  }
}

function assertOptionsObject(value) {
  if (value == null) return {};
  if (!isPlainObject(value)) throw new Error('Expected an options object.');
  return value;
}

function assertWallpaperPayload(payload) {
  const nextPayload = typeof payload === 'string' ? { dataUrl: payload } : payload;
  if (!isPlainObject(nextPayload) || typeof nextPayload.dataUrl !== 'string') {
    throw new Error('Unsupported wallpaper payload.');
  }
  if (!nextPayload.dataUrl.startsWith('data:image/')) {
    throw new Error('Wallpaper payload must be an image data URL.');
  }
  if (nextPayload.dataUrl.length > 12 * 1024 * 1024) {
    throw new Error('Wallpaper payload is too large.');
  }
  return nextPayload;
}

function toHostPath(osPath) {
  const normalized = normalizeOsPath(osPath);
  if (normalized === WORKSPACE_PATHS.root) return homeRoot;
  if (!normalized.startsWith(`${WORKSPACE_PATHS.root}\\`)) {
    throw new Error(`Unsupported workspace path: ${normalized}`);
  }
  const relativePath = normalized.slice(WORKSPACE_PATHS.root.length + 1).split('\\');
  return path.join(homeRoot, ...relativePath);
}

function toOsPath(hostPath) {
  const relativePath = path.relative(homeRoot, hostPath);
  if (!relativePath || relativePath === '.') return WORKSPACE_PATHS.root;
  return normalizeOsPath(joinOsPath(WORKSPACE_PATHS.root, relativePath.replaceAll(path.sep, '\\')));
}

function isImageExt(extension) {
  return ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension.toLowerCase());
}

function inferMimeType(extension) {
  switch (extension.toLowerCase()) {
    case '.json':
      return 'application/json';
    case '.url':
      return 'application/json';
    case '.lesson':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/plain';
  }
}

function inferFileKind(extension) {
  switch (extension.toLowerCase()) {
    case '.json':
      return 'json';
    case '.url':
      return 'url';
    case '.lesson':
      return 'lesson';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.webp':
    case '.svg':
      return 'image';
    default:
      return 'file';
  }
}

function assertOptionalUrl(value) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') throw new Error('Expected a URL string.');
  try {
    const normalized = new URL(value.trim()).toString();
    return normalized;
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }
}

function bufferToDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function readMetadata() {
  try {
    const raw = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeMetadata(nextMetadata) {
  await fs.mkdir(path.dirname(metadataPath), { recursive: true });
  await fs.writeFile(metadataPath, JSON.stringify(nextMetadata, null, 2), 'utf8');
}

async function updateMetadata(mutator) {
  const current = await readMetadata();
  const next = mutator({ ...current }) || current;
  await writeMetadata(next);
  return next;
}

function emitBrowserWindowOpenRequested(payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(BROWSER_WINDOW_OPEN_EVENT, payload);
}

function emitNativeBrowserState(payload = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(NATIVE_BROWSER_STATE_EVENT, payload);
  }
}

function sanitizeNativeBrowserWindowKey(value = '') {
  const safeValue = String(value || '').trim().replace(/[^a-zA-Z0-9:_-]+/g, '-').slice(0, 160);
  if (!safeValue) {
    throw new Error('Expected a non-empty native browser window key.');
  }
  return safeValue;
}

function getNativeBrowserPartition(profileId = DEFAULT_BROWSER_PROFILE_ID) {
  return `${NATIVE_BROWSER_SESSION_PARTITION_PREFIX}${sanitizeBrowserProfileId(profileId)}`;
}

function isManagedBrowserPartition(partition = '') {
  return partition.startsWith(BROWSER_SESSION_PARTITION_PREFIX) || partition.startsWith(NATIVE_BROWSER_SESSION_PARTITION_PREFIX);
}

function serializeNativeBrowserWindow(controller) {
  if (!controller) return null;
  return {
    windowKey: controller.windowKey,
    profileId: controller.profileId,
    homeUrl: controller.homeUrl,
    url: controller.url,
    title: controller.title,
    isLoading: controller.isLoading,
    canGoBack: controller.canGoBack,
    canGoForward: controller.canGoForward,
    error: controller.error || '',
    ownerAppId: controller.ownerAppId || '',
    isOpen: Boolean(controller.shellWindow && !controller.shellWindow.isDestroyed())
  };
}

function broadcastNativeBrowserWindowState(controller) {
  const payload = serializeNativeBrowserWindow(controller);
  if (!payload) return;

  if (controller.shellWindow && !controller.shellWindow.isDestroyed()) {
    controller.shellWindow.webContents.send(NATIVE_BROWSER_STATE_EVENT, payload);
  }

  emitNativeBrowserState(payload);
}

function normalizeNativeBrowserTargetUrl(value, fallbackUrl = KDBROWSER_HOME_URL) {
  if (typeof value === 'string' && value.trim()) {
    try {
      return new URL(value.trim()).toString();
    } catch {
      try {
        return new URL(`https://${value.trim()}`).toString();
      } catch {
        // Fall through to default below.
      }
    }
  }
  return fallbackUrl;
}

function updateNativeBrowserWindowState(controller, patch = {}) {
  Object.assign(controller, patch);
  broadcastNativeBrowserWindowState(controller);
}

function isBrowserPermissionAllowed(permission = '') {
  return ALLOWED_BROWSER_PERMISSIONS.has(String(permission || ''));
}

function configureBrowserSession(targetSession) {
  const partition = targetSession?.getPartition?.() || '';
  if (!isManagedBrowserPartition(partition)) return;
  if (configuredBrowserSessions.has(partition)) return;

  configuredBrowserSessions.add(partition);
  targetSession.setPermissionCheckHandler((_webContents, permission) => (
    isBrowserPermissionAllowed(permission)
  ));
  targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(isBrowserPermissionAllowed(permission));
  });
}

function attachWebviewGuards(win) {
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    const targetUrl = typeof params?.src === 'string' ? params.src : '';
    if (!/^https?:\/\//i.test(targetUrl)) {
      event.preventDefault();
      return;
    }

    delete params.preload;
    delete webPreferences.preload;
    delete webPreferences.preloadURL;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.webSecurity = true;
    webPreferences.sandbox = true;
    webPreferences.allowRunningInsecureContent = false;
    webPreferences.autoplayPolicy = 'no-user-gesture-required';
  });

  win.webContents.on('did-attach-webview', (_event, guestContents) => {
    configureBrowserSession(guestContents.session);

    let guestRequestedFullScreen = false;
    guestContents.on('enter-html-full-screen', () => {
      guestRequestedFullScreen = true;
      if (!win.isDestroyed()) {
        win.setFullScreen(true);
      }
    });
    guestContents.on('leave-html-full-screen', () => {
      if (guestRequestedFullScreen && !win.isDestroyed()) {
        win.setFullScreen(false);
      }
      guestRequestedFullScreen = false;
    });

    guestContents.setWindowOpenHandler((details) => {
      let targetUrl = '';
      try {
        targetUrl = assertOptionalUrl(details.url);
      } catch {
        targetUrl = '';
      }

      if (!targetUrl) {
        return { action: 'deny' };
      }

      const partition = guestContents.session?.getPartition?.() || '';
      const profileId = getBrowserProfileIdFromPartition(partition);
      if (profileId.startsWith('app-')) {
        guestContents.loadURL(targetUrl).catch(() => {});
        return { action: 'deny' };
      }

      emitBrowserWindowOpenRequested({
        url: targetUrl,
        title: typeof details.frameName === 'string' ? details.frameName : '',
        disposition: details.disposition || 'new-window',
        profileId,
        partition
      });

      return { action: 'deny' };
    });
  });
}

function layoutNativeBrowserView(controller) {
  if (!controller?.shellWindow || controller.shellWindow.isDestroyed() || !controller.browserView) return;
  const [contentWidth, contentHeight] = controller.shellWindow.getContentSize();
  const viewHeight = Math.max(200, contentHeight - NATIVE_BROWSER_TOOLBAR_HEIGHT);
  controller.browserView.setBounds({
    x: 0,
    y: NATIVE_BROWSER_TOOLBAR_HEIGHT,
    width: Math.max(320, contentWidth),
    height: viewHeight
  });
  controller.browserView.setAutoResize({
    width: true,
    height: true
  });
}

function attachNativeBrowserGuestListeners(controller) {
  const browserContents = controller?.browserView?.webContents;
  if (!browserContents) return;

  configureBrowserSession(browserContents.session);
  browserContents.setUserAgent(DEFAULT_BROWSER_USER_AGENT);

  browserContents.on('did-start-loading', () => {
    updateNativeBrowserWindowState(controller, {
      isLoading: true,
      error: ''
    });
  });

  browserContents.on('did-stop-loading', () => {
    updateNativeBrowserWindowState(controller, {
      isLoading: false,
      url: browserContents.getURL?.() || controller.url,
      title: browserContents.getTitle?.() || controller.title,
      canGoBack: Boolean(browserContents.navigationHistory?.canGoBack?.() ?? browserContents.canGoBack?.()),
      canGoForward: Boolean(browserContents.navigationHistory?.canGoForward?.() ?? browserContents.canGoForward?.()),
      error: ''
    });
    if (controller.shellWindow && !controller.shellWindow.isDestroyed()) {
      controller.shellWindow.setTitle(controller.title || 'KDBROWSER');
    }
  });

  browserContents.on('page-title-updated', (_event, title) => {
    updateNativeBrowserWindowState(controller, {
      title: title || controller.title
    });
    if (controller.shellWindow && !controller.shellWindow.isDestroyed()) {
      controller.shellWindow.setTitle(title || 'KDBROWSER');
    }
  });

  browserContents.on('did-navigate', (_event, url) => {
    updateNativeBrowserWindowState(controller, {
      url,
      canGoBack: Boolean(browserContents.navigationHistory?.canGoBack?.() ?? browserContents.canGoBack?.()),
      canGoForward: Boolean(browserContents.navigationHistory?.canGoForward?.() ?? browserContents.canGoForward?.())
    });
  });

  browserContents.on('did-navigate-in-page', (_event, url) => {
    updateNativeBrowserWindowState(controller, {
      url,
      canGoBack: Boolean(browserContents.navigationHistory?.canGoBack?.() ?? browserContents.canGoBack?.()),
      canGoForward: Boolean(browserContents.navigationHistory?.canGoForward?.() ?? browserContents.canGoForward?.())
    });
  });

  browserContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame === false || errorCode === -3) return;
    updateNativeBrowserWindowState(controller, {
      isLoading: false,
      url: validatedURL || controller.url,
      error: errorDescription || 'This page could not be loaded in the native KDOS browser window.'
    });
  });

  browserContents.on('render-process-gone', (_event, details) => {
    updateNativeBrowserWindowState(controller, {
      isLoading: false,
      error: details?.reason ? `Browser renderer exited: ${details.reason}` : 'Browser renderer exited unexpectedly.'
    });
  });

  browserContents.setWindowOpenHandler((details) => {
    let targetUrl = '';
    try {
      targetUrl = normalizeNativeBrowserTargetUrl(details.url, controller.homeUrl || KDBROWSER_HOME_URL);
    } catch {
      targetUrl = '';
    }

    if (!targetUrl) {
      return { action: 'deny' };
    }

    openNativeAuthPopup({
      title: typeof details.frameName === 'string' && details.frameName.trim() ? details.frameName.trim() : (controller.title || 'Browser'),
      url: targetUrl,
      profileId: controller.profileId,
      width: 1180,
      height: 820
    }).catch(() => {});

    return { action: 'deny' };
  });
}

async function openNativeAuthPopup(payload = {}) {
  const targetUrl = normalizeNativeBrowserTargetUrl(payload.url, KDBROWSER_HOME_URL);
  const profileId = sanitizeBrowserProfileId(payload.profileId || DEFAULT_BROWSER_PROFILE_ID);
  const popupWindow = new BrowserWindow({
    width: clampNumber(payload.width, 720, 1600, 1180),
    height: clampNumber(payload.height, 560, 1400, 820),
    minWidth: 720,
    minHeight: 560,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'Browser popup',
    webPreferences: {
      partition: getNativeBrowserPartition(profileId),
      preload: nativeBrowserGuestPreloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  configureBrowserSession(popupWindow.webContents.session);
  popupWindow.webContents.setUserAgent(DEFAULT_BROWSER_USER_AGENT);
  popupWindow.webContents.setWindowOpenHandler((details) => {
    openNativeAuthPopup({
      title: typeof details.frameName === 'string' && details.frameName.trim() ? details.frameName.trim() : (payload.title || 'Browser popup'),
      url: details.url,
      profileId,
      width: 1100,
      height: 800
    }).catch(() => {});
    return { action: 'deny' };
  });

  await popupWindow.loadURL(targetUrl);
  popupWindow.show();
  popupWindow.focus();
  return { ok: true, url: targetUrl, profileId };
}

async function openNativeBrowserWindow(payload = {}) {
  const windowKey = sanitizeNativeBrowserWindowKey(payload.windowKey || `browser-${Date.now().toString(36)}`);
  const existing = nativeBrowserWindows.get(windowKey);
  const targetUrl = normalizeNativeBrowserTargetUrl(payload.url, payload.homeUrl || KDBROWSER_HOME_URL);
  const profileId = sanitizeBrowserProfileId(payload.profileId || DEFAULT_BROWSER_PROFILE_ID);

  if (existing && existing.shellWindow && !existing.shellWindow.isDestroyed()) {
    if (targetUrl && targetUrl !== existing.url) {
      existing.browserView.webContents.loadURL(targetUrl).catch(() => {});
    }
    if (payload.focus !== false) {
      existing.shellWindow.show();
      existing.shellWindow.focus();
    }
    broadcastNativeBrowserWindowState(existing);
    return serializeNativeBrowserWindow(existing);
  }

  const shellWindow = new BrowserWindow({
    width: clampNumber(payload.width, 960, 2000, 1380),
    height: clampNumber(payload.height, 680, 1600, 900),
    minWidth: 960,
    minHeight: 680,
    autoHideMenuBar: true,
    backgroundColor: '#e2e8f0',
    title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'KDBROWSER',
    webPreferences: {
      preload: nativeBrowserShellPreloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const browserView = new BrowserView({
    webPreferences: {
      partition: getNativeBrowserPartition(profileId),
      preload: nativeBrowserGuestPreloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  shellWindow.setBrowserView(browserView);

  const controller = {
    windowKey,
    profileId,
    ownerAppId: typeof payload.ownerAppId === 'string' ? payload.ownerAppId : '',
    homeUrl: normalizeNativeBrowserTargetUrl(payload.homeUrl, KDBROWSER_HOME_URL),
    url: targetUrl,
    title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'KDBROWSER',
    isLoading: true,
    canGoBack: false,
    canGoForward: false,
    error: '',
    shellWindow,
    browserView
  };

  nativeBrowserWindows.set(windowKey, controller);

  attachNativeBrowserGuestListeners(controller);
  shellWindow.on('resize', () => layoutNativeBrowserView(controller));
  shellWindow.on('enter-full-screen', () => layoutNativeBrowserView(controller));
  shellWindow.on('leave-full-screen', () => layoutNativeBrowserView(controller));
  shellWindow.on('closed', () => {
    nativeBrowserWindows.delete(windowKey);
    emitNativeBrowserState({
      windowKey,
      isOpen: false,
      profileId,
      ownerAppId: controller.ownerAppId || ''
    });
  });
  shellWindow.webContents.on('did-finish-load', () => {
    broadcastNativeBrowserWindowState(controller);
  });

  layoutNativeBrowserView(controller);
  await shellWindow.loadFile(nativeBrowserShellPath, {
    query: {
      windowKey
    }
  });

  try {
    await browserView.webContents.loadURL(targetUrl);
  } catch (error) {
    updateNativeBrowserWindowState(controller, {
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to open the requested page.'
    });
  }

  if (payload.focus !== false) {
    shellWindow.show();
    shellWindow.focus();
  }
  broadcastNativeBrowserWindowState(controller);
  return serializeNativeBrowserWindow(controller);
}

function getNativeBrowserWindowOrThrow(windowKey) {
  const safeWindowKey = sanitizeNativeBrowserWindowKey(windowKey);
  const controller = nativeBrowserWindows.get(safeWindowKey);
  if (!controller || !controller.shellWindow || controller.shellWindow.isDestroyed()) {
    throw new Error(`Native browser window not found: ${safeWindowKey}`);
  }
  return controller;
}

async function navigateNativeBrowserWindow(windowKey, url) {
  const controller = getNativeBrowserWindowOrThrow(windowKey);
  const targetUrl = normalizeNativeBrowserTargetUrl(url, controller.homeUrl || KDBROWSER_HOME_URL);
  updateNativeBrowserWindowState(controller, {
    isLoading: true,
    error: '',
    url: targetUrl
  });
  await controller.browserView.webContents.loadURL(targetUrl);
  return serializeNativeBrowserWindow(controller);
}

async function runNativeBrowserWindowAction(windowKey, action) {
  const controller = getNativeBrowserWindowOrThrow(windowKey);
  const browserContents = controller.browserView.webContents;

  if (action === 'back' && (browserContents.navigationHistory?.canGoBack?.() ?? browserContents.canGoBack?.())) {
    browserContents.goBack();
  } else if (action === 'forward' && (browserContents.navigationHistory?.canGoForward?.() ?? browserContents.canGoForward?.())) {
    browserContents.goForward();
  } else if (action === 'reload') {
    browserContents.reload();
  } else if (action === 'home') {
    await browserContents.loadURL(controller.homeUrl || KDBROWSER_HOME_URL);
  } else if (action === 'focus') {
    controller.shellWindow.show();
    controller.shellWindow.focus();
  } else {
    throw new Error(`Unsupported native browser action: ${action}`);
  }

  updateNativeBrowserWindowState(controller, {
    isLoading: action !== 'focus',
    error: ''
  });
  return serializeNativeBrowserWindow(controller);
}

async function closeNativeBrowserWindow(windowKey) {
  const controller = getNativeBrowserWindowOrThrow(windowKey);
  nativeBrowserWindows.delete(controller.windowKey);
  if (!controller.shellWindow.isDestroyed()) {
    controller.shellWindow.close();
  }
  return {
    ok: true,
    windowKey: controller.windowKey
  };
}

function buildEntryRecord(osPath, stats, metadata = {}) {
  const normalized = normalizeOsPath(osPath);
  const extension = stats.isDirectory() ? '' : extnameFromPath(normalized);
  return {
    path: normalized,
    name: basenameFromPath(normalized),
    parentPath: dirnameFromPath(normalized),
    type: stats.isDirectory() ? 'directory' : 'file',
    fileKind: stats.isDirectory() ? 'folder' : (metadata.fileKind || inferFileKind(extension)),
    ext: extension,
    content: null,
    mimeType: stats.isDirectory() ? '' : (metadata.mimeType || inferMimeType(extension)),
    readonly: Boolean(metadata.readonly),
    source: metadata.source || 'workspace',
    createdAt: stats.birthtime?.toISOString?.() || new Date().toISOString(),
    updatedAt: stats.mtime?.toISOString?.() || new Date().toISOString(),
    meta: metadata.meta || {}
  };
}

async function ensureJsonFile(osPath, value) {
  const hostPath = toHostPath(osPath);
  try {
    await fs.access(hostPath);
  } catch {
    await fs.mkdir(path.dirname(hostPath), { recursive: true });
    await fs.writeFile(hostPath, JSON.stringify(value, null, 2), 'utf8');
  }
}

async function readJsonFile(osPath, fallbackValue) {
  const hostPath = toHostPath(osPath);
  try {
    const raw = await fs.readFile(hostPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallbackValue);
  }
}

async function writeJsonFile(osPath, value) {
  const hostPath = toHostPath(osPath);
  await fs.mkdir(path.dirname(hostPath), { recursive: true });
  await fs.writeFile(hostPath, JSON.stringify(value, null, 2), 'utf8');
}

async function ensureWorkspaceScaffold() {
  const directories = [
    WORKSPACE_PATHS.root,
    WORKSPACE_PATHS.system,
    WORKSPACE_PATHS.users,
    WORKSPACE_PATHS.user,
    WORKSPACE_PATHS.desktop,
    WORKSPACE_PATHS.documents,
    WORKSPACE_PATHS.wallpapers,
    WORKSPACE_PATHS.builtInWallpapers,
    WORKSPACE_PATHS.importedWallpapers,
    WORKSPACE_PATHS.settings,
    WORKSPACE_PATHS.trash,
    WORKSPACE_PATHS.community,
    WORKSPACE_PATHS.mounts,
    WORKSPACE_PATHS.lessonsMount,
    WORKSPACE_PATHS.promptAssetsMount
  ];

  await Promise.all(directories.map((osPath) => fs.mkdir(toHostPath(osPath), { recursive: true })));
  await ensureJsonFile(WORKSPACE_PATHS.profile, DEFAULT_PROFILE);
  await ensureJsonFile(WORKSPACE_PATHS.installedApps, DEFAULT_INSTALLED_APPS_STATE);
  await ensureJsonFile(WORKSPACE_PATHS.browserState, DEFAULT_BROWSER_STATE);
  await ensureJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT);
  await ensureJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE);
  await ensureJsonFile(WORKSPACE_PATHS.personalization, {
    ...DEFAULT_PERSONALIZATION,
    currentWallpaperId: getDefaultWallpaperId()
  });
  await ensureJsonFile(WORKSPACE_PATHS.communityResources, []);
  await ensureJsonFile(joinOsPath(WORKSPACE_PATHS.system, 'mounts.json'), {
    mounts: [
      { id: 'user-desktop', path: WORKSPACE_PATHS.desktop, source: 'workspace', writable: true },
      { id: 'user-documents', path: WORKSPACE_PATHS.documents, source: 'workspace', writable: true },
      { id: 'user-wallpapers', path: WORKSPACE_PATHS.wallpapers, source: 'workspace', writable: true },
      { id: 'user-community', path: WORKSPACE_PATHS.community, source: 'workspace', writable: true },
      { id: 'user-trash', path: WORKSPACE_PATHS.trash, source: 'workspace', writable: true },
      { id: 'kdacademy-lessons', path: WORKSPACE_PATHS.lessonsMount, source: 'virtual', writable: false },
      { id: 'prompt-assets', path: WORKSPACE_PATHS.promptAssetsMount, source: 'virtual', writable: false }
    ]
  });
}

async function readFileContent(osPath) {
  const hostPath = toHostPath(osPath);
  const extension = extnameFromPath(osPath);
  if (isImageExt(extension)) {
    const buffer = await fs.readFile(hostPath);
    return bufferToDataUrl(buffer, inferMimeType(extension));
  }
  return fs.readFile(hostPath, 'utf8');
}

async function writeFileContent(osPath, data, options = {}) {
  const hostPath = toHostPath(osPath);
  await fs.mkdir(path.dirname(hostPath), { recursive: true });

  if (typeof data === 'string' && data.startsWith('data:')) {
    const base64 = data.split(',')[1] || '';
    await fs.writeFile(hostPath, Buffer.from(base64, 'base64'));
  } else {
    await fs.writeFile(hostPath, typeof data === 'string' ? data : Buffer.from(data));
  }

  await updateMetadata((metadata) => {
    metadata[normalizeOsPath(osPath)] = {
      ...(metadata[normalizeOsPath(osPath)] || {}),
      mimeType: options.mimeType || inferMimeType(extnameFromPath(osPath)),
      fileKind: options.fileKind || inferFileKind(extnameFromPath(osPath)),
      source: options.source || 'workspace',
      readonly: false,
      meta: { ...((metadata[normalizeOsPath(osPath)] || {}).meta || {}), ...(options.meta || {}) }
    };
    return metadata;
  });
}

async function listEntries(osPath) {
  const hostPath = toHostPath(osPath);
  const metadata = await readMetadata();
  const dirEntries = await fs.readdir(hostPath, { withFileTypes: true });
  const entries = [];

  for (const dirEntry of dirEntries) {
    const entryHostPath = path.join(hostPath, dirEntry.name);
    const entryOsPath = toOsPath(entryHostPath);
    const stats = await fs.stat(entryHostPath);
    entries.push(buildEntryRecord(entryOsPath, stats, metadata[entryOsPath] || {}));
  }

  return entries.sort((left, right) => {
    if (left.type !== right.type) return left.type === 'directory' ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

async function renameMetadataTree(fromPath, toPath, transform) {
  await updateMetadata((metadata) => {
    const nextMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (key === fromPath || key.startsWith(`${fromPath}\\`)) {
        const suffix = key.slice(fromPath.length);
        const nextKey = `${toPath}${suffix}`;
        nextMetadata[nextKey] = transform ? transform(value, key, nextKey, suffix) : value;
      } else {
        nextMetadata[key] = value;
      }
    }
    return nextMetadata;
  });
}

async function moveEntryToTrash(osPath) {
  const normalized = normalizeOsPath(osPath);
  const targetPath = joinOsPath(WORKSPACE_PATHS.trash, `${Date.now()}-${sanitizeFileName(basenameFromPath(normalized))}`);
  await fs.rename(toHostPath(normalized), toHostPath(targetPath));
  await renameMetadataTree(normalized, targetPath, (value, key, nextKey, suffix) => ({
    ...value,
    meta: {
      ...(value.meta || {}),
      originalPath: key === normalized ? normalized : `${normalized}${suffix}`,
      trashedAt: new Date().toISOString()
    }
  }));
  return targetPath;
}

async function restoreEntryFromTrash(trashPath) {
  const normalized = normalizeOsPath(trashPath);
  const metadata = await readMetadata();
  const originalPath = metadata[normalized]?.meta?.originalPath;
  if (!originalPath) throw new Error(`Trash entry is missing originalPath: ${normalized}`);

  await fs.mkdir(path.dirname(toHostPath(originalPath)), { recursive: true });
  await fs.rename(toHostPath(normalized), toHostPath(originalPath));
  await renameMetadataTree(normalized, originalPath, (value) => ({
    ...value,
    meta: Object.fromEntries(Object.entries(value.meta || {}).filter(([key]) => key !== 'originalPath' && key !== 'trashedAt'))
  }));
  return originalPath;
}

async function renameEntry(osPath, nextName) {
  const normalized = normalizeOsPath(osPath);
  const targetPath = joinOsPath(dirnameFromPath(normalized), sanitizeFileName(nextName, basenameFromPath(normalized)));
  await fs.rename(toHostPath(normalized), toHostPath(targetPath));
  await renameMetadataTree(normalized, targetPath);
  return targetPath;
}

async function searchEntries(query, roots = [WORKSPACE_PATHS.root]) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return [];
  const metadata = await readMetadata();
  const matches = [];

  async function walk(currentPath) {
    const hostPath = toHostPath(currentPath);
    const dirEntries = await fs.readdir(hostPath, { withFileTypes: true });
    for (const dirEntry of dirEntries) {
      const entryHostPath = path.join(hostPath, dirEntry.name);
      const entryOsPath = toOsPath(entryHostPath);
      const stats = await fs.stat(entryHostPath);
      if (dirEntry.name.toLowerCase().includes(needle)) {
        matches.push(buildEntryRecord(entryOsPath, stats, metadata[entryOsPath] || {}));
      }
      if (dirEntry.isDirectory()) {
        await walk(entryOsPath);
      } else if (!isImageExt(extnameFromPath(entryOsPath))) {
        try {
          const content = await fs.readFile(entryHostPath, 'utf8');
          if (content.toLowerCase().includes(needle)) {
            matches.push(buildEntryRecord(entryOsPath, stats, metadata[entryOsPath] || {}));
          }
        } catch {
          // Ignore unreadable files.
        }
      }
    }
  }

  for (const rootPath of roots) {
    if (normalizeOsPath(rootPath) === WORKSPACE_PATHS.lessonsMount) continue;
    await walk(normalizeOsPath(rootPath));
  }

  return matches;
}

const fsApi = {
  async mountWorkspace() {
    await ensureWorkspaceScaffold();
    return {
      root: WORKSPACE_PATHS.root,
      userRoot: WORKSPACE_PATHS.user,
      runtimeMode: OS_RUNTIME_MODES.DESKTOP_LOCAL
    };
  },
  async list(osPath) {
    await ensureWorkspaceScaffold();
    return listEntries(osPath);
  },
  async read(osPath) {
    await ensureWorkspaceScaffold();
    return readFileContent(osPath);
  },
  async write(osPath, data, options = {}) {
    await ensureWorkspaceScaffold();
    await writeFileContent(osPath, data, options);
  },
  async mkdir(osPath) {
    await ensureWorkspaceScaffold();
    await fs.mkdir(toHostPath(osPath), { recursive: true });
  },
  async rename(osPath, nextName) {
    await ensureWorkspaceScaffold();
    return renameEntry(osPath, nextName);
  },
  async moveToTrash(osPath) {
    await ensureWorkspaceScaffold();
    return moveEntryToTrash(osPath);
  },
  async restoreFromTrash(osPath) {
    await ensureWorkspaceScaffold();
    return restoreEntryFromTrash(osPath);
  },
  async search(query, roots) {
    await ensureWorkspaceScaffold();
    return searchEntries(query, roots);
  }
};

const settingsApi = {
  async migrateLegacy() {
    await ensureWorkspaceScaffold();
    return {
      migrated: false,
      version: MIGRATION_VERSION,
      items: []
    };
  },
  loadProfile: () => readJsonFile(WORKSPACE_PATHS.profile, DEFAULT_PROFILE),
  saveProfile: (profile) => writeJsonFile(WORKSPACE_PATHS.profile, { ...DEFAULT_PROFILE, ...(profile || {}), updated_at: new Date().toISOString() }),
  loadDesktopLayout: async () => sanitizeDesktopLayoutState(await readJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT)),
  saveDesktopLayout: (layout) => writeJsonFile(WORKSPACE_PATHS.desktopLayout, sanitizeDesktopLayoutState({ ...layout, updatedAt: new Date().toISOString() })),
  loadInstalledApps: async () => {
    const storedState = sanitizeInstalledAppsState(await readJsonFile(WORKSPACE_PATHS.installedApps, DEFAULT_INSTALLED_APPS_STATE));
    const seededState = applyCatalogAutoInstallSeed(storedState);
    if (hasInstalledAppsStateChanged(storedState, seededState)) {
      await writeJsonFile(WORKSPACE_PATHS.installedApps, seededState);
    }
    return seededState;
  },
  saveInstalledApps: (state) => writeJsonFile(WORKSPACE_PATHS.installedApps, sanitizeInstalledAppsState({ ...(state || {}), updatedAt: new Date().toISOString() })),
  loadSession: async () => sanitizeSessionState(await readJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE)),
  saveSession: (session) => writeJsonFile(WORKSPACE_PATHS.session, sanitizeSessionState(session)),
  loadPersonalization: async () => sanitizePersonalizationState(await readJsonFile(WORKSPACE_PATHS.personalization, { ...DEFAULT_PERSONALIZATION, currentWallpaperId: getDefaultWallpaperId() })),
  savePersonalization: (personalization) => writeJsonFile(WORKSPACE_PATHS.personalization, sanitizePersonalizationState({ ...personalization, lastUpdatedAt: new Date().toISOString() })),
  loadCommunityResources: () => readJsonFile(WORKSPACE_PATHS.communityResources, []),
  saveCommunityResources: (resources) => writeJsonFile(WORKSPACE_PATHS.communityResources, Array.isArray(resources) ? resources : [])
};

const browserApi = {
  async getCapabilities() {
    return {
      ...DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
      embeddedBrowser: false,
      nativeBrowserWindow: true,
      remoteBrowser: false,
      popupTabs: true,
      persistentProfile: true,
      profileReset: true,
      openExternal: true
    };
  },

  async loadState(profileId = DEFAULT_BROWSER_PROFILE_ID) {
    await ensureWorkspaceScaffold();
    return sanitizeBrowserState(
      await readJsonFile(WORKSPACE_PATHS.browserState, DEFAULT_BROWSER_STATE),
      { profileId }
    );
  },

  async saveState(state) {
    const nextState = sanitizeBrowserState({
      ...(state || {}),
      updatedAt: new Date().toISOString()
    });
    await writeJsonFile(WORKSPACE_PATHS.browserState, nextState);
    return nextState;
  },

  async openExternal(url) {
    const nextUrl = assertOptionalUrl(url);
    if (!nextUrl) {
      throw new Error('Provide a URL to open externally.');
    }

    await shell.openExternal(nextUrl);
    return { ok: true, url: nextUrl };
  },

  async resetProfile(profileId = DEFAULT_BROWSER_PROFILE_ID) {
    const safeProfileId = sanitizeBrowserProfileId(profileId);
    const targetSession = session.fromPartition(getBrowserPartition(safeProfileId));
    await targetSession.clearStorageData();
    await targetSession.clearCache();

    const nextState = createDefaultBrowserState({
      profileId: safeProfileId,
      updatedAt: new Date().toISOString()
    });
    await writeJsonFile(WORKSPACE_PATHS.browserState, nextState);

    return {
      ok: true,
      profileId: safeProfileId,
      partition: getBrowserPartition(safeProfileId)
    };
  }
};

const wallpaperApi = {
  async list() {
    await ensureWorkspaceScaffold();
    const importedDir = toHostPath(WORKSPACE_PATHS.importedWallpapers);
    const metadata = await readMetadata();
    const dirEntries = await fs.readdir(importedDir, { withFileTypes: true });
    const importedWallpapers = [];

    for (const dirEntry of dirEntries) {
      if (!dirEntry.isFile()) continue;
      const entryHostPath = path.join(importedDir, dirEntry.name);
      const osPath = toOsPath(entryHostPath);
      importedWallpapers.push({
        id: metadata[osPath]?.meta?.wallpaperId || `imported:${osPath}`,
        name: dirEntry.name,
        type: 'image',
        src: await readFileContent(osPath),
        source: 'imported',
        path: osPath
      });
    }

    return [...BUILT_IN_WALLPAPERS, ...importedWallpapers];
  },
  async import(payload) {
    await ensureWorkspaceScaffold();
    const safePayload = assertWallpaperPayload(payload);
    const dataUrl = safePayload.dataUrl;
    const extension = dataUrlToExtension(dataUrl);
    const fileName = sanitizeFileName(safePayload.name || `wallpaper-${Date.now()}.${extension}`);
    const osPath = joinOsPath(WORKSPACE_PATHS.importedWallpapers, fileName);
    const wallpaperId = `imported:${osPath}`;
    await writeFileContent(osPath, dataUrl, {
      mimeType: safePayload.type || inferMimeType(`.${extension}`),
      fileKind: 'image',
      meta: {
        wallpaperId,
        logicalType: 'wallpaper'
      }
    });

    return {
      id: wallpaperId,
      name: fileName,
      type: 'image',
      src: dataUrl,
      source: 'imported',
      path: osPath
    };
  },
  async setCurrent(id, fit = 'fill') {
    const personalization = await settingsApi.loadPersonalization();
    const history = [
      { id, changedAt: new Date().toISOString() },
      ...(personalization.history || []).filter((entry) => entry.id !== id)
    ].slice(0, 10);
    await settingsApi.savePersonalization({
      ...personalization,
      currentWallpaperId: id,
      fit,
      history
    });
  },
  async getCurrent() {
    const personalization = await settingsApi.loadPersonalization();
    const wallpapers = await this.list();
    const wallpaper = wallpapers.find((entry) => entry.id === personalization.currentWallpaperId)
      || wallpapers.find((entry) => entry.id === getDefaultWallpaperId())
      || wallpapers[0]
      || null;

    return {
      wallpaper,
      fit: personalization.fit || 'fill',
      history: personalization.history || []
    };
  }
};

const containerApi = {
  async probe() {
    return {
      supported: false,
      host: os.platform(),
      reason: 'Container runtime is not enabled in the desktop-local scaffold.'
    };
  },
  async createWorkspace() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  },
  async start() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  },
  async stop() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  },
  async exec() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  }
};

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });
  mainWindow = win;
  attachWebviewGuards(win);
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[electron:renderer:${level}] ${message} (${sourceId || 'unknown'}:${line || 0})`);
  });
  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      if (!win || win.isDestroyed()) return;
      win.webContents.executeJavaScript(`(() => {
        const root = document.getElementById('root');
        return {
          title: document.title,
          readyState: document.readyState,
          bodyChildren: document.body ? document.body.children.length : 0,
          rootExists: Boolean(root),
          rootChildren: root ? root.children.length : 0,
          rootHtmlLength: root ? root.innerHTML.length : 0,
          bodyTextPreview: document.body ? String(document.body.innerText || '').slice(0, 240) : ''
        };
      })()`).then((snapshot) => {
        console.log('[electron:renderer] dom-snapshot', snapshot);
      }).catch((error) => {
        console.error('[electron:renderer] dom-snapshot failed', error);
      });
    }, 1800);
  });
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('[electron:renderer] did-fail-load', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame
    });
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[electron:renderer] render-process-gone', details);
  });
  win.webContents.on('unresponsive', () => {
    console.error('[electron:renderer] main window became unresponsive');
  });
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  if (devServerUrl) {
    await win.loadURL(devServerUrl);
  } else {
    await win.loadFile(distIndexPath);
  }
}

ipcMain.handle('os.runtime.initialize', async () => {
  await ensureWorkspaceScaffold();
  return {
    mode: OS_RUNTIME_MODES.DESKTOP_LOCAL,
    migration: await settingsApi.migrateLegacy()
  };
});

ipcMain.handle('os.fs.mountWorkspace', () => fsApi.mountWorkspace());
ipcMain.handle('os.fs.list', (_event, osPath) => fsApi.list(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.read', (_event, osPath) => fsApi.read(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.write', (_event, osPath, data, options) => {
  assertFilePayload(data);
  return fsApi.write(assertOsPathInput(osPath), data, assertOptionsObject(options));
});
ipcMain.handle('os.fs.mkdir', (_event, osPath) => fsApi.mkdir(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.rename', (_event, osPath, nextName) => {
  if (typeof nextName !== 'string' || !nextName.trim()) throw new Error('Expected a non-empty target name.');
  return fsApi.rename(assertOsPathInput(osPath), nextName);
});
ipcMain.handle('os.fs.moveToTrash', (_event, osPath) => fsApi.moveToTrash(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.restoreFromTrash', (_event, osPath) => fsApi.restoreFromTrash(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.search', (_event, query, roots) => {
  const safeQuery = typeof query === 'string' ? query : '';
  const safeRoots = Array.isArray(roots) ? roots.map(assertOsPathInput) : undefined;
  return fsApi.search(safeQuery, safeRoots);
});

ipcMain.handle('os.wallpaper.list', () => wallpaperApi.list());
ipcMain.handle('os.wallpaper.import', (_event, payload) => wallpaperApi.import(assertWallpaperPayload(payload)));
ipcMain.handle('os.wallpaper.setCurrent', (_event, id, fit) => {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Expected a wallpaper id.');
  return wallpaperApi.setCurrent(id, fit);
});
ipcMain.handle('os.wallpaper.getCurrent', () => wallpaperApi.getCurrent());
ipcMain.handle('os.power.getStatus', () => powerApi.getStatus());
ipcMain.handle('os.device.getStatus', () => deviceApi.getStatus());
ipcMain.handle('os.device.setWifiEnabled', (_event, enabled) => deviceApi.setWifiEnabled(Boolean(enabled)));
ipcMain.handle('os.device.setVolume', (_event, percent) => deviceApi.setVolume(percent));
ipcMain.handle('os.device.setBrightness', (_event, percent) => deviceApi.setBrightness(percent));

ipcMain.handle('os.settings.migrateLegacy', () => settingsApi.migrateLegacy());
ipcMain.handle('os.settings.loadProfile', () => settingsApi.loadProfile());
ipcMain.handle('os.settings.saveProfile', (_event, profile) => {
  if (!isPlainObject(profile)) throw new Error('Expected a profile object.');
  return settingsApi.saveProfile(profile);
});
ipcMain.handle('os.settings.loadDesktopLayout', () => settingsApi.loadDesktopLayout());
ipcMain.handle('os.settings.saveDesktopLayout', (_event, layout) => {
  if (!isPlainObject(layout)) throw new Error('Expected a desktop layout object.');
  return settingsApi.saveDesktopLayout(layout);
});
ipcMain.handle('os.settings.loadInstalledApps', () => settingsApi.loadInstalledApps());
ipcMain.handle('os.settings.saveInstalledApps', (_event, state) => {
  if (!isPlainObject(state)) throw new Error('Expected an installed apps state object.');
  return settingsApi.saveInstalledApps(state);
});
ipcMain.handle('os.settings.loadSession', () => settingsApi.loadSession());
ipcMain.handle('os.settings.saveSession', (_event, session) => {
  if (!isPlainObject(session)) throw new Error('Expected a session object.');
  return settingsApi.saveSession(session);
});
ipcMain.handle('os.settings.loadPersonalization', () => settingsApi.loadPersonalization());
ipcMain.handle('os.settings.savePersonalization', (_event, personalization) => {
  if (!isPlainObject(personalization)) throw new Error('Expected a personalization object.');
  return settingsApi.savePersonalization(personalization);
});
ipcMain.handle('os.settings.loadCommunityResources', () => settingsApi.loadCommunityResources());
ipcMain.handle('os.settings.saveCommunityResources', (_event, resources) => settingsApi.saveCommunityResources(resources));

ipcMain.handle('os.browser.getCapabilities', () => browserApi.getCapabilities());
ipcMain.handle('os.browser.loadState', (_event, profileId) => browserApi.loadState(typeof profileId === 'string' ? profileId : DEFAULT_BROWSER_PROFILE_ID));
ipcMain.handle('os.browser.saveState', (_event, state) => {
  if (!isPlainObject(state)) throw new Error('Expected a browser state object.');
  return browserApi.saveState(state);
});
ipcMain.handle('os.browser.openExternal', (_event, url) => browserApi.openExternal(url));
ipcMain.handle('os.browser.resetProfile', (_event, profileId) => browserApi.resetProfile(typeof profileId === 'string' ? profileId : DEFAULT_BROWSER_PROFILE_ID));
ipcMain.handle('os.browser.native.openWindow', (_event, payload) => openNativeBrowserWindow(isPlainObject(payload) ? payload : {}));
ipcMain.handle('os.browser.native.getWindowState', (_event, windowKey) => serializeNativeBrowserWindow(getNativeBrowserWindowOrThrow(windowKey)));
ipcMain.handle('os.browser.native.navigate', (_event, windowKey, url) => navigateNativeBrowserWindow(windowKey, url));
ipcMain.handle('os.browser.native.action', (_event, windowKey, action) => runNativeBrowserWindowAction(windowKey, typeof action === 'string' ? action : ''));
ipcMain.handle('os.browser.native.closeWindow', (_event, windowKey) => closeNativeBrowserWindow(windowKey));

ipcMain.handle('os.container.probe', () => containerApi.probe());
ipcMain.handle('os.container.createWorkspace', (_event, id) => containerApi.createWorkspace(id));
ipcMain.handle('os.container.start', (_event, id) => containerApi.start(id));
ipcMain.handle('os.container.stop', (_event, id) => containerApi.stop(id));
ipcMain.handle('os.container.exec', (_event, id, command) => containerApi.exec(id, command));
ipcMain.handle('os.reference.scrape', async (_event, payload) => {
  if (!isPlainObject(payload)) throw new Error('Expected a scrape payload object.');
  const referenceUrl = assertOptionalUrl(payload.referenceUrl);
  const legacyWebsiteReferenceUrl = assertOptionalUrl(payload.websiteReferenceUrl);
  const legacyDesignReferenceUrl = assertOptionalUrl(payload.designReferenceUrl);
  const resolvedReferenceUrl = referenceUrl || legacyWebsiteReferenceUrl || legacyDesignReferenceUrl;

  if (!resolvedReferenceUrl) {
    throw new Error('Provide a reference URL to scrape.');
  }

  return scrapeReferencePayload({ referenceUrl: resolvedReferenceUrl });
});
ipcMain.handle('os.maji.load', async (_event, payload = {}) => {
  if (!isPlainObject(payload)) throw new Error('Expected a MAJI load payload object.');
  return loadMajiMemoryCard({ activeUserSlug: typeof payload.activeUserSlug === 'string' ? payload.activeUserSlug : '' });
});
ipcMain.handle('os.maji.onboard', async (_event, payload = {}) => {
  if (!isPlainObject(payload)) throw new Error('Expected a MAJI onboarding payload object.');
  return onboardMajiUser({ name: typeof payload.name === 'string' ? payload.name : '' });
});
ipcMain.handle('os.maji.save', async (_event, payload = {}) => {
  if (!isPlainObject(payload)) throw new Error('Expected a MAJI save payload object.');
  return saveMajiMemoryCard({
    activeUserSlug: typeof payload.activeUserSlug === 'string' ? payload.activeUserSlug : '',
    messages: Array.isArray(payload.messages) ? payload.messages : []
  });
});

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-features', 'Vulkan');
  app.commandLine.appendSwitch('use-gl', 'swiftshader');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-vsync');
}

app.whenReady().then(async () => {
  await ensureWorkspaceScaffold();
  await createMainWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
