# US-045: Cash In / Cash Out (partner settlements)

- **ID:** US-045
- **Title:** Cash In / Cash Out (partner settlements)
- **Former title:** Customer receipt and supplier payment
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Cashier
- **Reframe:** CHANGE-005 / ADR-038 — not separate primary products named
  Customer Receipt / Supplier Payment

## Statement

As a cashier, I want **Cash In** and **Cash Out** against a Cash Account that
update the partner’s signed debt balance correctly, so that settlements match
ADR-030 without mutating Sale/Purchase cash fields and without a duplicate
receipt/payment menu.

## High-level acceptance criteria

- **Cash In:** Business Partner required; cash ↑; partner balance −= amount
  (`PartnerDebtBalanceService`); optional Sale link (traceability only).
- **Cash Out:** Business Partner required; cash ↓; partner balance += amount;
  optional Purchase link; negative override per ADR-037.
- Related Sale/Purchase field defaults to explicit **No connection**
  (`Bağlantı yoxdur`); selecting a document is optional for post.
- Options show document number, partner name/code, amount, date
  (`dd.MM.yyyy HH:mm`), and whether any POSTED cash is already linked
  (informational only — not payment completeness).
- Changing partner resets related document to No connection.
- Omitting the link must not block post and must still update cash +
  partner debt once (never a second debt effect from the link).
- Unlinked Cash In/Out remain valid history rows; same DB transaction for cash +
  debt; cancel reverses both (US-046).
- Form preview: cash before/after + partner debt before/after.
- Primary UX labels are Cash In / Cash Out only (ADR-038). Internal persistence
  may keep `CUSTOMER_RECEIPT` / `SUPPLIER_PAYMENT` enums.

## Dependencies

US-024; PartnerDebtBalanceService; Sales/Purchases for optional links.

## Task elaboration

Stage 5 delivered; CHANGE-005 reframes naming and promotes Cash In/Out as the
ordinary partner settlement APIs (partner-required).
