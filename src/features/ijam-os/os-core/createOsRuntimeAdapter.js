import { OS_RUNTIME_MODES } from './constants.js';
import { createElectronBridgeAdapter } from './createElectronBridgeAdapter.js';
import { createLegacyBrowserAdapter } from './createLegacyBrowserAdapter.js';

export function detectRuntimeMode() {
  if (typeof window !== 'undefined' && window.krackedOS) {
    return window.krackedOS.runtime?.mode || OS_RUNTIME_MODES.DESKTOP_LOCAL;
  }
  return OS_RUNTIME_MODES.WEB_DEMO;
}

export function createOsRuntimeAdapter() {
  const runtimeMode = detectRuntimeMode();
  if (runtimeMode === OS_RUNTIME_MODES.DESKTOP_LOCAL || runtimeMode === OS_RUNTIME_MODES.DESKTOP_ISOLATED) {
    return createElectronBridgeAdapter();
  }
  return createLegacyBrowserAdapter();
}
