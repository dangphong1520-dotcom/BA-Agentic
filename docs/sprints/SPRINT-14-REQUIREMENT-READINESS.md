# Sprint 14 — Requirement readiness

## Outcome

Every saved requirement now has a deterministic Dev Ready assessment. The
panel separates hard blockers from missing supporting context and shows READY,
CONDITIONAL, or NOT_READY without changing lifecycle state.

## Checks

The assessment covers description, business goal, actor, main flow, acceptance
criteria, source evidence, and unresolved blocking questions. Description,
acceptance criteria, and blockers are hard checks; the remaining checks support
BA judgment.

## Governance

The API calculates readiness from current project-scoped records and returns a
shared schema-validated contract. AI does not approve, baseline, or move the
requirement. Existing lifecycle commands remain explicit human actions.

## Verification

- API integration tests cover NOT_READY, CONDITIONAL, and READY.
- An ANSWERED blocker remains unresolved until it is CLOSED.
- Closing a blocker updates readiness without changing requirement content.
- Foreign project access returns not found.
- The local UI showed CONDITIONAL for an incomplete test requirement and READY
  for the validated VAT requirement with three evidence links.
