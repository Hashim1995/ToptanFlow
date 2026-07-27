# ADR-021: Prisma Migrate for Database Migrations

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Prisma Migrate is the database migration tool for TOPTANFLOW, used with Prisma (ADR-014) against PostgreSQL (ADR-008). This closes the "migration tooling" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It does not change ADR-004's immutability requirements or `agents/database-engineer.md`'s migration-safety responsibilities.

## Decision

- Prisma Migrate is used to create and apply database schema migrations for TOPTANFLOW.
- Migrations are version-controlled, committed alongside the Prisma schema changes that produce them, so every schema change is traceable to a specific migration and, per `agents/database-engineer.md`, to a specific task.
- Migration safety, rollback or forward-fix strategy, and evaluation of destructive changes remain the Database Engineer's responsibility (`agents/database-engineer.md`) for each task; Prisma Migrate is the tool used to execute that responsibility, not a substitute for it.
- No destructive migration is applied without the explicit approval and strategy already required by `agents/database-engineer.md`.

This ADR does not define a specific migration workflow (e.g., exact branching, review, or deployment-order process); that remains a separate, future implementation detail.

## Consequences

- All schema changes to the PostgreSQL database are made through Prisma Migrate–generated, version-controlled migration files.
- Database Engineer tasks (`agents/database-engineer.md`) use Prisma Migrate to implement approved schema changes and document migration/rollback or forward-fix notes as already required by that role.
- This ADR removes "migration tooling" from the Known Open Decisions in `docs/technical/system-architecture.md`; exact migration workflow/process details remain a future, separate decision.

## Alternatives Considered

- **A standalone SQL migration tool (e.g., Flyway, node-pg-migrate):** Rejected. Not the approved technology; introducing a separate migration tool instead of Prisma Migrate would contradict the explicit Approved Human Decision recorded in this ADR, and would duplicate schema-definition effort already covered by Prisma.
- **Manual, unversioned schema changes:** Rejected. Directly conflicts with the auditability and traceability principles in `AGENTS.md` and ADR-004.
- **A different ORM's migration tool:** Rejected. Not applicable; Prisma is the approved ORM (ADR-014), and its own migration tool is the natural, approved counterpart.
