# Sprint 02 — Workspace and Project Persistence

## Delivered scope

- Shared strict request schemas and DTOs in packages/contracts.
- PostgreSQL/Prisma models for User, Workspace, WorkspaceMember, Project, and
  ProjectMember with a versioned SQL migration.
- API → application service → repository → Prisma boundaries.
- Development-only bearer authentication, described in ADR-002.
- Explicit workspace and project membership checks, including composite database
  constraints preventing cross-workspace membership references.
- Atomic project updates with expectedVersion; competing edits return 409.

## API surface

All routes below require Authorization: Bearer <local token>.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | /api/v1/workspaces | Create workspace and creator membership |
| GET | /api/v1/workspaces | List accessible workspaces |
| POST | /api/v1/workspaces/:workspaceId/projects | Create project and creator project membership |
| GET | /api/v1/workspaces/:workspaceId/projects | List explicitly accessible projects |
| GET | /api/v1/workspaces/:workspaceId/projects/:projectId | Read accessible project |
| PATCH | /api/v1/workspaces/:workspaceId/projects/:projectId | Update metadata using expectedVersion |

Create workspace accepts name. Create project accepts name, description, and
businessGoal. PATCH accepts those project fields plus expectedVersion. Unknown
fields, blank names, invalid identifiers, and empty updates return 400. Lists are
capped at 100 records in creation order; pagination is a later slice.

## Local database

Run from the repository root, with Docker available:

```powershell
pnpm install
pnpm --filter api db:setup
docker compose --env-file apps/api/.env -f apps/api/docker-compose.yml up -d --wait
pnpm --filter api typecheck
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev
```

db:setup creates apps/api/.env only when absent, with random local database and
authentication credentials. Existing configuration is preserved. PostgreSQL binds
only to 127.0.0.1:55432 and persists in the ba-agent-platform_postgres_data volume.
Stopping the container does not delete this volume. No production database is used.

## Validation

Root typecheck includes all applications and contracts. API tests include credential
rejection, strict input validation, workspace/project isolation, stale and concurrent
updates, persistence after API restart, and database foreign-key enforcement.

The default test:e2e command uses isolated PGlite (PostgreSQL compiled to WASM), not
an in-memory repository mock. It is a convenient local fallback, not proof of full
PostgreSQL deployment equivalence.

For PostgreSQL tests, create the dedicated test database once:

```powershell
docker compose --env-file apps/api/.env -f apps/api/docker-compose.yml exec -T postgres psql -U ba_dev -d postgres -c 'CREATE DATABASE ba_agent_test;'
pnpm --filter api test:postgres
```

test:postgres loads TEST_DATABASE_URL from the local .env. Tests accept only a
localhost ba_agent_test database, create a random schema, apply migration SQL,
exercise real Prisma queries, and remove only that schema at teardown. They do not
reset the development database. Re-running CREATE DATABASE is unnecessary once it
exists. Migration deploy is separately verified against the development database.

## Verification at this checkpoint

Verified on 2026-09-12: PostgreSQL container healthy; Prisma migration deploy and
idempotent local seed completed; 15 HTTP tests passed against PostgreSQL and also
against PGlite; the API unit test, root typecheck, API lint, and API build passed.
The compiled API returned 200 for health and an authenticated database-backed
workspace query. Secrets and generated Prisma Client are excluded from Git.

## Remaining work

Workspace/Project UI, production login, membership administration, project archive,
and Requirement drafts are not implemented in this backend slice. No AI provider,
queue, or requirement approval capability has been added.
