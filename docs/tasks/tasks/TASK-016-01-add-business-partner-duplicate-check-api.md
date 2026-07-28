# TASK-016-01: Add BusinessPartner soft-duplicate checks on create/update

## Metadata

- **Task ID:** TASK-016-01
- **Title:** Add BusinessPartner soft-duplicate checks on create/update
- **Parent User Story:** [US-016](../stories/US-016-business-partner-duplicate-soft-flag.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Type:** API
- **Priority:** Medium
- **Estimate:** M
- **Dependencies:** US-014 Done; US-015 Done

## Objective

Enforce US-016 soft duplicate flagging inside create/update APIs (no separate suggestion endpoint). Identity remains uuid + code.

## Scope

- Normalize-and-match on name / phone / taxNumber
- Create: 409 + candidates unless `acknowledgeDuplicate: true`
- Update: same when those fields change; exclude self
- Remove standalone `POST .../duplicate-check` if present
- Unit tests

## Out of scope

- E2E (TASK-016-02)
- Fuzzy matching; email/address keys; merge (BRD-CA-20); frontend UI
- Hard unique on phone/tax

## Acceptance criteria

- [x] No separate duplicate-check HTTP route
- [x] Create without ack → 409 when matches; with ack → 201 path proceeds
- [x] Update identity-helper change without ack → 409; with ack → proceeds
- [x] Update non-identity fields skips soft check
- [x] Inactive included; self excluded on update
- [x] Unit tests cover above

## Implementation notes

Revised 2026-07-29 from standalone suggestion endpoint to create/update 409+ack per owner decision.

## Documentation impact

OpenAPI Conflict notes on create/update; US-016 dispositions updated.

## Testing expectations

`yarn workspace api test --testPathPatterns=business-partners`

## Validation expectations

Unit suite green.

## Risks

Conflict body shape must remain stable for future frontend handling.

## Assumptions

Operator may intentionally create similar-named distinct partners via acknowledge.

## Evidence

- `business-partners.service.ts` (`assertNoUnacknowledgedDuplicates`)
- `create-business-partner.dto.ts` / `update-business-partner.dto.ts` (`acknowledgeDuplicate`)
- `business-partners.controller.ts` (no `duplicate-check` route)
- `business-partners.service.spec.ts` soft-duplicate suite
- Validation: 3 suites, 56 tests passed

## Result

Done (revised design). Soft flag on create/update with acknowledge; no standalone API.

## Completion date

2026-07-29
