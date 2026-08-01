# EPIC-011: Cash, money accounts, and expenses

- **ID:** EPIC-011
- **Title:** Cash, money accounts, and expenses
- **Status:** Planned

## Business objective

Money accounts, cash movements, transfers, expenses, cash closing. Cash is the
only operational path that mutates money-account balances for receipts/payments
related to sales and purchases
([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md)).

## User / business value

Cash discipline and expense recording.

## Scope

MoneyAccount/CashTransaction behavior; expenses; closing. Support Cash In /
Cash Out that may be created from Cash screens or optionally triggered from
Sale/Purchase UI as **separate** records. Unlinked cash allowed; optional
document linkage for later allocation (EPIC-012).

## Exclusions

Full settlement allocation rules (EPIC-012); Yatı vehicle cash (EPIC-014).

## Dependencies

EPIC-006; EPIC-007 for production; BRD-OD-03/05; coordinates with EPIC-009/010
for optional same-flow payment recording.

## Related ADRs / docs

invariants Cash, Expenses; cash workflows; analysis M6 (partial); ADR-028.

## Child user stories

- US-024
- US-025

## Completion definition

Posted cash movements are account-specific, attributable, immutable, and never
implemented as embedded fields of Sale/Purchase documents.

## Known risks

Negative cash and personal-fund reimbursement open.

## Open questions

BRD-OD-03/05; AD-07/08. Sale/purchase cash-separation is decided (ADR-028).

## Repository evidence

MoneyAccount/CashTransaction models exist; no cash module/API.
