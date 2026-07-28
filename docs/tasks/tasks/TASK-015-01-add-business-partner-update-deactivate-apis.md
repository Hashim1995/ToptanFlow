# TASK-015-01: Add BusinessPartner update and deactivation APIs

## Metadata

- **Task ID:** TASK-015-01
- **Title:** Add BusinessPartner update and deactivation APIs
- **Parent User Story:** [US-015](../stories/US-015-business-partner-update-deactivate-apis.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Type:** API
- **Priority:** High
- **Estimate:** M
- **Dependencies:** US-014 Done; TECH-001 Done
- **Legacy reference:** Step 16.3

## Objective

Deliver BusinessPartner partial update and soft deactivation on the backend, matching Product lifecycle rules and ADR-024 code immutability.

## Scope

- Add `UpdateBusinessPartnerDto` **without** `code` and **without** `isActive`
- Optional updatable fields (partial): `name`, `isCustomer`, `isSupplier`, `defaultCurrencyId`, `phone`, `email`, `taxNumber`, `address`, `notes` (nullable clears where create already allows null)
- `PATCH :id` on `BusinessPartnersController` → service `update`
- `DELETE :id` soft deactivate → service `deactivate` (`isActive = false`, idempotent)
- Service rules aligned with Product / create:
  - reject empty PATCH body
  - trim/normalize text like create
  - after applying role changes, at least one role must remain true
  - `defaultCurrencyId` must exist and be active when provided
  - allow updating inactive partners; do not reactivate
  - never map or accept `code`
- Unit tests in `business-partners.service.spec.ts` and DTO spec for update DTO
- OpenAPI annotations on new endpoints; remove “Step 16.3 not in this task” wording from create docs once implemented

Expected touch paths (guidance, not an exclusive lock list beyond AGENTS scope rules):

- `apps/api/src/business-partners/**`
- related unit specs under that module

## Out of scope

- Reactivation API
- Hard delete
- Duplicate soft-flag checks (US-016)
- Partner statement (US-017)
- Enforcing inactive partners on Sale/Purchase create (no such APIs yet)
- Frontend UI
- Schema/migration changes
- E2E suite expansion (TASK-015-02)

## Acceptance criteria

- [x] `PATCH /api/v1/business-partners/:id` applies partial updates and returns `BusinessPartnerResponseDto`
- [x] Empty update body → 400
- [x] Unknown id → 404
- [x] Both roles false after update → 400
- [x] Inactive / missing currency on `defaultCurrencyId` → 400 / 404 as for create
- [x] Body including `code` → 400 (whitelist) — DTO omits `code`; unit-tested at DTO/service; HTTP rejection covered by global pipe (e2e in TASK-015-02)
- [x] `code` unchanged after successful update
- [x] `DELETE /api/v1/business-partners/:id` sets `isActive` false when active; idempotent when already inactive; never deletes the row
- [x] Inactive partner remains readable via existing GET
- [x] Unit tests cover update/deactivate happy paths and the failure cases above
- [x] Create-endpoint docs no longer claim Step 16.3 is unimplemented

## Implementation notes

Mirrored `ProductsService.update` / `deactivate` and `UpdateProductDto` patterns. Role partial updates merge with existing row before `assertAtLeastOneRole`.

## Documentation impact

- OpenAPI on PATCH/DELETE
- Create DTO/controller wording updated for immutable code
- Planning evidence updated

## Testing expectations

- Unit: `business-partners.service.spec.ts` update/deactivate cases
- Unit: `update-business-partner.dto.spec.ts`
- E2E: deferred to TASK-015-02

## Validation expectations

- `yarn test --testPathPatterns=business-partners` — passed

## Risks

- Partial role updates are easy to get wrong if only one flag is sent — must merge with existing row (covered by unit test)

## Assumptions

- Product PATCH/DELETE semantics are the approved parity target for this master-data slice
- Auth remains out of band (consistent with existing partner/product APIs)

## Evidence

- `apps/api/src/business-partners/dto/update-business-partner.dto.ts`
- `apps/api/src/business-partners/dto/update-business-partner.dto.spec.ts`
- `apps/api/src/business-partners/business-partners.service.ts` (`update`, `deactivate`)
- `apps/api/src/business-partners/business-partners.controller.ts` (`PATCH`, `DELETE`)
- `apps/api/src/business-partners/business-partners.service.spec.ts` (update/deactivate suites)
- Create docs: `create-business-partner.dto.ts`, create `@ApiOperation` no longer says Step 16.3 unimplemented
- Unit validation: `yarn test --testPathPatterns=business-partners` → 3 suites, 50 tests passed

## Result

Done. BusinessPartner update and soft deactivation APIs implemented with unit coverage. E2E remains TASK-015-02.

## Completion date

2026-07-28
