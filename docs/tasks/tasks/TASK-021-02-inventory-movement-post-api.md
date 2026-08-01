# TASK-021-02: Inventory movement post and balance read API

## Metadata

- **Task ID:** TASK-021-02
- **Title:** Inventory movement post and balance read API
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Backend
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-021-01

## Superseded note

Runtime warehouse/inventory code is removed under [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md). This task remains **Done** as planning history only.

## Objective

Transactional commands to post inventory effects and read balances.
Negative balances are allowed ([ADR-027](../../decisions/ADR-027-allow-negative-stock-v1.md)).

## Scope

- Module e.g. `inventory` / `stock-movements`
- **Transfer** (AD-06 one-step): atomic TRANSFER_OUT + TRANSFER_IN equal qty; shared transferGroupId
- **Adjustment** (signed qty + mandatory reason); may result in balance &lt; 0
- **Write-off** (decrease + mandatory reason); may result in balance &lt; 0
- **Balances** list/get: filter by warehouseId, productId, pagination
- Optional movement history list (read-only)
- Active warehouse + active product required for posts
- Unit tests: reconciliation, transfer pairing, negative quantity allowed

## Out of scope

Stock count workflow (TASK-021-05); purchase/sale auto-posting; full BRD-OD-04
exception case lifecycle; costing; frontend.

## Acceptance criteria

- [x] Transfer leaves company-total quantity unchanged across the two warehouses
- [x] Posts that yield balance &lt; 0 are **accepted** (ADR-027; supersedes ADR-026 hard-block)
- [x] Past movements are never updated or deleted
- [x] Flat active-user authz only

## Evidence

- Module: `apps/api/src/inventory/`
- Routes: `POST /api/v1/inventory/transfers|adjustments|write-offs`; `GET .../balances`, `GET .../balances/:id`, `GET .../movements`
- `@CurrentUser()` + global JWT guard (ADR-025)
- Unit tests cover negative adjustment / write-off / transfer (ADR-027)
- Build + lint green

## Result

Done 2026-07-31; updated same day for ADR-027 (allow negative). Next: TASK-021-03.
