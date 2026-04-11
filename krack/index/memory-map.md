# krack Memory Map

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
- `krack/core/maji/`
- `krack/core/maji/users/`
- `krack/method/maji-bmad/`
- `krack/method/bmad-source/`
- `krack/engine/memory/`
- `krack/assets/media/`
- `krack/skills/local-skills/`
- `krack/system/`

## Operating Rule
Use `krack/` as the source of truth for memory-and-method architecture.
Legacy top-level folders remain available for compatibility and staged migration.
