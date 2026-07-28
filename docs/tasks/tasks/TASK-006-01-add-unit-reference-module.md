# TASK-006-01: Add Unit reference data module

## Metadata

- **Task ID:** TASK-006-01
- **Title:** Add Unit reference data module
- **Parent User Story:** [US-006](../stories/US-006-unit-reference-data.md)
- **Parent Epic:** [EPIC-004](../epics/EPIC-004-currency-unit-reference-data.md)
- **Status:** Done
- **Type:** API
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-005-01

## Objective

Implement Unit HTTP API module with tests.

## Scope

apps/api/src/units; units e2e/unit tests.

## Out of scope

UI; unit conversion engine beyond approved scope.

## Acceptance criteria

- [x] Unit CRUD/deactivate API exists with tests

## Implementation notes

Commit 0b263e5.

## Documentation impact

None required beyond code.

## Testing expectations

units.service.spec.ts; units.e2e-spec.ts.

## Validation expectations

API behaviors covered by tests.

## Risks

None.

## Assumptions

None.

## Evidence

Commit 0b263e5; apps/api/src/units; apps/api/test/units.e2e-spec.ts.

## Result

Done.
## Completion date

2026-07-28 (commit 0b263e5)
