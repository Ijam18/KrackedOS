# 🚀 Kracked_OS Phase Guide
*Standing phase model used by BMAD inside MAJI*

## Purpose
This file gives BMAD Method a stable way to reason about what phase Kracked_OS is currently in.

## Phases

### Phase 1: Direction
Use when the work is still about:
- deciding what to build
- clarifying value
- evaluating options

Recommended BMAD commands:
- `bmad help`
- `bmad brainstorm`

### Phase 2: Planning
Use when the direction is known but implementation is not yet sequenced.

Recommended BMAD commands:
- `bmad help`
- `bmad plan`
- `bmad distill`

### Phase 3: Building
Use when the team is implementing or refactoring the product.

Recommended BMAD commands:
- `bmad plan`
- `bmad review`
- `bmad edge-cases`

### Phase 4: Hardening
Use when the feature exists and risk reduction matters most.

Recommended BMAD commands:
- `bmad review`
- `bmad edge-cases`
- `bmad distill`

### Phase 5: Reuse and Continuity
Use when the work should be compressed into stable knowledge for future sessions.

Recommended BMAD commands:
- `bmad distill`
- `save`

## Routing Rule
If the current phase is unclear, default to:
1. `bmad help`
2. then route to the next best command

## Kracked_OS Decision Priorities
When choosing between valid options, prefer:
1. Correctness
2. Security
3. Maintainability
4. UX clarity
5. Speed of delivery
