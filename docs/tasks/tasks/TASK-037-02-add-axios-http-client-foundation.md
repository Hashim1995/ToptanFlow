# TASK-037-02: Add Axios HTTP client foundation

## Metadata

- **Task ID:** TASK-037-02
- **Title:** Add Axios HTTP client foundation
- **Parent User Story:** [US-037](../stories/US-037-frontend-shell-foundation.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-037-01

## Objective

Introduce a shared Axios instance for `apps/web` (ADR-010) with env-based API base URL and a stub path for Azerbaijani error mapping.

## Scope

- Shared Axios client module
- `VITE_API_BASE_URL` via `.env.example`
- Technical classification of network vs HTTP errors; stub mapper (no full catalog)
- No domain endpoint modules yet

## Out of scope

- Auth headers / refresh (US-019)
- Automatic retries that could duplicate posts
- Feature API hooks (US-038+)
- Routing/shell layout (TASK-037-03)

## Acceptance criteria

- [x] Single shared Axios instance used as the HTTP transport baseline
- [x] Base URL configurable for local API
- [x] Stub error-mapping helper exists (Azerbaijani-oriented; may be minimal)
- [x] Build remains green

## Implementation notes

No retry interceptor. Default base URL `http://localhost:3000/api/v1` when env unset.

## Documentation impact

`apps/web/.env.example`

## Testing expectations

Build smoke.

## Validation expectations

`yarn workspace web build` green.

## Risks

Env naming — documented as `VITE_API_BASE_URL`.

## Assumptions

Backend remains source of truth; client only transports.

## Evidence

- `apps/web/src/api/http-client.ts`
- `apps/web/src/api/map-api-error.ts`
- `apps/web/src/api/api-error.types.ts`
- `apps/web/.env.example`
- `apps/web/src/vite-env.d.ts`
- Validation: `yarn workspace web build` → success

## Result

Done. Shared Axios client + stub Azerbaijani error mapper. Next: TASK-037-03.

## Completion date

2026-07-29
