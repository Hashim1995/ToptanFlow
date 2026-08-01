# US-007: Currency reference data module

- **ID:** US-007
- **Title:** Currency reference data module
- **Parent Epic:** [EPIC-004](../epics/EPIC-004-currency-unit-reference-data.md)
- **Status:** Cancelled
- **Priority:** —
- **Business actor:** Operations / master-data maintainer

## Cancellation note (2026-07-31)

**Cancelled / superseded** by
[ADR-031](../../decisions/ADR-031-currency-reserved-for-future-cash.md) and
[CHANGE-003](../unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md).
Currency is not current master data. Static AZN for all current monetary
amounts; Currency may return only under future Cash. Historical delivery
(TASK-007-01) is superseded for runtime — do not extend Currency CRUD.

## Statement (historical)

As an operations user, I want currencies managed via API, so that partners and
documents can reference approved currencies with AZN default rules.

## Business value (historical)

Was required for BusinessPartner defaultCurrency and money fields — withdrawn.

## High-level scope (historical)

Currency create/list/get/update/deactivate APIs + tests; AZN default decision.

## High-level acceptance criteria (historical)

- Currency REST API available
- AZN default decision documented

## Dependencies

US-005.

## Related domain rules

Superseded: invariants Currency as active CRUD.

## Related ADRs / docs

ADR-031; CHANGE-003; ADR-023 (decimal precision still applies to AZN amounts).

## Known risks

None for cancelled story — do not reimplement without a new decision.

## Open questions

Future Cash Currency ownership only (ADR-031).

## Readiness checklist

- [x] Story Cancelled under ADR-031 — no further implementation

## Task elaboration

Historical:
- [TASK-007-01-add-currency-reference-module](../tasks/TASK-007-01-add-currency-reference-module.md) (Done historically; runtime superseded)
