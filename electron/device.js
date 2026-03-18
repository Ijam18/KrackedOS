import os from 'node:os';
import dns from 'node:dns/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import si from 'systeminformation';
import loudness from 'loudness';
import brightness from 'brightness';

const execFileAsync = promisify(execFile);

function clampPercent(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferTransportFromName(name = '') {
  const lower = name.toLowerCase();
  if (/(wi-?fi|wlan|wireless|airport)/.test(lower)) return 'wifi';
  if (/(ethernet|\beth\b|^en\d|^eno\d|^enp\d)/.test(lower)) return 'ethernet';
  return 'unknown';
}

function getActiveInterface() {
  const interfaces = os.networkInterfaces();
  let firstValid = null;

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      if (address.internal || address.family !== 'IPv4') continue;
      const candidate = { name, ip: address.address, transportType: inferTransportFromName(name) };
      if (candidate.transportType !== 'unknown') return candidate;
      if (!firstValid) firstValid = candidate;
    }
  }

  return firstValid;
}

async function checkOnline() {
  try {
    await dns.resolve('example.com');
    return true;
  } catch {
    return false;
  }
}

async function getWifiSsidHint() {
  try {
    const connections = await si.wifiConnections();
    const connected = connections.find((item) => item.ssid && (item.quality > 0 || item.security));
    return connected?.ssid || null;
  } catch {
    return null;
  }
}

async function setWifiWindows(enabled) {
  const desired = enabled ? 'enabled' : 'disabled';
  await execFileAsync('powershell', ['-NoProfile', '-Command', `Get-NetAdapter -Physical | Where-Object { $_.Name -match 'Wi-Fi|Wireless|WLAN' } | ForEach-Object { Disable-NetAdapter -Name $_.Name -Confirm:$false }`], { windowsHide: true });
  if (enabled) {
    await execFileAsync('powershell', ['-NoProfile', '-Command', `Get-NetAdapter -Physical | Where-Object { $_.Name -match 'Wi-Fi|Wireless|WLAN' } | ForEach-Object { Enable-NetAdapter -Name $_.Name -Confirm:$false }`], { windowsHide: true });
  }
  return { ok: true, message: `Wi-Fi ${desired}` };
}

async function setWifiMac(enabled) {
  const { stdout } = await execFileAsync('networksetup', ['-listallhardwareports']);
  const lines = stdout.split(/\r?\n/);
  let wifiDevice = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (/Hardware Port:\s*Wi-Fi/i.test(lines[i]) || /Hardware Port:\s*AirPort/i.test(lines[i])) {
      const next = lines[i + 1] || '';
      const match = next.match(/Device:\s*(\S+)/i);
      if (match) {
        wifiDevice = match[1];
        break;
      }
    }
  }
  if (!wifiDevice) return { ok: false, message: 'Wi-Fi adapter not found' };
  await execFileAsync('networksetup', ['-setairportpower', wifiDevice, enabled ? 'on' : 'off']);
  return { ok: true, message: `Wi-Fi ${enabled ? 'enabled' : 'disabled'}` };
}

async function setWifiLinux(enabled) {
  await execFileAsync('nmcli', ['radio', 'wifi', enabled ? 'on' : 'off']);
  return { ok: true, message: `Wi-Fi ${enabled ? 'enabled' : 'disabled'}` };
}

function getPlatform() {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'macos';
  if (process.platform === 'linux') return 'linux';
  return 'unknown';
}

function supportsWifiToggle(platform) {
  return platform === 'windows' || platform === 'macos' || platform === 'linux';
}

async function setWifiEnabled(enabled) {
  const platform = getPlatform();
  if (!supportsWifiToggle(platform)) return { ok: false, message: 'Wi-Fi control unsupported on this platform' };
  try {
    if (platform === 'windows') return await setWifiWindows(enabled);
    if (platform === 'macos') return await setWifiMac(enabled);
    return await setWifiLinux(enabled);
  } catch (error) {
    return { ok: false, message: error?.message || 'Failed to toggle Wi-Fi' };
  }
}

async function getVolumeStatus() {
  try {
    const volumePercent = clampPercent(await loudness.getVolume());
    const muted = await loudness.getMuted();
    return {
      volumePercent,
      muted,
      canSetVolume: true,
      source: 'native'
    };
  } catch {
    return {
      volumePercent: null,
      muted: null,
      canSetVolume: false,
      source: 'unsupported'
    };
  }
}

async function setVolume(percent) {
  const nextValue = clampPercent(percent);
  if (nextValue == null) return { ok: false, message: 'Invalid volume value' };
  try {
    await loudness.setVolume(nextValue);
    return { ok: true, message: `Volume set to ${nextValue}%` };
  } catch (error) {
    return { ok: false, message: error?.message || 'Failed to set volume' };
  }
}

async function getBrightnessStatus() {
  try {
    const value = await brightness.get();
    return {
      brightnessPercent: clampPercent((value || 0) * 100),
      canSetBrightness: true,
      source: 'native'
    };
  } catch {
    return {
      brightnessPercent: null,
      canSetBrightness: false,
      source: 'unsupported'
    };
  }
}

async function setBrightness(percent) {
  const nextValue = clampPercent(percent);
  if (nextValue == null) return { ok: false, message: 'Invalid brightness value' };
  try {
    await brightness.set(nextValue / 100);
    return { ok: true, message: `Brightness set to ${nextValue}%` };
  } catch (error) {
    return { ok: false, message: error?.message || 'Failed to set brightness' };
  }
}

export function createDeviceApi() {
  return {
    async getStatus() {
      const platform = getPlatform();
      const activeInterface = getActiveInterface();
      const online = await checkOnline();
      const transportType = !online ? 'offline' : (activeInterface?.transportType || 'unknown');
      const ssid = transportType === 'wifi' ? await getWifiSsidHint() : null;
      const audio = await getVolumeStatus();
      const display = await getBrightnessStatus();

      return {
        network: {
          online,
          transportType,
          adapterName: activeInterface?.name || null,
          ssid,
          ip: activeInterface?.ip || null,
          canToggleWifi: supportsWifiToggle(platform),
          canOpenSystemSettings: true,
          source: 'native'
        },
        audio,
        display,
        capability: {
          networkControl: supportsWifiToggle(platform),
          audioControl: audio.canSetVolume,
          brightnessControl: display.canSetBrightness
        },
        meta: {
          runtime: 'desktop-local',
          platform,
          updatedAt: Date.now()
        }
      };
    },
    async setWifiEnabled(enabled) {
      return setWifiEnabled(Boolean(enabled));
    },
    async setVolume(percent) {
      return setVolume(percent);
    },
    async setBrightness(percent) {
      return setBrightness(percent);
    }
  };
}
