# Sprint 05 — Clarification questions

## Outcome

Project members can create clarification questions, optionally link them to a
requirement, record priority, category, blocking state and stakeholder, then
record an answer and close the question. Closing a question never changes or
approves its linked requirement.

## Governance and history

- New questions start OPEN and at version 1.
- ANSWERED and CLOSED require a non-empty answer.
- A question can move from OPEN to ANSWERED, then from ANSWERED to CLOSED.
- CLOSED questions are immutable through the API.
- Every successful change atomically records a complete QuestionVersion snapshot.
- Updates require `expectedVersion`; concurrent or stale changes return 409.
- The API supplies creator, timestamps, initial status and version.
- Workspace/project membership and composite foreign keys prevent cross-project links.

The persisted category vocabulary follows `DOMAIN_MODEL.md`: BUSINESS, PROCESS,
DATA, RULE, SYSTEM, TECHNICAL, UI_UX, EXCEPTION, SECURITY and DEPENDENCY. AI may
later propose questions, but this slice records human-created project knowledge.

## API and UI

Base API: `/api/v1/workspaces/:workspaceId/projects/:projectId/questions`

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/` | List the latest 100 project questions |
| POST | `/` | Create an open question |
| GET | `/:id` | Read one scoped question |
| GET | `/:id/versions` | Read immutable version history |
| PATCH | `/:id` | Update an open/answered question with optimistic concurrency |

The `/questions` screen supports creating, answering, closing, filtering by
status and requirement, and showing unresolved blocking questions. Requirement
and project screens link into this workspace.

## Verification

The PostgreSQL integration suite covers authentication, strict input, tenant
isolation, database foreign keys, answer-before-close governance, concurrent
updates, requirement preservation and restart persistence. The browser flow was
verified for create, answer and close with all three history snapshots visible.
