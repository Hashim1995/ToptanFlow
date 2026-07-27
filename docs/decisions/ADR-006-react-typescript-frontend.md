# ADR-006: React and TypeScript Frontend

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: the TOPTANFLOW frontend application uses React with TypeScript. ADR-002 ("Independent Frontend and Backend, Frontend Never Owns Business Logic") already establishes that the frontend is a presentation layer with no authority over business behavior, and ADR-005 ("Azerbaijani-First Responsive User Interface") already establishes the language and responsive requirements the frontend must satisfy. This ADR selects the concrete technology used to build that presentation layer; it does not alter either prior decision.

## Decision

- React is used for the browser-based frontend application.
- TypeScript is required for all frontend source code.
- The frontend remains a presentation and interaction layer, consistent with ADR-002: it renders workflows, collects input, and displays backend-confirmed results.
- Business-authoritative calculations, validation, permissions, and posting decisions remain on the backend, per ADR-003; React is a rendering technology and grants no new authority over these decisions.
- React must not be used as justification for placing business logic in the client (e.g., "it's easier to calculate this in a component").
- The frontend must follow ADR-005 and `docs/technical/ui-requirements.md` for all language and responsive-layout behavior.
- The frontend application must be independently buildable and deployable inside the monorepo, consistent with ADR-001 and ADR-002.

This ADR does not select a specific React meta-framework (e.g., a server-rendering framework) or build tool; those remain separate, future implementation decisions.

## Consequences

- All new frontend code is written in TypeScript; untyped JavaScript is not an acceptable substitute for frontend application code.
- Frontend Engineer tasks (`agents/frontend-engineer.md`) are scoped to React/TypeScript implementation within the boundaries already set by ADR-002, ADR-003, and ADR-005.
- Choice of React does not resolve the Open Decisions on frontend build tooling or monorepo workspace tooling (see `docs/technical/system-architecture.md`, "Known Open Decisions"); those remain unresolved by this ADR.
- Any future task introducing a meta-framework or build tool must reference this ADR and, if it introduces a material architectural change, may require its own ADR.

## Alternatives Considered

- **Server-rendered templates without a React application:** Rejected. Does not match the Approved Human Decision and would require a different interaction model than the one already assumed by ADR-005's responsive, mobile-first UI requirements.
- **Another SPA framework:** Rejected. Not the approved technology; introducing a different framework would contradict the explicit Approved Human Decision recorded in this ADR.
- **Plain JavaScript without TypeScript:** Rejected. TypeScript is explicitly required by the Approved Human Decision; plain JavaScript would remove the type-safety guarantees the decision intends to provide across a business-critical ERP frontend.
