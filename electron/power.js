import si from 'systeminformation';

function normalizePercent(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createPowerApi() {
  return {
    async getStatus() {
      const info = await si.battery();
      return {
        hasBattery: typeof info.hasbattery === 'boolean' ? info.hasbattery : false,
        percent: normalizePercent(info.percent),
        isCharging: typeof info.ischarging === 'boolean' ? info.ischarging : null,
        acConnected: typeof info.acconnected === 'boolean' ? info.acconnected : null,
        cycleCount: Number.isFinite(info.cyclecount) ? info.cyclecount : null,
        timeRemainingMin: Number.isFinite(info.timeremaining) ? info.timeremaining : null,
        vendor: info.manufacturer || null,
        model: info.model || null
      };
    }
  };
}
