# TASK-022-02: Purchase list, draft form, and details UI

## Metadata

- **Task ID:** TASK-022-02
- **Title:** Purchase list, draft form, and details UI
- **Parent User Story:** [US-022](../stories/US-022-purchase-draft-post.md)
- **Parent Epic:** [EPIC-009](../epics/EPIC-009-purchasing.md)
- **Status:** Review
- **Type:** UI
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-022-01

## Objective

List-based Purchase module in `apps/web`: paginated list with filters, draft create/edit, read-only details for all statuses, explicit post and cancel confirmations. Azerbaijani UI (ADR-005). Static AZN display. No Warehouse/Currency/Cash fields.

## Scope

- `apps/web/src/features/purchases/**`
- Nav + routes
- Post confirmation (quantity ↑, partner debt ↓, lock edit, no cash)
- Cancel confirmation with required reason

## Out of scope

Purchase Returns; Sales; Cash payment on purchase; print/export unless infrastructure already exists.

## Acceptance criteria

- [x] Nav: Alışlar
- [x] List filters and status-based actions
- [x] Draft create/edit in modal with dynamic product lines (same product allowed multiple times)
- [x] Details read-only for POSTED/CANCELLED
- [x] Post/cancel confirmations
- [x] Amounts shown as AZN via formatMoney

## Evidence

`apps/web/src/features/purchases/**`; routes in `App.tsx`; nav in `app-shell-layout.tsx`.

## Result

Review (implementation complete; awaiting owner acceptance).
