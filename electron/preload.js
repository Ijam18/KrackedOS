const { contextBridge, ipcRenderer } = require('electron');
let browserWindowOpenListener = null;
const nativeBrowserStateListeners = new Set();

function invoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

ipcRenderer.on('os.browser.windowOpenRequested', (_event, payload) => {
  if (typeof browserWindowOpenListener === 'function') {
    browserWindowOpenListener(payload);
  }
});

ipcRenderer.on('os.browser.native.state', (_event, payload) => {
  nativeBrowserStateListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // Ignore listener failures in preload fanout.
    }
  });
});

window.addEventListener('error', (event) => {
  const error = event.error;
  const message = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(event.message || 'Unknown renderer error');
  console.error('[renderer:error]', message);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? `${reason.message}\n${reason.stack || ''}` : String(reason || 'Unknown renderer rejection');
  console.error('[renderer:unhandledrejection]', message);
});

contextBridge.exposeInMainWorld('krackedOS', {
  runtime: {
    mode: 'desktop-local',
    capabilities: {
      realFs: true,
      wallpaperFiles: true,
      containers: false,
      power: true,
      device: true
    },
    initialize: () => invoke('os.runtime.initialize')
  },
  device: {
    getStatus: () => invoke('os.device.getStatus'),
    setWifiEnabled: (enabled) => invoke('os.device.setWifiEnabled', enabled),
    setVolume: (percent) => invoke('os.device.setVolume', percent),
    setBrightness: (percent) => invoke('os.device.setBrightness', percent)
  },
  power: {
    getStatus: () => invoke('os.power.getStatus')
  },
  fs: {
    mountWorkspace: () => invoke('os.fs.mountWorkspace'),
    list: (path) => invoke('os.fs.list', path),
    read: (path) => invoke('os.fs.read', path),
    write: (path, data, options) => invoke('os.fs.write', path, data, options),
    mkdir: (path) => invoke('os.fs.mkdir', path),
    rename: (path, nextName) => invoke('os.fs.rename', path, nextName),
    moveToTrash: (path) => invoke('os.fs.moveToTrash', path),
    restoreFromTrash: (path) => invoke('os.fs.restoreFromTrash', path),
    search: (query, roots) => invoke('os.fs.search', query, roots)
  },
  wallpaper: {
    list: () => invoke('os.wallpaper.list'),
    import: (payload) => invoke('os.wallpaper.import', payload),
    setCurrent: (id, fit) => invoke('os.wallpaper.setCurrent', id, fit),
    getCurrent: () => invoke('os.wallpaper.getCurrent')
  },
  settings: {
    migrateLegacy: () => invoke('os.settings.migrateLegacy'),
    loadProfile: () => invoke('os.settings.loadProfile'),
    saveProfile: (profile) => invoke('os.settings.saveProfile', profile),
    loadDesktopLayout: () => invoke('os.settings.loadDesktopLayout'),
    saveDesktopLayout: (layout) => invoke('os.settings.saveDesktopLayout', layout),
    loadInstalledApps: () => invoke('os.settings.loadInstalledApps'),
    saveInstalledApps: (state) => invoke('os.settings.saveInstalledApps', state),
    loadSession: () => invoke('os.settings.loadSession'),
    saveSession: (session) => invoke('os.settings.saveSession', session),
    loadPersonalization: () => invoke('os.settings.loadPersonalization'),
    savePersonalization: (personalization) => invoke('os.settings.savePersonalization', personalization),
    loadCommunityResources: () => invoke('os.settings.loadCommunityResources'),
    saveCommunityResources: (resources) => invoke('os.settings.saveCommunityResources', resources)
  },
  container: {
    probe: () => invoke('os.container.probe'),
    createWorkspace: (id) => invoke('os.container.createWorkspace', id),
    start: (id) => invoke('os.container.start', id),
    stop: (id) => invoke('os.container.stop', id),
    exec: (id, command) => invoke('os.container.exec', id, command)
  },
  browser: {
    getCapabilities: () => invoke('os.browser.getCapabilities'),
    loadState: (profileId) => invoke('os.browser.loadState', profileId),
    saveState: (state) => invoke('os.browser.saveState', state),
    openExternal: (url) => invoke('os.browser.openExternal', url),
    resetProfile: (profileId) => invoke('os.browser.resetProfile', profileId),
    onWindowOpenRequested: (listener) => {
      browserWindowOpenListener = typeof listener === 'function' ? listener : null;
    },
    native: {
      openWindow: (payload) => invoke('os.browser.native.openWindow', payload),
      getWindowState: (windowKey) => invoke('os.browser.native.getWindowState', windowKey),
      navigate: (windowKey, url) => invoke('os.browser.native.navigate', windowKey, url),
      action: (windowKey, action) => invoke('os.browser.native.action', windowKey, action),
      closeWindow: (windowKey) => invoke('os.browser.native.closeWindow', windowKey),
      onState: (listener) => {
        if (typeof listener !== 'function') return () => {};
        nativeBrowserStateListeners.add(listener);
        return () => {
          nativeBrowserStateListeners.delete(listener);
        };
      }
    }
  },
  reference: {
    scrape: (payload) => invoke('os.reference.scrape', payload)
  },
  maji: {
    load: (payload) => invoke('os.maji.load', payload),
    onboard: (payload) => invoke('os.maji.onboard', payload),
    save: (payload) => invoke('os.maji.save', payload)
  }
});
