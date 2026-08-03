# US-024: Manage Cash Accounts and foundation Cash movements

- **ID:** US-024
- **Title:** Manage Cash Accounts and foundation Cash movements
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Review
- **Priority:** High
- **Business actor:** Cashier / Manager
- **Change:** [CHANGE-004](../unplanned/CHANGE-004-multi-cash-account-domain.md)

## Statement

As a cashier, I want multiple named Cash Accounts with opening balances and
posted Cash In / Cash Out (non-partner foundation types), so that cash custody
is tracked per account without silent cross-account effects and without embedding
cash inside Sale/Purchase documents.

## Business value

Financial core foundation for daily cash operations.

## High-level scope

**Stage 1–2 (this story):**

- Cash Account CRUD-ish: create, update metadata, deactivate/reactivate; unique
  name/code per approved rules; responsible user; notes.
- Opening balance as `OPENING_BALANCE` movement (ADR-033).
- Transactional `currentBalance`; no direct overwrite.
- Foundation Cash In types: OTHER_INCOME, OWNER_DEPOSIT (and opening/adjustment
  as authorized).
- Foundation Cash Out types: OWNER_WITHDRAWAL, MANUAL_ADJUSTMENT (negative).
- List/detail APIs + UI for accounts; fast Cash In/Out forms for foundation types.
- AZN only (ADR-031). Immediate partner settlement → US-045. Expenses → US-025.
  Transfers → US-044. Cancel details → US-046 (may share tasks).

## High-level acceptance criteria

- Multiple Cash Accounts exist as data; no hardcoded person modules (ADR-032).
- Opening balance creates auditable movement; balance reconciles to movements
  (ADR-033).
- Cash In increases / Cash Out decreases selected account with before/after.
- Inactive accounts reject new normal postings; history remains visible.
- Sale/Purchase posting still does not mutate cash (ADR-028).
- Ordinary create completes as Posted (ADR-036); Decimal-safe (ADR-023).
- Must not resolve AD-07/AD-08 or full BRD-OD-05 case lifecycle.

## Business effects

| Operation | Cash Account | Partner debt |
| --- | --- | --- |
| Opening balance | += amount | none |
| Other income / owner deposit | += | none |
| Owner withdrawal / manual − adjustment | −= | none |

## Permissions (v1)

Authenticated active user (ADR-025). Capability catalog: US-050. Reasons
required for adjustments and negative override (US-047).

## UI requirements

- Azerbaijani labels (ADR-005); never expose enum keys.
- Account list with balances; detail with history; confirmation previews for
  postings (`docs/technical/ui-requirements.md`).

## Backend requirements

- Nest modules + Prisma `CashAccount` / `CashTransaction` redesign.
- Atomic posting; concurrency-safe balance updates.
- Number sequences for transaction numbers.

## Audit requirements

Actor, timestamps, amounts, before/after, reasons on account create/update/
deactivate, opening balance, cash in/out, adjustments.

## Test scenarios (minimum)

Account create/duplicate rules; opening movement; no direct balance overwrite;
inactive block; cash in/out before/after; decimal 0.01; double-submit guard;
Sale/Purchase unchanged re: cash.

## Dependencies

ADR-032–037; Partners/Users exist; Purchases/Sales not required for Stage 1–2.

## Related domain rules

invariants Cash; workflows 10–11 (foundation types); ADR-028, 031–037.

## Known risks

Schema rename MoneyAccount → CashAccount; concurrent outflows.

## Open questions

None blocking Stage 1–2. Seed account names are ops.

## Readiness checklist

- [x] Business behavior approved / traceable for this slice
- [x] No unresolved Open Decision that this story would silently resolve
- [x] Dependencies satisfied or explicitly accepted
- [x] Acceptance criteria sufficient to implement

## Task elaboration

- [TASK-024-01](../tasks/TASK-024-01-cash-schema-migration.md) — Prisma/schema
- [TASK-024-02](../tasks/TASK-024-02-cash-account-apis.md) — Cash Account APIs
- [TASK-024-03](../tasks/TASK-024-03-cash-in-out-foundation-apis.md) — Cash In/Out foundation APIs
- [TASK-024-04](../tasks/TASK-024-04-cash-accounts-ui.md) — Accounts + foundation forms UI
