# MajiOS Skills

Owns reusable capability packs.

Loads when:
- a task maps to a specific skill
- repeated workflows have been promoted into reusable operator knowledge

Primary location:
- `local-skills/`

Execution adapters:
- `.agents/skills/`
  Codex-installed native skill target
- `.claude/skills/`
  optional Claude-native install target when intentionally used

Boundary note:
- `MajiOS/skills/local-skills/` is the canonical repo-owned skill source
- external tool bundles may consume similar concepts, but they are not the canonical source for KRACKED_OS skill doctrine
