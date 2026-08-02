# CHANGE-025: Compact mobile master-data lists

- **ID:** CHANGE-025
- **Type:** CHANGE
- **Title:** Compact mobile master-data lists
- **Status:** Done
- **Trigger:** Owner requested denser, more modern Product and Business Partner mobile lists and better placement of simple Sale/Purchase actions.
- **Urgency:** Medium
- **Scope:** Mobile-only Product and Business Partner card density and direct header actions; move the two Posted Sale/Purchase actions into compact card-header icons.
- **Out of scope:** Desktop presentation, APIs, permissions, mutations, validation, calculations, and business behavior.
- **Acceptance criteria:** Product and Partner cards show more records per viewport without losing core values; edit/status actions remain one tap away; Posted Sale/Purchase cards do not render a separate bottom bar for only View and Cancel.
- **Result:** Product and Partner mobile cards now use tighter spacing, smaller value surfaces, and compact header icon actions. Posted Sale/Purchase cards place View and Cancel as 29px header icons; Draft documents retain the bottom bar because they expose multiple actions.
- **Evidence:** Frontend ESLint, tests, and diff checks passed.
