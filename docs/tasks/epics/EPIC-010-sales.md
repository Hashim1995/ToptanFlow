# EPIC-010: Sales

- **ID:** EPIC-010
- **Title:** Sales
- **Status:** Planned

## Business objective

Sale draft/post/cancel/return with product-quantity and signed partner debt
effects. Completing a sale must never directly mutate cash
([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md)).
Partner obligation uses one signed debt balance
([ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md)),
not a separate receivable balance. Amounts are AZN-only
([ADR-031](../../decisions/ADR-031-currency-reserved-for-future-cash.md)).

## User / business value

Core wholesale revenue cycle.

## Scope

Sale APIs/posting; coordination with cash/settlement for optional linked
receipts; discount guards later. Optional same-flow UI action that also creates
a **separate** Cash In + allocation is coordination with EPIC-011 / EPIC-012,
not cash mutation inside the sale. No currency fields on sale documents.

## Exclusions

Bundles (EPIC-016); Yatı field sale (EPIC-014). Direct cash balance updates on
the Sale record (forbidden by ADR-028). Currency selectors / FX (ADR-031).
Separate receivable-only primary balance (superseded by ADR-030).

## Dependencies

EPIC-005 (Products incl. quantity per ADR-029 / CHANGE-002), EPIC-006;
CHANGE-003 / ADR-030 partner debt balance; preferably EPIC-009 first;
EPIC-011/012 for optional payment recording and allocation.
**EPIC-008 Cancelled** — do not depend on warehouses. Currency CRUD not a
dependency (ADR-031).

## ADR-029 / ADR-030 / ADR-031 posting notes

- Posted sale quantity effects must adjust **`Product.currentQuantity`**
  (and product quantity history). **No `warehouseId`** on sale lines or
  posting paths.
- Posted sale increases the signed partner debt balance
  (`partnerBalance += saleAmount` per ADR-030).
- All amounts AZN-only; no currency / FX columns.

## Related ADRs / docs

invariants Sales; sale workflows; analysis M5 / §5.1; ADR-028; ADR-029;
ADR-030; ADR-031; CHANGE-003.

## Child user stories

- US-023

## Completion definition

Posted sales decrease product quantity and update the signed partner debt
balance per ADR-030, without mutating money-account balances as an intrinsic
sale effect.

## Known risks

Discount/zero-price/cancellation settlement open items.

## Open questions

BRD-OD-07/09. Cash-separation rule itself is decided (ADR-028). Signed-balance
rule is decided (ADR-030).

## Repository evidence

Sale models exist; no sales module/API.
