# EPIC-008: Inventory and warehouses

- **ID:** EPIC-008
- **Title:** Inventory and warehouses
- **Status:** Planned

## Business objective

Immutable stock movements, warehouses, balances, transfers, counts, adjustments.

## User / business value

Stock truth before safe purchase receipt and sale issue.

## Scope

Warehouse master; movement ledger; balances; negative-stock cases once decided.

## Exclusions

Costing engine (EPIC-013); Yatı vehicle warehouse orchestration (EPIC-014).

## Dependencies

EPIC-005; EPIC-007 recommended before production posting; BRD-OD-02/04.

## Related ADRs / docs

invariants Inventory; inventory workflows; analysis M3.

## Child user stories

- US-020
- US-021

## Completion definition

Posted inventory effects auditable and reconcilable to movements.

## Known risks

Warehouses absent from schema; negative stock policy open.

## Open questions

BRD-OD-02/04; AD-05/06.

## Repository evidence

Schema deliberately excludes warehouses/stock movements.
