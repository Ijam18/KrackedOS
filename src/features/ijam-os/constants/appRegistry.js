import {
  Folder,
  User,
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
  { type: 'files', label: 'FILES', icon: Folder, color: KRACKED_COLORS.accentYellow, defaultW: 820, defaultH: 540, title: 'FILE_EXPLORER // KRACKED_OS v3', desktopIconImage: '/icons/files-stack.png' },
  { type: 'progress', label: 'STATS', icon: User, color: KRACKED_COLORS.accentGreen, defaultW: 700, defaultH: 580, title: 'BUILDER_STATS // PROGRESS', desktopIconImage: '/icons/profile-icon.png', desktopIconScale: 2 },
  { type: 'settings', label: 'SETTINGS', icon: Settings, color: KRACKED_COLORS.accentSlate, defaultW: 660, defaultH: 520, title: 'SYSTEM_SETTINGS // CONFIG' },
  { type: 'wallpaper', label: 'WALLPAPER', icon: Sparkles, color: KRACKED_COLORS.accentAmber, defaultW: 600, defaultH: 480, title: 'WALLPAPER_GALLERY // PERSONALIZE' },
  { type: 'kdacademy', label: 'KDACADEMY', icon: Globe, color: KRACKED_COLORS.accentEmerald, defaultW: 1240, defaultH: 780, title: 'KDACADEMY // LEARN + BUILD' },
  { type: 'arcade', label: 'ARCADE', icon: Gamepad2, color: KRACKED_COLORS.accentYellow, defaultW: 600, defaultH: 460, title: 'BUILDER_ARCADE // STUDIO' },
  { type: 'mind_mapper', label: 'MIND_MAP', icon: Waypoints, color: KRACKED_COLORS.accentLemon, defaultW: 920, defaultH: 620, title: 'MIND_MAPPER // IDEATION' },
  { type: 'prompt_forge', label: 'PROMPT_FORGE', icon: Wand2, color: KRACKED_COLORS.accentOrange, defaultW: 860, defaultH: 580, title: 'PROMPT_FORGE // MASTER PROMPT' },
  { type: 'simulator', label: 'SIMULATOR', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 820, defaultH: 580, title: 'VIBE_SIMULATOR // ARCHITECTURE' },
  { type: 'mission', label: 'MISSION', icon: Cpu, color: KRACKED_COLORS.accentInfo, defaultW: 860, defaultH: 560, title: 'MISSION_CONSOLE // KRACKED_OS' },
  { type: 'trash', label: 'RECYCLE', icon: Trash2, color: KRACKED_COLORS.accentRed, defaultW: 500, defaultH: 320, title: 'RECYCLE_BIN // DELETED CONTENT' }
];
