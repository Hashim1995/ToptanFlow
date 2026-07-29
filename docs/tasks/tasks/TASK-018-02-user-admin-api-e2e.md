# TASK-018-02: User admin API e2e

## Metadata

- **Task ID:** TASK-018-02
- **Title:** User admin API e2e
- **Parent User Story:** [US-018](../stories/US-018-user-account-foundation.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Type:** Test
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-018-01

## Objective

Supertest coverage for user create/list/update/deactivate/reactivate and
password-hash non-leakage.

## Scope

E2E tests under `apps/api` aligned with existing master-data patterns.

## Out of scope

Auth login flows (TASK-019-04).

## Acceptance criteria

- [x] Happy-path CRUD + deactivate/reactivate covered
- [x] Responses omit `passwordHash`
- [x] Duplicate username conflict covered

## Evidence

- `apps/api/test/users.e2e-spec.ts`
- `yarn workspace api test:e2e -- users.e2e-spec.ts` → **8 passed**

## Result

Done. US-018 acceptance complete for backend user admin slice.

## Completion date

2026-07-29
