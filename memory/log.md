# IJAM Persistent Memory

This file stores long-term project knowledge and successful patterns for **KRACKED_OS**.

## Project Context
- **Name**: KRACKED_OS
- **Architecture**: Vite + React + Framer Motion
- **Vision**: NECB - Now Everyone Can Build

## Recent Learning Moments (2026-03-06)

### 1. Interactive Loading Screen Refinement
- **Achievement**: Successfully transformed a static reference image into an aspect-ratio locked, interactive loading screen with a custom clock cluster and typewriter animations.
- **Pattern**: Used `motion.div` with absolute positioning (%) alongside a container pinned to the background image aspect ratio to ensure pixel-perfect alignment across resolutions.
- **Key Files**: `src/features/ijam-os/components/loading/KrackedInteractiveLoading.jsx`
- **Deployment**: Pushed to [https://github.com/Ijam18/KrackedOS.git](https://github.com/Ijam18/KrackedOS.git)

### 2. Branding & Assets
- **Logo**: Transparent "KDA" SVG logo implemented as favicon and UI element.
- **Tone**: Established "Malaysian Chill" casual persona for the IJAM proxy.

## Skill Promotion Candidates
- **Vibe Loading Layouts**: We have refined this layout multiple times. If similar "Integrated Graphic UI" tasks appear, promote this to a **Visual Design Skill**.
- **GitHub Deployment Workflow**: Repeatable pattern for pushing and initializing repos.

## Active Search Queries
- "loading screen positioning"
- "framer-motion typewriter"
- "svg favicon transparency"

## Session Updates (2026-03-07)

### 1. IjamOS Desktop Workspace Layout
- Set `IjamOSWorkspace` main container to full viewport behavior (`100%` width + `100vh` height context).
- Adjusted desktop grid area and top-bar spacing behavior for mac desktop mode.
- Removed weather text line from top status area per user request.

### 2. Desktop Icons: Drag/Drop + Slot System
- Implemented slot-based desktop icon arrangement (apps map to fixed slots, not just sequential list order).
- Added drag/drop movement between slots with swap behavior.
- Enabled dynamic columns/rows calculation based on available screen/container size.
- Ensured slot rendering fills available viewport grid without overflow beyond screen.
- Updated interaction so icon positioning is persistent in local storage.

### 3. Persistence & Restore Behavior
- Introduced/updated storage key flow for desktop slot persistence:
  - `ijamos_desktop_icon_slots` as primary source.
  - fallback migration from legacy `ijamos_desktop_icon_order`.
- Improved hydrate/save sequencing to avoid overwrite race on refresh.
- Goal: icon positions remain after refresh/reopen on same machine.

### 4. Desktop Icon Visual System
- Unified desktop icon style to image-first visual presentation (no heavy boxed background).
- Added support for per-app custom icon image via `desktopIconImage`.
- Added optional per-app icon zoom via `desktopIconScale`.
- Applied custom user-provided images:
  - `FILES` -> `/icons/files-stack.png`
  - `STATS` -> `/icons/profile-icon.png`
- Tuned icon-to-label spacing tighter as requested.

### 5. Window Open Behavior (White Screen Fix)
- Added `Suspense` fallbacks (`WindowModuleLoader`) for lazy-loaded windows:
  - `KDACADEMY`, `ARCADE`, `MIND_MAP`, `PROMPT_FORGE`, `SIMULATOR`, `MISSION`
  - plus terminal pane lazy flow in academy context.
- Prevents blank white view while modules are loading.

### 6. Verification
- Repeatedly validated updates with `npm run build` after each major patch.
- Build remained successful after latest state.

## Session Updates (2026-03-08)

### 1. Pixel MMORPG Boot Screen Redesign
- Replaced the old `KrackedInteractiveLoading` layout with a new pixel-art MMORPG boot screen.
- Kept the existing public props and boot flow unchanged:
  - `bootPhase`
  - `bootProgress`
  - `onConfirmBoot`
  - `systemTime`
  - `systemDate`
- Preserved the close hotspot via `close-ijam-os`.

### 2. Boot Screen Visual System
- New boot screen uses layered pixel scenery instead of a flat full-screen reference image.
- Reused local KRACKED_OS assets for skyline, jungle layers, and character sprites.
- Added internal section split for maintainability:
  - `BootLogoCluster`
  - `BootStatusCard`
  - `BootEnterCard`
  - `BootSceneSprite`
  - `BootAmbientOverlay`
- Added pixel-style scanlines, floating particles, parallax motion, and a restyled boot progress bar.

### 3. Paper-First Boot Design
- Created two Paper artboards in `Kracked_OS`:
  - `Boot Screen - Desktop` (`1440x900`)
  - `Boot Screen - Mobile` (`390x844`)
- Paper artboards act as the visual source for the new boot screen direction and layout hierarchy.

### 4. Spec Documentation
- Added a repo-side implementation spec for the boot screen at:
  - `src/features/ijam-os/components/loading/KrackedInteractiveLoading.spec.md`
- Pattern validated: Paper artboard + React implementation + spec doc is a good workflow for larger visual refactors.

### 5. Verification
- Verified the new boot screen implementation with `npm run build`.
- Build completed successfully after the redesign.

### 6. Skill Packaging Workflow
- Registered LobeHub Marketplace CLI locally at `C:\Users\Moon\.lobehub-market\credentials.json`.
- Installed marketplace skill `omer-metin-skills-for-antigravity-pixel-art-sprites` into workspace-local `.agents/skills/`.
- Read the installed skill and its reference files before adapting it.
- Created a Moon-local Codex skill based on it at:
  - `C:\Users\Moon\.codex\skills\moon-pixel-art-sprites`
- New skill focuses on:
  - pixel art sprites
  - sprite sheets
  - tilesets
  - retro UI
  - Paper + React pixel workflow for KRACKED_OS
- Validated the skill successfully with the system `quick_validate.py` script.

### 7. Paper-First Pixel Boot Screen Refresh
- Rebuilt the `Kracked_OS` Paper artboards `Boot Screen - Desktop` and `Boot Screen - Mobile` with layered pixel MMORPG composition closer to the legacy KD loadscreen reference.
- Confirmed the correct Paper local-media path format is `http://localhost:29979/media/Users/...` for this Windows setup.
- Reused local background layers:
  - `sky.png`
  - `background.png`
  - `midground.png`
- Derived reusable boot-scene crop assets from `foreground.png`:
  - `boot-canopy-left.png`
  - `boot-canopy-right.png`
  - `boot-hero-cliff.png`
  - `boot-monkey-accent.png`

### 8. Boot Screen Code Refactor
- Refactored `KrackedInteractiveLoading.jsx` into Paper-mapped sections:
  - `BootBackgroundLayers`
  - `BootLogoCluster`
  - `BootTaglineStrip`
  - `BootStatusCard`
  - `BootEnterCard`
  - `BootHeroCliff`
  - `BootCreatureAccent`
  - `BootFooterPortalSwitch`
  - `BootAmbientOverlay`
- Kept the existing public API untouched:
  - `bootPhase`
  - `bootProgress`
  - `onConfirmBoot`
  - `systemTime`
  - `systemDate`
- Added dedicated CSS file `KrackedInteractiveLoading.css` for the pixel boot screen styling.

### 9. Verification
- Updated the boot screen spec file to match the new asset mapping and component structure.
- Verified the refresh with `npm run build` successfully after Paper + React alignment.

### 10. Boot Screen Polish Pass
- User requested a more mature second-pass polish for both desktop and mobile boot screen layouts while keeping the current background theme.
- Rebuilt the active Paper roots so the current artboards now point to:
  - desktop root `58-0`
  - mobile root `59-0`
- Reimported the layered Paper scene using the confirmed local-media path and renamed the base scene nodes into structured groups such as:
  - `00_SkyLayer`
  - `04_CityLayer`
  - `05_MidgroundJungle`
  - `06_LeftCanopy`
  - `06_RightCanopy`
  - `07_LeftCliffHero`
  - `08_RightCreatureAccent`
- Hit the weekly Paper MCP tool-call limit during the finer layout pass, so deeper Paper edits for logo/panel/footer layering are currently blocked until the tool resets.
- Continued on the implementation side and polished `KrackedInteractiveLoading.jsx` + `KrackedInteractiveLoading.css` with:
  - stronger center aura and hierarchy
  - improved logo framing
  - more detailed status card and enter card
  - refined footer capsule
  - tighter mobile spacing and smaller canopy/hero/creature composition
- Verified the polish pass again with `npm run build`.

### 11. Paper-to-Code Background Sync Fix
- User reported that the boot-screen background in the app did not match the Paper `Kracked_OS` artboards for both desktop and mobile.
- Root cause: the React/CSS implementation had drifted from Paper because the scene background layers were using hand-tuned responsive values instead of the Paper-exported positions and proportions.
- Fixed the scene mapping in `KrackedInteractiveLoading.css` by:
  - making the boot shell full-viewport sized again
  - making contain-based scene assets respect fixed width+height boxes
  - syncing desktop canopy/cliff/creature ratios to the saved Paper values
  - syncing mobile canopy/cliff/creature ratios to the saved Paper values
- Verified the sync fix with `npm run build`.

### 12. Stitch-style Boot Screen Merge Refresh
- User asked to keep the current direction and merge it into a cleaner, more polished pixel MMORPG boot screen inspired by the reference image.
- Rebuilt `KrackedInteractiveLoading.jsx` into a structured implementation with:
  - layered scene overlays
  - pixel sparkles
  - two sprite accents (`Mage1_local.png`, `Guildmaster_local.png`)
  - centered two-column 3D pixel panel
  - CTA `CLICK TO ENTER`
  - progress phase segmented loading bar
- Added dedicated stylesheet `KrackedInteractiveLoading.css` for desktop/mobile visual consistency and pixel UI depth.
- Kept boot flow API compatibility:
  - `bootPhase`
  - `bootProgress`
  - `onConfirmBoot`
  - `systemTime`
  - `systemDate`
- Preserved close behavior via `close-ijam-os`.
- Verified with `npm run build`.

### 13. Layered Boot Asset Rebuild Without Stitch MCP
- User rejected the wallpaper-led boot screen and requested a full asset-by-asset rebuild before implementation.
- `Stitch MCP` was not available in the current session, so the fallback path was:
  - inspect the real boot component
  - reuse local layered scene assets from `public/kdacademy/assets/backgrounds/`
  - derive dedicated boot sprite PNGs from existing sprite sheets
  - rebuild the boot scene directly in React/CSS as separate layers
- Created dedicated boot sprite assets:
  - `public/kdacademy/assets/boot/boot-mage.png`
  - `public/kdacademy/assets/boot/boot-fighter.png`
  - `public/kdacademy/assets/boot/boot-guildmaster.png`
- Replaced the prior flat wallpaper composition with:
  - layered `sky`, `far`, `mid`, and `front` background PNGs
  - separate hero, companion, and guide sprite layers
  - pixel sparkles, halftone band, horizon glow, vine accent, and a rebuilt 3D boot panel
- Updated:
  - `src/features/ijam-os/components/loading/KrackedInteractiveLoading.jsx`
  - `src/features/ijam-os/components/loading/KrackedInteractiveLoading.css`
- Verified again with `npm run build`.

### 14. Boot Brand Pixel-Match Pass (2026-03-08 12:53)
- User requested the boot logo/header to match the provided reference more closely, especially the rounded <KD/> shape.
- Diagnosed mismatch source: logo was text-based (boot-brand-title) and depended on font rendering, so shape fidelity was unstable.
- Refined branding layout in loading screen:
  - kept KRACKED + DEVS split color styling and restored caption stack (FROM MALAYSIA, FOR EVERYONE)
  - switched <KD/> from text glyph to a dedicated logo asset render in JSX.
- Added dedicated vector asset for stable shape rendering:
  - public/kdacademy/assets/boot/boot-brand-kd.svg
- Updated files:
  - src/features/ijam-os/components/loading/KrackedInteractiveLoading.jsx
  - src/features/ijam-os/components/loading/KrackedInteractiveLoading.css
- Verified with Playwright on desktop and mobile after each adjustment.
- Final verification: npm run build passed successfully.


