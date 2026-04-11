# 🧭 BMAD Method System
*Structured planning, review, and decision support for building Kracked_OS inside MAJI*

## What This Feature Does
Adds a **BMAD-inspired method engine** to MAJI so the memory system can do more than remember. It can now route next steps, structure brainstorming, generate practical work plans, run adversarial review, hunt edge cases, and distill large documents into reusable context.

This feature keeps **MAJI as the primary framework**:
- **MAJI** holds identity, relationship memory, current priorities, and durable learning
- **BMAD Method System** provides disciplined workflows for deciding what to do next
- **Kracked_OS** is the standing project context the method is optimized for

## Core Principle
MAJI answers:
- Who am I?
- Who are we?
- What are we building?
- What matters most?

BMAD Method answers:
- What should we do next?
- How should we think through this?
- How should we review this properly?
- How do we compress this into reusable context?

## Command Set
Use these MAJI-native commands after loading this feature:

```text
load bmad
bmad help
bmad brainstorm
bmad plan
bmad review
bmad edge-cases
bmad distill
```

## Command Meanings

### `load bmad`
Loads the BMAD Method System into active context and applies Kracked_OS-specific grounding.

### `bmad help`
Routes the next best step for the current Kracked_OS state.

### `bmad brainstorm`
Runs a structured ideation session for features, product direction, architecture options, or delivery approaches.

### `bmad plan`
Turns a goal into an actionable work plan for Kracked_OS.

### `bmad review`
Runs an adversarial quality review.

### `bmad edge-cases`
Runs an orthogonal edge-case hunt.

### `bmad distill`
Compresses large repo, design, or planning documents into reusable context with minimal loss of signal.

## Kracked_OS Grounding
This feature is specialized for Kracked_OS and assumes:
- the root product is the `ijam-os` workspace app
- Electron/runtime split matters
- AI/persona layers exist but are not always the primary task
- shipping progress matters as much as idea quality
- quality standards include full-stack implementation, security, UX clarity, maintainability, and practical delivery

## Memory Contract
The BMAD Method System does not own permanent memory by itself. Instead, durable outcomes are summarized back into MAJI:

- **current-session.md**:
  next step, active phase, temporary route conclusions, current work plan summary
- **relationship-memory.md**:
  stable project preferences, planning depth preferences, recurring quality concerns, repeated review findings
- **identity-core.md**:
  lasting operator style changes, long-term method behavior refinements
- **daily-diary/**:
  major brainstorming sessions, high-signal reviews, important plan decisions, distillation milestones

## Suggested Workflow

### 1. Orient
```text
MAJI
load bmad
```

### 2. Decide the mode
- unclear next step → `bmad help`
- idea exploration → `bmad brainstorm`
- implementation roadmap → `bmad plan`
- quality/risk check → `bmad review`
- hidden failure modes → `bmad edge-cases`
- large docs or plans → `bmad distill`

### 3. Save durable outcomes
After a meaningful BMAD session:
```text
save
```

This ensures the important result becomes part of MAJI memory instead of disappearing as temporary workflow chatter.

## Files In This Subsystem
- `bmad-core.md` — feature overview, precedence rules, and method behavior
- `bmad-help-protocol.md` — next-step routing logic
- `bmad-brainstorm-protocol.md` — structured ideation flow
- `bmad-plan-protocol.md` — actionable planning flow
- `bmad-review-protocol.md` — adversarial review flow
- `bmad-edge-cases-protocol.md` — edge-case hunting flow
- `bmad-distill-protocol.md` — distillation workflow
- `kracked-os-phase-guide.md` — standing project-phase model for Kracked_OS

## Success Criteria
You know this feature is working when:
- `bmad help` gives phase-aware next steps for Kracked_OS
- `bmad brainstorm` produces structured options instead of loose ideas
- `bmad review` surfaces concrete risks and regressions
- `bmad distill` turns large context into reusable briefs
- `save` persists the durable conclusions into MAJI memory

---

*BMAD Method System turns MAJI from a memory core into a memory-backed operator system for building Kracked_OS with discipline.*
