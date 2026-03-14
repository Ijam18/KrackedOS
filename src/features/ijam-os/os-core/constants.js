export const OS_RUNTIME_MODES = {
  WEB_DEMO: 'web-demo',
  DESKTOP_LOCAL: 'desktop-local',
  DESKTOP_ISOLATED: 'desktop-isolated'
};

export const LEGACY_STORAGE_KEYS = {
  profile: 'ijamos_profile',
  wallpaper: 'vibe_wallpaper',
  showcaseUrl: 'ijamos_showcase_url',
  websiteUrl: 'ijamos_website_url',
  desktopIconSlots: 'ijamos_desktop_icon_slots',
  desktopIconOrder: 'ijamos_desktop_icon_order',
  communityResources: 'ijamos_community_resources',
  booted: 'vibe_os_booted'
};

export const OS_ROOT = 'C:\\KRACKED_OS';
export const SYSTEM_ROOT = `${OS_ROOT}\\system`;
export const USERS_ROOT = `${OS_ROOT}\\Users`;
export const DEFAULT_USER_HANDLE = 'default';
export const USER_ROOT = `${USERS_ROOT}\\${DEFAULT_USER_HANDLE}`;

export const WORKSPACE_PATHS = {
  root: OS_ROOT,
  system: SYSTEM_ROOT,
  users: USERS_ROOT,
  user: USER_ROOT,
  desktop: `${USER_ROOT}\\Desktop`,
  documents: `${USER_ROOT}\\Documents`,
  wallpapers: `${USER_ROOT}\\Wallpapers`,
  builtInWallpapers: `${USER_ROOT}\\Wallpapers\\BuiltIn`,
  importedWallpapers: `${USER_ROOT}\\Wallpapers\\Imported`,
  settings: `${USER_ROOT}\\Settings`,
  profile: `${USER_ROOT}\\Settings\\profile.json`,
  personalization: `${USER_ROOT}\\Settings\\personalization.json`,
  desktopLayout: `${USER_ROOT}\\Settings\\desktop-layout.json`,
  session: `${USER_ROOT}\\Settings\\session.json`,
  trash: `${USER_ROOT}\\Trash`,
  community: `${USER_ROOT}\\Community`,
  communityResources: `${USER_ROOT}\\Community\\resources.json`,
  mounts: `${OS_ROOT}\\mounts`,
  lessonsMount: `${OS_ROOT}\\mounts\\kdacademy-lessons`,
  promptAssetsMount: `${OS_ROOT}\\mounts\\prompt-assets`,
  registry: `${SYSTEM_ROOT}\\registry.json`,
  mountsConfig: `${SYSTEM_ROOT}\\mounts.json`
};

