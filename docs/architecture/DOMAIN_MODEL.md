# BA Agent Platform — Domain Model

## 1. Domain Philosophy

The platform models Business Analysis knowledge as structured entities.

The primary source of truth should be structured project knowledge, not generated documents or chat history.

Core principles:

- preserve source evidence
- preserve history
- preserve versioning
- preserve traceability
- distinguish AI proposals from approved knowledge

---

## 2. Core Hierarchy

Workspace
→ Project
→ BA Knowledge

A Project is the primary knowledge context boundary.

---

## 3. Workspace

Represents a personal or team working environment.

Potential fields:

- id
- name
- description
- owner_id
- type
- created_at
- updated_at

Future types:

PERSONAL
TEAM
ENTERPRISE

---

## 4. Project

Represents a BA project.

Potential fields:

- id
- workspace_id
- project_code
- name
- description
- business_goal
- business_context
- status
- start_date
- end_date
- created_by
- created_at
- updated_at

Status examples:

DRAFT
ACTIVE
ON_HOLD
COMPLETED
ARCHIVED

---

## 5. Stakeholder

Represents an involved business or technical stakeholder.

Potential information:

- name
- role
- organization
- department
- stakeholder_type
- influence
- interest
- notes

---

## 6. Meeting

Represents a project meeting.

Potential fields:

- meeting_code
- title
- meeting_type
- objective
- agenda
- start_time
- end_time
- status

Meeting types may include:

DISCOVERY
ELICITATION
REVIEW
REFINEMENT
DESIGN
UAT
PLANNING
OTHER

---

## 7. Source

Represents where project information originated.

Source types may include:

MEETING
EMAIL
CHAT
DOCUMENT
EXCEL
PDF
API_DOCUMENTATION
SCREENSHOT
VOICE
TICKET
MANUAL_INPUT
SYSTEM

A Source may contain many Source Segments.

---

## 8. Source Segment

Represents a precise portion of a source.

Potential metadata:

- page
- section
- line
- speaker
- timestamp
- table
- heading

Source Segments are important for evidence-level traceability.

---

## 9. Requirement

Requirement is a first-class domain entity.

Potential fields:

- requirement_code
- title
- description
- requirement_type
- status
- priority
- business_goal
- rationale
- actor
- trigger
- preconditions
- postconditions
- main_flow
- alternative_flow
- exception_flow
- constraints
- assumptions
- version
- created_by
- approved_by
- timestamps

---

## 10. Requirement Types

Possible types:

BUSINESS
STAKEHOLDER
FUNCTIONAL
NON_FUNCTIONAL
BUSINESS_RULE
DATA
INTEGRATION
UI_UX
SECURITY
TRANSITION
COMPLIANCE

---

## 11. Requirement Status

Target statuses:

DRAFT
ANALYZING
CLARIFICATION_REQUIRED
READY_FOR_REVIEW
APPROVED
BASELINED
IMPLEMENTING
VERIFIED
RELEASED
REJECTED
DEPRECATED
CHANGED

---

## 12. Requirement Priority

MVP priority may use MoSCoW:

MUST
SHOULD
COULD
WONT
UNDEFINED

---

## 13. Acceptance Criteria

Acceptance Criteria should eventually be modeled independently.

Potential fields:

- id
- requirement_id
- code
- title
- description
- given
- when
- then
- status

This allows future Test Case traceability.

---

## 14. Business Rule

Business Rules should be first-class entities.

Potential fields:

- rule_code
- title
- description
- status
- priority
- effective dates
- version
- approver

AI may propose a rule.

AI may not approve a rule.

---

## 15. Decision

Decision is a first-class entity.

Potential fields:

- decision_code
- title
- description
- rationale
- status
- decision_date
- decided_by
- version

Potential states:

PROPOSED
APPROVED
REJECTED
SUPERSEDED
DEPRECATED

Do not overwrite historical decisions.

---

## 16. Assumption

Assumptions must remain explicitly modeled.

Potential states:

OPEN
VALIDATED
INVALIDATED
EXPIRED

An unvalidated assumption must never become a fact silently.

---

## 17. Open Question

Potential fields:

- question_code
- question
- category
- status
- priority
- blocking
- owner
- stakeholder
- answer
- answered_at

Question categories:

BUSINESS
PROCESS
DATA
RULE
SYSTEM
TECHNICAL
UI_UX
EXCEPTION
SECURITY
DEPENDENCY

---

## 18. Risk

Potential fields:

