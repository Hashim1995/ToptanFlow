# ADR-022: class-validator and class-transformer for Backend DTO and Environment Validation

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: `class-validator` and `class-transformer` are the libraries used for backend DTO (request/environment) validation inside NestJS (ADR-007). This closes the backend portion of the "Backend validation library inside NestJS" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`; the frontend portion was already resolved by ADR-017 (Zod, frontend boundary only). It does not change ADR-003 (backend as the authoritative source of validation, calculation, and business effects).

`class-validator`/`class-transformer` were already introduced in the NestJS backend technical foundation task to implement the explicitly requested global `ValidationPipe` (NestJS's built-in pipe is built on these two libraries) and startup environment-variable validation (`apps/api/src/config/env.validation.ts`). That task flagged this as touching the present Open Decision rather than resolving it silently. This ADR formally records the decision.

## Decision

- `class-validator` and `class-transformer` are used for:
  - Backend request DTO validation, enforced via NestJS's global `ValidationPipe` (`apps/api/src/bootstrap/configure-app.ts`).
  - Startup environment-variable validation (`apps/api/src/config/env.validation.ts`), via `ConfigModule`'s `validate` function.
- Zod remains frontend boundary validation only (ADR-017); it is not used on the backend. A Zod check passing on the frontend never guarantees a backend request succeeds, and the reverse substitution (using Zod backend-side) is likewise not adopted, to keep one library per side of the ADR-002 frontend/backend boundary.
- DTO/transport validation (is this field present, is it the right primitive type, does it satisfy a basic constraint such as length or enum membership) is a distinct concern from business-rule validation (calculations, permissions, workflow-state transitions, cross-field or cross-record rules). `class-validator` decorators on a DTO enforce only the former; the backend's own business logic — not the DTO — remains authoritative for the latter, per ADR-003 and `agents/backend-engineer.md`. A DTO passing validation is not equivalent to the request being business-valid.
- This ADR does not require every existing or future NestJS module to use `class-validator`; it establishes it as the approved library so a future task introducing DTOs does not need to re-litigate this choice.

## Consequences

- Backend Engineer tasks (`agents/backend-engineer.md`) that introduce request DTOs use `class-validator`/`class-transformer` decorators for transport-level validation, and implement business-rule validation separately in backend logic.
- This ADR removes the backend half of "Backend validation library inside NestJS" from the Known Open Decisions in `docs/technical/system-architecture.md`; the frontend half was already resolved by ADR-017.
- No change to the frontend/backend validation boundary already established by ADR-002, ADR-003, and ADR-017.

## Alternatives Considered

- **Joi:** Rejected. Would introduce a second, competing validation library alongside `class-validator`, which NestJS's own `ValidationPipe` already assumes and which the backend foundation already uses for environment validation; redundant without a documented reason.
- **Zod on the backend:** Rejected as the general-purpose backend choice. Zod is the explicitly Approved Human Decision for the frontend boundary only (ADR-017); using it backend-side as well would blur, rather than clarify, the frontend/backend validation boundary in ADR-002.
- **Manual, imperative validation only (no declarative library):** Rejected. Increases inconsistency across DTOs and does not integrate with NestJS's built-in `ValidationPipe` mechanism used for the global pipe already established in the backend foundation.
