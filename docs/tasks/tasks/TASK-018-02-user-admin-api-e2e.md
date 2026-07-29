# TASK-018-02: User admin API e2e

## Metadata

- **Task ID:** TASK-018-02
- **Title:** User admin API e2e
- **Parent User Story:** [US-018](../stories/US-018-user-account-foundation.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Ready
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

- [ ] Happy-path CRUD + deactivate/reactivate covered
- [ ] Responses omit `passwordHash`
- [ ] Duplicate username conflict covered

## Evidence

(To be filled)

## Result

(To be filled)
