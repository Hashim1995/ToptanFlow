# TASK-021-03: Inventory API e2e

## Metadata

- **Task ID:** TASK-021-03
- **Title:** Inventory API e2e
- **Parent User Story:** [US-021](../stories/US-021-inventory-movements-balances.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Planned
- **Type:** Test
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-021-02

## Objective

Supertest regression for transfer, adjustment, write-off, balances, and auth.

## Scope

- Happy-path transfer; insufficient stock → client error
- Balance equals sum of movements for a product/warehouse
- 401 without Bearer token
- No internal leak payloads

## Acceptance criteria

- [ ] E2e green with auth helper
- [ ] Negative-balance attempt covered and rejected

## Result

(To be filled)
