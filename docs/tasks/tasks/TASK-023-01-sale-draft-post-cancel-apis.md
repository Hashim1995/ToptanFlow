# TASK-023-01: Sale draft CRUD, post, and cancel APIs

## Metadata

- **Task ID:** TASK-023-01
- **Title:** Sale draft CRUD, post, and cancel APIs
- **Parent User Story:** [US-023](../stories/US-023-sale-draft-post.md)
- **Parent Epic:** [EPIC-010](../epics/EPIC-010-sales.md)
- **Status:** Review
- **Type:** API
- **Priority:** High
- **Estimate:** L
- **Dependencies:** EPIC-005 Products (quantity); EPIC-006 Business Partners (signed debt); CHANGE-002; CHANGE-003; ADR-028/029/030/031; preferably US-022 patterns

## Objective

Implement NestJS Sale module: draft create/list/get/update/delete, explicit post
(complete), and cancel with atomic product-quantity and signed partner-debt
effects. No Cash mutation. No Warehouse/Currency. Negative quantity on post
requires mandatory reason (ADR-025: all active users may override).

## Scope

- `apps/api/src/sales/**`
- Prisma Sale/SaleItem refinements (snapshots, decimals, subtotal, SALE sequence)
- Unit + e2e tests
- Document-number allocation via NumberSequence `SALE` → `SAL-{padded}`

## Out of scope

- Sales Returns (deferred)
- Cash In / payment checkbox on sale
- Granular `sale.*` permissions (ADR-025 flat users — JWT auth only)
- Warehouse / Currency fields
- Bundle sales (US-030 / EPIC-016)

## Acceptance criteria

- [x] Draft CRUD with no quantity/debt/cash effects
- [x] Post only from DRAFT; decreases product quantity + history; increases partner debt + movement; status POSTED
- [x] Post without reason blocked when quantity would go negative; with reason allowed and audited
- [x] Cancel only from POSTED; reverses quantity/debt via new history rows; requires reason; status CANCELLED
- [x] Concurrent post/cancel idempotent (conditional status update)
- [x] Backend recalculates totals; same product allowed on multiple lines
- [x] No warehouse/currency/cash side effects
- [x] Partner must be active customer (`isCustomer`)

## Implementation notes

Status enum remains `DRAFT` / `POSTED` / `CANCELLED`. “Completed” in prose maps to POSTED.
Endpoints: `GET/POST /sales`, `GET/PATCH/DELETE /sales/:id`, `POST /sales/:id/post`, `POST /sales/:id/cancel`.
Permissions: ADR-025 flat JWT users (no granular `sale.*` keys).

## Evidence

`apps/api/src/sales/**`; `apps/api/test/sales.e2e-spec.ts`; migration `20260801120000_sale_line_snapshots_and_sequence`; unit 13 / e2e 9.

## Result

Review (implementation complete; awaiting owner acceptance).

## Completion date

2026-08-01
