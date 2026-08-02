# CHANGE-021: Reports, expense categories, and users UI refactor

- **ID:** CHANGE-021
- **Type:** CHANGE
- **Title:** Reports, expense categories, and users UI refactor
- **Status:** Done
- **Trigger:** Owner identified three remaining frontend pages that had not received the approved responsive visual uplift.
- **Urgency:** Medium
- **Affected epics / stories / tasks:** Presentation follow-up for completed Cash and user-administration work.
- **Why not in the original plan:** These pages remained on the earlier bare shared-component presentation after the module-specific UI refactors.
- **Scope:** Mobile-first visual refactor of Cash Reports, Expense Categories, and Users; compact filters and summary surfaces; framed desktop tables; responsive mobile cards; consistent pagination and modal presentation.
- **Out of scope:** API behavior, report calculations, permissions, validation rules, mutations, routes, or business logic.
- **Risks:** Responsive presentation could hide an existing action or make dense report data unreadable.
- **Acceptance criteria:** All existing values and actions remain reachable on mobile and desktop; report summaries are compact and readable; list filters and tables match the established visual system; existing modals retain full-screen mobile body-only scrolling; Azerbaijani UI is preserved.
- **Impact on current work:** No active story displaced.
- **Roadmap impact:** None.
- **Result:** Added dedicated responsive styling and structure for all three pages. Expense-category mobile cards now expose the same edit and activation actions as desktop. No business behavior changed.
- **Follow-up actions:** Owner visual review in the running application.
- **Evidence:** Full frontend ESLint passed; all 21 frontend test files / 57 tests passed; `git diff --check` passed.
