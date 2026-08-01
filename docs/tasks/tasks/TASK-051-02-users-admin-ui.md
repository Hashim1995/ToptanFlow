# TASK-051-02: Users admin UI (Super Admin only)

## Metadata

- **Task ID:** TASK-051-02
- **Title:** Users admin UI (Super Admin only)
- **Parent User Story:** [US-051](../stories/US-051-superadmin-user-administration-ui.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Type:** UI
- **Priority:** High
- **Dependencies:** TASK-051-01
- **Completed:** 2026-08-02

## Objective

Azerbaijani Users maintenance screen; nav and route only for Super Admin.

## Acceptance criteria

- [x] `/users` list with search + status filters
- [x] Create / edit (fullName, username) / set password / deactivate / reactivate
- [x] Nav hidden when not Super Admin; deep link redirects home
- [x] ADR-005: no enum keys; AZ labels

## Evidence

- `apps/web/src/features/users/**`; route gated by `RequireSuperAdmin`
- Shell nav `USERS_LABELS` only when `auth.user.isSuperAdmin`
