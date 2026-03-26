import {
  Folder,
  Settings,
  Sparkles,
  Globe,
  Gamepad2,
  Waypoints,
  Wand2,
  Activity,
  Trash2,
  Cpu
} from 'lucide-react';
import { KRACKED_COLORS } from './theme';

export const APP_REGISTRY = [
  { type: 'files', label: 'FILES', icon: Folder, color: KRACKED_COLORS.accentYellow, defaultW: 820, defaultH: 540, title: 'Files', desktopIconImage: '/icons/files-stack.png', category: 'Workspace', pinned: true, recentWeight: 10, description: 'Browse lesson assets, builder files, and project structure.', launcherKeywords: ['explorer', 'folders', 'documents'] },
  { type: 'progress', label: 'STATS', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 700, defaultH: 580, title: 'Stats', desktopIconImage: '/icons/profile-icon.png', desktopIconScale: 1, category: 'Builder', pinned: true, recentWeight: 8, description: 'Track readiness, stage progress, and proof-of-work.', launcherKeywords: ['progress', 'readiness', 'profile'] },
  { type: 'settings', label: 'SETTINGS', icon: Settings, color: KRACKED_COLORS.accentSlate, defaultW: 660, defaultH: 520, title: 'Settings', desktopIconImage: '/icons/settings.png', category: 'Builder', pinned: true, recentWeight: 9, description: 'Configure beginner setup, community, and tool readiness.', launcherKeywords: ['preferences', 'setup', 'configuration'] },
  { type: 'wallpaper', label: 'WALLPAPER', icon: Sparkles, color: KRACKED_COLORS.accentAmber, defaultW: 600, defaultH: 480, title: 'Wallpaper', desktopIconImage: '/icons/wallpaper.png', category: 'Personalize', pinned: false, recentWeight: 4, description: 'Adjust the KRACKED shell look without changing the workflow.', launcherKeywords: ['background', 'theme', 'personalize'] },
  { type: 'kdacademy', label: 'KDACADEMY', icon: Globe, color: KRACKED_COLORS.accentEmerald, defaultW: 1240, defaultH: 780, title: 'KDacademy', desktopIconImage: '/icons/browser.png', category: 'Learning', pinned: true, recentWeight: 10, description: 'Open the main learning hub and continue the current lesson path.', launcherKeywords: ['academy', 'learn', 'course'] },
  { type: 'arcade', label: 'ARCADE', icon: Gamepad2, color: KRACKED_COLORS.accentYellow, defaultW: 600, defaultH: 460, title: 'Arcade', desktopIconImage: '/icons/joystick.png', category: 'Play', pinned: false, recentWeight: 2, description: 'Take a break or explore a lighter interactive mode.', launcherKeywords: ['game', 'fun', 'break'] },
  { type: 'mind_mapper', label: 'MIND_MAP', icon: Waypoints, color: KRACKED_COLORS.accentLemon, defaultW: 920, defaultH: 620, title: 'Mind Map', desktopIconImage: '/icons/workflow.png', category: 'Builder', pinned: true, recentWeight: 6, description: 'Map flows, ideas, and relationships before building.', launcherKeywords: ['diagram', 'mapping', 'ideas'] },
  { type: 'prompt_forge', label: 'PROMPT_FORGE', icon: Wand2, color: KRACKED_COLORS.accentOrange, defaultW: 860, defaultH: 580, title: 'Prompt Forge', desktopIconImage: '/icons/prompt.png', category: 'AI Tools', pinned: true, recentWeight: 7, description: 'Draft prompts and turn rough requests into build-ready inputs.', launcherKeywords: ['prompts', 'ai', 'assistant'] },
  { type: 'simulator', label: 'SIMULATOR', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 820, defaultH: 580, title: 'Simulator', desktopIconImage: '/icons/SIMULATOR.png', category: 'Learning', pinned: false, recentWeight: 5, description: 'Test flows and simulate product behavior inside the workspace.', launcherKeywords: ['testing', 'preview', 'simulation'] },
  { type: 'mission', label: 'MISSION', icon: Cpu, color: KRACKED_COLORS.accentInfo, defaultW: 860, defaultH: 560, title: 'Mission', desktopIconImage: '/icons/leadership.png', category: 'Operations', pinned: true, recentWeight: 9, description: 'Manage agents, idle progress, and current KRACKED operations.', launcherKeywords: ['ops', 'idle', 'agents'] },
  { type: 'trash', label: 'RECYCLE', icon: Trash2, color: KRACKED_COLORS.accentRed, defaultW: 500, defaultH: 320, title: 'Recycle Bin', desktopIconImage: '/icons/recycle-bin.png', category: 'Workspace', pinned: false, recentWeight: 1, description: 'Review removed items and clean the current workspace.', launcherKeywords: ['trash', 'bin', 'cleanup'] }
];
