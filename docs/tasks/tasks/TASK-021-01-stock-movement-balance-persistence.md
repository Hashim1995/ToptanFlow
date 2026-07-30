# TASK-021-01: Stock movement and balance persistence

## Metadata

- **Task ID:** TASK-021-01
- **Title:** Stock movement and balance persistence
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Ready
- **Type:** Database
- **Priority:** High
- **Estimate:** L
- **Dependencies:** US-020 Done (Warehouse exists); ADR-026

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

- [ ] Movements are insert-only at schema/service contract level
- [ ] Balance row is the operational cache; must stay reconcilable to movements
- [ ] Migration applies cleanly

## Result

(To be filled)
