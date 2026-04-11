// Copy Vite build output (dist/) into roticanai/public/
// Run after `npm run build` to refresh the KrackedOS static bundle
// that ships inside the Next.js deployment.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const VITE_DIST = path.join(REPO_ROOT, 'dist');
const ROTICANAI_PUBLIC = path.join(REPO_ROOT, 'crew', 'moonwiraja', 'apps', 'roticanai', 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(VITE_DIST)) {
  console.error('[copy-vite] dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// Clean stale hashed asset files from public/assets/ (but keep character/environment folders)
const publicAssetsDir = path.join(ROTICANAI_PUBLIC, 'assets');
if (fs.existsSync(publicAssetsDir)) {
  for (const entry of fs.readdirSync(publicAssetsDir)) {
    const full = path.join(publicAssetsDir, entry);
    if (fs.statSync(full).isFile()) {
      fs.unlinkSync(full);
    }
  }
}

// Rename dist/index.html → dist/kos.html so it doesn't conflict with Next.js.
const indexHtml = path.join(VITE_DIST, 'index.html');
const kosHtml = path.join(VITE_DIST, 'kos.html');
if (fs.existsSync(indexHtml)) {
  fs.renameSync(indexHtml, kosHtml);
}

copyRecursive(VITE_DIST, ROTICANAI_PUBLIC);
console.log('[copy-vite] Copied Vite dist/ → roticanai/public/');
