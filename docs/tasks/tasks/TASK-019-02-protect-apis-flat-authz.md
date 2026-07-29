# TASK-019-02: Protect APIs with flat authz

## Metadata

- **Task ID:** TASK-019-02
- **Title:** Protect APIs with flat authenticated-active authz
- **Parent User Story:** [US-019](../stories/US-019-authentication-authorization.md)
- **Parent Epic:** [EPIC-007](../epics/EPIC-007-identity-authz.md)
- **Status:** Planned
- **Type:** Backend / Security
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-019-01

## Objective

Global (or module) JWT guard: unauthenticated → 401; inactive → denied;
authenticated active user may call all v1 business APIs (ADR-025).

## Scope

- Nest AuthGuard / strategy wiring
- Public routes: health, auth login/refresh, swagger if desired in dev
- Update existing e2e helpers to authenticate

## Out of scope

Permission matrices; frontend.

## Acceptance criteria

- [ ] Master-data mutations require auth
- [ ] Any active user succeeds equally (no role checks)
- [ ] Existing e2e still green with auth helper

## Evidence

(To be filled)

## Result

(To be filled)
