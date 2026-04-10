import { APP_REGISTRY } from '../constants/appRegistry';
import { DEFAULT_EXPLORER_PREFERENCES } from '../os-core/constants';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeRestoredShellWindowState(appType, rawState, { isTouchIjamMode = false, appRegistry = APP_REGISTRY } = {}) {
  if (!rawState || typeof rawState !== 'object') return null;
  const appConfig = appRegistry.find((app) => app.type === appType);
  if (!appConfig) return null;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (isTouchIjamMode) {
    const width = Math.max(320, Math.min(Number(rawState.w) || (viewportWidth - 20), viewportWidth - 20));
    const height = Math.max(400, Math.min(Number(rawState.h) || (viewportHeight - 84), viewportHeight - 84));
    return {
      isOpen: Boolean(rawState.isOpen),
      isMinimized: Boolean(rawState.isMinimized),
      isMaximized: Boolean(rawState.isMaximized),
      x: clamp(Number(rawState.x) || 10, 0, Math.max(0, viewportWidth - width)),
      y: clamp(Number(rawState.y) || 58, 0, Math.max(0, viewportHeight - height)),
      w: width,
      h: height,
      zIndex: Number.isFinite(rawState.zIndex) ? Math.max(0, rawState.zIndex) : 0
    };
  }

  const defaultWidth = Math.min(appConfig.defaultW, Math.max(320, viewportWidth - 60));
  const defaultHeight = Math.min(appConfig.defaultH, Math.max(220, viewportHeight - 140));
  const width = Math.max(320, Math.min(Number(rawState.w) || defaultWidth, Math.max(320, viewportWidth - 24)));
  const height = Math.max(220, Math.min(Number(rawState.h) || defaultHeight, Math.max(220, viewportHeight - 24)));

  return {
    isOpen: Boolean(rawState.isOpen),
    isMinimized: Boolean(rawState.isMinimized),
    isMaximized: Boolean(rawState.isMaximized),
    x: clamp(Number(rawState.x) || 16, 0, Math.max(0, viewportWidth - Math.min(width, 100))),
    y: clamp(Number(rawState.y) || 30, 0, Math.max(0, viewportHeight - Math.min(height, 60))),
    w: width,
    h: height,
    zIndex: Number.isFinite(rawState.zIndex) ? Math.max(0, rawState.zIndex) : 0
  };
}

export function buildShellSessionPayload({
  appRegistry = APP_REGISTRY,
  windowStates,
  focusedWindow,
  startMenuSearch,
  explorerPath,
  explorerView,
  showExplorerDetails,
  explorerSort,
  zCounter
}) {
  const windowStatesPayload = appRegistry.reduce((acc, app) => {
    const state = windowStates[app.type];
    if (!state) return acc;
    acc[app.type] = {
      isOpen: Boolean(state.isOpen),
      isMinimized: Boolean(state.isMinimized),
      isMaximized: Boolean(state.isMaximized),
      zIndex: Number.isFinite(state.zIndex) ? state.zIndex : 0,
      x: Number.isFinite(state.x) ? state.x : undefined,
      y: Number.isFinite(state.y) ? state.y : undefined,
      w: Number.isFinite(state.w) ? state.w : undefined,
      h: Number.isFinite(state.h) ? state.h : undefined
    };
    return acc;
  }, {});

  return {
    focusedWindow: typeof focusedWindow === 'string' ? focusedWindow : null,
    startMenu: {
      isOpen: false,
      search: startMenuSearch || ''
    },
    windowStates: windowStatesPayload,
    explorerPreferences: {
      path: Array.isArray(explorerPath) ? explorerPath : DEFAULT_EXPLORER_PREFERENCES.path,
      view: explorerView === 'list' ? 'list' : DEFAULT_EXPLORER_PREFERENCES.view,
      showDetailsPane: typeof showExplorerDetails === 'boolean' ? showExplorerDetails : DEFAULT_EXPLORER_PREFERENCES.showDetailsPane,
      sort: explorerSort === 'name-desc' ? 'name-desc' : DEFAULT_EXPLORER_PREFERENCES.sort
    },
    windowZCounter: Number.isFinite(zCounter) ? Math.max(100, zCounter) : 100
  };
}
