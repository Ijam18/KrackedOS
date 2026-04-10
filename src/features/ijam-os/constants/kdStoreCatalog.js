export const KDSTORE_CATALOG_VERSION = 1;

export const KDSTORE_CATALOG = [
  {
    id: 'rotican-ai',
    slug: 'rotican-ai',
    title: 'Rotican.ai',
    label: 'ROTICAN.AI',
    description: 'Open Rotican.ai inside KDOS as a hosted web app with browser-style controls.',
    category: 'Hosted Web App',
    launchUrl: 'http://localhost:3000',
    homeUrl: 'http://localhost:3000',
    allowedOrigins: ['http://localhost:3000', 'https://rotican.ai'],
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
    launcherKeywords: ['rotican', 'ai', 'builder', 'hosted app', 'web app']
  }
];

export function findCatalogAppById(catalogId, catalog = KDSTORE_CATALOG) {
  return catalog.find((item) => item.id === catalogId) || null;
}

export function findCatalogAppBySlug(slug, catalog = KDSTORE_CATALOG) {
  return catalog.find((item) => item.slug === slug) || null;
}
