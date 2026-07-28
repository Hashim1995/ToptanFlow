# US-010: Product create and read APIs

- **ID:** US-010
- **Title:** Product create and read APIs
- **Parent Epic:** [EPIC-005](../epics/EPIC-005-product-catalog-backend.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Catalog maintainer

## Statement

As a catalog maintainer, I want to create and read products via API, so that the product catalog can be populated and queried.

## Business value

Catalog create/read capability.

## High-level scope

POST/GET list/GET by id; DTOs; service; tests. Code field later backend-generated (TECH-001).

## High-level acceptance criteria

- Create and read endpoints work with validation
- Responses expose product fields including code

## Dependencies

US-009.

## Related domain rules

invariants Products.

## Related ADRs / docs

ADR-015/022; later ADR-024.

## Known risks

Initial version accepted client code; superseded by TECH-001.

## Open questions

None remaining for create/read scope.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-010-01-add-product-create-read-apis](../tasks/TASK-010-01-add-product-create-read-apis.md)
