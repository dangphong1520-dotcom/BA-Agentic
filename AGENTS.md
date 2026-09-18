# BA Agent Platform — Coding Constitution

## 1. Product Vision

BA Agent Platform is an AI-assisted operating system for IT Business Analysts.

The platform transforms:
- meetings
- requirements
- business rules
- decisions
- documents
- project knowledge

into a structured, traceable, human-governed BA workspace.

The system must help Business Analysts:
- capture requirements
- analyze requirements
- identify gaps
- identify conflicts
- prepare elicitation questions
- manage decisions
- manage business rules
- preserve source evidence
- maintain traceability
- generate BA artifacts
- review AI proposals safely

AI supports the BA.
AI does not replace BA judgment.

---

## 2. Core Product Principles

Always preserve these principles:

1. Human-in-the-loop
2. Source-first
3. Structured requirements
4. Traceability-first
5. AI proposes, humans approve
6. Never convert assumptions into facts
7. Never invent business rules
8. Never silently resolve conflicts
9. Preserve history and versions
10. Approved knowledge must not be silently modified

---

## 3. Knowledge Classification

AI-generated knowledge must distinguish:

- FACT
- INFERENCE
- ASSUMPTION
- PROPOSAL
- DECISION
- OPEN_QUESTION

Rules:

- FACT requires supporting evidence or approved project knowledge.
- INFERENCE must never be presented as confirmed fact.
- ASSUMPTION must remain explicitly labeled until validated.
- PROPOSAL is not a decision.
- DECISION requires evidence of approval.
- OPEN_QUESTION represents unresolved information.

Never promote:
PROPOSAL -> DECISION
ASSUMPTION -> FACT
INFERENCE -> FACT

without explicit evidence or human confirmation.

---

## 4. Human Approval Rules

AI may:

- analyze
- summarize
- create drafts
- propose changes
- generate questions
- identify conflicts
- identify risks
- identify dependencies
- generate draft artifacts

AI must never directly:

- approve a requirement
- baseline a requirement
- approve a business rule
- approve a decision
- release a requirement
- delete approved project knowledge
- silently modify approved data

All AI-created requirements must begin as:

DRAFT

---

## 5. Architecture

The platform currently uses:

Frontend:
- Next.js
- React
- TypeScript

Backend:
- NestJS
- TypeScript
- ESM
- Vitest

Worker:
- TypeScript
- NodeNext

Workspace:
- pnpm workspaces
- concurrently

Planned infrastructure:
- PostgreSQL
- Prisma
- pgvector
- Redis
- BullMQ
- S3-compatible object storage

API style:
- REST

Realtime:
- Server-Sent Events where appropriate

Architecture style:
- Modular Monolith
- Background Worker
- Domain-oriented modules

Do not introduce microservices unless explicitly approved.

---

## 6. Repository Structure

Repository structure:

apps/
  web/
  api/
  worker/

packages/
  contracts/
  ui/
  config/
  utils/

docs/

Rules:

- apps/web contains frontend application code.
- apps/api contains backend API and domain application code.
- apps/worker contains asynchronous/background processing.
- packages/contracts contains shared DTOs, schemas, enums, and types.
- packages/ui contains reusable UI components.
- packages/config contains shared configuration.
- packages/utils contains reusable utilities.
- docs contains product and architecture documentation.

Do not create arbitrary top-level folders without approval.

---

## 7. Frontend Rules

Frontend must:

- focus on presentation and interaction
- use shared contracts where possible
- avoid duplicating backend business rules
- avoid direct database access
- avoid storing authoritative business logic in UI components

Frontend must not decide:

- valid requirement state transitions
- approval authorization
- baseline rules
- traceability governance
- AI write permissions

Those belong to backend/domain services.

---

## 8. Backend Rules

Controllers must remain thin.

Preferred flow:

Controller
-> Application Service
-> Domain Rules
-> Repository

Do not put complex business logic directly in controllers.

Agents must never access repositories directly.

Correct:

Agent
-> Agent Tool
-> Domain/Application Service
-> Repository

Incorrect:

Agent
-> Repository
-> Database

