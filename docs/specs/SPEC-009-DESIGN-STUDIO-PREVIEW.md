# SPEC-009 — Design Studio Preview

## Trigger

The BA selects a saved requirement in **Design Studio**.

## Observable result

The system generates three schema-valid PROPOSAL views tied to the exact
requirement version: a process flow, BPMN swimlanes, and a screen prototype.

## Acceptance criteria

- Generation is project-scoped and never modifies the requirement.
- Output identifies its generator profile, classification, and input version.
- Flow uses preconditions, main flow, exceptions, and acceptance criteria.
- BPMN separates actor and system activities.
- Prototype presents screens, purposes, and UI elements.
- Missing input is surfaced through conservative fallbacks, never invented as fact.
- API contract, integration tests, UI validation, lint, typecheck, and build pass.

## Next validation

Ask a BA whether the three drafts reduce design discussion time. Persisted
versions, review actions, model generation, and worker execution follow only
after this preview proves useful.
