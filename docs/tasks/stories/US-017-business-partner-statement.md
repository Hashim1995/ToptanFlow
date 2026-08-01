# US-017: Business partner statement

- **ID:** US-017
- **Title:** Business partner statement
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Deferred
- **Priority:** Medium
- **Business actor:** Controller / Accounting view / Manager

## Supersession note (2026-07-31)

Separate receivable and payable closings / “no illegal netting” acceptance are
**superseded** by
[ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md):
one signed running debt balance (`>0` partner owes us; `<0` we owe partner;
`0` none). Retarget statement UI and criteria at activation. ADR-028 remains.

## Statement

As a controller, I want a business partner statement listing movements
chronologically with one signed debt balance, so that I can see partner
obligations under ADR-030.

## Business value

Core settlement/reporting view for partners.

## High-level scope

Statement aggregation from posted sales/purchases/cash/adjustments once those
exist; one running signed balance (not dual AR/AP closings).

## High-level acceptance criteria

- Chronological source-linked list
- One signed closing / running debt balance with clear sign explanation
- Aligns with ADR-030 (not separate receivable/payable primary balances)

## Dependencies

EPIC-009–012 posting capabilities (Purchase, Sale, Cash, Settlement);
CHANGE-003 / ADR-030 balance foundation.

## Related domain rules

ADR-030; workflow-map Business Partner Statement (retargeted).

## Related ADRs / docs

ADR-030; CHANGE-003; ADR-028.

## Known risks

Cannot be built before transactional postings exist.

## Open questions

BRD-OD-11 may be largely absorbed by ADR-030 — confirm at activation; do not
invent extra mutual-offset product behavior.

## Readiness checklist

- [x] Business behavior approved / traceable for this slice (ADR-030 + workflow)
- [ ] Dependencies satisfied or explicitly accepted — **EPIC-009–012 not started**
- [ ] Acceptance criteria refined at activation after postings exist

## Task elaboration

Deferred until activation. **2026-07-29 sequential review:** not implementable
now. **2026-07-31:** dual-balance wording superseded by ADR-030; remain Deferred
until posting modules exist.
