# SPEC-014 — Automatic Document Generator

## Trigger

A BA opens Automatic Documents for a project and selects BRD, PRD, or SRS.

## Observable result

The system assembles a structured document proposal from the project's current
requirements and provides a Markdown download. The proposal identifies the
requirement versions used to produce it.

## Acceptance criteria

- BRD, PRD, and SRS have distinct, built-in section structures.
- Document content is derived only from stored project and requirement data.
- Missing knowledge is shown explicitly as `Chưa xác định`; it is never invented.
- Every preview is labelled PROPOSAL and includes its generation time, generator
  profile, and requirement-version trace.
- The BA can switch formats and download the current draft as Markdown.
- Generation never changes requirement lifecycle state or approved knowledge.
- User-uploaded custom templates, DOCX/PDF export, and document version approval
  are future slices and are not implied by this delivery.

