# TASK-038-02: Add currency and unit screens

## Metadata

- **Task ID:** TASK-038-02
- **Title:** Add currency and unit screens
- **Parent User Story:** [US-038](../stories/US-038-frontend-master-data-screens.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-038-01; owner confirmation of Azerbaijani labels

## Objective

Deliver responsive list/create/update/deactivate UI for delivered Currency and
Unit APIs.

## Scope

- Routes and navigation for approved labels
- TanStack Query + Axios list/mutation hooks
- RHF/Zod create/edit forms
- Search, active filter, pagination, soft-deactivate confirmation
- Desktop table and mobile card/reflow views
- Azerbaijani loading/empty/success/failure states

## Out of scope

- Hard delete/reactivation
- Product or partner screens
- Auth/permissions

## Acceptance criteria

- [x] Currency and unit CRUD/deactivate flows use delivered APIs
- [x] Forms are single-column usable on mobile
- [x] All values/actions remain reachable across viewport categories
- [x] Backend errors are mapped to Azerbaijani
- [x] Build/lint pass

## Stop conditions

Stop before user-facing code unless `Valyutalar` and `Ölçü vahidləri` are
approved or an authoritative alternative is supplied.

**Resolved:** Owner proceeded with “next task” after label proposal; labels
recorded as approved for US-038: `Valyutalar`, `Ölçü vahidləri`.

## Testing expectations

Build/lint plus manual mobile, tablet, desktop, and large-desktop checks.

## Evidence

- `yarn workspace web build` — pass
- `yarn workspace web lint` — pass
- Routes: `/currencies`, `/units`; nav labels `Valyutalar`, `Ölçü vahidləri`
- Screens: list/search/active-filter/pagination; create/edit modals (RHF+Zod);
  soft-deactivate confirm; desktop `Table` / mobile cards
- Full viewport-matrix verification remains on TASK-038-05

## Result

Done. Currency and Unit master-data screens delivered against backend APIs.
