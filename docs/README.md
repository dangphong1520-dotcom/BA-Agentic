# Documentation map

This file is the navigation layer for people and Codex. Read only the sections
needed for the current task; do not load every document into context.

## Start here

1. `../AGENTS.md` — compact repository instructions and completion standard.
2. `product/MVP_V0_1.md` — the currently validated product journey.
3. `architecture/WORKFLOW_FIRST_EXECUTION_MAP.md` — active delivery order.
4. The relevant file in `specs/` — behavior and acceptance criteria.

## Directory ownership

| Directory | Authoritative for | Use it when |
|---|---|---|
| `product/` | vision, MVP boundary, BA workflow | deciding what outcome matters |
| `governance/` | AI safety, human authority, coding rules | checking what must never be bypassed |
| `architecture/` | system boundaries and target direction | changing module boundaries or infrastructure |
| `decisions/` | accepted architectural decisions | understanding why a constraint exists |
| `specs/` | trigger, result, and acceptance criteria | planning or implementing a product slice |
| `sprints/` | completed delivery checkpoints | auditing what was shipped |
| `validation/` | real BA journey observations | selecting the next product change |
| `guides/` | repeatable operating procedures | running Codex, local services, Git, or CI |

## Current state

The validated core journey is:

```text
Raw source → analysis → proposal review → DRAFT requirement
           → clarification → readiness → human approval → traceable output
```

Sprints 01–17 are recorded in `sprints/`. The latest delivered capabilities are
the project Findings Register, Traceability View, and Readiness Portfolio.

## Document rules

- Product intent belongs in `product/`, not in architecture files.
- A new feature starts with one `SPEC-NNN-*` file.
- A completed delivery gets one `SPRINT-NN-*` checkpoint.
- Validation evidence is recorded separately from implementation claims.
- Target architecture is guidance; it does not authorize the next feature.
- Avoid duplicate truth. Link to the authoritative file instead.
