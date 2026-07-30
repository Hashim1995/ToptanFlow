# TASK-021-04: Inventory UI — balances, transfer, adjustment

## Metadata

- **Task ID:** TASK-021-04
- **Title:** Inventory UI — balances, transfer, adjustment
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Planned
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-021-02

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

- [ ] Balances and transfer/adjustment/write-off usable end-to-end against API
- [ ] No raw enum/API leakage
- [ ] `web` build + lint green

## Result

(To be filled)
