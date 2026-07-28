# US-013: Refine BusinessPartner persistence model

- **ID:** US-013
- **Title:** Refine BusinessPartner persistence model
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** N/A (technical enabler)
- **Legacy reference:** Step 16.1

## Statement

Technical enabler: refine BusinessPartner schema for unified customer/supplier partner with default currency.

## Business value

Correct partner shape before APIs.

## High-level scope

Migration refine_business_partner_persistence_model.

## High-level acceptance criteria

- Persistence supports unified partner roles and defaultCurrency
- Migration exists

## Dependencies

US-008.

## Related domain rules

invariants Business Partners.

## Related ADRs / docs

ADR-014/021.

## Known risks

None.

## Open questions

None.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-013-01-refine-business-partner-persistence](../tasks/TASK-013-01-refine-business-partner-persistence.md)
