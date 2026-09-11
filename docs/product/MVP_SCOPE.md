# BA Agent Platform — MVP Scope

## 1. MVP Objective

The MVP must prove that an IT Business Analyst can use the platform to:

1. Create and manage a project.
2. Capture project knowledge from structured or raw sources.
3. Create structured requirements.
4. Analyze requirement quality using AI.
5. Generate clarification questions.
6. Review AI findings and proposals.
7. Preserve source evidence.
8. Maintain basic traceability.
9. Keep human approval as the final authority.

The MVP should prioritize one coherent BA workflow rather than broad feature coverage.

---

## 2. Primary MVP User

Primary user:

IT Business Analyst

The MVP should optimize daily BA work before expanding to other roles.

---

## 3. Core MVP Journey

The primary user journey is:

Create Workspace
→ Create Project
→ Add Source
→ Create or Extract Requirement
→ Review Requirement
→ Run AI Analysis
→ Review Findings
→ Generate Open Questions
→ Update Requirement
→ Approve Requirement
→ View Traceability

---

## 4. MVP Modules

The MVP should contain the following modules.

### 4.1 Workspace

Capabilities:

- create workspace
- view workspace
- manage current user membership
- support future multi-user architecture

Complex enterprise administration is out of scope.

---

### 4.2 Project

Capabilities:

- create project
- edit project
- view project overview
- archive project
- store project business context
- store project goal

Project is the main context boundary for BA knowledge.

---

### 4.3 Requirement Management

Capabilities:

- create requirement
- edit draft requirement
- view requirement list
- view requirement detail
- manage status
- manage priority
- manage requirement type
- define business goal
- define actor
- define preconditions
- define main flow
- define exception flow
- define acceptance criteria
- link business rules
- link decisions
- link open questions
- link sources

Requirement Detail is a central MVP screen.

---

### 4.4 Requirement Lifecycle

Supported states:

DRAFT
ANALYZING
CLARIFICATION_REQUIRED
READY_FOR_REVIEW
APPROVED
BASELINED
IMPLEMENTING
VERIFIED
RELEASED

Additional states:

REJECTED
DEPRECATED
CHANGED

For the MVP, the most important states are:

DRAFT
CLARIFICATION_REQUIRED
READY_FOR_REVIEW
APPROVED
BASELINED

Backend logic must validate state transitions.

---

### 4.5 Source Management

Capabilities:

- create source record
- upload basic source files
- store source metadata
- store source text when available
- create source segments
- link source segments to requirements

Initial supported source types may include:

- MANUAL_INPUT
- MEETING
- DOCUMENT
- PDF
- EXCEL
- CHAT
- EMAIL
- API_DOCUMENTATION

The MVP does not require full parsing support for every source type.

---

### 4.6 Business Rules

Capabilities:

- create business rule
- edit draft rule
- view rule
- approve rule through human action
- link rule to requirements

AI may propose business rules but must not approve them.

---

### 4.7 Decisions

Capabilities:

- create decision
- view decision
- edit proposed decision
- approve through human action
- link decision to requirements
- preserve superseded decisions

AI may extract decision candidates but may not approve decisions.

---

### 4.8 Open Questions

Capabilities:

- create open question
- assign category
- set priority
- mark blocking status
- record answer
- close question
- link question to requirement

AI may generate questions.

---

### 4.9 AI Requirement Analysis

The MVP should support an action:

Analyze Requirement

The analysis should identify:

- missing information
- ambiguity
- possible conflicts
- possible dependencies
- quality issues
- missing acceptance criteria
- traceability gaps

AI output must be structured.

---

### 4.10 Elicitation Assistance

The MVP should support:

Generate Questions

Questions should include:

- category
- priority
- blocking status
- reason
- suggested stakeholder role

AI must not answer unresolved business questions by guessing.

---

### 4.11 AI Findings

The platform should persist AI findings.

Initial finding types:

MISSING_INFORMATION
AMBIGUITY
CONFLICT
DEPENDENCY
QUALITY_ISSUE
TRACEABILITY_GAP
RECOMMENDATION

Findings should include:

