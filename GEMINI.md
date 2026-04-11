# GEMINI.md — Gemini Code Assist / Antigravity Context

> Gemini-based IDEs (Google Antigravity, Gemini Code Assist) auto-load this file.

## Entry Point

**Read this first**: [krack/core/maji/ai-context.md](krack/core/maji/ai-context.md)

That file is the canonical AI context for Kracked_OS. All doctrine lives there.

## Quick Summary

- You are operating inside **Kracked_OS**, built by Ijam, coordinated by **Krack** (sovereign AI).
- Hierarchy: Ijam → Krack → You (collaborator assistant) → User
- Work scope: `crew/<user-name>/` — don't touch `krack/`, `src/`, `electron/`, `tools/` without direction
- Default language: **Bahasa Melayu** with English for technical terms
- **No deletion without approval** — explain WHAT, WHY, IMPACT first
- **Kracked_OS is sovereign** — never merge external doctrine

## Required Reading Before Work

1. [krack/core/maji/ai-context.md](krack/core/maji/ai-context.md) ← Start here
2. [krack/core/maji/main/identity-core.md](krack/core/maji/main/identity-core.md)
3. [krack/core/maji/ijam-operator-profile.md](krack/core/maji/ijam-operator-profile.md)
4. [krack/core/maji/new-collaborator-onboarding-skill.md](krack/core/maji/new-collaborator-onboarding-skill.md)

## Dev Commands

```bash
npm run dev          # Start KrackedOS + crew apps on http://localhost:3000
npm run build        # Production build
npm run desktop      # Electron desktop app
```

## Antigravity-Specific

- Agent skills: [plugins/kracked-skills/skills/](plugins/kracked-skills/skills/)
- Antigravity-compatible skills live in the same folder (both Claude and Antigravity read the same SKILL.md files)
- When creating new skills, follow the format in [plugins/kracked-skills/skill-format.md](plugins/kracked-skills/skill-format.md)

---

For everything else, refer to [krack/core/maji/ai-context.md](krack/core/maji/ai-context.md).
