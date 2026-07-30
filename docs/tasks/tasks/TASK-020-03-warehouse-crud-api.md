# TASK-020-03: Warehouse CRUD API

## Metadata

- **Task ID:** TASK-020-03
- **Title:** Warehouse CRUD API
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Backend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-020-02

## Objective

Nest `warehouses` module: list/get/create/patch/soft-deactivate/reactivate under
`/api/v1/warehouses`, JWT-protected, ADR-025 flat authz.

## Scope

- Module layout parity with `currencies` / `product-categories`
- Pagination, search, `isActive`, `kind` filters
- Create allocates `code` via `WAREHOUSE` sequence inside a transaction (ADR-024 pattern)
- PATCH partial update: name/kind; not `code`; `isActive` for reactivate
- DELETE soft-deactivates (`isActive = false`), idempotent
- Unit tests; OpenAPI DTOs

## Out of scope

Stock balances; frontend; e2e (TASK-020-04).

## Acceptance criteria

- [x] CRUD + deactivate/reactivate work for active authenticated users
- [x] Codes backend-generated and immutable
- [x] Inactive warehouses remain readable by id/list when filtered
- [x] No role checks beyond active user

## Evidence

- Module: `apps/api/src/warehouses/`
- Registered in `AppModule`
- Unit tests: `warehouses.service.spec.ts` — 13 passed
- `yarn workspace api build` + lint green

## Result

Done 2026-07-31. Next: TASK-020-04 Warehouse API e2e.
