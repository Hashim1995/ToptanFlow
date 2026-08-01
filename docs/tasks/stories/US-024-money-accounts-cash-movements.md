# US-024: Money accounts and cash movements

- **ID:** US-024
- **Title:** Money accounts and cash movements
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Planned
- **Priority:** High
- **Business actor:** Cashier

## Statement

As a cashier, I want money accounts and posted cash movements, so that cash is
tracked per account without silent cross-account effects, and so that sale and
purchase settlement never embeds cash inside those documents.

## Business value

Cash discipline.

## High-level scope

Accounts; receipts/payments/transfers/adjustments; closing later. Cash In /
Cash Out are the only operational mutations of money-account balances for
customer/supplier settlement ([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md)).
May be recorded from Cash screens or optionally created as separate records
from Sale/Purchase UI. Unlinked movements allowed; optional link for later
allocation (US-026).

## High-level acceptance criteria

- Posted Cash In / Cash Out change the selected money account; they are
  distinct records with their own audit trail (ADR-028).
- Unlinked cash transactions are allowed.
- Optional linkage to Sale/Purchase documents is supported for traceability;
  allocation rules live primarily in US-026 / EPIC-012.
- Must not resolve unrelated Open Decisions silently (e.g. BRD-OD-03/05).

## Dependencies

BRD-OD-03/05; coordinates with US-022/US-023 for optional same-flow creation.

## Related domain rules

invariants Cash; ADR-028.

## Related ADRs / docs

cash workflows; ADR-028.

## Known risks

Deferred detail until activation.

## Open questions

See epic open questions; do not invent requirements. Sale/purchase cash
separation is decided.

## Readiness checklist

- [ ] Business behavior approved / traceable for this slice
- [ ] No unresolved Open Decision that this story would silently resolve
- [ ] Dependencies satisfied or explicitly accepted
- [ ] Acceptance criteria sufficient to implement

## Task elaboration

Deferred until activation
