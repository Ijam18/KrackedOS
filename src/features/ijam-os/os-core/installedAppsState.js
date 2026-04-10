import { KDSTORE_CATALOG } from '../constants/kdStoreCatalog.js';

export const INSTALLED_APPS_STATE_VERSION = 1;

export const DEFAULT_INSTALLED_APPS_STATE = {
  version: INSTALLED_APPS_STATE_VERSION,
  installedIds: [],
  seededCatalogIds: [],
  updatedAt: null
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeStringArray(value, maxLength = 256, maxItemLength = 120) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, maxItemLength))
    .slice(0, maxLength);
}

export function sanitizeInstalledAppsState(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    ...DEFAULT_INSTALLED_APPS_STATE,
    ...source,
    version: Number.isFinite(source.version)
      ? Math.max(INSTALLED_APPS_STATE_VERSION, Math.min(source.version, 1000))
      : DEFAULT_INSTALLED_APPS_STATE.version,
    installedIds: sanitizeStringArray(source.installedIds),
    seededCatalogIds: sanitizeStringArray(source.seededCatalogIds),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null
  };
}

export function applyCatalogAutoInstallSeed(value, catalog = KDSTORE_CATALOG) {
  const base = sanitizeInstalledAppsState(value);
  const installedIds = new Set(base.installedIds);
  const seededCatalogIds = new Set(base.seededCatalogIds);
  let hasChanges = false;

  catalog.forEach((item) => {
    if (!item?.id || item.autoInstall !== true || seededCatalogIds.has(item.id)) return;
    seededCatalogIds.add(item.id);
    if (!installedIds.has(item.id)) {
      installedIds.add(item.id);
    }
    hasChanges = true;
  });

  if (!hasChanges) return base;

  return sanitizeInstalledAppsState({
    ...base,
    installedIds: [...installedIds],
    seededCatalogIds: [...seededCatalogIds],
    updatedAt: new Date().toISOString()
  });
}

export function hasInstalledAppsStateChanged(left, right) {
  const safeLeft = sanitizeInstalledAppsState(left);
  const safeRight = sanitizeInstalledAppsState(right);
  return JSON.stringify(safeLeft) !== JSON.stringify(safeRight);
}
