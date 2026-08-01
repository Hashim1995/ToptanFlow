# ADR-029: Single Product Quantity — No Separate Warehouse or Stock Module

## Status

Accepted

## Context

Accepted [ADR-026](ADR-026-initial-warehouses-v1.md) and [ADR-027](ADR-027-allow-negative-stock-v1.md)
established a warehouse-scoped inventory ledger (`Warehouse`, `StockMovement`,
`StockBalance`, transfers, counts). EPIC-008 / US-020 / US-021 implemented that model.

On **2026-07-31** the repository owner directed a deliberate simplification of the
business architecture:

- TOPTANFLOW must **not** have a separate Warehouse or Stock module.
- There is **one current quantity per product**.
- All quantity, availability, purchase/sales quantity effects, and quantity history
  belong to the **Products** domain.
- Fixed Assets remain completely separate from Products.
- Sale/Purchase must never directly mutate cash ([ADR-028](ADR-028-sale-purchase-cash-separation.md)).

This ADR records that Approved Human Decision and **supersedes ADR-026** for
warehouse topology and inventory module scope. ADR-027’s “allow negative quantity”
intent is **re-homed** to product-level quantity with permission + reason (below).

## Business Decision

### Module structure (v1 and forward)

1. **Products** — commercial goods for sale/purchase, including `currentQuantity`
   and auditable product quantity history.
2. **Business Partners** — unified customers/suppliers; receivable and payable
   remain separate (no automatic netting).
3. **Purchase Transactions** — posted purchase increases product quantity and
   supplier payable; never cash.
4. **Sales Transactions** — posted sale decreases product quantity and increases
   customer receivable; never cash.
5. **Cash** — separate Cash In / Cash Out / Expense / optional internal cash
   transfer; optional links to Sale/Purchase.
6. **Fixed Assets** — future/optional; never mixed with Products.

### Forbidden concepts (must not be modeled or exposed)

Warehouse module / master data, multiple warehouses, `StockBalance`, independent
`StockMovement` module, InventoryCount module, WarehouseTransfer / StockTransfer,
source/destination warehouse, vehicle/branch warehouse, warehouse-specific
quantity or valuation, warehouse selection on purchase/sale.

Do **not** rename the same concept to Inventory Management, Storage Location,
Depot, Location Stock, or similar synonyms.

### Product quantity

- Each product has exactly one **current quantity** (company-wide).
- Quantity changes only through explained, auditable history rows inside Products
  (e.g. `ProductQuantityHistory`), never by silent edit of history.
- Allowed history kinds include: `PURCHASE`, `PURCHASE_RETURN`, `SALE`,
  `SALE_RETURN`, `INITIAL_QUANTITY`, `MANUAL_ADJUSTMENT`, `CANCELLATION_REVERSAL`.
- Posted Purchase increases quantity; posted Sale decreases quantity; drafts have
  no quantity effect; cancellations/returns reverse via new history rows.
- Current quantity must reconcile to the sum of quantity-history deltas for that
  product.

### Negative quantity

- Without permission, a sale (or other decrease) that would make quantity &lt; 0 is
  **blocked**.
- With permission, the user must provide a **reason**; the event is audited on the
  quantity-history row.
- Under [ADR-025](ADR-025-jwt-auth-flat-users-v1.md) v1 flat equal users, every
  active authenticated user has that permission; the mandatory reason still applies.
- Full BRD-OD-04 case machinery (limits, clearance, provisional cost) remains deferred.

### Yatı / vehicle stock

Vehicle warehouse and warehouse-transfer-based loading are **abolished** under
this model. Field Sales (Yatı) remains deferred ([EPIC-014](../tasks/epics/EPIC-014-field-sales-yati.md))
and must be redesigned without multi-location stock before implementation.
Until then, Yatı warehouse-transfer invariants are **not** active design rules.

### Damaged goods / AD-05

Damaged-goods **warehouse destination** is **N/A**. Damaged handling, if needed
later, must not reintroduce warehouses (e.g. write-off / quantity adjustment /
separate Fixed Asset — not a second stock location).

## Decision

1. **Supersede ADR-026** — warehouse master, multi-warehouse support, DAMAGED
   warehouse kind, one-step warehouse transfers, and `StockMovement` /
   `StockBalance` as the inventory module are withdrawn.
2. **Supersede ADR-027 warehouse wording** — negative quantity applies to
   `Product.currentQuantity` with permission + mandatory reason as above.
3. **Remove** Warehouse / StockBalance / warehouse-scoped StockMovement from the
   active schema and application; migrate any existing balance quantity into
   `Product.currentQuantity` when present.
4. **Add** product-owned quantity + `ProductQuantityHistory` (or equivalent name
   inside Products).
5. **Update** business knowledge docs, planning (EPIC-008 cancelled/replaced),
   UI navigation, and tests to match.
6. Preserve ADR-028 cash separation and receivable/payable separation.

## Consequences

- BRD-OD-02 multi-warehouse topology and AD-06 transfer staging are **superseded /
  N/A** for the active product.
- EPIC-008 warehouse/inventory delivery is **Cancelled** as a warehouse module;
  product-quantity capability moves under Products / a successor story.
- Purchase and Sale Nest modules (when built) must mutate product quantity +
  history, not warehouses.
- Documentation that still describes warehouses is incorrect until updated to
  this ADR.
- Yatı implementation is blocked on a future redesign decision.

## References

- Owner direction 2026-07-31 — simplified ERP structure (Products / Partners /
  Purchases / Sales / Cash / Fixed Assets)
- ADR-026 (superseded), ADR-027 (re-homed), ADR-028 (cash separation remains)
- `docs/business/invariants.md` — Products / quantity
- `docs/tasks/unplanned/CHANGE-002-single-product-quantity-no-warehouse.md`
