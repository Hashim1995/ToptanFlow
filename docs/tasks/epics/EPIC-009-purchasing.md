# EPIC-009: Purchasing

- **ID:** EPIC-009
- **Title:** Purchasing
- **Status:** Review

## Business objective

Purchase draft/post/cancel with product-quantity and signed partner debt
effects. Completing (posting) a purchase must never directly mutate cash
([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md)).
Partner obligation uses one signed debt balance
([ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md)),
not a separate payable balance. Amounts are AZN-only
([ADR-031](../../decisions/ADR-031-currency-reserved-for-future-cash.md)).
No Warehouse module ([ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md)).

## User / business value

Goods receipt and supplier obligations (signed partner balance) via a
list-based Purchase document module.

## Scope

- Purchase APIs and UI: Draft CRUD; post; cancel.
- Product quantity ↑ on post; partner debt ↓ on post; auditable reversals on cancel.
- Backend-generated document numbers (`PUR-` + NumberSequence `PURCHASE`).
- Purchase Returns: **deferred** (not in US-022 activation).

Optional same-flow UI action that also creates a **separate** Cash Out +
allocation is coordination with EPIC-011 / EPIC-012 — not in US-022.

## Exclusions

Purchase Returns (this activation). Unresolved fixed-asset non-stock purchase
edge cases. Direct cash balance updates on the Purchase record (forbidden by
ADR-028). Currency selectors / FX (ADR-031). Separate payable-only primary
balance (superseded by ADR-030). Warehouse fields (ADR-029). Granular
purchase permissions beyond ADR-025 flat JWT users.

## Dependencies

EPIC-005 (Products incl. quantity per ADR-029 / CHANGE-002), EPIC-006;
CHANGE-003 / ADR-030 partner debt balance. **EPIC-008 Cancelled** — do not
depend on warehouses. Currency CRUD not a dependency (ADR-031).

## ADR-029 / ADR-030 / ADR-031 posting notes

- Posted purchase quantity effects adjust **`Product.currentQuantity`**
  (and product quantity history). **No `warehouseId`** on purchase lines.
- Posted purchase decreases the signed partner debt balance
  (`partnerBalance -= purchaseAmount` per ADR-030).
- All amounts AZN-only; no currency / FX columns.
- Lifecycle: `DRAFT` → `POSTED` → `CANCELLED` (`DocumentStatus`).

## Related ADRs / docs

invariants Purchasing; purchase workflows 5 & 35; analysis M4 / §5.5; ADR-028;
ADR-029; ADR-030; ADR-031; CHANGE-002; CHANGE-003.

## Child user stories

- US-022 (In Progress)

## Completion definition

Posted purchases produce durable quantity and signed partner-debt effects under
immutability rules and never mutate money-account balances as an intrinsic
purchase effect. Cancel creates reversing history. Draft CRUD has no ledger
effects. List-based UI is usable end-to-end for draft/post/cancel.

## Known risks

Transport capitalization and return-credit classification open (do not block
core draft/post/cancel).

## Open questions

OD-03; AD-09. Cash-separation rule itself is decided (ADR-028). Signed-balance
rule is decided (ADR-030).

## Repository evidence

Purchase models + Nest purchasing module (US-022 tasks).
