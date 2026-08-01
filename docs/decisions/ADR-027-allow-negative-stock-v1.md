# ADR-027: Allow Negative Stock Quantities (v1)

## Status

**Superseded in part** by [ADR-029](ADR-029-single-product-quantity-no-warehouse.md).

Negative **product** quantity remains allowed with permission + mandatory reason.
Warehouse-scoped wording and StockBalance references in this ADR are withdrawn.
The “no hard-block solely for &lt; 0” intent for v1 is replaced by:
block without permission; allow with permission and audited reason (ADR-025:
all active users have permission in v1).

## Context

[ADR-026](ADR-026-initial-warehouses-v1.md) set v1 inventory posting to **hard-block**
any warehouse/product balance &lt; 0, while leaving controlled negative-stock
exceptions ([BRD-OD-04](../analysis/01-document-analysis.md)) open.

On 2026-07-31 the repository owner confirmed business reality: stock may go
negative — for example when a product is sold before its purchase is recorded,
or when sold quantity exceeds currently recorded stock. The owner selected
**Option A**: allow negative balances on inventory posts; full controlled-
exception case lifecycle (permission packages, quantity/value/age limits,
`NegativeStockCase` entity) remains deferred.

## Business Decision

- Warehouse/product **balances may be negative** after posting inventory
  movements (adjustment, write-off, transfer, and later sale/purchase posting).
- Inventory posting **must not hard-block** solely because the resulting
  balance would be &lt; 0.
- This does **not** implement the full BRD-OD-04 controlled-exception machinery
  (granular permission, mandatory exception reason beyond existing movement
  reason fields, quantity/value/age limits, case open/clearance, provisional
  cost finalization). Those remain open / deferred.
- Negative balance is a **visible quantity state** reconcilable to the movement
  ledger; it does not invent availability or costing rules beyond quantity.

## Decision

### Supersedes ADR-026 hard-block clause

The ADR-026 bullet that required hard-blocking balance &lt; 0 is **superseded**
by this ADR for all inventory quantity posting. ADR-026 warehouse topology,
one-step transfers, and quantity-only movements remain in force.

### Application behavior (US-021 / inventory API)

- `POST /inventory/transfers`, `/adjustments`, `/write-offs` (and future sale
  issue / purchase receipt posting) may leave `StockBalance.quantity` &lt; 0.
- Append-only `StockMovement` + reconcilable `StockBalance` unchanged.
- Movement `reason` rules already required for adjustment/write-off remain;
  they are not redefined as a full negative-stock exception case.

## Consequences

- BRD-OD-04 is **partially resolved for v1**: negative quantities are allowed
  without a hard block. Scope limits, authorization, case lifecycle, and
  costing clearance remain open.
- UI and reports should treat negative quantity as a normal visible balance
  (labels later); do not hide it.
- Costing (BRD-OD-06) and provisional profit for unresolved negative-stock cost
  remain separate open decisions.

## References

- Owner confirmation 2026-07-31 — Option A “allow negative stocks”
- `docs/analysis/01-document-analysis.md` — BRD-OD-04
- `docs/business/invariants.md` — Inventory (negative inventory as exception;
  full control machinery still deferred for implementation)
- ADR-026
