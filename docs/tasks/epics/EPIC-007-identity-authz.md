# EPIC-007: Identity, authentication, and authorization

- **ID:** EPIC-007
- **Title:** Identity, authentication, and authorization
- **Status:** In Progress

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

- US-018 — **In Progress**
- US-019 — **Ready**

## Completion definition

Protected APIs require an authenticated **active** user (v1: all such users equal).

## Known risks

Existing e2e must adopt auth helpers when guards land.

## Open questions

None for v1 flat users. Future roles/overrides require a new decision.

## Repository evidence

Prisma `User` placeholder today; auth modules not yet implemented.

## 2026-07-29 review (owner decisions → ADR-025)

- JWT + Argon2id; access **24h**, refresh **30d** (rotating).
- Single company.
- No roles / no admin type; every active user can do everything.
- Tasks elaborated: TASK-018-01/02, TASK-019-01..04.
