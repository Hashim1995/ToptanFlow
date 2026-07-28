# TASK-038-04: Add business-partner screens

## Metadata

- **Task ID:** TASK-038-04
- **Title:** Add business-partner screens
- **Parent User Story:** [US-038](../stories/US-038-frontend-master-data-screens.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** L
- **Dependencies:** TASK-038-01; Currency API available; US-016 Done

## Objective

Deliver responsive Business Partner list/create/update/deactivate screens,
including the approved soft-duplicate acknowledgement flow.

## Scope

- Routes/navigation, list/search/filter/pagination, responsive table/cards
- RHF/Zod create/edit forms with active default currency
- Customer/supplier/both roles
- Read-only backend-generated code
- `409 BUSINESS_PARTNER_DUPLICATE_SUSPECTED` candidate review and explicit
  `acknowledgeDuplicate: true` retry
- Soft-deactivate confirmation and Azerbaijani states/messages

## Out of scope

- Partner statement, Yellow Cards, merge, reactivation, auth/permissions

## Acceptance criteria

- [x] Delivered partner operations are usable
- [x] Code is never editable or client-supplied
- [x] At least one role is guided in UI and remains backend-authoritative
- [x] Duplicate candidates are shown without exposing technical identifiers
- [x] Acknowledge retry occurs only after explicit user action
- [x] Build/lint and responsive checks pass

## Testing expectations

Build/lint plus manual viewport and duplicate-flow verification.

## Evidence

- `yarn workspace web build` — pass
- `yarn workspace web lint` — pass
- Route `/business-partners`; nav `Biznes tərəfdaşları`
- List: search, active filter, role filter, pagination; desktop table / mobile cards
- Form: roles checkboxes, active currencies, read-only code on edit
- Soft-duplicate: candidates modal (code/name/phone/tax/roles/status/matched
  fields — no UUID); explicit “Buna baxmayaraq yadda saxla” retries with
  `acknowledgeDuplicate: true`
- Full viewport-matrix verification remains on TASK-038-05

## Result

Done. Business Partner screens and soft-duplicate acknowledgement UI delivered.
