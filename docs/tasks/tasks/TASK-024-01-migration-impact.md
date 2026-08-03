# Migration and data impact — Multi-Cash-Account (TASK-024-01)

> Pre-implementation migration report. Update evidence after apply.

## Expected changes

| Change | Notes |
| --- | --- |
| Rename `MoneyAccount` → `CashAccount` | Table rename; add columns |
| Drop or stop using `MoneyAccountType` enum | Replace with optional soft kind later if needed |
| Alter `CashTransaction` | Numbers, direction, balances, Decimal scale, type enum remap |
| New NumberSequence keys | e.g. `CASH_TRANSACTION`, `CASH_TRANSFER` |
| New tables later | `CashTransfer`, `ExpenseCategory`, allocations — not all in TASK-024-01 |

## Existing data

- No Cash seed; no Cash Nest API historically → expect **0 rows** or unused stubs.
- Do **not** reset database; do **not** drop Sale/Purchase/Partner/Product data.

## Rollback concerns

- Enum alterations on PostgreSQL may need multi-step SQL.
- Prefer expand-migrate-contract if any unknown rows exist: detect count before rename.

## Indexes / FKs

- FK CashAccount → User (responsible, createdBy)
- FK CashTransaction → CashAccount, User, optional Partner/Sale/Purchase
- Indexes: `(cashAccountId, transactionDate)`, status, type

## Verification after migrate

```text
npx prisma validate
npx prisma migrate deploy   # or migrate dev in local
```

Confirm Partner/Sale/Purchase tables unchanged in row counts.
