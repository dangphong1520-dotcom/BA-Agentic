# BA Agent Platform

AI-assisted operating system for IT Business Analysts.

## Vision

Transform meetings, requirements, business rules, decisions,
documents and project knowledge into a traceable AI-assisted
Business Analysis workspace.

## Core principles

- Human-in-the-loop
- Source-first
- Structured requirements
- Traceability-first
- AI proposes, humans approve
- Never convert assumptions into facts

## Local development

Run `pnpm dev` from the repository root to start Web (port 3000), API
(port 3001 by default), and the Worker scaffold.

The API uses `/api/v1`. `GET http://localhost:3001/api/v1/health` returns
`{"status":"ok","service":"ba-agent-api"}` when the API is responding.
This is a liveness endpoint; it does not check database, queue, storage, or AI
providers. The unversioned `/` and `/health` routes return 404.

## Validation

- `pnpm typecheck`: check Web, API (including tests), and Worker.
- `pnpm --filter api test`: API unit tests.
- `pnpm --filter api test:e2e`: HTTP behavior using the production prefix setup.
- `pnpm --filter api lint`: API lint checks.
- `pnpm --filter api build`: compile the API.

Web typecheck generates Next.js route types before running TypeScript.
Worker test/lint scripts remain placeholders, so a root test command must not
be interpreted as full application coverage.

See [the foundation checkpoint](docs/sprints/SPRINT-01-FOUNDATION.md) for current
implementation status and the next feature slice.

## Workspace and Project APIs

The [persistence checkpoint](docs/sprints/SPRINT-02-WORKSPACE-PROJECT.md) describes
Docker/PostgreSQL setup, migration, seed, authenticated routes, and database tests.
Run that setup before using Workspace/Project APIs. Development identity is
explicitly enabled via local configuration and disabled in production.

`pnpm dev` builds shared contracts and generates Prisma Client before starting
the applications. Keep `apps/api/.env` private; `db:setup` creates it without
overwriting an existing file. Project updates require `expectedVersion` to prevent
lost edits. The UI and production login are still pending.
