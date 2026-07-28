# EPIC-011: Cash, money accounts, and expenses

- **ID:** EPIC-011
- **Title:** Cash, money accounts, and expenses
- **Status:** Planned

## Business objective

Money accounts, cash movements, transfers, expenses, cash closing.

## User / business value

Cash discipline and expense recording.

## Scope

MoneyAccount/CashTransaction behavior; expenses; closing.

## Exclusions

Full settlement allocation (EPIC-012); Yatı vehicle cash (EPIC-014).

## Dependencies

EPIC-006; EPIC-007 for production; BRD-OD-03/05.

## Related ADRs / docs

invariants Cash, Expenses; cash workflows; analysis M6 (partial).

## Child user stories

- US-024
- US-025

## Completion definition

Posted cash movements are account-specific, attributable, immutable.

## Known risks

Negative cash and personal-fund reimbursement open.

## Open questions

BRD-OD-03/05; AD-07/08.

## Repository evidence

MoneyAccount/CashTransaction models exist; no cash module/API.
