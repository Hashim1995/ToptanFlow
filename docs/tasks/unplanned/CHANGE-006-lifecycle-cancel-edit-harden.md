# CHANGE-006: Lifecycle cancel / edit / deactivate hardening

- **ID:** CHANGE-006
- **Title:** Lifecycle cancellation, editing, and activation/deactivation hardening
- **Status:** Done
- **Recorded:** 2026-08-02
- **Type:** Production hardening (financial and quantity safety)

## Problem

Completed Purchase, Sale, Cash In, Cash Out, Expense, and Cash Transfer operations
already mutate product quantity, partner debt, and/or cash balances. Ordinary CRUD
edit/delete/deactivate on those facts would create inconsistencies. An audit found
strong foundations (ADR-028, ADR-035–038, US-022/023/048) but documentation drift
(US-046 Planned while cancel APIs shipped), incomplete cancel confirmation UX,
generic purchase-cancel quantity errors, and missing regression tests.

## Decision (Accepted for this change)

1. **Draft** Sale/Purchase: editable and deletable (permissions = authenticated
   active user under ADR-025 v1).
2. **Posted / Cancelled** Sale/Purchase: immutable — including notes. No physical
   delete. No soft-deactivate. Corrections via cancel + new document.
3. **Cash In / Cash Out / Expense / Transfer:** created as Posted (ADR-036); no
   edit/delete; cancel with mandatory reason creates reversal (ADR-035).
4. **Active/inactive** applies only to master data (Product, Business Partner,
   Cash Account, Expense Category) — never to completed financial/commercial ops.
5. **Linked POSTED cash must be cancelled before** Sale/Purchase cancel
   (`SALE_HAS_LINKED_POSTED_CASH` / `PURCHASE_HAS_LINKED_POSTED_CASH`). Sale/Purchase
   cancel never mutates cash.
6. **Purchase cancel** remains blocked when quantity reversal would make
   `currentQuantity < 0` (structured error code; clearer operator guidance).
7. Notes after completion are **not** editable (no informational carve-out).
8. **Cash In cancellation** is always allowed even if the account would go
   negative; do not block for insufficient balance; do not require ADR-037
   override. Cancel reason, atomic cash+debt reversal, history, and double-
   cancel prevention still apply. Does not relax Cash Out / Expense / Transfer
   **creation** gates.

## Scope

- Business docs: invariants, workflow-map (Sale/Purchase cancel), ADR clarifications.
- Planning: US-046 Done with evidence; CURRENT / CHANGELOG.
- API: purchase cancel insufficient-quantity code; cash cancel lock hygiene;
  Cash In cancel may leave balance negative without ADR-037 override.
- UI: stronger cancel confirmations; cancelled linked-cash visibility; AZ errors;
  Cash In cancel warns that balance may go negative.
- Tests: lifecycle safety suite for Purchase / Sale / Cash In/Out / Expense / Transfer;
  Cash In cancel into negative without override.

## Out of scope

- US-049 formal cash reports / turnover definitions
- RBAC roles beyond ADR-025
- Sales/Purchase Returns; US-026 multi-doc allocation
- Redesign of unrelated modules

## Related

- [US-046](../stories/US-046-cancel-reverse-cash.md)
- ADR-028, ADR-035–038; US-022, US-023, US-048
- EPIC-011
