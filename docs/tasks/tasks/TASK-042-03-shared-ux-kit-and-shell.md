# TASK-042-03: Shared UX kit and app shell polish

## Metadata

- **Task ID:** TASK-042-03
- **Title:** Shared UX kit and app shell polish
- **Parent User Story:** [US-042](../stories/US-042-product-category-and-frontend-ux-uplift.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Dependencies:** TASK-042-01

## Objective

Ship reusable Ant Design UX primitives and a professional app shell/home.

## Acceptance criteria

- [x] PageHeader, FilterBar, form helpers in place
- [x] Theme tokens tuned (Ant Design, non-generic)
- [x] Nav groups + improved shell/home layout
- [x] Build/lint pass

## Evidence

- `page-header.tsx`, `FilterBar` in `list-toolbar.tsx`
- Theme tokens in `providers.tsx` (teal primary, layout surface)
- Grouped nav (Ana / İstinad məlumatları / Kataloq); home shortcuts
- `yarn workspace web lint` + `build` green (2026-07-29)

## Result

Done. Shared UX kit and shell polish landed for master-data screens.
