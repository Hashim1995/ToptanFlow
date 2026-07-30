# TASK-020-04: Warehouse API e2e

## Metadata

- **Task ID:** TASK-020-04
- **Title:** Warehouse API e2e
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
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

- [x] E2e suite green with `withAuth`
- [x] Soft-deactivate idempotent; reactivate via PATCH `isActive: true`

## Evidence

- `apps/api/test/warehouses.e2e-spec.ts` — 12 passed
- Covers 401, create/list/get/patch/delete, validation, 409 duplicate code

## Result

Done 2026-07-31. Next: TASK-020-05 Warehouse UI screens.
