import {
  Brain,
  Folder,
  Sparkles,
  Activity,
  Bot,
  User,
  Rocket,
  BookOpen,
  Settings,
  Gamepad2,
  Trash2,
  Store,
  Globe
} from 'lucide-react';
import { KRACKED_COLORS } from './theme';
import { KDSTORE_CATALOG } from './kdStoreCatalog';
import { OS_RUNTIME_MODES } from '../os-core/constants';

export const BUILT_IN_APP_REGISTRY = [
  { type: 'files', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'FILES', icon: Folder, color: KRACKED_COLORS.accentYellow, defaultW: 820, defaultH: 540, title: 'Files', desktopVisible: true, desktopIconImage: '/icons/files-stack.png', category: 'Workspace', pinned: true, recentWeight: 10, description: 'Browse lesson assets, builder files, and project structure.', launcherKeywords: ['explorer', 'folders', 'documents'] },
  { type: 'wallpaper', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'WALLPAPER', icon: Sparkles, color: KRACKED_COLORS.accentAmber, defaultW: 600, defaultH: 480, title: 'Wallpaper', desktopVisible: true, desktopIconImage: '/icons/wallpaper.png', category: 'Personalize', pinned: false, recentWeight: 4, description: 'Adjust the KRACKED shell look without changing the workflow.', launcherKeywords: ['background', 'theme', 'personalize'] },
  { type: 'idea_to_prompt', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'IDEA_TO_PROMPT', icon: Brain, color: KRACKED_COLORS.accentOrange, defaultW: 1020, defaultH: 680, title: 'Idea to Prompt', desktopVisible: true, desktopIconImage: '/icons/prompt.png', category: 'Builder', pinned: true, recentWeight: 9, description: 'Turn a structured idea map into an editable ROFCO master prompt.', launcherKeywords: ['mind map', 'prompt', 'builder brief', 'rofco'] },
  { type: 'simulator', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'SIMULATOR', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 820, defaultH: 580, title: 'Simulator', desktopVisible: true, desktopIconImage: '/icons/SIMULATOR.png', category: 'Learning', pinned: false, recentWeight: 5, description: 'Test flows and simulate product behavior inside the workspace.', launcherKeywords: ['testing', 'preview', 'simulation'] },
  { type: 'kdstore', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'KDSTORE', icon: Store, color: KRACKED_COLORS.accentBlue, defaultW: 1120, defaultH: 700, title: 'KDSTORE', desktopVisible: true, category: 'Store', pinned: true, recentWeight: 8, description: 'Install curated hosted web apps into your KDOS workspace.', launcherKeywords: ['store', 'apps', 'install', 'marketplace', 'kdstore'] },
  { type: 'kdbrowser', kind: 'builtin', contentType: 'browser', windowChrome: 'app', label: 'KDBROWSER', icon: Globe, color: KRACKED_COLORS.accentBlue, defaultW: 1260, defaultH: 820, title: 'KDBROWSER', desktopVisible: false, category: 'Workspace', pinned: true, recentWeight: 9, description: 'Browse the web inside KDOS with tabs, session restore, and Electron-backed navigation.', launcherKeywords: ['browser', 'web', 'internet', 'tab', 'kdbrowser'], runtimeModes: [OS_RUNTIME_MODES.WEB_DEMO, OS_RUNTIME_MODES.DESKTOP_LOCAL, OS_RUNTIME_MODES.DESKTOP_ISOLATED] },
  { type: 'terminal', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'TERMINAL', icon: Bot, color: KRACKED_COLORS.accentLemon, defaultW: 1080, defaultH: 720, desktopVisible: false, title: 'KRACKED Terminal', category: 'Workspace', pinned: false, recentWeight: 7, description: 'Run IJAM lessons, MAJI commands, and internal terminal workflows.', launcherKeywords: ['terminal', 'ijam', 'maji', 'bmad'] },
  { type: 'progress', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'STATS', icon: User, color: KRACKED_COLORS.accentBlue, defaultW: 960, defaultH: 700, desktopVisible: false, title: 'Stats', category: 'Workspace', pinned: false, recentWeight: 6, description: 'Track builder readiness, proof-of-work, and profile progress.', launcherKeywords: ['stats', 'progress', 'builder profile', 'readiness'] },
  { type: 'mission', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'MISSION', icon: Rocket, color: KRACKED_COLORS.accentRed, defaultW: 1040, defaultH: 700, desktopVisible: false, title: 'Mission Control', category: 'Workspace', pinned: false, recentWeight: 5, description: 'Review mission state, events, and operational focus across KDOS.', launcherKeywords: ['mission', 'ops', 'control', 'console'] },
  { type: 'kdacademy', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'KDACADEMY', icon: BookOpen, color: KRACKED_COLORS.accentEmerald, defaultW: 1120, defaultH: 720, desktopVisible: false, title: 'KDacademy', category: 'Learning', pinned: false, recentWeight: 6, description: 'Open academy lessons and learning surfaces inside the workspace.', launcherKeywords: ['academy', 'lesson', 'learning', 'course'] },
  { type: 'settings', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'SETTINGS', icon: Settings, color: KRACKED_COLORS.accentSlate, defaultW: 980, defaultH: 700, desktopVisible: false, title: 'Settings', category: 'System', pinned: false, recentWeight: 6, description: 'Configure profile, setup, and workspace preferences.', launcherKeywords: ['settings', 'preferences', 'profile', 'setup'] },
  { type: 'arcade', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'ARCADE', icon: Gamepad2, color: KRACKED_COLORS.accentOrange, defaultW: 960, defaultH: 680, desktopVisible: false, title: 'Arcade', category: 'Playground', pinned: false, recentWeight: 3, description: 'Open the local builder studio playground inside KDOS.', launcherKeywords: ['arcade', 'builder studio', 'playground'] },
  { type: 'trash', kind: 'builtin', contentType: 'component', windowChrome: 'app', label: 'RECYCLE_BIN', icon: Trash2, color: KRACKED_COLORS.accentSlate, defaultW: 780, defaultH: 520, desktopVisible: false, title: 'Recycle Bin', category: 'System', pinned: false, recentWeight: 2, description: 'Check deleted workspace items and recycle-bin status.', launcherKeywords: ['trash', 'recycle', 'bin'] }
];

