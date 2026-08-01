# TASK-023-02: Sale list, draft form, and details UI

## Metadata

- **Task ID:** TASK-023-02
- **Title:** Sale list, draft form, and details UI
- **Parent User Story:** [US-023](../stories/US-023-sale-draft-post.md)
- **Parent Epic:** [EPIC-010](../epics/EPIC-010-sales.md)
- **Status:** Review
- **Type:** UI
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-023-01

## Objective

List-based Sale module in `apps/web`: paginated list with filters, draft
create/edit modal (mirror purchases), read-only details for all statuses,
explicit post and cancel confirmations. Azerbaijani UI (ADR-005). Static AZN
display. No Warehouse/Currency/Cash fields. Show product available quantity on
lines. Negative-quantity override reason on post when needed.

## Scope

- `apps/web/src/features/sales/**`
- Nav + routes
- Post confirmation (quantity ↓, partner debt ↑, lock edit, no cash)
- Cancel confirmation with required reason
- Negative quantity reason field when post would go below zero

## Out of scope

Sales Returns; Cash payment on sale; print/export unless infrastructure exists.

## Acceptance criteria

- [x] Nav: Satışlar
- [x] List filters and status-based actions
- [x] Draft create/edit in modal with dynamic product lines (same product allowed multiple times)
- [x] Details read-only for POSTED/CANCELLED
- [x] Post/cancel confirmations; negative-qty reason when required
- [x] Amounts shown as AZN via formatMoney

## Evidence

`apps/web/src/features/sales/**`; routes in `App.tsx`; nav in `app-shell-layout.tsx`.

## Result

Review (implementation complete; awaiting owner acceptance).

## Completion date

2026-08-01
