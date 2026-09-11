# BA Agent Platform — BA Workflow

## 1. Purpose

This document defines the target Business Analysis operating workflow supported by the platform.

The workflow is designed for daily IT Business Analyst work and later becomes the foundation for AI Agent workflows.

---

## 2. End-to-End Lifecycle

The target lifecycle is:

REQUEST
→ INTAKE
→ DISCOVERY
→ ELICITATION
→ ANALYSIS
→ REQUIREMENT
→ SOLUTION ANALYSIS
→ DOCUMENTATION
→ REVIEW
→ BASELINE
→ DEVELOPMENT SUPPORT
→ SIT / UAT
→ RELEASE
→ CHANGE MANAGEMENT

AI may assist at each stage.

Human users retain approval authority.

---

## 3. Stage 1 — Intake

Goal:

Capture incoming business needs without prematurely converting them into approved requirements.

Possible inputs:

- meeting
- email
- chat
- ticket
- Excel
- Word
- PDF
- screenshot
- voice transcript
- manual stakeholder request
- change request

Output:

Requirement Intake

Possible statuses:

NEW
NEEDS_CLARIFICATION
ACCEPTED
REJECTED
DUPLICATE

AI responsibilities:

- classify request
- identify likely affected module
- extract explicit information
- identify missing information
- generate clarification questions

AI must not invent the business goal.

---

## 4. Stage 2 — Discovery

Goal:

Understand relevant project context before requirement definition.

The system should search:

- existing requirements
- business rules
- decisions
- documents
- processes
- APIs
- related modules
- unresolved questions

Output:

Discovery Brief

The brief may contain:

- existing process
- related requirements
- existing rules
- known constraints
- dependencies
- previous decisions
- knowledge gaps

---

## 5. Stage 3 — Elicitation

Goal:

Identify what the BA still needs to learn from stakeholders.

Question categories:

- Business
- Actor
- Process
- Data
- Rule
- Exception
- Integration
- Security
- Non-functional
- Reporting
- Audit
- Transition

AI should prioritize blocking questions before lower-impact questions.

---

## 6. Meeting Preparation

Before a meeting, the platform may generate:

- objective
- known information
- unknown information
- related requirements
- related decisions
- current open questions
- recommended questions
- possible conflicts

Output:

Meeting Brief

---

## 7. Meeting Capture

During or after a meeting, the platform may capture:

- transcript
- notes
- requirement statements
- decisions
- questions
- business rules
- action items
- risks
- assumptions

Each extracted item should retain source evidence.

---

## 8. Post-Meeting Analysis

Meeting analysis should produce candidates, not automatically confirmed knowledge.

Possible output:

- summary
- business goals
- pain points
- requirement candidates
- decision candidates
- business-rule candidates
- open questions
- assumptions
- risks
- actions

Requirement Candidate is not equal to Approved Requirement.

Decision Candidate is not equal to Approved Decision.

---

## 9. Stage 4 — Requirement Analysis

The Requirement Agent may structure:

- business goal
- actor
- trigger
- preconditions
- main flow
- alternative flow
- exception flow
- postconditions
- rules
- constraints
- dependencies
- acceptance criteria
- assumptions
- questions

Unknown information must remain explicitly unknown.

---

## 10. Requirement Types

Supported requirement types may include:

- BUSINESS
- STAKEHOLDER
- FUNCTIONAL
- NON_FUNCTIONAL
- BUSINESS_RULE
- DATA
- INTEGRATION
- UI_UX
- SECURITY
- TRANSITION
- COMPLIANCE

---

## 11. Requirement Lifecycle

Target lifecycle:

DRAFT
→ ANALYZING
→ CLARIFICATION_REQUIRED
→ READY_FOR_REVIEW
→ APPROVED
→ BASELINED
→ IMPLEMENTING
→ VERIFIED
→ RELEASED

Additional states:

REJECTED
DEPRECATED
CHANGED

AI-created requirements begin as DRAFT.

---

## 12. Requirement Quality Gate

Before review or development, the platform should evaluate:

- completeness
- clarity
- consistency
- testability
- traceability
- feasibility
- atomicity
- necessity
- measurability
- ambiguity

