# Sprint 07 — Decision management

## Outcome

Project members can record a proposed decision with its rationale, link it to
affected requirements, revise the proposal safely, approve it through an
explicit human action, and later supersede it with another approved decision.

## Governance and history

- New decisions start PROPOSED at version 1. The server assigns the
  `DEC-XXXXXXXX` code, creator, timestamps and project scope.
- Proposal edits require `expectedVersion`; concurrent or stale changes return
  409 rather than overwriting newer content.
- Approval is a dedicated command. The authenticated server session supplies
  `decidedBy` and `decisionDate`; the client cannot choose those values.
- Approved decisions are immutable. Every create, edit, approval and
  supersession atomically records a complete DecisionVersion snapshot.
- An approved decision can be marked SUPERSEDED only by referencing another
  APPROVED decision in the same project. Self-reference, proposals and
  cross-project replacements are rejected.
- Requirement links are validated by the service and composite project foreign
  keys. Decision transitions never alter linked requirement content or status.

REJECTED and DEPRECATED remain reserved shared vocabulary. Their transition
policies must be defined before commands are exposed.

## API and UI

Base API: `/api/v1/workspaces/:workspaceId/projects/:projectId/decisions`

| Method | Path             | Behavior                                                    |
| ------ | ---------------- | ----------------------------------------------------------- |
| GET    | `/`              | List the latest 100 project decisions                       |
| POST   | `/`              | Create a proposal                                           |
| GET    | `/:id`           | Read one scoped decision                                    |
| GET    | `/:id/versions`  | Read immutable history                                      |
| PATCH  | `/:id`           | Edit a proposal with optimistic concurrency                 |
| POST   | `/:id/approve`   | Record explicit human approval and lock content             |
| POST   | `/:id/supersede` | Preserve the old decision and link its approved replacement |

The `/decisions` screen supports listing and status filtering, proposal editing,
requirement links, approval, supersession, replacement navigation and complete
version history.

## Verification

The PostgreSQL integration suite covers authentication, strict client input,
server-controlled identity, tenant isolation, cross-project foreign keys,
concurrent edits, approval locking, valid replacement policy, immutable history
and persistence across application restart.
