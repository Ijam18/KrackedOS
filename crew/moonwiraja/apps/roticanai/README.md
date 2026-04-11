# Roticanai

AI web app builder. Type what you want → get working React app.

## What

Describe an app. AI (Claude) builds it in a sandboxed Vite + React + TypeScript + Tailwind environment with live preview. Publish, explore, remix others' apps.

Named after roti canai.

## Stack

- Next.js 16, React 19, Effect
- Modal (sandbox execution)
- Claude Haiku/Sonnet (AI)
- Drizzle ORM, Postgres
- Upstash Redis/Realtime
- Better Auth (guest + Google/GitHub OAuth)
- OpenTelemetry

## Dev

```bash
bun install
bun dev
```

Open http://localhost:3000

## Env

Copy `.env.example` → `.env`.

## Scripts

```bash
bun run build          # production build
bun run db:push        # push schema to db
bun run lint           # biome check
bun run typecheck      # tsc
```

## Structure

```
src/
  app/           # Next.js routes
    api/         # chat, auth, sandbox, feed
  features/      # domain features (auth, sandbox, feed, etc)
  lib/
    core/        # infra (ai, auth, storage, upstash)
    services/    # business logic (Effect)
    telemetry/   # otel
  db/            # drizzle schema
```
