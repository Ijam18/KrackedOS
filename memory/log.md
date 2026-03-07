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
