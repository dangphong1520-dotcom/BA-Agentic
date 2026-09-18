# Sprint 10 — Source-to-requirement analysis

## Outcome

A BA can select **Analyze source** and receive a persisted, structured proposal
containing requirement fields, a quality finding, a clarification question,
knowledge classifications, confidence, and exact source-segment evidence.

The operation does not create a Requirement, Question, BusinessRule, or
Decision. Human review and proposal acceptance remain the next vertical slice.

## Runtime

The slice introduces a provider-neutral analysis gateway and persisted run
states: RUNNING, COMPLETED, and FAILED. The current local profile is
`LOCAL_DETERMINISTIC_V1`; it proves the governed workflow without requiring an
external API credential. Connecting a production model provider will replace
the gateway implementation while retaining the same contracts and validation.

Every run records the source revision, requester, schema version, model profile,
result or safe failure, and timestamps. The service validates structured output
and ensures every evidence identifier belongs to the analyzed source before
persistence.

## API and UI

- `POST .../sources/:sourceId/analyses` creates and executes a run.
- `GET .../sources/:sourceId/analyses` lists recent persisted runs.
- `GET .../source-analyses/:id` reads one scoped run.
- The Source detail screen displays the action, history, proposal, findings,
  questions, classifications, confidence, and source evidence.

## Verification

The PostgreSQL suite covers authentication, tenant isolation, persistence,
source revision, evidence references, failure state, restart, and confirms that
analysis creates no project knowledge. The full repository typecheck, lint,
unit tests, integration tests, and production build pass. The browser journey
was verified by creating a source, running analysis, and reloading its result.

## Next slice

SPEC-002 will let the BA edit, reject, or accept a proposal exactly once as a
DRAFT requirement. Acceptance will revalidate source references and protect
against stale or repeated application.
