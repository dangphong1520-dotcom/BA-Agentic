# ADR-003 — Adopt workflow-first delivery

## Status

Accepted — 2026-09-18

## Context

The repository established a sound modular monolith, persistence model, and
several governed BA registers. Delivery then risked following the breadth of the
target architecture: more modules, infrastructure, and agent roles before a BA
had validated the central AI-assisted workflow.

The product hypothesis depends on the quality and trustworthiness of one journey:
raw input to AI analysis, human review, approved requirement, and traceable
output. Infrastructure has value only when it helps that journey.

## Decision

Adopt workflow-first delivery as the active build strategy.

- Keep the current Web, API, PostgreSQL, shared contracts, and governed domain
  modules.
- Build the MVP v0.1 journey as narrow vertical slices.
- Use `AGENTS.md`, the v0.1 scope, and a small specification as persistent Codex
  context for each task.
- Run, test, and review every slice through the actual local product.
- Record BA validation before expanding breadth or production infrastructure.
- Freeze Worker expansion, queues, vector search, object storage, broad document
  generation, and multi-agent orchestration until evidence justifies them.

## Consequences

The existing architecture is retained and becomes an upgrade path rather than a
sprint sequence. Some already-built registers will receive maintenance but no
new features during v0.1. The first AI runtime can be simpler than the final
runtime, provided persisted run state, structured output, validation, evidence,
and human authority are preserved.

Future infrastructure decisions must cite a workflow problem, validation result,
or measurable operating constraint.
