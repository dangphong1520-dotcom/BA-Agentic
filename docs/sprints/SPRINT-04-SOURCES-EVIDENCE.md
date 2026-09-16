# Sprint 04 — Sources and requirement references

## Scope

Project members can save pasted source text, browse stable line segments, and
attach a segment to the current saved version of a draft requirement. Sources
support MANUAL_INPUT, MEETING, DOCUMENT, EMAIL, and CHAT classification. These
types describe pasted text; file upload and parsing are not implemented.

Source text is stored exactly as submitted, including whitespace and line endings.
Nonblank newline-separated lines become SourceSegments with their original text,
one-based line number, and zero-based UTF-16 start/end offsets (end exclusive).
Blank lines remain in the original content but do not produce selectable segments.
Limits: 120-character title, 20,000-character content, 200 lines, 4,000 characters
per line. Offsets use JavaScript string units, not bytes or Unicode code points.

Source content and segments have no update/delete API. Revision is fixed at 1;
corrections are saved as new sources. A later revision workflow must preserve
existing referenced segments.

## Reference semantics

RequirementEvidence is a manual reference to a SourceSegment and an exact
RequirementVersion. It is not a confirmed trace claim, an approval, or proof that
the source supports the requirement. No AI confirmation or extraction is added.
The UI labels references accordingly and shows the exact excerpt and source link.

The request contains only segmentId and expectedVersion. The server supplies the
actor, timestamp, requirement scope, and reference identity. ProjectService enforces
explicit project membership; database composite foreign keys prevent cross-project
requirements, segments, or source relationships. The requirement version must exist.

Attachment checks the current DRAFT and expectedVersion while holding a row lock.
The content, version number, and content timestamp remain unchanged. Repeated or
concurrent attachment of the same segment/version returns the existing reference
without duplicate rows or replacing its original actor and timestamp.
Concurrent content edits either follow the attachment (keeping a historical
reference) or make attachment fail with 409. References never move automatically
to later versions: the UI distinguishes current-version and older references.

References are append-only through the API. Removal/supersession governance,
source revision management, confirmed TraceLink workflows, and evidence quality
review are future work; no claim is made of administrator-proof storage.

## API

Base: /api/v1/workspaces/:workspaceId/projects/:projectId

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /sources | First 100 sources in stable creation order, with segments |
| POST | /sources | Save source and its segments atomically |
| GET | /sources/:id | Read original content and segments |
| GET | /requirements/:id/evidence | Latest 100 references, newest requirement version first |
| POST | /requirements/:id/evidence | Attach segment to current saved draft version |

Source detail and requirement references are linked in the Web UI. Adding a source
in another tab requires reopening the requirement to refresh available choices.
Attachment refreshes references while keeping the content editor draft mounted.
Pagination remains a later slice. Lists are capped; this is not an unlimited
document store.

## Verification

Run root typecheck, API/Web lint, API/Web unit tests, root build, and
`pnpm --filter api test:postgres`. Apply the additive migration with
`pnpm --filter api db:migrate`. Existing source notes on requirements are kept
as unverified context; they are not automatically converted into evidence.

Integration coverage includes exact text/offsets, scoped access, cross-project
foreign keys, duplicate attachment, stale versions, attachment/content races,
source preservation, unchanged content timestamps, and restart persistence.
