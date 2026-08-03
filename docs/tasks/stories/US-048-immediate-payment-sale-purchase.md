# US-048: Immediate payment on Sale and Purchase

- **ID:** US-048
- **Title:** Immediate payment on Sale and Purchase
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** Medium
- **Business actor:** Sales / Purchasing / Cashier

## Statement

As an operator, I want optional “Receive payment” / “Pay now” on Sale or
Purchase completion that creates a **separate Cash In / Cash Out** (ADR-038), so
that one UI flow can settle cash without merging documents (ADR-028).

## High-level acceptance criteria

- Creates separate Cash In (Sale) or Cash Out (Purchase) with own IDs/audit;
  atomic orchestration; failure must not leave silent inconsistency.
- Sale alone / Purchase alone still do not mutate cash.
- Partial and full payments supported; signed partner balance absorbs surplus.
- Cancel Sale/Purchase blocked while linked POSTED cash exists.
- UI must not invent a parallel “Customer Receipt / Supplier Payment” product;
  labels remain Receive payment / Pay now → Cash In / Cash Out.
- Depends on US-045 stable.

## Dependencies

US-023, US-022, US-045.

## Evidence (2026-08-01)

- API: optional `immediatePayment` on post DTOs; cash + partner debt in same TX;
  cancel blocked with `SALE_HAS_LINKED_POSTED_CASH` /
  `PURCHASE_HAS_LINKED_POSTED_CASH`.
- Web: post confirm checkbox «Ödəniş qəbul et» / «İndi ödə»; cash + debt preview;
  linked cash list on detail.
- Tests: `yarn test --testPathPatterns='sales|purchases|cash'` green.
