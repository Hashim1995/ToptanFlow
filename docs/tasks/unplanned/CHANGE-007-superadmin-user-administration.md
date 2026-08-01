# CHANGE-007: Super Admin for user administration

- **ID:** CHANGE-007
- **Title:** Super Admin flag for Users module only
- **Status:** Done
- **Recorded:** 2026-08-02
- **Type:** Approved Human Decision (narrow ADR-025 supersede)
- **Completed:** 2026-08-02

## Problem

v1 ADR-025 made every active user equal, including user administration. Operators
need a bootstrap **Super Admin** who alone can create users, set passwords, and
activate/deactivate accounts. Other users must not see or call the Users module.
Granular role/permission packages (US-050) remain unwanted for now.

## Decision (Accepted — owner 2026-08-02)

1. Add `User.isSuperAdmin` (boolean, default `false`). No Role/Permission tables.
2. Bootstrap/seed user is created (or promoted) with `isSuperAdmin = true`.
3. **Only** Super Admins may call Users CRUD APIs and see the Users UI.
4. Users created via API always get `isSuperAdmin = false` (cannot self-escalate).
5. Super Admin accounts cannot be soft-deactivated (including self); they are
   the root operator. Hard delete of users remains forbidden.
6. All other application actions remain flat equal among active authenticated
   users (cash, sales, purchases, master data) — unchanged from ADR-025.
7. US-050 Cash capabilities catalog is **Deferred** (not needed yet).

## Scope

- ADR-039; ADR-025 consequence note; invariants Users & Permissions note
- Prisma migration + seed; SuperAdminGuard; auth user payload includes flag
- Users web module (list/create/edit/deactivate/reactivate/set password)
- Tests / e2e updates

## Out of scope

- Full RBAC / permission keys (US-050)
- Per-account cash visibility
- Multiple Super Admin management UI (API never promotes; seed/bootstrap only)

## Related

- [ADR-039](../../decisions/ADR-039-superadmin-user-administration.md)
- [ADR-025](../../decisions/ADR-025-jwt-auth-flat-users-v1.md)
- [US-051](../stories/US-051-superadmin-user-administration-ui.md)
- [EPIC-007](../epics/EPIC-007-identity-authz.md)
