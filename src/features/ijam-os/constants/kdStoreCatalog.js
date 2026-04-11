export const KDSTORE_CATALOG_VERSION = 2;

// Crew app catalog is auto-generated from crew/*/crew.json at build time.
// This file provides the runtime catalog for the KDStore UI.
// To add a new app: create crew/<your-name>/crew.json with your app declaration.

// /rotican/ms works in both dev and prod:
// - Dev: Vite proxies /rotican/* → roticanai at localhost:3003 (prefix stripped)
// - Prod: Vercel edge rewrite in vercel.json proxies /rotican/:path* → Moon's
//         separate Vercel deployment (e.g. https://rotican-ai.vercel.app/:path*)
function loadCrewCatalog() {
  return [
    {
      id: 'rotican-ai',
      slug: 'rotican-ai',
      title: 'Rotican.ai',
      label: 'ROTICAN.AI',
      description: 'AI-powered web app builder by Moon',
      category: 'Crew App',
      launchUrl: '/rotican/ms',
      homeUrl: '/rotican/ms',
      allowedOrigins: ['*'],
      launchSurface: 'iframe',
      fallbackMode: 'iframe',
      authPolicy: 'embedded-ok',
      requiresExternalAuth: false,
      authProviders: ['GitHub', 'Google', 'Discord'],
      authNote: 'Rotican launches as local iframe inside KDOS.',
      windowChrome: 'browser',
      defaultW: 1220,
      defaultH: 760,
      featured: true,
      autoInstall: true,
      desktopVisible: true,
      startMenuVisible: true,
      iconImage: '/icons/rotican.png',
      color: '#f97316',
      launcherKeywords: ['rotican', 'ai', 'builder', 'crew app', 'moonwiraja'],
      crewMember: 'moonwiraja'
    }
  ];
}

export const KDSTORE_CATALOG = loadCrewCatalog();

export function findCatalogAppById(catalogId, catalog = KDSTORE_CATALOG) {
  return catalog.find((item) => item.id === catalogId) || null;
}

export function findCatalogAppBySlug(slug, catalog = KDSTORE_CATALOG) {
  return catalog.find((item) => item.slug === slug) || null;
}
