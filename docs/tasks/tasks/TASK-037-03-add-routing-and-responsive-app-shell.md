# TASK-037-03: Add routing and responsive app shell

## Metadata

- **Task ID:** TASK-037-03
- **Title:** Add routing and responsive app shell
- **Parent User Story:** [US-037](../stories/US-037-frontend-shell-foundation.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-037-01

## Objective

Add client routing (`react-router-dom`) and a responsive Ant Design app chrome with a placeholder home route only.

## Scope

- Add `react-router-dom` dependency
- App layout: header + mobile-reachable navigation (drawer/sider) per ui-requirements
- Routes: home placeholder only (Azerbaijani labels; brand TOPTANFLOW)
- No domain feature routes/screens

## Out of scope

- US-038 master-data screens
- Auth-gated routes
- Invented module nav for sales/purchases/etc.

## Acceptance criteria

- [x] Home route renders inside shell
- [x] Navigation reachable on narrow viewports without hover-only paths
- [x] User-facing shell strings Azerbaijani; no English Ant defaults in chrome
- [x] Build green

## Implementation notes

Desktop: Ant Design Sider. Mobile: header menu button + Drawer. Nav: Ana səhifə only.

## Documentation impact

None beyond task evidence.

## Testing expectations

Build smoke.

## Validation expectations

`yarn workspace web build` green.

## Risks

Over-building nav — avoided (home only).

## Assumptions

Router choice recorded on US-037 (`react-router-dom`).

## Evidence

- `apps/web/src/app/app-shell-layout.tsx`
- `apps/web/src/pages/home-page.tsx`
- `apps/web/src/App.tsx` (BrowserRouter + Routes)
- Dependencies: `react-router-dom`, `@ant-design/icons`
- Validation: `yarn workspace web build` → success

## Result

Done. Responsive shell + home route complete US-037.

## Completion date

2026-07-29
