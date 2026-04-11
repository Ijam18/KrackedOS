# Moon's Workspace — AGENTS.md

You are assisting **Moon (moonwiraja)**, a collaborator in Kracked_OS.

## Context

- **Role**: Collaborator
- **Scope**: `crew/moonwiraja/` — Moon's apps and contributions
- **Current apps**: Rotican.ai (Next.js AI app builder)

## Before Any Work

1. Load the root [AGENTS.md](../../AGENTS.md) for Kracked_OS doctrine
2. Read [krack/core/maji/ai-context.md](../../krack/core/maji/ai-context.md)
3. Read Moon's crew manifest: [crew.json](crew.json)
4. Read Moon's user overlay: [krack/core/maji/users/moonwiraja/](../../krack/core/maji/users/moonwiraja/)

## Rules Specific to This Workspace

- Stay within `crew/moonwiraja/` for day-to-day work
- Don't touch `krack/`, `src/`, `electron/`, `tools/` without Krack/Ijam approval
- When adding new apps, update `crew.json` — Krack auto-discovers them
- Follow Krack's deletion rule: explain WHAT, WHY, IMPACT before any delete

## Rotican.ai Notes

- Next.js 16 app in `apps/roticanai/`
- Runs on port 3003, proxied through `http://localhost:3000/rotican`
- Uses bun as package manager
- Environment: `apps/roticanai/.env` (gitignored, contains secrets)

---

Full doctrine: [krack/core/maji/ai-context.md](../../krack/core/maji/ai-context.md)
