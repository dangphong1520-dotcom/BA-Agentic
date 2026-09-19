# BA Agent Platform — Codex Entry Point

## Mission

Build an AI-assisted workspace that helps an IT Business Analyst turn raw
project context into structured, traceable, human-governed requirements.

AI may analyze, draft, classify, find gaps, and propose changes. A human must
approve requirements, business rules, decisions, baselines, and any promotion
of uncertain content into trusted project knowledge.

## Read before changing code

1. Read `docs/README.md` to locate the authoritative context.
2. Read `docs/product/MVP_V0_1.md` and the relevant product workflow.
3. Read the relevant specification in `docs/specs/`.
4. Read the affected architecture or governance document only when needed.
5. Inspect the existing module and tests before editing.

Do not treat target architecture or the historical sprint list as build order.
The active order is defined in
`docs/architecture/WORKFLOW_FIRST_EXECUTION_MAP.md`.

## Delivery loop

For every substantial product change:

```text
Problem → workflow → small spec → plan → vertical slice
        → tests → local UI validation → review → commit → CI
```

Define the user trigger, observable result, acceptance criteria, and validation
route before implementation. Complete one end-to-end slice before adding
adjacent breadth.

## Product invariants

- Source-first, structured requirements, traceability-first.
- AI proposes; humans approve.
- FACT requires evidence or approved project knowledge.
- INFERENCE, ASSUMPTION, PROPOSAL, and OPEN_QUESTION stay explicit.
- Never invent evidence, rules, decisions, or confirmed trace links.
- Never silently modify approved knowledge or history.
- AI-created requirements start as DRAFT.
- Invalid lifecycle transitions and stale versions are rejected by the API.
- Workspace and project boundaries are enforced on the server.

Detailed rules: `docs/governance/PRODUCT_AND_ENGINEERING_RULES.md`.

## Repository map

- `apps/web`: Next.js presentation and interaction.
- `apps/api`: NestJS application/domain services and persistence.
- `apps/worker`: frozen scaffold until measured workflow evidence needs it.
- `packages/contracts`: shared Zod schemas, DTOs, enums, and types.
- `docs/product`: product truth and BA workflows.
- `docs/specs`: behavior to build.
- `docs/sprints`: delivered checkpoints.
- `docs/validation`: real workflow observations.
- `docs/architecture`: current and target technical direction.
- `docs/governance`: durable product and engineering rules.
- `docs/guides`: operating instructions for humans and Codex.

## Architecture boundaries

- Keep the modular monolith: Next.js → NestJS → PostgreSQL/Prisma.
- Controllers stay thin: Controller → Service → Repository.
- Frontend never owns lifecycle, authorization, approval, or trace governance.
- Agents and model gateways use application services, never repositories.
- Shared domain definitions live in `packages/contracts`.
- Do not add microservices, Redis/BullMQ, pgvector, object storage, RAG,
  enterprise auth, or runtime multi-agent orchestration without measured need
  and an explicit decision.

## Validation

Run checks appropriate to the change and finish with:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter api test:e2e
pnpm build
```

Exercise changed user behavior in the local UI. Review `git diff`, exclude
secrets and generated junk, then use a focused conventional commit.

## Completion standard

A task is done when contracts, server governance, UI behavior, tests,
documentation, and the stated acceptance criteria agree. Report what changed,
how it was validated, and any remaining product uncertainty.
