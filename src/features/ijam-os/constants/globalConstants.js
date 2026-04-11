// KRACKED_OS Constants
// Extracted from App.jsx for better maintainability

export const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || 'zarulijam@gmail.com').trim().toLowerCase();
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'zarulijam@gmail.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const DISTRICT_INFO = {
    sungai_besar: { name: 'Sungai Besar' },
    tanjong_karang: { name: 'Tanjong Karang' },
    selayang: { name: 'Selayang' },
    kuala_lumpur: { name: 'Kuala Lumpur' },
    sabak_bernam: { name: 'Sabak Bernam' },
    kuala_selangor: { name: 'Kuala Selangor' },
    kapar: { name: 'Kapar' },
    shah_alam: { name: 'Shah Alam' },
    damansara_utama: { name: 'Damansara Utama' },
    petaling_jaya: { name: 'Petaling Jaya' },
    kota_raya: { name: 'Kota Raya' },
    subang_jaya: { name: 'Subang Jaya' },
    puchong: { name: 'Puchong' },
    pandan_indah: { name: 'Pandan Indah' },
    ampang: { name: 'Ampang' },
    serdang: { name: 'Serdang' },
    putrajaya: { name: 'Putrajaya' },
    hulu_selangor: { name: 'Hulu Selangor' },
    klang: { name: 'Klang' },
    gombak: { name: 'Gombak' },
    petaling: { name: 'Petaling' },
    hulu_langat: { name: 'Hulu Langat' },
    kuala_langat: { name: 'Kuala Langat' },
    sepang: { name: 'Sepang' }
};

export const DISTRICT_OPTIONS = Array.from(
    new Set(Object.values(DISTRICT_INFO).map((entry) => entry.name))
).sort();

export const ANCHOR_PATH_TO_DISTRICT = {
    'path3353-2': 'sabak_bernam',
    'path3353-0': 'kuala_selangor',
    'path3353-2-6': 'hulu_selangor',
    'path3351-1-1': 'klang',
    'path3353-2-5': 'gombak',
    'path3351-1-1-3': 'petaling',
    'path3353-2-6-7-0': 'hulu_langat',
    'path3351-1-6': 'kuala_langat',
    'path3351-1-6-1': 'sepang'
};

export const MANUAL_REGION_DISTRICT = {
    'path3353-2': 'sungai_besar',
    'path3353-0': 'sabak_bernam',
    'path3353-2-5': 'tanjong_karang',
    'path3353-2-6': 'hulu_selangor',
    'path3351-1-1': 'kuala_selangor',
    'path3353-2-6-7-0-4': 'ampang',
    'path3353-2-6-7-0': 'gombak',
    'path3353-2-6-7': 'selayang',
    'path3353-2-6-7-7': 'damansara_utama',
    'path3351-1-1-3': 'kapar',
    'path3353-2-6-7-0-4-2': 'pandan_indah',
    'path3351-1-1-3-5': 'shah_alam',
    'path3351-1-6-1': 'kota_raya',
    'path3351-1-8': 'kuala_langat',
    'path3351-1-6': 'klang',
    'path7691': 'kapar',
    'path7689': 'kapar',
    'path7760': 'kapar',
    'path7687': 'klang',
    'path3387-0': 'serdang',
    'path3387-7': 'sepang',
    'path5680': 'putrajaya',
    'path3351-1-6-1-0': 'puchong',
    'path3351-1-6-1-0-6': 'kuala_lumpur',
    'path3351-1-1-3-5-4': 'subang_jaya',
    'path3351-1-1-3-5-4-0': 'petaling_jaya',
    'path3351-1-1-3-5-4-0-7': 'petaling_jaya',
};

export const BUNDLED_HOVER_DISTRICTS = new Set(['klang', 'kapar', 'petaling_jaya']);
export const DEFAULT_MAP_FILL = '#f5d000';
export const TERMINAL_CONTEXT = 'malaysia:~/Selangor';
export const DEPLOY_COMMAND = '$ vibe deploy --target live';

export const HEADER_LINKS = [
    { label: 'Map', sectionId: 'map' },
    { label: 'Forum', page: 'forum' },

    { label: 'Showcase', page: 'showcase' },
    { label: 'Leaderboard', page: 'leaderboard' },
    { label: 'How it works', page: 'how-it-works' },
    { label: 'Coming Soon', page: 'coming-soon' }
];

export const SPRINT_MODULE_STEPS = [
    'Day 1: Concept & Problem Identification',
    'Day 2: Target User Profile',
    'Day 3: One-Liner Value Proposition',
    'Day 4: Core Feature Blueprint',
    'Day 5: Visual Interface & Vibe',
    'Day 6: Final Description & Polish',
    'Day 7: [Live] Show & Final Review'
];

export const KL_SHOWCASE_CACHE_KEY = 'kl_showcase_cache_v1';

// Game constants
export const GAME_ITEMS = [
    { id: 'desk_basic', name: 'Basic Desk', cost: 0, buildRate: 1, level: 1, emoji: '🪑' },
    { id: 'laptop', name: 'Laptop', cost: 100, buildRate: 3, level: 1, emoji: '💻' },
    { id: 'coffee', name: 'Coffee Mug', cost: 50, buildRate: 1, level: 1, emoji: '☕' },
    { id: 'plant', name: 'Office Plant', cost: 80, buildRate: 1, level: 2, emoji: '🌱' },
    { id: 'bookshelf', name: 'Tech Bookshelf', cost: 200, buildRate: 5, level: 2, emoji: '📚' },
    { id: 'selangor_flag', name: 'Selangor Flag', cost: 250, buildRate: 5, level: 2, emoji: '🏴' },
    { id: 'whiteboard', name: 'Whiteboard', cost: 300, buildRate: 7, level: 3, emoji: '📋' },
    { id: 'monitor_dual', name: 'Dual Monitors', cost: 500, buildRate: 10, level: 3, emoji: '🖥️' },
    { id: 'standing_desk', name: 'Standing Desk', cost: 400, buildRate: 8, level: 4, emoji: '🏋️' },
    { id: 'trophy', name: 'Sprint Trophy', cost: 1000, buildRate: 15, level: 5, emoji: '🏆' },
    { id: 'rocket', name: 'Rocket Model', cost: 800, buildRate: 12, level: 5, emoji: '🚀' },
    { id: 'server_rack', name: 'Server Rack', cost: 1500, buildRate: 20, level: 7, emoji: '🖧' },
];

export const GAME_LEVELS = [
    { level: 1, xpRequired: 0, label: 'Newbie Builder' },
    { level: 2, xpRequired: 100, label: 'Junior Builder' },
    { level: 3, xpRequired: 300, label: 'Builder' },
    { level: 4, xpRequired: 600, label: 'Senior Builder' },
    { level: 5, xpRequired: 1000, label: 'Expert Builder' },
    { level: 6, xpRequired: 1500, label: 'Master Builder' },
    { level: 7, xpRequired: 2500, label: 'Legendary Builder' },
];

export const GAME_VIBE_REWARDS = {
    class_attendance: 50,
    sprint_submission: 100,
    forum_post: 20,
    forum_reply: 10,
    bug_squash: 5,
};

export const GAME_XP_REWARDS = {
    class_attendance: 25,
    sprint_submission: 50,
    forum_post: 5,
    item_purchase: 10,
};
