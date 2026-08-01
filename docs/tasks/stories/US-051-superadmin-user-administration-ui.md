# US-051: Super Admin user administration UI

- **ID:** US-051
- **Title:** Super Admin user administration UI
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Super Admin
- **Change:** [CHANGE-007](../unplanned/CHANGE-007-superadmin-user-administration.md)
- **Activated:** 2026-08-02
- **Completed:** 2026-08-02

## Statement

As a Super Admin, I want to create and manage user accounts (including setting
passwords and activating/deactivating), so that only I control who can log in,
while ordinary users never see this module.

## High-level scope

- `isSuperAdmin` persistence + seed; Users API gated; login exposes flag
- Azerbaijani Users screens: list, create, edit, set password, deactivate,
  reactivate
- Nav visible only when `auth.user.isSuperAdmin`

## Acceptance criteria

- [x] Schema + migration + seed Super Admin
- [x] Non-superadmin receives 403 on `/users`
- [x] Created users are never Super Admin via API
- [x] UI at `/users` with ADR-005 labels; hidden for non-superadmin
- [x] Soft-deactivate + reactivate

## Dependencies

ADR-039; US-018/019 Done.

## Tasks

- [TASK-051-01](../tasks/TASK-051-01-superadmin-schema-api.md) Done
- [TASK-051-02](../tasks/TASK-051-02-users-admin-ui.md) Done

## Out of scope

US-050 permissions catalog; promoting additional Super Admins via UI.
