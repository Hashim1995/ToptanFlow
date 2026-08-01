# EPIC-004: Currency and unit reference data

- **ID:** EPIC-004
- **Title:** Currency and unit reference data
- **Status:** Done (Units); Currency portion **Cancelled / superseded**

## Supersession note (2026-07-31)

Currency reference CRUD is **not** current master data.
[ADR-031](../../decisions/ADR-031-currency-reserved-for-future-cash.md) /
[CHANGE-003](../unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md):
static AZN now; Currency reserved for future Cash only.
[US-007](../stories/US-007-currency-reference-data.md) **Cancelled**.
Unit reference data (US-006 / US-008) remains valid and delivered.

## Business objective

Backend reference-data APIs for Units (and historically Currencies).

## User / business value

Units remain prerequisites for Product. Currency is no longer a current-domain
prerequisite.

## Scope

- **Active / Done:** units module; create/list/get/update/deactivate; tests.
- **Cancelled:** currencies module (runtime removal under CHANGE-003).

## Exclusions

Full FX gain/loss engine; Currency as Product/Partner/Purchase/Sale property.

## Dependencies

EPIC-002, EPIC-003.

## Related ADRs / docs

ADR-023; ADR-031 (supersedes 2026-07-28 multi-currency decision for active
scope); CHANGE-003.

## Child user stories

- US-006 (Units — Done)
- US-007 (Currency — **Cancelled**, ADR-031)
- US-008 (Units — Done)

## Completion definition

Unit HTTP APIs and tests exist. Currency APIs are removed / not current.

## Known risks

Do not reintroduce Currency CRUD without a new Approved Human Decision.

## Open questions

Future Cash multi-currency design (documentation only until Cash work activates).

## Repository evidence

Historical: commits 0b263e5, 5a81437, cd0e169; units remain under
`apps/api/src/units`. Currencies removed under CHANGE-003.
