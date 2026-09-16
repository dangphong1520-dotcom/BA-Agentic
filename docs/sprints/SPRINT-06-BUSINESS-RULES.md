# Sprint 06 — Governed business rules

## Outcome

Project members can create a business-rule draft, assign priority, link it to
one or more requirements, revise it safely, and explicitly approve it. An
approved rule is immutable in this slice so confirmed project knowledge cannot
be silently changed.

## Governance and history

- New rules start in DRAFT at version 1; the server assigns the `BR-XXXXXXXX`
  display code, creator, timestamps and project scope.
- Content edits require `expectedVersion`. Concurrent or stale edits return
  409 instead of overwriting newer work.
- Approval is a dedicated command. The authenticated server session supplies
  `approvedBy` and `approvedAt`; neither can be supplied by the client.
- Only DRAFT rules can be edited or approved. Approval creates a new historical
  version and locks the rule.
- Every create, edit and approval atomically records a complete
  BusinessRuleVersion snapshot.
- Requirement links use composite project foreign keys and service checks, so
  a rule cannot link to a requirement in another project.
- Approval changes no linked requirement content or lifecycle state.

`SUPERSEDED` is reserved shared vocabulary. No supersede operation is exposed
until the governed replacement workflow is designed.

## API and UI

Base API: `/api/v1/workspaces/:workspaceId/projects/:projectId/business-rules`

| Method | Path            | Behavior                                         |
| ------ | --------------- | ------------------------------------------------ |
| GET    | `/`             | List the latest 100 project rules                |
| POST   | `/`             | Create a draft                                   |
| GET    | `/:id`          | Read one scoped rule                             |
| GET    | `/:id/versions` | Read immutable history                           |
| PATCH  | `/:id`          | Edit a draft using optimistic concurrency        |
| POST   | `/:id/approve`  | Record explicit human approval and lock the rule |

The `/business-rules` screen supports listing and filtering, draft creation and
editing, requirement links, version history, explicit approval, and read-only
display after approval.

## Verification

The PostgreSQL integration suite covers authentication, strict client input,
server-controlled governance metadata, tenant isolation, cross-project foreign
keys, concurrent editing, explicit approval, immutability, linked-requirement
preservation, complete history, and persistence across application restart.
