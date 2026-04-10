const { contextBridge, ipcRenderer } = require('electron');

const listeners = new Set();

ipcRenderer.on('os.browser.native.state', (_event, payload) => {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // Ignore listener failures inside the shell bridge.
    }
  });
});

contextBridge.exposeInMainWorld('kdNativeBrowserShell', {
  getWindowState: (windowKey) => ipcRenderer.invoke('os.browser.native.getWindowState', windowKey),
  navigate: (windowKey, url) => ipcRenderer.invoke('os.browser.native.navigate', windowKey, url),
  action: (windowKey, action) => ipcRenderer.invoke('os.browser.native.action', windowKey, action),
  closeWindow: (windowKey) => ipcRenderer.invoke('os.browser.native.closeWindow', windowKey),
  onState: (listener) => {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
});
