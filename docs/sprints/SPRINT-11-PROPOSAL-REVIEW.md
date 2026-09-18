# Sprint 11 — BA proposal review

## Outcome

A BA can edit an AI-generated requirement proposal, reject it, or accept it
exactly once. Acceptance creates a DRAFT requirement with version history and
links every cited source segment to requirement version 1.

## Governance and consistency

Each proposal has its own version and review state: PENDING, ACCEPTED, or
REJECTED. Edit and transition requests include the version the BA reviewed.
Stale, repeated, or concurrent requests receive a conflict instead of
overwriting a newer decision.

Acceptance updates the proposal, creates the requirement, writes its first
history snapshot, and copies its evidence links inside one database
transaction. A failure rolls back the whole operation, so partial knowledge or
duplicate requirements cannot remain.

## API and UI

- `PATCH .../source-analyses/:id/proposal` saves BA edits.
- `POST .../source-analyses/:id/reject` records rejection.
- `POST .../source-analyses/:id/accept` creates governed project knowledge.
- The Source screen provides an editable proposal form and clear review
  actions. Accepted proposals link directly to the resulting requirement.

## Verification

The PostgreSQL suite covers strict input validation, editing, stale-version
protection, simultaneous acceptance, rejection, requirement history, evidence
traceability, tenant isolation, and persistence across restart. The browser
journey verifies the BA-facing edit and acceptance flow against the local API
and PostgreSQL database.
