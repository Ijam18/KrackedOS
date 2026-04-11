# krack Activation Protocol

## Standard Startup
1. Load [`master-majios.md`](./master-majios.md)
2. Load [`../core/maji/master-memory.md`](../core/maji/master-memory.md)
3. Load [`../system/IJAM_UNIFIED.md`](../system/IJAM_UNIFIED.md)
4. Review current memory from `../engine/memory/`
5. Review relevant local skills from `../skills/local-skills/`
6. Load BMAD method only when structured routing or review is needed

## Command Routing
- `MAJI`
  loads MAJI identity, relationship, and session memory
- `load bmad`
  loads `../method/maji-bmad/README.md` and BMAD core
- `save`
  routes durable session outcomes back into MAJI memory files first
- `bmad *`
  uses the MAJI-facing BMAD operational layer, not the entire vendored BMAD source tree

## Memory Sweep
- read long-term memory and latest daily notes
- check current session and relationship memory
- inspect system doctrine when startup or behavior guidance matters
- inspect media or skills only when relevant to the task
