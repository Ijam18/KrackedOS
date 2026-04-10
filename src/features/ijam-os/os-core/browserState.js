export const KDBROWSER_INTERNAL_START_URL = 'kdbrowser://start';
export const KDBROWSER_HOME_URL = 'https://duckduckgo.com/';
export const KDBROWSER_SEARCH_URL_PREFIX = 'https://duckduckgo.com/?q=';
export const DEFAULT_BROWSER_PROFILE_ID = 'main';
export const DEFAULT_BROWSER_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
export const DEFAULT_BROWSER_RUNTIME_CAPABILITIES = {
  embeddedBrowser: false,
  nativeBrowserWindow: false,
  remoteBrowser: false,
  popupTabs: false,
  persistentProfile: false,
  profileReset: false,
  openExternal: true
};

const MAX_TABS = 16;
const MAX_TITLE_LENGTH = 160;
const MAX_URL_LENGTH = 4096;

function createTabId() {
  return `browser-tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function isKDBrowserInternalUrl(url = '') {
  return clampString(url, MAX_URL_LENGTH).startsWith('kdbrowser://');
}

export function getKDBrowserTitleFromUrl(url = '') {
  if (isKDBrowserInternalUrl(url)) return 'Start';

  const safeUrl = clampString(url, MAX_URL_LENGTH);
  if (!safeUrl) return 'New tab';

  try {
    const parsed = new URL(safeUrl);
    return (parsed.hostname || parsed.toString()).replace(/^www\./i, '').slice(0, MAX_TITLE_LENGTH) || 'New tab';
  } catch {
    return safeUrl.slice(0, MAX_TITLE_LENGTH) || 'New tab';
  }
}

export function sanitizeBrowserProfileId(value = DEFAULT_BROWSER_PROFILE_ID) {
  const safeValue = clampString(value, 80).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-');
  return safeValue || DEFAULT_BROWSER_PROFILE_ID;
}

export function getBrowserPartition(profileId = DEFAULT_BROWSER_PROFILE_ID) {
  return `persist:kdbrowser:${sanitizeBrowserProfileId(profileId)}`;
}

export function getBrowserProfileIdFromPartition(partition = '') {
  const safePartition = clampString(partition, 160);
  const prefix = 'persist:kdbrowser:';
  if (!safePartition.startsWith(prefix)) return DEFAULT_BROWSER_PROFILE_ID;
  return sanitizeBrowserProfileId(safePartition.slice(prefix.length));
}

export function createBrowserTabRecord({ id, url, title, lastVisitedAt } = {}) {
  const rawUrl = clampString(url, MAX_URL_LENGTH);
  const safeUrl = rawUrl && !isKDBrowserInternalUrl(rawUrl) ? rawUrl : KDBROWSER_HOME_URL;
  const safeTitle = clampString(title, MAX_TITLE_LENGTH) || getKDBrowserTitleFromUrl(safeUrl);

  return {
    id: clampString(id, 120) || createTabId(),
    url: safeUrl,
    title: safeTitle,
    lastVisitedAt: typeof lastVisitedAt === 'string' ? lastVisitedAt : new Date().toISOString()
  };
}

export function createDefaultBrowserState({ profileId = DEFAULT_BROWSER_PROFILE_ID, updatedAt = null } = {}) {
  const startTab = createBrowserTabRecord({
    url: KDBROWSER_HOME_URL,
    title: 'DuckDuckGo'
  });

  return {
    profileId: sanitizeBrowserProfileId(profileId),
    activeTabId: startTab.id,
    tabs: [startTab],
    updatedAt
  };
}

export const DEFAULT_BROWSER_STATE = createDefaultBrowserState();

export function sanitizeBrowserState(value, { profileId = undefined } = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const safeProfileId = sanitizeBrowserProfileId(profileId || source.profileId || DEFAULT_BROWSER_PROFILE_ID);
  const rawTabs = Array.isArray(source.tabs) ? source.tabs.slice(0, MAX_TABS) : [];
  const tabs = rawTabs
    .map((tab) => createBrowserTabRecord(tab))
    .filter((tab, index, collection) => collection.findIndex((candidate) => candidate.id === tab.id) === index);

  const nextTabs = tabs.length ? tabs : createDefaultBrowserState({ profileId: safeProfileId }).tabs;
  const activeTabId = nextTabs.some((tab) => tab.id === source.activeTabId)
    ? source.activeTabId
    : nextTabs[0].id;

  return {
    profileId: safeProfileId,
    activeTabId,
    tabs: nextTabs,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null
  };
}
