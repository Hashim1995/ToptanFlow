# US-023: Sale draft to posted sale

- **ID:** US-023
- **Title:** Sale draft to posted sale
- **Parent Epic:** [EPIC-010](../epics/EPIC-010-sales.md)
- **Status:** Review
- **Priority:** High
- **Business actor:** Sales Officer

## Statement

As a sales officer, I want to draft, post, and cancel sales from a list-based
module, so that product quantity and the customer’s signed debt balance reflect
goods delivery without changing cash on the sale itself.

## Business value

Core wholesale revenue cycle on the signed partner debt balance.

## High-level scope

- List-based Sale module (paginated, filterable).
- Draft CRUD (create, view, edit, delete).
- Explicit **post** (complete) from Draft → Posted: product quantity ↓,
  partner debt ↑, immutable document; **no cash mutation** (ADR-028).
- Explicit **cancel** from Posted → Cancelled with reason: reverse quantity
  and debt via new history rows; document retained.
- Controlled negative product quantity on post requires mandatory reason
  (ADR-025: all active users authorized in v1; reason still mandatory).
- Static AZN only (ADR-031). No Warehouse (ADR-029). No Currency selectors.
- Same product may appear on multiple lines (owner decision 2026-07-31).
- Sales Returns are **deferred** (separate workflow; not ordinary cancel).

## High-level acceptance criteria

- Posting a sale decreases product quantity and increases the partner’s
  signed debt balance by the sale amount; it must **not** mutate any
  money-account balance ([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md),
  [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md),
  [ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md)).
- Drafts have no quantity, debt, or cash effect.
- Posted/Cancelled sales are not editable or deletable via normal CRUD.
- Document numbers are backend-generated (`SAL-` + NumberSequence `SALE`) and
  unique under concurrency (Approved Human Decision for US-023 / EPIC-010,
  2026-08-01; ADR-024 allocation pattern).
- Schema/API status values: `DRAFT` / `POSTED` / `CANCELLED` (UI may present
  Posted as “completed” in Azerbaijani without exposing enum keys).
- Optional “also record payment” Cash In is **out of scope** for this story
  (EPIC-011/012 later).
- Must not resolve unrelated Open Decisions (BRD-OD-07/09 discount/zero-price
  case lifecycle; Sales Returns).

## Dependencies

US-014+ partners; product catalog with `currentQuantity` (CHANGE-002);
signed debt balance (CHANGE-003). Prefer EPIC-009 patterns. EPIC-011/012 not
required for this slice.

## Related domain rules

invariants Sales, Product Quantity, Business Partner Debt Balance;
ADR-028; ADR-029; ADR-030; ADR-031; ADR-025.

## Related ADRs / docs

sale workflows; analysis §5.1; ADR-028–031.

## Known risks

Concurrent post/cancel; negative-quantity override misuse (reason + audit).

## Open questions

BRD-OD-07/09 remain open but do not block draft/post/cancel without returns
or advanced discount case workflow.

## Readiness checklist

- [x] Business behavior approved / traceable for this slice
- [x] No unresolved Open Decision that this story would silently resolve
- [x] Dependencies satisfied or explicitly accepted
- [x] Acceptance criteria sufficient to implement

## Task elaboration

- [TASK-023-01](../tasks/TASK-023-01-sale-draft-post-cancel-apis.md)
- [TASK-023-02](../tasks/TASK-023-02-sale-list-form-details-ui.md)
