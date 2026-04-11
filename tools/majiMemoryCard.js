import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MAJI_ROOT = path.join(REPO_ROOT, 'krack', 'core', 'maji');
const USERS_ROOT = path.join(MAJI_ROOT, 'users');
const SHARED_CORE_FILES = [
  'master-memory.md',
  path.join('main', 'identity-core.md'),
  path.join('main', 'relationship-memory.md'),
  path.join('main', 'current-session.md')
];

function slugifyUserName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function hashValue(value = '') {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 8);
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function readGitConfigValue(key) {
  try {
    return execFileSync('git', ['config', '--get', key], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function getLocalGitIdentity() {
  const gitName = readGitConfigValue('user.name');
  const gitEmail = normalizeEmail(readGitConfigValue('user.email'));

  return {
    gitName,
    gitEmail,
    identityKey: gitEmail ? `email:${gitEmail}` : ''
  };
}

function ensureNonEmptyName(name = '') {
  const trimmed = String(name).trim();
  if (!trimmed) {
    throw new Error('Nama diperlukan untuk aktifkan MAJI buat kali pertama.');
  }
  return trimmed;
}

function getUserPaths(userSlug) {
  const baseDir = path.join(USERS_ROOT, userSlug);
  return {
    baseDir,
    profile: path.join(baseDir, 'profile.json'),
    actions: path.join(baseDir, 'actions.md'),
    summary: path.join(baseDir, 'current-summary.md')
  };
}

async function readAllProfiles() {
  await ensureDir(USERS_ROOT);
  const entries = await fs.readdir(USERS_ROOT, { withFileTypes: true });
  const profiles = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const profile = await readJson(path.join(USERS_ROOT, entry.name, 'profile.json'), null);
    if (profile?.slug) {
      profiles.push(profile);
    }
  }

  return profiles;
}

async function resolveUserSlug(displayName) {
  const normalizedDisplayName = ensureNonEmptyName(displayName);
  const baseSlug = slugifyUserName(normalizedDisplayName);

  if (!baseSlug) {
    throw new Error('Nama itu tak boleh dinormalize jadi user id yang sah.');
  }

  const gitIdentity = getLocalGitIdentity();
  const profiles = await readAllProfiles();

  if (gitIdentity.identityKey) {
    const existingByIdentity = profiles.find((profile) => profile.identityKey === gitIdentity.identityKey);
    if (existingByIdentity?.slug) {
      return {
        slug: existingByIdentity.slug,
        gitIdentity,
        existingProfile: existingByIdentity
      };
    }
  }

  const fallbackMatch = profiles.find((profile) => !profile.identityKey && slugifyUserName(profile.displayName) === baseSlug);
  if (fallbackMatch?.slug) {
    return {
      slug: fallbackMatch.slug,
      gitIdentity,
      existingProfile: fallbackMatch
    };
  }

  if (gitIdentity.gitEmail) {
    return {
      slug: `${baseSlug}-${hashValue(gitIdentity.gitEmail)}`,
      gitIdentity,
      existingProfile: null
    };
  }

  let nextSlug = baseSlug;
  let counter = 2;
  const usedSlugs = new Set(profiles.map((profile) => profile.slug));
  while (usedSlugs.has(nextSlug)) {
    nextSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return {
    slug: nextSlug,
    gitIdentity,
    existingProfile: null
  };
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function readText(filePath, fallback = '') {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function toSectionText(title, lines = []) {
  return [`## ${title}`, ...lines.filter(Boolean), ''].join('\n');
}

function summarizeMessages(messages = []) {
  const normalized = Array.isArray(messages) ? messages : [];
  const userMessages = normalized
    .filter((message) => message?.role === 'user')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);
  const assistantMessages = normalized
    .filter((message) => message?.role === 'assistant')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);

  const recentTopics = userMessages.slice(-5);
  const recentActions = recentTopics.filter((message) => message.length <= 120).slice(-4);
  const recentHighlights = assistantMessages.slice(-3);

  return {
    messageCount: normalized.length,
    recentTopics,
    recentActions,
    recentHighlights,
    summaryLine: recentTopics.length
      ? `Topik terkini: ${recentTopics.join(' | ')}`
      : 'Tiada mesej panjang, tapi checkpoint MAJI tetap dipreserve.'
  };
}

function buildSummaryMarkdown({ profile, messageSummary, savedAt }) {
  return [
    '# Current User Summary',
    '',
    `- Name: ${profile.displayName}`,
    `- Slug: ${profile.slug}`,
    `- Last Saved At: ${savedAt}`,
    `- Total Messages In Snapshot: ${messageSummary.messageCount}`,
    '',
    toSectionText('Session Summary', [
      messageSummary.summaryLine
    ]),
    toSectionText('Recent Actions', messageSummary.recentActions.map((item) => `- ${item}`)),
    toSectionText('Recent Highlights', messageSummary.recentHighlights.map((item) => `- ${item}`))
  ].join('\n');
}

function buildActionLogEntry({ profile, messageSummary, savedAt }) {
  return [
    `## ${savedAt}`,
    `- User: ${profile.displayName} (\`${profile.slug}\`)`,
    `- Messages captured: ${messageSummary.messageCount}`,
    `- Summary: ${messageSummary.summaryLine}`,
    '',
    '### Actions',
    ...(messageSummary.recentActions.length ? messageSummary.recentActions.map((item) => `- ${item}`) : ['- Tiada action ringkas yang jelas dalam snapshot ini.']),
    '',
    '### Highlights',
    ...(messageSummary.recentHighlights.length ? messageSummary.recentHighlights.map((item) => `- ${item}`) : ['- Tiada highlight assistant yang jelas dalam snapshot ini.']),
    '',
    ''
  ].join('\n');
}

async function ensureUserOverlay(name) {
  const displayName = ensureNonEmptyName(name);
  const { slug, gitIdentity, existingProfile } = await resolveUserSlug(displayName);

  const paths = getUserPaths(slug);
  await ensureDir(paths.baseDir);

  const storedProfile = existingProfile || await readJson(paths.profile, null);
  const profile = {
    slug,
    displayName,
    createdAt: storedProfile?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    identityKey: gitIdentity.identityKey || storedProfile?.identityKey || '',
    gitName: gitIdentity.gitName || storedProfile?.gitName || '',
    gitEmailHint: gitIdentity.gitEmail ? hashValue(gitIdentity.gitEmail) : (storedProfile?.gitEmailHint || '')
  };

  await fs.writeFile(paths.profile, JSON.stringify(profile, null, 2), 'utf8');

  const existingActions = await readText(paths.actions, '');
  if (!existingActions.trim()) {
    await fs.writeFile(
      paths.actions,
      `# MAJI Actions - ${displayName}\n\nAppend-only action log for portable MAJI memory.\n\n`,
      'utf8'
    );
  }

  const existingSummary = await readText(paths.summary, '');
  if (!existingSummary.trim()) {
    await fs.writeFile(
      paths.summary,
      [
        '# Current User Summary',
        '',
        `- Name: ${displayName}`,
        `- Slug: ${slug}`,
        `- Last Saved At: ${profile.updatedAt}`,
        '',
        '## Session Summary',
        'MAJI user overlay initialized.',
        ''
      ].join('\n'),
      'utf8'
    );
  }

  return { profile, paths };
}

async function readUserOverlay(slug) {
  if (!slug) return null;
  const paths = getUserPaths(slug);
  const profile = await readJson(paths.profile, null);
  if (!profile) return null;

  return {
    profile,
    paths,
    summary: await readText(paths.summary, ''),
    actions: await readText(paths.actions, '')
  };
}

function extractSummaryLine(summaryText = '') {
  const lines = String(summaryText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const summaryLine = lines.find((line) => line.startsWith('Topik terkini:'));
  return summaryLine || lines.find((line) => !line.startsWith('#') && !line.startsWith('-')) || 'Belum ada summary semasa.';
}

async function listKnownUsers() {
  await ensureDir(USERS_ROOT);
  const entries = await fs.readdir(USERS_ROOT, { withFileTypes: true });
  const overlays = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const overlay = await readUserOverlay(entry.name);
    if (overlay?.profile) {
      overlays.push({
        slug: overlay.profile.slug,
        displayName: overlay.profile.displayName,
        updatedAt: overlay.profile.updatedAt || overlay.profile.createdAt || ''
      });
    }
  }

  return overlays.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

export async function loadMajiMemoryCard({ activeUserSlug = '' } = {}) {
  const sharedCore = SHARED_CORE_FILES.map((relativePath) => ({
    relativePath,
    fullPath: path.join(MAJI_ROOT, relativePath)
  }));
  const activeOverlay = await readUserOverlay(activeUserSlug);
  const knownUsers = await listKnownUsers();
  const contributorSummaries = await Promise.all(
    knownUsers.map(async (user) => {
      const overlay = await readUserOverlay(user.slug);
      return {
        slug: user.slug,
        displayName: user.displayName,
        updatedAt: user.updatedAt,
        summaryLine: extractSummaryLine(overlay?.summary || '')
      };
    })
  );

  return {
    requiresOnboarding: !activeOverlay,
    activeUser: activeOverlay?.profile || null,
    activeSummary: activeOverlay?.summary || '',
    sharedCore: sharedCore.map((item) => item.relativePath),
    knownUsers,
    contributorSummaries,
    loadedAt: new Date().toISOString()
  };
}

export async function onboardMajiUser({ name = '' } = {}) {
  const { profile } = await ensureUserOverlay(name);
  const payload = await loadMajiMemoryCard({ activeUserSlug: profile.slug });

  return {
    ...payload,
    created: true
  };
}

export async function saveMajiMemoryCard({ activeUserSlug = '', messages = [] } = {}) {
  const overlay = await readUserOverlay(activeUserSlug);

  if (!overlay?.profile) {
    throw new Error('MAJI belum ada user aktif. Guna `MAJI` dulu dan masukkan nama untuk aktifkan memory card.');
  }

  const savedAt = new Date().toISOString();
  const messageSummary = summarizeMessages(messages);
  const nextProfile = {
    ...overlay.profile,
    updatedAt: savedAt
  };

  await fs.writeFile(overlay.paths.profile, JSON.stringify(nextProfile, null, 2), 'utf8');
  await fs.appendFile(overlay.paths.actions, buildActionLogEntry({ profile: nextProfile, messageSummary, savedAt }), 'utf8');
  await fs.writeFile(overlay.paths.summary, buildSummaryMarkdown({ profile: nextProfile, messageSummary, savedAt }), 'utf8');

  return {
    status: 'saved',
    savedAt,
    activeUser: nextProfile,
    messageSummary,
    paths: {
      profile: path.relative(REPO_ROOT, overlay.paths.profile),
      actions: path.relative(REPO_ROOT, overlay.paths.actions),
      summary: path.relative(REPO_ROOT, overlay.paths.summary)
    }
  };
}

export { REPO_ROOT, MAJI_ROOT, USERS_ROOT, slugifyUserName };
