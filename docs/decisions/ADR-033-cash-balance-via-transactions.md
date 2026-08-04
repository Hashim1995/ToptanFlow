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
   must not silently rewrite posted amounts. **[Amended 2026-08-04 /
   CHANGE-028.]** A Super Admin may correct an account’s opening balance after
   creation: cancel the active `OPENING_BALANCE` via immutable reversal
   (ADR-035) when one exists, then post a new `OPENING_BALANCE` when the new
   amount is greater than zero. Ordinary inflow/outflow history is not rebuilt.
   Ordinary users cannot change opening balance.
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
| Silent in-place rewrite of opening amount | Destroys audit; use Super Admin reverse+repost (CHANGE-028) |

## Consequences

- Cash posting services own balance update + movement create together.
- APIs never expose a “set balance” endpoint.
- Tests must assert before/after balances and reconciliation.
- Aligns with PartnerDebtBalanceService and ProductQuantityService patterns.

## References

- Owner direction 2026-08-01; Super Admin opening correction 2026-08-04
- ADR-004, ADR-023, ADR-028, ADR-032, ADR-035, ADR-039, ADR-040
- CHANGE-004, CHANGE-028; invariants Cash
