# CHANGE-019: Cash Account ownership and operation defaults

- **ID:** CHANGE-019
- **Type:** CHANGE
- **Title:** Cash Account ownership and operation defaults
- **Status:** Done
- **Trigger:** Owner requested one responsible user per Cash Account, Super-Admin-only ownership assignment/change, and automatic defaulting of that user's responsible Cash Account in all Cash operation modals.
- **Urgency:** High
- **Affected epics / stories / tasks:** EPIC-011 / US-024 Cash Accounts and movements; ADR-032; expands the narrow Super Admin exception recorded by ADR-039 for this ownership field only.
- **Why not in the original plan:** `CashAccount.responsibleUserId` and response fields already exist as optional foundation data, but account forms omit the field, assignment is not required, API updates are not Super Admin gated, and operation modals do not derive a user-specific default.
- **Confirmed owner decisions:**
  - Every Cash Account has one responsible user.
  - Only a Super Admin may select or change the responsible user.
  - When a user opens a Cash operation modal, the Cash Account for which that user is responsible is selected by default.
  - This is an end-to-end change; backend, database, API, and frontend changes are authorized where required.
- **Scope:** Ownership persistence/constraints and migration; server-side Super Admin enforcement; active-user validation; account create/edit UI; responsive responsible-user selector; default account selection across Cash In, Cash Out, Expense, Transfer, and Sale/Purchase immediate Cash flows; API/UI tests; decision/invariant/task documentation updates.
- **Out of scope:** General RBAC/permission catalog; per-account visibility; preventing users from manually choosing another account after the default is applied; changing Cash posting, balance, transfer, Sale/Purchase, or partner-debt calculations.
- **Approved resolution (2026-08-03):** One-to-one required ownership; random
  one-time assignment of existing dev accounts to distinct active users; the
  logged-in user's account always wins as the initial default even from account
  context; Cash Account creation and ownership changes are Super Admin-only.
- **Risks resolved:** The unique database constraint removes ambiguous ownership; migration fails explicitly when distinct active users are insufficient; API guards are authoritative; ADR-040 explicitly gives the logged-in user's default priority over account context; inactive users cannot be assigned and responsible users cannot be deactivated before reassignment.
- **Acceptance criteria:** Required unique ownership is enforced in PostgreSQL and API validation; existing dev rows are randomly paired with distinct active users; creation and ownership changes are server-gated to Super Admin; responsive create/edit UI exposes the required owner selector only to Super Admin; every named Cash flow defaults to the logged-in user's active account but remains changeable; authenticated actor attribution is unchanged; API/web lint, type checks, tests, and builds pass.
- **Impact on current work:** Completed; US-024 remains in Review with this approved extension implemented.
- **Roadmap impact:** Extends US-024 and the Super Admin exception without activating general permissions.
- **Result:** Required unique ownership is live in the local development database; Super Admin-only creation/ownership is enforced server-side and represented in the responsive UI; all specified Cash selectors default to the logged-in user's responsible active account while remaining editable; transaction actor logic is unchanged.
- **Follow-up actions:** None for CHANGE-019. General capability permissions remain Deferred under US-050.
- **Evidence:**
  - ADR-040; updated ADR-032 / ADR-039, invariants, terminology, workflow map, and analysis override.
  - `20260803010000_cash_account_required_unique_owner` applied successfully to `toptanflow_dev`; Prisma schema validate/generate passed.
  - API: required/unique relation, Super Admin create guard, field-level ownership guard, active-user validation, distinct ownership conflict, and responsible-user deactivation block.
  - Web: Super Admin owner selector, ordinary-user read-only owner display, hidden ordinary-user create action, and shared responsible-account default helper across Cash In/Out/Expense/Transfer and Sale/Purchase immediate Cash flows.
  - TypeScript: API non-emitting check passed; frontend application check passed.
  - Lint: all changed API files passed; full frontend ESLint passed. Full API lint still reports 12 pre-existing formatting errors in untouched files and was not expanded into this change.
  - Tests: API 28 suites / 307 tests passed; web 21 files / 57 tests passed, including two new default-selection tests.
  - Builds: API production build passed; Vite production bundle passed. Combined web `tsc -b` remains blocked by two pre-existing nullable price-call errors in `products-page.tsx:577,590` outside CHANGE-019.
