# Workflow-first execution map

## Decision boundary

The target architecture remains useful as a direction. It no longer determines
build order. Product workflow evidence determines build order.

```text
AGENTS.md
    ↓
MVP v0.1 journey
    ↓
SPEC-001: Source-to-requirement analysis
    ↓
Codex plan → build → run → test → review
    ↓
BA validation session
    ↓
iterate or productionize
```

## Repository audit

| Area                                               | Decision          | Reason and next treatment                                                                           |
| -------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| Product principles and governance                  | KEEP              | Human approval, uncertainty, evidence, and history are product differentiators.                     |
| Next.js Web and NestJS API                         | KEEP              | They already support the local vertical slice.                                                      |
| PostgreSQL and Prisma                              | KEEP              | Existing structured knowledge, versions, and relationships need durable transactions.               |
| Workspace and Project                              | KEEP              | They provide the minimum context boundary.                                                          |
| Source and source segments                         | KEEP              | They are the entry point and evidence layer for v0.1.                                               |
| Requirement drafts and lifecycle                   | KEEP              | They are the reviewed output and human gate.                                                        |
| Questions                                          | KEEP              | They expose unknown information instead of allowing guesses.                                        |
| Business Rules and Decisions                       | KEEP, LIMIT       | Preserve working governance; build no new breadth until the source-to-requirement flow needs it.    |
| UI navigation and product language                 | REFACTOR          | Make the v0.1 journey the primary path and move supporting registers behind it.                     |
| AI architecture documents                          | REFACTOR          | Reduce the first implementation to one deterministic analysis workflow and one structured contract. |
| Worker scaffold                                    | FREEZE            | No product behavior uses it yet; a synchronous local run is enough to validate the first scenario.  |
| Redis, BullMQ, pgvector, S3, SSE                   | FREEZE            | Add only when measured latency, reliability, retrieval, or file size requires them.                 |
| Broad module roadmap                               | FREEZE            | Keep as backlog context without treating it as sprint order.                                        |
| Generated junk, duplicate rules, dead placeholders | REMOVE WHEN FOUND | Remove only with evidence and focused changes; no rewrite campaign.                                 |

## Vertical-slice implementation order

### SPEC-001 — Analyze a source

Trigger: the BA selects **Analyze source** on stored raw text.

Result: one persisted analysis run contains a schema-valid requirement proposal,
findings, questions, classifications, source-segment references, and the source
revision used.

### SPEC-002 — Review a proposal

Trigger: the BA opens the completed analysis.

Result: the BA can inspect evidence, edit fields, reject the proposal, or accept
it once as a DRAFT requirement. The backend owns permissions, references,
version checks, and idempotency.

### SPEC-003 — Validate the BA journey

Trigger: a BA tests a realistic input from start to approved requirement.

Result: observations, completion time, useful and unhelpful outputs, blockers,
and the next product change are recorded. Infrastructure work can follow only
when this evidence identifies a need.

Status: completed in the first controlled local validation on 18 September
2026. The measured journey took 1 minute 32 seconds. Evidence identified one
workflow interruption: transferring a proposed clarification question into the
Questions module. The resulting change pre-fills a governed question draft and
its accepted requirement while preserving explicit BA submission. See
`docs/validation/MVP_V0_1_VALIDATION_001.md`.

### SPEC-004 — Resolve blocking questions before review

Trigger: the BA sends a requirement for review after clarification work.

Result: unresolved blocking questions keep the requirement editable and direct
the BA to the exact work that remains. Once each blocker is explicitly closed,
the governed review transition can proceed. This gate was identified by the
SPEC-003 journey and validated through API integration and the local UI. See
`docs/specs/SPEC-004-BLOCKING-QUESTIONS.md`.

### SPEC-005 — Assess requirement readiness

Trigger: the BA opens a saved requirement to decide what work remains.

Result: a deterministic, project-scoped assessment reports READY, CONDITIONAL,
or NOT_READY and explains each content, evidence, and blocker check. It is
advisory and never changes lifecycle state. See
`docs/specs/SPEC-005-REQUIREMENT-READINESS.md`.

### SPEC-006 — Review analysis findings across a project

Trigger: the BA opens the project findings register.

Result: validated findings from completed source analyses are visible with their
source, classification, confidence, evidence count, and review state. Findings
remain advisory. See `docs/specs/SPEC-006-FINDINGS-REGISTER.md`.

### SPEC-007 — Inspect requirement traceability

Trigger: the BA opens the project traceability view.

Result: every requirement shows its real evidence, source, question, business
rule, and decision link counts without inventing relationships. See
`docs/specs/SPEC-007-TRACEABILITY-VIEW.md`.

### SPEC-008 — Prioritize readiness across a project

Trigger: the BA opens the project readiness portfolio.

Result: SPEC-005 rules are applied consistently to all requirements, with totals
and missing checks that lead back to governed requirement detail. The assessment
does not change lifecycle state. See `docs/specs/SPEC-008-READINESS-PORTFOLIO.md`.

### SPEC-009 — Preview Flow, BPMN, and Prototype

Trigger: the BA selects a saved requirement in Design Studio.

Result: the system produces three version-linked PROPOSAL views: process flow,
BPMN swimlanes, and prototype screens. Sprint 18 validates the value with a
deterministic structured generator before adding persistence, model calls, or
background automation. See `docs/specs/SPEC-009-DESIGN-STUDIO-PREVIEW.md`.

### SPEC-010–012 — Govern and Automate Design Proposals

Trigger: a BA persists a design draft, reviews it, or changes its requirement.

Result: Design Studio retains immutable proposal history, optionally uses the
structured model gateway, and creates a new reviewable proposal when its input
version changes. Human acceptance remains mandatory. See SPEC-010, SPEC-011,
and SPEC-012.

### SPEC-013 — Refine Design from a Prompt

Trigger: a BA describes the desired interface or workflow change for a selected
requirement.

Result: Design Studio creates a new governed Flow, BPMN, and prototype proposal,
retaining both the prompt and requirement version for review. See
`docs/specs/SPEC-013-PROMPT-TO-PROTOTYPE.md`.

### SPEC-014 — Generate Structured Project Documents

Trigger: a BA selects BRD, PRD, or SRS for the current project.

Result: the system assembles a traceable PROPOSAL from stored project knowledge,
marks missing content explicitly, and provides a Markdown download. See
`docs/specs/SPEC-014-DOCUMENT-GENERATOR.md`.

### SPEC-015 — Exercise an Interactive Prototype

Trigger: a BA opens a generated design proposal and selects a screen or viewport.

Result: Design Studio renders a safe, data-free interactive preview for walking
through the proposed user journey before review. See
`docs/specs/SPEC-015-INTERACTIVE-PROTOTYPE.md`.

## Runtime for v0.1

```text
Browser → Next.js → NestJS application service → PostgreSQL
                         │
                         └→ one model gateway call
```

The first implementation may execute the model call synchronously with an
explicit timeout and persisted RUNNING / COMPLETED / FAILED state. Move it to
the Worker only after local validation shows that request duration or recovery
requires background execution. Domain validation remains in the API service in
either design.

## Definition of done for each Codex task

- The task names one user trigger and one observable result.
- Acceptance criteria are written before implementation.
- The smallest complete vertical change is built.
- Contracts, server governance, and UI behavior agree.
- Relevant automated checks pass.
- The changed journey is exercised through the local UI.
- The outcome and product-learning question are documented.
