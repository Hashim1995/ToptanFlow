# EPIC-012: Settlement — receivables, payables, advances

- **ID:** EPIC-012
- **Title:** Settlement — receivables, payables, advances
- **Status:** Planned

## Business objective

Allocations, advances, and partner obligations without illegal netting.

## User / business value

Correct partner balances and statements.

## Scope

Allocation/reallocation; advances; statement inputs.

## Exclusions

Mutual offset or auto-advance application without approval.

## Dependencies

EPIC-009, EPIC-010, EPIC-011.

## Related ADRs / docs

invariants Receivables & Payables; Business Partner Statement workflow; analysis M6.

## Child user stories

- US-026
- Related (owned by EPIC-006): US-017 business partner statement

## Completion definition

Balances derive from auditable transactions; directions stay separate.

## Known risks

Allocation/Advance entities not in schema.

## Open questions

BRD-OD-11; OD-06; AD-09.

## Repository evidence

Explicit schema exclusion of Allocation/Advance.
