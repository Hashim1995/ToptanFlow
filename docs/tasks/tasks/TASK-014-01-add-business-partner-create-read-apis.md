# TASK-014-01: Add BusinessPartner create and read APIs

## Metadata

- **Task ID:** TASK-014-01
- **Title:** Add BusinessPartner create and read APIs
- **Parent User Story:** [US-014](../stories/US-014-business-partner-create-read-apis.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Type:** API
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-013-01; TECH-001 for final code allocation
- **Legacy reference:** Step 16.2

## Objective

Implement BusinessPartner create/list/get APIs with role flags and defaultCurrency.

## Scope

business-partners module; DTOs; service; unit tests; e2e added with TECH-001.

## Out of scope

Update/deactivate (US-015 / Step 16.3).

## Acceptance criteria

- [x] Create/read endpoints exist
- [x] At least one role required
- [x] code backend-generated (ADR-024)

## Implementation notes

Commit bf0f1dc; code generation finalized in c3619ba.

## Documentation impact

OpenAPI notes; invariants partner code.

## Testing expectations

business-partners.service.spec.ts; business-partners.e2e-spec.ts.

## Validation expectations

Create/read + validation + code allocation.

## Risks

Update not included.

## Assumptions

Currency must exist and be active.

## Evidence

Commits bf0f1dc, c3619ba; apps/api/src/business-partners; apps/api/test/business-partners.e2e-spec.ts.

## Result

Done.
## Completion date

2026-07-28 (commits bf0f1dc, c3619ba)
