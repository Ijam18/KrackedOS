export const KDSTORE_CATALOG_VERSION = 2;

// Crew app catalog is auto-generated from crew/*/crew.json at build time.
// This file provides the runtime catalog for the KDStore UI.
// To add a new app: create crew/<your-name>/crew.json with your app declaration.

function loadCrewCatalog() {
  // In dev, crew apps are discovered by the Vite plugin (tools/crewDiscovery.js).
  // The catalog entries below are generated from crew manifests.
  // When a new collaborator adds a crew.json, this gets regenerated.
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
