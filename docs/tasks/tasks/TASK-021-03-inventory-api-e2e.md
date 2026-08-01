# TASK-021-03: Inventory API e2e

## Metadata

- **Task ID:** TASK-021-03
- **Title:** Inventory API e2e
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Test
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-021-02

## Superseded note

Runtime warehouse/inventory code is removed under [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md). This task remains **Done** as planning history only.

## Objective

Supertest regression for transfer, adjustment, write-off, balances, and auth.

## Scope

- Happy-path transfer; negative source balance allowed (ADR-027)
- Balance equals sum of movements for a product/warehouse
- 401 without Bearer token
- No internal leak payloads

## Acceptance criteria

- [x] E2e green with auth helper
- [x] Negative-balance post covered and **accepted** (ADR-027)

## Evidence

- `apps/api/test/inventory.e2e-spec.ts` — 9 passed
- Covers 401, adjustment, negative adjustment, transfer (company total), negative transfer, write-off, balance=sum(movements), 404, same-warehouse 400

## Result

Done 2026-07-31. Next: TASK-021-04 Inventory balances / transfer UI.
