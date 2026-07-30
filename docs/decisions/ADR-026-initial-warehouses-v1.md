# ADR-026: Initial Warehouses and Inventory Module Scope (v1)

## Status

Accepted

## Context

BRD-OD-02 (initial warehouses at go-live) blocked [US-020](../tasks/stories/US-020-warehouse-master-data.md)
and [EPIC-008](../tasks/epics/EPIC-008-inventory-warehouses.md). Analysis recommended
“at least one warehouse with future multi-warehouse support” but that was only a
safe default until Approved Human Decision.

On 2026-07-31 the repository owner directed inventory-module planning only
(Yatı and other epics deferred) and authorized BA/planner elaboration from
reference documents. This ADR records the v1 warehouse topology and inventory
scope used to unlock EPIC-008 implementation tasks.

## Business Decision

- Go-live operates with **one seeded GENERAL warehouse** (display name e.g.
  `Əsas anbar`).
- The data model **supports multiple warehouses** from day one (create more via
  master-data UI/API).
- **Vehicle warehouses** and Yatı orchestration remain **out of scope**
  ([EPIC-014](../tasks/epics/EPIC-014-field-sales-yati.md)); no `VEHICLE` warehouse
  kind in v1 inventory schema.
- **Damaged** stock locations may exist as warehouse kind `DAMAGED` for inventory
  write-off / damaged holding; none are required at seed. Damaged **goods-receipt
  posting** policy remains AD-05 (purchase epic), not resolved here.
- Inventory transfers for v1 are **one-step** (analysis AD-06 recommendation
  accepted for inventory module only): atomic paired issue + receipt; no
  in-transit staging.
- **Negative inventory exceptions** (BRD-OD-04) remain open; v1 inventory posting
  **hard-blocks** any movement that would make a warehouse/product balance &lt; 0.
  Controlled negative-stock cases are **not** implemented in this epic slice.
- Costing method (BRD-OD-06 / EPIC-013) is **not** decided here; movements track
  **quantity** only.

## Decision

### Warehouse master (US-020)

- Prisma `Warehouse`: `id` (UUID), `code` (backend-generated), `name`, `kind`
  (`GENERAL` | `DAMAGED`), `isActive`, timestamps.
- Soft-deactivate / reactivate parity with other master data.
- Business `code` allocated via existing `NumberSequence` infrastructure with
  key `WAREHOUSE`, same formatting rules as [ADR-024](ADR-024-automatic-business-code-generation.md)
  (seven-digit zero-padded, immutable, no reuse). This **extends** ADR-024’s
  sequence pattern to Warehouse without changing Product/BusinessPartner rules.

### Inventory ledger (US-021)

- Append-only `StockMovement` + maintained `StockBalance` unique on
  `(warehouseId, productId)`, always reconcilable to the sum of movements
  (invariants Inventory).
- v1 movement kinds implemented in-module: transfer out/in, adjustment,
  write-off, count variance. Purchase/sale movement kinds wait those epics.
- Authz: any **active** authenticated user (ADR-025).

## Consequences

- BRD-OD-02 is **resolved for v1 go-live topology** by this ADR.
- BRD-OD-04, AD-05, costing, Yatı vehicle warehouses remain open/deferred.
- Implementation tasks: TASK-020-* then TASK-021-* under EPIC-008.

## References

- `docs/analysis/01-document-analysis.md` — BRD-OD-02, AD-05, AD-06
- `docs/business/invariants.md` — Inventory
- `docs/business/terminology.md` — Warehouse, Inventory Transfer, Stock Count
- `docs/business/workflow-map.md` — Inventory workflows 8, 9, 37
- ADR-024, ADR-025
