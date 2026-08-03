# CHANGE-024: Commercial document mobile UX simplification

- **ID:** CHANGE-024
- **Type:** CHANGE
- **Title:** Commercial document mobile UX simplification
- **Status:** Done
- **Trigger:** Owner requested simpler Sale and Purchase lists/details, especially on mobile, and removal of quantity history from the detail presentation.
- **Urgency:** Medium
- **Affected epics / stories / tasks:** Sale and Purchase frontend presentation follow-up.
- **Why not in the original plan:** The existing responsive presentation remained visually dense after the first detail-page consolidation.
- **Scope:** Compact Sale, Purchase, and Cash Transaction mobile list cards; directly visible icon actions on Sale/Purchase records; icon-led Cash Transaction metadata; clearer document/partner/amount hierarchy; tighter responsive detail spacing; collapsible audit information; remove Product Quantity History from Sale and Purchase detail UI.
- **Out of scope:** APIs, database records, posting/cancellation behavior, inventory history persistence, calculations, permissions, and print behavior.
- **Risks:** Important document actions or audit information could become unreachable on small screens.
- **Acceptance criteria:** Mobile list records are compact and readable; all existing actions remain available from one menu; detail pages retain document, item, debt, cash, and audit information; quantity history is not rendered; desktop remains usable.
- **Impact on current work:** No active story displaced.
- **Roadmap impact:** None.
- **Result:** Sale and Purchase mobile lists now expose View/Edit/Post/Remove/Cancel as applicable through direct icon buttons without an overflow-menu click. Cash Transaction cards place type, number, amount, status, account, date, party, operator, and optional note in a compact icon-led hierarchy with a direct account link. Mobile details retain the dedicated invoice summary and simple quantity × price product lines; desktop and backend behavior remain unchanged.
- **Follow-up actions:** Owner visual review at representative mobile and desktop widths.
- **Evidence:** Targeted frontend ESLint passed; frontend tests and diff checks passed.
