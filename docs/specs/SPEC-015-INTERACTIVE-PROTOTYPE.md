# SPEC-015 — Interactive Prototype Preview

## Trigger

A BA opens a generated prototype proposal and selects a screen or viewport.

## Observable result

Design Studio renders an interactive preview that lets the BA move between
proposed screens, enter sample values, and compare desktop and mobile widths.

## Acceptance criteria

- The preview uses the exact screens and elements in the governed proposal.
- Screen tabs and eligible action buttons move through the proposed journey.
- Desktop and mobile modes change only the preview viewport.
- Sample interaction never writes project data or changes requirement state.
- The original proposal cards, version history, and review gate remain visible.
- The preview is explicitly a prototype and does not claim to be generated
  production application code.
