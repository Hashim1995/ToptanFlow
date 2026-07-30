# TASK-020-05: Warehouse UI screens

## Metadata

- **Task ID:** TASK-020-05
- **Title:** Warehouse UI screens (Anbarlar)
- **Parent User Story:** [US-020](../stories/US-020-warehouse-master-data.md)
- **Parent Epic:** [EPIC-008](../epics/EPIC-008-inventory-warehouses.md)
- **Status:** Planned
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-020-03

## Objective

Azerbaijani responsive warehouse master-data screens per ADR-005 and
`docs/technical/ui-requirements.md`.

## Scope

- Nav label: **Anbarlar**
- Kind labels: GENERAL → clear AZ (e.g. Ümumi); DAMAGED → Zədələnmiş
- List with FilterBar (search, status, kind), pagination, desktop table / mobile cards
- Create/edit forms (RHF + Zod); code read-only
- Soft-deactivate confirm + **Aktiv et** reactivate
- Route + shell nav wiring

## Out of scope

Stock balances / transfers (US-021); vehicle warehouses; inventing new business terms beyond routine enum labels.

## Acceptance criteria

- [ ] End-to-end warehouse maintenance usable on mobile and desktop
- [ ] No enum keys / API field names shown raw
- [ ] `web` build + lint green

## Testing expectations

Build/lint; manual viewport smoke.

## Result

(To be filled)
