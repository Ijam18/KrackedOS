import React from 'react';
import { FolderOpen, Power, Search } from 'lucide-react';

const shellText = {
  muted: 'rgba(226,232,240,0.72)',
  soft: 'rgba(248,250,252,0.9)',
  strong: '#f8fafc'
};

function LauncherTile({ app, isRunning, isFocused, onOpen }) {
  const Icon = app.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(app.type)}
      style={{
        border: isFocused ? `1px solid ${app.color}` : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        background: isFocused ? 'rgba(15,23,42,0.82)' : 'rgba(15,23,42,0.46)',
        color: shellText.soft,
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: '122px',
        transition: 'transform 0.16s ease, border-color 0.16s ease, background 0.16s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.background = 'rgba(15,23,42,0.72)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = isFocused ? 'rgba(15,23,42,0.82)' : 'rgba(15,23,42,0.46)';
      }}
    >
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', border: app.desktopIconImage ? 'none' : `1px solid ${app.color}`, background: 'rgba(255,255,255,0.07)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {app.desktopIconImage ? (
            <img src={app.desktopIconImage} alt={`${app.label} icon`} style={{ width: '36px', height: '36px', objectFit: 'contain', transform: `scale(${app.desktopIconScale || 1})` }} />
          ) : (
            <Icon size={20} color={app.color} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(245,208,0,0.14)', color: '#f5d000', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{app.category}</span>
          {isRunning && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: isFocused ? '#6ee7b7' : shellText.muted, fontSize: '10px', fontWeight: 700 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: isFocused ? '#22c55e' : '#f5d000' }} />
              {isFocused ? 'Focused' : 'Running'}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gap: '4px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: shellText.strong }}>{app.title || app.label}</div>
        <div style={{ fontSize: '11px', lineHeight: 1.45, color: shellText.muted }}>{app.description}</div>
      </div>
    </button>
  );
}

const StartMenu = ({
  isOpen,
  searchValue,
  inputRef,
  panelMode,
  onSearchChange,
  onPanelModeChange,
  onOpenApp,
  onSubmitSearch,
  onClose,
  onPowerOff,
  onOpenFiles,
  currentUser,
  visibleApps,
  focusedWindow,
  runningAppTypes,
  completionSummary
}) => {
  if (!isOpen) return null;

  const builderName = currentUser?.builder_name || currentUser?.name || 'Local Builder';

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 9998 }} />
      <div
        data-mac-menu-root
        role="dialog"
        aria-label="Start panel"
        style={{
          position: 'absolute',
          top: '34px',
          left: '12px',
          width: 'min(640px, calc(100vw - 24px))',
          maxHeight: 'min(82vh, 720px)',
          background: 'linear-gradient(160deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.93) 42%, rgba(51,65,85,0.92) 100%)',
          backdropFilter: 'blur(22px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
          border: '1px solid rgba(245,208,0,0.22)',
          borderRadius: '24px',
          boxShadow: '0 28px 60px rgba(2,6,23,0.62), inset 0 1px 0 rgba(255,255,255,0.04)',
          zIndex: 9999,
          display: 'grid',
          gridTemplateRows: 'auto auto auto minmax(0,1fr) auto',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '14px 18px 8px', display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 260px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '14px', border: '1px solid rgba(245,208,0,0.24)', background: 'linear-gradient(180deg, rgba(245,208,0,0.16) 0%, rgba(15,23,42,0.7) 100%)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <img src="/icons/KDOS.png" alt="KRACKED launcher" style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ display: 'grid', gap: '2px', minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f5d000', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.1 }}>KRACKED launcher</div>
                <div style={{ fontSize: '11px', lineHeight: 1.25, color: shellText.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{completionSummary}</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: '999px', background: 'rgba(15,23,42,0.58)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, maxWidth: '100%' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '10px', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', color: '#eff6ff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                {builderName[0].toUpperCase()}
              </div>
              <div style={{ display: 'grid', gap: '1px', minWidth: 0 }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: shellText.muted, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.1 }}>Builder</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: shellText.strong, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{builderName}</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} color="rgba(248,250,252,0.7)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search apps, tools, and workspace surfaces"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSubmitSearch();
                }
              }}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: '999px',
                border: '1px solid rgba(245,208,0,0.26)',
                background: 'rgba(15,23,42,0.72)',
                color: shellText.strong,
                fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ padding: '0 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: shellText.strong }}>{panelMode === 'all' ? 'All apps' : 'Pinned apps'}</div>
          <button
            type="button"
            onClick={() => onPanelModeChange(panelMode === 'all' ? 'pinned' : 'all')}
            style={{ border: '1px solid rgba(245,208,0,0.26)', borderRadius: '10px', background: 'rgba(245,208,0,0.14)', color: '#f5d000', fontSize: '12px', fontWeight: 600, padding: '5px 10px', cursor: 'pointer' }}
          >
            {panelMode === 'all' ? 'Show pinned' : 'Browse all'}
          </button>
        </div>

        <div style={{ padding: '0 22px 18px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {visibleApps.map((app) => (
              <LauncherTile
                key={app.type}
                app={app}
                isRunning={runningAppTypes.includes(app.type)}
                isFocused={focusedWindow === app.type}
                onOpen={onOpenApp}
              />
            ))}
          </div>
          {!visibleApps.length && (
            <div style={{ padding: '22px 6px 8px', fontSize: '12px', color: shellText.muted }}>No apps matched this search. Try broader keywords like `files`, `prompt`, or `wallpaper`.</div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(245,208,0,0.16)', background: 'rgba(15,23,42,0.64)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: shellText.strong, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '16px', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', color: '#eff6ff', fontSize: '18px', fontWeight: 700 }}>
              {builderName[0].toUpperCase()}
            </div>
            <div style={{ display: 'grid', gap: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{builderName}</span>
              <span style={{ fontSize: '11px', color: shellText.muted }}>KRACKED_OS workspace session</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onOpenFiles}
              style={{ border: '1px solid rgba(148,163,184,0.38)', background: 'rgba(255,255,255,0.06)', color: shellText.strong, borderRadius: '999px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
            >
              <FolderOpen size={14} />
              Open Files
            </button>
            <button
              aria-label="Power off"
              type="button"
              onClick={onPowerOff}
              style={{ border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.15)', color: '#fecaca', width: '38px', height: '38px', borderRadius: '999px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <Power size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StartMenu;
