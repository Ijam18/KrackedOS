import {
  BUILT_IN_WALLPAPERS,
  DEFAULT_DESKTOP_LAYOUT,
  DEFAULT_PERSONALIZATION,
  DEFAULT_PROFILE,
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
} from './constants';
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
} from './pathUtils';
import { deleteEntry, getAllEntries, getEntry, getMeta, putEntry, setMeta } from './idb';

const MIGRATION_META_KEY = 'legacyMigrationVersion';

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

      const layoutPayload = {
        slots: safeJsonParse(
          typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.desktopIconSlots) : '',
          []
        ),
        legacyOrder: safeJsonParse(
          typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.desktopIconOrder) : '',
          []
        ),
        updatedAt: now
      };
      await writeJsonFile(WORKSPACE_PATHS.desktopLayout, layoutPayload);
      migratedItems.push('desktop-layout');

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

      const personalization = {
        ...DEFAULT_PERSONALIZATION,
        currentWallpaperId: normalizeLegacyWallpaperId(
          typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.wallpaper) : ''
        ),
        lastUpdatedAt: now
      };
      await writeJsonFile(WORKSPACE_PATHS.personalization, personalization);
      migratedItems.push('personalization');

      const session = {
        ...DEFAULT_SESSION_STATE,
        isBooted: typeof window !== 'undefined'
          ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.booted) === 'true'
          : false,
        lastBootedAt: typeof window !== 'undefined' && window.localStorage.getItem(LEGACY_STORAGE_KEYS.booted) === 'true'
          ? now
          : null,
        lastRuntimeMode: OS_RUNTIME_MODES.WEB_DEMO
      };
      await writeJsonFile(WORKSPACE_PATHS.session, session);
      migratedItems.push('session');

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
      const fileLayout = await readJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT);
      const localLayout = safeJsonParse(
        typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_STORAGE_KEYS.desktopLayout) : '',
        null
      );

      if (localLayout && typeof localLayout === 'object') {
        return {
          ...DEFAULT_DESKTOP_LAYOUT,
          ...fileLayout,
          ...localLayout
        };
      }

      return fileLayout;
    },

    async saveDesktopLayout(layout) {
      const nextLayout = {
        ...DEFAULT_DESKTOP_LAYOUT,
        ...(layout || {}),
        updatedAt: new Date().toISOString()
      };
      await writeJsonFile(WORKSPACE_PATHS.desktopLayout, nextLayout);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.desktopLayout, JSON.stringify(nextLayout));
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.desktopIconSlots, JSON.stringify(Array.isArray(nextLayout.slots) ? nextLayout.slots : []));
        window.localStorage.setItem(LEGACY_STORAGE_KEYS.desktopIconOrder, JSON.stringify(Array.isArray(nextLayout.legacyOrder) ? nextLayout.legacyOrder : []));
      }
    },

    async loadSession() {
      await seedWorkspaceScaffold();
      return readJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE);
    },

    async saveSession(session) {
      await writeJsonFile(WORKSPACE_PATHS.session, {
        ...DEFAULT_SESSION_STATE,
        ...(session || {})
      });
    },

    async loadPersonalization() {
      await seedWorkspaceScaffold();
      return readJsonFile(WORKSPACE_PATHS.personalization, {
        ...DEFAULT_PERSONALIZATION,
        currentWallpaperId: getDefaultWallpaperId()
      });
    },

    async savePersonalization(personalization) {
      await writeJsonFile(WORKSPACE_PATHS.personalization, {
        ...DEFAULT_PERSONALIZATION,
        ...(personalization || {}),
        lastUpdatedAt: new Date().toISOString()
      });
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

  return {
    mode: OS_RUNTIME_MODES.WEB_DEMO,
    capabilities: {
      realFs: false,
      wallpaperFiles: true,
      containers: false
    },
    fs: fsProvider,
    wallpaper: wallpaperProvider,
    settings: settingsProvider,
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
