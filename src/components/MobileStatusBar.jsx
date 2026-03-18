import React from 'react';
import { Signal, Wifi, Server, Globe } from 'lucide-react';

export default function MobileStatusBar({
    timeLabel,
    batteryPct = '--%',
    powerStatus = null,
    deviceStatus = null,
    centerContent = null,
    topOffset = 0,
    marginBottom = 6,
    style = {}
}) {
    const resolvedBatteryLabel = powerStatus?.levelPercent != null
        ? `${powerStatus.levelPercent}%`
        : batteryPct;
    const networkType = deviceStatus?.network?.transportType || 'unknown';
    const isOffline = deviceStatus?.network?.online === false || networkType === 'offline';
    const NetworkIcon = networkType === 'ethernet' ? Server : networkType === 'wifi' ? Wifi : Globe;

    return (
        <div style={{ position: 'relative', height: 42, marginTop: topOffset, marginBottom, ...style }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', fontWeight: 400, fontSize: 12, color: '#f8fafc', textShadow: '0 1px 2px rgba(0,0,0,0.32)', height: '100%' }}>
                <span style={{ fontWeight: 400 }}>{timeLabel}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Signal size={14} />
                    <NetworkIcon size={14} color={isOffline ? 'rgba(248,250,252,0.55)' : undefined} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{resolvedBatteryLabel}</span>
                </div>
            </div>
            {centerContent}
        </div>
    );
}

