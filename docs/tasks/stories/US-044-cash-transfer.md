# US-044: Transfer between Cash Accounts

- **ID:** US-044
- **Title:** Transfer between Cash Accounts
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Cashier
- **Activated:** 2026-08-01 (CHANGE-005 / ADR-038 — primary workspace action)
- **Completed:** 2026-08-01

## Statement

As a cashier, I want to transfer money between Cash Accounts in one atomic
operation from the Cash workspace, so that custody moves without changing Total
Company Cash or mis-reporting income/expense.

## High-level acceptance criteria

- One `CashTransfer` aggregate → TRANSFER_OUT + TRANSFER_IN (ADR-034).
- Fields: Source Cash Account, Target Cash Account, Amount, Transaction date,
  Note/description.
- Source ≠ Target; Total Company Cash unchanged; not income/expense; no partner
  debt.
- Insufficient balance blocked unless reasoned override (ADR-037).
- Form preview: source/target before/after; confirmation Total Company Cash
  unchanged.
- Cancel reverses both sides (US-046).
- Exposed as one of the four primary Cash workspace actions (ADR-038).

## Dependencies

US-024; US-046; US-047.

## Evidence

- Prisma `CashTransfer` + `CashTransaction.cashTransferId`; migration
  `20260801200000_cash_transfer_aggregate`.
- API: `POST /cash-transactions/transfer`, cancel via transfer or leg.
- Web: Transfer primary action + form preview on Cash workspace.
