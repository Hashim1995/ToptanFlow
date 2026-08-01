# TASK-019-01: JWT auth module

## Metadata

- **Task ID:** TASK-019-01
- **Title:** JWT auth module (login / refresh / logout)
- **Parent User Story:** [US-019](../stories/US-019-authentication-authorization.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
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

- [x] TTLs match ADR-025 (24h / 30d)
- [x] Refresh rotates and old token revoked
- [x] Password never logged or returned

## Evidence

- Migration: `apps/api/prisma/migrations/20260729204607_add_refresh_token/`
- Module: `apps/api/src/auth/`
- Env: `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_DAYS`, `REFRESH_COOKIE_NAME`
- cookie-parser wired in `configure-app.ts`
- Unit tests: `auth.service.spec.ts` + `refresh-token.util.spec.ts` — **8 passed**
- `yarn workspace api lint` / `build` green

## Result

Done. Next: TASK-019-02 (protect APIs with JWT guard).

## Completion date

2026-07-30
