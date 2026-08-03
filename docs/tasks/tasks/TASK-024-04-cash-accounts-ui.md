# TASK-024-04: Cash Accounts and foundation Cash UI

## Metadata

- **Task ID:** TASK-024-04
- **Title:** Cash Accounts and foundation Cash UI
- **Parent User Story:** [US-024](../stories/US-024-money-accounts-cash-movements.md)
- **Parent Epic:** EPIC-011
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-024-02, TASK-024-03

## Acceptance criteria

- [x] ADR-005 labels; no enum keys in UI
- [x] Forms meet ui-requirements quality bar (RHF + Zod + placeholders)
- [x] Confirmations are specific (not only “Are you sure?”)
- [x] Mobile/responsive usable for list + forms

## Evidence

- `apps/web/src/features/cash/**` (api, forms, pages, labels, modals)
- Routes: `/cash/accounts`, `/cash/accounts/:id`
- Nav + home shortcut for Kassa
- `yarn tsc --noEmit` (web) green

## Result

Done — Cash accounts list/detail, create/edit/deactivate/reactivate, fast Cash In/Out with balance preview, transaction history + cancel.

## Completion date

2026-08-01
