# EPIC-007: Identity, authentication, and authorization

- **ID:** EPIC-007
- **Title:** Identity, authentication, and authorization
- **Status:** Done

## Business objective

Attributable users with backend-enforced authentication and authorization.

## User / business value

Security boundary before production transactional use.

## Scope

Users beyond placeholder; JWT authn (ADR-025); mostly flat equal active users;
frontend login/session; Super Admin user administration (ADR-039 / CHANGE-007).

## Exclusions

Role packages / capability catalogs (US-050 Deferred), per-user overrides (AD-18),
multi-company isolation (AD-17).

## Dependencies

EPIC-002; ADR-025; ADR-039.

## Related ADRs / docs

invariants Users & Permissions; ADR-025; ADR-039; system-architecture Authentication boundary.

## Child user stories

- US-018 — **Done**
- US-019 — **Done**
- US-051 — **Done** (Super Admin Users UI)

## Completion definition

Protected APIs require an authenticated **active** user. Business modules remain
flat equal. User administration requires `isSuperAdmin` (ADR-039).

## Known risks

Existing e2e must adopt auth helpers when guards land. — **Mitigated**.

## Open questions

None for v1 flat users. Future roles/overrides require a new decision.

## Repository evidence

- Users CRUD + Argon2id (`apps/api/src/users/`)
- Auth module JWT + refresh cookie (`apps/api/src/auth/`)
- Global JwtAuthGuard; web login/session (`apps/web/src/features/auth/`)
- Super Admin Users UI (`apps/web/src/features/users/`)

## 2026-07-29 review (owner decisions → ADR-025)

- JWT + Argon2id; access **24h**, refresh **30d** (rotating).
- Single company.
- No roles / no admin type; every active user can do everything.
- Tasks elaborated: TASK-018-01/02, TASK-019-01..04.

## 2026-07-30 completion

US-018 + US-019 Done. Epic complete for v1 flat identity/auth.

## 2026-08-02 reopen then Done (CHANGE-007 / ADR-039)

US-051 Super Admin user administration Done; US-050 Deferred.
