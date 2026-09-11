# ADR-001 — Use Modular Monolith for MVP

## Status

Accepted

## Context

BA Agent Platform contains multiple business domains:

- workspace
- project
- requirements
- meetings
- decisions
- questions
- knowledge
- traceability
- AI agents

The platform may eventually grow into a larger SaaS product.

However, the current priority is to validate the BA workflow and AI-assisted requirement-analysis experience.

A microservice architecture would introduce:

- distributed deployment
- network boundaries
- service authentication
- distributed tracing
- event infrastructure
- operational overhead
- deployment complexity

before the product requires those capabilities.

---

## Decision

The MVP will use a Modular Monolith.

Primary deployment units:

- Web Application
- API Application
- Background Worker

The API will contain clearly separated domain modules.

Long-running tasks will be delegated to the Worker.

---

## Consequences

### Positive

- faster MVP development
- easier local development
- easier debugging
- simpler transactions
- simpler testing
- reduced infrastructure cost
- easier vibe coding
- clear upgrade path

### Negative

- modules share a deployment boundary
- poor module discipline could create coupling
- future service extraction may require refactoring

---

## Guardrails

Even within the monolith:

- maintain clear module boundaries
- avoid direct cross-module repository access
- prefer application/domain services
- avoid giant shared utility layers
- keep Agent Runtime separate from controllers
- keep background processing inside worker boundaries

---

## Future Review

Reconsider microservices only when concrete evidence exists, such as:

- independent scaling requirements
- independent deployment requirements
- strong team ownership boundaries
- high event volume
- external integration isolation
- reliability requirements demanding separate services

Do not introduce microservices only because the product is expected to grow.
