# TASK-015-02: Extend BusinessPartner e2e for update and deactivation

## Metadata

- **Task ID:** TASK-015-02
- **Title:** Extend BusinessPartner e2e for update and deactivation
- **Parent User Story:** [US-015](../stories/US-015-business-partner-update-deactivate-apis.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Type:** Test
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-015-01
- **Legacy reference:** Step 16.3 (coverage)

## Objective

Add HTTP-level integration coverage for BusinessPartner update and soft deactivation, consistent with Product e2e patterns.

## Scope

- Extend `apps/api/test/business-partners.e2e-spec.ts` (and mocks as needed) for:
  - PATCH happy path / partial update
  - PATCH empty body 400
  - PATCH with `code` 400
  - PATCH not found
  - DELETE deactivate + idempotent second DELETE
  - GET still returns inactive partner after deactivate
- Follow existing e2e style in `products.e2e-spec.ts` PATCH/DELETE describes

## Out of scope

- New product features
- Concurrency tests (already covered for codes under TECH-001)
- Frontend

## Acceptance criteria

- [x] E2E cases above exist and pass in the project’s e2e configuration
- [x] Coverage demonstrates `code` immutability and soft-delete (no hard delete)

## Implementation notes

Prefer extending the existing business-partners e2e file rather than creating a parallel suite.

## Documentation impact

None beyond task evidence.

## Testing expectations

- `yarn workspace api test:e2e` (or repo-equivalent) for the business-partners suite

## Validation expectations

E2E green for added cases.

## Risks

E2E may use mocked Prisma (as current products/partners e2e do) — still validate controller wiring and DTO rejection.

## Assumptions

TASK-015-01 endpoints and service behavior already implemented.

## Evidence

- `apps/api/test/business-partners.e2e-spec.ts` — PATCH / DELETE describes + inactive GET
- Prisma mock extended with `businessPartner.update` / `delete`
- Validation: `yarn workspace api test:e2e --testPathPatterns=business-partners` → 1 suite, 14 tests passed

## Result

Done. HTTP-level coverage for partial update, empty/`code` rejection, not-found, soft deactivate + idempotency, and inactive GET.

## Completion date

2026-07-29
