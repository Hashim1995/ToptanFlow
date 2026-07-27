# ADR-016: TanStack Query for Server State

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: TanStack Query manages server state in the frontend application. This closes the "server-state strategy" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It refines, and does not conflict with, ADR-011 (Redux Toolkit for client state) or ADR-003 (backend as the authoritative source of business behavior).

## Decision

- TanStack Query manages server state in the frontend: fetching, caching, synchronizing, and updating data obtained from the backend API (ADR-007, ADR-010) via Axios (ADR-010).
- Redux Toolkit (ADR-011) remains scoped to client-side UI state and session state only (e.g., current user context, UI preferences, cross-screen UI state); it does not duplicate TanStack Query's role of caching backend-confirmed data.
- The backend remains the authoritative source of business behavior and data (ADR-003); TanStack Query's cache is a presentation-layer cache of backend-confirmed data, never a source of truth that overrides a fresh backend response.
- Server-state cache invalidation and refetching must be used in a way that reflects backend-confirmed state promptly after a business action (e.g., a posting), consistent with `docs/technical/ui-requirements.md`'s requirement to distinguish draft/provisional/posted states clearly.

## Consequences

- All fetching and caching of backend-confirmed data in the frontend uses TanStack Query; Redux Toolkit is not used as a substitute for server-state caching.
- Frontend Engineer tasks (`agents/frontend-engineer.md`) use TanStack Query for data-fetching workflows and reserve Redux Toolkit for genuinely shared client/UI state, per ADR-011.
- This ADR removes "server-state strategy" from the Known Open Decisions in `docs/technical/system-architecture.md`.
- Exact query-key conventions, cache-time configuration, and retry policy remain implementation details for future tasks, subject to ADR-010's requirement that retries never create duplicate business effects.

## Alternatives Considered

- **Using Redux Toolkit for server state as well as client state:** Rejected. Risks Redux Toolkit becoming a de facto second source of business truth, which ADR-011 already forbids.
- **SWR:** Rejected. Not the approved technology; introducing SWR instead of TanStack Query would contradict the explicit Approved Human Decision recorded in this ADR.
- **No dedicated server-state library (manual fetch/cache management):** Rejected. Increases the risk of inconsistent caching and stale-data handling across a workflow-heavy ERP frontend.
