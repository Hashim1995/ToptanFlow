# TASK-007-01: Add Currency reference data module

## Metadata

- **Task ID:** TASK-007-01
- **Title:** Add Currency reference data module
- **Parent User Story:** [US-007](../stories/US-007-currency-reference-data.md)
- **Parent Epic:** [EPIC-004](../epics/EPIC-004-currency-unit-reference-data.md)
- **Status:** Done
- **Type:** API
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-005-01

## Objective

Implement Currency HTTP API module with tests and AZN default decision reflected in docs/invariants.

## Scope

apps/api/src/currencies; currency tests; invariants Currency section.

## Out of scope

FX valuation engine.

## Acceptance criteria

- [x] Currency API exists with tests
- [x] AZN default decision recorded

## Implementation notes

Commit 5a81437.

## Documentation impact

invariants.md Currency.

## Testing expectations

currencies.service.spec.ts; currencies.e2e-spec.ts.

## Validation expectations

API + docs alignment.

## Risks

FX opens remain.

## Assumptions

Approved Human Decision recorded 2026-07-28.

## Evidence

Commit 5a81437; apps/api/src/currencies; docs/business/invariants.md Currency.

## Result

Done.
## Completion date

2026-07-28 (commit 5a81437)
