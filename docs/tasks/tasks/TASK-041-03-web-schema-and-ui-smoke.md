# TASK-041-03: Expand web schema tests and UI smoke harness

## Metadata

- **Task ID:** TASK-041-03
- **Title:** Expand web schema tests and UI smoke harness
- **Parent User Story:** [US-041](../stories/US-041-quality-harness-expansion.md)
- **Parent Epic:** [EPIC-023](../epics/EPIC-023-testing-quality-infrastructure.md)
- **Status:** Done
- **Type:** Test / Frontend
- **Priority:** Medium
- **Estimate:** S
- **Dependencies:** TASK-041-01, TASK-041-02

## Objective

Grow the web Vitest harness with remaining master-data Zod schema coverage and
a minimal Testing Library smoke path for two UX-kit primitives (ADR-018), then
close US-041 if acceptance criteria are met.

## Scope

- Vitest unit tests for `businessPartnerFormSchema` and reference-data schemas
  (currency / unit / productCategory)
- Add `@testing-library/react` + `jsdom` for `*.tsx` tests only
- Smoke tests: `ActiveStatusTag`, `DecimalInput` (AZ labels; decimal sanitization on type)
- Update CURRENT / US-041 status honestly

## Out of scope

- Full page/component suite for all master-data screens
- Browser E2E (Playwright/Cypress still undecided)
- CI provider wiring
- New product features

## Acceptance criteria

- [ ] Partner + reference Zod schemas have focused unit tests
- [ ] ActiveStatusTag and DecimalInput smoke tests pass under jsdom
- [ ] `yarn workspace web test` / lint / build green
- [ ] US-041 closed or next gap stated honestly
- [ ] No Open Decisions silently resolved

## Testing expectations

`yarn workspace web test`; `yarn workspace web lint`; `yarn workspace web build`.

## Evidence

- `yarn workspace web test` → 9 files, 33 tests passed
- `yarn workspace web lint` → clean
- `yarn workspace web build` → tsc -b + vite build clean
- jsdom 24.1.3 pinned for Node 20 compatibility
- `tsconfig.app.json` exclude expanded for test files on Windows
- Ant Design components mocked in .tsx smoke tests (avoids jsdom hangs)

## Result

Done. Partner/reference Zod schemas tested; ActiveStatusTag and DecimalInput smoke tests pass under jsdom with mocked Ant Design. US-041 acceptance criteria met.
