# ADR-011: Redux Toolkit Client State

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Redux Toolkit is used for client-side application state where shared client state is genuinely required. ADR-002 and ADR-003 already establish that the backend is authoritative for business facts and that the frontend never owns business logic. This ADR selects a tool for managing client-side presentation/session state; it does not grant the frontend, or Redux Toolkit specifically, any authority over business data.

## Decision

- Redux Toolkit is used where shared client-side application state is genuinely required (state needed by multiple, otherwise-unrelated parts of the UI).
- It may support cross-screen UI state or session state (e.g., current user context, UI preferences, in-progress multi-step form state shared across screens).
- Redux Toolkit must not become the authoritative store for business facts; backend-confirmed data (per ADR-003) remains authoritative regardless of what is cached or mirrored in client state.
- Temporary, draft, cached, or optimistic state held in Redux Toolkit must be clearly distinguishable from backend-confirmed state, consistent with `agents/frontend-engineer.md`'s requirement to avoid optimistic business effects without explicit approval and to distinguish draft/provisional/posted/cancelled/reversed/closed states clearly.
- Local component state should remain local (e.g., `useState` or equivalent) when global state is not genuinely necessary; Redux Toolkit is not a default for all state.
- Redux Toolkit must not be used automatically for every form field or every server response; its use is scoped to state that is actually shared across otherwise-unrelated parts of the UI.
- This ADR does not decide the server-state strategy (e.g., a dedicated data-fetching/caching library) unless already explicitly approved elsewhere; server-state handling remains a separate, future decision.

This ADR does not select Redux persistence, middleware, server-state libraries, or slice structure.

## Consequences

- Frontend Engineer tasks (`agents/frontend-engineer.md`) introduce a Redux Toolkit slice only when state is genuinely shared across otherwise-unrelated screens or components, not as a default pattern for all data.
- Any state held in Redux Toolkit that mirrors backend data must be treated as a cache, not a source of truth; a stale or conflicting Redux value never overrides a fresh backend response.
- This ADR does not resolve server-state strategy, persistence, or middleware choices; those remain Open Decisions tracked in `docs/technical/system-architecture.md` ("Known Open Decisions") until separately approved.

## Alternatives Considered

- **React Context for all shared state:** Rejected as the sole mechanism. Not the approved technology for this purpose; Context alone does not provide the structured state-update and debugging tooling the Approved Human Decision assumes for genuinely shared application state.
- **A different global state library:** Rejected. Not the approved technology; introducing a different state library would contradict the explicit Approved Human Decision recorded in this ADR.
- **No shared-state library:** Rejected. Some cross-screen UI/session state is expected in a workflow-heavy ERP frontend; managing it entirely through prop-drilling or ad hoc mechanisms would conflict with the maintainability expectations implied by the Approved Human Decision.
- **Storing all server data permanently in Redux:** Rejected. Would risk Redux Toolkit becoming a de facto second source of business truth, directly conflicting with ADR-003's requirement that the backend remains authoritative.
