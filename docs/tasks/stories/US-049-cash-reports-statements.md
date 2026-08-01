# US-049: Cash reports and statements

- **ID:** US-049
- **Title:** Cash reports and statements
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** Medium
- **Business actor:** Controller / Cashier
- **Activated:** 2026-08-02
- **Completed:** 2026-08-02

## Statement

As a controller, I want Cash Account statements and initial company cash
reports, so that custody and spend are explainable.

## High-level scope

Balance by account; Total Company Cash; period Cash In / Cash Out; expenses by
category; transfers; partner receipts/payments; negatives; cancellations;
running-balance statement. Transfers excluded from income/expense; reversals
must not inflate turnover incorrectly.

## Acceptance criteria

- [x] Account statement for a date range with opening balance, lines, running
  balance, and closing balance.
- [x] Statement shows Cancelled and Reversal rows clearly; cancelled originals keep
  their signed effect and are offset by the Reversal row (ledger reconstruction).
- [x] Period summary: Cash In, Cash Out, Expenses (by category), Transfer volume,
  partner settlements, cancelled count, accounts currently negative, Total
  Company Cash.
- [x] Turnover totals use Posted non-transfer non-reversal types only so reversals
  do not inflate income/expense (ADR-034 / ADR-035 / CHANGE-006).
- [x] Azerbaijani UI; no internal enum keys exposed (ADR-005).
- [x] AZN only; no multi-currency.

## Dependencies

Stages 1–5 largely Done; US-043 workspace Done.

## Tasks

- [TASK-049-01](../tasks/TASK-049-01-cash-statement-period-summary-apis.md) Done
- [TASK-049-02](../tasks/TASK-049-02-cash-reports-statement-ui.md) Done

## Task elaboration

Activated 2026-08-02. Delivered statement + period-summary APIs and reports UI.
PDF/Excel export deferred.
