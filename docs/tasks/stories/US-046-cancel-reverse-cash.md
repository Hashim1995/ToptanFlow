# US-046: Cancel and reverse Cash transactions

- **ID:** US-046
- **Title:** Cancel and reverse Cash transactions
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Cashier / Manager
- **Completed:** 2026-08-02 (foundation cancel shipped earlier with US-024;
  lifecycle hardening under [CHANGE-006](../unplanned/CHANGE-006-lifecycle-cancel-edit-harden.md))

## Statement

As a manager, I want to cancel completed Cash Transactions and Transfers with a
reason so that mistakes are corrected without deleting history (ADR-035).

## High-level acceptance criteria

- Cancel requires reason; creates opposite cash effect; preserves originals.
- Partner settlements (Cash In / Cash Out) reverse debt in the same transaction.
- **Cash In cancel** succeeds even when the account would go negative; no
  ADR-037 override required; resulting negative balance is visible (CHANGE-006).
- Expense cancel restores cash only; never partner debt.
- Transfers reverse both accounts atomically; Total Company Cash unchanged by
  the cancel (returns to pre-transfer total); double cancel prevented.
- No silent edit or physical delete of completed rows.
- No soft-deactivate lifecycle on Cash Transactions / Transfers.
- UI shows Cancel only for Posted (non-reversal) rows; confirmation lists effects
  (Cash In confirms possible negative balance).
- Cancelled / reversal rows remain visible in account history.

## Dependencies

US-024; expands with US-044/US-045. Hardened under CHANGE-006.

## Evidence

- API: `CashBalanceService.cancelPostedTransaction`,
  `CashTransactionsService.cancel` / `cancelTransfer`
  (`apps/api/src/cash/`).
- UI: cash account detail cancel action + reason confirmation.
- Specs: `cash-balance.service.spec.ts`, `cash-transactions.service.spec.ts`
  (cancel + double-cancel + partner debt + transfer legs).
