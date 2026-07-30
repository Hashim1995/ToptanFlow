# US-020: Warehouse master data

- **ID:** US-020
- **Title:** Warehouse master data
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** In Progress
- **Priority:** High
- **Business actor:** Warehouse officer / master-data maintainer

## Statement

As a warehouse officer, I want warehouses configured, so that stock can be held
and moved by location.

## Business value

Prerequisite for inventory movements and later purchase/sale posting.

## High-level scope

- Warehouse master-data (DB + API + UI)
- Kinds: `GENERAL` | `DAMAGED` only ([ADR-026](../../decisions/ADR-026-initial-warehouses-v1.md))
- Seed one GENERAL warehouse; multi-warehouse create allowed
- Soft-deactivate / reactivate
- Backend-generated `code` (ADR-024 sequence pattern, key `WAREHOUSE`)

## High-level acceptance criteria

- Warehouses can be listed, created, updated, deactivated, and reactivated
- Codes are backend-generated, immutable, never client-supplied
- Kind `VEHICLE` does not exist in v1
- Azerbaijani UI **Anbarlar** meets ADR-005 / ui-requirements
- Must not invent Yatı or negative-stock policy

## Dependencies

ADR-026 (BRD-OD-02 v1); EPIC-005 products; EPIC-007 auth recommended (Done).

## Related domain rules

invariants Inventory (custody by warehouse); terminology Warehouse.

## Related ADRs / docs

ADR-026; ADR-024; ADR-025; analysis BRD-OD-02.

## Known risks

Operators may create many warehouses without process — acceptable for v1.

## Open questions

None for US-020 after ADR-026. AD-05 damaged receipt posting waits purchasing.

## Readiness checklist

- [x] Business behavior approved / traceable (ADR-026)
- [x] No unresolved Open Decision that this story would silently resolve
- [x] Dependencies satisfied
- [x] Acceptance criteria sufficient to implement

## Task elaboration

- [TASK-020-01](../tasks/TASK-020-01-record-initial-warehouses-decision.md) — **Done**
- [TASK-020-02](../tasks/TASK-020-02-warehouse-persistence-model.md) — **Done**
- [TASK-020-03](../tasks/TASK-020-03-warehouse-crud-api.md) — **Done**
- [TASK-020-04](../tasks/TASK-020-04-warehouse-api-e2e.md) — **Ready** (next)
- [TASK-020-05](../tasks/TASK-020-05-warehouse-ui-screens.md) — Planned
