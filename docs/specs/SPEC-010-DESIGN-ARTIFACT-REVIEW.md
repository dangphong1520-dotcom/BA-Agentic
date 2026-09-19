# SPEC-010 — Design Artifact Review

## Trigger

The BA generates a design proposal from a saved requirement.

## Observable result

The proposal is persisted with its own version, requirement version, generator
profile, history, and PENDING_REVIEW status. The BA can accept or reject it once.

## Acceptance criteria

- Review uses optimistic concurrency and rejects stale or repeated decisions.
- Accepted and rejected artifacts remain immutable history.
- Every artifact stays classified as PROPOSAL; acceptance records design review
  and does not approve or alter the source requirement.
- Project access is enforced by the API.
