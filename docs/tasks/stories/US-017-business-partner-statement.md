# US-017: Business partner statement

- **ID:** US-017
- **Title:** Business partner statement
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Planned
- **Priority:** Medium
- **Business actor:** Controller / Accounting view / Manager

## Statement

As a controller, I want a business partner statement listing movements chronologically with separate receivable and payable closings, so that I can see obligations without illegal netting.

## Business value

Core settlement/reporting view for partners.

## High-level scope

Statement aggregation from posted sales/purchases/cash/advances/adjustments once those exist.

## High-level acceptance criteria

- Chronological source-linked list
- Separate receivable and payable closings
- No illegal netting

## Dependencies

EPIC-009–012 posting capabilities.

## Related domain rules

invariants Business Partners statement bullet; Receivables & Payables.

## Related ADRs / docs

workflow-map Business Partner Statement.

## Known risks

Cannot be built before transactional postings exist.

## Open questions

Mutual offset open (BRD-OD-11) must not be invented.

## Readiness checklist

- [ ] Business behavior approved / traceable for this slice
- [ ] No unresolved Open Decision that this story would silently resolve
- [ ] Dependencies satisfied or explicitly accepted
- [ ] Acceptance criteria sufficient to implement

## Task elaboration

Deferred until activation
