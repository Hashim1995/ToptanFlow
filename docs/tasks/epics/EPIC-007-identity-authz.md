# EPIC-007: Identity, authentication, and authorization

- **ID:** EPIC-007
- **Title:** Identity, authentication, and authorization
- **Status:** Done

## Business objective

Attributable users with backend-enforced authentication and authorization.

## User / business value

Security boundary before production transactional use.

## Scope

Users beyond placeholder; JWT authn (ADR-025); v1 flat equal active users;
frontend login/session.

## Exclusions

Role packages, per-user overrides (AD-18), multi-company isolation (AD-17) —
deferred by ADR-025 until a future Approved Human Decision.

## Dependencies

EPIC-002; ADR-025.

## Related ADRs / docs

invariants Users & Permissions; ADR-025; system-architecture Authentication boundary.

## Child user stories

- US-018 — **Done**
- US-019 — **Done**

## Completion definition

Protected APIs require an authenticated **active** user (v1: all such users equal).

## Known risks

Existing e2e must adopt auth helpers when guards land. — **Mitigated**.

## Open questions

None for v1 flat users. Future roles/overrides require a new decision.

## Repository evidence

- Users CRUD + Argon2id (`apps/api/src/users/`)
- Auth module JWT + refresh cookie (`apps/api/src/auth/`)
- Global JwtAuthGuard; web login/session (`apps/web/src/features/auth/`)

## 2026-07-29 review (owner decisions → ADR-025)

- JWT + Argon2id; access **24h**, refresh **30d** (rotating).
- Single company.
- No roles / no admin type; every active user can do everything.
- Tasks elaborated: TASK-018-01/02, TASK-019-01..04.

## 2026-07-30 completion

US-018 + US-019 Done. Epic complete for v1 flat identity/auth.
