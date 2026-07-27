# ADR-007: NestJS and TypeScript Backend

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: the TOPTANFLOW backend API uses NestJS with TypeScript. ADR-003 ("Backend as the Authoritative Source...") already establishes that the backend owns validation, calculation, permissions, and business rules; ADR-004 ("Business Immutability") already establishes that posted facts are corrected only through new, linked actions. This ADR selects the concrete technology used to implement that authoritative backend; it does not alter either prior decision.

## Decision

- NestJS is used for the backend API.
- TypeScript is required for all backend source code.
- The backend owns authoritative validation, calculation, permission enforcement, workflow transitions, and business effects, consistent with ADR-003 and ADR-004.
- Module boundaries inside the backend must follow business capabilities (as mapped in `docs/business/workflow-map.md` and `docs/analysis/01-document-analysis.md`), rather than arbitrary technical grouping.
- The backend application must remain independently buildable and deployable, consistent with ADR-001 and ADR-002.
- NestJS conventions (e.g., module structure, decorators, dependency injection patterns) must not override business invariants or transaction requirements already established in `docs/business/invariants.md` and ADR-004; where a NestJS convention would conflict with a business rule, the business rule governs.

This ADR does not select an ORM, authentication strategy, API style, queue system, or deployment platform; those remain separate, future implementation decisions.

## Consequences

- All new backend code is written in TypeScript on NestJS; module boundaries are reviewed against business capability, not technical convenience, per `agents/solution-architect.md` and `agents/code-reviewer.md`.
- Backend Engineer tasks (`agents/backend-engineer.md`) are scoped to NestJS/TypeScript implementation within the boundaries already set by ADR-002, ADR-003, and ADR-004.
- Choice of NestJS does not resolve the Open Decisions on ORM/database-access strategy, API style/contract generation, authentication, or authorization implementation details (see `docs/technical/system-architecture.md`, "Known Open Decisions"); those remain unresolved by this ADR.
- Any future task introducing an ORM, authentication mechanism, or API style must reference this ADR and, if it introduces a material architectural change, may require its own ADR.

## Alternatives Considered

- **Unstructured Node.js application:** Rejected. Not the approved technology; lacks the enforced module/DI structure the Approved Human Decision assumes for mapping business capabilities to code.
- **Another backend framework:** Rejected. Not the approved technology; introducing a different framework would contradict the explicit Approved Human Decision recorded in this ADR.
- **JavaScript without TypeScript:** Rejected. TypeScript is explicitly required by the Approved Human Decision; plain JavaScript would remove the type-safety guarantees the decision intends to provide across authoritative business logic.
