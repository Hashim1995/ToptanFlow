# TASK-018-01: User persistence and CRUD APIs

## Metadata

- **Task ID:** TASK-018-01
- **Title:** User persistence and CRUD APIs
- **Parent User Story:** [US-018](../stories/US-018-user-account-foundation.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Type:** Backend / Database / API
- **Priority:** High
- **Estimate:** M
- **Dependencies:** ADR-025

## Objective

Extend the placeholder `User` model with credential storage and expose CRUD
APIs for create / list / get / update / deactivate / reactivate per ADR-025
(flat equal users; no roles).

## Scope

- Prisma: add `passwordHash` (never expose on responses); keep `username` unique
- Nest module `users`: create (with password), list (pagination), get, update
  (`fullName`, optional password change), PATCH `isActive` true/false
- Bootstrap seed or documented env-based first user for empty DB
- Unit tests for hashing/service rules

## Out of scope

- JWT login/refresh (US-019 / TASK-019-01)
- Roles, permissions, companyId
- Frontend user admin screens (later unless needed for bootstrap)

## Acceptance criteria

- [x] Migration adds `passwordHash`; existing placeholder semantics preserved
- [x] Password never returned in API responses
- [x] Soft-deactivate and reactivate work
- [x] Duplicate username → 409
- [x] Bootstrap path documented and runnable in local/dev
- [x] No Role/Permission tables introduced

## Testing expectations

Jest unit tests for users service; migration applies cleanly.

## Evidence

- Migration: `apps/api/prisma/migrations/20260729110103_add_user_password_hash/`
- Module: `apps/api/src/users/` (controller/service/DTOs/`password.util.ts`)
- Seed: `apps/api/prisma/seed.ts` + `.env.example` `BOOTSTRAP_*`
- Dependency: `argon2` (Argon2id)
- Unit tests: `users.service.spec.ts` (11) + `password.util.spec.ts` (1) — **12 passed**
- `yarn workspace api build` green

## Result

Done. User CRUD APIs available under `/api/v1/users`. JWT login remains US-019.

## Completion date

2026-07-29
