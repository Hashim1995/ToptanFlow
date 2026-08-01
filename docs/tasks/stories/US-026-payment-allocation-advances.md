# US-026: Payment allocation and advances

- **ID:** US-026
- **Title:** Payment allocation and advances
- **Parent Epic:** [EPIC-012](../epics/EPIC-012-settlement.md)
- **Status:** Planned
- **Priority:** High
- **Business actor:** Cashier / Controller

## Supersession note (2026-07-31)

“Receivable and payable directions never auto-netted” as primary settlement
truth is **superseded** by
[ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md) /
[CHANGE-003](../unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md):
one signed partner debt balance. Sale/purchase effects already offset on that
balance. Retarget allocation/advance design at activation. ADR-028 remains
(Sale/Purchase never mutate cash directly).

## Statement

As a controller, I want optional allocations and advance handling, so that
separately posted receipts/payments settle sale and purchase documents against
the signed partner debt balance without treating Sale/Purchase as cash ledgers.

## Business value

Correct open amounts and signed partner balance.

## High-level scope

Allocation/reallocation; advances as signed-balance effects. Aligns with
[ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md) and ADR-030.
Amounts AZN-only ([ADR-031](../../decisions/ADR-031-currency-reserved-for-future-cash.md)).

## High-level acceptance criteria

- Allocation never exceeds the source cash amount or the target document open
  amount.
- Partial payments, multiple payments for one document, and one payment
  allocated across multiple documents are supported.
- Unlinked cash remains valid; allocation is optional for settlement /
  traceability / reporting.
- Partner obligations use one signed debt balance (ADR-030), not dual AR/AP
  primary balances.
- Must not resolve unrelated Open Decisions silently; refine OD gates at
  activation under ADR-030.

## Dependencies

Posted sales/purchases/cash; CHANGE-003 / ADR-030.

## Related domain rules

ADR-030; ADR-028; ADR-031.

## Related ADRs / docs

settlement workflows (retargeted); ADR-028; ADR-030; CHANGE-003.

## Known risks

Deferred detail until activation.

## Open questions

See epic open questions; do not invent requirements. Cash-separation /
optional-allocation rule is decided.

## Readiness checklist

- [ ] Business behavior approved / traceable for this slice (refine under ADR-030)
- [ ] No unresolved Open Decision that this story would silently resolve
- [ ] Dependencies satisfied or explicitly accepted
- [ ] Acceptance criteria sufficient to implement

## Task elaboration

Deferred until activation
