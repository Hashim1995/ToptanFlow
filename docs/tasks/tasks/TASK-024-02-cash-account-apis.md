# TASK-024-02: Cash Account APIs

## Metadata

- **Task ID:** TASK-024-02
- **Title:** Cash Account APIs
- **Parent User Story:** [US-024](../stories/US-024-money-accounts-cash-movements.md)
- **Parent Epic:** EPIC-011
- **Status:** Done
- **Type:** Backend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-024-01

## Acceptance criteria

- [x] Unique name/code rules enforced as designed
- [x] Opening balance auditable; balance cannot be patched directly
- [x] Inactive rejects noted for later posting services
- [x] Soft-deactivate + reactivate (operational completeness)
- [x] Tests green for create/duplicate/opening/deactivate

## Evidence

- `apps/api/src/cash/cash-accounts.controller.ts`
- `apps/api/src/cash/cash-accounts.service.ts`
- `apps/api/src/cash/cash-accounts.service.spec.ts`
- Yarn test `--testPathPatterns=cash`: 20 passed (includes accounts + balance + transactions)

## Result

Done — Cash Account Nest APIs with opening balance, total company cash, deactivate/reactivate.

## Completion date

2026-08-01
