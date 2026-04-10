# kracked-skills

Custom AI skills for MajiOS — a Claude Code skill plugin.

## Structure

```
kracked-skills/
├── .claude-plugin/
│   └── plugin.json          # Plugin identity
├── skills/                  # Auto-triggered behaviors
│   └── save-memory/
│       └── SKILL.md         # Save conversation insights to memory
├── commands/                # User slash commands
├── skill-format.md          # Template reference for new skills
└── README.md
```

## Adding a New Skill

1. Create a folder: `skills/[skill-name]/`
2. Create `SKILL.md` inside with YAML frontmatter + protocol
3. Done — skill auto-activates based on the `description` field

See `skill-format.md` for the full template.

## Active Skills

| Skill | Trigger | Level |
|-------|---------|-------|
| save-memory | "save", "save memory", "save progress" | Lv.1 |

## Author

Ijam18

---

*Installed: April 11, 2026*
