# SPEC-001 — Source-to-requirement analysis

## User story

As an IT Business Analyst, I want to analyze stored raw notes from the source
screen so that I receive a structured, evidence-linked first draft without
writing a prompt or accidentally creating approved knowledge.

## Trigger and result

Trigger: on a Source detail screen, the BA selects **Analyze source**.

Result: the system persists one analysis run and presents its requirement
proposal, findings, clarification questions, classifications, and source
references for review. No Requirement, Question, BusinessRule, or Decision is
created by this operation.

## Input boundary

- Authenticated user, workspace, project, and source identifier
- The current immutable source revision and its segments
- Project name and business goal as minimal context
- A server-selected prompt and output schema version

The client cannot supply user identity, project context, model instructions,
approval state, or arbitrary tool permissions.

## Persisted run

Each run records:

- id, workspaceId, projectId, sourceId, and sourceRevision
- status: RUNNING, COMPLETED, or FAILED
- schemaVersion and provider-neutral model profile
- requestedBy, createdAt, completedAt
- structured result when completed
- a bounded safe error code and message when failed

The raw prompt, credentials, and provider response do not become routine product
records or logs.

## Structured result

The result contains:

- one requirement proposal using the existing requirement draft fields
- zero or more findings using the shared finding vocabulary
- zero or more clarification-question proposals
- explicit knowledge classification for every proposed statement
- exact source segment identifiers for supported statements
- confidence as advisory metadata, never as approval

Every referenced segment must belong to the run's source and project. FACT
requires at least one source reference. Unsupported content must be classified
as INFERENCE, ASSUMPTION, PROPOSAL, or OPEN_QUESTION.

## Runtime policy

The first local slice uses one server-side analysis service and one model-gateway
interface. The HTTP request may execute synchronously with an explicit timeout,
while the run is persisted before the model call. A failure changes the run to
FAILED and can be retried by creating a new run.

The model receives no database, filesystem, shell, browser, or network tool.
Domain writes are outside this operation.

## API behavior

- `POST /workspaces/:workspaceId/projects/:projectId/sources/:sourceId/analyses`
  creates and executes a scoped run.
- `GET /workspaces/:workspaceId/projects/:projectId/sources/:sourceId/analyses`
  lists recent runs.
- `GET /workspaces/:workspaceId/projects/:projectId/source-analyses/:id`
  reads one scoped run.
- Repeating POST intentionally creates another analysis; proposal acceptance
  idempotency belongs to SPEC-002.

## Acceptance criteria

1. An unauthenticated or cross-project request cannot start or read a run.
2. A missing or empty source fails before any model call.
3. The run stores the exact source revision used.
4. Invalid model output produces FAILED; it never becomes partially persisted
   domain knowledge.
5. Foreign, missing, or unsupported FACT references fail result validation.
6. Success displays proposals and their evidence in the source screen.
7. The action creates no confirmed requirement, question, rule, or decision.
8. Refreshing the page preserves completed and failed runs.
9. Automated tests cover scope, structured validation, evidence rules, failure,
   persistence, and application restart.
10. A browser test completes the action from an existing local source.

## Product-learning question

Does the first structured result give the BA a useful review starting point, and
can the BA clearly distinguish source facts from AI-generated uncertainty?
