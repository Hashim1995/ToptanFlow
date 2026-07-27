# ADR-010: Axios HTTP Client

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Axios is used by the frontend for HTTP communication with the backend. ADR-002 establishes that the frontend never owns business logic and that the backend is reached through a defined interface; ADR-003 establishes the backend as authoritative. This ADR selects the transport mechanism used to reach that backend interface; it grants Axios no business authority.

## Decision

- Axios is used by the frontend for HTTP communication with the backend API.
- Axios is a transport utility only: it moves requests and responses between frontend and backend and holds no business decision-making authority, consistent with ADR-002 and ADR-003.
- Shared HTTP concerns implemented around Axios may include: base URL handling, authentication headers, request cancellation, response normalization, and technical error classification (e.g., network vs. server vs. validation error).
- Raw backend error payloads must not be shown directly to users; per ADR-005 and `docs/technical/ui-requirements.md`, they must be mapped to Azerbaijani user-facing messages before display.
- User-facing error presentation remains Azerbaijani and follows `docs/technical/ui-requirements.md`; Axios-level error classification is a technical concern only, feeding that presentation, not replacing it.
- Retry behavior implemented at the transport layer must never create duplicate business effects (e.g., a retried request must not result in a duplicate posting).
- Idempotency requirements remain backend-authoritative, per ADR-003; Axios-level retry logic does not decide idempotency, it only respects what the backend guarantees.

This ADR does not define exact interceptors, folder structure, retry policy, or authentication flow; those remain separate, future implementation decisions.

## Consequences

- All frontend-to-backend HTTP communication goes through Axios; introducing a second HTTP client for the same purpose requires a documented reason and review.
- Frontend Engineer tasks (`agents/frontend-engineer.md`) implement backend-error-to-Azerbaijani-message mapping using Axios's response/error handling as the technical entry point, not as the source of the message text.
- This ADR does not resolve interceptor design, retry policy, or authentication-flow implementation; those remain Open Decisions tracked in `docs/technical/system-architecture.md` ("Known Open Decisions") until separately approved.

## Alternatives Considered

- **Native fetch used directly throughout the application:** Rejected. Not the approved technology; introducing native `fetch` as the primary mechanism instead of Axios would contradict the explicit Approved Human Decision recorded in this ADR.
- **Multiple HTTP libraries:** Rejected. Would fragment error handling, retry behavior, and request/response normalization, increasing the risk of inconsistent Azerbaijani error presentation and inconsistent idempotency handling.
- **A generated client as the only transport mechanism:** Rejected as the sole mechanism by this ADR; contract-generation strategy is a separate, unresolved technical decision (see `docs/technical/system-architecture.md`, "Known Open Decisions") and is not decided here.
