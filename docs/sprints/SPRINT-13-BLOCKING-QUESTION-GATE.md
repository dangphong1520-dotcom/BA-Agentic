# Sprint 13 — Blocking-question review gate

## Outcome

A requirement cannot enter READY_FOR_REVIEW while a linked blocking question
is OPEN or ANSWERED. The BA must explicitly close the question after recording
its answer. Non-blocking questions remain available without stopping review.

## Governance

The API enforces the rule for every client. The transition query repeats the
question condition atomically with the optimistic version and membership
checks, so a stale or racing request cannot bypass the gate. A rejected attempt
does not create a requirement version.

## UI behavior

When the gate rejects a transition, the requirement page explains what remains
and links to the filtered list of blocking questions for that requirement.

## Verification

The integration journey covers an open blocker, an answered but not closed
blocker, a closed blocker, a non-blocking open question, unchanged history after
rejection, and the successful transition after resolution.

The local browser journey confirmed the same behavior: the failed transition
kept version 1 in DRAFT and opened the filtered blocker list; closing the linked
question then allowed version 2 to enter READY_FOR_REVIEW.
