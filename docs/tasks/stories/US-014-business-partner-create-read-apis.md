# US-014: BusinessPartner create and read APIs

- **ID:** US-014
- **Title:** BusinessPartner create and read APIs
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Master-data maintainer / Sales or Purchasing officer
- **Legacy reference:** Step 16.2

## Statement

As a master-data maintainer, I want to create and read unified business partners via API, so that customers and suppliers share one partner record with separate role flags.

## Business value

Counterparty master data for later documents.

## High-level scope

POST/GET list/GET by id; role flags; defaultCurrency; tests. Codes via TECH-001.

## High-level acceptance criteria

- Create requires at least one role
- List/get supported with filters
- code backend-generated and returned

## Dependencies

US-013; TECH-001 for final code behavior.

## Related domain rules

invariants Business Partners.

## Related ADRs / docs

ADR-015/022/024.

## Known risks

Update/deactivate not included.

## Open questions

None for create/read.

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No unresolved Open Decision silently resolved by this story
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient (for delivered scope)

## Task elaboration

Elaborated:
- [TASK-014-01-add-business-partner-create-read-apis](../tasks/TASK-014-01-add-business-partner-create-read-apis.md)
