# TASK-024-03: Foundation Cash In / Cash Out APIs

## Metadata

- **Task ID:** TASK-024-03
- **Title:** Foundation Cash In / Cash Out APIs
- **Parent User Story:** [US-024](../stories/US-024-money-accounts-cash-movements.md)
- **Parent Epic:** EPIC-011
- **Status:** Done
- **Type:** Backend
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-024-01, TASK-024-02

## Acceptance criteria

- [x] Posted In/Out update balance atomically with before/after
- [x] Cancel requires reason; reverses cash; double cancel blocked
- [x] Inactive account rejects new posts
- [x] No partner debt changes for foundation types
- [x] Critical financial unit tests green

## Evidence

- `apps/api/src/cash/cash-balance.service.ts` (+ spec)
- `apps/api/src/cash/cash-transactions.controller.ts`
- `apps/api/src/cash/cash-transactions.service.ts` (+ spec)
- Yarn test `--testPathPatterns=cash`: 20 passed

## Result

Done — foundation Cash In/Out + cancel/reversal + negative-balance reason gate.

## Completion date

2026-08-01
