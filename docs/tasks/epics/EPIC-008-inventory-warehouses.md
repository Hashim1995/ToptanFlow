# EPIC-008: Inventory and warehouses

- **ID:** EPIC-008
- **Title:** Inventory and warehouses
- **Status:** Cancelled

## Cancellation (2026-07-31)

**Superseded by [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md) / [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md)** (owner decision 2026-07-31).

- Separate Warehouse / Stock module withdrawn.
- Product quantity moves to the **Products** domain (`Product.currentQuantity` + product quantity history).
- Do not implement further EPIC-008 work (including TASK-021-05).
- Historical Done tasks under US-020 / US-021 remain as planning history; runtime warehouse/inventory code is removed under CHANGE-002.

## Business objective (historical)

Immutable stock movements, warehouses, balances, transfers, counts, adjustments.

## User / business value (historical)

Stock truth before safe purchase receipt and sale issue.

## Scope (historical — withdrawn)

- Warehouse master (US-020)
- Movement ledger, balances, one-step transfers, adjustments, write-offs, stock count (US-021)
- Quantity-only; negative balances allowed in v1 (ADR-027; superseded for module scope by ADR-029)

## Exclusions (historical)

- Costing engine (EPIC-013)
- Yatı / vehicle warehouses (EPIC-014) — vehicle-warehouse model also withdrawn pending redesign under ADR-029
- Purchase/sale posting into inventory (EPIC-009 / EPIC-010) — retarget to product quantity
- Controlled negative-stock exception cases — see ADR-029 product-level rules

## Dependencies (historical)

EPIC-005 Done; EPIC-007 Done; ADR-026 (superseded by ADR-029 for warehouse topology).

## Related ADRs / docs

ADR-029 (authoritative); ADR-026 superseded; ADR-027 intent re-homed to product quantity; CHANGE-002.

## Child user stories

- [US-020](../stories/US-020-warehouse-master-data.md) — **Cancelled** (was Done; superseded ADR-029)
- [US-021](../stories/US-021-inventory-movements-balances.md) — **Cancelled** (superseded; TASK-021-05 abandoned)

## Completion definition

N/A — epic cancelled. Product quantity capability delivered under Products / CHANGE-002, not this epic.

## Known risks

N/A for cancelled epic.

## Open questions

N/A for cancelled epic. Remaining quantity rules: ADR-029.

## Repository evidence

Prior warehouse/inventory delivery (US-020 / US-021 tasks) is historical. CHANGE-002 removes runtime Warehouse/Stock modules.

## 2026-07-31 activation (historical)

Owner initially activated inventory module only. Later same day superseded by ADR-029 / CHANGE-002.
