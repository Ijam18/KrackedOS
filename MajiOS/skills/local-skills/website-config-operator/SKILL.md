---
name: website-config-operator
description: Guide KRACKED_OS website and app configuration work. Use when fixing startup alignment, cleaning config or documentation drift, validating repo truth against docs, making build-safe configuration changes, or hardening repeatable website/app setup workflows.
---

# Website Config Operator

Use this skill for KRACKED_OS website and app configuration work where the main risk is drift between docs, startup flow, runtime assumptions, and the actual repo state.

## When To Use

Use this skill when:
- aligning docs or startup instructions with repo truth
- fixing website or app configuration drift
- validating runtime, build, or entrypoint assumptions before editing
- hardening repeatable setup or activation flows
- packaging a repeated website/config workflow into something reusable

Do not use this skill for isolated feature work that does not involve configuration, startup behavior, or repo-alignment concerns.

## Startup Inspection Flow

Before changing anything:

1. Read the user request and identify the affected surface:
   - startup flow
   - config or manifest
   - docs or activation guidance
   - runtime or build behavior
2. Check repo truth first:
   - entrypoints like `src/main.jsx`, `src/App.jsx`, `package.json`, `vite.config.js`
   - relevant feature roots such as `src/features/ijam-os/`
   - MajiOS startup docs when the request touches memory, activation, or skills
3. Compare real paths, names, commands, and assumptions against the docs or config being discussed.
4. Classify the task:
   - drift cleanup
   - startup hardening
   - config correction
   - workflow packaging

## Decision Ladder

Use this order when deciding what to change:

1. Prefer current repo truth over stale docs or memory.
2. Fix the smallest source of confusion first:
   - broken path
   - stale command
   - wrong startup order
   - config mismatch
3. Keep changes build-safe and low-surprise.
4. If multiple docs repeat the same stale assumption, normalize them in the same pass.
5. If the pattern looks reusable across sessions, prepare a skill proposal instead of silently creating one.

## Validation Expectations

Before closing the task:

- verify changed links or paths resolve from their real folder location
- re-read the touched docs/config to confirm the wording matches repo truth
- run the smallest reliable check when useful, such as `npm run build` or a targeted repo search
- call out remaining risks if runtime validation was not possible

## Skill Promotion Rule

Propose a narrower follow-up skill when:
- the same website/config cleanup pattern appears 3 or more times
- a startup-hardening workflow becomes stable and reusable
- KRACKED_OS gains a recurring deployment, manifest, or environment setup routine

Proposal style:

> "Pattern website/config ni dah cukup repeat. Aku dah ada context yang cukup untuk jadikan skill khusus. Kalau kau nak, aku boleh formalize skill tu next."
