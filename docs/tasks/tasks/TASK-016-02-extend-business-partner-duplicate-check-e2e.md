# TASK-016-02: Extend BusinessPartner e2e for soft-duplicate create/update

## Metadata

- **Task ID:** TASK-016-02
- **Title:** Extend BusinessPartner e2e for soft-duplicate create/update
- **Parent User Story:** [US-016](../stories/US-016-business-partner-duplicate-soft-flag.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Type:** Test
- **Priority:** Medium
- **Estimate:** S
- **Dependencies:** TASK-016-01

## Objective

HTTP-level coverage for soft duplicate 409 + acknowledge on create/update (no separate duplicate-check route).

## Scope

Extend `apps/api/test/business-partners.e2e-spec.ts`:

- POST create → 409 with candidates when match; create succeeds with `acknowledgeDuplicate: true`
- PATCH identity field → 409; succeeds with acknowledge
- Confirm `POST /duplicate-check` is not exposed (404)
- Create still works when no candidates

Also: preserve `code` / `candidates` through `AllExceptionsFilter` so HTTP clients receive the soft-flag payload.

## Out of scope

- Frontend
- Merge tooling
- Fuzzy matching

## Acceptance criteria

- [x] E2E cases above pass
- [x] Coverage shows soft flag (409 + ack), not hard unique on phone/tax
- [x] No reliance on a dedicated duplicate-check endpoint

## Implementation notes

Mock `businessPartner.findMany` for candidate rows. Default `findMany` → `[]` in e2e `beforeEach` so existing create/PATCH tests stay green.

## Documentation impact

Optional `code` / `candidates` on `ApiErrorResponse` documented in interface comments.

## Testing expectations

`yarn workspace api test:e2e --testPathPatterns=business-partners`

## Validation expectations

E2E green.

## Risks

Conflict response body shape under Nest exception filter — addressed by filter passthrough.

## Assumptions

TASK-016-01 create/update behavior already implemented.

## Evidence

- `apps/api/test/business-partners.e2e-spec.ts` — soft duplicate describe
- `apps/api/src/common/filters/all-exceptions.filter.ts` — preserves `code` / `candidates`
- `apps/api/src/common/interfaces/api-error-response.interface.ts`
- Validation: e2e 19 passed; unit all-exceptions+business-partners 60 passed

## Result

Done. Soft-duplicate create/update covered at HTTP level; filter preserves structured 409 payload. US-016 complete.

## Completion date

2026-07-29
