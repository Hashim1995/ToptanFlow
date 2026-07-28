# TASK-041-01: Add web Vitest harness and first pure helper tests

## Metadata

- **Task ID:** TASK-041-01
- **Title:** Add web Vitest harness and first pure helper tests
- **Parent User Story:** [US-041](../stories/US-041-quality-harness-expansion.md)
- **Parent Epic:** [EPIC-023](../epics/EPIC-023-testing-quality-infrastructure.md)
- **Status:** Done
- **Type:** Test / Frontend
- **Priority:** Medium
- **Estimate:** S
- **Dependencies:** US-037/038 Done; ADR-018

## Objective

Stand up Vitest for `apps/web` and lock in regression coverage for pure
master-data helpers already shipped (no new business behavior).

## Scope

- Add Vitest (and minimal config) to `apps/web`
- `yarn workspace web test` script
- Unit tests for:
  - `normalizeListQuery`
  - `mapApiError` (including soft-duplicate code message)
  - `productTypeLabel` / active-filter helper
  - product form decimal Zod boundary (ADR-023 shape only)
- Document evidence in this task

## Out of scope

- Component/browser E2E (Playwright/Cypress undecided)
- CI provider configuration
- Backend Jest changes
- New product features or Open Decision resolutions

## Acceptance criteria

- [x] Vitest runs successfully for `apps/web`
- [x] Listed pure helpers have focused unit tests
- [x] Build and lint still pass
- [x] No business rules invented beyond existing code

## Testing expectations

`yarn workspace web test`; `yarn workspace web build`; `yarn workspace web lint`.

## Evidence

- Vitest `3.2.4` + `vitest.config.ts` (node env; separate from app Vite config)
- `yarn workspace web test` — **14 passed** (4 files), confirmed 3× consecutive
- Suites: normalize-list-query, map-api-error, labels/active-filter, product.schemas
- `yarn workspace web build` — pass
- `yarn workspace web lint` — pass
- Note: Vitest 4.x showed intermittent suite-load failures under Yarn workspace
  on this machine; pinned to 3.2.4 for harness reliability (still ADR-018 Vitest)

## Result

Done. Web Vitest harness live with first pure-helper regression suite.
