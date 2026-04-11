import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
  DEFAULT_BROWSER_USER_AGENT,
  getBrowserPartition,
  getKDBrowserTitleFromUrl,
  sanitizeBrowserProfileId
} from '../../os-core/browserState';
import RemoteBrowserViewport from './RemoteBrowserViewport.jsx';

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)'
};

const toolbarButtonStyle = {
  border: '1px solid rgba(148,163,184,0.3)',
  background: '#fff',
  color: '#0f172a',
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer'
};

function normalizeUrlCandidate(value, fallbackProtocol = 'https:') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // Relative paths (e.g. "/rotican/ms") should resolve against the current origin,
  // not be reinterpreted as absolute URLs with the path as a hostname.
  if (raw.startsWith('/') && typeof window !== 'undefined' && window.location) {
    try {
      return new URL(raw, window.location.origin).toString();
    } catch {
      return '';
    }
  }

  try {
    return new URL(raw).toString();
  } catch {
    try {
      return new URL(`${fallbackProtocol}//${raw}`).toString();
    } catch {
      return '';
    }
  }
}

function isUrlAllowed(url, allowedOrigins = []) {
  if (!url) return false;
  if (!allowedOrigins.length) return true;
  // Wildcard means any origin is allowed (used for relative paths on the same host).
  if (allowedOrigins.includes('*')) return true;

  try {
    const origin = new URL(url).origin;
    return allowedOrigins.includes(origin);
  } catch {
    return false;
  }
}

function resolveHostedSurfaceMode(browserCapabilities, isBrowserPoweredApp) {
  if (!isBrowserPoweredApp) return 'iframe';
  if (browserCapabilities.nativeBrowserWindow) return 'native-window';
  if (browserCapabilities.embeddedBrowser) return 'webview';
  if (browserCapabilities.remoteBrowser) return 'remote';
  return 'external';
}

function createBrowserBackedAppState(url, title) {
  return {
    url,
    title: title || getKDBrowserTitleFromUrl(url),
    isLoading: Boolean(url),
    canGoBack: false,
    canGoForward: false,
    error: '',
    remoteSessionId: '',
    remoteCommittedUrl: '',
    remoteRevision: 0,
    remoteViewportWidth: 1440,
    remoteViewportHeight: 900
  };
}

