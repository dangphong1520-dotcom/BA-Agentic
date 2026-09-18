# Agent for BA — MVP v0.1

## Product hypothesis

An IT Business Analyst can turn raw meeting notes or an unstructured request
into a reviewable, source-linked requirement faster with AI, while retaining
human control over every approved statement.

## One journey to validate

```text
Raw notes or requirement
          ↓
      AI analysis
          ↓
Structured requirement proposal + findings + questions
          ↓
       BA review
   edit / reject / accept
          ↓
Approved requirement
          ↓
Traceable output with source and history
```

The first release succeeds only when this journey works end to end for a real
BA scenario. Existing modules support the journey; they are not separate goals.

## Primary user and trigger

The user is an IT Business Analyst. The trigger is receiving incomplete raw
information from a meeting, message, or manually entered request and needing to
turn it into a dependable requirement.

## Required behavior

1. The BA opens a project and adds raw text as a source.
2. The BA selects **Analyze source** without writing a prompt.
3. The system returns a structured proposal containing requirement fields,
   explicit uncertainty, findings, clarification questions, and source
   references.
4. The BA can inspect the supporting source, edit the proposal, accept it as a
   DRAFT requirement, or reject it.
5. Acceptance revalidates project scope and source references on the server.
6. The BA resolves questions and edits the requirement.
7. The BA explicitly sends it for review and approves it.
8. The final view shows status, source lineage, human approval, and complete
   version history.

## Acceptance criteria

- AI output never writes directly into approved project knowledge.
- Every proposed fact is source-linked or clearly marked as inference,
  assumption, or open question.
- Invalid structured output is rejected and remains visible as a failed run.
- A stale proposal cannot overwrite a newer requirement version.
- Repeating proposal acceptance cannot create duplicate changes.
- A BA can complete the journey locally from the UI without terminal work.
- The tested scenario and result are recorded as product-validation evidence.

## Reuse from the current product

- Workspace and project provide context and access boundaries.
- Source and source segments preserve evidence.
- Requirements provide structured content, lifecycle, approval, and history.
- Questions capture unresolved information.
- Business rules and decisions are referenced only when the proposal identifies
  a relevant candidate; their existing governance remains intact.

## Deferred until validation

- Multiple specialized agents and agent-to-agent handoffs
- Redis, BullMQ, pgvector, object storage, and distributed job infrastructure
- Document suites such as BRD, PRD, SRS, BPMN, and data models
- Enterprise authentication, organization administration, and deployment scale
- Broad knowledge search, meeting management, trace graphs, and integrations

Deferred items require evidence from the validated workflow or a new product
decision before implementation.

## Validation questions

- Did the proposal reduce the BA's time to a reviewable first draft?
- Did the BA understand which content came from the source and which came from
  AI reasoning?
- Were the generated questions useful in the next stakeholder conversation?
- Could the BA correct, reject, and approve content without losing history?
- What blocked completion of the journey?
