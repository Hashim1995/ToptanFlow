# TASK-020-04: Warehouse API e2e

## Metadata

- **Task ID:** TASK-020-04
- **Title:** Warehouse API e2e
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Ready
- **Type:** Test
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-020-03

## Objective

Supertest coverage for warehouse endpoints with auth helper.

## Scope

- Create/list/get/patch/deactivate/reactivate
- Validation failures; 401 without token
- No `passwordHash` / prisma / stack leaks

## Acceptance criteria

- [ ] E2e suite green with `withAuth`
- [ ] Soft-deactivate idempotent; reactivate via PATCH `isActive: true`

## Evidence

(To be filled)

## Result

(To be filled)
