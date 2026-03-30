import { OS_RUNTIME_MODES } from './constants.js';

const POLL_INTERVAL_MS = 30000;

function clampPercent(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferWebDeviceClass() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const width = window.innerWidth || 0;
  const mobileMatch = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
  if (mobileMatch || (maxTouchPoints > 1 && width > 0 && width <= 1024)) return 'mobile';
  return 'desktop';
}

export function createDefaultPowerStatus(runtimeMode = OS_RUNTIME_MODES.WEB_DEMO) {
  return {
    supported: false,
    source: 'unknown',
    hasBattery: null,
    levelPercent: null,
    isCharging: null,
    chargingLabel: 'unknown',
    runtime: runtimeMode || 'unknown',
    deviceClass: runtimeMode === OS_RUNTIME_MODES.WEB_DEMO ? inferWebDeviceClass() : 'unknown',
    detectionMethod: 'fallback',
    statusLabel: 'Power unavailable',
    detailLabel: 'Device power data not available on this runtime.',
    updatedAt: null
  };
}

function normalizeBrowserPowerStatus(manager, runtimeMode) {
  const percent = clampPercent((manager?.level || 0) * 100);
  const isCharging = typeof manager?.charging === 'boolean' ? manager.charging : null;
  const chargingLabel = isCharging === true ? 'charging' : isCharging === false ? 'discharging' : 'unknown';
  const inferredDeviceClass = inferWebDeviceClass();
  const deviceClass = inferredDeviceClass === 'mobile' ? 'mobile' : 'unknown';
  return {
    supported: true,
    source: isCharging ? 'ac' : 'battery',
    hasBattery: true,
    levelPercent: percent,
    isCharging,
    chargingLabel,
    runtime: runtimeMode,
    deviceClass,
    detectionMethod: 'browser-battery-api',
    statusLabel: isCharging ? 'Charging' : 'On battery',
    detailLabel: isCharging
      ? `Browser battery data reports ${percent ?? '--'}% and charging.`
      : `Browser battery data reports ${percent ?? '--'}% remaining.`,
    updatedAt: Date.now()
  };
}

function normalizeUnsupportedPowerStatus(runtimeMode) {
  const deviceClass = inferWebDeviceClass();
  return {
    ...createDefaultPowerStatus(runtimeMode),
    runtime: runtimeMode,
    deviceClass,
    statusLabel: 'Power status unavailable',
    detailLabel: 'This browser does not expose battery data.'
  };
}

function normalizeElectronPowerStatus(payload, runtimeMode) {
  const percent = clampPercent(payload?.percent);
  const hasBattery = typeof payload?.hasBattery === 'boolean' ? payload.hasBattery : null;
  const isCharging = typeof payload?.isCharging === 'boolean' ? payload.isCharging : null;
  const acConnected = typeof payload?.acConnected === 'boolean' ? payload.acConnected : null;

  if (hasBattery === false) {
    return {
      supported: true,
      source: 'ac',
      hasBattery: false,
      levelPercent: null,
      isCharging: null,
      chargingLabel: 'plugged-in',
      runtime: runtimeMode,
      deviceClass: 'desktop',
      detectionMethod: 'electron-native',
      statusLabel: 'Plugged in desktop',
      detailLabel: 'No battery detected on this device.',
      updatedAt: Date.now()
    };
  }

  if (hasBattery === true) {
    const source = isCharging || acConnected ? 'ac' : 'battery';
    return {
      supported: true,
      source,
      hasBattery: true,
      levelPercent: percent,
      isCharging,
      chargingLabel: isCharging ? (percent === 100 ? 'full' : 'charging') : 'discharging',
      runtime: runtimeMode,
      deviceClass: 'laptop',
      detectionMethod: 'electron-native',
      statusLabel: isCharging ? (percent === 100 ? 'Fully charged' : 'Charging') : 'On battery',
      detailLabel: isCharging
        ? `Native device power data. ${percent ?? '--'}% and charging.`
        : `Native device power data. ${percent ?? '--'}% remaining.`,
      updatedAt: Date.now()
    };
  }

  return {
    ...createDefaultPowerStatus(runtimeMode),
    runtime: runtimeMode,
    detectionMethod: 'electron-native',
    statusLabel: 'Power status unavailable',
    detailLabel: 'Native power data is not available for this device.'
  };
}

function createBrowserAdapter(runtimeMode) {
  let currentStatus = createDefaultPowerStatus(runtimeMode);
  let batteryManager = null;
  let listeners = new Set();
  let cleanup = null;
  let bootstrapped = false;

  const emit = (status) => {
    currentStatus = status;
    listeners.forEach((listener) => listener(currentStatus));
  };

  const bootstrap = async () => {
    if (bootstrapped) return;
    bootstrapped = true;

    if (typeof navigator === 'undefined' || typeof navigator.getBattery !== 'function') {
      emit(normalizeUnsupportedPowerStatus(runtimeMode));
      return;
    }

    try {
      batteryManager = await navigator.getBattery();
      const handleChange = () => emit(normalizeBrowserPowerStatus(batteryManager, runtimeMode));
      handleChange();
      batteryManager.addEventListener('levelchange', handleChange);
      batteryManager.addEventListener('chargingchange', handleChange);
      cleanup = () => {
        batteryManager?.removeEventListener('levelchange', handleChange);
        batteryManager?.removeEventListener('chargingchange', handleChange);
      };
    } catch (error) {
      console.warn('[KRACKED_OS] browser battery API unavailable', error);
      emit(normalizeUnsupportedPowerStatus(runtimeMode));
    }
  };

  return {
    getSnapshot: () => currentStatus,
    subscribe(listener) {
      listeners.add(listener);
      listener(currentStatus);
      void bootstrap();
      return () => {
        listeners.delete(listener);
        if (!listeners.size && cleanup) {
          cleanup();
          cleanup = null;
          bootstrapped = false;
          batteryManager = null;
        }
      };
    }
  };
}

function createElectronAdapter(runtime) {
  const runtimeMode = runtime?.mode || OS_RUNTIME_MODES.DESKTOP_LOCAL;
  let currentStatus = createDefaultPowerStatus(runtimeMode);
  let listeners = new Set();
  let poller = null;
  let stopped = false;

  const emit = (status) => {
    currentStatus = status;
    listeners.forEach((listener) => listener(currentStatus));
  };

  const poll = async () => {
    if (stopped) return;
    try {
      if (runtime?.power?.getStatus) {
        const payload = await runtime.power.getStatus();
        emit(normalizeElectronPowerStatus(payload, runtimeMode));
        return;
      }
    } catch (error) {
      console.warn('[KRACKED_OS] electron power lookup failed, falling back to browser API', error);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      try {
        const manager = await navigator.getBattery();
        emit(normalizeBrowserPowerStatus(manager, runtimeMode));
        return;
      } catch (error) {
        console.warn('[KRACKED_OS] browser fallback battery lookup failed', error);
      }
    }

    emit({
      ...createDefaultPowerStatus(runtimeMode),
      runtime: runtimeMode,
      deviceClass: 'desktop',
      statusLabel: 'Power status unavailable',
      detailLabel: 'Local power data is not available on this device.'
    });
  };

  const start = () => {
    if (poller) return;
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

export function createPowerStatusAdapter(runtime) {
  if (runtime?.mode === OS_RUNTIME_MODES.DESKTOP_LOCAL || runtime?.mode === OS_RUNTIME_MODES.DESKTOP_ISOLATED) {
    return createElectronAdapter(runtime);
  }
  return createBrowserAdapter(runtime?.mode || OS_RUNTIME_MODES.WEB_DEMO);
}
