import {
  BUILT_IN_WALLPAPERS,
  DEFAULT_DESKTOP_LAYOUT,
  DEFAULT_EXPLORER_PREFERENCES,
  DEFAULT_PERSONALIZATION,
  DEFAULT_PROFILE,
  DEFAULT_SHELL_SESSION,
  DEFAULT_SESSION_STATE,
  LEGACY_STORAGE_KEYS,
  MIGRATION_VERSION,
  OS_RUNTIME_MODES,
  WORKSPACE_DIRECTORIES,
  WORKSPACE_PATHS,
  createMountRegistryRecord,
  createSystemRegistryRecord,
  getDefaultWallpaperId,
  normalizeLegacyWallpaperId
} from './constants.js';
import {
  basenameFromPath,
  createEntryRecord,
  dataUrlToExtension,
  dataUrlToMimeType,
  dirnameFromPath,
  extnameFromPath,
  isChildPath,
  isPathEqual,
  joinOsPath,
  normalizeOsPath,
  sanitizeFileName,
  sortEntries
} from './pathUtils.js';
import { deleteEntry, getAllEntries, getEntry, getMeta, putEntry, setMeta } from './idb.js';
import {
  DEFAULT_BROWSER_PROFILE_ID,
  DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
  DEFAULT_BROWSER_STATE,
  createDefaultBrowserState,
  sanitizeBrowserProfileId,
  sanitizeBrowserState
} from './browserState.js';
import {
  DEFAULT_INSTALLED_APPS_STATE,
  applyCatalogAutoInstallSeed,
  hasInstalledAppsStateChanged,
  sanitizeInstalledAppsState
} from './installedAppsState.js';

const MIGRATION_META_KEY = 'legacyMigrationVersion';
const REMOTE_BROWSER_BASE_PATH = '/__kdbrowser-remote';

function safeJsonParse(rawValue, fallbackValue) {
  if (!rawValue) return fallbackValue;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function cloneJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeExternalUrl(value, fallbackProtocol = 'https:') {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';

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

function sanitizeStringArray(value, maxLength = 64, maxItemLength = 260) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, maxItemLength))
    .slice(0, maxLength);
}

