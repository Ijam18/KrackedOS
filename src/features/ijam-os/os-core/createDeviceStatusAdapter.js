import { OS_RUNTIME_MODES } from './constants';

const POLL_INTERVAL_MS = 5000;

function clampPercent(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getNavigatorConnection() {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function inferBrowserTransport() {
  if (typeof navigator === 'undefined') return 'unknown';
  if (!navigator.onLine) return 'offline';
  const connection = getNavigatorConnection();
  const type = String(connection?.type || '').toLowerCase();
  if (type.includes('wifi')) return 'wifi';
  if (type.includes('ethernet')) return 'ethernet';
  if (type.includes('cellular')) return 'wifi';
  const ua = String(navigator.userAgent || '').toLowerCase();
  const isMobileUa = /(android|iphone|ipad|ipod|mobile)/.test(ua);
  const isTouch = Number(navigator.maxTouchPoints || 0) > 1;
  if (!isMobileUa && !isTouch) return 'ethernet';
  return 'unknown';
}

export function createDefaultDeviceStatus(runtimeMode = OS_RUNTIME_MODES.WEB_DEMO) {
  return {
    network: {
      online: typeof navigator !== 'undefined' ? Boolean(navigator.onLine) : true,
      transportType: inferBrowserTransport(),
      adapterName: null,
      ssid: null,
      ip: null,
      canToggleWifi: false,
      canOpenSystemSettings: false,
      source: 'fallback'
    },
    audio: {
      volumePercent: null,
      muted: null,
      canSetVolume: false,
      source: 'fallback'
    },
    display: {
      brightnessPercent: null,
      canSetBrightness: false,
      source: 'fallback'
    },
    capability: {
      networkControl: false,
      audioControl: false,
      brightnessControl: false
    },
    meta: {
      runtime: runtimeMode || 'unknown',
      platform: 'unknown',
      updatedAt: null
    }
  };
}

function normalizeDeviceStatus(payload, runtimeMode) {
  const fallback = createDefaultDeviceStatus(runtimeMode);
  const network = payload?.network || {};
  const audio = payload?.audio || {};
  const display = payload?.display || {};
  const capability = payload?.capability || {};
  const meta = payload?.meta || {};

  return {
    network: {
      online: typeof network.online === 'boolean' ? network.online : fallback.network.online,
      transportType: network.transportType || fallback.network.transportType,
      adapterName: network.adapterName || null,
      ssid: network.ssid || null,
      ip: network.ip || null,
      canToggleWifi: Boolean(network.canToggleWifi),
      canOpenSystemSettings: Boolean(network.canOpenSystemSettings),
      source: network.source || 'fallback'
    },
    audio: {
      volumePercent: clampPercent(audio.volumePercent),
      muted: typeof audio.muted === 'boolean' ? audio.muted : null,
      canSetVolume: Boolean(audio.canSetVolume),
      source: audio.source || 'fallback'
    },
    display: {
      brightnessPercent: clampPercent(display.brightnessPercent),
      canSetBrightness: Boolean(display.canSetBrightness),
      source: display.source || 'fallback'
    },
    capability: {
      networkControl: Boolean(capability.networkControl),
      audioControl: Boolean(capability.audioControl),
      brightnessControl: Boolean(capability.brightnessControl)
    },
    meta: {
      runtime: runtimeMode,
      platform: meta.platform || 'unknown',
      updatedAt: Date.now()
    }
  };
}

function createBrowserStatus(runtimeMode) {
  const fallback = createDefaultDeviceStatus(runtimeMode);
  const connection = getNavigatorConnection();
  const transportType = inferBrowserTransport();

  return {
    ...fallback,
    network: {
      ...fallback.network,
      online: typeof navigator !== 'undefined' ? Boolean(navigator.onLine) : true,
      transportType,
      source: connection ? 'browser-connection-api' : 'browser-online-api'
    },
    meta: {
      runtime: runtimeMode,
      platform: 'browser',
      updatedAt: Date.now()
    }
  };
}

export function createDeviceStatusAdapter(runtime) {
  const runtimeMode = runtime?.mode || OS_RUNTIME_MODES.WEB_DEMO;
  let currentStatus = createDefaultDeviceStatus(runtimeMode);
  let listeners = new Set();
  let poller = null;
  let stopped = false;

  const emit = (status) => {
    currentStatus = status;
    listeners.forEach((listener) => listener(currentStatus));
  };

  const poll = async () => {
    if (stopped) return;

    if (runtimeMode === OS_RUNTIME_MODES.WEB_DEMO || !runtime?.device?.getStatus) {
      emit(createBrowserStatus(runtimeMode));
      return;
    }

    try {
      const payload = await runtime.device.getStatus();
      emit(normalizeDeviceStatus(payload, runtimeMode));
    } catch (error) {
      console.warn('[KRACKED_OS] device status sync failed, falling back', error);
      emit(createBrowserStatus(runtimeMode));
    }
  };

  const start = () => {
    if (poller) return;
    stopped = false;
    void poll();
    poller = setInterval(poll, POLL_INTERVAL_MS);
  };

  return {
    getSnapshot: () => currentStatus,
    subscribe(listener) {
      listeners.add(listener);
      listener(currentStatus);
      start();
      return () => {
        listeners.delete(listener);
        if (!listeners.size && poller) {
          stopped = true;
          clearInterval(poller);
          poller = null;
        }
      };
    }
  };
}
