# TASK-021-02: Inventory movement post and balance read API

## Metadata

- **Task ID:** TASK-021-02
- **Title:** Inventory movement post and balance read API
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Planned
- **Type:** Backend
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-021-01

## Objective

Transactional commands to post inventory effects and read balances without
allowing negative stock (ADR-026).

## Scope

- Module e.g. `inventory` / `stock-movements`
- **Transfer** (AD-06 one-step): atomic TRANSFER_OUT + TRANSFER_IN equal qty; shared transferGroupId
- **Adjustment** (signed qty + mandatory reason): block if result &lt; 0
- **Write-off** (decrease + mandatory reason): block if insufficient stock
- **Balances** list/get: filter by warehouseId, productId, pagination
- Optional movement history list (read-only)
- Active warehouse + active product required for posts
- Unit tests: sufficiency, reconciliation, transfer pairing

## Out of scope

Stock count workflow (TASK-021-05); purchase/sale auto-posting; negative-stock
exceptions; costing; frontend.

## Acceptance criteria

- [ ] Transfer leaves company-total quantity unchanged across the two warehouses
- [ ] Any post that would yield balance &lt; 0 is rejected
- [ ] Past movements are never updated or deleted
- [ ] Flat active-user authz only

## Result

(To be filled)
