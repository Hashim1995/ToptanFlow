# ADR-023: PostgreSQL Decimal Precision and Scale Strategy

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: fixed PostgreSQL `NUMERIC(precision, scale)` values are used for every monetary, quantity, unit-price/cost, exchange-rate, and stock-threshold field in `apps/api/prisma/schema.prisma`. This closes the "Money and decimal implementation" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`.

Until this ADR, `apps/api/prisma/schema.prisma` used Prisma's `Decimal` type without a fixed `@db.Decimal(p, s)` annotation, leaving the underlying PostgreSQL `NUMERIC` column unconstrained, per that file's top-of-file comment and the task that introduced the schema. `docs/business/invariants.md` ("Global Invariants") already requires that "money and quantity values must be calculated without loss of precision; rounding must not silently change an official amount" — this ADR gives that requirement a concrete, fixed database representation.

## Decision

The following fixed scales apply to every existing `Decimal` field in `apps/api/prisma/schema.prisma`, expressed as Prisma's `@db.Decimal(precision, scale)` native-type annotation (PostgreSQL `NUMERIC(precision, scale)`):

| Field kind | Scale | Example fields |
| --- | --- | --- |
| Monetary amounts (totals, discounts, cash amounts, foreign-currency totals) | `Decimal(18, 2)` | `Sale.totalAmount`, `Sale.discountAmount`, `Sale.foreignCurrencyAmount`, `Purchase.totalAmount`, `Purchase.discountAmount`, `Purchase.foreignCurrencyAmount`, `SaleItem.discountAmount`, `SaleItem.lineTotal`, `SaleItem.costAtPosting`, `PurchaseItem.lineTotal`, `CashTransaction.amount`, `CashTransaction.foreignCurrencyAmount` |
| Quantities | `Decimal(18, 4)` | `SaleItem.quantity`, `PurchaseItem.receivedQuantity`, `PurchaseItem.invoicedQuantity` |
| Unit prices and unit costs | `Decimal(18, 4)` | `Product.standardSalePrice`, `Product.latestPurchasePrice`, `SaleItem.unitPrice`, `PurchaseItem.unitCost` |
| Exchange rates | `Decimal(18, 8)` | `Sale.exchangeRate`, `Purchase.exchangeRate`, `CashTransaction.exchangeRate` |
| Stock thresholds | `Decimal(18, 4)` | `Product.criticalStockThreshold` |

Additional rules:

- Prisma's `Decimal` type (backed by an arbitrary-precision decimal library, not JavaScript `number`) must be used in all backend application code that reads, writes, or calculates with these fields. A JavaScript `number` must never be treated as the authoritative representation of a monetary or precision-sensitive value — converting to `number` for calculation risks silent floating-point rounding, which directly conflicts with the Global Invariant quoted above.
- The backend remains authoritative for rounding and calculation rules (ADR-003); this ADR fixes only the stored column's precision and scale. It does not itself define when or how a value is rounded during a business calculation — that remains backend application logic, to be implemented and documented as each relevant task requires it.
- Database-level precision protects the *stored* value from exceeding its declared precision/scale; it does not replace application-level validation of business rules (e.g., "a document's stated total must match the total calculated from its own lines," per `docs/business/invariants.md`, "Global Invariants"). A value that fits `NUMERIC(18, 2)` can still be business-invalid; the database constraint and the business validation are complementary, not substitutes for one another.
- Any future change to a scale listed above is a schema change requiring a reviewed Prisma migration (ADR-021), evaluated by the Database Engineer (`agents/database-engineer.md`) for whether it is safe (e.g., widening scale) or potentially destructive (e.g., narrowing scale, which can silently truncate/round existing stored values) before being applied.
- This ADR changes only the native-type annotation on already-existing `Decimal` fields in `apps/api/prisma/schema.prisma`; it does not add, remove, or rename any entity or field.

## Consequences

- `apps/api/prisma/schema.prisma`'s every `Decimal` field now carries an explicit `@db.Decimal(p, s)` annotation matching the table above, and its top-of-file comment no longer lists decimal precision as an open decision.
- The first tracked Prisma migration (per ADR-021) created from this schema state includes these fixed `NUMERIC(p, s)` column definitions.
- This ADR removes "Money and decimal implementation" from the Known Open Decisions in `docs/technical/system-architecture.md`.
- Backend Engineer and Database Engineer tasks (`agents/backend-engineer.md`, `agents/database-engineer.md`) treat these scales as the fixed contract for money/quantity storage going forward; introducing a differently-scaled field for the same kind of value without amending this ADR is a review finding.

## Alternatives Considered

- **Integer minor-unit storage (e.g., storing money as qəpik/cents as a `BigInt`):** Rejected for this task. Would require redesigning every existing monetary field's type, which is a broader schema-shape change than this task's scope ("update only existing Decimal fields... do not add or remove entities or business fields").
- **Floating-point (`Float`/`double precision`):** Rejected. Directly conflicts with the Global Invariant that "money and quantity values must be calculated without loss of precision," since binary floating-point cannot exactly represent most decimal fractions.
- **Leaving `Decimal` fields unconstrained (status quo):** Rejected as the ongoing state. Left the "Money and decimal implementation" Open Decision unresolved indefinitely and allowed unbounded-precision values to be stored inconsistently across environments.
- **A single universal scale for every kind of value:** Rejected. Exchange rates need finer scale (8) than money (2) to avoid rounding error compounding across a multiplication; using one scale for all kinds would either waste precision or truncate the ones that need more.
