# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rotican.ai** is an AI-powered web app builder: users describe an app, Claude builds it in a sandboxed Vite + React + TypeScript + Tailwind environment with live preview. Users can publish, explore, and remix apps socially.

## Commands

```bash
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # Biome check (lint + format check)
bun run format       # Biome format --write
bun run typecheck    # tsc --noEmit

bun run db:push      # Push Drizzle schema changes to DB (dev)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
```

Always use `bun` (not npm/yarn). No test runner is configured.

## Architecture

### Stack
- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **AI:** Vercel AI SDK v6 with Anthropic Claude (primary) + OpenAI
- **Sandbox:** Modal.com for isolated Vite/React code execution
- **Database:** PostgreSQL via Drizzle ORM (`src/db/schema.ts`)
- **Auth:** Better Auth v1 (guest accounts + Google/GitHub OAuth)
- **Real-time:** Upstash Realtime + Redis for resumable SSE streaming
- **Error Handling:** Effect.ts (functional, typed errors throughout service layer)
- **Styling:** Tailwind CSS v4, Radix UI primitives (`src/components/ui/`)
- **Observability:** OpenTelemetry → Grafana (Tempo/Loki/Prometheus)
- **i18n:** next-intl with `[locale]` route segment

### Route Structure
```
src/app/[locale]/
  (home)/          # Landing page with prompt input
  (default)/       # Public pages: /explore, /inspo, /u/[username], /apps
  (workspace)/     # Protected: /apps/[id] — main editor + preview
  api/             # REST API routes
```

### Key API Routes
- `POST /api/chat` — send message, triggers AI generation pipeline
- `GET /api/chat` — SSE stream for real-time message chunks
- `GET|POST /api/apps` — CRUD for user apps
- `GET /api/preview/[idOrSlug]` — public preview access
- `/api/auth/[...all]` — Better Auth handler

### Core Patterns

**Effect.ts Error Handling:** All service layer code in `src/lib/services/` uses Effect. Typed errors are defined in `src/lib/effect/` (e.g., `NotFoundError`, `ValidationError`, `RateLimitError`, `AuthError`). API routes convert Effect results to HTTP responses.

**Resumable Streaming:** Each AI generation gets a unique Upstash Realtime channel ID. Clients subscribe via SSE (`GET /api/chat`). If the client disconnects, it can reconnect and replay history from Redis Streams. Message UI chunks are also persisted to PostgreSQL JSONB for full recovery.

**Sandbox Lifecycle:**
1. Modal creates a sandboxed container per app (`sandboxId`)
2. After each AI response, a filesystem snapshot is created (`snapshotId`)
3. Preview URLs are tunneled through Modal
4. `POST /api/preview/[id]/wake` restores dormant sandboxes from snapshots

**AI Generation Pipeline:**
1. User message saved to DB → all prior messages fetched
2. System prompt + design direction injected for first generation
3. AI streams tool calls (file write, exec) via AI SDK
4. Chunks emitted to Upstash Realtime channel in real-time
5. Screenshot scheduled + snapshot created after completion

**Feature Organization:** Domain features live in `src/features/` (auth, sandbox, feed, profile). Business logic (Effect services) in `src/lib/services/`. Infrastructure (AI client, auth config, Redis, S3) in `src/lib/core/`.

### Database Schema Highlights
- `app` — projects with `sandboxId`, `snapshotId`, usage stats, publish status
- `message` — chat history with JSONB `parts` (compatible with AI SDK `UIMessage`)
- `dailyUsage` — per-user rate limit enforcement
- `inspo` — curated gallery for remixing
- `appLike` — social engagement
- Better Auth tables: `user`, `session`, `account`, `verification`

### Path Alias
`@/*` maps to `./src/*`

### Environment
Copy `.env.example` → `.env` before running locally. Key services: PostgreSQL, Upstash Redis/Realtime, Modal, Anthropic API, Better Auth secrets.
