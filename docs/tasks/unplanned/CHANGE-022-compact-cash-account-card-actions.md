# CHANGE-022: Compact Cash account card actions

- **ID:** CHANGE-022
- **Type:** CHANGE
- **Title:** Compact Cash account card actions
- **Status:** Done
- **Trigger:** Owner requested clearer action highlighting and denser mobile Cash account cards.
- **Urgency:** Medium
- **Affected epics / stories / tasks:** Presentation follow-up for completed Cash workspace work.
- **Why not in the original plan:** Visual refinement requested after use of the responsive Cash workspace.
- **Scope:** Semantic action colors for details, Cash In, Cash Out, Expense, and Transfer; reduced mobile Cash header, hero, filter, card, balance, daily-summary, activity, and action spacing.
- **Out of scope:** Action behavior, permissions, Cash calculations, APIs, schemas, or modal logic.
- **Risks:** Excessive density could reduce touch usability or readability.
- **Acceptance criteria:** Actions are visually distinct without color being their only label; mobile cards show more information while buttons remain practical touch targets; desktop layout remains stable.
- **Impact on current work:** No active story displaced.
- **Roadmap impact:** None.
- **Result:** Added labeled semantic button treatments and a compact mobile breakpoint for the Cash account workspace. Existing labels, icons, actions, and navigation are unchanged.
- **Follow-up actions:** Owner visual review on a physical phone or mobile emulator.
- **Evidence:** Changed TSX passed scoped frontend ESLint; changed files passed Prettier and `git diff --check`.
