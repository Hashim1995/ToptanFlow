# TASK-020-02: Warehouse persistence model and migration

## Metadata

- **Task ID:** TASK-020-02
- **Title:** Warehouse persistence model and migration
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Database
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-020-01; ADR-026; ADR-024 sequence pattern

## Superseded note

Runtime warehouse/inventory code is removed under [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md). This task remains **Done** as planning history only.

## Objective

Add `Warehouse` to PostgreSQL via Prisma Migrate; seed one GENERAL warehouse;
register `WAREHOUSE` number sequence.

## Scope

- `WarehouseKind` enum: `GENERAL` | `DAMAGED`
- Model fields: `id`, `code`, `name`, `kind`, `isActive`, `createdAt`, `updatedAt`
- Unique `code`; indexes on `isActive` / `kind`
- Migration + seed default `Əsas anbar` (GENERAL) when table empty
- `NumberSequence` key `WAREHOUSE`
- Schema header updated for ADR-026

## Out of scope

StockMovement / StockBalance (US-021); API; UI; VEHICLE kind.

## Acceptance criteria

- [x] Migration applies cleanly on empty and existing DB
- [x] Seed creates exactly one GENERAL warehouse when none exist (skips if any warehouse exists)
- [x] `code` allocated via sequence pattern (seed + future API use `WAREHOUSE` key)

## Evidence

- Migration: `apps/api/prisma/migrations/20260731080000_add_warehouse/`
- Schema: `Warehouse` + `WarehouseKind`
- Seed: default warehouse `Əsas anbar` code `0000001`
- `BusinessCodeSequenceKey.WAREHOUSE` + unit tests (9 passed in number-sequences)

## Result

Done 2026-07-31. Next: TASK-020-03 Warehouse CRUD API.
