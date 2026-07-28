# TASK-037-03: Add routing and responsive app shell

## Metadata

- **Task ID:** TASK-037-03
- **Title:** Add routing and responsive app shell
- **Parent User Story:** [US-037](../stories/US-037-frontend-shell-foundation.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Ready
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

- [ ] Home route renders inside shell
- [ ] Navigation reachable on narrow viewports without hover-only paths
- [ ] User-facing shell strings Azerbaijani; no English Ant defaults in chrome
- [ ] Build green

## Implementation notes

May depend on TASK-037-02 only loosely (can proceed after 037-01). Keep nav minimal.

## Documentation impact

None beyond task evidence.

## Testing expectations

Build smoke; optional responsive manual check (mobile + desktop).

## Validation expectations

Build green; shell usable at mobile width.

## Risks

Over-building nav for future modules — resist.

## Assumptions

Router choice recorded on US-037 (`react-router-dom`).

## Evidence

(To be filled when Done.)

## Result

(To be filled when Done.)
