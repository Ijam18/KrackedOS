import { FILE_KIND_BY_EXTENSION, WORKSPACE_PATHS } from './constants.js';

export function normalizeOsPath(value) {
  const raw = String(value || '').trim().replace(/\//g, '\\');
  if (!raw) return WORKSPACE_PATHS.root;

  let next = raw.replace(/\\+/g, '\\');
  if (/^[a-z]:$/i.test(next)) return `${next.slice(0, 1).toUpperCase()}:\\`;

  if (/^[a-z]:\\/i.test(next)) {
    next = `${next.slice(0, 1).toUpperCase()}${next.slice(1)}`;
  }

  if (next.length > 3 && next.endsWith('\\')) {
    next = next.slice(0, -1);
  }

  return next;
}

export function joinOsPath(...parts) {
  return normalizeOsPath(
    parts
      .filter(Boolean)
      .map((part) => String(part).replace(/\//g, '\\').replace(/^\\+|\\+$/g, ''))
      .join('\\')
  );
}

export function basenameFromPath(path) {
  const normalized = normalizeOsPath(path);
  if (/^[A-Z]:\\$/i.test(normalized)) return normalized;
  const segments = normalized.split('\\').filter(Boolean);
  return segments[segments.length - 1] || normalized;
}

export function dirnameFromPath(path) {
  const normalized = normalizeOsPath(path);
  if (normalized === WORKSPACE_PATHS.root) return 'C:\\';
  if (/^[A-Z]:\\$/i.test(normalized)) return normalized;

  const segments = normalized.split('\\');
  if (segments.length <= 2) return `${segments[0]}\\`;
  return normalizeOsPath(segments.slice(0, -1).join('\\'));
}

export function extnameFromPath(path) {
  const name = basenameFromPath(path);
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

export function isPathEqual(a, b) {
  return normalizeOsPath(a).toLowerCase() === normalizeOsPath(b).toLowerCase();
}

export function isChildPath(parentPath, nextPath) {
  const parent = normalizeOsPath(parentPath).toLowerCase();
  const child = normalizeOsPath(nextPath).toLowerCase();
  if (parent === child) return false;
  return child.startsWith(`${parent}\\`);
}

export function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'directory' ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
}

export function sanitizeFileName(value, fallback = 'untitled') {
  const next = String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return next || fallback;
}

export function inferFileKind(path, explicitKind = '') {
  if (explicitKind) return explicitKind;
  const ext = extnameFromPath(path);
  return FILE_KIND_BY_EXTENSION[ext] || 'file';
}

export function dataUrlToMimeType(value = '') {
  const match = /^data:([^;]+);/i.exec(String(value));
  return match?.[1] || 'application/octet-stream';
}

export function dataUrlToExtension(value = '') {
  const mimeType = dataUrlToMimeType(value);
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'bin';
  }
}

export function createEntryRecord(path, overrides = {}) {
  const normalizedPath = normalizeOsPath(path);
  const type = overrides.type || 'file';
  return {
    path: normalizedPath,
    name: overrides.name || basenameFromPath(normalizedPath),
    parentPath: overrides.parentPath || dirnameFromPath(normalizedPath),
    type,
    fileKind: overrides.fileKind || inferFileKind(normalizedPath, overrides.fileKind),
    ext: overrides.ext || (type === 'file' ? extnameFromPath(normalizedPath) : ''),
    content: overrides.content ?? null,
    mimeType: overrides.mimeType || '',
    readonly: Boolean(overrides.readonly),
    source: overrides.source || 'workspace',
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    meta: overrides.meta || {}
  };
}
