# US-003: Establish NestJS backend technical foundation

- **ID:** US-003
- **Title:** Establish NestJS backend technical foundation
- **Parent Epic:** [EPIC-002](../epics/EPIC-002-backend-platform-foundation.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** N/A (technical enabler)

## Statement

Technical enabler: create apps/api NestJS application with validation, OpenAPI bootstrap, and shared conventions.

## Business value

Runnable API host for domain modules.

## High-level scope

NestJS app module/main; bootstrap; swagger; common utilities; health module baseline.

## High-level acceptance criteria

- API application structure exists under apps/api
- OpenAPI/validation conventions present

## Dependencies

US-002; ADR-007/015/022.

## Related domain rules

N/A (platform).

## Related ADRs / docs

ADR-007, ADR-015, ADR-019, ADR-022.

## Known risks

None material.

## Open questions

Auth still open (out of scope).

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-003-01-establish-nestjs-api-foundation](../tasks/TASK-003-01-establish-nestjs-api-foundation.md)
