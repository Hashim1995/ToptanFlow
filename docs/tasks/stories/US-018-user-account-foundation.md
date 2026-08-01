# US-018: User account administration foundation

- **ID:** US-018
- **Title:** User account administration foundation
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Any authenticated active user (v1 flat users — ADR-025)

## Statement

As an operator, I want manageable user accounts that can be deactivated and
reactivated, so that sensitive actions remain attributable to identifiable people.

## Business value

Attributable actors for all sensitive actions.

## High-level scope

User persistence beyond placeholder username; password hash storage; create /
list / update / deactivate / reactivate. No roles or admin types (ADR-025).

## High-level acceptance criteria

- User has `fullName`, unique `username`, `passwordHash`, `isActive`
- Create user with password (hash never returned on read)
- List / get / update profile fields; change password via explicit path
- Soft-deactivate and reactivate (operational completeness)
- Bootstrap path for first user (seed or documented create-before-auth)
- Must follow ADR-025; no Role/Permission tables

## Dependencies

ADR-025 Approved. Auth endpoints land in US-019 (CRUD may ship first;
protection applied when guards exist).

## Related domain rules

invariants Users & Permissions (including 2026-07-29 Approved Human Decisions).

## Related ADRs / docs

ADR-025; ADR-003; system-architecture Authentication boundary.

## Known risks

Chicken-and-egg until seed/bootstrap user exists.

## Open questions

None for v1 flat users. Granular roles deferred.

## Readiness checklist

- [x] Business behavior approved / traceable for this slice (ADR-025)
- [x] No unresolved Open Decision that this story would silently resolve
- [x] Dependencies satisfied or explicitly accepted
- [x] Acceptance criteria sufficient to implement

## Task elaboration

- [TASK-018-01](../tasks/TASK-018-01-user-persistence-and-crud.md) — **Done**
- [TASK-018-02](../tasks/TASK-018-02-user-admin-api-e2e.md) — **Done**
