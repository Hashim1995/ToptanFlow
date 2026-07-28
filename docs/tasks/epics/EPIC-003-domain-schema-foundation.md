# EPIC-003: Initial domain schema foundation

- **ID:** EPIC-003
- **Title:** Initial domain schema foundation
- **Status:** Done

## Business objective

Establish structural Prisma models for core entities without implementing posting behavior.

## User / business value

Durable shared shape for later module APIs.

## Scope

Initial schema + first migration; relations/indexes only.

## Exclusions

HTTP APIs for Sale/Purchase/Cash; warehouses; auth credentials; full audit log entity.

## Dependencies

EPIC-002.

## Related ADRs / docs

docs/business/*; ADR-014, ADR-020, ADR-021, ADR-023.

## Child user stories

- US-005

## Completion definition

Initial domain migration exists with documented exclusions.

## Known risks

Structural models must not be mistaken for completed APIs.

## Open questions

Document numbering (OD-01); multiple money/settlement open decisions.

## Repository evidence

Commit f2fd657; migration 20260728093405_initial_domain_model.
