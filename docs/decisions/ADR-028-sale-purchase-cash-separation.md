# ADR-028: Sale/Purchase Must Not Directly Mutate Cash

## Status

Accepted

## Context

Analysis §5.1 / §5.5 already stated that sale or purchase posting alone has no
cash effect unless a separately identifiable receipt/payment is also created.
Workflow and planning stubs for Purchasing, Sales, Cash, and Settlement were
less explicit: some wording (“payment status”, “payment in the same flow”,
“eligible cash effects”) could be read as cash mutating inside the
Sale/Purchase document.

On 2026-07-31 the repository owner confirmed the business rule that completing
a Purchase or Sale must never directly mutate a money-account cash balance, and
that cash linkage/allocation is optional, separate, and auditable.

## Business Decision

- **Completing (posting) a Purchase never directly mutates cash.** A Purchase
  changes stock and supplier payable.
- **Completing (posting) a Sale never directly mutates cash.** A Sale changes
  stock and customer receivable.
- **Cash changes only** through a separate Cash In / Cash Out (money)
  transaction (or approved opening/adjustment, per Cash invariants).
- A cash transaction **may optionally** be linked or allocated to one or more
  Purchase/Sale documents.
- That link may be created:
  - **immediately** from the Purchase/Sale save/post UI via an optional
    checkbox/action that also creates a **separate** Cash transaction; or
  - **later** from the Cash module when the user records payment/receipt.
- Even when created together from one UI action, Purchase/Sale and Cash remain
  **separate records with separate audit logs**. They may commit in one atomic
  database transaction, but they are not one merged document.
- The relationship is **optional** and exists mainly for traceability, payment
  allocation, document history, and reporting.
- **Unlinked** cash transactions are allowed.
- **Partial payments**, **multiple payments for one document**, and **one
  payment allocated across multiple documents** (same settlement direction)
  must be supported where relevant (Settlement / EPIC-012).

## Decision

This ADR is the Accepted decision record for the rule above. Implementation of
Purchasing (EPIC-009), Sales (EPIC-010), Cash (EPIC-011), and Settlement
(EPIC-012) must follow it. It does not invent mutual receivable/payable offset
or auto-advance application (those remain gated by existing open decisions).

## Consequences

- Sale/Purchase DTOs and posting services must not update money-account balances
  as an intrinsic field of the document.
- Optional “also record payment” UI creates a distinct CashTransaction (+
  allocation rows when applicable), never a cash column on Sale/Purchase.
- Cancellation of a Sale/Purchase reverses stock and partner debt; linked cash
  is resolved via **separate cash cancellation (ADR-035)** — not by silently
  deleting cash into the document row. **v1 rule (CHANGE-006 / US-048):** Sale
  or Purchase cancel is **blocked** while any linked non-reversal Cash
  Transaction remains `POSTED`; the operator cancels that cash first.
- Knowledge docs (`invariants`, `terminology`, `workflow-map`) and epic/story
  acceptance criteria reference this ADR.

## References

- Owner confirmation 2026-07-31 — cash separation / optional allocation rule
- `docs/analysis/01-document-analysis.md` — §5.1, §5.2, §5.5, §5.6; §3.5–3.10
- `docs/business/invariants.md` — Global, Sales, Purchasing, Cash, Receivables & Payables
- `docs/business/workflow-map.md` — Workflows 1, 2, 5, 6, 10, 11
- EPIC-009 / EPIC-010 / EPIC-011 / EPIC-012; US-022 / US-023 / US-024 / US-026
