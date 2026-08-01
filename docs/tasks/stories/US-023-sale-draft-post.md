# US-023: Sale draft to posted sale

- **ID:** US-023
- **Title:** Sale draft to posted sale
- **Parent Epic:** [EPIC-010](../epics/EPIC-010-sales.md)
- **Status:** Planned
- **Priority:** High
- **Business actor:** Sales Officer

## Statement

As a sales officer, I want to draft and post sales, so that stock issues and
receivables are recorded correctly without changing cash balances on the sale
itself.

## Business value

Core revenue workflow.

## High-level scope

Draft/post/cancel/return; stock sufficiency checks; receivable creation.
Optional same-flow action to also create a separate Cash In + allocation
(EPIC-011/012) may be included when those epics are active — never as cash
fields on Sale.

## High-level acceptance criteria

- Posting a sale decreases stock and creates a customer receivable for the sale
  amount; it must **not** mutate any money-account balance
  ([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md)).
- If the UI offers “also record payment,” that must create a **separate** Cash
  In (and optional allocation) with its own identity and audit trail — even if
  committed atomically with the sale.
- Open (unpaid) amount is settlement-derived, not a cash balance stored on the
  sale.
- Must not resolve unrelated Open Decisions silently.

## Dependencies

Partners, products, inventory; preferably purchasing history; EPIC-011/012 for
optional linked receipt.

## Related domain rules

invariants Sales; ADR-028.

## Related ADRs / docs

sale workflows; analysis §5.1; ADR-028.

## Known risks

Deferred detail until activation.

## Open questions

See epic open questions; do not invent requirements. Cash separation is decided.

## Readiness checklist

- [ ] Business behavior approved / traceable for this slice
- [ ] No unresolved Open Decision that this story would silently resolve
- [ ] Dependencies satisfied or explicitly accepted
- [ ] Acceptance criteria sufficient to implement

## Task elaboration

Deferred until activation
