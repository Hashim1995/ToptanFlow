# TASK-021-05: Stock count workflow

## Metadata

- **Task ID:** TASK-021-05
- **Title:** Stock count workflow
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Cancelled
- **Type:** Full-stack
- **Priority:** Medium
- **Estimate:** L
- **Dependencies:** TASK-021-02; TASK-021-04 recommended first

## Cancellation (2026-07-31)

**Cancelled / abandoned** under [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md) / [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md). Warehouse stock-count workflow will not be implemented; product quantity adjustments belong to the Products domain.

## Objective

Physical stock count that posts variances as immutable movements with mandatory
reasons (workflow Stock Count; invariants Inventory).

## Scope

- Count document or session: warehouse, lines (product, system qty snapshot, counted qty)
- Post variances → `COUNT_VARIANCE` movements; update balances transactionally
- Every variance requires a stated reason
- No separate manager role (ADR-025): any active user may post; reason mandatory
- UI for create/count/post + list

## Out of scope

Materiality thresholds requiring a distinct approver role (open until roles exist);
negative-stock exceptions; Yatı reconciliation.

## Acceptance criteria

- [ ] Posted count changes stock only via movements
- [ ] Variance without reason rejected
- [ ] API + UI + tests for happy path and validation

## Result

**Cancelled** 2026-07-31 — not started; superseded by ADR-029 / CHANGE-002.