Potential outputs:

CRITICAL
WARNING
QUESTION
SUGGESTION

---

## 13. Dev Ready Check

The platform should help answer:

Is this requirement ready for development?

Possible checks:

- business goal exists
- actor identified
- flow defined
- exceptions handled
- business rules resolved
- dependencies resolved
- acceptance criteria exist
- blockers resolved
- source evidence available

Output:

DEV_READY = YES / NO / CONDITIONAL

AI must not automatically move the requirement lifecycle state based only on this assessment.

---

## 14. Stage 5 — Solution Analysis

After business requirements are understood, solution analysis may cover:

- process
- UX
- data
- integration
- API
- permissions
- exceptions
- dependencies

AI may propose impact areas but should clearly distinguish confirmed dependencies from inferred ones.

---

## 15. Stage 6 — Documentation

Documents should be generated from structured knowledge where possible.

Potential documents:

- BRD
- PRD
- SRS
- FSD
- Use Case
- User Story
- Acceptance Criteria
- BPMN
- API specification
- data mapping
- test scenario

The structured requirement model should remain the main source of truth.

---

## 16. Stage 7 — Review and Baseline

Typical review flow:

AI Review
→ BA Review
→ Technical Review
→ Business / PO Review
→ Approval
→ Baseline

AI may assist review.

AI may not approve or baseline.

---

## 17. Decision Management

Decisions should be managed as structured objects.

Example lifecycle:

PROPOSED
→ APPROVED
→ SUPERSEDED / DEPRECATED

Decisions should retain:

- rationale
- source
- date
- approver
- affected requirements
- version

Old decisions must not be silently overwritten.

---

## 18. Open Question Management

Questions should contain:

- question
- category
- status
- owner
- priority
- blocking status
- due date
- answer
- source
- related requirement

Possible lifecycle:

OPEN
→ ANSWERED

Other states:

DEFERRED
CANCELLED

An answer may result in:

- requirement update
- business rule
- decision
- assumption validation

---

## 19. Development Support

During implementation the BA should be able to manage:

- Dev questions
- requirement clarifications
- unresolved dependencies
- requirement changes
- API clarifications
- business-rule clarifications

When a question has no confirmed answer, the platform should say so.

AI should not invent one.

---

## 20. SIT / UAT

Traceability should support:

Requirement
→ Acceptance Criteria
→ Test Case
→ Test Result

The system should eventually detect:

- requirement without AC
- AC without Test Case
- Test Case without Requirement
- changed requirement requiring retest

---

## 21. Release

A release may contain:

- delivered requirements
- changes
- impacted modules
- known limitations
- new business rules
- API changes
- unresolved issues

Released requirements remain historically traceable.

---

## 22. Change Management

Approved or baselined requirements must not be silently overwritten.

Change flow:

Change Request
→ Impact Analysis
→ Review
→ Approval
→ New Requirement Version
→ Documentation Update
→ Retest

Impact analysis may include:

- requirements
- business rules
- decisions
- documents
- APIs
- UI
- tests

---

## 23. Traceability

Target traceability chain:

Source
→ Requirement
→ Business Rule
→ Decision
→ Document
→ Acceptance Criteria
→ Test Case
→ Release

Not every requirement must contain every artifact, but missing expected relationships should be detectable.

---

## 24. Daily BA Workflow

A target daily experience:

Start Day
→ Daily Brief
→ Review Attention Queue
→ Prepare Meetings
→ Conduct Meetings
→ Analyze Meeting
→ Review Requirement Candidates
→ Analyze Requirements
→ Generate Questions
→ Update Documentation
→ Support Development
→ Review Pending Items
→ Daily Summary

---

## 25. Attention Queue

The platform should surface:

- requirement conflicts
- missing information
- overdue open questions
- pending approvals
- requirement changes
- missing traceability
- unresolved dependencies
- missing acceptance criteria

The goal is:

The BA opens the platform and immediately understands what requires attention.

---

## 26. Core Principle

The platform should assist the BA in discovering what may have been missed.

It should not hide uncertainty.

When information is incomplete:

ASK.

Do not guess.
