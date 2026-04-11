import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CREW_ROOT = path.join(REPO_ROOT, 'crew');

// Scan all crew member directories and return declared apps.
export function discoverCrewApps() {
  const apps = [];

  if (!fs.existsSync(CREW_ROOT)) return apps;

  const members = fs.readdirSync(CREW_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const member of members) {
    const manifestPath = path.join(CREW_ROOT, member.name, 'crew.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!Array.isArray(manifest.apps)) continue;

      for (const app of manifest.apps) {
        apps.push({
          ...app,
          crewMember: manifest.name || member.name,
          crewDisplayName: manifest.displayName || manifest.name || member.name,
          absolutePath: path.join(CREW_ROOT, member.name, app.path)
        });
      }
    } catch (err) {
      console.warn(`[crew] Failed to read ${manifestPath}:`, err.message);
    }
  }

  return apps;
}

// Generate Vite proxy config from discovered crew apps.
export function buildCrewProxyConfig(apps) {
  const proxy = {};

  for (const app of apps) {
    if (!app.proxyPrefix || !app.port) continue;

    const target = `http://localhost:${app.port}`;

    // Proxy the app prefix (rewrite to strip prefix)
    proxy[app.proxyPrefix] = {
      target,
      changeOrigin: true,
      rewrite: (p) => p.replace(new RegExp(`^${app.proxyPrefix}`), ''),
      ws: true
    };

    // Proxy Next.js internals (_next assets, api routes)
    proxy['/_next'] = { target, changeOrigin: true, ws: true };
    proxy['/api'] = { target, changeOrigin: true };
  }

  return proxy;
}

// Generate KDStore catalog entries from discovered crew apps.
export function buildCrewCatalog(apps) {
  return apps.map(app => ({
    id: app.id,
    slug: app.id,
    title: app.title,
    label: app.title.toUpperCase(),
    description: app.description || `${app.title} by ${app.crewDisplayName}`,
    category: 'Crew App',
    launchUrl: `http://localhost:3000${app.proxyPrefix}${app.locale ? '/' + app.locale : ''}`,
    homeUrl: `http://localhost:3000${app.proxyPrefix}${app.locale ? '/' + app.locale : ''}`,
    allowedOrigins: [
      'http://localhost:3000',
      `http://localhost:${app.port}`
    ],
    launchSurface: 'iframe',
    fallbackMode: 'iframe',
    authPolicy: 'embedded-ok',
    requiresExternalAuth: false,
    windowChrome: 'browser',
    defaultW: 1220,
    defaultH: 760,
    featured: true,
    autoInstall: true,
    desktopVisible: true,
    startMenuVisible: true,
    iconImage: app.icon || null,
    color: app.color || '#6366f1',
    launcherKeywords: [app.id, app.crewMember, 'crew app'],
    crewMember: app.crewMember
  }));
}

// Build the dev command that starts all crew apps concurrently.
export function buildCrewDevCommands(apps) {
  return apps
    .filter(app => app.devCommand && app.port)
    .map(app => `cd ${app.absolutePath} && PORT=${app.port} ${app.devCommand}`);
}
