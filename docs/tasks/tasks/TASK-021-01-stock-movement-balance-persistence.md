# TASK-021-01: Stock movement and balance persistence

## Metadata

- **Task ID:** TASK-021-01
- **Title:** Stock movement and balance persistence
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Database
- **Priority:** High
- **Estimate:** L
- **Dependencies:** US-020 Done (Warehouse exists); ADR-026

## Superseded note

Runtime warehouse/inventory code is removed under [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md). This task remains **Done** as planning history only.

## Objective

Add append-only stock movements and maintained balances so inventory reconciles
to the movement ledger (invariants Inventory).

## Scope

- `StockMovement`: warehouseId, productId, quantity (signed decimal or direction + abs),
  `kind` (`TRANSFER_OUT` | `TRANSFER_IN` | `ADJUSTMENT` | `WRITE_OFF` | `COUNT_VARIANCE`),
  `reason` (required where business requires), optional `transferGroupId` to pair transfer legs,
  optional `sourceDocumentType` / `sourceDocumentId` (nullable for in-module posts),
  `createdByUserId`, `createdAt`; **no updatedAt mutation path**
- `StockBalance`: warehouseId, productId, quantity; unique `(warehouseId, productId)`
- FKs to Warehouse, Product, User
- Migration only; no purchase/sale posting integration

## Out of scope

Negative-stock case entity; cost fields as authoritative valuation; VEHICLE warehouses;
API posting logic (TASK-021-02).

## Acceptance criteria

- [x] Movements are insert-only at schema/service contract level
- [x] Balance row is the operational cache; must stay reconcilable to movements
- [x] Migration applies cleanly

## Evidence

- Schema: `StockMovementKind`, `StockMovement` (no `updatedAt`), `StockBalance` unique `(warehouseId, productId)`
- Migration: `apps/api/prisma/migrations/20260731090000_add_stock_movement_balance/`
- Applied on `toptanflow_dev`; `prisma migrate status` up to date
- Quantity signed `Decimal(18, 4)` (ADR-023); FKs Restrict to Warehouse / Product / User

## Result

Done 2026-07-31. Next: TASK-021-02 Inventory movement post API.
