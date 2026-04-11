# KRACKED_OS 🚀

**AI-powered builder workspace for planning, creating, and shipping apps.**

> Coordinated by **Krack** — the sovereign AI of Kracked_OS. Multi-collaborator by design.

## What KRACKED_OS Is

**KRACKED_OS** is a Builder OS for founders, makers, and AI-assisted builders who want one environment to move from idea to plan to execution.

It combines a desktop-style workspace, AI guidance, builder tools, and persistent context into a single system built around **NECB: Now Everyone Can Build**.

## Core Capabilities

- **Builder workspace** — desktop-style shell with windows, apps, and tools
- **Krack AI layer** — sovereign AI with identity, memory, methods, and collaborator coordination
- **Crew architecture** — each collaborator gets their own isolated workspace that auto-integrates into KrackedOS
- **KDStore** — hosted web apps install into the desktop and start menu
- **Universal IDE support** — works with Claude Code, Cursor, Antigravity, Copilot, Windsurf, and any AGENTS.md-aware AI
- **Single Vercel deploy** — one domain serves everything

## Architecture

```
Kracked_OS/
├── krack/                # Krack's brain (AI identity, memory, methods, doctrine)
│   ├── core/maji/        # identity, users, features, diary
│   ├── method/           # BMAD workflows
│   ├── skills/           # canonical shared skills
│   ├── system/           # operating doctrine
│   └── assets/           # media, references
│
├── crew/                 # Collaborator workspaces (each person owns their folder)
│   ├── ijam/             # operator workspace
│   └── moonwiraja/       # collaborator workspace
│       ├── crew.json     # manifest declaring apps
│       └── apps/
│           └── roticanai/  # Moon's AI app builder
│
├── src/                  # KrackedOS React frontend (Vite)
├── electron/             # Electron desktop shell
├── tools/                # Build tools, crew discovery, memory card
├── plugins/              # Shared AI skills
└── IDE adapters          # CLAUDE.md, AGENTS.md, GEMINI.md, .cursor/, .windsurfrules, .github/
```

### Hierarchy

```
Ijam (Operator)
  └── Krack (Sovereign AI)
        └── Collaborator Assistants (any IDE)
              └── Collaborators
```

- **Ijam** sets direction. Final call on everything.
- **Krack** coordinates collaborator assistants and enforces doctrine.
- **Collaborator Assistants** operate in whatever IDE you prefer — Claude Code, Cursor, Antigravity, Copilot, etc.
- **Collaborators** execute work in their own `crew/<name>/` workspace.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Ijam18/KrackedOS.git
cd KrackedOS
npm install
```

### 2. Run Dev Server

```bash
npm run dev
```

Opens KrackedOS at `http://localhost:3000`. Crew apps are auto-discovered and proxied through the same port.

### 3. Desktop Mode (Optional)

```bash
npm run desktop
```

Runs Electron shell.

## For Collaborators — Join The Crew

### Step 1: Create Your Workspace

```bash
mkdir -p crew/<your-name>/apps
```

### Step 2: Declare Yourself

Create `crew/<your-name>/crew.json`:

```json
{
  "name": "<your-name>",
  "displayName": "<Your Name>",
  "role": "collaborator",
  "joinedAt": "2026-04-11",
  "apps": []
}
```

### Step 3: Add Your AI Overlay

```bash
mkdir -p krack/core/maji/users/<your-name>
```

Add `current-summary.md` to track your active context.

### Step 4: Add Apps

Drop your app code in `crew/<your-name>/apps/<app-name>/` and declare it in `crew.json`:

```json
{
  "apps": [
    {
      "id": "my-app",
      "title": "My App",
      "path": "apps/my-app",
      "devCommand": "bun run dev",
      "port": 3004,
      "proxyPrefix": "/my-app",
      "icon": "/icons/my-app.png",
      "color": "#6366f1"
    }
  ]
}
```

Krack auto-discovers it via [tools/crewDiscovery.js](tools/crewDiscovery.js). Your app appears in KrackedOS KDStore automatically.

### Step 5: Use Any IDE

Krack context auto-loads in:

