# Sprint 08 — Requirement lifecycle and human approval

## Outcome

Project members can move a requirement from draft through clarification,
review, explicit human approval, and baseline. Each transition is validated by
the server, uses optimistic concurrency, and creates an immutable version
snapshot.

## Transition policy

```text
DRAFT ────────────────> READY_FOR_REVIEW ──> APPROVED ──> BASELINED
  │                              │
  └─> CLARIFICATION_REQUIRED <───┘
                │
                └───────────────> READY_FOR_REVIEW
```

- New requirements begin as DRAFT.
- DRAFT and CLARIFICATION_REQUIRED content remains editable.
- Moving to READY_FOR_REVIEW requires a description and acceptance criteria.
- READY_FOR_REVIEW can return to CLARIFICATION_REQUIRED for another edit cycle.
- Approval and baseline are dedicated human commands. The authenticated server
  session supplies the actor and timestamp; clients cannot forge either value.
- APPROVED and BASELINED content is locked. Evidence can still be viewed, while
  new evidence links cannot be attached to these governed versions.
- Every successful transition increments the requirement version and writes a
  complete RequirementVersion snapshot in the same database transaction.
- Stale or concurrent commands return a conflict instead of overwriting state.

Other lifecycle vocabulary remains outside this sprint until its transition
policy and governance rules are defined.

## API and UI

Base API: `/api/v1/workspaces/:workspaceId/projects/:projectId/requirements`

| Method | Path                         | Behavior                               |
| ------ | ---------------------------- | -------------------------------------- |
| POST   | `/:id/request-clarification` | Return editable work for clarification |
| POST   | `/:id/ready-for-review`      | Apply the quality gate and lock review |
| POST   | `/:id/approve`               | Record explicit human approval         |
| POST   | `/:id/baseline`              | Record the governed baseline           |

The requirement screen shows the current status, allowed actions, server-owned
approval metadata, and the status captured in every historical version.

## Verification

The PostgreSQL integration suite covers quality gates, authentication, tenant
scope, strict client input, concurrent transitions, clarification and editing,
server-controlled approval identity, immutable approved content, baseline,
history completeness, and persistence across application restart.
