# Sprint 03 — Structured requirement drafts

## Delivered scope

Project members can create, list, read, and edit structured requirement drafts
and inspect saved snapshots in the Vietnamese UI. The project detail page links
to the new requirements screen. Existing local development identity remains in
use; production login is not introduced in this slice.

Shared contracts define BUSINESS, FUNCTIONAL, and NON_FUNCTIONAL types, and
MoSCoW priority (UNDEFINED, MUST, SHOULD, COULD, WONT). Blank optional text is
allowed so missing information can remain explicit. Titles require 1–120
characters; each structured text field is capped at 4,000 characters.

Fields: title, type, priority, description, business goal, actor, preconditions,
main flow, exception flow, acceptance criteria, and source note. Source notes are
unverified manual context, not confirmed evidence references. Acceptance criteria
are draft text in this slice; independent criteria and source/segment links remain
future work. No AI content is generated or treated as confirmed fact.

## Persistence and governance

Requirement rows have explicit workspace/project scope enforced by a composite
foreign key. Access requires explicit project membership through ProjectService.
The server assigns creator identity and DRAFT status. Request schemas reject
caller-supplied status, ownership, scope, and unsupported types. There are no
approval, baseline, release, or delete endpoints.

Each create/update atomically writes the requirement and a RequirementVersion
snapshot, with the server's actor and timestamp. Updates require expectedVersion
and DRAFT status. A stale save returns 409 without adding a version. A failed
history write rolls back the content update. The UI retains drafts on errors and
offers the latest saved content in another tab for conflict resolution.

Snapshots are append-only through the application API. JSONB is used only for
historical typed snapshots; current requirement fields remain relational columns.
No claim is made of tamper-proof storage against a database administrator.

## Endpoints

Base: /api/v1/workspaces/:workspaceId/projects/:projectId/requirements

| Method | Suffix | Behavior |
| --- | --- | --- |
| GET | / | List first 100 drafts in stable creation order |
| POST | / | Create draft and version 1 |
| GET | /:id | Read scoped draft |
| PATCH | /:id | Save full editable fields with expectedVersion |
| GET | /:id/versions | Latest 100 snapshots, newest first |

Pagination and lifecycle transitions are separate slices.

## Local setup and verification

Run the existing Sprint 02 setup, then apply migrations with
`pnpm --filter api db:migrate` and start `pnpm dev`.
The new migration only adds enums, tables, indexes, and foreign keys.

Checks: root typecheck, API/Web lint, API/Web unit tests, root build, and
`pnpm --filter api test:postgres`. Integration setup applies every checked-in
migration in sorted order to an isolated test schema, never the user's workspace.
Tests cover input and identity rejection, cross-project access, version history,
competing edits, failed-history rollback, restart persistence, and database scope.

Verified on 2026-09-13: 22 PostgreSQL HTTP tests and nine API/Web unit tests
passed. Root typecheck, API/Web lint, and all application builds passed.
Browser checks covered the project entry link, empty list, creation, priority
selection, persisted edits, historical content, stale-save draft preservation,
and blank-title rejection. Browser-test data was confined to a temporary
workspace and removed by exact identifiers; existing user workspaces were kept.

## Next slices

Source records and stable source segments; requirement evidence links;
independent acceptance criteria; explicit human review transitions; production
login; then AI analysis findings and proposals. These remain unimplemented.
