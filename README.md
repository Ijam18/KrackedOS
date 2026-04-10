# KRACKED_OS 🚀

**AI-powered builder workspace for planning, creating, and shipping apps.**

## What KRACKED_OS Is

**KRACKED_OS** is a Builder OS for founders, makers, and AI-assisted builders who want one environment to move from idea to plan to execution.

It combines a desktop-style workspace, AI guidance, builder tools, and persistent context into a single system built around **NECB: Now Everyone Can Build**.

It is designed to support both browser and desktop-like workflows while staying practical for real product work.

## Core Capabilities

- **Builder workspace**: A desktop-style shell for opening tools, navigating work, and keeping momentum in one place.
- **AI assistance**: KRACKED_OS includes an AI-guided operating layer for context, planning, and builder support.
- **Builder tools**: The workspace is designed to help move from raw idea to structured execution.
- **Hosted web apps**: KDSTORE can install curated hosted apps into the KDOS desktop and start menu.
- **Persistence**: Session continuity, memory, and system context support longer-lived work.
- **Installability**: The app supports PWA-style install flows and desktop-like usage patterns.

## Quick Start

### 1. Installation
```bash
npm install
```

### 2. Development
```bash
npm run dev
```

### 3. Activate The Internal AI Layer
Load `MajiOS/index/master-majios.md` first, then `MajiOS/system/IJAM_UNIFIED.md` to activate the unified memory-and-method layer with full project context.

## How To Work On KRACKED_OS

This is the recommended contributor flow when you pull the repo and start building.

### 1. Pull and install
```bash
git pull origin main
npm install
```

### 2. Start the app
Use browser dev mode for normal frontend work:

```bash
npm run dev
```

Use desktop runtime when you want the Electron bridge:

```bash
npm run desktop
```

### 3. Run `MAJI` first
When you open the internal chat/runtime, start with:

```text
MAJI
```

What happens:
- on first use in your local clone, MAJI asks for your name
- KRACKED_OS creates your personal user overlay in `MajiOS/core/maji/users/<your-slug>/`
- MAJI then loads:
  - shared project doctrine
  - shared BMAD method layer
  - your personal overlay
  - saved contributor summaries from everyone else who has already used `maji save`

Think of this like loading a shared memory card:
- the repo stores the shared memory
- each contributor gets a personal overlay
- everyone can pull the repo and load the accumulated context

### 4. Activate planning mode when needed
If you want the built-in workflow layer, run:

```text
load bmad
```

Then use:

```text
bmad help
bmad brainstorm
bmad plan
bmad review
bmad edge-cases
bmad distill
```

### 5. Use `Idea to Prompt` as the main builder app
The current primary builder flow is:

1. Open `Idea to Prompt`
2. Complete `Step 0: Find Idea`
3. Add a `Reference URL` if you want design/theme scraping
4. Generate the starter ROFCO map
5. Refine the graph and review the generated prompt

`Mind Map` and `Prompt Forge` were removed because `Idea to Prompt` now covers that workflow in one place.

### 6. Save your MAJI memory
When you have made meaningful progress, run:

```text
save
```

or:

```text
maji save
```

This does not create a git commit.

It writes durable repo-backed MAJI memory into your user overlay:
- `profile.json`
- `actions.md`
- `current-summary.md`

That is what lets other contributors pull the repo later and load your saved context through `MAJI`.

### 7. Use KDSTORE for hosted web apps
KDSTORE is the built-in curated app store inside KDOS.

Current flow:

1. Open `KDSTORE`
2. Confirm MAJI preflight is already active for the session
3. Install a curated hosted app
4. Launch it from desktop or the start menu
5. Use the in-window browser chrome first, then fall back to external open when the site needs a stricter browser context

The first seeded hosted app is:

- `Rotican.ai`

### 8. Commit and push code separately
MAJI save and git save are different things.

Use git normally for code:

```bash
git status
git add -A
git commit -m "Describe your change"
git push origin main
```

### 9. Pulling context from other contributors
If another contributor has pushed their work and MAJI memory:

```bash
git pull origin main
```

Then run:

```text
MAJI
```

MAJI will load:
- shared KRACKED_OS doctrine
- your own personal overlay
- contributor summaries from other users who have saved into the repo

This is the main collaboration model for KRACKED_OS.

## Collaboration Rules

