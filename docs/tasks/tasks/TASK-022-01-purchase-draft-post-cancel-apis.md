# TASK-022-01: Purchase draft CRUD, post, and cancel APIs

## Metadata

- **Task ID:** TASK-022-01
- **Title:** Purchase draft CRUD, post, and cancel APIs
- **Parent User Story:** [US-022](../stories/US-022-purchase-draft-post.md)
- **Parent Epic:** [EPIC-009](../epics/EPIC-009-purchasing.md)
- **Status:** Review
- **Type:** API
- **Priority:** High
- **Estimate:** L
- **Dependencies:** EPIC-005 Products (quantity); EPIC-006 Business Partners (signed debt); CHANGE-002; CHANGE-003; ADR-028/029/030/031

## Objective

Implement NestJS Purchase module: draft create/list/get/update/delete, explicit post (complete), and cancel with atomic product-quantity and signed partner-debt effects. No Cash mutation. No Warehouse/Currency.

## Scope

- `apps/api/src/purchases/**`
- Prisma Purchase/PurchaseItem refinements (snapshots, decimals, subtotal, PURCHASE sequence)
- Unit + e2e tests
- Document-number allocation via NumberSequence `PURCHASE` → `PUR-{padded}` (Approved Human Decision 2026-07-31 for US-022; ADR-024 pattern, outside ADR-024 Product/BP scope)

## Out of scope

- Purchase Returns (deferred)
- Sales module
- Cash Out / payment checkbox on purchase
- Granular `purchase.*` permissions (ADR-025 flat users — JWT auth only)
- Warehouse / Currency fields

## Acceptance criteria

- [x] Draft CRUD with no quantity/debt/cash effects
- [x] Post only from DRAFT; increases product quantity + history; decreases partner debt + movement; status POSTED
- [x] Cancel only from POSTED; reverses quantity/debt via new history rows; requires reason; status CANCELLED
- [x] Concurrent post/cancel idempotent (conditional status update)
- [x] Backend recalculates totals; same product allowed on multiple lines (owner decision 2026-07-31)
- [x] No warehouse/currency/cash side effects

## Implementation notes

Status enum remains `DRAFT` / `POSTED` / `CANCELLED` (schema). “Completed” in prose maps to POSTED.
Endpoints: `GET/POST /purchases`, `GET/PATCH/DELETE /purchases/:id`, `POST /purchases/:id/post`, `POST /purchases/:id/cancel`.
Permissions: ADR-025 flat JWT users (no granular `purchase.*` keys).

## Evidence

`apps/api/src/purchases/**`; `apps/api/test/purchases.e2e-spec.ts`; migration `20260731150000_purchase_line_snapshots_and_sequence`.

## Result

Review (implementation complete; awaiting owner acceptance).

## Completion date

2026-07-31
