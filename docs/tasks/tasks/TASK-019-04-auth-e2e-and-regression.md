# TASK-019-04: Auth e2e and regression

## Metadata

- **Task ID:** TASK-019-04
- **Title:** Auth e2e and API regression under JWT
- **Parent User Story:** [US-019](../stories/US-019-authentication-authorization.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Type:** Test
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-019-01, TASK-019-02

## Objective

Supertest: login/refresh/logout, inactive denial, protected route 401, happy
path as active user; ensure master-data suite still passes with auth helper.

## Acceptance criteria

- [x] Auth flows covered
- [x] Full api e2e green with authentication

## Evidence

- `apps/api/test/auth.e2e-spec.ts` — login success/401, protected 401/200, logout (5 passed)
- Full `yarn workspace api test:e2e` — 88 passed; unit 198 passed
- Users e2e uses `mockUserFindUniqueResolved` so JwtStrategy is not wiped by domain stubs

## Result

Done 2026-07-30.
