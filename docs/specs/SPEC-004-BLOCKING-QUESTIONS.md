# SPEC-004 — Resolve blocking questions before review

## User trigger

A BA selects **Send for review** on a DRAFT or CLARIFICATION_REQUIRED
requirement.

## Before and after

Before this change, the requirement could enter READY_FOR_REVIEW while a linked
question marked as blocking was still OPEN or ANSWERED.

After this change, the API rejects that transition until every linked blocking
question is CLOSED. The UI explains the reason and links directly to the
filtered list of blocking questions for the requirement.

## Acceptance criteria

1. An OPEN or ANSWERED blocking question linked to the requirement prevents
   transition to READY_FOR_REVIEW.
2. A CLOSED blocking question does not prevent the transition.
3. A non-blocking question does not prevent the transition.
4. Questions linked to another requirement, project, or workspace do not affect
   the transition.
5. The failed transition does not change requirement status, version, or
   history.
6. The web UI presents a clear action to open the relevant blocking questions.
7. Existing optimistic concurrency and minimum-content checks remain enforced.

## Validation route

- API integration tests create linked blocking questions and verify rejected
  and successful transitions.
- The local browser journey attempts review with an open blocker, follows the
  question link, closes the question, and retries successfully.