function BrowserBackedHostedAppWindowContent({ app, runtime, onOpenExternal, allowedOrigins, homeUrl }) {
  const profileId = useMemo(
    () => sanitizeBrowserProfileId(`app-${app?.slug || app?.type || 'hosted'}`),
    [app?.slug, app?.type]
  );
  const nativeWindowKey = useMemo(
    () => `app-browser:${app?.type || app?.slug || 'hosted'}`,
    [app?.slug, app?.type]
  );
  const partition = useMemo(() => getBrowserPartition(profileId), [profileId]);
  const [browserCapabilities, setBrowserCapabilities] = useState(DEFAULT_BROWSER_RUNTIME_CAPABILITIES);
  const [surfaceState, setSurfaceState] = useState(() => createBrowserBackedAppState(homeUrl, app?.title));
  const webviewRef = useRef(null);
  const webviewCleanupRef = useRef(null);
  const nativeWindowOpenedRef = useRef(false);
  const surfaceMode = useMemo(
    () => resolveHostedSurfaceMode(browserCapabilities, true),
    [browserCapabilities]
  );

  const upsertSurfaceState = useCallback((patch) => {
    setSurfaceState((prev) => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch)
    }));
  }, []);

  const openExternalFallback = useCallback((nextUrl, message) => {
    if (!nextUrl) return;
    onOpenExternal?.(nextUrl);
    upsertSurfaceState({
      isLoading: false,
      error: message || 'This app needs a stricter browser context, so the raw URL was opened outside KDOS.'
    });
  }, [onOpenExternal, upsertSurfaceState]);

  const syncFromWebview = useCallback((node, overrides = {}) => {
    if (!node) return;

    let url = overrides.url || '';
    let title = overrides.title || '';
    let canGoBack = false;
    let canGoForward = false;
    let isLoading = Boolean(overrides.isLoading);

    try {
      url = node.getURL?.() || url;
      title = node.getTitle?.() || title;
      canGoBack = Boolean(node.canGoBack?.());
      canGoForward = Boolean(node.canGoForward?.());
      isLoading = Boolean(node.isLoading?.());
    } catch {
      // Ignore transient guest state errors while the app browser surface is warming up.
    }

    upsertSurfaceState({
      url: url || surfaceState.url || homeUrl,
      title: title || overrides.title || app?.title || getKDBrowserTitleFromUrl(url || homeUrl),
      canGoBack,
      canGoForward,
      isLoading,
      error: ''
    });
  }, [app?.title, homeUrl, surfaceState.url, upsertSurfaceState]);

  const attachWebviewNode = useCallback((node) => {
    const existingNode = webviewRef.current;
    if (existingNode === node) return;

    if (webviewCleanupRef.current) {
      webviewCleanupRef.current();
      webviewCleanupRef.current = null;
    }

    if (!node) {
      webviewRef.current = null;
      return;
    }

    webviewRef.current = node;

    const handleStartLoading = () => {
      upsertSurfaceState({ isLoading: true, error: '' });
    };
    const handleStopLoading = () => {
      syncFromWebview(node);
    };
    const handleTitleUpdated = (event) => {
      syncFromWebview(node, { title: event?.title });
    };
    const handleDidNavigate = (event) => {
      syncFromWebview(node, { url: event?.url });
    };
    const handleDidNavigateInPage = (event) => {
      syncFromWebview(node, { url: event?.url });
    };
    const handleDidFailLoad = (event) => {
      if (event?.isMainFrame === false || event?.errorCode === -3) return;
      upsertSurfaceState({
        isLoading: false,
        error: event?.errorDescription || 'This app could not be loaded in its browser-powered KDOS window.'
      });
    };
    const handleDomReady = () => {
      syncFromWebview(node);
    };

    node.addEventListener('did-start-loading', handleStartLoading);
    node.addEventListener('did-stop-loading', handleStopLoading);
    node.addEventListener('page-title-updated', handleTitleUpdated);
    node.addEventListener('did-navigate', handleDidNavigate);
    node.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    node.addEventListener('did-fail-load', handleDidFailLoad);
    node.addEventListener('dom-ready', handleDomReady);

    webviewCleanupRef.current = () => {
      node.removeEventListener('did-start-loading', handleStartLoading);
      node.removeEventListener('did-stop-loading', handleStopLoading);
      node.removeEventListener('page-title-updated', handleTitleUpdated);
      node.removeEventListener('did-navigate', handleDidNavigate);
      node.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      node.removeEventListener('did-fail-load', handleDidFailLoad);
      node.removeEventListener('dom-ready', handleDomReady);
    };
  }, [syncFromWebview, upsertSurfaceState]);

  useEffect(() => {
    let active = true;

    Promise.resolve(runtime?.browser?.getCapabilities?.() || DEFAULT_BROWSER_RUNTIME_CAPABILITIES)
      .then((capabilities) => {
        if (!active) return;
        setBrowserCapabilities({
          ...DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
          ...(capabilities || {})
        });
      })
      .catch(() => {
        if (!active) return;
        setBrowserCapabilities(DEFAULT_BROWSER_RUNTIME_CAPABILITIES);
      });

    return () => {
      active = false;
    };
  }, [runtime]);

  useEffect(() => {
    setSurfaceState(createBrowserBackedAppState(homeUrl, app?.title));
  }, [app?.title, app?.type, homeUrl]);

  useEffect(() => {
    if (surfaceMode !== 'native-window' || !runtime?.browser?.native?.openWindow || !homeUrl) return undefined;

    runtime.browser.native.openWindow({
      windowKey: nativeWindowKey,
      profileId,
      title: app?.title || getKDBrowserTitleFromUrl(homeUrl),
      url: homeUrl,
      homeUrl,
      ownerAppId: app?.type || app?.slug || 'browser-app',
      focus: !nativeWindowOpenedRef.current
    }).catch((error) => {
      upsertSurfaceState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to open the native browser window for this app.'
      });
    });
    nativeWindowOpenedRef.current = true;

    return undefined;
  }, [app?.slug, app?.title, app?.type, homeUrl, nativeWindowKey, profileId, runtime, surfaceMode, upsertSurfaceState]);

  useEffect(() => {
    if (surfaceMode !== 'native-window' || !runtime?.browser?.native?.onState) return undefined;

    const unsubscribe = runtime.browser.native.onState((payload) => {
      if (!payload || payload.windowKey !== nativeWindowKey) return;
      upsertSurfaceState({
        url: payload.url || homeUrl,
        title: payload.title || app?.title || getKDBrowserTitleFromUrl(payload.url || homeUrl),
        canGoBack: Boolean(payload.canGoBack),
        canGoForward: Boolean(payload.canGoForward),
        isLoading: Boolean(payload.isLoading),
        error: payload.error || ''
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [app?.title, homeUrl, nativeWindowKey, runtime, surfaceMode, upsertSurfaceState]);

  useEffect(() => () => {
    nativeWindowOpenedRef.current = false;
    runtime?.browser?.native?.closeWindow?.(nativeWindowKey).catch(() => {});
    if (webviewCleanupRef.current) {
      webviewCleanupRef.current();
      webviewCleanupRef.current = null;
    }
    webviewRef.current = null;
  }, [nativeWindowKey, runtime]);

  const currentUrl = surfaceState.url || homeUrl;
  const isLoading = Boolean(surfaceState.isLoading);
  const errorMessage = surfaceState.error || '';

  const handleReload = useCallback(() => {
    if (!currentUrl) return;
    if (!isUrlAllowed(currentUrl, allowedOrigins)) {
      openExternalFallback(currentUrl);
      return;
    }

    if (surfaceMode === 'native-window') {
      runtime?.browser?.native?.action?.(nativeWindowKey, 'reload').catch((error) => {
        upsertSurfaceState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to reload the native browser window.'
        });
      });
      return;
    }

    if (surfaceMode === 'webview') {
      const node = webviewRef.current;
      if (node?.reload) {
        try {
          node.reload();
          upsertSurfaceState({ isLoading: true, error: '' });
          return;
        } catch {
          // Fall through to direct load below.
        }
      }
      if (node?.loadURL) {
        try {
          node.loadURL(currentUrl);
          upsertSurfaceState({ isLoading: true, error: '' });
          return;
        } catch {
          // Fall back to external below.
        }
      }
    }

    if (surfaceMode === 'remote') {
      upsertSurfaceState({
        url: currentUrl,
        isLoading: true,
        error: '',
        remoteSessionId: '',
        remoteCommittedUrl: '',
        remoteRevision: 0
      });
      return;
    }

    openExternalFallback(currentUrl);
  }, [allowedOrigins, currentUrl, nativeWindowKey, openExternalFallback, runtime, surfaceMode, upsertSurfaceState]);

  return (
    <div style={shellStyle}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0, background: '#0f172a' }}>
        {surfaceMode === 'webview' ? (
          <webview
            ref={attachWebviewNode}
            src={homeUrl}
            partition={partition}
            useragent={DEFAULT_BROWSER_USER_AGENT}
            allowpopups="true"
            allowFullScreen="true"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff'
            }}
          />
        ) : null}

        {surfaceMode === 'remote' ? (
          <RemoteBrowserViewport
            active
            profileId={profileId}
            remoteState={surfaceState}
            runtime={runtime}
            tab={{
              id: app?.type || app?.slug || 'hosted-browser-app',
              url: currentUrl || homeUrl,
              title: surfaceState.title || app?.title || getKDBrowserTitleFromUrl(currentUrl || homeUrl)
            }}
            onPersistedUpdate={(url, title) => {
              upsertSurfaceState({
                url: url || currentUrl,
                title: title || surfaceState.title
              });
            }}
            onStatePatch={(patch) => {
              upsertSurfaceState(patch);
            }}
          />
        ) : null}

        {surfaceMode === 'native-window' ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(180deg, rgba(14,165,233,0.16) 0%, rgba(15,23,42,0.08) 100%)' }}>
            <div style={{ width: 'min(100%, 460px)', borderRadius: '24px', border: '1px solid rgba(125,211,252,0.24)', background: 'rgba(248,250,252,0.92)', boxShadow: '0 28px 70px rgba(2,6,23,0.24)', padding: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>{app?.title || 'Browser app'} is running in a native KDOS window</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', marginBottom: '16px' }}>
                This app now uses a dedicated Electron browser window so sign-in redirects and heavy browsing behave more like a real desktop browser.
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', wordBreak: 'break-word' }}>{currentUrl || homeUrl}</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => runtime?.browser?.native?.action?.(nativeWindowKey, 'focus').catch(() => {})} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', gridAutoFlow: 'column', gap: '8px' }}>
                  Focus window
                </button>
                <button type="button" onClick={handleReload} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', gridAutoFlow: 'column', gap: '8px' }}>
                  <RefreshCw size={14} />
                  Reload
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {(surfaceMode === 'external' || (errorMessage && surfaceMode !== 'native-window')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              padding: '24px',
              background: isLoading && !errorMessage && surfaceMode !== 'external'
                ? 'linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.42) 100%)'
                : 'rgba(15,23,42,0.58)'
            }}
          >
            <div
              style={{
                width: 'min(100%, 460px)',
                borderRadius: '22px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(248,250,252,0.94)',
                boxShadow: '0 28px 70px rgba(2,6,23,0.32)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isLoading && !errorMessage && surfaceMode !== 'external' ? '#2563eb' : '#dc2626' }}>
                {isLoading && !errorMessage && surfaceMode !== 'external' ? <RefreshCw size={18} /> : <AlertTriangle size={18} />}
                <span style={{ fontSize: '15px', fontWeight: 800 }}>
                  {isLoading && !errorMessage && surfaceMode !== 'external'
                    ? 'Opening app'
                    : 'Browser-powered app needs attention'}
                </span>
              </div>
              <div style={{ marginTop: '12px', color: '#334155', fontSize: '13px', lineHeight: 1.6 }}>
                {surfaceMode === 'external'
                  ? 'This runtime cannot host a browser-powered app window, so use the raw URL outside KDOS.'
                  : (errorMessage || 'Loading the app inside KDOS...')}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleReload} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', gridAutoFlow: 'column', gap: '8px' }}>
                  <RefreshCw size={14} />
                  Retry
                </button>
                <button type="button" onClick={() => onOpenExternal?.(currentUrl || homeUrl)} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', gridAutoFlow: 'column', gap: '8px' }}>
                  <ExternalLink size={14} />
                  Open raw URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HostedWebAppWindowContent({ app, runtime, onOpenExternal }) {
  const allowedOrigins = useMemo(
    () => (Array.isArray(app?.allowedOrigins) ? app.allowedOrigins : []).filter(Boolean),
    [app?.allowedOrigins]
  );
  const homeUrl = useMemo(
    () => normalizeUrlCandidate(app?.homeUrl || app?.launchUrl || ''),
    [app?.homeUrl, app?.launchUrl]
  );
  const isBrowserPoweredApp = app?.launchSurface === 'browser-app' || app?.contentType === 'browser-app';

  if (isBrowserPoweredApp) {
    return (
      <BrowserBackedHostedAppWindowContent
        app={app}
        runtime={runtime}
        onOpenExternal={onOpenExternal}
        allowedOrigins={allowedOrigins}
        homeUrl={homeUrl}
      />
    );
  }

  const [frameUrl, setFrameUrl] = useState(homeUrl);
  const [loadState, setLoadState] = useState(homeUrl ? 'loading' : 'idle');
  const [statusMessage, setStatusMessage] = useState(homeUrl ? 'Opening app...' : 'No launch URL configured.');
  const [reloadToken, setReloadToken] = useState(0);
  const timeoutRef = useRef(null);

  const currentUrl = frameUrl || homeUrl;

  const startLoading = useCallback((message) => {
    setLoadState('loading');
    setStatusMessage(message || 'Loading app...');
  }, []);

  const openExternalFallback = useCallback((nextUrl, message) => {
    if (!nextUrl) return;
    onOpenExternal?.(nextUrl);
    setLoadState('fallback');
    setStatusMessage(message || 'This page works better outside KDOS, so it was opened in a new tab.');
  }, [onOpenExternal]);

  useEffect(() => {
    setFrameUrl(homeUrl);
    setLoadState(homeUrl ? 'loading' : 'idle');
    setStatusMessage(homeUrl ? 'Opening app...' : 'No launch URL configured.');
    setReloadToken(0);
  }, [homeUrl, app?.type]);

  useEffect(() => {
    // Timeout disabled as requested to allow background loading without interruption
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [frameUrl, loadState, reloadToken]);

  const handleReload = useCallback(() => {
    if (!currentUrl) return;
    if (!isUrlAllowed(currentUrl, allowedOrigins)) {
      openExternalFallback(currentUrl);
      return;
    }
    startLoading('Reloading app...');
    setReloadToken((prev) => prev + 1);
  }, [allowedOrigins, currentUrl, openExternalFallback, startLoading]);

  return (
    <div style={shellStyle}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0, background: '#0f172a' }}>
        {frameUrl ? (
          <iframe
            key={`${frameUrl}:${reloadToken}`}
            src={frameUrl}
            title={app?.title || 'Hosted web app'}
            onLoad={() => {
              setLoadState('ready');
              setStatusMessage('Embedded inside KDOS.');
            }}
            onError={() => {
              setLoadState('fallback');
              setStatusMessage('This app could not be embedded cleanly. Open it externally for the full experience.');
            }}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="clipboard-read; clipboard-write; fullscreen"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff'
            }}
          />
        ) : null}

        {(loadState === 'error') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              padding: '24px',
              background: loadState === 'loading'
                ? 'linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.45) 100%)'
                : 'rgba(15,23,42,0.58)'
            }}
          >
            <div
              style={{
                width: 'min(100%, 460px)',
                borderRadius: '22px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(248,250,252,0.94)',
                boxShadow: '0 28px 70px rgba(2,6,23,0.32)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: loadState === 'loading' ? '#2563eb' : '#dc2626' }}>
                {loadState === 'loading' ? <RefreshCw size={18} /> : <AlertTriangle size={18} />}
                <span style={{ fontSize: '15px', fontWeight: 800 }}>
                  {loadState === 'loading' ? 'Loading hosted app' : 'External fallback recommended'}
                </span>
              </div>
              <div style={{ marginTop: '12px', color: '#334155', fontSize: '13px', lineHeight: 1.6 }}>
                {statusMessage}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleReload} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', gridAutoFlow: 'column', gap: '8px' }}>
                  <RefreshCw size={14} />
                  Retry
                </button>
                <button type="button" onClick={() => onOpenExternal?.(currentUrl || homeUrl)} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', gridAutoFlow: 'column', gap: '8px' }}>
                  <ExternalLink size={14} />
                  Open externally
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
