import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILT_IN_WALLPAPERS,
  DEFAULT_DESKTOP_LAYOUT,
  DEFAULT_EXPLORER_PREFERENCES,
  DEFAULT_PERSONALIZATION,
  DEFAULT_PROFILE,
  DEFAULT_SHELL_SESSION,
  DEFAULT_SESSION_STATE,
  MIGRATION_VERSION,
  OS_RUNTIME_MODES,
  WORKSPACE_PATHS,
  getDefaultWallpaperId
} from '../src/features/ijam-os/os-core/constants.js';
import {
  basenameFromPath,
  dataUrlToExtension,
  dirnameFromPath,
  extnameFromPath,
  joinOsPath,
  normalizeOsPath,
  sanitizeFileName
} from '../src/features/ijam-os/os-core/pathUtils.js';
import { createPowerApi } from './power.js';
import { createDeviceApi } from './device.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homeRoot = path.join(os.homedir(), 'KRACKED_OS');
const metadataPath = path.join(homeRoot, 'system', 'entry-metadata.json');
const devServerUrl = process.env.KRACKED_OS_DEV_SERVER_URL || '';
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
const powerApi = createPowerApi();
const deviceApi = createDeviceApi();
const VALID_WALLPAPER_FITS = new Set(['fill', 'contain', 'cover']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeStringArray(value, maxLength = 64, maxItemLength = 260) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, maxItemLength))
    .slice(0, maxLength);
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
  return {
    ...DEFAULT_SESSION_STATE,
    ...source,
    isBooted: Boolean(source.isBooted),
    lastBootedAt: typeof source.lastBootedAt === 'string' ? source.lastBootedAt : null,
    lastRuntimeMode: Object.values(OS_RUNTIME_MODES).includes(source.lastRuntimeMode)
      ? source.lastRuntimeMode
      : DEFAULT_SESSION_STATE.lastRuntimeMode,
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
  return {
    ...DEFAULT_PERSONALIZATION,
    ...source,
    currentWallpaperId: typeof source.currentWallpaperId === 'string' && source.currentWallpaperId
      ? source.currentWallpaperId
      : getDefaultWallpaperId(),
    fit: VALID_WALLPAPER_FITS.has(source.fit) ? source.fit : DEFAULT_PERSONALIZATION.fit,
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

function assertOsPathInput(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Expected a non-empty workspace path string.');
  }
  return normalizeOsPath(value);
}

function assertFilePayload(data) {
  const validBinaryLike = data instanceof Uint8Array || Buffer.isBuffer(data);
  if (typeof data !== 'string' && !validBinaryLike) {
    throw new Error('Unsupported file payload type.');
  }
}

function assertOptionsObject(value) {
  if (value == null) return {};
  if (!isPlainObject(value)) throw new Error('Expected an options object.');
  return value;
}

function assertWallpaperPayload(payload) {
  const nextPayload = typeof payload === 'string' ? { dataUrl: payload } : payload;
  if (!isPlainObject(nextPayload) || typeof nextPayload.dataUrl !== 'string') {
    throw new Error('Unsupported wallpaper payload.');
  }
  if (!nextPayload.dataUrl.startsWith('data:image/')) {
    throw new Error('Wallpaper payload must be an image data URL.');
  }
  if (nextPayload.dataUrl.length > 12 * 1024 * 1024) {
    throw new Error('Wallpaper payload is too large.');
  }
  return nextPayload;
}

function toHostPath(osPath) {
  const normalized = normalizeOsPath(osPath);
  if (normalized === WORKSPACE_PATHS.root) return homeRoot;
  if (!normalized.startsWith(`${WORKSPACE_PATHS.root}\\`)) {
    throw new Error(`Unsupported workspace path: ${normalized}`);
  }
  const relativePath = normalized.slice(WORKSPACE_PATHS.root.length + 1).split('\\');
  return path.join(homeRoot, ...relativePath);
}

function toOsPath(hostPath) {
  const relativePath = path.relative(homeRoot, hostPath);
  if (!relativePath || relativePath === '.') return WORKSPACE_PATHS.root;
  return normalizeOsPath(joinOsPath(WORKSPACE_PATHS.root, relativePath.replaceAll(path.sep, '\\')));
}

function isImageExt(extension) {
  return ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension.toLowerCase());
}

