# BA Agent Platform — System Architecture

## 1. Architecture Goal

The system should be easy to develop as an MVP while preserving clear boundaries for future scale.

The current architecture is:

Modular Monolith
+
Background Worker
+
AI Agent Runtime

Do not introduce microservices during the MVP unless explicitly approved.

---

## 2. High-Level Architecture

User
→ Next.js Web
→ NestJS API
→ Domain / Application Services
→ PostgreSQL

Long-running processing:

NestJS API
→ Queue
→ Worker
→ Agent Runtime / Ingestion / Background Jobs

AI flow:

UI Action
→ API
→ Agent Runtime
→ Context Builder
→ LLM Gateway
→ Tool Executor
→ Structured Output
→ Validation
→ Human Review
→ Domain Commit

---

## 3. Current Repository

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
  product/
  architecture/
  decisions/

---

## 4. Web Application

Technology:

- Next.js
- React
- TypeScript

Responsibilities:

- presentation
- navigation
- forms
- user interaction
- contextual AI actions
- visualization of findings
- visualization of proposals
- visualization of traceability

The web application must not become the authoritative business-rule layer.

---

## 5. API Application

Technology:

- NestJS
- TypeScript
- ESM
- Vitest

Responsibilities:

- REST APIs
- authorization
- domain rules
- requirement lifecycle
- validation
- persistence orchestration
- AI Agent run creation
- human approval operations

Controllers should remain thin.

Preferred direction:

Controller
→ Application Service
→ Domain Policy
→ Repository

---

## 6. Worker

Technology:

- TypeScript
- NodeNext

Future responsibilities:

- source parsing
- embeddings
- agent runs
- meeting analysis
- document generation
- queue consumers
- notification jobs

Long-running AI tasks should not block HTTP requests.

---

## 7. Database

Planned:

PostgreSQL

ORM:

Prisma

PostgreSQL is the primary system of record.

Use relational modeling for core entities.

Use JSONB selectively for flexible structures.

---

## 8. Vector Search

Planned:

pgvector

Use cases:

- source semantic search
- relevant context retrieval
- related requirement discovery

Vector similarity must not be treated as authoritative evidence.

---

## 9. Cache and Queue

Planned:

Redis

BullMQ

Redis may support:

- queues
- short-lived cache
- rate limiting
- temporary workflow state

Redis must not become the authoritative project knowledge store.

---

## 10. Object Storage

Planned:

S3-compatible object storage

Possible implementations:

- AWS S3
- Cloudflare R2
- MinIO

Store large files outside PostgreSQL.

Database should store metadata and storage references.

---

## 11. API Style

REST is the primary MVP API style.

Base direction:

/api/v1

Examples:

/api/v1/projects
/api/v1/requirements
/api/v1/meetings
/api/v1/agent-runs

Do not introduce GraphQL without a clear product need.

---

## 12. Realtime

Use Server-Sent Events where useful for:

- AI Agent progress
- document ingestion progress
- long-running analysis

WebSocket is not required for the initial MVP.

---

## 13. Agent Runtime

The Agent Runtime should contain:

- Agent Registry
- Orchestrator
- Context Builder
- Tool Registry
- LLM Gateway
- Output Validator
- Agent Run Service

Agents should not directly access the database.

---

## 14. Agent Tool Flow

Correct:

Agent
→ Tool
→ Domain/Application Service
→ Repository
→ Database

Incorrect:

Agent
→ Repository

or:

Agent
→ Database

---

## 15. Context Engine

The Context Engine should retrieve task-relevant information.

Potential context:

- current project
- target requirement
- source evidence
- related requirements
- business rules
- decisions
- open questions
- dependencies
- recent changes
- project glossary

Do not send the complete project database to the model.

---

## 16. LLM Gateway

LLM access should be centralized.

Responsibilities:

- provider adapter
- model selection
- structured output
- retry
- token usage
- logging
- cost measurement
- error normalization

Agents should not call provider SDKs directly.

---

## 17. Provider Independence

The architecture should allow model providers to change.

Possible future adapters:

- OpenAI
- Anthropic
- Google
- local model

Domain code must not depend directly on a provider-specific response type.

---

## 18. Shared Contracts

packages/contracts should contain shared domain contracts.

Examples:

- enums
- DTOs
- API contracts
- Zod schemas
- finding types
- requirement statuses

Avoid duplicating domain enums in multiple applications.

---

## 19. Security Boundary

Important requests must be scoped by:

- user
- workspace
- project

Future multi-tenancy requires strict tenant boundaries.

Agent tools must receive scoped context.

---

## 20. Background Job Direction

Potential job queues:

- source-ingestion
- embedding
- agent-run
- document-generation
- notification

Do not create a single giant worker function handling every job type.

---

## 21. Domain Events

The architecture may use domain events such as:

RequirementCreated
RequirementUpdated
RequirementApproved
RequirementBaselined
MeetingCompleted
QuestionAnswered
DecisionApproved
SourceIndexed

Initial implementation may remain simple.

---

## 22. Event Delivery

Future direction:

PostgreSQL Outbox
→ Worker / Queue

Kafka is not required for the MVP.

---

## 23. Search

Search may combine:

- SQL filtering
- full-text search
- keyword search
- vector search
- trace relationships

Search architecture should remain inside a Knowledge/Search service boundary.

---

## 24. Observability

The system should eventually record:

- request id
- correlation id
- user id
- workspace id
- project id
- Agent Run id
- model profile
- prompt version
- latency
- tool usage
- token usage
- errors

Do not log secrets.

---

## 25. Deployment Direction

MVP deployment units:

Web
API
Worker

Managed infrastructure may provide:

PostgreSQL
Redis
Object Storage

Kubernetes is explicitly unnecessary for MVP.

---

## 26. Architecture Upgrade Path

Possible later upgrades:

BullMQ
→ Temporal

PostgreSQL Search
→ OpenSearch

PostgreSQL Trace Links
→ Graph Database

Modular Monolith
→ selected microservices

These are upgrade paths, not current requirements.

---

## 27. Current Local Development

Current local baseline:

Web:
localhost:3000

API:
localhost:3001

Worker:
background process

Workspace:
pnpm

Local runner:
concurrently

Command:

pnpm dev

Turborepo was removed from the MVP local workflow due to Windows runtime issues.

---

## 28. Architecture Rule

Prefer the simplest architecture that preserves:

- domain boundaries
- traceability
- human governance
- testability
- future evolution

Do not add infrastructure because it is fashionable.
