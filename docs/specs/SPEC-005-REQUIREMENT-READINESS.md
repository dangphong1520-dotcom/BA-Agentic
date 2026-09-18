# SPEC-005 — Requirement readiness assessment

## User trigger

A BA opens a saved requirement and reviews whether it is ready for formal
review or development discussion.

## Observable behavior

The requirement page shows a deterministic readiness assessment with three
possible results:

- READY: every MVP readiness check passes.
- CONDITIONAL: no hard blocker exists, but important context is missing.
- NOT_READY: minimum review content is missing or a blocking question remains.

The panel lists each check separately and links the BA to evidence or blocking
questions where action is available. The assessment never changes requirement
status and never grants approval authority to AI.

## Checks

1. Description exists.
2. Business goal exists.
3. Actor exists.
4. Main flow exists.
5. Acceptance criteria exist.
6. At least one source-evidence link exists.
7. No linked blocking question remains OPEN or ANSWERED.

Description, acceptance criteria, and unresolved blockers are hard checks.
Other missing information produces CONDITIONAL readiness.

## Acceptance criteria

1. The API calculates the assessment from current project-scoped data.
2. Tenant isolation is identical to requirement access.
3. Counts and individual checks conform to one shared contract.
4. An unresolved blocker produces NOT_READY even when content is complete.
5. Closing the blocker updates the assessment without editing the requirement.
6. Missing contextual fields or evidence produce CONDITIONAL when no hard check
   fails.
7. All checks passing produces READY.
8. The web page explains that readiness is advisory and keeps lifecycle actions
   under explicit human control.

## Validation route

- API integration tests exercise NOT_READY, CONDITIONAL, and READY results.
- The local browser shows the panel for a real requirement and confirms that
  question lifecycle changes update readiness.