function inferMimeType(extension) {
  switch (extension.toLowerCase()) {
    case '.json':
      return 'application/json';
    case '.url':
      return 'application/json';
    case '.lesson':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/plain';
  }
}

function inferFileKind(extension) {
  switch (extension.toLowerCase()) {
    case '.json':
      return 'json';
    case '.url':
      return 'url';
    case '.lesson':
      return 'lesson';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.webp':
    case '.svg':
      return 'image';
    default:
      return 'file';
  }
}

function bufferToDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function readMetadata() {
  try {
    const raw = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeMetadata(nextMetadata) {
  await fs.mkdir(path.dirname(metadataPath), { recursive: true });
  await fs.writeFile(metadataPath, JSON.stringify(nextMetadata, null, 2), 'utf8');
}

async function updateMetadata(mutator) {
  const current = await readMetadata();
  const next = mutator({ ...current }) || current;
  await writeMetadata(next);
  return next;
}

function buildEntryRecord(osPath, stats, metadata = {}) {
  const normalized = normalizeOsPath(osPath);
  const extension = stats.isDirectory() ? '' : extnameFromPath(normalized);
  return {
    path: normalized,
    name: basenameFromPath(normalized),
    parentPath: dirnameFromPath(normalized),
    type: stats.isDirectory() ? 'directory' : 'file',
    fileKind: stats.isDirectory() ? 'folder' : (metadata.fileKind || inferFileKind(extension)),
    ext: extension,
    content: null,
    mimeType: stats.isDirectory() ? '' : (metadata.mimeType || inferMimeType(extension)),
    readonly: Boolean(metadata.readonly),
    source: metadata.source || 'workspace',
    createdAt: stats.birthtime?.toISOString?.() || new Date().toISOString(),
    updatedAt: stats.mtime?.toISOString?.() || new Date().toISOString(),
    meta: metadata.meta || {}
  };
}

async function ensureJsonFile(osPath, value) {
  const hostPath = toHostPath(osPath);
  try {
    await fs.access(hostPath);
  } catch {
    await fs.mkdir(path.dirname(hostPath), { recursive: true });
    await fs.writeFile(hostPath, JSON.stringify(value, null, 2), 'utf8');
  }
}

async function readJsonFile(osPath, fallbackValue) {
  const hostPath = toHostPath(osPath);
  try {
    const raw = await fs.readFile(hostPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallbackValue);
  }
}

async function writeJsonFile(osPath, value) {
  const hostPath = toHostPath(osPath);
  await fs.mkdir(path.dirname(hostPath), { recursive: true });
  await fs.writeFile(hostPath, JSON.stringify(value, null, 2), 'utf8');
}

async function ensureWorkspaceScaffold() {
  const directories = [
    WORKSPACE_PATHS.root,
    WORKSPACE_PATHS.system,
    WORKSPACE_PATHS.users,
    WORKSPACE_PATHS.user,
    WORKSPACE_PATHS.desktop,
    WORKSPACE_PATHS.documents,
    WORKSPACE_PATHS.wallpapers,
    WORKSPACE_PATHS.builtInWallpapers,
    WORKSPACE_PATHS.importedWallpapers,
    WORKSPACE_PATHS.settings,
    WORKSPACE_PATHS.trash,
    WORKSPACE_PATHS.community,
    WORKSPACE_PATHS.mounts,
    WORKSPACE_PATHS.lessonsMount,
    WORKSPACE_PATHS.promptAssetsMount
  ];

  await Promise.all(directories.map((osPath) => fs.mkdir(toHostPath(osPath), { recursive: true })));
  await ensureJsonFile(WORKSPACE_PATHS.profile, DEFAULT_PROFILE);
  await ensureJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT);
  await ensureJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE);
  await ensureJsonFile(WORKSPACE_PATHS.personalization, {
    ...DEFAULT_PERSONALIZATION,
    currentWallpaperId: getDefaultWallpaperId()
  });
  await ensureJsonFile(WORKSPACE_PATHS.communityResources, []);
  await ensureJsonFile(joinOsPath(WORKSPACE_PATHS.system, 'mounts.json'), {
    mounts: [
      { id: 'user-desktop', path: WORKSPACE_PATHS.desktop, source: 'workspace', writable: true },
      { id: 'user-documents', path: WORKSPACE_PATHS.documents, source: 'workspace', writable: true },
      { id: 'user-wallpapers', path: WORKSPACE_PATHS.wallpapers, source: 'workspace', writable: true },
      { id: 'user-community', path: WORKSPACE_PATHS.community, source: 'workspace', writable: true },
      { id: 'user-trash', path: WORKSPACE_PATHS.trash, source: 'workspace', writable: true },
      { id: 'kdacademy-lessons', path: WORKSPACE_PATHS.lessonsMount, source: 'virtual', writable: false },
      { id: 'prompt-assets', path: WORKSPACE_PATHS.promptAssetsMount, source: 'virtual', writable: false }
    ]
  });
}

