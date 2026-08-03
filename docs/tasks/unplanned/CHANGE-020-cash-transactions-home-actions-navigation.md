# CHANGE-020: Cross-account Cash history, home quick actions, and navigation order

- **ID:** CHANGE-020
- **Type:** CHANGE
- **Title:** Cross-account Cash history, home quick actions, and navigation order
- **Status:** Done
- **Trigger:** Owner requested one Cash subpage that shows transactions across all accounts with useful filters, top-of-home quick actions, and a business-priority sidebar order.
- **Scope:** Responsive read-only cross-account Cash transaction list using the existing list API; account/type/status/direction/date/number filters; homepage cards opening Cash In, Cash Out, Expense, Transfer, new Purchase, and new Sale flows; sidebar order Home → Cash → Purchases → Sales → Products → Partners → remaining sections.
- **Out of scope:** New transaction calculations, posting/cancellation behavior, API filtering semantics, permissions, or audit rules.
- **Acceptance criteria:** All account transactions are reachable from Cash navigation and readable on mobile/desktop; filters remain Azerbaijani and never expose enum keys; quick actions open their intended existing forms; sidebar order matches the approved sequence; frontend type/lint/tests/build checks pass for changed scope.
- **Result:** Added `/cash/transactions` with cross-account results and responsive filters/table/cards; added six top homepage quick actions that open existing forms; reordered desktop and mobile-drawer navigation to Home → Cash → Purchases → Sales → Products → Partners → Users (when authorized).
- **Evidence:** Existing `GET /cash-transactions` reused without backend behavior changes; frontend application TypeScript check passed; full frontend ESLint passed; all 21 web test files / 57 tests passed; direct Vite production bundle passed. Combined `tsc -b` remains affected only by the previously recorded unrelated nullable product-price errors.
