# US-007: Currency reference data module

- **ID:** US-007
- **Title:** Currency reference data module
- **Parent Epic:** [EPIC-004](../epics/EPIC-004-currency-unit-reference-data.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Operations / master-data maintainer

## Statement

As an operations user, I want currencies managed via API, so that partners and documents can reference approved currencies with AZN default rules.

## Business value

Required for BusinessPartner defaultCurrency and money fields.

## High-level scope

Currency create/list/get/update/deactivate APIs + tests; AZN default decision recorded in invariants.

## High-level acceptance criteria

- Currency REST API available
- AZN default decision documented

## Dependencies

US-005.

## Related domain rules

invariants Currency.

## Related ADRs / docs

Approved Human Decision 2026-07-28; ADR-023.

## Known risks

FX engine not included.

## Open questions

OD-12 remaining.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-007-01-add-currency-reference-module](../tasks/TASK-007-01-add-currency-reference-module.md)
