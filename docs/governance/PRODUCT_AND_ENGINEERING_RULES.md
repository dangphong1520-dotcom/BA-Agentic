# Product and engineering governance

## Human authority and knowledge classification

AI may analyze, summarize, create drafts, propose changes, generate questions,
and identify gaps, conflicts, risks, or dependencies. AI must not approve or
baseline requirements, approve business rules or decisions, release knowledge,
or silently modify approved data.

Use the classifications FACT, INFERENCE, ASSUMPTION, PROPOSAL, DECISION, and
OPEN_QUESTION. FACT requires evidence or approved project knowledge. Never
promote an inference or assumption to fact, or a proposal to decision, without
explicit human confirmation and evidence.

## Domain and traceability

Requirements are structured domain entities rather than document text. Preserve
their lifecycle, versions, source evidence, questions, rules, decisions, and
acceptance criteria. Invalid transitions must be rejected in the backend.

Trace relationships must be scoped to the same project. AI-suggested links are
proposals until confirmed. Semantic similarity alone is not evidence.

Approved or actively edited entities use optimistic concurrency. A proposal
created against version N must not overwrite version N+1.

## Application boundaries

The frontend presents data and captures interaction. It does not decide valid
state transitions, approval rights, baselines, trace governance, or AI write
permissions.

Backend flow is Controller → Application Service → Domain Rule → Repository.
Controllers remain thin. Agents and AI gateways call services rather than the
database or repositories directly.

Core entities use PostgreSQL relational models. JSON is reserved for bounded,
schema-validated payloads where flexibility is valuable. Shared contracts live
in `packages/contracts`; do not redefine enums or DTOs per application.

## Delivery and scope

Build from observed workflow needs. Preserve the modular monolith and avoid
infrastructure expansion until validation identifies a concrete latency,
reliability, retrieval, scale, or integration need.

Do not build a generic chatbot, use chat as the source of truth, create broad
runtime agent fleets, or add distributed infrastructure merely because it
appears in the target architecture.

## Quality and security

Use TypeScript strict mode and focused modules. Avoid `any`, unsafe casts,
duplicated contracts, giant controllers, hidden UI business logic, and direct
database access outside repositories.

Critical governance behavior requires integration tests: tenant boundaries,
state transitions, approvals, concurrency, proposal acceptance, and trace
validation. Never commit API keys, credentials, tokens, or private environment
files. Client-side checks never replace server authorization.
