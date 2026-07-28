# EPIC-006: Business partners backend

- **ID:** EPIC-006
- **Title:** Business partners backend
- **Status:** In Progress

## Business objective

Unified BusinessPartner master-data APIs (customer and/or supplier).

## User / business value

Counterparties required before purchasing, sales, settlement.

## Scope

Persistence; create/read; upcoming update/deactivate; later Yellow Card/statement stories.

## Exclusions

Partner statement engine; WhatsApp consent; settlement balances; frontend UI.

## Dependencies

EPIC-004; TECH-001 for automatic codes.

## Related ADRs / docs

invariants Business Partners; ADR-024.

## Child user stories

- US-013
- US-014
- US-015
- US-016
- US-017

## Completion definition

Create/read Done (US-014); update/deactivate Done (US-015); duplicate soft-flag activated as US-016; statement/Yellow Card (US-017) not started.

## Known risks

Duplicate soft-flag not fully productized.

## Open questions

Yellow Card override (BRD-OD-19); WhatsApp consent (BRD-OD-17).

## Repository evidence

Commits 24a527a, bf0f1dc; apps/api/src/business-partners; migration refine_business_partner.
