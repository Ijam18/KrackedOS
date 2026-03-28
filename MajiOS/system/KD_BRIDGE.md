# KD Bridge

This document explains how `tools/Kracked_Skills_Agent-main/` relates to `MajiOS/`.

## Purpose

`MajiOS/` is the canonical internal memory-and-method layer for KRACKED_OS.

`tools/Kracked_Skills_Agent-main/` is an external tooling bundle that provides a KD-specific installer, adapter generator, observer runtime, and `.kracked/` project system.

The overlap between them is real, but it should be handled as **shared doctrine**, not as a codebase merge.

## What MajiOS Absorbs

The following overlap is now treated as MajiOS-owned doctrine:

- local-first context before broader memory when project-local systems such as `.kracked/` are present
- structured workflow routing instead of loose prompting
- reusable skill promotion heuristics
- clear distinction between canonical knowledge and execution adapters
- explicit boundary between repo-owned skills and tool-specific execution surfaces

## What Stays KD-Only

KD keeps ownership of:

- `.kracked/` project structure
- KD installer and updater logic
- IDE adapter generation
- KD workflow command system
- observer runtime and event logging
- panel, web mirror, and TUI surfaces
- KD backend and frontend code

These should stay under `tools/` unless KRACKED_OS later needs a direct runtime integration.

## Mapping

| KD concept | MajiOS equivalent |
|---|---|
| KD system prompt | `MajiOS/system/` doctrine |
| KD skills | split by ownership: repo-owned reusable doctrine belongs in `MajiOS/skills/local-skills/`, KD project-local installed skills stay under `.kracked/skills/`, and tool execution surfaces may appear in places like `.agents/skills/` |
| KD workflows | `MajiOS/method/` and BMAD routing |
| KD memory patterns | `MajiOS/engine/memory/` + MAJI memory files |
| KD adapters | external execution surfaces such as `.agents/skills/` |
| KD runtime events / observer | KD-only external runtime |

## Usage Rule

Use MajiOS-native flows first when the task is about:

- MAJI identity or startup behavior
- BMAD routing
- repo-owned skill design
- memory, doctrine, or operator workflow

Use KD tooling when the task is about:

- generating tool adapters
- running KD workflow commands
- installing or maintaining `.kracked/`
- observer/panel/runtime behavior

When `.kracked/` exists, treat it as local project context that should be checked before broader doctrine, but do not treat it as the canonical repo-owned source for MAJI skills or memory rules.

## Future Direction

If KD-related work becomes repeated enough inside this repo, create a dedicated MajiOS local skill for KD integration.

Do not merge KD runtime code into MajiOS unless KRACKED_OS later needs a real embedded KD runtime.
