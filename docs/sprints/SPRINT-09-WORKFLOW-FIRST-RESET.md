# Sprint 09 — Workflow-first reset

## Outcome

The project now has one active MVP v0.1 journey and a build order based on BA
validation. Existing code is classified for reuse, limited maintenance, or
freeze. The next implementation target is SPEC-001: source-to-requirement AI
analysis.

## Completed

- Accepted workflow-first delivery in ADR-003.
- Defined the raw-input-to-approved-requirement journey and acceptance criteria.
- Audited existing modules as KEEP, REFACTOR, FREEZE, or REMOVE WHEN FOUND.
- Froze infrastructure expansion until product validation supplies a reason.
- Updated the coding constitution so Codex selects work from the active journey
  rather than the target architecture sequence.

## Next slice

SPEC-001 will add a contextual **Analyze source** action and a persisted,
schema-valid analysis result containing requirement proposals, findings,
clarification questions, classifications, and exact source references. The
proposal remains separate from confirmed knowledge until SPEC-002 adds the
review and acceptance flow.

Implemented in [Sprint 10](SPRINT-10-SOURCE-ANALYSIS.md) with a local,
provider-neutral analysis profile and governed persisted results.

## Exit criteria

- Product, architecture, and repository instructions point to MVP v0.1.
- No existing working module is deleted or rewritten without a workflow reason.
- The current repository passes documentation and code validation unchanged.
- SPEC-001 has a bounded trigger, output, governance rules, and acceptance
  criteria ready for implementation.
