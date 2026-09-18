# MVP v0.1 validation 001 — VAT invoice journey

## Scope

This was a controlled local validation run in the dedicated test workspace. It
was operated by the product team, not an independent external BA research
session. The scenario started with realistic raw notes and ended with an
approved requirement.

## Scenario and timing

The source described a business customer downloading a VAT invoice after a
paid order, including company and tax details, while leaving invoice timing and
invalid tax-number handling unresolved.

- Started: 18 September 2026, 16:43:25 ICT
- Approved: 18 September 2026, 16:44:57 ICT
- Controlled completion time: 1 minute 32 seconds

The timing measures a prepared operator using local deterministic analysis. It
does not predict the duration of stakeholder response in a real project.

## Observed journey

1. Raw notes were stored as an immutable source with three addressable lines.
2. Analysis produced a structured proposal, one missing-information finding,
   one clarification question, confidence, and evidence for all three lines.
3. The BA added the goal, actor, precondition, flows, priority, and an
   acceptance criterion before accepting the proposal.
4. Acceptance created one DRAFT requirement with version history and evidence
   links.
5. The requirement moved to NEEDS_CLARIFICATION. A blocking question was linked
   to it, answered by the Accounting role, and closed with full history.
6. The answer was incorporated into the acceptance criterion. The requirement
   moved to READY_FOR_REVIEW and then APPROVED with approver identity and time.

## Useful output

- The source remained visible and traceable by line.
- AI output stayed a proposal until the BA explicitly accepted it.
- The editable proposal avoided creating a weak requirement from incomplete
  generated fields.
- Question and requirement histories preserved every lifecycle change.
- Approval locked the content and recorded who approved it.

## Friction and product decision

The proposed clarification question was displayed beside the analysis, but the
BA had to copy it manually into the Questions module and select the accepted
requirement again. This breaks flow and creates avoidable transcription risk.

The next product change is a **Create this question** action on an accepted
analysis. It opens a governed question draft with the generated wording and
accepted requirement already filled. The BA still reviews and submits it; the
system does not silently turn AI output into project knowledge.

No evidence from this run requires Redis, a worker queue, vector search, object
storage, or a broader production architecture change.