export const WORKSPACE_DIRECTORIES = [
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

export const DEFAULT_PROFILE = {
  id: 'local-builder',
  name: 'Local Builder',
  district: 'Selangor',
  idea_title: 'My Local IJAM Project',
  problem_statement: 'Building and testing KRACKED_OS standalone locally.',
  threads_handle: '',
  whatsapp_contact: '',
  discord_tag: '',
  about_yourself: '',
  program_goal: '',
  showcase_image: '',
  showcase_image_path: '',
  website_url: ''
};

export const DEFAULT_DESKTOP_LAYOUT = {
  slots: [],
  legacyOrder: [],
  updatedAt: null
};

export const DEFAULT_SESSION_STATE = {
  isBooted: false,
  lastBootedAt: null,
  lastRuntimeMode: OS_RUNTIME_MODES.WEB_DEMO,
  windowLayout: {},
  explorerPreferences: {
    path: [],
    view: 'icons',
    showDetailsPane: true,
    sort: 'name-asc'
  },
  windowZCounter: 100
};

export const BUILT_IN_WALLPAPERS = [
  { id: 'kdos', name: 'KDOS', type: 'image', src: '/icons/KDOS.png', source: 'built-in' },
  { id: 'merdeka', name: 'Merdeka Red', type: 'gradient', colors: ['#DC2626', '#FFFFFF', '#FF0000'], source: 'built-in' },
  { id: 'jalur', name: 'Jalur Gemilang', type: 'animated-gradient', colors: ['#010066', '#FFFFFF', '#CC0000'], source: 'built-in' },
  { id: 'wau', name: 'Wau Kuning', type: 'gradient', colors: ['#FFCC00', '#FFD700', '#FFFAC0'], source: 'built-in' },
  { id: 'kebaya', name: 'Kebaya', type: 'gradient', colors: ['#004488', '#0066CC', '#0099FF'], source: 'built-in' },
  { id: 'tropic-rain', name: 'Tropic Rain', type: 'animated-gradient', colors: ['#0891B2', '#10B981', '#34D399'], source: 'built-in' },
  { id: 'hibiscus', name: 'Hibiscus Morning', type: 'gradient', colors: ['#FF6B6B', '#FFE4E1', '#FFF0F5'], source: 'built-in' },
  { id: 'sunset', name: 'Tropical Sunset', type: 'gradient', colors: ['#F97316', '#FDBA74', '#FCD34D'], source: 'built-in' },
  { id: 'night', name: 'Tropical Night', type: 'gradient', colors: ['#0C1220', '#1E3A8A', '#3B82F6'], source: 'built-in' },
  { id: 'pagi-morning', name: 'Pagi (Morning)', type: 'time-based', times: '6-12', colors: ['#87CEEB', '#FFD166', '#FFF7ED'], source: 'built-in' },
  { id: 'tengahari', name: 'Tengahari (Afternoon)', type: 'time-based', times: '12-15', colors: ['#FDBA74', '#FCD34D', '#FBBF24'], source: 'built-in' },
  { id: 'petang', name: 'Petang (Evening)', type: 'time-based', times: '18-21', colors: ['#F97316', '#F59E0B', '#FBBF24'], source: 'built-in' },
  { id: 'malam', name: 'Malam (Night)', type: 'time-based', times: '21-6', colors: ['#0C1220', '#1E3A8A', '#3B82F6'], source: 'built-in' }
];

export const DEFAULT_PERSONALIZATION = {
  currentWallpaperId: 'kdos',
  fit: 'fill',
  history: [],
  importedWallpaperIds: [],
  lastUpdatedAt: null
};

export const STORAGE_DB_NAME = 'kracked-os-workspace';
export const STORAGE_DB_VERSION = 1;
export const STORAGE_STORES = {
  entries: 'entries',
  meta: 'meta'
};

export const MIGRATION_VERSION = 1;

export const FILE_KIND_BY_EXTENSION = {
  '.json': 'json',
  '.url': 'url',
  '.lesson': 'lesson',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.svg': 'image'
};

export function getDefaultWallpaperId() {
  return 'kdos';
}

export function normalizeLegacyWallpaperId(wallpaperId) {
  switch (wallpaperId) {
    case 'morning':
      return 'pagi-morning';
    case 'day':
    case 'afternoon':
      return 'tengahari';
    case 'evening':
      return 'petang';
    case 'night':
      return 'malam';
    default:
      return wallpaperId || getDefaultWallpaperId();
  }
}

export function createSystemRegistryRecord() {
  return {
    version: '3.0',
    createdAt: new Date().toISOString(),
    root: WORKSPACE_PATHS.root
  };
}

export function createMountRegistryRecord() {
  return {
    mounts: [
      { id: 'user-desktop', path: WORKSPACE_PATHS.desktop, source: 'workspace', writable: true },
      { id: 'user-documents', path: WORKSPACE_PATHS.documents, source: 'workspace', writable: true },
      { id: 'user-wallpapers', path: WORKSPACE_PATHS.wallpapers, source: 'workspace', writable: true },
      { id: 'user-community', path: WORKSPACE_PATHS.community, source: 'workspace', writable: true },
      { id: 'user-trash', path: WORKSPACE_PATHS.trash, source: 'workspace', writable: true },
      { id: 'kdacademy-lessons', path: WORKSPACE_PATHS.lessonsMount, source: 'virtual', writable: false },
      { id: 'prompt-assets', path: WORKSPACE_PATHS.promptAssetsMount, source: 'virtual', writable: false }
    ]
  };
}
