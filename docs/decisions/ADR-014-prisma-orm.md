# ADR-014: Prisma ORM

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Prisma is the ORM used by the NestJS/TypeScript backend (ADR-007) to access PostgreSQL (ADR-008). This closes the "ORM or database access strategy" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It does not change the authority boundaries already established by ADR-003, ADR-004, or ADR-008.

## Decision

- Prisma is the ORM used by the backend to access the database.
- PostgreSQL remains the authoritative storage engine (ADR-008); Prisma is the access layer to it, not a replacement for it.
- Business rules stay in the backend application layer (ADR-003, ADR-007); Prisma models and queries implement data access and persistence, they do not independently decide validation, calculation, or business effects.
- Any data-integrity guarantee expressed through Prisma (e.g., a schema constraint) must remain traceable to a documented business rule or a Database Engineer decision (`agents/database-engineer.md`), consistent with ADR-008's prohibition on hidden, undocumented business logic.

This ADR does not define the Prisma schema; schema design remains a separate, future implementation task for the Database Engineer.

## Consequences

- All backend data access to PostgreSQL goes through Prisma; a second, competing data-access mechanism is not introduced without a documented reason and review.
- Database Engineer and Backend Engineer tasks (`agents/database-engineer.md`, `agents/backend-engineer.md`) use Prisma to implement schemas and queries that preserve immutability, auditability, and correction-link requirements already established in `docs/business/invariants.md` and ADR-004.
- This ADR removes "ORM or database access strategy" from the Known Open Decisions in `docs/technical/system-architecture.md`.
- Prisma schema design, migration workflow details beyond tooling selection, and query-organization conventions remain future implementation decisions.

## Alternatives Considered

- **TypeORM:** Rejected. Not the approved technology; introducing TypeORM instead of Prisma would contradict the explicit Approved Human Decision recorded in this ADR.
- **Raw SQL with a query builder (e.g., Knex):** Rejected. Not the approved technology; would also increase the risk of undocumented, ad hoc business logic embedded in queries rather than centralized in the backend's authoritative business layer.
- **No ORM (raw driver only):** Rejected. Not the approved technology; increases implementation risk for a business-critical ERP system requiring consistent, type-safe data access.
