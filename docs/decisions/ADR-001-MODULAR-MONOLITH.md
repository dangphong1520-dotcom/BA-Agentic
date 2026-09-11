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

---

## Alternatives and Scope Clarification

| Alternative | Assessment for the MVP |
| --- | --- |
| Modular monolith with background Worker | Selected: centralized domain ownership with asynchronous execution |
| Microservices per domain | Deferred: deployment and distributed consistency costs precede demonstrated need |
| All processing inside API requests | Not selected for long-running ingestion/AI work because requests would depend on task completion |

Separate Web, API, and Worker processes do not imply independent domain microservices. The API owns domain/application boundaries; Worker tools invoke governed application services. No cross-module repository access or duplicate Worker business rules are permitted.

PostgreSQL/Prisma, Redis/BullMQ, and object storage are planned components, not proof of installed services. This ADR preserves the existing Accepted modular-monolith decision; it does not approve a specific hosting provider, authentication product, or Worker-to-service transport.

## Implementation Consequences

- Introduce modules with the selected MVP feature slice, not one module for every future entity immediately.
- Keep model-provider types behind the LLM Gateway and shared contracts free of persistence dependencies.
- Use transactional domain changes and explicit expected versions for human proposal acceptance.
- Define recoverable dispatch and idempotent execution before relying on background jobs; the outbox remains a future implementation option.
- Preserve API/Worker permission checks and source lineage despite separate process boundaries.

Review extraction into a service only with measured operational or team-boundary evidence. Record any new decision in a subsequent ADR rather than rewriting the history of this decision.

## Related Documents

- [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)
- [Domain Model](../architecture/DOMAIN_MODEL.md)
- [AI Agent Architecture](../architecture/AI_AGENT_ARCHITECTURE.md)
