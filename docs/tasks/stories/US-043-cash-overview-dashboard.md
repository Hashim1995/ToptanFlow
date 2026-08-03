# US-043: Cash workspace overview

- **ID:** US-043
- **Title:** Cash workspace overview
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Cashier / Manager
- **Activated:** 2026-08-01 (CHANGE-005 / ADR-038)
- **Completed:** 2026-08-01

## Statement

As a cashier, I want the main Cash screen to show every Cash Account separately
with balance, today’s Cash In / Cash Out / Expenses, recent activity, and
responsible person, plus Total Company Cash and four primary actions, so that I
can operate the most-used module quickly.

## Business value

Speed and clarity for daily cash operations.

## High-level scope

- Per-account cards: current balance; today’s Cash In / Cash Out / Expenses;
  recent activity; responsible person.
- **Total Company Cash** = sum of active account balances.
- Four clear actions: Cash In, Cash Out, Expense, Transfer (ADR-038).
- Unified transaction history with filters (account, type, date, partner,
  amount, related Sale/Purchase, expense category).

## High-level acceptance criteria

- Total = sum of active account balances; transfers excluded from income/expense
  totals (ADR-032, ADR-034).
- No primary actions named Customer Receipt / Supplier Payment.
- Aggregates via efficient queries (no full history load for overview).
- Must not invent multi-currency.

## Dependencies

US-024; US-025; US-044; US-045.

## Evidence

- API: `GET /cash-accounts/summary/workspace` (today In/Out/Expense per account).
- Web: `/cash/accounts` four primary header actions + per-account cards with
  today’s totals; detail history filters expanded.
