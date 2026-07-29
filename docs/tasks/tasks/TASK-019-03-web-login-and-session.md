# TASK-019-03: Web login and session

## Metadata

- **Task ID:** TASK-019-03
- **Title:** Web login screen and session handling
- **Parent User Story:** [US-019](../stories/US-019-authentication-authorization.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Planned
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

- [ ] AZ labels; no raw enum/API leakage
- [ ] Access token not in localStorage
- [ ] Refresh keeps session within 30d cookie life

## Evidence

(To be filled)

## Result

(To be filled)
