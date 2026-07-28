# EPIC-010: Sales

- **ID:** EPIC-010
- **Title:** Sales
- **Status:** Planned

## Business objective

Sale draft/post/cancel/return with stock issue and receivable effects.

## User / business value

Core wholesale revenue cycle.

## Scope

Sale APIs/posting; coordination with cash/settlement; discount guards later.

## Exclusions

Bundles (EPIC-016); Yatı field sale (EPIC-014).

## Dependencies

EPIC-005, EPIC-006, EPIC-008; preferably EPIC-009 first.

## Related ADRs / docs

invariants Sales; sale workflows; analysis M5.

## Child user stories

- US-023

## Completion definition

Posted sales decrease stock and create receivables per invariants.

## Known risks

Discount/zero-price/cancellation settlement open items.

## Open questions

BRD-OD-07/09.

## Repository evidence

Sale models exist; no sales module/API.
