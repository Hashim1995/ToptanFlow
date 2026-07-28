# TASK-038-03: Add product screens

## Metadata

- **Task ID:** TASK-038-03
- **Title:** Add product screens
- **Parent User Story:** [US-038](../stories/US-038-frontend-master-data-screens.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-038-01; Unit API available

## Objective

Deliver responsive product list/create/update/deactivate screens for the
delivered Product API.

## Scope

- Product routes/navigation and TanStack Query hooks
- Search/filter/pagination
- RHF/Zod forms using active units
- Read-only backend-generated code
- Azerbaijani product-type labels; decimal strings preserved
- Responsive table/card views and soft-deactivate confirmation

## Out of scope

- Inventory balances, pricing policy, hard delete/reactivation
- Currency/unit maintenance screens
- Auth/permissions

## Acceptance criteria

- [x] Delivered product operations are usable
- [x] Code is visible but never editable or submitted
- [x] Internal enum keys are never user-visible
- [x] Loading/empty/success/failure states are Azerbaijani
- [x] Build/lint and responsive checks pass

## Testing expectations

Build/lint plus manual viewport verification.

## Evidence

- `yarn workspace web build` — pass
- `yarn workspace web lint` — pass
- Route `/products`; nav label `Məhsullar`
- Product type labels: Hazır məhsul / Xammal / Qarışıq təyinatlı
- List: search, active filter, type filter, pagination; desktop table / mobile cards
- Create/edit modal: RHF+Zod, active units select, read-only code on edit,
  decimal strings as text inputs; soft-deactivate confirm
- Full viewport-matrix verification remains on TASK-038-05

## Result

Done. Product master-data screens delivered against backend APIs.
