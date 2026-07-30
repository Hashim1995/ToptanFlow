# EPIC-008: Inventory and warehouses

- **ID:** EPIC-008
- **Title:** Inventory and warehouses
- **Status:** In Progress

## Business objective

Immutable stock movements, warehouses, balances, transfers, counts, adjustments.

## User / business value

Stock truth before safe purchase receipt and sale issue.

## Scope

- Warehouse master (US-020)
- Movement ledger, balances, one-step transfers, adjustments, write-offs, stock count (US-021)
- Quantity-only; hard-block negative balances in v1 ([ADR-026](../../decisions/ADR-026-initial-warehouses-v1.md))

## Exclusions

- Costing engine (EPIC-013)
- Yatı / vehicle warehouses (EPIC-014)
- Purchase/sale posting into inventory (EPIC-009 / EPIC-010)
- Controlled negative-stock exception cases (BRD-OD-04) — deferred; v1 hard-blocks only
- Damaged goods-receipt destination policy (AD-05) — purchasing epic

## Dependencies

EPIC-005 Done; EPIC-007 Done; ADR-026.

## Related ADRs / docs

invariants Inventory; workflow-map Inventory; ADR-026; ADR-024; ADR-025.

## Child user stories

- [US-020](../stories/US-020-warehouse-master-data.md) — **Done**
- [US-021](../stories/US-021-inventory-movements-balances.md) — **Ready** (next TASK-021-01)

## Completion definition

Warehouse master operable; posted inventory effects auditable and reconcilable to movements for in-module operations.

## Known risks

Initial stock may require adjustments until purchase posting exists.

## Open questions

BRD-OD-04 exception policy; AD-05 (purchase). AD-06 accepted for v1 one-step transfers (ADR-026).

## Repository evidence

ADR-026 accepted; Warehouse master (DB + API + Anbarlar UI) Done. Stock movements still absent (US-021).

## 2026-07-31 activation

Owner: inventory module only. Tasks TASK-020-01..05 and TASK-021-01..05 elaborated.
