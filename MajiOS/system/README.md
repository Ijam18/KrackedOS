# MajiOS System

Owns operating doctrine and activation guidance.

Loads when:
- startup flow is needed
- IJAM behavior needs grounding
- skill creation or architecture references are needed

Key files:
- `IJAM_UNIFIED.md`
- `skills_documentation.md`
- `SkillCreator.md`
- `KD_BRIDGE.md`

Adapter note:
- `MajiOS/skills/local-skills/` is the canonical repo-owned skill source
- `.agents/skills/` and optional `.claude/skills/` are tool execution surfaces
- `tools/Kracked_Skills_Agent-main/` is an optional external tooling bundle with a documented bridge into MajiOS doctrine
