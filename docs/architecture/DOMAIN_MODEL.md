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
