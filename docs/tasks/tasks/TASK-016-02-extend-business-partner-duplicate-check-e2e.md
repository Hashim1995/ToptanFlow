# TASK-016-02: Extend BusinessPartner e2e for soft-duplicate create/update

## Metadata

- **Task ID:** TASK-016-02
- **Title:** Extend BusinessPartner e2e for soft-duplicate create/update
- **Parent User Story:** [US-016](../stories/US-016-business-partner-duplicate-soft-flag.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Ready
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
- Confirm `POST /duplicate-check` is not exposed (404) — optional smoke
- Create still works when no candidates

## Out of scope

- Frontend
- Merge tooling
- Fuzzy matching

## Acceptance criteria

- [ ] E2E cases above pass
- [ ] Coverage shows soft flag (409 + ack), not hard unique on phone/tax
- [ ] No reliance on a dedicated duplicate-check endpoint

## Implementation notes

Mock `businessPartner.findMany` for candidate rows consistent with service narrowing.

## Documentation impact

None beyond task evidence.

## Testing expectations

`yarn workspace api test:e2e --testPathPatterns=business-partners`

## Validation expectations

E2E green.

## Risks

Conflict response body shape under Nest exception filter.

## Assumptions

TASK-016-01 create/update behavior already implemented.

## Evidence

(To be filled when Done.)

## Result

(To be filled when Done.)
