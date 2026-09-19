# SPEC-011 — Intelligent Design Gateway

## Trigger

A Design Studio generation is requested while `OPENAI_API_KEY` is configured.

## Observable result

The gateway calls the OpenAI Responses API with strict structured output and
validates the result with the shared Design Studio contract.

## Acceptance criteria

- The model and profile are recorded on every artifact.
- Invalid, unavailable, or unconfigured model output falls back to the local
  deterministic generator and is labelled honestly.
- Model output remains a proposal and cannot bypass human review.
- The API key never reaches the browser or persisted artifact.
