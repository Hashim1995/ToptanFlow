# EPIC-013: Inventory costing

- **ID:** EPIC-013
- **Title:** Inventory costing
- **Status:** Blocked

## Business objective

Approved costing method for COGS and valuation.

## User / business value

Profit and stock valuation correctness.

## Scope

Costing interface and posting-time snapshots after method approval.

## Exclusions

Choosing weighted-average vs alternatives without human decision.

## Dependencies

EPIC-008; BRD-OD-06 / conflict disposition.

## Related ADRs / docs

invariants Costing; analysis §8.8 Conflict; BRD-OD-06.

## Child user stories

- US-027

## Completion definition

Posted cost effects match approved method with auditability.

## Known risks

Documented Conflict on weighted-average.

## Open questions

BRD-OD-06; AD-13.

## Repository evidence

No costing module; conflict recorded in analysis.
