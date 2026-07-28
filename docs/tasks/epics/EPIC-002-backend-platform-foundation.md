# EPIC-002: Backend platform foundation

- **ID:** EPIC-002
- **Title:** Backend platform foundation
- **Status:** Done

## Business objective

Deliver runnable NestJS API with PostgreSQL/Prisma, validation, OpenAPI, health, and shared utilities.

## User / business value

Shared safe technical base for all domain modules.

## Scope

apps/api NestJS; Prisma; health; bootstrap/swagger; env validation; common filters/pagination.

## Exclusions

Domain posting; authentication mechanism; product UI.

## Dependencies

EPIC-001.

## Related ADRs / docs

ADR-007, ADR-008, ADR-012–015, ADR-018–023; docs/technical/database-development.md.

## Child user stories

- US-003
- US-004

## Completion definition

API platform boots with health, Prisma migrate path, OpenAPI/validation conventions.

## Known risks

Auth/deploy/observability still open.

## Open questions

Authentication implementation; deployment providers; logging/monitoring.

## Repository evidence

Commits c20d8af, b5243d4/fb53909; apps/api/src/{bootstrap,health,config,common,prisma}.
