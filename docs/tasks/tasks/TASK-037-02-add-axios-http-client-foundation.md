# TASK-037-02: Add Axios HTTP client foundation

## Metadata

- **Task ID:** TASK-037-02
- **Title:** Add Axios HTTP client foundation
- **Parent User Story:** [US-037](../stories/US-037-frontend-shell-foundation.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Ready
- **Type:** Frontend
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-037-01

## Objective

Introduce a shared Axios instance for `apps/web` (ADR-010) with env-based API base URL and a stub path for Azerbaijani error mapping.

## Scope

- Shared Axios client module
- `VITE_API_BASE_URL` (or equivalent) documented via `.env.example` if repo pattern allows
- Technical classification of network vs HTTP errors; stub mapper (no full catalog)
- No domain endpoint modules yet

## Out of scope

- Auth headers / refresh (US-019)
- Automatic retries that could duplicate posts
- Feature API hooks (US-038+)
- Routing/shell layout (TASK-037-03)

## Acceptance criteria

- [ ] Single shared Axios instance used as the HTTP transport baseline
- [ ] Base URL configurable for local API
- [ ] Stub error-mapping helper exists (Azerbaijani-oriented; may be minimal)
- [ ] Build remains green

## Implementation notes

Keep client free of business rules (ADR-003). Do not invent idempotency/retry policy.

## Documentation impact

Optional `.env.example` note for web.

## Testing expectations

Build smoke; unit test for stub mapper optional.

## Validation expectations

Build green.

## Risks

Env naming inconsistency with backend — align with existing docs if any.

## Assumptions

Backend remains source of truth; client only transports.

## Evidence

(To be filled when Done.)

## Result

(To be filled when Done.)
