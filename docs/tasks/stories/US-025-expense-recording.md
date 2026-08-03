# US-025: Expense recording

- **ID:** US-025
- **Title:** Expense recording
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Cashier / Manager

## Statement

As a cashier, I want to record expenses against a Cash Account with an Expense
Category, so that operating spend is auditable in Cash history and expense
reports without a disconnected balance ledger.

## Business value

Expense visibility with correct cash custody.

## High-level scope

Expense Category manage (simple); Expense as Cash Out type; list/filter; no
partner debt effect; AD-07/AD-08 deferred (cash-paid from Cash Account only).

## High-level acceptance criteria

- Expense requires category; decreases selected Cash Account; posts as Cash
  Transaction (invariants Expenses; ADR-033).
- Cancel via reversal (US-046).
- Must not resolve AD-07/AD-08.

## Dependencies

US-024.

## Task elaboration

Deferred until activation (Stage 3).
