# US-042: ProductCategory reference data and frontend UX uplift

- **ID:** US-042
- **Title:** ProductCategory reference data and frontend UX uplift
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md) (UI) with backend
  under EPIC-005 Product catalog
- **Status:** Done
- **Priority:** High
- **Business actor:** Master-data maintainer
- **Trigger:** [CHANGE-001](../unplanned/CHANGE-001-product-category-and-frontend-ux-uplift.md)

## Statement

As a master-data maintainer, I want product categories as reusable reference data and
professional Ant Design screens/shell, so that products pick categories from a list and
everyday master-data work feels trustworthy and complete.

## Business value

Correct category modeling; usable, high-quality frontend for delivered APIs.

## High-level scope

- ProductCategory flat reference API + Product `categoryId`
- Shared frontend UX kit and app-shell polish
- Category screens + uplift of currency/unit/product/partner screens
- Docs/rules so weak forms/filters are not reintroduced

## High-level acceptance criteria

- [x] Categories list/create/update/soft-deactivate
- [x] Product form uses searchable category Select; list can filter by category
- [x] Shell has clear nav groups and intentional layout
- [x] Forms: AZ labels, placeholders, field-level validation, correct input semantics
- [x] Lists: professional FilterBar + table/card parity
- [x] ui-requirements Forms/Filters bar and Cursor rule applied
- [x] BRD-CA-18 not silently resolved

## Dependencies

CHANGE-001; US-037/038 Done; Product/Unit/Currency APIs.

## Related domain rules

invariants Products (type vs category); ADR-005; ui-requirements.

## Known risks

Large UI surface; migration of free-text categories.

## Open questions

| Question | Disposition |
| --- | --- |
| Hierarchical categories? | Rejected — flat only (owner 2026-07-29). |
| Historical category on documents? | BRD-CA-18 remains open. |

## Readiness checklist

- [x] Owner decisions recorded in CHANGE-001
- [x] No silent Open Decision resolution
- [x] Acceptance criteria sufficient

## Task elaboration

- [TASK-042-01](../tasks/TASK-042-01-docs-and-ux-quality-gates.md) — Docs/gates
- [TASK-042-02](../tasks/TASK-042-02-product-category-backend.md) — Backend
- [TASK-042-03](../tasks/TASK-042-03-shared-ux-kit-and-shell.md) — UX kit + shell
- [TASK-042-04](../tasks/TASK-042-04-master-data-screens-uplift.md) — Screens uplift
- [TASK-042-05](../tasks/TASK-042-05-verify-category-and-ux.md) — Verification
