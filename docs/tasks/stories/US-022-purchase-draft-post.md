# US-022: Purchase draft to posted purchase

- **ID:** US-022
- **Title:** Purchase draft to posted purchase
- **Parent Epic:** [EPIC-009](../epics/EPIC-009-purchasing.md)
- **Status:** Review
- **Priority:** High
- **Business actor:** Purchasing Officer

## Statement

As a purchasing officer, I want to draft, post, and cancel purchases from a
list-based module, so that product quantity and the supplier’s signed debt
balance reflect goods receipt without changing cash on the purchase itself.

## Business value

Inbound goods and supplier obligations on the signed partner debt balance.

## High-level scope

- List-based Purchase module (paginated, filterable).
- Draft CRUD (create, view, edit, delete).
- Explicit **post** (complete) from Draft → Posted: product quantity ↑,
  partner debt ↓, immutable document; **no cash mutation** (ADR-028).
- Explicit **cancel** from Posted → Cancelled with reason: reverse quantity
  and debt via new history rows; document retained.
- Static AZN only (ADR-031). No Warehouse (ADR-029). No Currency selectors.
- Purchase Returns are **deferred** (separate workflow; not ordinary cancel).

## High-level acceptance criteria

- Posting a purchase increases product quantity and decreases the partner’s
  signed debt balance by the purchase amount; it must **not** mutate any
  money-account balance ([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md),
  [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md),
  [ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md)).
- Drafts have no quantity, debt, or cash effect.
- Posted/Cancelled purchases are not editable or deletable via normal CRUD.
- Document numbers are backend-generated (`PUR-` + sequence) and unique under
  concurrency (Approved Human Decision 2026-07-31 for this story).
- Schema/API status values: `DRAFT` / `POSTED` / `CANCELLED` (UI may present
  Posted as “completed” in Azerbaijani without exposing enum keys).
- Optional “also record payment” Cash Out is **out of scope** for this story
  (EPIC-011/012 later).
- Must not resolve unrelated Open Decisions (OD-03 transport capitalization;
  AD-09 return credit).

## Dependencies

US-014+ partners; product catalog with `currentQuantity` (CHANGE-002);
signed debt balance (CHANGE-003). EPIC-011/012 not required for this slice.

## Related domain rules

invariants Purchasing, Product Quantity, Business Partner Debt Balance;
ADR-028; ADR-029; ADR-030; ADR-031.

## Related ADRs / docs

purchase workflows 5 and 35; analysis §5.5; ADR-028–031.

## Known risks

Concurrent post/cancel; insufficient quantity on cancel (blocked per workflow).

## Open questions

OD-03 / AD-09 remain open but do not block draft/post/cancel without returns
or transport capitalization.

## Readiness checklist

- [x] Business behavior approved / traceable for this slice
- [x] No unresolved Open Decision that this story would silently resolve
- [x] Dependencies satisfied or explicitly accepted
- [x] Acceptance criteria sufficient to implement

## Task elaboration

- [TASK-022-01](../tasks/TASK-022-01-purchase-draft-post-cancel-apis.md) — APIs
- [TASK-022-02](../tasks/TASK-022-02-purchase-list-form-details-ui.md) — UI
