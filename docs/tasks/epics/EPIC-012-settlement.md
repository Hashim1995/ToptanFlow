# EPIC-012: Settlement — partner debt, allocations, advances

- **ID:** EPIC-012
- **Title:** Settlement — partner debt, allocations, advances
- **Status:** Planned

## Supersession note (2026-07-31)

Prior dual receivable/payable balances and “no illegal netting between
directions” as primary truth are **superseded** by
[ADR-030](../../decisions/ADR-030-signed-business-partner-debt-balance.md) /
[CHANGE-003](../unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md):
**one signed Business Partner debt balance**. Sales and purchases with the same
partner intentionally offset on that balance. Retarget this epic and child
stories (US-026; related US-017) accordingly. ADR-028 remains.

## Business objective

Optional allocations/traceability and partner statement inputs against the
signed debt balance. Open amounts and running balance derive from posted
Sales/Purchases plus separately posted, optionally allocated cash
([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md)).

## User / business value

Correct single signed partner balance and statements.

## Scope

Allocation/reallocation (optional per ADR-028); advances as signed-balance
effects; statement inputs. Must support partial payments, multiple payments for
one document, one payment across multiple documents, and unlinked cash.
Amounts AZN-only ([ADR-031](../../decisions/ADR-031-currency-reserved-for-future-cash.md)).

## Exclusions

Separate primary AR/AP balances; Currency as settlement master data.
Mutual-offset UI as a separate product feature is YAGNI while signed balance
already nets sale/purchase effects (ADR-030).

## Dependencies

EPIC-009, EPIC-010, EPIC-011; CHANGE-003 / ADR-030 partner balance foundation.

## Related ADRs / docs

ADR-030; ADR-028; ADR-031; partner statement workflow (retargeted); analysis M6.

## Child user stories

- US-026
- Related (owned by EPIC-006): US-017 business partner statement

## Completion definition

Balances derive from auditable movements on one signed debt balance;
Sale/Purchase documents are never treated as cash ledgers.

## Known risks

Allocation/Advance entities not in schema; refine at activation under ADR-030.

## Open questions

BRD-OD-11 disposition may be largely absorbed by ADR-030 — confirm at
activation; OD-06; AD-09. Optional allocation / cash-separation rule is decided
(ADR-028).

## Repository evidence

Explicit schema exclusion of Allocation/Advance; signed balance via CHANGE-003.