---

## 9. Requirement Rules

Requirements are structured domain entities.

Requirements are not merely document text.

Core concepts include:

- business goal
- actor
- trigger
- preconditions
- main flow
- alternative flow
- exception flow
- business rules
- constraints
- dependencies
- acceptance criteria
- sources
- open questions

Requirement lifecycle:

DRAFT
ANALYZING
CLARIFICATION_REQUIRED
READY_FOR_REVIEW
APPROVED
BASELINED
IMPLEMENTING
VERIFIED
RELEASED

Additional states may include:

REJECTED
DEPRECATED
CHANGED

Invalid state transitions must be rejected by backend logic.

---

## 10. Source-First Rules

Important conclusions should preserve source lineage.

Potential sources:

- meeting
- email
- chat
- document
- spreadsheet
- API documentation
- ticket
- screenshot
- voice transcript
- manual input

Where possible, trace knowledge to a specific source segment.

Example:

Meeting
-> Source
-> Source Segment
-> Requirement

Do not invent evidence references.

---

## 11. Traceability Rules

Traceability is a core capability.

Important entities may be linked through trace relationships.

Examples:

Source
-> Requirement

Requirement
-> Business Rule

Requirement
-> Decision

Requirement
-> Acceptance Criteria

Requirement
-> Document Section

Requirement
-> Test Case

AI-inferred trace links must initially be treated as proposals unless confirmed.

Do not silently create confirmed trace relationships from weak semantic similarity.

---

## 12. Agent Architecture

Planned core agents:

- Meeting Agent
- Requirement Agent
- Elicitation Agent
- Analysis Agent
- QA Agent
- Document Agent
- Traceability Agent

Agents must use:

- structured context
- explicit tools
- structured outputs
- validation
- human review

Agents must not rely only on free-form chat prompts.

---

## 13. Agent Output Rules

Agent outputs should be structured and schema-valid.

Prefer:

JSON / typed objects

over:

free-form markdown parsing

Agent output should support:

- findings
- proposals
- questions
- source references
- confidence
- recommended actions

Important agent outputs must be validated before persistence.

---

## 14. Agent Finding Types

Common finding types include:

- MISSING_INFORMATION
- AMBIGUITY
- CONFLICT
- DUPLICATE
- DEPENDENCY
- RISK
- TRACEABILITY_GAP
- QUALITY_ISSUE
- CHANGE_IMPACT
- RECOMMENDATION

Do not create new finding types casually.
Prefer existing domain vocabulary.

---

## 15. AI Proposal Rules

AI changes should normally be represented as proposals.

Typical flow:

AI analyzes
-> creates proposal
-> user reviews
-> user accepts / edits / rejects
-> backend validates
-> change is committed

AI must not directly overwrite approved entities.

---

## 16. Concurrency and Versioning

Approved or actively edited entities must support safe version handling.

When an AI proposal is generated against:

Requirement version 3

and the requirement later becomes:

version 4

the proposal must not be silently applied.

A version conflict must be surfaced.

---

## 17. Database Direction

The planned primary database is PostgreSQL.

Use relational modeling for core entities.

Use JSONB only where flexibility is valuable.

Planned vector search:
pgvector

Do not introduce MongoDB or a separate vector database without an explicit architectural decision.

---

## 18. Search Direction

Knowledge search may combine:

- relational filters
- keyword search
- full-text search
- vector similarity
- trace relationships

Do not treat vector similarity alone as authoritative evidence.

---

## 19. Background Processing

Long-running tasks belong in the worker.

Examples:

- document parsing
- embeddings
- meeting analysis
- agent workflows
- document generation
- notifications

Do not keep long AI or ingestion tasks inside a blocking HTTP request.

---

## 20. Coding Standards

Use TypeScript strict mode.

Avoid:

- any
- unsafe casts
- duplicated enums
- duplicated DTO definitions
- giant files
- giant controllers
- hidden business logic in UI
- direct database calls from agents

Prefer:

- small focused modules
- typed contracts
- reusable schemas
- explicit domain naming
- clear service boundaries

---

## 21. Shared Contracts

