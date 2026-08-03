# ADR-033: Cash Balance Changes Only Through Cash Transactions

## Status

Accepted

## Context

Allowing operators or APIs to set `cashAccount.currentBalance = arbitraryValue`
destroys auditability and reconciliation. Sale/Purchase documents must not
embed cash mutations (ADR-028). Opening balances and adjustments must still be
explainable.

On **2026-08-01** the owner required that every balance change has a source
Cash Transaction (or Transfer movement), with transactional maintenance and
reconcilability from history.

## Business Decision

1. **`currentBalance` is maintained transactionally** with each posting
   movement; it must reconcile to the sum of signed movement effects (including
   opening balance and reversals).
2. **Forbidden:** direct overwrite of balance without an auditable business
   operation.
3. Every completed movement records at least: cash account, transaction
   identity, movement type/direction, signed amount, balance before, balance
   after, actor, timestamp; reversals link to the original movement/transaction.
4. **Opening balance** is posted as an `OPENING_BALANCE` Cash Transaction (or
   equivalent movement), not as an unexplained field alone. Later corrections
   use reversal/adjustment, not silent edit.
5. **Manual adjustment** (if enabled) requires capability (v1: authenticated
   user), mandatory reason, movement row, and audit fields.
6. Draft (if ever used) has **no** balance effect (ADR-036).

## Decision

Cash Account balances change only through completed Cash Transactions /
Transfer-linked movements inside one atomic database transaction with the
balance update.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Mutable balance without history | Not reconcilable; fails audit |
| Balance derived only by scanning all history at read time | Acceptable as check, but operational reads need maintained balance with movement proof |
| Editing opening balance in place | Silent rewrite; use reversal |

## Consequences

- Cash posting services own balance update + movement create together.
- APIs never expose a “set balance” endpoint.
- Tests must assert before/after balances and reconciliation.
- Aligns with PartnerDebtBalanceService and ProductQuantityService patterns.

## References

- Owner direction 2026-08-01
- ADR-004, ADR-023, ADR-028, ADR-032, ADR-035
- CHANGE-004; invariants Cash
