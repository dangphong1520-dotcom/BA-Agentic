# SPEC-012 — Design Automation

## Trigger

A requirement with existing design history advances to a newer version.

## Observable result

The background automation detects the version gap, marks an older pending
proposal STALE, and creates a new REQUIREMENT_CHANGED proposal for review.

## Acceptance criteria

- Automation runs inside the modular monolith without adding queue infrastructure.
- It is idempotent for requirement version and generator profile.
- It never auto-accepts generated design.
- It can be disabled with `DESIGN_AUTOMATION_ENABLED=false` for controlled runs.
