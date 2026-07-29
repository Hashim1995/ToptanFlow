# US-019: Authentication and authorization

- **ID:** US-019
- **Title:** Authentication and authorization
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Ready
- **Priority:** High
- **Business actor:** All system users (flat equal — ADR-025)

## Statement

As a system user, I want to log in with username/password and receive JWT
credentials, so that the backend can require an authenticated active user for
protected actions.

## Business value

Security boundary for production use (v1: login gate only).

## High-level scope

Login / refresh / logout; Argon2id verify; JWT access (24h) + rotating refresh
(30d); guard that allows any **active** authenticated user for all v1 routes
(ADR-025). Frontend login + in-memory access token + httpOnly refresh cookie.

## High-level acceptance criteria

- `POST /auth/login` issues access JWT + sets refresh cookie
- `POST /auth/refresh` rotates refresh; `POST /auth/logout` revokes
- Inactive users cannot authenticate or refresh
- Protected APIs return 401 when unauthenticated; active user authorized for all v1 actions
- Web login screen (Azerbaijani) and authenticated app shell gate
- Must not invent roles/permissions beyond ADR-025

## Dependencies

US-018 user persistence (passwordHash); ADR-025.

## Related domain rules

invariants Users & Permissions; ADR-025.

## Related ADRs / docs

ADR-025; ADR-003; analysis §7.5 (now approved via ADR-025 with longer TTLs).

## Known risks

Existing master-data e2e must adopt auth (or test bootstrap token).

## Open questions

None for v1 flat authorization.

## Readiness checklist

- [x] Business behavior approved / traceable for this slice (ADR-025)
- [x] No unresolved Open Decision that this story would silently resolve
- [x] Dependencies satisfied or explicitly accepted (US-018 first)
- [x] Acceptance criteria sufficient to implement

## Task elaboration

- [TASK-019-01](../tasks/TASK-019-01-jwt-auth-module.md) — Planned (depends TASK-018-01)
- [TASK-019-02](../tasks/TASK-019-02-protect-apis-flat-authz.md) — Planned
- [TASK-019-03](../tasks/TASK-019-03-web-login-and-session.md) — Planned
- [TASK-019-04](../tasks/TASK-019-04-auth-e2e-and-regression.md) — Planned
