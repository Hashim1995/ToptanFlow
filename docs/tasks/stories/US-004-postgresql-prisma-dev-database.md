# US-004: Establish PostgreSQL development database and Prisma Migrate

- **ID:** US-004
- **Title:** Establish PostgreSQL development database and Prisma Migrate
- **Parent Epic:** [EPIC-002](../epics/EPIC-002-backend-platform-foundation.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** N/A (technical enabler)

## Statement

Technical enabler: provide PostgreSQL + Prisma Migrate development path.

## Business value

Durable datastore for domain work.

## High-level scope

Prisma setup; dev database establishment; migrate workflow docs/config.

## High-level acceptance criteria

- Prisma configured for PostgreSQL
- Development database path documented/usable

## Dependencies

US-003; ADR-008/014/021.

## Related domain rules

N/A.

## Related ADRs / docs

ADR-008, ADR-014, ADR-021; docs/technical/database-development.md.

## Known risks

Environment-specific apply state varies.

## Open questions

Exact production backup/deploy still open.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-004-01-establish-postgres-prisma](../tasks/TASK-004-01-establish-postgres-prisma.md)
