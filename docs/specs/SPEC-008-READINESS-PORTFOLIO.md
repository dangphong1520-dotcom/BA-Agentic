# SPEC-008 — Readiness Portfolio

## Trigger

The BA opens **Sẵn sàng dự án** to prioritize requirements.

## Observable result

The product applies the existing deterministic readiness rules to every requirement and reports project totals plus the failed checks for each item.

## Acceptance criteria

- Portfolio totals equal the returned requirement items.
- Every item reuses the server-owned SPEC-005 assessment.
- The view is advisory and never changes lifecycle or approval state.
- Selecting an item opens its requirement and actionable readiness detail.
- API contract, local UI, typecheck, integration tests, lint, and build pass.
