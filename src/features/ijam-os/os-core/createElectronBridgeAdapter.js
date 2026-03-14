import { OS_RUNTIME_MODES } from './constants';

function assertBridge() {
  if (typeof window === 'undefined' || !window.krackedOS) {
    throw new Error('Electron bridge is not available in this runtime.');
  }
  return window.krackedOS;
}

async function serializeElectronFilePayload(payload) {
  if (!payload || typeof File === 'undefined' || !(payload instanceof File)) {
    return payload;
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file for Electron bridge.'));
    reader.readAsDataURL(payload);
  });

  return {
    name: payload.name,
    type: payload.type,
    dataUrl
  };
}

export function createElectronBridgeAdapter() {
  const bridge = assertBridge();

  return {
    mode: bridge.runtime?.mode || OS_RUNTIME_MODES.DESKTOP_LOCAL,
    capabilities: bridge.runtime?.capabilities || {
      realFs: true,
      wallpaperFiles: true,
      containers: false
    },
    fs: {
      mountWorkspace: () => bridge.fs.mountWorkspace(),
      bindMountData: () => {},
      list: (path) => bridge.fs.list(path),
      read: (path) => bridge.fs.read(path),
      write: (path, data, options) => bridge.fs.write(path, data, options),
      mkdir: (path) => bridge.fs.mkdir(path),
      rename: (path, nextName) => bridge.fs.rename(path, nextName),
      moveToTrash: (path) => bridge.fs.moveToTrash(path),
      restoreFromTrash: (path) => bridge.fs.restoreFromTrash(path),
      search: (query, roots) => bridge.fs.search(query, roots)
    },
    wallpaper: {
      list: () => bridge.wallpaper.list(),
      import: async (payload) => bridge.wallpaper.import(await serializeElectronFilePayload(payload)),
      setCurrent: (id, fit) => bridge.wallpaper.setCurrent(id, fit),
      getCurrent: () => bridge.wallpaper.getCurrent()
    },
    settings: {
      migrateLegacy: () => bridge.settings.migrateLegacy(),
      loadProfile: () => bridge.settings.loadProfile(),
      saveProfile: (profile) => bridge.settings.saveProfile(profile),
      loadDesktopLayout: () => bridge.settings.loadDesktopLayout(),
      saveDesktopLayout: (layout) => bridge.settings.saveDesktopLayout(layout),
      loadSession: () => bridge.settings.loadSession(),
      saveSession: (session) => bridge.settings.saveSession(session),
      loadPersonalization: () => bridge.settings.loadPersonalization(),
      savePersonalization: (personalization) => bridge.settings.savePersonalization(personalization),
      loadCommunityResources: () => bridge.settings.loadCommunityResources(),
      saveCommunityResources: (resources) => bridge.settings.saveCommunityResources(resources)
    },
    containers: {
      probe: () => bridge.container?.probe?.() || { supported: false },
      createWorkspace: (id) => bridge.container?.createWorkspace?.(id),
      start: (id) => bridge.container?.start?.(id),
      stop: (id) => bridge.container?.stop?.(id),
      exec: (id, command) => bridge.container?.exec?.(id, command)
    },
    async initialize() {
      if (bridge.runtime?.initialize) {
        return bridge.runtime.initialize();
      }
      return {
        mode: bridge.runtime?.mode || OS_RUNTIME_MODES.DESKTOP_LOCAL
      };
    }
  };
}