| IDE | Auto-loaded File |
|-----|------------------|
| Claude Code | [CLAUDE.md](CLAUDE.md) |
| Cursor | [.cursor/rules/krack.mdc](.cursor/rules/krack.mdc) |
| Gemini / Antigravity | [GEMINI.md](GEMINI.md) |
| Windsurf / Codeium | [.windsurfrules](.windsurfrules) |
| GitHub Copilot | [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Codex / Aider / others | [AGENTS.md](AGENTS.md) |

All point to the canonical doctrine at [krack/core/maji/ai-context.md](krack/core/maji/ai-context.md).

## Collaboration Rules

1. **Kracked_OS is sovereign** — never merges with external systems. Others sync with Kracked_OS.
2. **No deletion without approval** — explain WHAT, WHY, and IMPACT before any delete.
3. **Load context before acting** — read the relevant files first.
4. **Stay in scope** — collaborators work in `crew/<name>/`, not in `krack/`, `src/`, `electron/`, or `tools/`.
5. **Malay first** — default Bahasa Melayu with English for technical terms. Muslim-friendly with adab.
6. **Report what you did** — state what was loaded, what changed, what's uncertain.

## Krack Commands

Use these in the KrackedOS runtime:

```text
Krack              # restore Krack identity + load context
load bmad          # activate BMAD method engine
bmad help          # route best next step
bmad plan          # turn goal into work plan
bmad review        # adversarial quality review
bmad edge-cases    # hunt failure modes
save               # persist durable progress to user overlay
review growth      # review how Krack has evolved
```

## Deployment — Monorepo on Vercel

Kracked_OS uses **two Vercel projects** from the same GitHub repo. Each
collaborator's app is a separate Vercel project. The main KrackedOS domain
uses edge rewrites to proxy crew app paths to their own deployments. Users
see one unified domain.

### Project 1: KrackedOS (main — Ijam's)

1. Import repo on Vercel → create project `kracked-os`
2. **Root Directory**: `./` (repo root)
3. **Framework Preset**: `Vite`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Env vars: `NVIDIA_API_KEY_70B` (for the serverless NVIDIA proxy)
7. Deploy

The repo-level [vercel.json](vercel.json) has edge rewrites that proxy
`/rotican/*` → Moon's separate Vercel deployment.

### Project 2: Rotican.ai (Moon's Next.js app)

1. Import the same repo on Vercel → create project `rotican-ai`
2. **Root Directory**: `crew/moonwiraja/apps/roticanai`
3. **Framework Preset**: `Next.js` (auto-detected)
4. **Build Command**: blank (uses `bun run build`)
5. **Output Directory**: blank (uses `.next`)
6. **Install Command**: `bun install`
7. Env vars: see the roticanai README — DATABASE_URL, BETTER_AUTH_SECRET,
   BETTER_AUTH_URL (use this project's domain), OAuth keys, S3, Modal, etc.
8. Deploy

Moon's Next.js config uses `basePath: "/rotican"` in production so that
all its paths (routes, assets, API) are namespaced. Edge rewrites from
KrackedOS forward `/rotican/*` to Moon's deployment at the same path,
so asset URLs resolve cleanly under the KrackedOS domain.

### How Routes Flow in Production

```
User hits:  https://kracked-os.vercel.app/rotican/ms
    ↓
KrackedOS Vercel edge applies rewrite rule
    ↓
    https://rotican-ai.vercel.app/rotican/ms
    ↓
Moon's Next.js (basePath: /rotican) serves the Malay locale page
    ↓
Response content streams back through kracked-os.vercel.app domain
```

### Adding New Crew Apps

When a new collaborator adds an app:

1. Create their own Vercel project pointing to `crew/<name>/apps/<app>/`
2. Add a rewrite to the root [vercel.json](vercel.json):
   ```json
   { "source": "/<name>/:path*", "destination": "https://<name>-app.vercel.app/<name>/:path*" }
   ```
3. Add their entry to [crew/<name>/crew.json](crew/)

## Tech Stack

- **Frontend OS**: Vite + React 18 + Framer Motion + Lucide
- **Desktop**: Electron
- **Crew apps**: Next.js 16, React 19, Better Auth, Drizzle ORM, Upstash Redis, Modal sandbox
- **AI providers**: Anthropic, OpenAI, OpenRouter, NVIDIA NIM, Groq
- **Package managers**: npm (root) + bun (crew apps)

## Repository Structure

- `src/` — KrackedOS React frontend
- `electron/` — Desktop shell
- `krack/` — Krack's brain (AI doctrine, memory, methods) — read-only for collaborators
- `crew/` — Collaborator workspaces (each person owns their folder)
- `tools/` — Build tools, crew discovery, memory card system, Vercel build
- `plugins/` — Shared AI skills (Claude Code plugin + Antigravity-compatible)
- `public/` — Static KrackedOS assets, icons, PWA manifest

## Links

- Canonical AI doctrine: [krack/core/maji/ai-context.md](krack/core/maji/ai-context.md)
- Collaborator onboarding: [krack/core/maji/new-collaborator-onboarding-skill.md](krack/core/maji/new-collaborator-onboarding-skill.md)
- Ijam operator profile: [krack/core/maji/ijam-operator-profile.md](krack/core/maji/ijam-operator-profile.md)

---

**Crafted with 💛 by KrackedDevs**
*NECB: Now Everyone Can Build*
