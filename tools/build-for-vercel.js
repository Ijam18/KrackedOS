// Single-deploy build script for Vercel
// Builds KrackedOS (Vite) at repo root, then copies output into roticanai/public/
// so that Next.js serves KrackedOS static files at "/" while Next.js itself runs under /rotican/*

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ROTICANAI_DIR = path.join(REPO_ROOT, 'crew', 'moonwiraja', 'apps', 'roticanai');
const ROTICANAI_PUBLIC = path.join(ROTICANAI_DIR, 'public');
const VITE_DIST = path.join(REPO_ROOT, 'dist');

function log(msg) {
  console.log(`[build-for-vercel] ${msg}`);
}

function run(cmd, cwd) {
  log(`$ ${cmd}${cwd ? ` (in ${path.relative(REPO_ROOT, cwd)})` : ''}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || REPO_ROOT });
}

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

// ---------- Step 1: Install root deps ----------
log('Installing root dependencies...');
run('npm install --no-audit --no-fund');

// ---------- Step 2: Build KrackedOS (Vite) ----------
log('Building KrackedOS (Vite)...');
run('npm run build');

if (!fs.existsSync(VITE_DIST)) {
  throw new Error('Vite build failed: dist/ not found');
}

// ---------- Step 3: Copy Vite dist into roticanai/public/ ----------
log('Copying Vite dist into roticanai/public/...');

// Rename dist/index.html to dist/kos.html first, so it doesn't conflict with Next.js
const kosHtmlSrc = path.join(VITE_DIST, 'index.html');
const kosHtmlTmp = path.join(VITE_DIST, 'kos.html');
if (fs.existsSync(kosHtmlSrc)) {
  fs.renameSync(kosHtmlSrc, kosHtmlTmp);
}

copyRecursive(VITE_DIST, ROTICANAI_PUBLIC);

log('KrackedOS static files copied to roticanai/public/');

// ---------- Step 4: Install roticanai deps ----------
log('Installing roticanai dependencies...');
run('bun install', ROTICANAI_DIR);

// ---------- Step 5: Build roticanai (Next.js) ----------
log('Building roticanai (Next.js)...');
run('bun run build', ROTICANAI_DIR);

log('Done. Single-deploy build complete.');