Shared domain contracts should live in:

packages/contracts

Examples:

- RequirementStatus
- RequirementType
- FindingType
- Severity
- AgentType
- TraceRelationship
- DTO schemas
- Zod schemas

Do not redefine the same enum independently in frontend and backend.

---

## 22. Testing Rules

Before completing implementation tasks:

- run typecheck
- run relevant unit tests
- run relevant integration tests
- run build where appropriate

Critical domain logic requires tests.

Examples:

- requirement state transitions
- authorization rules
- AI proposal acceptance
- version conflict handling
- traceability validation

Agent behavior should eventually use dedicated evaluation datasets.

---

## 23. Git Rules

Do not modify unrelated files without reason.

Keep commits focused.

Preferred commit patterns:

feat:
fix:
refactor:
test:
docs:
chore:

Before committing:

- inspect git diff
- ensure no secrets
- ensure no generated junk
- ensure typecheck passes

---

## 24. Security Rules

Never commit:

- API keys
- database passwords
- secrets
- private tokens

Environment-specific secrets belong in environment files or secret managers.

Never trust client-side authorization alone.

Backend must enforce permissions.

---

## 25. Multi-Tenancy Direction

The platform is designed for future multi-tenancy.

Important domain entities should ultimately be scoped by:

workspace
project

Do not design global project knowledge without tenant boundaries.

---

## 26. Forbidden Patterns

Do not:

- build a generic ChatGPT clone
- make chat the source of truth
- allow agents to approve requirements
- allow agents to baseline requirements
- store all business knowledge only as raw text
- bypass domain services
- directly couple UI to database structure
- silently overwrite historical knowledge
- silently resolve conflicts
- invent missing business rules
- treat semantic similarity as confirmed truth
- introduce major infrastructure without need

---

## 27. Product UX Direction

The platform should feel like:

a Business Analysis workspace with embedded AI

not:

a chatbot with project files attached

AI should appear contextually inside:

- Requirement workspace
- Meeting workspace
- Knowledge workspace
- Traceability workspace
- Document workspace

Prefer contextual actions such as:

- Analyze Requirement
- Find Missing Information
- Generate Questions
- Find Conflicts
- Analyze Impact
- Improve Acceptance Criteria

over requiring the user to manually write prompts.

---

## 28. MVP Scope Discipline

Do not over-engineer the MVP.

Current direction:

- modular monolith
- pnpm workspace
- Next.js
- NestJS
- TypeScript worker

Avoid adding:

- Kafka
- Kubernetes
- Neo4j
- Elasticsearch
- Temporal
- separate AI microservices

unless explicitly requested later.

### Current delivery mode

The active baseline is workflow-first delivery:

Problem
-> BA workflow
-> Small specification
-> Codex task
-> Working vertical slice
-> BA validation
-> Iterate
-> Productionize only after validation

Do not select work merely because it appears next in the target architecture.
Each sprint must improve the validated MVP v0.1 journey documented in
`docs/product/MVP_V0_1.md` or remove a blocker to that journey.

Keep the existing modular monolith, PostgreSQL, API, and Web applications.
Freeze new Worker, Redis/BullMQ, pgvector, object-storage, multi-agent,
enterprise-authentication, and deployment work until the vertical slice proves
that it needs them. A frozen component may remain in the repository; do not
expand it without a measured workflow need.

For each substantial product change, define the user trigger, observable
before/after behavior, acceptance criteria, and validation route before coding.
Prefer one end-to-end slice over several disconnected modules.

---

## 29. Before Coding

Before implementing a substantial task:

1. Read this AGENTS.md.
2. Inspect the relevant existing module.
3. Inspect related architecture documentation.
4. Identify files to modify.
5. Produce a short implementation plan.
6. Avoid unrelated refactoring.
7. Implement incrementally.
8. Run validation/tests.
9. Review against acceptance criteria.

---

## 30. Highest-Level Rule

When there is uncertainty:

Do not guess silently.

Surface the uncertainty.

For business knowledge:
ask or create an open question.

For code:
inspect the repository and existing architecture first.

Human decisions remain authoritative.