export const APP_REGISTRY = BUILT_IN_APP_REGISTRY;

export function getWebAppType(slug = '') {
  return `webapp:${slug}`;
}

export function isWebAppType(type = '') {
  return typeof type === 'string' && type.startsWith('webapp:');
}

export function createHostedWebAppRegistryEntry(catalogItem) {
  return {
    type: getWebAppType(catalogItem.slug),
    kind: 'hosted-web-app',
    contentType: catalogItem.launchSurface === 'browser-app'
      ? 'browser-app'
      : (catalogItem.launchSurface === 'kdbrowser' ? 'browser-link' : 'iframe'),
    windowChrome: catalogItem.windowChrome || 'browser',
    catalogId: catalogItem.id,
    slug: catalogItem.slug,
    label: catalogItem.label || catalogItem.title || catalogItem.slug,
    title: catalogItem.title || catalogItem.slug,
    icon: Globe,
    desktopIconImage: catalogItem.iconImage,
    color: catalogItem.color || KRACKED_COLORS.accentInfo,
    defaultW: catalogItem.defaultW || 1120,
    defaultH: catalogItem.defaultH || 720,
    category: catalogItem.category || 'Hosted Web App',
    pinned: false,
    desktopVisible: catalogItem.desktopVisible ?? true,
    startMenuVisible: true,
    description: catalogItem.description || 'Open a hosted web app inside KDOS.',
    launcherKeywords: catalogItem.launcherKeywords || [],
    launchUrl: catalogItem.launchUrl,
    homeUrl: catalogItem.homeUrl || catalogItem.launchUrl,
    launchSurface: catalogItem.launchSurface || 'hosted-window',
    authPolicy: catalogItem.authPolicy || 'embedded-ok',
    allowedOrigins: Array.isArray(catalogItem.allowedOrigins) ? catalogItem.allowedOrigins : [],
    fallbackMode: catalogItem.fallbackMode || 'external-tab',
    requiresExternalAuth: Boolean(catalogItem.requiresExternalAuth),
    authProviders: Array.isArray(catalogItem.authProviders) ? catalogItem.authProviders : [],
    authNote: catalogItem.authNote || ''
  };
}

export function createComposedAppRegistry({ installedAppsState, runtimeMode } = {}) {
  const installedIds = new Set(Array.isArray(installedAppsState?.installedIds) ? installedAppsState.installedIds : []);
  const builtInApps = BUILT_IN_APP_REGISTRY.filter((app) => (
    !Array.isArray(app.runtimeModes)
    || !app.runtimeModes.length
    || app.runtimeModes.includes(runtimeMode)
  ));
  const hostedApps = KDSTORE_CATALOG
    .filter((item) => installedIds.has(item.id))
    .map((item) => createHostedWebAppRegistryEntry(item));

  return [...builtInApps, ...hostedApps];
}