- risk_code
- title
- description
- probability
- impact
- risk_level
- mitigation
- owner
- status

---

## 19. Document

Documents represent generated or managed BA artifacts.

Possible types:

BRD
PRD
SRS
FSD
URD
USE_CASE
API_SPEC
DATA_MAPPING
BPMN
ERD
SEQUENCE_DIAGRAM
TEST_SPEC
MEETING_MINUTES

Documents are not the only source of truth.

---

## 20. Trace Link

Trace Link is one of the most important entities.

Concept:

source_entity
relationship
target_entity

Potential relationships:

DERIVED_FROM
SUPPORTS
CONTRADICTS
RELATED_TO
DEPENDS_ON
BLOCKS
REFINES
PARENT_OF
CHILD_OF
GOVERNED_BY
DECIDED_BY
IMPLEMENTED_BY
DOCUMENTED_IN
VERIFIED_BY
AFFECTED_BY
SUPERSEDES
GENERATED_FROM

---

## 21. Requirement Version

Approved and baselined knowledge should preserve history.

A Requirement Version may contain:

- requirement_id
- version
- snapshot
- change_summary
- changed_by
- change_request_id
- created_at

---

## 22. Agent Run

Every important Agent execution should be auditable.

Potential fields:

- id
- project_id
- agent_id
- status
- input
- output
- model
- prompt_version
- token usage
- start/end time
- error

Possible status:

PENDING
RUNNING
WAITING_FOR_HUMAN
COMPLETED
FAILED
CANCELLED

---

## 23. Agent Finding

Represents an issue or insight produced by AI.

Finding types:

MISSING_INFORMATION
AMBIGUITY
CONFLICT
DEPENDENCY
RISK
RECOMMENDATION
DUPLICATE
TRACEABILITY_GAP
QUALITY_ISSUE
CHANGE_IMPACT

Potential severity:

INFO
LOW
MEDIUM
HIGH
CRITICAL

---

## 24. AI Proposal

Represents a proposed change.

Potential operations:

CREATE
UPDATE
LINK
UNLINK
DEPRECATE

Potential statuses:

PENDING
ACCEPTED
EDITED
REJECTED

Approved project data should normally be changed through proposal + review, not direct AI writes.

---

## 25. Knowledge Claim

The platform may model claims with classification.

Claim types:

FACT
INFERENCE
ASSUMPTION
PROPOSAL
DECISION
OPEN_QUESTION

A fact should normally include evidence.

---

## 26. Core Traceability Chain

An example chain:

Meeting
→ Source Segment
→ Requirement
→ Business Rule
→ Acceptance Criteria
→ Document Section
→ Test Case
→ Release

---

## 27. MVP Core Entities

Initial implementation should prioritize:

User
Workspace
WorkspaceMember
Project
Meeting
Source
SourceSegment
Requirement
AcceptanceCriteria
BusinessRule
Decision
Question
TraceLink
AgentRun
AgentFinding

Do not create every future entity immediately.

---

## 28. Database Strategy

Planned primary database:

PostgreSQL

Core domain entities should use relational modeling.

Flexible data may use JSONB.

Semantic embeddings may use pgvector.

---

## 29. Domain Boundary Rule

Do not turn every entity into a generic JSON object.

Important BA knowledge should remain explicitly modeled so that the platform can:

- validate it
- search it
- trace it
- version it
- reason about it
- apply permissions to it

---

## 30. Model Status and Identity

This document describes the target conceptual model. User, Workspace, WorkspaceMember, Project, and ProjectMember have a minimal Prisma schema. Requirement and RequirementVersion support structured manual DRAFT records and atomic historical snapshots (Sprint 03). Source, SourceSegment, and RequirementEvidence support immutable pasted text and manual version-specific references (Sprint 04); references are not confirmed trace claims. Question and QuestionVersion support governed clarification through closure (Sprint 05). BusinessRule, BusinessRuleRequirement, and BusinessRuleVersion support requirement links, explicit human approval, optimistic concurrency, and immutable approved records (Sprint 06). Decision, DecisionRequirement, and DecisionVersion support proposed decisions, rationale, requirement impact, explicit human approval, immutable history, and approved replacement links (Sprint 07). Other knowledge entities remain unimplemented. Fields and statuses labelled potential or possible are design candidates. Final contracts must be introduced with the corresponding implementation slice.

User identifies a human account. WorkspaceMember relates a User to a Workspace and its granted access. Membership does not implicitly grant access to every project; application services enforce project access. Stakeholders may be business contacts without a login account.

