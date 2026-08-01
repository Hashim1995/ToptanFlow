# TASK-021-04: Inventory UI — balances, transfer, adjustment

## Metadata

- **Task ID:** TASK-021-04
- **Title:** Inventory UI — balances, transfer, adjustment
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-021-02

## Superseded note

Runtime warehouse/inventory code is removed under [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md). This task remains **Done** as planning history only.

## Objective

Operator screens to view stock by warehouse and post transfers / adjustments /
write-offs (Azerbaijani, responsive).

## Scope

- Nav under inventory (e.g. **Stok qalıqları**, **Anbar transferi**)
- Balance list with warehouse/product filters
- Transfer form: from/to warehouse, product, qty, reason/note as required by API
- Adjustment and write-off forms with mandatory reason
- Empty/loading/error/success states; decimal input sanitization
- Route + shell wiring

## Out of scope

Stock count UI (TASK-021-05); purchase/sale documents; Yatı.

## Acceptance criteria

- [x] Balances and transfer/adjustment/write-off usable end-to-end against API
- [x] No raw enum/API leakage
- [x] `web` build + lint green

## Evidence

- `apps/web/src/features/inventory/` — API, hooks, schemas, modals, pages
- Routes: `/inventory/balances`, `/inventory/transfer`
- Shell group **Inventar**; home shortcuts
- `yarn workspace web` lint, test (44), build — green

## Result

Done 2026-07-31. Next: TASK-021-05 Stock count workflow (or close US-021 if count deferred separately).