async function requestRemoteBrowser(path, { method = 'GET', body = undefined } = {}) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    throw new Error('Remote browser bridge is only available in the browser runtime.');
  }

  const response = await fetch(`${REMOTE_BROWSER_BASE_PATH}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? safeJsonParse(text, null) : null;

  if (!response.ok) {
    throw new Error(payload?.error || `Remote browser request failed with status ${response.status}.`);
  }

  return payload;
}

function sanitizeWindowStates(value) {
  if (!isPlainObject(value)) return {};
  const next = {};

  Object.entries(value).forEach(([key, rawState]) => {
    if (typeof key !== 'string' || !isPlainObject(rawState)) return;
    const state = {
      isOpen: Boolean(rawState.isOpen),
      isMinimized: Boolean(rawState.isMinimized),
      isMaximized: Boolean(rawState.isMaximized),
      zIndex: clampNumber(rawState.zIndex, 0, 10000, 0)
    };

    if (Number.isFinite(rawState.x)) state.x = rawState.x;
    if (Number.isFinite(rawState.y)) state.y = rawState.y;
    if (Number.isFinite(rawState.w)) state.w = rawState.w;
    if (Number.isFinite(rawState.h)) state.h = rawState.h;

    next[key] = state;
  });

  return next;
}

function sanitizeExplorerPreferences(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    path: sanitizeStringArray(source.path),
    view: source.view === 'list' ? 'list' : DEFAULT_EXPLORER_PREFERENCES.view,
    showDetailsPane: typeof source.showDetailsPane === 'boolean'
      ? source.showDetailsPane
      : DEFAULT_EXPLORER_PREFERENCES.showDetailsPane,
    sort: source.sort === 'name-desc' ? 'name-desc' : DEFAULT_EXPLORER_PREFERENCES.sort
  };
}

function sanitizeShellState(value) {
  const source = isPlainObject(value?.shell) ? value.shell : (isPlainObject(value) ? value : {});
  return {
    focusedWindow: typeof source.focusedWindow === 'string' ? source.focusedWindow : null,
    startMenu: {
      isOpen: Boolean(source.startMenu?.isOpen),
      search: typeof source.startMenu?.search === 'string' ? source.startMenu.search.slice(0, 120) : ''
    },
    windowStates: sanitizeWindowStates(source.windowStates || value?.windowLayout),
    explorerPreferences: sanitizeExplorerPreferences(source.explorerPreferences || value?.explorerPreferences),
    windowZCounter: clampNumber(source.windowZCounter ?? value?.windowZCounter, 100, 10000, DEFAULT_SHELL_SESSION.windowZCounter)
  };
}

function sanitizeSessionState(value) {
  const source = isPlainObject(value) ? value : {};
  const shell = sanitizeShellState(source);
  const runtimeModes = Object.values(OS_RUNTIME_MODES);

  return {
    ...DEFAULT_SESSION_STATE,
    ...source,
    isBooted: Boolean(source.isBooted),
    lastBootedAt: typeof source.lastBootedAt === 'string' ? source.lastBootedAt : null,
    lastRuntimeMode: runtimeModes.includes(source.lastRuntimeMode) ? source.lastRuntimeMode : DEFAULT_SESSION_STATE.lastRuntimeMode,
    windowLayout: shell.windowStates,
    explorerPreferences: shell.explorerPreferences,
    windowZCounter: shell.windowZCounter,
    focusedWindow: shell.focusedWindow,
    shell
  };
}

function sanitizeDesktopLayoutState(value) {
  const source = isPlainObject(value) ? value : {};
  const slots = Array.isArray(source.slots)
    ? source.slots.slice(0, 256).map((item) => (typeof item === 'string' ? item : null))
    : [];
  const legacyOrder = sanitizeStringArray(source.legacyOrder, 256, 120);
  const positions = isPlainObject(source.positions)
    ? Object.fromEntries(
        Object.entries(source.positions)
          .filter(([key, pos]) => typeof key === 'string' && isPlainObject(pos))
          .map(([key, pos]) => [key, {
            column: clampNumber(pos.column, 0, 256, 0),
            row: clampNumber(pos.row, 0, 256, 0)
          }])
      )
    : null;

  return {
    ...DEFAULT_DESKTOP_LAYOUT,
    ...source,
    slots,
    legacyOrder,
    positions,
    layoutVersion: Number.isFinite(source.layoutVersion) ? clampNumber(source.layoutVersion, 0, 1000, 0) : source.layoutVersion,
    grid: isPlainObject(source.grid)
      ? {
          columns: clampNumber(source.grid.columns, 0, 256, 0),
          rows: clampNumber(source.grid.rows, 0, 256, 0)
        }
      : null,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null
  };
}

function sanitizePersonalizationState(value) {
  const source = isPlainObject(value) ? value : {};
  const validFits = new Set(['fill', 'contain', 'cover']);
  return {
    ...DEFAULT_PERSONALIZATION,
    ...source,
    currentWallpaperId: typeof source.currentWallpaperId === 'string' && source.currentWallpaperId
      ? source.currentWallpaperId
      : getDefaultWallpaperId(),
    fit: validFits.has(source.fit) ? source.fit : DEFAULT_PERSONALIZATION.fit,
    history: Array.isArray(source.history)
      ? source.history
          .filter((entry) => isPlainObject(entry) && typeof entry.id === 'string' && entry.id)
          .slice(0, 20)
          .map((entry) => ({ id: entry.id, changedAt: typeof entry.changedAt === 'string' ? entry.changedAt : null }))
      : [],
    importedWallpaperIds: sanitizeStringArray(source.importedWallpaperIds, 100, 260),
    lastUpdatedAt: typeof source.lastUpdatedAt === 'string' ? source.lastUpdatedAt : null
  };
}

function toTimestamp(value) {
  const parsed = Date.parse(typeof value === 'string' ? value : '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function choosePreferredState(fileValue, localValue, sanitize) {
  const sanitizedFile = sanitize(fileValue);
  if (!isPlainObject(localValue)) return sanitizedFile;
  const sanitizedLocal = sanitize(localValue);
  const fileTimestamp = Math.max(toTimestamp(sanitizedFile.updatedAt), toTimestamp(sanitizedFile.lastUpdatedAt));
  const localTimestamp = Math.max(toTimestamp(sanitizedLocal.updatedAt), toTimestamp(sanitizedLocal.lastUpdatedAt));
  return fileTimestamp >= localTimestamp ? sanitizedFile : sanitizedLocal;
}

async function ensureDirectory(path, source = 'workspace') {
  const normalizedPath = normalizeOsPath(path);
  const existing = await getEntry(normalizedPath);
  if (existing) return existing;
  const entry = createEntryRecord(normalizedPath, {
    type: 'directory',
    source,
    fileKind: 'folder'
  });
  await putEntry(entry);
  return entry;
}

async function ensureJsonFile(path, value, source = 'workspace', readonly = false) {
  const normalizedPath = normalizeOsPath(path);
  const existing = await getEntry(normalizedPath);
  if (existing) return existing;
  const entry = createEntryRecord(normalizedPath, {
    content: JSON.stringify(value, null, 2),
    mimeType: 'application/json',
    ext: '.json',
    fileKind: 'json',
    source,
    readonly
  });
  await putEntry(entry);
  return entry;
}

async function writeJsonFile(path, value, overrides = {}) {
  const normalizedPath = normalizeOsPath(path);
  await ensureDirectory(dirnameFromPath(normalizedPath));
  await putEntry(
    createEntryRecord(normalizedPath, {
      content: JSON.stringify(value, null, 2),
      mimeType: 'application/json',
      ext: '.json',
      fileKind: 'json',
      source: overrides.source || 'workspace',
      readonly: Boolean(overrides.readonly),
      createdAt: overrides.createdAt,
      updatedAt: new Date().toISOString(),
      meta: overrides.meta || {}
    })
  );
}

async function readJsonFile(path, fallbackValue) {
  const entry = await getEntry(normalizeOsPath(path));
  if (!entry?.content) return cloneJsonValue(fallbackValue);
  return safeJsonParse(entry.content, cloneJsonValue(fallbackValue));
}

async function seedWorkspaceScaffold() {
  for (const directoryPath of WORKSPACE_DIRECTORIES) {
    await ensureDirectory(directoryPath);
  }

  await ensureJsonFile(WORKSPACE_PATHS.registry, createSystemRegistryRecord(), 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.mountsConfig, createMountRegistryRecord(), 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.profile, DEFAULT_PROFILE, 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.personalization, {
    ...DEFAULT_PERSONALIZATION,
    currentWallpaperId: getDefaultWallpaperId()
  });
  await ensureJsonFile(WORKSPACE_PATHS.installedApps, DEFAULT_INSTALLED_APPS_STATE, 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.browserState, DEFAULT_BROWSER_STATE, 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT, 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE, 'workspace');
  await ensureJsonFile(WORKSPACE_PATHS.communityResources, [], 'workspace');
}

function toUrlShortcutFileName(resource, index) {
  const baseName = sanitizeFileName(resource.title || resource.name || `resource-${index + 1}`);
  return baseName.toLowerCase().endsWith('.url') ? baseName : `${baseName}.url`;
}

function toLessonFileName(lesson) {
  return `${sanitizeFileName(lesson.title || lesson.id || 'lesson')}.lesson`;
}

function createUnsupportedContainerProvider() {
  return {
    async probe() {
      return {
        supported: false,
        reason: 'Container execution is not available in the browser runtime.'
      };
    },
    async createWorkspace() {
      throw new Error('Container execution is not available in the browser runtime.');
    },
    async start() {
      throw new Error('Container execution is not available in the browser runtime.');
    },
    async stop() {
      throw new Error('Container execution is not available in the browser runtime.');
    },
    async exec() {
      throw new Error('Container execution is not available in the browser runtime.');
    }
  };
}

export function createLegacyBrowserAdapter() {
  const mountState = {
    lessons: []
  };

  const fsProvider = {
    async mountWorkspace() {
      await seedWorkspaceScaffold();
      return {
        root: WORKSPACE_PATHS.root,
        userRoot: WORKSPACE_PATHS.user,
        runtimeMode: OS_RUNTIME_MODES.WEB_DEMO
      };
    },

    bindMountData(payload = {}) {
      mountState.lessons = Array.isArray(payload.lessons) ? payload.lessons : mountState.lessons;
    },

    async list(path) {
      await seedWorkspaceScaffold();
      const normalizedPath = normalizeOsPath(path);

      if (isPathEqual(normalizedPath, WORKSPACE_PATHS.builtInWallpapers)) {
        return BUILT_IN_WALLPAPERS.map((wallpaper) =>
          createEntryRecord(joinOsPath(WORKSPACE_PATHS.builtInWallpapers, `${wallpaper.id}.wallpaper.json`), {
            type: 'file',
            ext: '.json',
            fileKind: 'wallpaper',
            source: 'virtual',
            readonly: true,
            mimeType: 'application/json',
            content: JSON.stringify(wallpaper, null, 2),
            meta: {
              wallpaperId: wallpaper.id,
              logicalType: 'wallpaper',
              wallpaper
            }
          })
        );
      }

      if (isPathEqual(normalizedPath, WORKSPACE_PATHS.lessonsMount)) {
        const stageNames = [...new Set((mountState.lessons || []).map((lesson) => lesson.stage).filter(Boolean))];
        return sortEntries(
          stageNames.map((stage) =>
            createEntryRecord(joinOsPath(WORKSPACE_PATHS.lessonsMount, stage), {
              type: 'directory',
              source: 'virtual',
              readonly: true,
              fileKind: 'folder',
              meta: {
                logicalType: 'lesson-stage',
                stage
              }
            })
          )
        );
      }

      if (isChildPath(WORKSPACE_PATHS.lessonsMount, normalizedPath)) {
        const stageName = basenameFromPath(normalizedPath);
        return sortEntries(
          (mountState.lessons || [])
            .filter((lesson) => lesson.stage === stageName)
            .map((lesson) =>
              createEntryRecord(joinOsPath(normalizedPath, toLessonFileName(lesson)), {
                type: 'file',
                ext: '.lesson',
                fileKind: 'lesson',
                source: 'virtual',
                readonly: true,
                mimeType: 'application/json',
                content: JSON.stringify(lesson, null, 2),
                meta: {
                  logicalType: 'lesson',
                  lessonId: lesson.id,
                  lesson
                }
              })
            )
        );
      }

      const allEntries = await getAllEntries();
      return sortEntries(allEntries.filter((entry) => isPathEqual(entry.parentPath, normalizedPath)));
    },

    async read(path) {
      await seedWorkspaceScaffold();
      const normalizedPath = normalizeOsPath(path);

      if (isChildPath(WORKSPACE_PATHS.lessonsMount, normalizedPath)) {
        const parentPath = dirnameFromPath(normalizedPath);
        const lesson = (mountState.lessons || []).find((item) => {
          const expectedPath = joinOsPath(parentPath, toLessonFileName(item));
          return isPathEqual(expectedPath, normalizedPath);
        });
        return lesson ? JSON.stringify(lesson, null, 2) : '';
      }

      const entry = await getEntry(normalizedPath);
      if (!entry) throw new Error(`Entry not found: ${normalizedPath}`);
      return entry.content ?? '';
    },

    async write(path, data, overrides = {}) {
      await seedWorkspaceScaffold();
      const normalizedPath = normalizeOsPath(path);
      await ensureDirectory(dirnameFromPath(normalizedPath));

      const existing = await getEntry(normalizedPath);
      if (existing?.readonly) throw new Error(`Entry is read-only: ${normalizedPath}`);

      await putEntry(
        createEntryRecord(normalizedPath, {
          content: data,
          mimeType: overrides.mimeType || existing?.mimeType || 'text/plain',
          ext: overrides.ext || extnameFromPath(normalizedPath),
          fileKind: overrides.fileKind || existing?.fileKind || 'file',
          source: overrides.source || existing?.source || 'workspace',
          readonly: false,
          createdAt: existing?.createdAt,
          updatedAt: new Date().toISOString(),
          meta: { ...(existing?.meta || {}), ...(overrides.meta || {}) }
        })
      );
    },

    async mkdir(path) {
      await ensureDirectory(path);
    },

    async rename(path, nextName) {
      const normalizedPath = normalizeOsPath(path);
      const existing = await getEntry(normalizedPath);
      if (!existing) throw new Error(`Entry not found: ${normalizedPath}`);
      if (existing.readonly) throw new Error(`Entry is read-only: ${normalizedPath}`);

      const parentPath = dirnameFromPath(normalizedPath);
      const nextPath = joinOsPath(parentPath, sanitizeFileName(nextName, existing.name));
      const allEntries = await getAllEntries();
      const impactedEntries = allEntries.filter(
        (entry) => isPathEqual(entry.path, normalizedPath) || isChildPath(normalizedPath, entry.path)
      );

      for (const entry of impactedEntries) {
        const suffix = entry.path.slice(normalizedPath.length);
        await deleteEntry(entry.path);
        await putEntry(
          createEntryRecord(`${nextPath}${suffix}`, {
            ...entry,
            name: isPathEqual(entry.path, normalizedPath) ? basenameFromPath(nextPath) : entry.name,
            parentPath: isPathEqual(entry.path, normalizedPath)
              ? parentPath
              : dirnameFromPath(`${nextPath}${suffix}`),
            createdAt: entry.createdAt,
            updatedAt: new Date().toISOString()
          })
        );
      }

      return nextPath;
    },

    async moveToTrash(path) {
      const normalizedPath = normalizeOsPath(path);
      const existing = await getEntry(normalizedPath);
      if (!existing) throw new Error(`Entry not found: ${normalizedPath}`);
      if (existing.readonly) throw new Error(`Entry is read-only: ${normalizedPath}`);

      const timestamp = Date.now();
      const trashRoot = joinOsPath(WORKSPACE_PATHS.trash, `${timestamp}-${sanitizeFileName(existing.name, 'entry')}`);
      const allEntries = await getAllEntries();
      const impactedEntries = allEntries.filter(
        (entry) => isPathEqual(entry.path, normalizedPath) || isChildPath(normalizedPath, entry.path)
      );

      for (const entry of impactedEntries) {
        const suffix = entry.path.slice(normalizedPath.length);
        await deleteEntry(entry.path);
        await putEntry(
          createEntryRecord(`${trashRoot}${suffix}`, {
            ...entry,
            name: isPathEqual(entry.path, normalizedPath) ? basenameFromPath(trashRoot) : entry.name,
            parentPath: isPathEqual(entry.path, normalizedPath)
              ? WORKSPACE_PATHS.trash
              : dirnameFromPath(`${trashRoot}${suffix}`),
            createdAt: entry.createdAt,
            updatedAt: new Date().toISOString(),
            meta: {
              ...(entry.meta || {}),
              originalPath: isPathEqual(entry.path, normalizedPath)
                ? normalizedPath
                : `${normalizedPath}${suffix}`,
              trashedAt: new Date().toISOString(),
              logicalType: entry.meta?.logicalType || entry.fileKind || entry.type
            }
          })
        );
      }

      return trashRoot;
    },

    async restoreFromTrash(path) {
      const normalizedPath = normalizeOsPath(path);
      const existing = await getEntry(normalizedPath);
      if (!existing) throw new Error(`Trash entry not found: ${normalizedPath}`);

      const targetRoot = existing.meta?.originalPath;
      if (!targetRoot) throw new Error(`Trash entry is missing originalPath: ${normalizedPath}`);

      const allEntries = await getAllEntries();
      const impactedEntries = allEntries.filter(
        (entry) => isPathEqual(entry.path, normalizedPath) || isChildPath(normalizedPath, entry.path)
      );

      for (const entry of impactedEntries) {
        const suffix = entry.path.slice(normalizedPath.length);
        await deleteEntry(entry.path);
        await putEntry(
          createEntryRecord(`${targetRoot}${suffix}`, {
            ...entry,
            name: isPathEqual(entry.path, normalizedPath) ? basenameFromPath(targetRoot) : entry.name,
            parentPath: isPathEqual(entry.path, normalizedPath)
              ? dirnameFromPath(targetRoot)
              : dirnameFromPath(`${targetRoot}${suffix}`),
            createdAt: entry.createdAt,
            updatedAt: new Date().toISOString(),
            meta: {
              ...(entry.meta || {}),
              originalPath: undefined,
              trashedAt: undefined
            }
          })
        );
      }

      return targetRoot;
    },

    async search(query, roots = [WORKSPACE_PATHS.root, WORKSPACE_PATHS.lessonsMount]) {
      await seedWorkspaceScaffold();
      const needle = String(query || '').trim().toLowerCase();
      if (!needle) return [];

      const allEntries = await getAllEntries();
      const rootPaths = roots.map((rootPath) => normalizeOsPath(rootPath));
      const workspaceMatches = allEntries.filter((entry) => {
        const withinRoots = rootPaths.some((rootPath) => isPathEqual(entry.path, rootPath) || isChildPath(rootPath, entry.path));
        if (!withinRoots) return false;
        return (
          entry.name.toLowerCase().includes(needle) ||
          String(entry.content || '').toLowerCase().includes(needle)
        );
      });

      const lessonMatches = (mountState.lessons || [])
        .filter((lesson) => {
          return (
            String(lesson.title || '').toLowerCase().includes(needle) ||
            String(lesson.summary || '').toLowerCase().includes(needle) ||
            String(lesson.stage || '').toLowerCase().includes(needle)
          );
        })
        .map((lesson) =>
          createEntryRecord(joinOsPath(WORKSPACE_PATHS.lessonsMount, lesson.stage || 'Lessons', toLessonFileName(lesson)), {
            type: 'file',
            ext: '.lesson',
            fileKind: 'lesson',
            source: 'virtual',
            readonly: true,
            mimeType: 'application/json',
            content: JSON.stringify(lesson, null, 2),
            meta: {
              logicalType: 'lesson',
              lessonId: lesson.id,
              lesson
            }
          })
        );

      return sortEntries([...workspaceMatches, ...lessonMatches]);
    }
  };

  const settingsProvider = {
    async migrateLegacy() {
      await seedWorkspaceScaffold();
      const existingMigration = await getMeta(MIGRATION_META_KEY);
      if (existingMigration?.value === MIGRATION_VERSION) {
        return {
          migrated: false,
          version: MIGRATION_VERSION,
          items: []
        };
      }

      const migratedItems = [];
      const now = new Date().toISOString();

      const profileRaw = safeJsonParse(
        typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.profile) : '',
        DEFAULT_PROFILE
      );
      const websiteUrl = typeof window !== 'undefined'
        ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.websiteUrl) || profileRaw.website_url || ''
        : '';
      const showcaseImage = typeof window !== 'undefined'
        ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.showcaseUrl) || profileRaw.showcase_image || ''
        : '';

      const nextProfile = {
        ...DEFAULT_PROFILE,
        ...profileRaw,
        website_url: websiteUrl,
        updated_at: profileRaw.updated_at || now
      };

      if (showcaseImage) {
        const ext = dataUrlToExtension(showcaseImage);
        const showcasePath = joinOsPath(WORKSPACE_PATHS.documents, `showcase-image.${ext}`);
        await fsProvider.write(showcasePath, showcaseImage, {
          mimeType: dataUrlToMimeType(showcaseImage),
          fileKind: 'image',
          meta: {
            logicalType: 'showcase-image'
          }
        });
        nextProfile.showcase_image = showcaseImage;
        nextProfile.showcase_image_path = showcasePath;
        migratedItems.push('showcase-image');
      }

      await writeJsonFile(WORKSPACE_PATHS.profile, nextProfile);
      migratedItems.push('profile');

      const currentLayout = await readJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT);
      const layoutPayload = sanitizeDesktopLayoutState({
        slots: safeJsonParse(
          typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.desktopIconSlots) : '',
          []
        ),
        legacyOrder: safeJsonParse(
          typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.desktopIconOrder) : '',
          []
        ),
        updatedAt: now
      });
      if (!Array.isArray(currentLayout?.slots) || currentLayout.slots.length === 0) {
        await writeJsonFile(WORKSPACE_PATHS.desktopLayout, layoutPayload);
        migratedItems.push('desktop-layout');
      }

      const communityResources = safeJsonParse(
        typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.communityResources) : '',
        []
      );
      await writeJsonFile(WORKSPACE_PATHS.communityResources, communityResources);
      for (const [index, resource] of communityResources.entries()) {
        const resourcePath = joinOsPath(WORKSPACE_PATHS.community, toUrlShortcutFileName(resource, index));
        await fsProvider.write(resourcePath, JSON.stringify(resource, null, 2), {
          mimeType: 'application/json',
          ext: '.url',
          fileKind: 'url',
          meta: {
            logicalType: 'url',
            resource
          }
        });
      }
      migratedItems.push('community-resources');

      const currentPersonalization = await readJsonFile(WORKSPACE_PATHS.personalization, DEFAULT_PERSONALIZATION);
      const personalization = sanitizePersonalizationState({
        ...DEFAULT_PERSONALIZATION,
        currentWallpaperId: normalizeLegacyWallpaperId(
          typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.wallpaper) : ''
        ),
        lastUpdatedAt: now
      });
      if ((currentPersonalization?.currentWallpaperId || getDefaultWallpaperId()) === getDefaultWallpaperId()) {
        await writeJsonFile(WORKSPACE_PATHS.personalization, personalization);
        migratedItems.push('personalization');
      }

      const currentSessionState = await readJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE);
      const session = sanitizeSessionState({
        ...DEFAULT_SESSION_STATE,
        isBooted: typeof window !== 'undefined'
          ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.booted) === 'true'
          : false,
        lastBootedAt: typeof window !== 'undefined' && window.localStorage.getItem(LEGACY_STORAGE_KEYS.booted) === 'true'
          ? now
          : null,
        lastRuntimeMode: OS_RUNTIME_MODES.WEB_DEMO
      });
      if (!currentSessionState?.isBooted && Object.keys(currentSessionState?.shell?.windowStates || {}).length === 0) {
        await writeJsonFile(WORKSPACE_PATHS.session, session);
        migratedItems.push('session');
      }

      await setMeta(MIGRATION_META_KEY, MIGRATION_VERSION);

      return {
        migrated: true,
        version: MIGRATION_VERSION,
        items: migratedItems
      };
    },

    async loadProfile() {
      await seedWorkspaceScaffold();
      return readJsonFile(WORKSPACE_PATHS.profile, DEFAULT_PROFILE);
    },

    async saveProfile(profile) {
      await writeJsonFile(WORKSPACE_PATHS.profile, {
        ...DEFAULT_PROFILE,
        ...(profile || {}),
        updated_at: new Date().toISOString()
      });
    },

    async loadDesktopLayout() {
      await seedWorkspaceScaffold();
      const fileLayout = sanitizeDesktopLayoutState(await readJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT));
      const localLayout = safeJsonParse(
        typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.desktopLayout) : '',
        null
      );
      return choosePreferredState(fileLayout, localLayout, sanitizeDesktopLayoutState);
    },

    async saveDesktopLayout(layout) {
      const nextLayout = sanitizeDesktopLayoutState({
        ...layout,
        updatedAt: new Date().toISOString()
      });
      await writeJsonFile(WORKSPACE_PATHS.desktopLayout, nextLayout);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.desktopLayout, JSON.stringify(nextLayout));
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.desktopIconSlots, JSON.stringify(Array.isArray(nextLayout.slots) ? nextLayout.slots : []));
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.desktopIconOrder, JSON.stringify(Array.isArray(nextLayout.legacyOrder) ? nextLayout.legacyOrder : []));
      }
    },

    async loadInstalledApps() {
      await seedWorkspaceScaffold();
      const fileState = sanitizeInstalledAppsState(await readJsonFile(WORKSPACE_PATHS.installedApps, DEFAULT_INSTALLED_APPS_STATE));
      const localState = safeJsonParse(
        typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.installedApps) : '',
        null
      );
      const preferredState = choosePreferredState(fileState, localState, sanitizeInstalledAppsState);
      const seededState = applyCatalogAutoInstallSeed(preferredState);

      if (hasInstalledAppsStateChanged(fileState, seededState)) {
        await writeJsonFile(WORKSPACE_PATHS.installedApps, seededState);
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.installedApps, JSON.stringify(seededState));
      }

      return seededState;
    },

    async saveInstalledApps(state) {
      const nextState = sanitizeInstalledAppsState({
        ...(state || {}),
        updatedAt: new Date().toISOString()
      });
      await writeJsonFile(WORKSPACE_PATHS.installedApps, nextState);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.installedApps, JSON.stringify(nextState));
      }
    },

    async loadSession() {
      await seedWorkspaceScaffold();
      return sanitizeSessionState(await readJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE));
    },

    async saveSession(session) {
      await writeJsonFile(WORKSPACE_PATHS.session, sanitizeSessionState(session));
    },

    async loadPersonalization() {
      await seedWorkspaceScaffold();
      return sanitizePersonalizationState(await readJsonFile(WORKSPACE_PATHS.personalization, {
        ...DEFAULT_PERSONALIZATION,
        currentWallpaperId: getDefaultWallpaperId()
      }));
    },

    async savePersonalization(personalization) {
      await writeJsonFile(WORKSPACE_PATHS.personalization, sanitizePersonalizationState({
        ...personalization,
        lastUpdatedAt: new Date().toISOString()
      }));
    },

    async loadCommunityResources() {
      await seedWorkspaceScaffold();
      return readJsonFile(WORKSPACE_PATHS.communityResources, []);
    },

    async saveCommunityResources(resources) {
      const nextResources = Array.isArray(resources) ? resources : [];
      await writeJsonFile(WORKSPACE_PATHS.communityResources, nextResources);
    }
  };

  const wallpaperProvider = {
    async list() {
      await seedWorkspaceScaffold();
      const importedEntries = await fsProvider.list(WORKSPACE_PATHS.importedWallpapers);
      return [
        ...BUILT_IN_WALLPAPERS,
        ...importedEntries
          .filter((entry) => entry.type === 'file')
          .map((entry) => ({
            id: entry.meta?.wallpaperId || `imported:${entry.path}`,
            name: entry.name,
            type: 'image',
            src: entry.content,
            source: 'imported',
            path: entry.path,
            fit: entry.meta?.fit || 'fill'
          }))
      ];
    },

    async import(source) {
      await seedWorkspaceScaffold();

      let name = `wallpaper-${Date.now()}.png`;
      let dataUrl = '';

      if (source instanceof File) {
        name = sanitizeFileName(source.name, name);
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error || new Error('Failed to read wallpaper file.'));
          reader.readAsDataURL(source);
        });
      } else if (typeof source === 'string') {
        dataUrl = source;
      } else {
        throw new Error('Unsupported wallpaper source.');
      }

      const wallpaperPath = joinOsPath(WORKSPACE_PATHS.importedWallpapers, name);
      const wallpaperId = `imported:${wallpaperPath}`;
      await fsProvider.write(wallpaperPath, dataUrl, {
        mimeType: dataUrlToMimeType(dataUrl),
        fileKind: 'image',
        meta: {
          logicalType: 'wallpaper',
          wallpaperId
        }
      });

      const personalization = await settingsProvider.loadPersonalization();
      const importedWallpaperIds = Array.from(
        new Set([...(personalization.importedWallpaperIds || []), wallpaperId])
      );
      await settingsProvider.savePersonalization({
        ...personalization,
        importedWallpaperIds
      });

      return {
        id: wallpaperId,
        name,
        type: 'image',
        src: dataUrl,
        source: 'imported',
        path: wallpaperPath
      };
    },

    async setCurrent(id, fit = 'fill') {
      const personalization = await settingsProvider.loadPersonalization();
      const history = [
        { id, changedAt: new Date().toISOString() },
        ...(personalization.history || []).filter((entry) => entry.id !== id)
      ].slice(0, 10);

      await settingsProvider.savePersonalization({
        ...personalization,
        currentWallpaperId: id,
        fit,
        history
      });
    },

    async getCurrent() {
      const personalization = await settingsProvider.loadPersonalization();
      const wallpapers = await this.list();
      const wallpaper = wallpapers.find((entry) => entry.id === personalization.currentWallpaperId)
        || wallpapers.find((entry) => entry.id === getDefaultWallpaperId())
        || wallpapers[0]
        || null;

      return {
        wallpaper,
        fit: personalization.fit || 'fill',
        history: personalization.history || []
      };
    }
  };

  const browserProvider = {
    async getCapabilities() {
      let remoteStatus = { available: false };

      try {
        remoteStatus = await requestRemoteBrowser('/status');
      } catch {
        remoteStatus = { available: false };
      }

      return {
        ...DEFAULT_BROWSER_RUNTIME_CAPABILITIES,
        embeddedBrowser: false,
        popupTabs: false,
        persistentProfile: false,
        profileReset: true,
        openExternal: true,
        remoteBrowser: Boolean(remoteStatus?.available)
      };
    },

    async loadState(profileId = DEFAULT_BROWSER_PROFILE_ID) {
      await seedWorkspaceScaffold();
      const fileState = sanitizeBrowserState(
        await readJsonFile(WORKSPACE_PATHS.browserState, DEFAULT_BROWSER_STATE),
        { profileId }
      );
      const localState = safeJsonParse(
        typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.browserState) : '',
        null
      );
      const preferredState = choosePreferredState(
        fileState,
        localState,
        (value) => sanitizeBrowserState(value, { profileId })
      );

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.browserState, JSON.stringify(preferredState));
      }

      return preferredState;
    },

    async saveState(state) {
      const nextState = sanitizeBrowserState({
        ...(state || {}),
        updatedAt: new Date().toISOString()
      });
      await writeJsonFile(WORKSPACE_PATHS.browserState, nextState);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.browserState, JSON.stringify(nextState));
      }

      return nextState;
    },

    async openExternal(url) {
      const normalizedUrl = normalizeExternalUrl(url);
      if (!normalizedUrl) {
        throw new Error(`Invalid URL: ${url}`);
      }

      const popup = typeof window !== 'undefined'
        ? window.open(normalizedUrl, '_blank', 'noopener,noreferrer')
        : null;

      return {
        ok: Boolean(popup) || typeof window === 'undefined',
        url: normalizedUrl
      };
    },

    async resetProfile(profileId = DEFAULT_BROWSER_PROFILE_ID) {
      const nextState = createDefaultBrowserState({
        profileId: sanitizeBrowserProfileId(profileId),
        updatedAt: new Date().toISOString()
      });
      await this.saveState(nextState);
      return { ok: true, profileId: nextState.profileId };
    },

    onWindowOpenRequested() {},

    native: {
      async openWindow() {
        throw new Error('Native browser windows are only available in Electron desktop mode.');
      },
      async getWindowState() {
        throw new Error('Native browser windows are only available in Electron desktop mode.');
      },
      async navigate() {
        throw new Error('Native browser windows are only available in Electron desktop mode.');
      },
      async action() {
        throw new Error('Native browser windows are only available in Electron desktop mode.');
      },
      async closeWindow() {
        return { ok: true };
      },
      onState() {
        return () => {};
      }
    },

    remote: {
      async getStatus() {
        try {
          return await requestRemoteBrowser('/status');
        } catch (error) {
          return {
            available: false,
            error: error instanceof Error ? error.message : 'Remote browser bridge is unavailable.'
          };
        }
      },

      createSession: (payload) => requestRemoteBrowser('/sessions', { method: 'POST', body: payload }),
      getSession: (sessionId) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}`),
      closeSession: (sessionId) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),
      navigate: (sessionId, url) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}/navigate`, {
        method: 'POST',
        body: { url }
      }),
      resize: (sessionId, width, height) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}/resize`, {
        method: 'POST',
        body: { width, height }
      }),
      action: (sessionId, action) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}/action`, {
        method: 'POST',
        body: { action }
      }),
      setActivity: (sessionId, active = true) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}/activity`, {
        method: 'POST',
        body: { active }
      }),
      input: (sessionId, event) => requestRemoteBrowser(`/sessions/${encodeURIComponent(sessionId)}/input`, {
        method: 'POST',
        body: { event }
      }),
      getStreamUrl: (sessionId) => {
        const path = `${REMOTE_BROWSER_BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/stream`;
        if (typeof window === 'undefined') return path;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}${path}`;
      },
      getFrameUrl: (sessionId, revision = 0) => `${REMOTE_BROWSER_BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/frame?revision=${encodeURIComponent(String(revision || 0))}&ts=${Date.now()}`
    }
  };

  return {
    mode: OS_RUNTIME_MODES.WEB_DEMO,
    capabilities: {
      realFs: false,
      wallpaperFiles: true,
      containers: false,
      power: false,
      device: false
    },
    device: {
      async getStatus() {
        const connection = typeof navigator !== 'undefined'
          ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection || null)
          : null;
        const connectionType = String(connection?.type || '').toLowerCase();
        const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '').toLowerCase() : '';
        const isMobileUa = /(android|iphone|ipad|ipod|mobile)/.test(ua);
        const isTouch = typeof navigator !== 'undefined' ? Number(navigator.maxTouchPoints || 0) > 1 : false;
        const transportType = !navigator?.onLine
          ? 'offline'
          : connectionType.includes('wifi')
            ? 'wifi'
            : connectionType.includes('ethernet')
              ? 'ethernet'
              : (!isMobileUa && !isTouch ? 'ethernet' : 'unknown');
        return {
          network: {
            online: typeof navigator !== 'undefined' ? Boolean(navigator.onLine) : true,
            transportType,
            adapterName: null,
            ssid: null,
            ip: null,
            canToggleWifi: false,
            canOpenSystemSettings: false,
            source: connection ? 'browser-connection-api' : 'browser-online-api'
          },
          audio: {
            volumePercent: null,
            muted: null,
            canSetVolume: false,
            source: 'unsupported'
          },
          display: {
            brightnessPercent: null,
            canSetBrightness: false,
            source: 'unsupported'
          },
          capability: {
            networkControl: false,
            audioControl: false,
            brightnessControl: false
          },
          meta: {
            runtime: OS_RUNTIME_MODES.WEB_DEMO,
            platform: 'browser',
            updatedAt: Date.now()
          }
        };
      },
      async setWifiEnabled() {
        return { ok: false, message: 'Unsupported in browser runtime.' };
      },
      async setVolume() {
        return { ok: false, message: 'Unsupported in browser runtime.' };
      },
      async setBrightness() {
        return { ok: false, message: 'Unsupported in browser runtime.' };
      }
    },
    power: {
      async getStatus() {
        return null;
      }
    },
    fs: fsProvider,
    wallpaper: wallpaperProvider,
    settings: settingsProvider,
    browser: browserProvider,
    containers: createUnsupportedContainerProvider(),
    async initialize() {
      await fsProvider.mountWorkspace();
      const migration = await settingsProvider.migrateLegacy();
      return {
        mode: OS_RUNTIME_MODES.WEB_DEMO,
        migration
      };
    }
  };
}