- Run `MAJI` at the start of a real work session
- Use `save` or `maji save` to preserve progress into the portable memory layer
- Use git commit/push for code, not for MAJI memory semantics
- Keep shared doctrine in `MajiOS/core/maji/main/`
- Keep per-user memory in `MajiOS/core/maji/users/`
- Do not treat browser-local chat storage as the source of truth
- Pull latest `main` before starting major work so your MAJI context stays current

## MAJI Commands

Use these commands when working through the internal MAJI layer:

```text
MAJI
load bmad
save
maji save
update memory
review growth
load diary archive
load save-diary
save diary
review diary
load problem-solving tools
Load MAJI memory from master-memory.md
```

### BMAD Commands

Use these after `load bmad`:

```text
bmad help
bmad brainstorm
bmad plan
bmad review
bmad edge-cases
bmad distill
```

### Command Guide

- `MAJI` restores MAJI identity, relationship context, and current session memory
- on first use in a local repo clone, `MAJI` asks for the user's name and creates a per-user overlay
- `load bmad` activates the BMAD method engine inside MAJI
- `bmad help` routes the best next step for KRACKED_OS
- `bmad brainstorm` structures ideation for product, feature, or architecture work
- `bmad plan` turns a goal into an actionable work plan
- `bmad review` runs an adversarial review for bugs, regressions, and risks
- `bmad edge-cases` hunts hidden failure modes and overlooked scenarios
- `bmad distill` compresses large docs or repo context into reusable knowledge
- `save` / `maji save` persist durable MAJI and BMAD outcomes into the repo-backed memory card layer
- `update memory` refreshes learned preferences and reusable heuristics
- `review growth` reviews how MAJI guidance has evolved
- `load diary archive` opens the longer-term conversation archive layer
- `load save-diary` loads the session diary system
- `save diary` writes a diary entry for the session
- `review diary` reads recent diary entries
- `load problem-solving tools` activates extra reasoning and analysis helpers
- `Load MAJI memory from master-memory.md` is the manual fallback activation phrase

## High-Level Architecture

- **Frontend runtime**: React + Vite power the main KRACKED_OS workspace.
- **Desktop-style shell**: The product is structured like an operating environment rather than a single static app.
- **AI-aware operating model**: The system includes internal AI, memory, and skill layers that support longer-running builder workflows.
- **Progressive installability**: The app keeps web delivery while supporting installable and desktop-like usage patterns.

## Internal Systems

- **`MajiOS/`**: The canonical memory-and-method architecture behind KRACKED_OS.
- **`MajiOS/core/maji/users/`**: Per-user MAJI overlays that travel with the repo like a shared memory card.
- **`MajiOS/system/`**: IJAM doctrine, skill creation guidance, and architecture references.
- **`MajiOS/engine/memory/`**: Persistent memory engine and logs.
- **`MajiOS/skills/local-skills/`**: The canonical repo-owned local skill library.
- **`MajiOS/method/bmad-source/`**: Vendored BMAD source inside the unified method layer.
- **`.agents/skills/`**: Codex-native installed skill surface.
- **`.claude/`**: Claude Code config and optional Claude-native skill target.
- **`tools/`**: External and advanced tooling bundles that may integrate with MajiOS doctrine without becoming canonical MajiOS internals.

## Repository Structure

- **`src/`**: Main React source code for the KRACKED_OS workspace.
- **`public/`**: Static assets, icons, and PWA manifests.
- **`tools/`**: Automation utilities and advanced support tooling, including external tooling bundles.
- **`references/`**: Project-specific knowledge bases and supporting material.
- **`MajiOS/`**: Internal AI, memory, skills, and method architecture.

## GitHub About

Suggested description:
`AI-powered builder workspace for planning, creating, and shipping apps.`

Suggested longer about:
`KRACKED_OS is a builder workspace with a desktop-style UI, internal MAJI memory-and-method layer, BMAD planning flows, and reusable skill-driven operator systems for shipping apps with AI.`

Suggested topics:
`ai`
`builder-os`
`react`
`vite`
`electron`
`pwa`
`multi-agent`
`skills`
`developer-tools`
`workflow`

## Suggested GitHub Description

Primary:
`AI-powered builder workspace for planning, creating, and shipping apps.`

Backups:
`AI-powered builder OS for turning ideas into working apps.`
`A builder workspace for planning, building, and shipping with AI.`

---

**Crafted with 💛 by KrackedDevs**
*NECB: Now Everyone Can Build*
