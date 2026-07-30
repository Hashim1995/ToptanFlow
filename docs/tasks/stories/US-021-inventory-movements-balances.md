# US-021: Inventory movements and balances

- **ID:** US-021
- **Title:** Inventory movements and balances
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Ready
- **Priority:** High
- **Business actor:** Warehouse officer

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
- Hard-block balances &lt; 0 (BRD-OD-04 exceptions **out of scope**)

## High-level acceptance criteria

- Balance for each warehouse/product equals the sum of its movements
- Transfer does not change company-total quantity
- Movements are never edited or deleted in place
- Insufficient stock posts are rejected
- Azerbaijani UI for balances and posting actions
- No Yatı, purchase/sale auto-post, or costing engine in this story

## Dependencies

US-020 Done; ADR-026.

## Related domain rules

invariants Inventory; workflows Transfer, Stock Count, Write-Off.

## Related ADRs / docs

ADR-026; ADR-025; analysis AD-06, BRD-OD-04 (deferred exceptions).

## Known risks

Opening stock / purchase receipt not yet posting into ledger — operators may
need adjustment to establish initial qty until EPIC-009.

## Open questions

BRD-OD-04 negative-stock **exceptions** remain open (v1 = hard block only).

## Readiness checklist

- [x] Behavior for this slice traceable (ADR-026 + invariants)
- [x] Negative-stock exceptions not silently resolved (explicitly out of scope)
- [x] Dependencies satisfied (US-020 Done)
- [x] Acceptance criteria sufficient to elaborate tasks

## Task elaboration

- [TASK-021-01](../tasks/TASK-021-01-stock-movement-balance-persistence.md) — **Ready** (next)
- [TASK-021-02](../tasks/TASK-021-02-inventory-movement-post-api.md) — Planned
- [TASK-021-03](../tasks/TASK-021-03-inventory-api-e2e.md) — Planned
- [TASK-021-04](../tasks/TASK-021-04-inventory-balances-transfer-ui.md) — Planned
- [TASK-021-05](../tasks/TASK-021-05-stock-count-workflow.md) — Planned
