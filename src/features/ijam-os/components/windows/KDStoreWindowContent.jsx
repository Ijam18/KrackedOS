import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, Globe, Search, Store } from 'lucide-react';
import { getWebAppType } from '../../constants/appRegistry';

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  gap: '14px',
  padding: '14px',
  background: 'radial-gradient(circle at top right, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0) 28%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)'
};

const cardStyle = {
  borderRadius: '22px',
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(255,255,255,0.88)',
  boxShadow: '0 18px 44px rgba(148,163,184,0.14)'
};

const buttonStyle = {
  minHeight: '40px',
  padding: '0 14px',
  borderRadius: '12px',
  border: '1px solid rgba(148,163,184,0.28)',
  background: '#fff',
  color: '#0f172a',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

function PreflightStep({ step, title, command, detail }) {
  return (
    <div style={{ display: 'grid', gap: '6px', padding: '14px', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.92)', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#b45309', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 800 }}>
          {step}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{title}</div>
      </div>
      {command ? (
        <code style={{ fontSize: '12px', color: '#1d4ed8', background: 'rgba(219,234,254,0.7)', borderRadius: '10px', padding: '8px 10px' }}>
          {command}
        </code>
      ) : null}
      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.55 }}>{detail}</div>
    </div>
  );
}

function CatalogAppCard({ item, isInstalled, isRunning, onInstall, onUninstall, onOpenApp, onOpenExternal }) {
  const appType = getWebAppType(item.slug);
  const authProviders = Array.isArray(item.authProviders) ? item.authProviders.filter(Boolean) : [];
  const hasExternalAuth = Boolean(item.requiresExternalAuth || authProviders.length);
  const launchesInKDBrowser = item.launchSurface === 'kdbrowser';
  const launchesInAppWindow = item.launchSurface === 'browser-app';

  return (
    <div style={{ ...cardStyle, padding: '18px', display: 'grid', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: item.iconImage ? 'transparent' : 'linear-gradient(180deg, rgba(249,115,22,0.14) 0%, rgba(59,130,246,0.12) 100%)', border: item.iconImage ? 'none' : '1px solid rgba(249,115,22,0.18)', display: 'grid', placeItems: 'center', color: item.color || '#2563eb', flexShrink: 0, overflow: 'hidden' }}>
            {item.iconImage ? (
              <img src={item.iconImage} alt={item.title} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            ) : (
              <Globe size={24} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{item.title}</div>
              {item.featured ? <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', background: 'rgba(251,191,36,0.2)', borderRadius: '999px', padding: '5px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Featured</span> : null}
              {item.autoInstall ? <span style={{ fontSize: '10px', fontWeight: 800, color: '#047857', background: 'rgba(16,185,129,0.16)', borderRadius: '999px', padding: '5px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Auto-install seed</span> : null}
            </div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b', lineHeight: 1.55 }}>
              {item.description}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: 'rgba(226,232,240,0.72)', borderRadius: '999px', padding: '6px 10px' }}>{item.category}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: isInstalled ? '#047857' : '#92400e', background: isInstalled ? 'rgba(16,185,129,0.16)' : 'rgba(251,191,36,0.18)', borderRadius: '999px', padding: '6px 10px' }}>
            {isInstalled ? 'Installed' : 'Available'}
          </span>
          {isRunning ? (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', background: 'rgba(59,130,246,0.12)', borderRadius: '999px', padding: '6px 10px' }}>
              Running
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
          Launch URL: <code>{item.launchUrl}</code>
        </div>
        <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
          Fallback: <code>{item.fallbackMode}</code> when embed, auth, or off-origin navigation does not behave inside KDOS.
        </div>
        {hasExternalAuth ? (
          <div style={{ fontSize: '12px', color: '#7c2d12', lineHeight: 1.6 }}>
            Sign-in: <code>{authProviders.join(', ')}</code> {(launchesInAppWindow
              ? 'stays inside the app window using a browser-powered KDOS surface.'
              : launchesInKDBrowser)
              ? 'launches in KDBROWSER inside KDOS so OAuth can complete without iframe blocking.'
              : 'opens in your external browser because OAuth providers refuse embedded login windows.'}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {isInstalled ? (
          <>
            <button type="button" onClick={() => onOpenApp(appType)} style={buttonStyle}>
              <CheckCircle2 size={14} />
              Open app
            </button>
            <button type="button" onClick={() => onUninstall(item.id)} style={buttonStyle}>
              Uninstall
            </button>
          </>
        ) : (
          <button type="button" onClick={() => onInstall(item.id)} style={buttonStyle}>
            <Download size={14} />
            Install into KDOS
          </button>
        )}
        <button type="button" onClick={() => onOpenExternal(item.launchUrl)} style={buttonStyle}>
          <ExternalLink size={14} />
          {(launchesInKDBrowser || launchesInAppWindow) ? 'Open raw URL' : (hasExternalAuth ? 'Browser sign-in' : 'Open externally')}
        </button>
      </div>
    </div>
  );
}

export default function KDStoreWindowContent({
  catalogItems,
  installedAppIds,
  runningAppTypes,
  onInstall,
  onUninstall,
  onOpenApp,
  onOpenExternal
}) {
  const [searchValue, setSearchValue] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    if (!normalizedQuery) return catalogItems;
    return catalogItems.filter((item) => (
      [
        item.title,
        item.label,
        item.description,
        item.category,
        ...(item.launcherKeywords || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    ));
  }, [catalogItems, searchValue]);

  return (
    <div style={shellStyle}>
      <section style={{ ...cardStyle, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '760px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '7px 10px', background: 'rgba(245,158,11,0.14)', color: '#92400e', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Store size={14} />
              KDSTORE
            </div>
            <div style={{ marginTop: '14px', fontSize: '30px', lineHeight: 1.05, fontWeight: 800, color: '#0f172a' }}>
              Install hosted web apps into KDOS
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#475569', lineHeight: 1.65 }}>
              This catalog is admin-curated from a local repo file. Installed apps become real KDOS launchers with window state, desktop presence, and external fallback when embedding is not enough.
            </div>
          </div>
          <div style={{ minWidth: '260px', flex: '1 1 260px', maxWidth: '360px', position: 'relative' }}>
            <Search size={16} color="rgba(71,85,105,0.88)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search curated apps"
              style={{
                width: '100%',
                minHeight: '42px',
                borderRadius: '14px',
                border: '1px solid rgba(148,163,184,0.28)',
                background: '#fff',
                color: '#0f172a',
                padding: '0 14px 0 42px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </section>

      <section style={{ ...cardStyle, padding: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          MAJI Preflight
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <PreflightStep step="1" title="Boot runtime" command="npm run dev / npm run desktop" detail="Use browser dev runtime or Electron before you start a real implementation session." />
          <PreflightStep step="2" title="Activate memory" command="MAJI" detail="First run creates your user overlay and loads shared contributor doctrine into the session." />
          <PreflightStep step="3" title="Load workflow layer" command="load bmad" detail="Turn on the planning and review layer before major feature work." />
          <PreflightStep step="4" title="Persist memory separately" command="save / maji save" detail="Use MAJI save for repo-backed memory, then use git normally for code commits." />
        </div>
      </section>

      <section style={{ ...cardStyle, flex: 1, minHeight: 0, padding: '18px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Curated apps
            </div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
              {installedAppIds.length} installed in this workspace
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {filteredItems.map((item) => {
            const appType = getWebAppType(item.slug);
            return (
              <CatalogAppCard
                key={item.id}
                item={item}
                isInstalled={installedAppIds.includes(item.id)}
                isRunning={runningAppTypes.includes(appType)}
                onInstall={onInstall}
                onUninstall={onUninstall}
                onOpenApp={onOpenApp}
                onOpenExternal={onOpenExternal}
              />
            );
          })}
          {!filteredItems.length ? (
            <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', color: '#64748b' }}>
              No apps matched this search. Try broader keywords like <code>ai</code>, <code>builder</code>, or <code>web app</code>.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
