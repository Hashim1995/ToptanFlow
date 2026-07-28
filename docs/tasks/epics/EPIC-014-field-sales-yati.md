# EPIC-014: Field sales (Yatı)

- **ID:** EPIC-014
- **Title:** Field sales (Yatı)
- **Status:** Planned

## Business objective

Trip lifecycle with load, field operations, reconciliations, close.

## User / business value

Mobile wholesale route operations.

## Scope

Vehicle warehouse/cash; trip state machine; field workflows.

## Exclusions

Closed-trip reopen policy until decided.

## Dependencies

EPIC-008–012; preferably EPIC-016 if bundles sold in field.

## Related ADRs / docs

invariants Field Sales; Yatı workflows; analysis M7.

## Child user stories

- US-028

## Completion definition

Trip close reconciles stock and cash under approved rules.

## Known risks

Many open trip decisions.

## Open questions

BRD-OD-15/16; OD-04/05.

## Repository evidence

VEHICLE_CASH enum only; no Yatı module.