- severity
- description
- target entity
- related entities
- evidence
- confidence
- recommended action
- status

---

### 4.12 AI Proposals

AI should create proposals instead of directly changing approved knowledge.

Proposal workflow:

AI Proposal
→ Human Review
→ Accept / Edit / Reject
→ Backend Validation
→ Commit

---

### 4.13 Traceability

The MVP should support basic trace links.

Examples:

Source Segment
→ Requirement

Requirement
→ Business Rule

Requirement
→ Decision

Requirement
→ Acceptance Criteria

Requirement
→ Question

The MVP should support viewing these relationships.

Advanced visual graph analytics is out of scope.

---

### 4.14 Meeting Support

The MVP may support a basic meeting entity.

Initial capabilities:

- create meeting
- store meeting metadata
- attach transcript or notes
- run meeting analysis
- produce requirement candidates
- produce decision candidates
- produce open-question candidates

Advanced live meeting transcription is out of scope.

---

### 4.15 Knowledge Search

Basic project search should support:

- requirements
- decisions
- business rules
- questions
- sources

Semantic search using pgvector may be introduced incrementally.

The MVP does not require enterprise search infrastructure.

---

## 5. MVP Screens

The initial UI should include:

1. Login
2. Home
3. Projects
4. Project Overview
5. Requirement List
6. Requirement Detail
7. Meeting List
8. Meeting Detail
9. Questions
10. Decisions
11. Knowledge
12. AI Copilot / AI Analysis panel

The Requirement Detail screen is the highest priority.

---

## 6. MVP Agent Set

Initial agents:

1. Requirement Agent
2. Meeting Agent
3. Elicitation Agent
4. Analysis / QA Agent

Later agents:

- Document Agent
- Traceability Agent
- Change Impact Agent
- API Agent
- Test Agent

Do not build all agents at once.

---

## 7. MVP Agent Capabilities

### Requirement Agent

- structure requirement drafts
- identify missing fields
- separate facts from assumptions
- draft acceptance criteria
- create open-question candidates

### Meeting Agent

- summarize meeting
- extract requirement candidates
- extract decision candidates
- extract question candidates
- preserve source references

### Elicitation Agent

- identify knowledge gaps
- generate stakeholder questions
- prioritize blocking questions

### Analysis / QA Agent

- identify ambiguity
- identify conflicts
- identify dependencies
- identify quality issues
- assess requirement readiness

---

## 8. Human Approval

The MVP must enforce:

AI cannot:

- approve requirement
- baseline requirement
- approve decision
- approve business rule

Those actions must be performed by an authorized human user.

---

## 9. Technical MVP Scope

Current technical architecture:

Frontend:
Next.js + React + TypeScript

Backend:
NestJS + TypeScript

Worker:
TypeScript

Workspace:
pnpm

Dev runner:
concurrently

Planned:

PostgreSQL
Prisma
pgvector
Redis
BullMQ
S3-compatible storage

The MVP should remain a modular monolith.

---

## 10. Explicitly Out of Scope

Do not build during the initial MVP unless later approved:

- microservices
- Kafka
- Kubernetes
- Neo4j
- Elasticsearch
- enterprise SSO
- complex RBAC
- billing
- subscriptions
- multi-region deployment
- full mobile application
- real-time collaborative document editing
- autonomous requirement approval
- fully autonomous BA workflows
- advanced analytics dashboards
- full BPMN editor
- full diagram editor
- advanced document template engine
- organization-wide cross-project AI reasoning

---

## 11. MVP Success Criteria

The MVP is successful when a BA can:

1. create a project
2. create or import a requirement
3. link requirement to a source
4. run AI analysis
5. receive useful findings
6. generate clarification questions
7. review and update the requirement
8. approve through human workflow
9. see basic traceability
10. understand which content came from AI and which was confirmed by humans

---

## 12. Non-Goals

The MVP does not aim to replace:

- Jira
- Confluence
- Google Drive
- Microsoft Word
- full project management software
- test management platforms
- source-control systems

It should focus on:

Business Analysis Intelligence
+
Structured Knowledge
+
Traceability
+
Human-Governed AI