Every project-owned entity must have a stable identifier and an unambiguous project/workspace scope, directly or through enforced parent relationships. Resolve and validate that scope server-side. Display codes are not authorization identifiers. Define code uniqueness within a project when implementing persistence.

## 31. Core Relationships

| Parent or source | Relationship | Child or target |
| --- | --- | --- |
| Workspace | Has many | WorkspaceMember and Project |
| User | May have many | WorkspaceMember |
| Project | Owns many | Source, Requirement, BusinessRule, Decision, Question, AgentRun |
| Source | Contains many | SourceSegment |
| Requirement | Has many | AcceptanceCriteria and RequirementVersion |
| AgentRun | Produces zero or more | AgentFinding and AI Proposal |
| AI Proposal | Refers to | Target entity and expected version; source AgentRun |
| TraceLink | Connects | Two typed, scoped entity references |

Relationships describe ownership and references; they do not automatically create confirmed trace links. A meeting transcript is a Source associated with the Meeting, with precise SourceSegments for evidence. Reprocessing must preserve references used by existing findings and approved knowledge.

## 32. Lifecycle and Review Invariants

The status list in section 11 is vocabulary, not a transition graph. Do not infer that adjacent statuses are always reachable. Implement an explicit transition policy and tests for each supported operation; unsupported transitions fail closed. AI-created requirements begin as DRAFT.

Only an authorized human can approve, baseline, or release knowledge. Analysis readiness and confidence never confer approval. Changes to approved or baselined content must preserve historical versions and go through the governed change workflow; exact reopening transitions remain to be specified before implementation.

Sprint 08 implements the first requirement transition policy: DRAFT and CLARIFICATION_REQUIRED are editable; READY_FOR_REVIEW requires a description and acceptance criteria; explicit human commands advance READY_FOR_REVIEW to APPROVED and APPROVED to BASELINED. Returning READY_FOR_REVIEW to CLARIFICATION_REQUIRED is supported. Each transition increments the version and atomically preserves a complete snapshot. Reopening approved or baselined requirements remains unspecified and therefore unavailable.

AI Proposal belongs in the first MVP slice that supports persisted AI changes, alongside AgentRun and AgentFinding. Store operation, target reference, expected version, proposed content, reason, evidence, originating run, and review metadata. The backend assigns reviewer identity and review time.

For section 24, EDITED represents a human-modified proposal still awaiting acceptance; it is not an applied domain change. Only successful acceptance after policy, evidence, and version checks applies a change. Rejecting a proposal leaves the target unchanged. A stale proposal stays unapplied and returns a conflict; do not invent a new status silently.

Acceptance checks the expected version and atomically records the permitted entity change, resulting version, and proposal review. Repeating the same acceptance must not apply it again. Accepting a proposal does not approve the resulting requirement.

## 33. Evidence and TraceLink Integrity

An evidence reference identifies a SourceSegment and the stable source revision it describes. If a statement has no supporting evidence, preserve its uncertainty classification instead of inventing a reference. Reference existence alone does not demonstrate that the source supports the statement.

TraceLink persistence must record typed endpoints, relationship, project scope, origin, confirmation state, and evidence where applicable. PROPOSED AI links are distinguishable from confirmed links. Confirmation requires an authorized human or a documented deterministic rule; semantic similarity alone is insufficient.

Reject missing endpoints, incompatible relationship/endpoint types, and cross-project links outside an explicitly supported policy. Define relationship direction once in shared contracts; examples such as DERIVED_FROM must not switch direction between clients. Avoid duplicate links and preserve removal/supersession history for approved knowledge.

Requirement type BUSINESS_RULE does not replace the first-class BusinessRule entity. Establish their mapping before supporting that type; do not maintain two independent authoritative copies of the same rule.

## 34. Contract Decisions and Validation

Use one shared FindingType vocabulary from AGENTS.md. The shorter MVP_SCOPE list is a delivery subset. Question categories differ between the conceptual Elicitation Agent and section 17; finalize a shared category mapping before exposing persisted question contracts. Do not turn every example label into a separate enum.

Tests for the first persisted domain slice must cover unauthorized approval, invalid transition, cross-project references, stale proposal acceptance, repeated acceptance, source preservation, and history preservation. These are implementation acceptance criteria, not claims of passing tests today.

Related context: [System Architecture](SYSTEM_ARCHITECTURE.md), [AI Agent Architecture](AI_AGENT_ARCHITECTURE.md), and [MVP Scope](../product/MVP_SCOPE.md).
