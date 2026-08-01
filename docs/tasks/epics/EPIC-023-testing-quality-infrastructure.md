# EPIC-023: Testing and quality infrastructure

- **ID:** EPIC-023
- **Title:** Testing and quality infrastructure
- **Status:** In Progress

## Business objective

Sustainable unit/e2e/concurrency testing aligned with ADR-018.

## User / business value

Regression safety for money/stock correctness.

## Scope

Jest/Supertest patterns; e2e; concurrency harness; later Vitest for web.

## Exclusions

Claiming full business E2E coverage prematurely.

## Dependencies

EPIC-002; grows with domain epics.

## Related ADRs / docs

ADR-018.

## Child user stories

- US-041

## Completion definition

Done domain stories carry documented test evidence; concurrency where required.

## Known risks

CI topology not fully documented.

## Open questions

CI provider/pipeline details.

## Repository evidence

apps/api unit + e2e + test:concurrency present.
apps/web Vitest harness present (TASK-041-01; pure helper suite).
