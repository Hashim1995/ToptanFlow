# CHANGE-026: Compact mobile Cash detail and history

- **ID:** CHANGE-026
- **Type:** CHANGE
- **Title:** Compact mobile Cash detail and history
- **Status:** Done
- **Trigger:** Owner requested a lower-height, icon-led Cash account detail and transaction history on mobile.
- **Urgency:** Medium
- **Scope:** Mobile-only Cash account header, balance/facts/actions density, history heading/filter spacing, and transaction-card hierarchy with direct compact cancellation.
- **Out of scope:** Desktop presentation, transaction logic, APIs, permissions, balances, validation, and cancellation behavior.
- **Acceptance criteria:** The Cash summary and each transaction consume materially less vertical space; direction, amount, status, date, party, balance, notes, and cancellation remain visible or one tap away; no dropdown is introduced.
- **Result:** Mobile Cash detail now uses a shorter balance panel, two-column facts, four compact icon actions, a shorter history header, and icon-led transaction rows with amount/status and a 27px direct cancellation action in the header. Available Business Partner names are bold and highlighted in both Cash history mobile lists.
- **Evidence:** Frontend ESLint, tests, and diff checks passed.
