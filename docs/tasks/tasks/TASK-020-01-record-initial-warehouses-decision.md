# TASK-020-01: Record initial warehouses decision (ADR-026)

## Metadata

- **Task ID:** TASK-020-01
- **Title:** Record initial warehouses decision (ADR-026)
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Docs / Decision
- **Priority:** High
- **Estimate:** S
- **Dependencies:** None

## Objective

Unlock US-020 by recording Approved Human Decision for BRD-OD-02 (v1 warehouse
topology) and inventory-module scope boundaries (ADR-026).

## Scope

- [ADR-026](../../decisions/ADR-026-initial-warehouses-v1.md)
- Cross-links from story/epic/CURRENT as needed

## Out of scope

Prisma schema, APIs, UI.

## Acceptance criteria

- [x] ADR-026 Accepted and checked in
- [x] One GENERAL seed warehouse; multi-warehouse; no VEHICLE kind
- [x] Negative-stock exceptions and Yatı explicitly deferred

## Evidence

- `docs/decisions/ADR-026-initial-warehouses-v1.md`

## Result

Done 2026-07-31. BRD-OD-02 resolved for v1 via ADR-026.
