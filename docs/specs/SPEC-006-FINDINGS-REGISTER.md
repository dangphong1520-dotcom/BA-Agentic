# SPEC-006 — Findings Register

## Trigger

The BA opens **Phát hiện phân tích** inside a project after one or more source analyses have completed.

## Observable result

The product lists schema-valid findings across the project with their source, type, knowledge classification, confidence, evidence count, and proposal review state. Selecting a finding returns the BA to its source context.

## Acceptance criteria

- Results are restricted to the selected workspace and project membership.
- Invalid historical result payloads are skipped instead of being presented as trusted knowledge.
- Findings remain advisory and are never promoted to facts or decisions.
- An empty project shows a clear next action.
- API contract, local UI, typecheck, integration tests, lint, and build pass.