async function readFileContent(osPath) {
  const hostPath = toHostPath(osPath);
  const extension = extnameFromPath(osPath);
  if (isImageExt(extension)) {
    const buffer = await fs.readFile(hostPath);
    return bufferToDataUrl(buffer, inferMimeType(extension));
  }
  return fs.readFile(hostPath, 'utf8');
}

async function writeFileContent(osPath, data, options = {}) {
  const hostPath = toHostPath(osPath);
  await fs.mkdir(path.dirname(hostPath), { recursive: true });

  if (typeof data === 'string' && data.startsWith('data:')) {
    const base64 = data.split(',')[1] || '';
    await fs.writeFile(hostPath, Buffer.from(base64, 'base64'));
  } else {
    await fs.writeFile(hostPath, typeof data === 'string' ? data : Buffer.from(data));
  }

  await updateMetadata((metadata) => {
    metadata[normalizeOsPath(osPath)] = {
      ...(metadata[normalizeOsPath(osPath)] || {}),
      mimeType: options.mimeType || inferMimeType(extnameFromPath(osPath)),
      fileKind: options.fileKind || inferFileKind(extnameFromPath(osPath)),
      source: options.source || 'workspace',
      readonly: false,
      meta: { ...((metadata[normalizeOsPath(osPath)] || {}).meta || {}), ...(options.meta || {}) }
    };
    return metadata;
  });
}

