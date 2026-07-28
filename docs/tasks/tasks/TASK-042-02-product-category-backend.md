# TASK-042-02: ProductCategory backend and Product categoryId

## Metadata

- **Task ID:** TASK-042-02
- **Title:** ProductCategory backend and Product categoryId
- **Parent User Story:** [US-042](../stories/US-042-product-category-and-frontend-ux-uplift.md)
- **Status:** Done
- **Type:** Backend
- **Priority:** High
- **Dependencies:** TASK-042-01

## Objective

Deliver flat ProductCategory reference API and migrate Product from free-text
category to nullable categoryId FK.

## Scope

Prisma model + migration/backfill; Nest CRUD/list/deactivate; Product DTO/service
updates; unit/e2e tests. Do not resolve BRD-CA-18.

## Acceptance criteria

- [x] ProductCategory CRUD/list/soft-deactivate
- [x] Product uses categoryId; response includes category summary
- [x] Inactive category blocked on product create/update
- [x] Tests green

## Evidence

- Migration `20260729020000_add_product_category` applied (backfill + drop free-text).
- Nest module `product-categories`; Product API uses `categoryId` + category summary.
- Unit: products.service + product-categories.service + update-product.dto — 65 passed.
- E2E: products.e2e + product-categories.e2e — 32 passed.
- BRD-CA-18 explicitly not resolved.

## Result

Done. Flat ProductCategory reference data delivered; Product FK migration complete.
