# TASK-049-01: Cash statement and period summary APIs

## Metadata

- **Task ID:** TASK-049-01
- **Title:** Cash statement and period summary APIs
- **Parent User Story:** [US-049](../stories/US-049-cash-reports-statements.md)
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Done
- **Type:** API
- **Priority:** Medium
- **Estimate:** M
- **Dependencies:** US-024, US-043, ADR-032–038, CHANGE-006
- **Completed:** 2026-08-02

## Objective

Expose Cash Account running-balance statement and company/period cash summary
endpoints that correctly exclude transfers from income/expense and do not let
reversals inflate turnover.

## Scope

- `apps/api/src/cash/**` report/statement service, DTOs, controller routes, unit tests

## Out of scope

- PDF/Excel export
- Multi-currency
- Partner statement (US-017)
- Multi-document allocation reports (US-026)

## Acceptance criteria

- [x] `GET /cash-accounts/:id/statement` with dateFrom/dateTo
- [x] Opening / running / closing balances from all persisted signed effects
      (CANCELLED originals keep effect; REVERSAL offsets — ADR-035)
- [x] Cancelled and Reversal rows visible on statement
- [x] `GET /cash-accounts/reports/period-summary` with optional account filter
- [x] Turnover excludes Transfer and Reversal; expenses grouped by category
- [x] Unit tests for statement math and turnover exclusion

## Evidence

- `apps/api/src/cash/cash-reports.service.ts` + DTOs
- Routes on `cash-accounts.controller.ts`: `reports/period-summary`, `:id/statement`
- `cash-reports.service.spec.ts` — 3 tests green (2026-08-02)
