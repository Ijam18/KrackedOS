# MAJI User Overlays

This folder stores per-user MAJI memory overlays that travel with the repo.

Each user gets their own directory:

- `users/<slug>/profile.json`
- `users/<slug>/actions.md`
- `users/<slug>/current-summary.md`

Shared MAJI doctrine still lives in the main canonical files under `main/` and the wider `MajiOS/` tree.

Use `MAJI` on first run to create the active local user's overlay.

Overlay identity resolution prefers the local git email when available, so contributors with similar display names do not silently collide onto the same memory card.
