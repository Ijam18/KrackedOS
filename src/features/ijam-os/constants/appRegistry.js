import {
  Brain,
  Folder,
  Sparkles,
  Activity
} from 'lucide-react';
import { KRACKED_COLORS } from './theme';

export const APP_REGISTRY = [
  { type: 'files', label: 'FILES', icon: Folder, color: KRACKED_COLORS.accentYellow, defaultW: 820, defaultH: 540, title: 'Files', desktopIconImage: '/icons/files-stack.png', category: 'Workspace', pinned: true, recentWeight: 10, description: 'Browse lesson assets, builder files, and project structure.', launcherKeywords: ['explorer', 'folders', 'documents'] },
  { type: 'wallpaper', label: 'WALLPAPER', icon: Sparkles, color: KRACKED_COLORS.accentAmber, defaultW: 600, defaultH: 480, title: 'Wallpaper', desktopIconImage: '/icons/wallpaper.png', category: 'Personalize', pinned: false, recentWeight: 4, description: 'Adjust the KRACKED shell look without changing the workflow.', launcherKeywords: ['background', 'theme', 'personalize'] },
  { type: 'idea_to_prompt', label: 'IDEA_TO_PROMPT', icon: Brain, color: KRACKED_COLORS.accentOrange, defaultW: 1020, defaultH: 680, title: 'Idea to Prompt', desktopIconImage: '/icons/prompt.png', category: 'Builder', pinned: true, recentWeight: 9, description: 'Turn a structured idea map into an editable ROFCO master prompt.', launcherKeywords: ['mind map', 'prompt', 'builder brief', 'rofco'] },
  { type: 'simulator', label: 'SIMULATOR', icon: Activity, color: KRACKED_COLORS.accentGreen, defaultW: 820, defaultH: 580, title: 'Simulator', desktopIconImage: '/icons/SIMULATOR.png', category: 'Learning', pinned: false, recentWeight: 5, description: 'Test flows and simulate product behavior inside the workspace.', launcherKeywords: ['testing', 'preview', 'simulation'] }
];
