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

## Blocker (2026-07-31 — ADR-029)

**Redesign required before implementation.** [ADR-029](../../decisions/ADR-029-single-product-quantity-no-warehouse.md) / [CHANGE-002](../unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) withdraw the vehicle-warehouse model and the separate Warehouse/Stock module. Do not implement Yatı against EPIC-008 warehouse assumptions; trip load/custody/reconciliation must be redesigned under the single product-quantity model.

## Exclusions

Closed-trip reopen policy until decided. Prior vehicle-warehouse design (withdrawn until redesign).

## Dependencies

EPIC-009–012 (sales/cash/settlement); EPIC-008 **Cancelled** — do not depend on warehouses; preferably EPIC-016 if bundles sold in field; **ADR-029 Yatı redesign** before activation.

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
