# US-021: Inventory movements and balances

- **ID:** US-021
- **Title:** Inventory movements and balances
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Cancelled
- **Priority:** High
- **Business actor:** Warehouse officer

## Cancellation (2026-07-31)

**Superseded by [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md) / [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md).** Warehouse-scoped movements/balances withdrawn; product quantity lives in Products. [TASK-021-05](../tasks/TASK-021-05-stock-count-workflow.md) **abandoned** (Cancelled). Done tasks remain historical; runtime inventory code removed under CHANGE-002.

## Statement

As a warehouse officer, I want immutable stock movements and visible balances, so
that inventory is auditable.

## Business value

Stock truth for purchasing/sales posting.

## High-level scope

- Append-only movement ledger + maintained balances
- One-step warehouse transfer (ADR-026 / AD-06)
- Adjustment and write-off with mandatory reason
- Stock count workflow (TASK-021-05)
- Hard-block balances &lt; 0 removed — negative quantities allowed ([ADR-027](../../decisions/ADR-027-allow-negative-stock-v1.md))

## High-level acceptance criteria

- Balance for each warehouse/product equals the sum of its movements
- Transfer does not change company-total quantity
- Movements are never edited or deleted in place
- Insufficient stock posts are **not** rejected solely for going negative (ADR-027)
- Azerbaijani UI for balances and posting actions
- No Yatı, purchase/sale auto-post, or costing engine in this story

## Dependencies

US-020 Done; ADR-026.

## Related domain rules

invariants Inventory; workflows Transfer, Stock Count, Write-Off.

## Related ADRs / docs

ADR-026; ADR-027; ADR-025; analysis AD-06, BRD-OD-04 (partial).

## Known risks

Opening stock / purchase receipt not yet posting into ledger — operators may
need adjustment to establish initial qty until EPIC-009.

## Open questions

BRD-OD-04 remaining controls (limits/case/cost clearance) open; negative qty allowed (ADR-027).

## Readiness checklist

- [x] Behavior for this slice traceable (ADR-026 + invariants)
- [x] Negative-stock **hard-block** not used (ADR-027); full exception case not silently invented
- [x] Dependencies satisfied (US-020 Done)
- [x] Acceptance criteria sufficient to elaborate tasks

## Task elaboration

- [TASK-021-01](../tasks/TASK-021-01-stock-movement-balance-persistence.md) — **Done**
- [TASK-021-02](../tasks/TASK-021-02-inventory-movement-post-api.md) — **Done**
- [TASK-021-03](../tasks/TASK-021-03-inventory-api-e2e.md) — **Done**
- [TASK-021-04](../tasks/TASK-021-04-inventory-balances-transfer-ui.md) — **Done**
- [TASK-021-05](../tasks/TASK-021-05-stock-count-workflow.md) — **Cancelled** (abandoned under ADR-029 / CHANGE-002)

## Result

**Cancelled** 2026-07-31 under ADR-029 / CHANGE-002. TASK-021-01..04 remain historically Done; TASK-021-05 abandoned. Do not resume warehouse inventory work.
