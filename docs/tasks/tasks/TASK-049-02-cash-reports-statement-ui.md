# TASK-049-02: Cash reports and statement UI

## Metadata

- **Task ID:** TASK-049-02
- **Title:** Cash reports and statement UI
- **Parent User Story:** [US-049](../stories/US-049-cash-reports-statements.md)
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Type:** UI
- **Priority:** Medium
- **Estimate:** M
- **Dependencies:** TASK-049-01
- **Completed:** 2026-08-02

## Objective

Azerbaijani Cash reports screen: period summary cards and per-account statement
with filters, status labels, and negative-balance visibility.

## Scope

- `apps/web/src/features/cash/**` API client, hooks, reports page, nav, labels
- Route `/cash/reports`

## Out of scope

- PDF export
- Partner statement UI (US-017)

## Acceptance criteria

- [x] Nav entry under Cash group
- [x] Date range + optional account filters
- [x] Period summary totals in Azerbaijani labels
- [x] Statement table with running balance; Cancelled/Reversal visible
- [x] Empty/loading/error states; responsive

## Evidence

- `cash-reports-page.tsx`; route `/cash/reports` in `App.tsx`
- Shell nav `CASH_LABELS.navReports` + selectedKeys for `/cash/reports`
- Client: `getCashPeriodSummary` / `getCashAccountStatement` + hooks
