# TASK-020-05: Warehouse UI screens

## Metadata

- **Task ID:** TASK-020-05
- **Title:** Warehouse UI screens (Anbarlar)
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-020-03

## Objective

Azerbaijani responsive warehouse master-data screens per ADR-005 and
`docs/technical/ui-requirements.md`.

## Scope

- Nav label: **Anbarlar**
- Kind labels: GENERAL → Ümumi; DAMAGED → Zədələnmiş
- List with FilterBar (search, status, kind), pagination, desktop table / mobile cards
- Create/edit forms (RHF + Zod); code read-only
- Soft-deactivate confirm + **Aktiv et** reactivate
- Route + shell nav wiring

## Out of scope

Stock balances / transfers (US-021); vehicle warehouses; inventing new business terms beyond routine enum labels.

## Acceptance criteria

- [x] End-to-end warehouse maintenance usable on mobile and desktop
- [x] No enum keys / API field names shown raw
- [x] `web` build + lint green

## Testing expectations

Build/lint; manual viewport smoke.

## Evidence

- `apps/web/src/features/master-data/pages/warehouses-page.tsx`
- Route `/warehouses`; shell nav + home shortcut **Anbarlar**
- Kind labels via `warehouseKindLabel` (Ümumi / Zədələnmiş)
- Soft-deactivate + reactivate; code read-only on edit
- `yarn workspace web` lint, test (37), build — green

## Result

Done 2026-07-31. US-020 complete. Next: activate US-021 / TASK-021-01.
