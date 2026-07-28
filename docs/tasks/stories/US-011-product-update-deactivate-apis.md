# US-011: Product update and deactivation APIs

- **ID:** US-011
- **Title:** Product update and deactivation APIs
- **Parent Epic:** [EPIC-005](../epics/EPIC-005-product-catalog-backend.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Catalog maintainer

## Statement

As a catalog maintainer, I want to update products and deactivate used products, so that catalog data stays current without hard deletes.

## Business value

Inactivation instead of delete per invariants.

## High-level scope

PATCH update; DELETE/deactivate path; immutability of code after TECH-001.

## High-level acceptance criteria

- Update works without hard delete
- Deactivation preserves history
- code not editable

## Dependencies

US-010.

## Related domain rules

invariants Products (inactivate, not delete; code immutable).

## Related ADRs / docs

ADR-024.

## Known risks

None material.

## Open questions

None.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-011-01-add-product-update-deactivate-apis](../tasks/TASK-011-01-add-product-update-deactivate-apis.md)
