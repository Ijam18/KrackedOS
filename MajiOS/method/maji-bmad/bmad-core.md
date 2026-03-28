# 🧠 BMAD Core - Inside MAJI
*Method engine and precedence rules for structured work on Kracked_OS*

## Purpose
This file defines how BMAD behavior operates **inside** MAJI.

It does not replace MAJI.
It gives MAJI a disciplined method for:
- routing next actions
- brainstorming
- planning
- reviewing
- edge-case hunting
- distilling large context

## Precedence Rules
When BMAD Method is active, use this order of truth:

1. **Current repo/code truth**
2. **MAJI identity and memory**
3. **BMAD workflow method**

## Working Assumptions
- Primary project target: `Kracked_OS`
- Primary product surface: `src/features/ijam-os/`
- Runtime split matters: browser demo vs Electron local desktop
- Quality priorities:
  - full-stack implementation quality
  - security
  - UX clarity
  - maintainability
  - practical shipping progress

## Activation Behavior
When user says `load bmad`:
1. Load this file
2. Load `kracked-os-phase-guide.md`
3. Keep MAJI identity and relationship memory active
4. Route future BMAD commands to the matching protocol file

## Command Routing
- `bmad help` → `bmad-help-protocol.md`
- `bmad brainstorm` → `bmad-brainstorm-protocol.md`
- `bmad plan` → `bmad-plan-protocol.md`
- `bmad review` → `bmad-review-protocol.md`
- `bmad edge-cases` → `bmad-edge-cases-protocol.md`
- `bmad distill` → `bmad-distill-protocol.md`

## Persistence Rule
If a BMAD session produces durable value, summarize it into MAJI memory on `save`:
- route conclusions
- project-phase updates
- important review findings
- recurring architectural concerns
- reusable heuristics for future Kracked_OS work