async function listEntries(osPath) {
  const hostPath = toHostPath(osPath);
  const metadata = await readMetadata();
  const dirEntries = await fs.readdir(hostPath, { withFileTypes: true });
  const entries = [];

  for (const dirEntry of dirEntries) {
    const entryHostPath = path.join(hostPath, dirEntry.name);
    const entryOsPath = toOsPath(entryHostPath);
    const stats = await fs.stat(entryHostPath);
    entries.push(buildEntryRecord(entryOsPath, stats, metadata[entryOsPath] || {}));
  }

  return entries.sort((left, right) => {
    if (left.type !== right.type) return left.type === 'directory' ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

async function renameMetadataTree(fromPath, toPath, transform) {
  await updateMetadata((metadata) => {
    const nextMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (key === fromPath || key.startsWith(`${fromPath}\\`)) {
        const suffix = key.slice(fromPath.length);
        const nextKey = `${toPath}${suffix}`;
        nextMetadata[nextKey] = transform ? transform(value, key, nextKey, suffix) : value;
      } else {
        nextMetadata[key] = value;
      }
    }
    return nextMetadata;
  });
}

async function moveEntryToTrash(osPath) {
  const normalized = normalizeOsPath(osPath);
  const targetPath = joinOsPath(WORKSPACE_PATHS.trash, `${Date.now()}-${sanitizeFileName(basenameFromPath(normalized))}`);
  await fs.rename(toHostPath(normalized), toHostPath(targetPath));
  await renameMetadataTree(normalized, targetPath, (value, key, nextKey, suffix) => ({
    ...value,
    meta: {
      ...(value.meta || {}),
      originalPath: key === normalized ? normalized : `${normalized}${suffix}`,
      trashedAt: new Date().toISOString()
    }
  }));
  return targetPath;
}

async function restoreEntryFromTrash(trashPath) {
  const normalized = normalizeOsPath(trashPath);
  const metadata = await readMetadata();
  const originalPath = metadata[normalized]?.meta?.originalPath;
  if (!originalPath) throw new Error(`Trash entry is missing originalPath: ${normalized}`);

  await fs.mkdir(path.dirname(toHostPath(originalPath)), { recursive: true });
  await fs.rename(toHostPath(normalized), toHostPath(originalPath));
  await renameMetadataTree(normalized, originalPath, (value) => ({
    ...value,
    meta: Object.fromEntries(Object.entries(value.meta || {}).filter(([key]) => key !== 'originalPath' && key !== 'trashedAt'))
  }));
  return originalPath;
}

async function renameEntry(osPath, nextName) {
  const normalized = normalizeOsPath(osPath);
  const targetPath = joinOsPath(dirnameFromPath(normalized), sanitizeFileName(nextName, basenameFromPath(normalized)));
  await fs.rename(toHostPath(normalized), toHostPath(targetPath));
  await renameMetadataTree(normalized, targetPath);
  return targetPath;
}

async function searchEntries(query, roots = [WORKSPACE_PATHS.root]) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return [];
  const metadata = await readMetadata();
  const matches = [];

  async function walk(currentPath) {
    const hostPath = toHostPath(currentPath);
    const dirEntries = await fs.readdir(hostPath, { withFileTypes: true });
    for (const dirEntry of dirEntries) {
      const entryHostPath = path.join(hostPath, dirEntry.name);
      const entryOsPath = toOsPath(entryHostPath);
      const stats = await fs.stat(entryHostPath);
      if (dirEntry.name.toLowerCase().includes(needle)) {
        matches.push(buildEntryRecord(entryOsPath, stats, metadata[entryOsPath] || {}));
      }
      if (dirEntry.isDirectory()) {
        await walk(entryOsPath);
      } else if (!isImageExt(extnameFromPath(entryOsPath))) {
        try {
          const content = await fs.readFile(entryHostPath, 'utf8');
          if (content.toLowerCase().includes(needle)) {
            matches.push(buildEntryRecord(entryOsPath, stats, metadata[entryOsPath] || {}));
          }
        } catch {
          // Ignore unreadable files.
        }
      }
    }
  }

  for (const rootPath of roots) {
    if (normalizeOsPath(rootPath) === WORKSPACE_PATHS.lessonsMount) continue;
    await walk(normalizeOsPath(rootPath));
  }

  return matches;
}

const fsApi = {
  async mountWorkspace() {
    await ensureWorkspaceScaffold();
    return {
      root: WORKSPACE_PATHS.root,
      userRoot: WORKSPACE_PATHS.user,
      runtimeMode: OS_RUNTIME_MODES.DESKTOP_LOCAL
    };
  },
  async list(osPath) {
    await ensureWorkspaceScaffold();
    return listEntries(osPath);
  },
  async read(osPath) {
    await ensureWorkspaceScaffold();
    return readFileContent(osPath);
  },
  async write(osPath, data, options = {}) {
    await ensureWorkspaceScaffold();
    await writeFileContent(osPath, data, options);
  },
  async mkdir(osPath) {
    await ensureWorkspaceScaffold();
    await fs.mkdir(toHostPath(osPath), { recursive: true });
  },
  async rename(osPath, nextName) {
    await ensureWorkspaceScaffold();
    return renameEntry(osPath, nextName);
  },
  async moveToTrash(osPath) {
    await ensureWorkspaceScaffold();
    return moveEntryToTrash(osPath);
  },
  async restoreFromTrash(osPath) {
    await ensureWorkspaceScaffold();
    return restoreEntryFromTrash(osPath);
  },
  async search(query, roots) {
    await ensureWorkspaceScaffold();
    return searchEntries(query, roots);
  }
};

const settingsApi = {
  async migrateLegacy() {
    await ensureWorkspaceScaffold();
    return {
      migrated: false,
      version: MIGRATION_VERSION,
      items: []
    };
  },
  loadProfile: () => readJsonFile(WORKSPACE_PATHS.profile, DEFAULT_PROFILE),
  saveProfile: (profile) => writeJsonFile(WORKSPACE_PATHS.profile, { ...DEFAULT_PROFILE, ...(profile || {}), updated_at: new Date().toISOString() }),
  loadDesktopLayout: async () => sanitizeDesktopLayoutState(await readJsonFile(WORKSPACE_PATHS.desktopLayout, DEFAULT_DESKTOP_LAYOUT)),
  saveDesktopLayout: (layout) => writeJsonFile(WORKSPACE_PATHS.desktopLayout, sanitizeDesktopLayoutState({ ...layout, updatedAt: new Date().toISOString() })),
  loadSession: async () => sanitizeSessionState(await readJsonFile(WORKSPACE_PATHS.session, DEFAULT_SESSION_STATE)),
  saveSession: (session) => writeJsonFile(WORKSPACE_PATHS.session, sanitizeSessionState(session)),
  loadPersonalization: async () => sanitizePersonalizationState(await readJsonFile(WORKSPACE_PATHS.personalization, { ...DEFAULT_PERSONALIZATION, currentWallpaperId: getDefaultWallpaperId() })),
  savePersonalization: (personalization) => writeJsonFile(WORKSPACE_PATHS.personalization, sanitizePersonalizationState({ ...personalization, lastUpdatedAt: new Date().toISOString() })),
  loadCommunityResources: () => readJsonFile(WORKSPACE_PATHS.communityResources, []),
  saveCommunityResources: (resources) => writeJsonFile(WORKSPACE_PATHS.communityResources, Array.isArray(resources) ? resources : [])
};

const wallpaperApi = {
  async list() {
    await ensureWorkspaceScaffold();
    const importedDir = toHostPath(WORKSPACE_PATHS.importedWallpapers);
    const metadata = await readMetadata();
    const dirEntries = await fs.readdir(importedDir, { withFileTypes: true });
    const importedWallpapers = [];

    for (const dirEntry of dirEntries) {
      if (!dirEntry.isFile()) continue;
      const entryHostPath = path.join(importedDir, dirEntry.name);
      const osPath = toOsPath(entryHostPath);
      importedWallpapers.push({
        id: metadata[osPath]?.meta?.wallpaperId || `imported:${osPath}`,
        name: dirEntry.name,
        type: 'image',
        src: await readFileContent(osPath),
        source: 'imported',
        path: osPath
      });
    }

    return [...BUILT_IN_WALLPAPERS, ...importedWallpapers];
  },
  async import(payload) {
    await ensureWorkspaceScaffold();
    const safePayload = assertWallpaperPayload(payload);
    const dataUrl = safePayload.dataUrl;
    const extension = dataUrlToExtension(dataUrl);
    const fileName = sanitizeFileName(safePayload.name || `wallpaper-${Date.now()}.${extension}`);
    const osPath = joinOsPath(WORKSPACE_PATHS.importedWallpapers, fileName);
    const wallpaperId = `imported:${osPath}`;
    await writeFileContent(osPath, dataUrl, {
      mimeType: safePayload.type || inferMimeType(`.${extension}`),
      fileKind: 'image',
      meta: {
        wallpaperId,
        logicalType: 'wallpaper'
      }
    });

    return {
      id: wallpaperId,
      name: fileName,
      type: 'image',
      src: dataUrl,
      source: 'imported',
      path: osPath
    };
  },
  async setCurrent(id, fit = 'fill') {
    const personalization = await settingsApi.loadPersonalization();
    const history = [
      { id, changedAt: new Date().toISOString() },
      ...(personalization.history || []).filter((entry) => entry.id !== id)
    ].slice(0, 10);
    await settingsApi.savePersonalization({
      ...personalization,
      currentWallpaperId: id,
      fit,
      history
    });
  },
  async getCurrent() {
    const personalization = await settingsApi.loadPersonalization();
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

const containerApi = {
  async probe() {
    return {
      supported: false,
      host: os.platform(),
      reason: 'Container runtime is not enabled in the desktop-local scaffold.'
    };
  },
  async createWorkspace() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  },
  async start() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  },
  async stop() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  },
  async exec() {
    throw new Error('Container runtime is not enabled in the desktop-local scaffold.');
  }
};

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (devServerUrl) {
    await win.loadURL(devServerUrl);
  } else {
    await win.loadFile(distIndexPath);
  }
}

