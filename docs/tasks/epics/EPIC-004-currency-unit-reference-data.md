# EPIC-004: Currency and unit reference data

- **ID:** EPIC-004
- **Title:** Currency and unit reference data
- **Status:** Done

## Business objective

Backend reference-data APIs for Units and Currencies.

## User / business value

Prerequisites for Product and BusinessPartner.

## Scope

units + currencies modules; create/list/get/update/deactivate; tests.

## Exclusions

Full FX gain/loss engine; UI screens.

## Dependencies

EPIC-002, EPIC-003.

## Related ADRs / docs

invariants Currency; ADR-023; Approved Human Decision 2026-07-28 (AZN default).

## Child user stories

- US-006
- US-007
- US-008

## Completion definition

Unit and Currency HTTP APIs and tests exist.

## Known risks

Remaining FX policy open decisions.

## Open questions

OD-12 FX gains/losses; money-account native non-AZN balance questions.

## Repository evidence

Commits 0b263e5, 5a81437, cd0e169; apps/api/src/{units,currencies}.
