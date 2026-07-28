# EPIC-015: Fixed assets

- **ID:** EPIC-015
- **Title:** Fixed assets
- **Status:** Draft

## Business objective

Asset register and lifecycle after conflict disposition.

## User / business value

Track equipment separately from sellable inventory.

## Scope

Asset master, history, acquisition/sale/write-off links.

## Exclusions

Implementation while status/depreciation/credit-sale conflicts unresolved.

## Dependencies

EPIC-009/011; conflict disposition.

## Related ADRs / docs

invariants Fixed Assets; analysis §8.15; BRD-OD-12.

## Child user stories

- US-029

## Completion definition

Asset lifecycle posts without inventing unresolved policies.

## Known risks

Conflicts on statuses and credit sale.

## Open questions

BRD-OD-12; AD-16; BRD-CA-11/12.

## Repository evidence

Not modeled in current schema.
