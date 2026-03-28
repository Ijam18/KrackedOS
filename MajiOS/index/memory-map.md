# MajiOS Memory Map

## Domain Ownership
- `core`
  owns MAJI identity, relationship memory, session state, diary, and save logic
- `method`
  owns BMAD routing, planning, brainstorming, review, edge-case hunting, and distillation
- `engine`
  owns persistent storage, retrieval, ranking, and write-memory tools
- `assets`
  owns visual artifacts, wallpapers, brochures, and other recall-supporting media
- `skills`
  owns reusable capability packs and operator modes
- `system`
  owns IJAM doctrine, onboarding instructions, skill creation guidance, and architecture references

## Canonical Locations
- `MajiOS/core/maji/`
- `MajiOS/method/maji-bmad/`
- `MajiOS/method/bmad-source/`
- `MajiOS/engine/memory/`
- `MajiOS/assets/media/`
- `MajiOS/skills/local-skills/`
- `MajiOS/system/`

## Operating Rule
Use `MajiOS/` as the source of truth for memory-and-method architecture.
Legacy top-level folders remain available for compatibility and staged migration.
