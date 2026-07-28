# US-006: Unit reference data module

- **ID:** US-006
- **Title:** Unit reference data module
- **Parent Epic:** [EPIC-004](../epics/EPIC-004-currency-unit-reference-data.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Operations / master-data maintainer

## Statement

As an operations user, I want units of measure managed via API, so that products reference approved units.

## Business value

Required for Product primary unit.

## High-level scope

Unit create/list/get/update/deactivate APIs + tests.

## High-level acceptance criteria

- Unit REST API available
- Inactive units cannot be newly assigned where enforced by consumers

## Dependencies

US-005.

## Related domain rules

invariants Products (primary unit); terminology Unit.

## Related ADRs / docs

ADR-007/015/022.

## Known risks

None material.

## Open questions

None for delivered slice.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-006-01-add-unit-reference-module](../tasks/TASK-006-01-add-unit-reference-module.md)
