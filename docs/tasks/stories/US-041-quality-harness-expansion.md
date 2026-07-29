# US-041: Expand automated quality harness

- **ID:** US-041
- **Title:** Expand automated quality harness
- **Parent Epic:** [EPIC-023](../epics/EPIC-023-testing-quality-infrastructure.md)
- **Status:** Done
- **Priority:** Medium
- **Business actor:** N/A (quality enabler)

## Statement

Technical enabler: keep unit/e2e/concurrency harnesses current as modules grow.

## Business value

Regression safety.

## High-level scope

Continue ADR-018 practices; add web Vitest now that UI screens exist; keep
backend Jest/Supertest patterns current without claiming full business E2E.

## High-level acceptance criteria

- `apps/web` has a runnable Vitest harness (ADR-018)
- First focused unit tests cover pure master-data helpers already in use
  (query normalize, API error mapping, label helpers) — no invented business rules
- `yarn workspace web test` (or documented equivalent) passes with build/lint
- Must not resolve Open Decisions silently

## Dependencies

Ongoing with domain work; UI foundation (US-037/038) now available for Vitest.

## Related domain rules

ADR-018.

## Related ADRs / docs

apps/api test scripts; `docs/technical/repository-structure.md` test locations.

## Known risks

CI provider/pipeline details remain open (EPIC-023); local scripts are enough
for this slice.

## Open questions

| Question | Disposition |
| --- | --- |
| Browser E2E tool? | Out of scope for this story slice; ADR-018 does not select Playwright/Cypress. |
| CI provider? | Open on EPIC-023; do not invent pipeline here. |

## Readiness checklist

- [x] Technical enabler traceable to ADR-018 / EPIC-023
- [x] No unresolved Open Decision is silently resolved
- [x] US-037/038 provide concrete pure helpers to test
- [x] Acceptance criteria sufficient to implement incrementally

## Task elaboration

Elaborated:

- [TASK-041-01](../tasks/TASK-041-01-add-web-vitest-harness.md) — **Done** (Vitest + first pure helper tests)
- [TASK-041-02](../tasks/TASK-041-02-reactivation-and-helper-regressions.md) — **Done** (reactivation e2e + helper regressions after CHANGE-001)
- [TASK-041-03](../tasks/TASK-041-03-web-schema-and-ui-smoke.md) — **Done** (schema Vitest + UI smoke)
- Further CI wiring deferred (EPIC-023 open).
