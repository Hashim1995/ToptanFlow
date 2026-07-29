# TASK-019-01: JWT auth module

## Metadata

- **Task ID:** TASK-019-01
- **Title:** JWT auth module (login / refresh / logout)
- **Parent User Story:** [US-019](../stories/US-019-authentication-authorization.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Planned
- **Type:** Backend / Security
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-018-01; ADR-025

## Objective

Implement Nest auth module: Argon2id verify, JWT access (24h), rotating refresh
(30d) with stored hash, httpOnly refresh cookie, login/refresh/logout.

## Scope

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- RefreshToken persistence (hash + expiry + revoke)
- Env secrets for JWT signing
- Inactive user rejected

## Out of scope

Role claims; frontend; protecting all routes (TASK-019-02).

## Acceptance criteria

- [ ] TTLs match ADR-025 (24h / 30d)
- [ ] Refresh rotates and old token revoked
- [ ] Password never logged or returned

## Evidence

(To be filled)

## Result

(To be filled)
