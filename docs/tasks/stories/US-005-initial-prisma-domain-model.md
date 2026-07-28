# US-005: Establish initial Prisma domain model

- **ID:** US-005
- **Title:** Establish initial Prisma domain model
- **Parent Epic:** [EPIC-003](../epics/EPIC-003-domain-schema-foundation.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** N/A (technical enabler)

## Statement

Technical enabler: persist structural models for products, partners, sales/purchases shells, cash shells, currencies, units, minimal user.

## Business value

Shared schema foundation without inventing posting APIs.

## High-level scope

Initial schema + migration; documented exclusions (inventory, settlement entities, auth, etc.).

## High-level acceptance criteria

- Initial migration exists
- Schema comments document deliberate exclusions
- No claim that transactional APIs are Done

## Dependencies

US-004.

## Related domain rules

docs/business/invariants.md structural needs.

## Related ADRs / docs

ADR-014, ADR-020, ADR-021, ADR-023.

## Known risks

Later refinements expected per module.

## Open questions

Several open decisions intentionally not encoded as business rules.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-005-01-establish-initial-domain-schema](../tasks/TASK-005-01-establish-initial-domain-schema.md)
