# EPIC-009: Purchasing

- **ID:** EPIC-009
- **Title:** Purchasing
- **Status:** Planned

## Business objective

Purchase draft/post/cancel/return with stock/cost/payable effects.

## User / business value

Goods receipt and supplier obligations.

## Scope

Purchase APIs and posting behaviors; returns; cancellation.

## Exclusions

Unresolved fixed-asset non-stock purchase edge cases.

## Dependencies

EPIC-005, EPIC-006, EPIC-008; settlement coordination with EPIC-012.

## Related ADRs / docs

invariants Purchasing; purchase workflows; analysis M4.

## Child user stories

- US-022

## Completion definition

Posted purchases produce durable stock/payable effects under immutability rules.

## Known risks

Transport capitalization and return-credit classification open.

## Open questions

OD-03; AD-09.

## Repository evidence

Purchase models exist; no purchasing module/API.
