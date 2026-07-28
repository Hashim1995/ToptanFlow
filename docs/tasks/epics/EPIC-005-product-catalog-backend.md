# EPIC-005: Product catalog backend

- **ID:** EPIC-005
- **Title:** Product catalog backend
- **Status:** Done

## Business objective

Product persistence and create/read/update/deactivate APIs with integration coverage.

## User / business value

Catalog foundation for purchasing, sales, inventory.

## Scope

Product model refinement; REST APIs; tests; later code allocation via TECH-001.

## Exclusions

Category master entity; critical-stock engines; frontend; bundles.

## Dependencies

EPIC-004; TECH-001 completed after initial create APIs.

## Related ADRs / docs

invariants Products; ADR-024; terminology Product.

## Child user stories

- US-009
- US-010
- US-011
- US-012

## Completion definition

Product REST APIs + unit/e2e tests + persistence migrations.

## Known risks

Category is a string field; critical stock not implemented.

## Open questions

AD-01 unit conversion; AD-03 historical category attribution.

## Repository evidence

Commits 86a9954, be96eb4, 1b02537, 216b808; apps/api/src/products.