ipcMain.handle('os.runtime.initialize', async () => {
  await ensureWorkspaceScaffold();
  return {
    mode: OS_RUNTIME_MODES.DESKTOP_LOCAL,
    migration: await settingsApi.migrateLegacy()
  };
});

ipcMain.handle('os.fs.mountWorkspace', () => fsApi.mountWorkspace());
ipcMain.handle('os.fs.list', (_event, osPath) => fsApi.list(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.read', (_event, osPath) => fsApi.read(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.write', (_event, osPath, data, options) => {
  assertFilePayload(data);
  return fsApi.write(assertOsPathInput(osPath), data, assertOptionsObject(options));
});
ipcMain.handle('os.fs.mkdir', (_event, osPath) => fsApi.mkdir(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.rename', (_event, osPath, nextName) => {
  if (typeof nextName !== 'string' || !nextName.trim()) throw new Error('Expected a non-empty target name.');
  return fsApi.rename(assertOsPathInput(osPath), nextName);
});
ipcMain.handle('os.fs.moveToTrash', (_event, osPath) => fsApi.moveToTrash(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.restoreFromTrash', (_event, osPath) => fsApi.restoreFromTrash(assertOsPathInput(osPath)));
ipcMain.handle('os.fs.search', (_event, query, roots) => {
  const safeQuery = typeof query === 'string' ? query : '';
  const safeRoots = Array.isArray(roots) ? roots.map(assertOsPathInput) : undefined;
  return fsApi.search(safeQuery, safeRoots);
});

ipcMain.handle('os.wallpaper.list', () => wallpaperApi.list());
ipcMain.handle('os.wallpaper.import', (_event, payload) => wallpaperApi.import(assertWallpaperPayload(payload)));
ipcMain.handle('os.wallpaper.setCurrent', (_event, id, fit) => {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Expected a wallpaper id.');
  return wallpaperApi.setCurrent(id, fit);
});
ipcMain.handle('os.wallpaper.getCurrent', () => wallpaperApi.getCurrent());
ipcMain.handle('os.power.getStatus', () => powerApi.getStatus());
ipcMain.handle('os.device.getStatus', () => deviceApi.getStatus());
ipcMain.handle('os.device.setWifiEnabled', (_event, enabled) => deviceApi.setWifiEnabled(Boolean(enabled)));
ipcMain.handle('os.device.setVolume', (_event, percent) => deviceApi.setVolume(percent));
ipcMain.handle('os.device.setBrightness', (_event, percent) => deviceApi.setBrightness(percent));

ipcMain.handle('os.settings.migrateLegacy', () => settingsApi.migrateLegacy());
ipcMain.handle('os.settings.loadProfile', () => settingsApi.loadProfile());
ipcMain.handle('os.settings.saveProfile', (_event, profile) => {
  if (!isPlainObject(profile)) throw new Error('Expected a profile object.');
  return settingsApi.saveProfile(profile);
});
ipcMain.handle('os.settings.loadDesktopLayout', () => settingsApi.loadDesktopLayout());
ipcMain.handle('os.settings.saveDesktopLayout', (_event, layout) => {
  if (!isPlainObject(layout)) throw new Error('Expected a desktop layout object.');
  return settingsApi.saveDesktopLayout(layout);
});
ipcMain.handle('os.settings.loadSession', () => settingsApi.loadSession());
ipcMain.handle('os.settings.saveSession', (_event, session) => {
  if (!isPlainObject(session)) throw new Error('Expected a session object.');
  return settingsApi.saveSession(session);
});
ipcMain.handle('os.settings.loadPersonalization', () => settingsApi.loadPersonalization());
ipcMain.handle('os.settings.savePersonalization', (_event, personalization) => {
  if (!isPlainObject(personalization)) throw new Error('Expected a personalization object.');
  return settingsApi.savePersonalization(personalization);
});
ipcMain.handle('os.settings.loadCommunityResources', () => settingsApi.loadCommunityResources());
ipcMain.handle('os.settings.saveCommunityResources', (_event, resources) => settingsApi.saveCommunityResources(resources));

ipcMain.handle('os.container.probe', () => containerApi.probe());
ipcMain.handle('os.container.createWorkspace', (_event, id) => containerApi.createWorkspace(id));
ipcMain.handle('os.container.start', (_event, id) => containerApi.start(id));
ipcMain.handle('os.container.stop', (_event, id) => containerApi.stop(id));
ipcMain.handle('os.container.exec', (_event, id, command) => containerApi.exec(id, command));

app.whenReady().then(async () => {
  await ensureWorkspaceScaffold();
  await createMainWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
