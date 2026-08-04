# CHANGE-031: Mobile decimal comma input support

- **ID:** CHANGE-031
- **Type:** CHANGE
- **Title:** Mobile decimal comma input support
- **Status:** Done
- **Trigger:** Owner reported iOS mobile keyboards enter decimals with comma (`12,5`) while the app expected a dot (`12.5`).
- **Urgency:** High
- **Affected epics / stories / tasks:** Frontend decimal inputs shared by Products, Sales, Purchases, Cash.
- **Scope:** Shared decimal normalize/parse/format helpers; DecimalInput accepts comma or dot; money blur finalizes to exactly 2 decimals; quantity keeps existing precision.
- **Out of scope:** Backend/API/schema, display `formatMoney` AZN label behavior, auth/routing/PWA.
- **Result:** Typing `12,5` normalizes to canonical `12.5` / money `12.50` without clearing mid-entry; API payloads remain dot-decimal.
- **Evidence:** Shared helpers + DecimalInput tests; scoped ESLint; Vite production build (see CHANGELOG).
