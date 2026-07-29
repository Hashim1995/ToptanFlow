# TASK-019-03: Web login and session

## Metadata

- **Task ID:** TASK-019-03
- **Title:** Web login screen and session handling
- **Parent User Story:** [US-019](../stories/US-019-authentication-authorization.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-019-01

## Objective

Azerbaijani login page; in-memory access token; refresh via httpOnly cookie;
route gate for app shell (ADR-005 / ADR-025).

## Scope

- Login form (username / password)
- Axios interceptors for Bearer + refresh retry
- Redirect unauthenticated users to login
- Logout clears session

## Out of scope

Role-based UI hiding; user admin screens (optional follow-up).

## Acceptance criteria

- [x] AZ labels; no raw enum/API leakage
- [x] Access token not in localStorage
- [x] Refresh keeps session within 30d cookie life

## Evidence

- Feature: `apps/web/src/features/auth/` (login page, session, AuthProvider, RequireAuth)
- HTTP: `withCredentials` + Bearer interceptor + single refresh retry (`http-client.ts`)
- Shell logout + display name; route gate in `App.tsx`
- `yarn workspace web` lint / test (33) / build green

## Result

Done 2026-07-30. Authenticated app shell; unauthenticated users redirected to `/login`.
