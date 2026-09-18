# SPEC-007 — Traceability View

## Trigger

The BA opens **Truy vết** for a project.

## Observable result

Each requirement shows counts for source evidence, distinct sources, clarification questions, open questions, linked business rules, and linked decisions. Selecting a row opens the governed requirement record.

## Acceptance criteria

- Every aggregate is computed by the API inside the workspace/project boundary.
- Evidence count and distinct source count remain separate.
- Open questions are visible without implying that the system resolved them.
- Missing relationships appear as zero and are not invented.
- API contract, local UI, typecheck, integration tests, lint, and build pass.
