# ADR-031: Reserve Currency for Future Cash Domain Only

## Status

Accepted

## Context

An earlier Approved Human Decision (2026-07-28) allowed optional multi-currency
on documents and money accounts with AZN as default, and Currency was delivered
as reference-data CRUD (EPIC-004 / US-007) with `BusinessPartner.defaultCurrencyId`
and optional FX fields on Sale/Purchase/CashTransaction.

On **2026-07-31** the repository owner directed that **Currency must not exist
as an active module in the current product**. All current monetary amounts are
static **AZN**. Currency may return only as part of a **future Cash** design
(cash accounts / cash transactions). Currency must not be a Product, Business
Partner, Purchase, or Sale master-data property.

## Business Decision

### Current release

- Base currency constant: `AZN` (system convention, not a CRUD entity).
- No Currency create/edit/delete/activate UI or API.
- No currency selectors on Products, Business Partners, Purchases, or Sales.
- No exchange-rate workflows.
- Display amounts via shared formatting (e.g. `formatMoney` → `"1,250.00 AZN"`).
- Preserve ADR-023 decimal precision for money.

### Future Cash (documentation only — YAGNI now)

Currency will belong primarily to future Cash Accounts and Cash Transactions
(e.g. account `currencyCode`, optional transaction original amount / rate /
base amount). Do **not** implement multi-currency fields, Currency CRUD, or
exchange-rate services until that Cash work is explicitly activated.

### Explicit non-ownership

```text
Currency is not a Product property.
Currency is not a Business Partner property.
Currency is not a general Purchase/Sale master-data module.
Currency will belong primarily to future Cash Accounts and Cash Transactions.
```

## Decision

1. **Supersede** the 2026-07-28 multi-currency optional-selection decision for
   the active product scope.
2. Remove the `Currency` model, Currencies Nest/Web modules, and all current
   currency FKs / FX columns from BusinessPartner, Sale, Purchase, MoneyAccount,
   and CashTransaction.
3. Document future Cash ownership without speculative schema.
4. Keep ADR-028: Sale/Purchase never directly mutate cash.

## Consequences

- EPIC-004 / US-007 Currency reference CRUD is Cancelled/superseded for runtime.
- Partner preferred-currency preference is dropped (no data migration beyond
  dropping `defaultCurrencyId`).
- Sale/Purchase Nest posting (when built) uses AZN amounts only.

## References

- Owner direction 2026-07-31 — remove Currency from current domains
- ADR-023 — decimal precision
- ADR-028 — cash separation
- ADR-030 — signed partner debt balance (AZN)
