# ADR-015: REST API with OpenAPI Documentation

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: the TOPTANFLOW backend API (ADR-007) uses REST as its API style, documented with OpenAPI. This closes the "API style" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It does not change the backend's authority over validation, calculation, or business effects, already established by ADR-003.

## Decision

- REST is the API style used by the backend (`apps/api/`, per `docs/technical/repository-structure.md`) to expose functionality to the frontend and any other authorized consumer.
- OpenAPI is used to document the REST API's contracts.
- GraphQL is not used for the TOPTANFLOW API.
- OpenAPI documentation describes the shape of requests and responses; it does not become a second source of business truth, consistent with `docs/technical/system-architecture.md` ("Shared Contracts") — the backend's runtime validation and calculation remain authoritative regardless of what is documented.

This ADR does not design specific endpoints, resource naming, versioning strategy, or response envelopes; those remain separate, future implementation decisions.

## Consequences

- All backend-exposed functionality is implemented as REST endpoints, documented in OpenAPI.
- Backend Engineer tasks (`agents/backend-engineer.md`) document each new or changed endpoint in OpenAPI as part of implementation.
- Any tooling that generates a frontend client or type definitions from the OpenAPI specification remains a separate, future decision and does not, by itself, become authoritative over backend validation (ADR-003).
- This ADR removes "API style" from the Known Open Decisions in `docs/technical/system-architecture.md`; OpenAPI contract-generation tooling (e.g., automatic client generation) remains open.

## Alternatives Considered

- **GraphQL:** Rejected. Not the approved technology; introducing GraphQL instead of REST would contradict the explicit Approved Human Decision recorded in this ADR.
- **RPC-style API (e.g., gRPC, tRPC):** Rejected. Not the approved technology; REST with OpenAPI is the explicitly Approved Human Decision.
- **No formal API documentation:** Rejected. Would leave the frontend/backend contract undocumented, increasing the risk of drift and inconsistent understanding across Frontend Engineer, Backend Engineer, and QA Engineer roles.
