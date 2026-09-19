# SPEC-013 — Prompt-to-Prototype

## Trigger

A BA selects a saved requirement, describes a design refinement in natural
language, and asks Design Studio to generate a new proposal.

## Observable result

Design Studio creates a versioned PROPOSAL containing Flow, BPMN, and prototype
views. The saved instruction and exact requirement version remain visible so a
reviewer can understand why the proposal changed.

## Acceptance criteria

- A free-text instruction can refine the generated prototype without replacing
  the governed requirement as the source of truth.
- Every generated artifact stores the instruction, requirement version, reason,
  generator profile, and review state.
- A generated artifact always starts as PROPOSAL and requires human acceptance.
- Empty instructions still support the existing requirement-to-design journey.
- The optional model gateway receives structured requirement context and the
  refinement instruction; the local generator remains usable without an API key.
- This slice generates reviewable design representations. Runnable application
  code generation and visual drag-and-drop editing are outside this scope.

