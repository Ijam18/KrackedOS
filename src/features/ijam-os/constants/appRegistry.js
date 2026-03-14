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
  { type: 'files', label: 'FILES', icon: Folder, color: KRACKED_COLORS.accentYellow, defaultW: 820, defaultH: 540, title: 'Files', desktopIconImage: '/icons/files-stack.png' },
  { type: 'progress', label: 'STATS', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 700, defaultH: 580, title: 'Stats', desktopIconImage: '/icons/profile-icon.png', desktopIconScale: 1 },
  { type: 'settings', label: 'SETTINGS', icon: Settings, color: KRACKED_COLORS.accentSlate, defaultW: 660, defaultH: 520, title: 'Settings', desktopIconImage: '/icons/settings.png' },
  { type: 'wallpaper', label: 'WALLPAPER', icon: Sparkles, color: KRACKED_COLORS.accentAmber, defaultW: 600, defaultH: 480, title: 'Wallpaper', desktopIconImage: '/icons/wallpaper.png' },
  { type: 'kdacademy', label: 'KDACADEMY', icon: Globe, color: KRACKED_COLORS.accentEmerald, defaultW: 1240, defaultH: 780, title: 'KDacademy', desktopIconImage: '/icons/browser.png' },
  { type: 'arcade', label: 'ARCADE', icon: Gamepad2, color: KRACKED_COLORS.accentYellow, defaultW: 600, defaultH: 460, title: 'Arcade', desktopIconImage: '/icons/joystick.png' },
  { type: 'mind_mapper', label: 'MIND_MAP', icon: Waypoints, color: KRACKED_COLORS.accentLemon, defaultW: 920, defaultH: 620, title: 'Mind Map', desktopIconImage: '/icons/workflow.png' },
  { type: 'prompt_forge', label: 'PROMPT_FORGE', icon: Wand2, color: KRACKED_COLORS.accentOrange, defaultW: 860, defaultH: 580, title: 'Prompt Forge', desktopIconImage: '/icons/prompt.png' },
  { type: 'simulator', label: 'SIMULATOR', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 820, defaultH: 580, title: 'Simulator', desktopIconImage: '/icons/SIMULATOR.png' },
  { type: 'mission', label: 'MISSION', icon: Cpu, color: KRACKED_COLORS.accentInfo, defaultW: 860, defaultH: 560, title: 'Mission', desktopIconImage: '/icons/leadership.png' },
  { type: 'trash', label: 'RECYCLE', icon: Trash2, color: KRACKED_COLORS.accentRed, defaultW: 500, defaultH: 320, title: 'Recycle Bin', desktopIconImage: '/icons/recycle-bin.png' }
];
