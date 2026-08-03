# CHANGE-023: Standard collapsible filter system

- **ID:** CHANGE-023
- **Type:** CHANGE
- **Title:** Standard collapsible filter system
- **Status:** Done
- **Trigger:** Owner requested consistent filter control sizing, standard Search/Reset actions, mobile-friendly responsiveness, and default-collapsed filter panels across the application.
- **Urgency:** Medium
- **Affected epics / stories / tasks:** Cross-cutting frontend presentation follow-up.
- **Why not in the original plan:** Module-specific UI refactors had produced several visually different filter implementations.
- **Scope:** Shared 40px input/select/date/number control baseline; one responsive accordion component; default-collapsed state on desktop and mobile; standard “Axtar” and “Təmizlə” actions; migration of current master-data, users, Cash, Sale, and Purchase filters.
- **Out of scope:** API query semantics, backend filtering, authorization, pagination rules, or business calculations.
- **Risks:** Reset actions could leave controlled fields visually stale, or collapsed content could become inaccessible.
- **Acceptance criteria:** Every migrated filter panel is closed initially and keyboard/touch expandable; controls align to the same height; action labels and layout are consistent; reset clears all page filter fields; mobile uses a single-column field layout and full-width actions.
- **Impact on current work:** No active story displaced.
- **Roadmap impact:** None.
- **Result:** Added one shared filter accordion and migrated Products, Categories, Units, Business Partners, Users, Expense Categories, Cash Reports, all Cash Transactions, Cash Account history, Sales, and Purchases. Sale/Purchase date ranges are controlled so reset clears their visible values.
- **Follow-up actions:** Owner visual review across representative mobile and desktop widths.
- **Evidence:** Full frontend ESLint passed; dedicated accordion/action regression test passed; `git diff --check` passed.
