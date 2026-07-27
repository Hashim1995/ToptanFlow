# ADR-018: Testing Strategy — Vitest, Jest, Supertest

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Vitest is used for frontend testing, Jest is used for backend testing, and Supertest is used for backend integration testing. This closes the "testing frameworks" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It supports, and does not replace, the test-adequacy expectations already established in `agents/code-reviewer.md` and `agents/qa-engineer.md`.

## Decision

- Vitest is the testing framework for the frontend application (`apps/web/`), consistent with its Vite-based build (ADR-013).
- Jest is the testing framework for backend unit tests (`apps/api/`), consistent with NestJS's standard testing approach (ADR-007).
- Supertest is used for backend integration tests, exercising REST endpoints (ADR-015) end to end at the HTTP layer.
- Unit and integration testing responsibilities remain separate: unit tests (Vitest, Jest) verify isolated logic; integration tests (Supertest) verify the backend's actual HTTP behavior, including validation, permissions, and business effects as required by the task under test.
- Test requirements per task remain defined by the Task Planner (`agents/task-planner.md`) and `docs/tasks/TASK-TEMPLATE.md` ("Test Requirements"); this ADR selects the tools, not what must be tested for a given task.

## Consequences

- Frontend Engineer tasks (`agents/frontend-engineer.md`) add or update Vitest tests as required by the task.
- Backend Engineer tasks (`agents/backend-engineer.md`) add or update Jest unit tests and Supertest integration tests as required by the task.
- QA Engineer verification (`agents/qa-engineer.md`) may reference these test suites as evidence but independently verifies behavior against acceptance criteria; passing tests alone do not substitute for QA verdict.
- This ADR removes "testing frameworks" from the Known Open Decisions in `docs/technical/system-architecture.md`.
- Exact test-organization conventions (file naming, directory placement) remain implementation details for future tasks, per `docs/technical/repository-structure.md` ("Test Locations").

## Alternatives Considered

- **Jest for both frontend and backend:** Rejected. Not the approved technology for the frontend; Vitest is explicitly approved for the Vite-based frontend.
- **Cypress or Playwright as the sole testing tool:** Rejected as a replacement for unit/integration testing. Not the approved technology for this purpose; end-to-end browser testing tooling is not decided by this ADR.
- **No formal testing framework (manual verification only):** Rejected. Conflicts with `agents/qa-engineer.md` and `agents/code-reviewer.md`, which require test adequacy and reproducible verification for a business-critical ERP system.
