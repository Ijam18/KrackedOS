import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = require('electron');

function invoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

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
  reference: {
    scrape: (payload) => invoke('os.reference.scrape', payload)
  }
});
