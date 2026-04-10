# MAJI Actions - moonwiraja

Append-only action log for portable MAJI memory.


### 2026-04-10
- [x] Integrated `roticanai` Next.js app as a hosted app (`iframe` surface).
- [x] Refactored `package.json` to use `concurrently` for Vite + Bun dev servers.
- [x] Implemented `auth-popup` and `auth-callback` pages in Roticanai to fix OAuth in iframes.
- [x] Modified `Better-Auth` server config for cross-site cookie support (`SameSite: None`).
- [x] Updated `kdStoreCatalog.js` and `appRegistry.js` with Rotican branding (custom icon).
- [x] Disabled UI loading/fallback overlays in `HostedWebAppWindowContent.jsx`.
