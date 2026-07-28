# US-015: BusinessPartner update and deactivation APIs

- **ID:** US-015
- **Title:** BusinessPartner update and deactivation APIs
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Ready
- **Priority:** High
- **Business actor:** Master-data maintainer
- **Legacy reference:** Step 16.3

## Statement

As a master-data maintainer, I want to update partners and deactivate them without hard delete, so that historical documents remain coherent and codes are never reused.

## Business value

Completes partner master-data lifecycle parity with Product.

## High-level scope

Update DTO without code; deactivate endpoint; inactive partners blocked from new documents (when documents exist); tests.

## High-level acceptance criteria

- Partner fields updatable except immutable code
- Deactivation (no hard delete)
- code rejected on update bodies
- Tests cover happy path and immutability

## Dependencies

US-014 Done; TECH-001 Done.

## Related domain rules

invariants Business Partners (inactivate; code immutable).

## Related ADRs / docs

ADR-024; controller note referencing Step 16.3.

## Known risks

Duplicate soft-flag UX not in this story.

## Open questions

Exact inactive-partner enforcement on future documents awaits those modules.

## Readiness checklist

- [x] Business behavior approved / traceable for update/deactivate + code immutability
- [x] Depends on US-014 and TECH-001
- [ ] Implementation tasks elaborated at activation
- [ ] Acceptance criteria refined against current controllers

## Task elaboration

Deferred until activation
