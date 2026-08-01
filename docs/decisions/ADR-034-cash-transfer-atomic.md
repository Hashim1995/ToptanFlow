# ADR-034: Internal Cash Transfer as One Atomic Business Operation

## Status

Accepted

## Context

Money regularly moves between Cash Accounts (e.g. Nurtay’s Cash → Toğrul’s
Cash). Modeling that as two unrelated Cash In / Cash Out rows risks partial
posting, double counting in income/expense reports, and broken company totals.

## Business Decision

1. An **Internal Cash Transfer** is one business aggregate (`CashTransfer`) that
   produces **two linked movements**: `TRANSFER_OUT` (source) and
   `TRANSFER_IN` (destination).
2. Posting is **one atomic database transaction**: validate → decrease source →
   increase destination → create aggregate + both movements + audit fields.
3. **Total Company Cash is unchanged** by a successful transfer among active
   accounts included in the total.
4. Transfer is **neither income nor expense** and does **not** affect Business
   Partner debt.
5. Source ≠ destination; amount > 0; both accounts must exist; both normally
   active for new transfers.
6. Cancellation reverses both sides atomically and requires reason; double
   complete / double cancel are prevented.
7. Both account histories show the transfer; both movements reference the same
   transfer id.

## Decision

Model transfers as a first-class aggregate with linked OUT/IN movements — never
as two manually typed unrelated transactions, and never as Expense + Other
Income.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Two unrelated Cash Out + Cash In | Partial failure; easy to mis-report as expense/income |
| Record transfer as Expense on source and Income on destination | Corrupts P&L-style cash reports; false operating activity |
| Single row that “moves” without per-account history | Breaks per-account statements |
| Non-atomic sequential updates | Lost money / double money under failure or concurrency |

## Consequences

- Reports must exclude transfers from Cash In / Cash Out / Expense totals.
- UI must preview source/destination and show Total Company Cash before = after.
- Concurrency controls apply to source balance (and destination as needed).

## References

- Owner direction 2026-08-01
- ADR-032, ADR-033, ADR-035
- Workflow 13 (Cash Transfer)
- CHANGE-004; EPIC-011
