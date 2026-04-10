import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Home,
  Plus,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { OS_RUNTIME_MODES } from '../../os-core/constants';
import {
  DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
  DEFAULT_BROWSER_USER_AGENT,
  KDBROWSER_HOME_URL,
  KDBROWSER_SEARCH_URL_PREFIX,
  createBrowserTabRecord,
  createDefaultBrowserState,
  getBrowserPartition,
  getKDBrowserTitleFromUrl,
  sanitizeBrowserState
} from '../../os-core/browserState';
import RemoteBrowserViewport from './RemoteBrowserViewport.jsx';

const MAX_IFRAME_HISTORY = 24;
const POPUP_ONLY_HOST_PATTERNS = [
  /(^|\.)google\.com$/i,
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)gstatic\.com$/i,
  /(^|\.)youtube\.com$/i,
  /(^|\.)youtu\.be$/i,
  /(^|\.)github\.com$/i,
  /(^|\.)discord\.com$/i
];

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  background: 'linear-gradient(180deg, #dbeafe 0%, #e2e8f0 100%)'
};

const toolbarButtonStyle = {
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(255,255,255,0.94)',
  color: '#0f172a',
  minWidth: '34px',
  height: '34px',
  borderRadius: '10px',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

function normalizeNavigationInput(value, fallbackProtocol = 'https:') {
  const raw = String(value || '').trim();
  if (!raw) return KDBROWSER_HOME_URL;

  const looksLikeSearchQuery = /\s/.test(raw)
    || (!raw.includes('.') && !raw.includes(':') && !raw.startsWith('localhost') && !/^\d{1,3}(\.\d{1,3}){3}$/.test(raw));
  if (looksLikeSearchQuery) {
    return `${KDBROWSER_SEARCH_URL_PREFIX}${encodeURIComponent(raw)}`;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '';
  } catch {
    try {
      const parsed = new URL(`${fallbackProtocol}//${raw}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
      return '';
    }
  }
}

function getAddressBarValue(url = '') {
  return String(url || KDBROWSER_HOME_URL);
}

function getRuntimeDefaultCapabilities(runtimeMode) {
  const isDesktopRuntime = runtimeMode === OS_RUNTIME_MODES.DESKTOP_LOCAL || runtimeMode === OS_RUNTIME_MODES.DESKTOP_ISOLATED;
  return {
    ...DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
    embeddedBrowser: false,
    nativeBrowserWindow: isDesktopRuntime,
    popupTabs: isDesktopRuntime,
    persistentProfile: true,
    profileReset: true,
    openExternal: true
  };
}

function resolveSurfaceMode(runtimeMode, browserCapabilities, runtimeDefaultCapabilities) {
  if (browserCapabilities.nativeBrowserWindow || runtimeDefaultCapabilities.nativeBrowserWindow) {
    return 'native-window';
  }
  if (browserCapabilities.embeddedBrowser || runtimeDefaultCapabilities.embeddedBrowser) {
    return 'webview';
  }
  if (runtimeMode === OS_RUNTIME_MODES.WEB_DEMO && browserCapabilities.remoteBrowser && typeof browserCapabilities.remoteBrowser === 'boolean') {
    return 'remote';
  }
  if (runtimeMode === OS_RUNTIME_MODES.WEB_DEMO) {
    return 'iframe';
  }
  return 'unsupported';
}

function shouldUsePopupCompanion(url = '') {
  try {
    const parsed = new URL(normalizeNavigationInput(url));
    return POPUP_ONLY_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname || ''));
  } catch {
    return false;
  }
}

function isRemoteSessionMissingError(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /remote browser session not found/i.test(message);
}

function getInitialIframeState(url, title, displayMode = 'iframe') {
  const safeUrl = normalizeNavigationInput(url);
  const safeTitle = title || getKDBrowserTitleFromUrl(safeUrl);
  return {
    url: safeUrl,
    title: safeTitle,
    history: [safeUrl],
    historyIndex: 0,
    reloadToken: 0,
    isLoading: true,
    canGoBack: false,
    canGoForward: false,
    error: '',
    displayMode,
    popupBlocked: false,
    popupOpen: false
  };
}

export default function KDBrowserWindowContent({
  app,
  runtime,
  browserState,
  onBrowserStateChange,
  onOpenExternal
}) {
  const runtimeDefaultCapabilities = useMemo(
    () => getRuntimeDefaultCapabilities(runtime?.mode),
    [runtime?.mode]
  );
  const safeBrowserState = useMemo(
    () => sanitizeBrowserState(browserState),
    [browserState]
  );
  const profileId = safeBrowserState.profileId;
  const nativeWindowKey = useMemo(() => `kdbrowser:${profileId}`, [profileId]);
  const partition = useMemo(() => getBrowserPartition(profileId), [profileId]);
  const activeTab = useMemo(
    () => safeBrowserState.tabs.find((tab) => tab.id === safeBrowserState.activeTabId) || safeBrowserState.tabs[0],
    [safeBrowserState]
  );
  const [browserCapabilities, setBrowserCapabilities] = useState(runtimeDefaultCapabilities);
  const [addressValue, setAddressValue] = useState(getAddressBarValue(activeTab?.url));
  const [tabRuntimeState, setTabRuntimeState] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const webviewRefs = useRef(new Map());
  const webviewCleanupRefs = useRef(new Map());
  const iframeRefs = useRef(new Map());
  const popupWindowRefs = useRef(new Map());
  const nativeWindowOpenedRef = useRef(false);

  const surfaceMode = useMemo(
    () => resolveSurfaceMode(runtime?.mode, browserCapabilities, runtimeDefaultCapabilities),
    [browserCapabilities, runtime?.mode, runtimeDefaultCapabilities]
  );
  const isNativeWindowSurface = surfaceMode === 'native-window';

  const persistBrowserState = useCallback((updater) => {
    onBrowserStateChange?.((prevState) => {
      const baseState = sanitizeBrowserState(prevState || safeBrowserState, { profileId });
      const nextCandidate = typeof updater === 'function' ? updater(baseState) : updater;
      return sanitizeBrowserState(nextCandidate, { profileId });
    });
  }, [onBrowserStateChange, profileId, safeBrowserState]);

  const persistTabRecord = useCallback((tabId, url, title) => {
    if (!tabId || !url) return;
    const nextTitle = title || getKDBrowserTitleFromUrl(url);

    persistBrowserState((prevState) => ({
      ...prevState,
      tabs: prevState.tabs.map((tab) => (
        tab.id === tabId
          ? {
              ...tab,
              url,
              title: nextTitle,
              lastVisitedAt: new Date().toISOString()
            }
          : tab
      )),
      updatedAt: new Date().toISOString()
    }));
  }, [persistBrowserState]);

  const openExternalUrl = useCallback((url) => {
    const normalizedUrl = normalizeNavigationInput(url);
    if (!normalizedUrl) return;

    if (runtime?.browser?.openExternal) {
      runtime.browser.openExternal(normalizedUrl).catch(() => {
        onOpenExternal?.(normalizedUrl);
      });
      return;
    }

    onOpenExternal?.(normalizedUrl);
  }, [onOpenExternal, runtime]);

  const upsertTabState = useCallback((tabId, patch) => {
    setTabRuntimeState((prev) => ({
      ...prev,
      [tabId]: {
        ...(prev[tabId] || {}),
        ...(typeof patch === 'function' ? patch(prev[tabId] || {}) : patch)
      }
    }));
  }, []);

  const openPopupCompanion = useCallback((tabId, url, { focus = true } = {}) => {
    if (typeof window === 'undefined') return false;

    const normalizedUrl = normalizeNavigationInput(url);
    if (!normalizedUrl) return false;

    const popup = window.open(
      normalizedUrl,
      `kdbrowser-${tabId}`,
      'popup=yes,width=1320,height=840,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes'
    );

    if (!popup) {
      upsertTabState(tabId, {
        popupBlocked: true,
        popupOpen: false,
        displayMode: 'popup',
        isLoading: false,
        error: 'Browser blocked the companion window. Click the address bar action again or allow popups for this site.'
      });
      return false;
    }

    popupWindowRefs.current.set(tabId, popup);
    if (focus) {
      try {
        popup.focus();
      } catch {
        // Ignore focus failures.
      }
    }

    upsertTabState(tabId, {
      popupBlocked: false,
      popupOpen: true,
      displayMode: 'popup',
      isLoading: false,
      error: ''
    });
    return true;
  }, [upsertTabState]);

  const syncTabFromWebview = useCallback((tabId, node, overrides = {}) => {
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
      // Ignore transient guest state errors while the webview is warming up.
    }

    const nextUrl = url || overrides.url || '';
    const nextTitle = title || overrides.title || getKDBrowserTitleFromUrl(nextUrl);

    upsertTabState(tabId, {
      url: nextUrl,
      title: nextTitle,
      canGoBack,
      canGoForward,
      isLoading,
      error: ''
    });

    if (nextUrl) {
      persistTabRecord(tabId, nextUrl, nextTitle);
    }
  }, [persistTabRecord, upsertTabState]);

  const syncTabFromIframe = useCallback((tabId, node, overrides = {}) => {
    const existingState = tabRuntimeState[tabId] || {};
    let nextUrl = overrides.url || existingState.url || '';
    let nextTitle = overrides.title || existingState.title || '';
    let blockedInIframe = false;

    try {
      const candidateTitle = node?.contentDocument?.title;
      if (candidateTitle) nextTitle = candidateTitle;
    } catch {
      // Cross-origin iframe titles are not readable.
    }

    try {
      const candidateUrl = node?.contentWindow?.location?.href;
      if (typeof candidateUrl === 'string' && candidateUrl.startsWith('chrome-error://')) {
        blockedInIframe = true;
      }
      if (candidateUrl && /^https?:\/\//i.test(candidateUrl)) {
        nextUrl = candidateUrl;
      }
    } catch {
      // Cross-origin iframe locations are not readable.
    }

    try {
      const bodyText = node?.contentDocument?.body?.innerText || '';
      if (/refused to connect|x-frame-options|sameorigin/i.test(bodyText)) {
        blockedInIframe = true;
      }
    } catch {
      // Cross-origin iframe body is not readable.
    }

    const history = Array.isArray(existingState.history) && existingState.history.length
      ? existingState.history
      : [nextUrl || KDBROWSER_HOME_URL];
    const historyIndex = typeof existingState.historyIndex === 'number'
      ? existingState.historyIndex
      : Math.max(0, history.length - 1);
    const resolvedTitle = nextTitle || getKDBrowserTitleFromUrl(nextUrl);

    upsertTabState(tabId, {
      url: nextUrl,
      title: resolvedTitle,
      history,
      historyIndex,
      isLoading: false,
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex < history.length - 1,
      error: blockedInIframe ? 'This site blocks embedded browsing in web mode. Use the companion browser window for this tab.' : '',
      displayMode: blockedInIframe ? 'popup' : (existingState.displayMode || 'iframe'),
      popupBlocked: false
    });

    if (nextUrl) {
      persistTabRecord(tabId, nextUrl, resolvedTitle);
    }
  }, [persistTabRecord, tabRuntimeState, upsertTabState]);

  const attachWebviewNode = useCallback((tabId, node) => {
    const existingNode = webviewRefs.current.get(tabId);
    if (existingNode === node) return;

    const existingCleanup = webviewCleanupRefs.current.get(tabId);
    if (existingCleanup) {
      existingCleanup();
      webviewCleanupRefs.current.delete(tabId);
    }

    if (!node) {
      webviewRefs.current.delete(tabId);
      return;
    }

    webviewRefs.current.set(tabId, node);

    const handleStartLoading = () => {
      upsertTabState(tabId, { isLoading: true, error: '' });
    };
    const handleStopLoading = () => {
      syncTabFromWebview(tabId, node);
    };
    const handleTitleUpdated = (event) => {
      syncTabFromWebview(tabId, node, { title: event?.title });
    };
    const handleDidNavigate = (event) => {
      syncTabFromWebview(tabId, node, { url: event?.url });
    };
    const handleDidNavigateInPage = (event) => {
      syncTabFromWebview(tabId, node, { url: event?.url });
    };
    const handleDidFailLoad = (event) => {
      if (event?.isMainFrame === false || event?.errorCode === -3) return;
      upsertTabState(tabId, {
        isLoading: false,
        error: event?.errorDescription || 'This page could not be loaded in KDBROWSER.'
      });
    };
    const handleDomReady = () => {
      syncTabFromWebview(tabId, node);
    };

    node.addEventListener('did-start-loading', handleStartLoading);
    node.addEventListener('did-stop-loading', handleStopLoading);
    node.addEventListener('page-title-updated', handleTitleUpdated);
    node.addEventListener('did-navigate', handleDidNavigate);
    node.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    node.addEventListener('did-fail-load', handleDidFailLoad);
    node.addEventListener('dom-ready', handleDomReady);

    webviewCleanupRefs.current.set(tabId, () => {
      node.removeEventListener('did-start-loading', handleStartLoading);
      node.removeEventListener('did-stop-loading', handleStopLoading);
      node.removeEventListener('page-title-updated', handleTitleUpdated);
      node.removeEventListener('did-navigate', handleDidNavigate);
      node.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      node.removeEventListener('did-fail-load', handleDidFailLoad);
      node.removeEventListener('dom-ready', handleDomReady);
    });
  }, [syncTabFromWebview, upsertTabState]);

  const updateIframeHistoryState = useCallback((tabId, url, options = {}) => {
    const normalizedUrl = normalizeNavigationInput(url);
    const nextTitle = options.title || getKDBrowserTitleFromUrl(normalizedUrl);

    upsertTabState(tabId, (prevState) => {
      const sourceHistory = Array.isArray(prevState.history) && prevState.history.length
        ? prevState.history
        : [prevState.url || normalizedUrl];
      const sourceIndex = typeof prevState.historyIndex === 'number'
        ? prevState.historyIndex
        : Math.max(0, sourceHistory.length - 1);

      let history = sourceHistory;
      let historyIndex = sourceIndex;

      if (options.historyMode === 'replace') {
        history = [...sourceHistory];
        history[historyIndex] = normalizedUrl;
      } else if (options.historyMode === 'jump') {
        historyIndex = Math.max(0, Math.min(sourceHistory.length - 1, options.historyIndex ?? sourceIndex));
      } else if (options.historyMode === 'preserve') {
        history = sourceHistory;
      } else {
        const branch = sourceHistory.slice(0, sourceIndex + 1);
        if (branch[branch.length - 1] !== normalizedUrl) {
          branch.push(normalizedUrl);
        }
        history = branch.slice(-MAX_IFRAME_HISTORY);
        historyIndex = history.length - 1;
      }

      return {
        ...prevState,
        url: normalizedUrl,
        title: nextTitle,
        history,
        historyIndex,
        reloadToken: options.reload ? (prevState.reloadToken || 0) + 1 : (prevState.reloadToken || 0),
        isLoading: true,
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < history.length - 1,
        error: ''
      };
    });
  }, [upsertTabState]);

  const createTab = useCallback((url = KDBROWSER_HOME_URL, options = {}) => {
    const normalizedUrl = normalizeNavigationInput(url);
    if (!normalizedUrl) {
      setStatusMessage('Enter a valid http or https URL.');
      return;
    }

    const nextTab = createBrowserTabRecord({
      url: normalizedUrl,
      title: options.title || getKDBrowserTitleFromUrl(normalizedUrl)
    });

    persistBrowserState((prevState) => ({
      ...prevState,
      activeTabId: options.activate === false ? prevState.activeTabId : nextTab.id,
      tabs: [...prevState.tabs, nextTab].slice(-16),
      updatedAt: new Date().toISOString()
    }));

    if (surfaceMode === 'native-window') {
      upsertTabState(nextTab.id, {
        url: normalizedUrl,
        title: nextTab.title,
        isLoading: true,
        canGoBack: false,
        canGoForward: false,
        error: ''
      });
    } else if (surfaceMode === 'webview') {
      upsertTabState(nextTab.id, {
        url: normalizedUrl,
        title: nextTab.title,
        isLoading: true,
        canGoBack: false,
        canGoForward: false,
        error: ''
      });
    } else if (surfaceMode === 'remote') {
      upsertTabState(nextTab.id, {
        url: normalizedUrl,
        title: nextTab.title,
        remoteSessionId: '',
        remoteCommittedUrl: '',
        remoteRevision: 0,
        remoteViewportWidth: 1440,
        remoteViewportHeight: 900,
        isLoading: true,
        canGoBack: false,
        canGoForward: false,
        error: ''
      });
    } else if (surfaceMode === 'iframe') {
      const shouldOpenPopup = shouldUsePopupCompanion(normalizedUrl);
      upsertTabState(nextTab.id, getInitialIframeState(normalizedUrl, nextTab.title, shouldOpenPopup ? 'popup' : 'iframe'));
      if (shouldOpenPopup) {
        openPopupCompanion(nextTab.id, normalizedUrl);
      }
    } else {
      openExternalUrl(normalizedUrl);
    }

    setStatusMessage('');
  }, [openExternalUrl, openPopupCompanion, persistBrowserState, surfaceMode, upsertTabState]);

  const updateTabUrl = useCallback((tabId, url, options = {}) => {
    const normalizedUrl = normalizeNavigationInput(url);
    if (!normalizedUrl) {
      setStatusMessage('Enter a valid http or https URL.');
      return;
    }

    if (!tabId) {
      createTab(normalizedUrl, options);
      return;
    }

    const nextTitle = options.title || getKDBrowserTitleFromUrl(normalizedUrl);
    setStatusMessage('');
    persistTabRecord(tabId, normalizedUrl, nextTitle);

    if (surfaceMode === 'native-window') {
      upsertTabState(tabId, {
        url: normalizedUrl,
        title: nextTitle,
        isLoading: true,
        error: ''
      });

      if (runtime?.browser?.native?.navigate) {
        runtime.browser.native.navigate(nativeWindowKey, normalizedUrl)
          .catch((error) => {
            upsertTabState(tabId, {
              isLoading: false,
              error: error instanceof Error ? error.message : 'This page could not be opened in the native KDOS browser window.'
            });
          });
      }
      return;
    }

    if (surfaceMode === 'iframe') {
      const shouldOpenPopup = shouldUsePopupCompanion(normalizedUrl);
      updateIframeHistoryState(tabId, normalizedUrl, { title: nextTitle, historyMode: options.historyMode || 'push' });
      upsertTabState(tabId, {
        displayMode: shouldOpenPopup ? 'popup' : 'iframe',
        popupBlocked: false,
        popupOpen: shouldOpenPopup ? Boolean(popupWindowRefs.current.get(tabId) && !popupWindowRefs.current.get(tabId).closed) : false,
        error: shouldOpenPopup ? '' : undefined
      });
      if (shouldOpenPopup) {
        openPopupCompanion(tabId, normalizedUrl);
      }
      return;
    }

    if (surfaceMode === 'remote') {
      const sessionId = tabRuntimeState[tabId]?.remoteSessionId || '';
      upsertTabState(tabId, {
        url: normalizedUrl,
        title: nextTitle,
        isLoading: true,
        error: ''
      });

      if (sessionId && runtime?.browser?.remote?.navigate) {
        runtime.browser.remote.navigate(sessionId, normalizedUrl)
          .then((session) => {
            upsertTabState(tabId, {
              remoteSessionId: session.sessionId,
              remoteCommittedUrl: session.url,
              remoteRevision: session.revision,
              remoteViewportWidth: session.width,
              remoteViewportHeight: session.height,
              url: session.url || normalizedUrl,
              title: session.title || nextTitle,
              isLoading: Boolean(session.isLoading),
              canGoBack: Boolean(session.canGoBack),
              canGoForward: Boolean(session.canGoForward),
              error: session.error || ''
            });
            if (session.url) {
              persistTabRecord(tabId, session.url, session.title || nextTitle);
            }
          })
          .catch((error) => {
            if (isRemoteSessionMissingError(error)) {
              upsertTabState(tabId, {
                remoteSessionId: '',
                remoteCommittedUrl: '',
                remoteRevision: 0,
                isLoading: true,
                error: ''
              });
              return;
            }
            upsertTabState(tabId, {
              isLoading: false,
              error: error instanceof Error ? error.message : 'This page could not be opened in the remote browser session.'
            });
          });
      }
      return;
    }

    upsertTabState(tabId, {
      url: normalizedUrl,
      title: nextTitle,
      isLoading: surfaceMode === 'webview',
      canGoBack: false,
      canGoForward: false,
      error: ''
    });

    if (surfaceMode !== 'webview') {
      openExternalUrl(normalizedUrl);
      return;
    }

    const webview = webviewRefs.current.get(tabId);
    if (webview?.loadURL) {
      try {
        webview.loadURL(normalizedUrl);
      } catch {
        upsertTabState(tabId, {
          isLoading: false,
          error: 'This page could not be opened in KDBROWSER.'
        });
      }
    }
  }, [createTab, nativeWindowKey, openExternalUrl, openPopupCompanion, persistTabRecord, runtime, surfaceMode, tabRuntimeState, updateIframeHistoryState, upsertTabState]);

  const closeTab = useCallback((tabId) => {
    const remoteSessionId = tabRuntimeState[tabId]?.remoteSessionId || '';
    if (remoteSessionId && runtime?.browser?.remote?.closeSession) {
      runtime.browser.remote.closeSession(remoteSessionId).catch(() => {});
    }

    persistBrowserState((prevState) => {
      const remainingTabs = prevState.tabs.filter((tab) => tab.id !== tabId);

      if (!remainingTabs.length) {
        return createDefaultBrowserState({
          profileId: prevState.profileId,
          updatedAt: new Date().toISOString()
        });
      }

      const closedIndex = prevState.tabs.findIndex((tab) => tab.id === tabId);
      const nextActiveTab = prevState.activeTabId === tabId
        ? remainingTabs[Math.max(0, closedIndex - 1)] || remainingTabs[0]
        : remainingTabs.find((tab) => tab.id === prevState.activeTabId) || remainingTabs[0];

      return {
        ...prevState,
        activeTabId: nextActiveTab?.id || remainingTabs[0].id,
        tabs: remainingTabs,
        updatedAt: new Date().toISOString()
      };
    });

    setTabRuntimeState((prev) => {
      if (!(tabId in prev)) return prev;
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  }, [persistBrowserState, runtime, tabRuntimeState]);

  const activateTab = useCallback((tabId) => {
    persistBrowserState((prevState) => ({
      ...prevState,
      activeTabId: tabId,
      updatedAt: prevState.updatedAt
    }));
  }, [persistBrowserState]);

  const runActiveSurfaceAction = useCallback((action) => {
    const currentTab = activeTab;
    if (!currentTab) return;

    if (surfaceMode === 'native-window') {
      if (!runtime?.browser?.native?.action) return;
      runtime.browser.native.action(nativeWindowKey, action)
        .catch((error) => {
          upsertTabState(currentTab.id, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Native browser action failed.'
          });
        });
      return;
    }

    if (surfaceMode === 'webview') {
      const node = webviewRefs.current.get(currentTab.id);
      if (!node) return;

      try {
        if (action === 'back' && node.canGoBack?.()) node.goBack();
        if (action === 'forward' && node.canGoForward?.()) node.goForward();
        if (action === 'reload') node.reload?.();
      } catch {
        // Ignore transient guest errors.
      }

      window.setTimeout(() => {
        syncTabFromWebview(currentTab.id, node);
      }, 60);
      return;
    }

    if (surfaceMode === 'remote') {
      const sessionId = tabRuntimeState[currentTab.id]?.remoteSessionId || '';
      if (!sessionId || !runtime?.browser?.remote?.action) return;

      runtime.browser.remote.action(sessionId, action)
        .then((session) => {
          upsertTabState(currentTab.id, {
            remoteSessionId: session.sessionId,
            remoteCommittedUrl: session.url,
            remoteRevision: session.revision,
            remoteViewportWidth: session.width,
            remoteViewportHeight: session.height,
            url: session.url || currentTab.url,
            title: session.title || currentTab.title,
            isLoading: Boolean(session.isLoading),
            canGoBack: Boolean(session.canGoBack),
            canGoForward: Boolean(session.canGoForward),
            error: session.error || ''
          });
          if (session.url) {
            persistTabRecord(currentTab.id, session.url, session.title || currentTab.title);
          }
        })
        .catch((error) => {
          if (isRemoteSessionMissingError(error)) {
            upsertTabState(currentTab.id, {
              remoteSessionId: '',
              remoteCommittedUrl: '',
              remoteRevision: 0,
              isLoading: true,
              error: ''
            });
            return;
          }
          upsertTabState(currentTab.id, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Remote browser action failed.'
          });
        });
      return;
    }

    if (surfaceMode !== 'iframe') return;

    const currentState = tabRuntimeState[currentTab.id] || getInitialIframeState(currentTab.url, currentTab.title);
    const history = Array.isArray(currentState.history) && currentState.history.length
      ? currentState.history
      : [currentState.url || currentTab.url || KDBROWSER_HOME_URL];
    const historyIndex = typeof currentState.historyIndex === 'number'
      ? currentState.historyIndex
      : Math.max(0, history.length - 1);

    if (action === 'reload') {
      updateIframeHistoryState(currentTab.id, currentState.url || currentTab.url || KDBROWSER_HOME_URL, {
        title: currentState.title || currentTab.title,
        historyMode: 'preserve',
        reload: true
      });
      return;
    }

    const nextIndex = action === 'back' ? historyIndex - 1 : historyIndex + 1;
    if (nextIndex < 0 || nextIndex >= history.length) return;

    const nextUrl = history[nextIndex];
    const nextTitle = getKDBrowserTitleFromUrl(nextUrl);
    persistTabRecord(currentTab.id, nextUrl, nextTitle);
    updateIframeHistoryState(currentTab.id, nextUrl, {
      title: nextTitle,
      historyMode: 'jump',
      historyIndex: nextIndex
    });
    if (shouldUsePopupCompanion(nextUrl)) {
      openPopupCompanion(currentTab.id, nextUrl);
      upsertTabState(currentTab.id, { displayMode: 'popup' });
    } else {
      upsertTabState(currentTab.id, { displayMode: 'iframe', popupOpen: false });
    }
  }, [activeTab, nativeWindowKey, openPopupCompanion, persistTabRecord, runtime, surfaceMode, syncTabFromWebview, tabRuntimeState, updateIframeHistoryState, upsertTabState]);

  useEffect(() => {
    let active = true;

    Promise.resolve(runtime?.browser?.getCapabilities?.() || runtimeDefaultCapabilities)
      .then((capabilities) => {
        if (!active) return;
        setBrowserCapabilities({
          ...runtimeDefaultCapabilities,
          ...(capabilities || {})
        });
      })
      .catch(() => {
        if (!active) return;
        setBrowserCapabilities(runtimeDefaultCapabilities);
      });

    return () => {
      active = false;
    };
  }, [runtime, runtimeDefaultCapabilities]);

  useEffect(() => {
    setAddressValue(getAddressBarValue(activeTab?.url));
  }, [activeTab?.id, activeTab?.url]);

  useEffect(() => {
    if (!isNativeWindowSurface || !activeTab?.id || !runtime?.browser?.native?.openWindow) return undefined;

    runtime.browser.native.openWindow({
      windowKey: nativeWindowKey,
      profileId,
      title: activeTab.title || app?.title || 'KDBROWSER',
      url: activeTab.url || KDBROWSER_HOME_URL,
      homeUrl: KDBROWSER_HOME_URL,
      ownerAppId: app?.type || 'kdbrowser',
      focus: !nativeWindowOpenedRef.current
    }).catch((error) => {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to open the native KDOS browser window.');
    });
    nativeWindowOpenedRef.current = true;

    return undefined;
  }, [activeTab?.id, activeTab?.title, activeTab?.url, app?.title, app?.type, isNativeWindowSurface, nativeWindowKey, profileId, runtime]);

  useEffect(() => {
    if (!isNativeWindowSurface || !runtime?.browser?.native?.onState) return undefined;

    const unsubscribe = runtime.browser.native.onState((payload) => {
      if (!payload || payload.windowKey !== nativeWindowKey) return;
      if (!activeTab?.id) return;

      upsertTabState(activeTab.id, {
        url: payload.url || activeTab.url,
        title: payload.title || activeTab.title,
        isLoading: Boolean(payload.isLoading),
        canGoBack: Boolean(payload.canGoBack),
        canGoForward: Boolean(payload.canGoForward),
        error: payload.error || ''
      });

      if (payload.url) {
        persistTabRecord(activeTab.id, payload.url, payload.title || activeTab.title);
      }

      setStatusMessage(payload.error || '');
    });

    return () => {
      unsubscribe?.();
    };
  }, [activeTab?.id, activeTab?.title, activeTab?.url, isNativeWindowSurface, nativeWindowKey, persistTabRecord, runtime, upsertTabState]);

  useEffect(() => {
    if (!isNativeWindowSurface || !runtime?.browser?.native?.closeWindow) return undefined;

    return () => {
      nativeWindowOpenedRef.current = false;
      runtime.browser.native.closeWindow(nativeWindowKey).catch(() => {});
    };
  }, [isNativeWindowSurface, nativeWindowKey, runtime]);

  useEffect(() => {
    if (!runtime?.browser?.onWindowOpenRequested) return undefined;

    runtime.browser.onWindowOpenRequested((payload) => {
      if (!payload?.url) return;
      if (payload.profileId && payload.profileId !== profileId) return;
      createTab(payload.url, {
        activate: true,
        title: payload.title || getKDBrowserTitleFromUrl(payload.url)
      });
    });

    return () => {
      runtime.browser.onWindowOpenRequested(null);
    };
  }, [createTab, profileId, runtime]);

  useEffect(() => {
    const validTabIds = new Set(safeBrowserState.tabs.map((tab) => tab.id));
    setTabRuntimeState((prev) => {
      const next = {};
      let changed = false;

      safeBrowserState.tabs.forEach((tab) => {
        if (prev[tab.id]) {
          next[tab.id] = prev[tab.id];
          return;
        }

        changed = true;
        next[tab.id] = surfaceMode === 'iframe'
          ? getInitialIframeState(tab.url, tab.title, shouldUsePopupCompanion(tab.url) ? 'popup' : 'iframe')
          : (surfaceMode === 'remote'
            ? {
                url: tab.url,
                title: tab.title,
                remoteSessionId: '',
                remoteCommittedUrl: '',
                remoteRevision: 0,
                remoteViewportWidth: 1440,
                remoteViewportHeight: 900,
                isLoading: true,
                canGoBack: false,
                canGoForward: false,
                error: ''
              }
            : {});
      });

      if (Object.keys(prev).some((tabId) => !validTabIds.has(tabId))) {
        changed = true;
      }

      return changed ? next : prev;
    });

    webviewRefs.current.forEach((node, tabId) => {
      if (!validTabIds.has(tabId)) {
        const cleanup = webviewCleanupRefs.current.get(tabId);
        if (cleanup) cleanup();
        webviewCleanupRefs.current.delete(tabId);
        webviewRefs.current.delete(tabId);
      }
    });

    iframeRefs.current.forEach((node, tabId) => {
      if (!validTabIds.has(tabId)) {
        iframeRefs.current.delete(tabId);
      }
    });
  }, [safeBrowserState.tabs, surfaceMode]);

  useEffect(() => () => {
    webviewCleanupRefs.current.forEach((cleanup) => cleanup());
    webviewCleanupRefs.current.clear();
    webviewRefs.current.clear();
    iframeRefs.current.clear();
    popupWindowRefs.current.clear();
  }, []);

  useEffect(() => {
    if (surfaceMode !== 'iframe' || typeof window === 'undefined') return undefined;

    const intervalId = window.setInterval(() => {
      setTabRuntimeState((prev) => {
        let changed = false;
        const next = { ...prev };

        Object.entries(next).forEach(([tabId, state]) => {
          const popupRef = popupWindowRefs.current.get(tabId);
          if (!popupRef) return;
          const popupOpen = !popupRef.closed;
          if (state.popupOpen !== popupOpen) {
            next[tabId] = {
              ...state,
              popupOpen
            };
            changed = true;
          }
          if (!popupOpen) {
            popupWindowRefs.current.delete(tabId);
          }
        });

        return changed ? next : prev;
      });
    }, 1200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [surfaceMode]);

  const activeTabRuntime = activeTab ? (tabRuntimeState[activeTab.id] || {}) : {};
  const activeTabUrl = activeTabRuntime.url || activeTab?.url || KDBROWSER_HOME_URL;
  const activeTabError = activeTabRuntime.error || '';
  const canGoBack = surfaceMode === 'native-window' || surfaceMode === 'webview' || surfaceMode === 'remote'
    ? Boolean(activeTabRuntime.canGoBack)
    : Boolean(activeTabRuntime.historyIndex > 0);
  const canGoForward = surfaceMode === 'native-window' || surfaceMode === 'webview' || surfaceMode === 'remote'
    ? Boolean(activeTabRuntime.canGoForward)
    : Boolean(
      Array.isArray(activeTabRuntime.history)
      && activeTabRuntime.history.length
      && activeTabRuntime.historyIndex < activeTabRuntime.history.length - 1
    );

  return (
    <div style={shellStyle}>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(148,163,184,0.18)', background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(241,245,249,0.94) 100%)' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {safeBrowserState.tabs.map((tab) => {
            const runtimeState = tabRuntimeState[tab.id] || {};
            const isActive = tab.id === safeBrowserState.activeTabId;
            const title = runtimeState.title || tab.title || getKDBrowserTitleFromUrl(tab.url);

            return (
              <div
                key={tab.id}
                style={{
                  minWidth: '128px',
                  maxWidth: '184px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '12px',
                  border: isActive ? '1px solid rgba(37,99,235,0.28)' : '1px solid rgba(148,163,184,0.16)',
                  background: isActive ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(219,234,254,0.94) 100%)' : 'rgba(255,255,255,0.76)',
                  color: '#0f172a',
                  boxShadow: isActive ? '0 12px 24px rgba(59,130,246,0.1)' : 'none',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  onClick={() => activateTab(tab.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0 10px',
                    flex: 1,
                    height: '100%'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '999px', background: runtimeState.isLoading ? '#2563eb' : '#22c55e', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, textAlign: 'left', fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title}
                  </div>
                </button>
                {safeBrowserState.tabs.length > 1 ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.id);
                    }}
                    style={{ marginLeft: 'auto', marginRight: '8px', border: 'none', background: 'transparent', color: '#64748b', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => createTab()}
            style={toolbarButtonStyle}
          >
            <Plus size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => runActiveSurfaceAction('back')} disabled={!canGoBack} style={{ ...toolbarButtonStyle, opacity: canGoBack ? 1 : 0.45, cursor: canGoBack ? 'pointer' : 'not-allowed' }}>
              <ArrowLeft size={15} />
            </button>
            <button type="button" onClick={() => runActiveSurfaceAction('forward')} disabled={!canGoForward} style={{ ...toolbarButtonStyle, opacity: canGoForward ? 1 : 0.45, cursor: canGoForward ? 'pointer' : 'not-allowed' }}>
              <ArrowRight size={15} />
            </button>
            <button type="button" onClick={() => runActiveSurfaceAction('reload')} style={toolbarButtonStyle}>
              <RefreshCw size={15} />
            </button>
            <button type="button" onClick={() => updateTabUrl(activeTab?.id, KDBROWSER_HOME_URL, { title: 'DuckDuckGo' })} style={toolbarButtonStyle}>
              <Home size={15} />
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!activeTab?.id) return;
              updateTabUrl(activeTab.id, addressValue);
            }}
            style={{ flex: '1 1 340px', minWidth: '240px', display: 'flex', alignItems: 'center', position: 'relative' }}
          >
            <Search size={15} color="rgba(71,85,105,0.82)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              value={addressValue}
              onChange={(event) => setAddressValue(event.target.value)}
              placeholder="Enter URL or search"
              style={{
                width: '100%',
                minHeight: '36px',
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(255,255,255,0.97)',
                color: '#0f172a',
                padding: '0 12px 0 38px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </form>

          {!isNativeWindowSurface ? (
            <button
              type="button"
              onClick={() => openExternalUrl(activeTabUrl)}
              style={toolbarButtonStyle}
              title="Open in external browser"
            >
              <ExternalLink size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {(statusMessage || activeTabError) ? (
        <div style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#7c2d12', background: 'rgba(254,242,242,0.96)', borderBottom: '1px solid rgba(248,113,113,0.2)' }}>
          {statusMessage || activeTabError}
        </div>
      ) : null}

      <div style={{ position: 'relative', flex: 1, minHeight: 0, background: '#ffffff' }}>
        {surfaceMode === 'native-window' ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)' }}>
            <div style={{ width: 'min(520px, calc(100% - 32px))', borderRadius: '24px', border: '1px solid rgba(125,211,252,0.28)', background: 'rgba(255,255,255,0.9)', boxShadow: '0 24px 60px rgba(15,23,42,0.12)', padding: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Native KDOS browser window is active</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', marginBottom: '16px' }}>
                Browsing now runs in a dedicated Electron browser window so sign-in flows and heavy sites behave more like a real desktop browser inside KDOS.
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', wordBreak: 'break-word' }}>
                {activeTabUrl}
              </div>
              <button
                type="button"
                onClick={() => runtime?.browser?.native?.action?.(nativeWindowKey, 'focus').catch(() => {})}
                style={{ ...toolbarButtonStyle, width: 'auto', minWidth: 'auto', padding: '0 16px', fontWeight: 700 }}
              >
                Focus browser window
              </button>
            </div>
          </div>
        ) : null}

        {surfaceMode === 'webview' ? safeBrowserState.tabs.map((tab) => (
          <webview
            key={tab.id}
            ref={(node) => attachWebviewNode(tab.id, node)}
            src={tab.url}
            partition={partition}
            useragent={DEFAULT_BROWSER_USER_AGENT}
            allowpopups="true"
            allowFullScreen="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: tab.id === activeTab?.id ? 'block' : 'none',
              background: '#fff'
            }}
          />
        )) : null}

        {surfaceMode === 'remote' && activeTab ? (
          <RemoteBrowserViewport
            key={activeTab.id}
            active
            profileId={profileId}
            remoteState={tabRuntimeState[activeTab.id] || {}}
            runtime={runtime}
            tab={activeTab}
            onPersistedUpdate={(url, title) => {
              persistTabRecord(activeTab.id, url, title || activeTab.title);
            }}
            onStatePatch={(patch) => {
              upsertTabState(activeTab.id, patch);
            }}
          />
        ) : null}

        {surfaceMode === 'iframe' ? safeBrowserState.tabs.map((tab) => {
          const runtimeState = tabRuntimeState[tab.id] || getInitialIframeState(tab.url, tab.title);
          const iframeUrl = runtimeState.url || tab.url || KDBROWSER_HOME_URL;
          const iframeKey = `${tab.id}:${runtimeState.reloadToken || 0}:${iframeUrl}`;
          const displayMode = runtimeState.displayMode || (shouldUsePopupCompanion(iframeUrl) ? 'popup' : 'iframe');

          if (displayMode === 'popup') {
            return (
              <div
                key={tab.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: tab.id === activeTab?.id ? 'grid' : 'none',
                  placeItems: 'center',
                  background: 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(226,232,240,0.98) 100%)',
                  padding: '24px'
                }}
              >
                <div style={{ width: 'min(100%, 520px)', borderRadius: '22px', border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.96)', boxShadow: '0 24px 64px rgba(15,23,42,0.12)', padding: '22px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Browser companion active
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '13px', lineHeight: 1.7, color: '#475569' }}>
                    This site blocks embedded browsing in web mode, so KDBROWSER opens it in a separate browser window while keeping the tab inside KDOS.
                  </div>
                  <div style={{ marginTop: '14px', borderRadius: '14px', background: 'rgba(241,245,249,0.95)', border: '1px solid rgba(226,232,240,0.96)', padding: '12px 14px', fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>
                    {iframeUrl}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const popupRef = popupWindowRefs.current.get(tab.id);
                        if (popupRef && !popupRef.closed) {
                          popupRef.focus();
                          upsertTabState(tab.id, { popupOpen: true, popupBlocked: false });
                          return;
                        }
                        openPopupCompanion(tab.id, iframeUrl);
                      }}
                      style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', display: 'inline-flex', gap: '8px' }}
                    >
                      <ExternalLink size={14} />
                      {runtimeState.popupOpen ? 'Focus window' : 'Open window'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openExternalUrl(iframeUrl)}
                      style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 14px', display: 'inline-flex', gap: '8px' }}
                    >
                      <ExternalLink size={14} />
                      Open external
                    </button>
                  </div>
                  {runtimeState.popupBlocked ? (
                    <div style={{ marginTop: '14px', fontSize: '12px', color: '#9a3412', lineHeight: 1.6 }}>
                      Browser popup was blocked. Allow popups for this KDOS tab, then click <strong>Open window</strong> again.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }

          return (
            <iframe
              key={iframeKey}
              ref={(node) => {
                if (!node) {
                  iframeRefs.current.delete(tab.id);
                  return;
                }
                iframeRefs.current.set(tab.id, node);
              }}
              src={iframeUrl}
              title={runtimeState.title || tab.title || getKDBrowserTitleFromUrl(iframeUrl)}
              allow="autoplay; camera; clipboard-read; clipboard-write; fullscreen; geolocation; microphone"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                display: tab.id === activeTab?.id ? 'block' : 'none',
                background: '#fff'
              }}
              onLoad={(event) => {
                syncTabFromIframe(tab.id, event.currentTarget);
              }}
              onError={() => {
                upsertTabState(tab.id, {
                  isLoading: false,
                  displayMode: 'popup',
                  error: 'This site blocked embedded browsing in web mode. Open it in the companion browser window instead.'
                });
              }}
            />
          );
        }) : null}

        {surfaceMode === 'unsupported' ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#fff', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
            {app?.title || 'KDBROWSER'} is unavailable in this runtime.
          </div>
        ) : null}
      </div>
    </div>
  );
}
