# TASK-051-01: Super Admin schema and Users API gate

## Metadata

- **Task ID:** TASK-051-01
- **Title:** Super Admin schema and Users API gate
- **Parent User Story:** [US-051](../stories/US-051-superadmin-user-administration-ui.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Type:** API / Schema
- **Priority:** High
- **Dependencies:** ADR-039 / CHANGE-007
- **Completed:** 2026-08-02

## Objective

Persist `isSuperAdmin`, seed bootstrap Super Admin, gate `/users`, expose flag
on auth user payload.

## Acceptance criteria

- [x] `User.isSuperAdmin` migrated
- [x] Seed bootstrap user is Super Admin
- [x] `SuperAdminGuard` on Users controller
- [x] Auth login/refresh returns `isSuperAdmin`
- [x] Unit/e2e coverage for gate + create-as-non-super

## Evidence

- Migration `20260802010000_user_is_super_admin` applied
- `users.service.spec` + `auth.service.spec` green; `users.e2e` 9 passed (incl. 403)
