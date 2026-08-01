# Planning changelog

Planning-history only. Not a product release-notes replacement.

## 2026-08-02

- **US-049 Done:** Cash reports & statements. APIs: `GET /cash-accounts/:id/statement` (opening/running/closing; CANCELLED + REVERSAL rows for ledger reconstruction) and `GET /cash-accounts/reports/period-summary` (turnover excludes transfer/reversal; expenses by category). UI: `/cash/reports` with AZ labels, date/account filters, summary cards + statement table/cards. Tests: `cash-reports.service.spec.ts` green. PDF/Excel deferred.
- **US-049 activated:** Cash reports & statements (TASK-049-01 API, TASK-049-02 UI). Running-balance statement + period summary; transfers/reversals handled per ADR-034/035.
- **CHANGE-006 correction:** Cash In cancellation always allowed even if account balance would go negative; no ADR-037 override required for that cancel path. Ordinary Cash Out / Expense / Transfer creation remain gated. UI warns; tests cover cancel-into-negative.
- **CHANGE-006 / US-046 Done:** Lifecycle cancel/edit/deactivate hardening for Purchase, Sale, Cash In/Out, Expense, Transfer. Documented: posted facts immutable (including notes); no deactivate on completed ops; linked POSTED cash must be cancelled before Sale/Purchase cancel; purchase cancel blocked on insufficient quantity with structured error. API/UI confirmations + regression tests. Formal cash reports remain US-049.

## 2026-08-01

- **Sale/Purchase form payment checkboxes:** «Ödəniş qəbul et» / «İndi ödə» (with cash account + amount) now appear on create/edit modals, not only post-confirm. Shared payment section; Save & Post carries selection into confirm.
- **Cash ↔ Sale/Purchase linking:** Related-doc Select used `pageSize: 200` but API `@Max(100)` → 400 and empty options. Fixed to `pageSize: 100` + load-error empty state. Save & Post nested modals hid payment checkboxes — form modal closes while post-confirm is open; confirm `zIndex={1100}`.
- **Sale/Purchase dates show HH:mm:** UI again uses `formatDateTime` (`dd.MM.yyyy HH:mm`) for business dates everywhere (list/detail/related docs). Create/update stamps Asia/Baku clock onto `businessDate` (same as cash) so new docs are not stuck at `00:00`.
- **Datetime coverage:** Cash create + `cash-balance` stamp Asia/Baku clock onto date-only `transactionDate`; global `BakuDateSerializationInterceptor` covers Sale/Purchase/master-data `Date` fields; Sale/Purchase `businessDate` UI uses `formatDate` (no fake `00:00`); related-doc options same.
- **Cash transactionDate clock:** Create DTOs send date-only (`YYYY-MM-DD`); lists use `formatDateTime`, which showed fake `00:00`. Cash create now stamps the current Asia/Baku time onto the picked calendar day so `transactionDate` matches wall-clock (e.g. `2026-08-02T00:25:49+04:00`).
- **API datetime serialization (Asia/Baku):** Responses no longer expose bare UTC `...Z` for business timestamps (looked 4h “behind” in Network/UI). Cash mappers + global `BakuDateSerializationInterceptor` emit offset ISO (`...+04:00`). Example: create at 02.08.2026 00:10 Baku → `2026-08-02T00:10:35.347+04:00`. Storage remains UTC with `TZ=UTC`.
- **Date/time DB root cause:** PostgreSQL columns are `TIMESTAMP(3)` without time zone (Prisma default). Host Node was `Asia/Baku`, so `pg` re-interpreted UTC-written walls as local (−4h on every read). Fix: force `TZ=UTC` for API (`main.ts`, `run-patched-main.cjs`, Jest, `.env.example`). UI remains Asia/Baku via datetime helpers. pgAdmin shows naive UTC walls for these columns — not Baku local.
- **Cash module hotfix:** Root cause was broken `@toptanflow/datetime` monorepo resolution (Vite + Nest could not resolve the package → API would not start, web crashed). Date helpers now live in-app (`apps/api/src/common/datetime/`, `apps/web/src/shared/datetime/`). Cash In/Out/Expense modals gained account picker when opened from header; related Sale/Purchase dropdowns load POSTED docs only after partner is selected.
- **Date/time standardization (Asia/Baku):** Shared package `@toptanflow/datetime` (`packages/datetime`) — UTC storage, Asia/Baku interpretation/display (`dd.MM.yyyy HH:mm`), no manual ±4h. Web formatters, DatePickers, Sale/Purchase/Cash filters and APIs (date-only parse, inclusive Baku day bounds, cash workspace “today”) wired to the shared helpers. Tests: package vitest (9), web format tests, API `datetime.spec` + related service suites green.
- **CHANGE-005 / ADR-038:** Cash primary operations = Cash In / Cash Out / Expense / Transfer only. Docs (terminology, invariants, workflows 10–13, EPIC-011, US-043/044/045/048) reframed; Customer Receipt / Supplier Payment are not primary UX names. Implementation: partner-required Cash In/Out APIs, Transfer aggregate, four-action Cash workspace.
- **US-025 / US-045 / US-048 Done (cash wave):** ExpenseCategory + expense cash-out; partner Cash In/Out with partner debt; optional immediate payment on Sale/Purchase post (partial/over); cancel blocked while linked POSTED cash exists. ADR-028/030 remain binding. Gate: `yarn test --testPathPatterns='sales|purchases|cash'`.
- **US-024 Stage 1–2 → Review:** TASK-024-01 schema/migration Done; TASK-024-02 Cash Account APIs Done; TASK-024-03 foundation Cash In/Out + cancel Done (`apps/api/src/cash/`, 20 unit tests); TASK-024-04 Cash UI Done (`/cash/accounts`, detail, mədaxil/məxaric). Next: US-025 Expenses or US-044 Transfers.
- **CHANGE-004 / EPIC-011 Multi-Cash-Account activated:** Impact report [`docs/analysis/02-multi-cash-account-impact-report.md`](../analysis/02-multi-cash-account-impact-report.md); ADRs [032](../decisions/ADR-032-multiple-cash-accounts.md)–[037](../decisions/ADR-037-controlled-negative-cash.md); business invariants/terminology/workflows updated; BRD-OD-03 resolved; BRD-OD-05/OD-08 partially resolved. [US-024](stories/US-024-money-accounts-cash-movements.md) Ready with TASK-024-01..04; stories US-043–050 planned. Sales US-023 remains Review (no regress). Next: TASK-024-01 schema/migration.
- **US-023 / EPIC-010 activated → In Progress:** Sale Nest module + web list/form/detail (`TASK-023-01` / `TASK-023-02`). Draft CRUD; `POST /sales/:id/post` (negative-qty reason when needed); `POST /sales/:id/cancel`; `SAL-` document numbers; ProductQuantityHistory + BusinessPartnerDebtMovement; no cash/warehouse/currency. Sales Returns deferred. Mirrors US-022 purchase patterns.
- **UI polish:** Added `@phosphor-icons/react`; icons across shell, home, login, purchases, and master-data lists; denser tables with logical column order, badges/tags, dropdown actions, and shared format cells (`CodeText` / `EntityCell` / `MoneyCell`).

## 2026-07-31

- **Owner decision / US-022 follow-up:** Same product may appear on multiple purchase lines (different prices/discounts allowed). Purchase create/edit moved from dedicated pages into a compact modal on the list/detail screens. Invariant Purchasing updated; TASK-022-01/02 acceptance wording updated.
- **US-022 implementation → Review:** Purchase Nest module + web list/form/detail (`TASK-022-01` / `TASK-022-02`). Draft CRUD; `POST /purchases/:id/post`; `POST /purchases/:id/cancel`; `PUR-` document numbers; ProductQuantityHistory + BusinessPartnerDebtMovement; no cash/warehouse/currency. Purchase Returns deferred. Tests: purchases.service.spec (11), purchases.e2e (7), web purchase schema/labels.
- **Epic/Story activated → [EPIC-009](epics/EPIC-009-purchasing.md) / [US-022](stories/US-022-purchase-draft-post.md):** Purchase list module — Draft CRUD, post (`POSTED`), cancel; product quantity ↑ + partner debt ↓ on post; no cash/warehouse/currency. Tasks [TASK-022-01](tasks/TASK-022-01-purchase-draft-post-cancel-apis.md), [TASK-022-02](tasks/TASK-022-02-purchase-list-form-details-ui.md). Document numbers: `PUR-` + NumberSequence `PURCHASE` (Approved Human Decision). Purchase Returns deferred. ADR-025: no granular `purchase.*` permissions in v1.
- **CHANGE / Approved Human Decision → [CHANGE-003](unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md) / [ADR-030](../decisions/ADR-030-signed-business-partner-debt-balance.md) / [ADR-031](../decisions/ADR-031-currency-reserved-for-future-cash.md):** One signed Business Partner debt balance (not separate AR/AP); Currency removed from current domains — static AZN; Currency reserved for future Cash only. [US-007](stories/US-007-currency-reference-data.md) **Cancelled** (ADR-031); EPIC-004 Currency portion superseded (Units remain). EPIC-012 / US-017 / US-026 dual-balance wording superseded by ADR-030. Active: CHANGE-003; next after Done: EPIC-009 (signed balance + `Product.currentQuantity`; no currency).
- **CHANGE / Approved Human Decision → [CHANGE-002](unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / [ADR-029](../decisions/ADR-029-single-product-quantity-no-warehouse.md):** Single product quantity; no separate Warehouse or Stock module. Owner decision 2026-07-31. [EPIC-008](epics/EPIC-008-inventory-warehouses.md) **Cancelled**; [US-020](stories/US-020-warehouse-master-data.md) / [US-021](stories/US-021-inventory-movements-balances.md) **Cancelled** (Done task history kept; TASK-021-05 abandoned). Planning retargeted: Products (incl. quantity) → Business Partners → Purchases → Sales → Cash → Fixed Assets (future). Active work: finish CHANGE-002, then Purchasing/Sales without `warehouseId` (`Product.currentQuantity`). EPIC-014 blocked pending Yatı redesign. ADR-026 superseded for warehouse topology.
- **Docs / Approved Human Decision → [ADR-028](../decisions/ADR-028-sale-purchase-cash-separation.md):** Sale/Purchase must never directly mutate cash; cash only via separate Cash In/Out; optional link/allocation (same UI or later); separate audit; unlinked cash + partial/multi allocation required. Updated invariants, terminology, workflow-map, analysis §3.5–3.10 / §5.1–5.6 / §10.3, EPIC-009–012, US-022/023/024/026. No application code.
- **Task completed:** [TASK-021-04](tasks/TASK-021-04-inventory-balances-transfer-ui.md) Inventory UI (Stok qalıqları, Anbar transferi, düzəliş/silinmə). Next: [TASK-021-05](tasks/TASK-021-05-stock-count-workflow.md).
- **Task completed:** [TASK-021-03](tasks/TASK-021-03-inventory-api-e2e.md) Inventory API e2e (9 passed; ADR-027 negative accepted). Next: [TASK-021-04](tasks/TASK-021-04-inventory-balances-transfer-ui.md).
- **Approved Human Decision → [ADR-027](../decisions/ADR-027-allow-negative-stock-v1.md):** allow negative warehouse/product stock quantities in v1 (Option A); supersedes ADR-026 hard-block; remaining BRD-OD-04 controls deferred. Inventory API hard-block removed.
- **Task completed:** [TASK-021-02](tasks/TASK-021-02-inventory-movement-post-api.md) Inventory post/read API (`/api/v1/inventory/*`; 15 unit tests). Next: [TASK-021-03](tasks/TASK-021-03-inventory-api-e2e.md).
- **Task completed:** [TASK-021-01](tasks/TASK-021-01-stock-movement-balance-persistence.md) `StockMovement` + `StockBalance` (migration `20260731090000_add_stock_movement_balance`). Next: [TASK-021-02](tasks/TASK-021-02-inventory-movement-post-api.md).
- **Story completed:** [US-020](stories/US-020-warehouse-master-data.md) Warehouse master data (TASK-020-01..05). Next: [US-021](stories/US-021-inventory-movements-balances.md) / [TASK-021-01](tasks/TASK-021-01-stock-movement-balance-persistence.md).
- **Task completed:** [TASK-020-05](tasks/TASK-020-05-warehouse-ui-screens.md) Warehouse UI **Anbarlar** (lint/test/build green).
- **Task completed:** [TASK-020-04](tasks/TASK-020-04-warehouse-api-e2e.md) Warehouse API e2e (12 passed). Next: [TASK-020-05](tasks/TASK-020-05-warehouse-ui-screens.md).
- **Task completed:** [TASK-020-03](tasks/TASK-020-03-warehouse-crud-api.md) Warehouse CRUD API (`/api/v1/warehouses`; code via `WAREHOUSE` sequence; 13 unit tests). Next: [TASK-020-04](tasks/TASK-020-04-warehouse-api-e2e.md).
- **Task completed:** [TASK-020-02](tasks/TASK-020-02-warehouse-persistence-model.md) Warehouse Prisma model + migration + seed `Əsas anbar` / `WAREHOUSE` sequence. Next: [TASK-020-03](tasks/TASK-020-03-warehouse-crud-api.md).
- **Epic activated:** [EPIC-008](epics/EPIC-008-inventory-warehouses.md) inventory only (Yatı/sales/purchases/cash deferred).
- **Approved Human Decision → [ADR-026](../decisions/ADR-026-initial-warehouses-v1.md):** BRD-OD-02 v1 — one seeded GENERAL warehouse; multi-warehouse schema; no VEHICLE; one-step transfers; hard-block negative stock (OD-04 exceptions deferred).
- **Story Ready:** [US-020](stories/US-020-warehouse-master-data.md); TASK-020-01 **Done**; TASK-020-02..05 elaborated. Next: TASK-020-02.
- **Story elaborated (Planned):** [US-021](stories/US-021-inventory-movements-balances.md) TASK-021-01..05; activate after US-020 Done.

## 2026-07-30

- **Epic completed:** [EPIC-007](epics/EPIC-007-identity-authz.md); [US-019](stories/US-019-authentication-authorization.md) **Done** (TASK-019-02 protect APIs; TASK-019-03 web login/session; TASK-019-04 auth e2e — 88 e2e / web 33 tests).
- **Task completed:** [TASK-019-01](tasks/TASK-019-01-jwt-auth-module.md) JWT login/refresh/logout + `RefreshToken` model (ADR-025; 8 unit tests). Next: [TASK-019-02](tasks/TASK-019-02-protect-apis-flat-authz.md).

## 2026-07-29

- **Story completed:** [US-018](stories/US-018-user-account-foundation.md); [TASK-018-02](tasks/TASK-018-02-user-admin-api-e2e.md) **Done** (users e2e 8 passed). Next: [TASK-019-01](tasks/TASK-019-01-jwt-auth-module.md).
- **Task completed:** [TASK-018-01](tasks/TASK-018-01-user-persistence-and-crud.md) User `passwordHash` + `/users` CRUD + bootstrap seed (`argon2`; 12 unit tests; migration `20260729110103_add_user_password_hash`).
- **Approved Human Decision → [ADR-025](../decisions/ADR-025-jwt-auth-flat-users-v1.md):** JWT + Argon2id; access 24h / refresh 30d; single-company; no roles/admin types — any active user can do everything. Closes auth open decisions for v1. [US-018](stories/US-018-user-account-foundation.md) In Progress; [US-019](stories/US-019-authentication-authorization.md) Ready; tasks TASK-018-01/02, TASK-019-01..04 elaborated.
- **Owner focus:** Jump to identity/auth — [EPIC-007](epics/EPIC-007-identity-authz.md), [US-018](stories/US-018-user-account-foundation.md), [US-019](stories/US-019-authentication-authorization.md). No tasks elaborated; blocked on Approved Human Decisions (auth implementation, AD-17/18, permission registry).
- **Sequential US review:** First incomplete by ID [US-017](stories/US-017-business-partner-statement.md) → **Deferred** (EPIC-009–012 postings + BRD-OD-11). Next review: [US-018](stories/US-018-user-account-foundation.md).
- **Story resumed:** [US-041](stories/US-041-quality-harness-expansion.md); [TASK-041-02](tasks/TASK-041-02-reactivation-and-helper-regressions.md) **Done** (reactivation e2e 72; web Vitest 17).
- **Approved Human Decision:** Soft-deactivated master-data entities may be
  reactivated via PATCH `isActive: true` (currencies, units, categories,
  products, business partners). Operator UI must expose **Aktiv et**. Prior
  US-015/US-038 “no reactivation” exclusions superseded for this operational
  completeness gap. Cursor rule `operational-completeness.mdc` records the
  process: fill obvious user/business workflow gaps even when task docs omit them.
- **Unplanned CHANGE completed:** [CHANGE-001](unplanned/CHANGE-001-product-category-and-frontend-ux-uplift.md) ProductCategory flat reference + frontend UX quality bar; [US-042](stories/US-042-product-category-and-frontend-ux-uplift.md) **Done** (TASK-042-01..05).
- **Unplanned CHANGE:** [CHANGE-001](unplanned/CHANGE-001-product-category-and-frontend-ux-uplift.md) ProductCategory flat reference + frontend UX quality bar (owner).
- **Story activated:** [US-042](stories/US-042-product-category-and-frontend-ux-uplift.md); TASK-042-01 docs/gates Done; US-041 further work paused.
- **Task completed:** [TASK-041-01](tasks/TASK-041-01-add-web-vitest-harness.md) web Vitest harness + 14 pure helper tests (Vitest 3.2.4; build/lint green).
- **Story activated:** [US-041](stories/US-041-quality-harness-expansion.md) quality harness expansion (safe path after US-038; warehouses/auth blocked on open decisions).
- **Story completed:** [US-038](stories/US-038-frontend-master-data-screens.md) master-data UI screens (TASK-038-05 responsive verification).
- **Task completed:** [TASK-038-05](tasks/TASK-038-05-verify-master-data-ui-responsive-states.md) ADR-005/ui-requirements matrix + build/lint.
- **Task completed:** [TASK-038-04](tasks/TASK-038-04-add-business-partner-screens.md) partner screens + soft-duplicate acknowledge UI (`web` build + lint green).
- **Task completed:** [TASK-038-03](tasks/TASK-038-03-add-product-screens.md) product screens (`Məhsullar`; type labels Hazır məhsul / Xammal / Qarışıq təyinatlı); owner guidance: do not stop for routine AZ UI labels.
- **Task completed:** [TASK-038-02](tasks/TASK-038-02-add-currency-unit-screens.md) currency/unit screens; labels approved `Valyutalar` / `Ölçü vahidləri` (`web` build + lint green).
- **Story activated:** [US-038](stories/US-038-frontend-master-data-screens.md) frontend master-data screens.
- **Tasks elaborated:** TASK-038-01 through TASK-038-05 (shared API foundation, reference-data UI, product UI, partner UI, responsive verification).
- **Task completed:** [TASK-038-01](tasks/TASK-038-01-add-master-data-frontend-api-foundation.md) typed pagination/query keys/error contracts (`web` build + lint green).
- **Task completed:** [TASK-037-03](tasks/TASK-037-03-add-routing-and-responsive-app-shell.md) routing + responsive shell; [US-037](stories/US-037-frontend-shell-foundation.md) **Done**.
- **Task completed:** [TASK-037-02](tasks/TASK-037-02-add-axios-http-client-foundation.md) Axios HTTP client + stub AZ error mapper (`web` build green).
- **Story activated:** [US-037](stories/US-037-frontend-shell-foundation.md) Frontend shell foundation; router choice `react-router-dom` recorded.
- **Tasks elaborated:** TASK-037-01, TASK-037-02, TASK-037-03.
- **Task completed:** [TASK-037-01](tasks/TASK-037-01-wire-frontend-providers-replace-template.md) providers + Vite template replaced (`web` build green).
- **Task completed:** [TASK-016-02](tasks/TASK-016-02-extend-business-partner-duplicate-check-e2e.md) soft-duplicate e2e (19 passed); exception filter preserves `code`/`candidates`.
- **Story completed:** [US-016](stories/US-016-business-partner-duplicate-soft-flag.md) BusinessPartner soft-duplicate create/update.
- **Design revision (US-016):** Removed standalone `duplicate-check` API; soft flag on create/update via `409` + `acknowledgeDuplicate`.
- **Task completed:** [TASK-016-01](tasks/TASK-016-01-add-business-partner-duplicate-check-api.md) (revised).
- **Task completed:** [TASK-015-02](tasks/TASK-015-02-extend-business-partner-update-deactivate-e2e.md) BusinessPartner update/deactivate e2e (14 tests passed).
- **Story completed:** [US-015](stories/US-015-business-partner-update-deactivate-apis.md) BusinessPartner update/deactivation APIs.

## 2026-07-28

- **Task completed:** [TASK-015-01](tasks/TASK-015-01-add-business-partner-update-deactivate-apis.md) BusinessPartner update/deactivate APIs (unit tests 50 passed).
- **Story status:** [US-015](stories/US-015-business-partner-update-deactivate-apis.md) → In Progress; next [TASK-015-02](tasks/TASK-015-02-extend-business-partner-update-deactivate-e2e.md).
- **Story activated:** [US-015](stories/US-015-business-partner-update-deactivate-apis.md) BusinessPartner update/deactivation (legacy Step 16.3).
- **Tasks elaborated:** TASK-015-01, TASK-015-02.
- **Open questions disposed:** inactive-on-new-documents enforcement deferred; no reactivation; no migration required.
- **System created:** Repository task-management foundation under `docs/tasks/`.
- **Legacy consolidation:** Prior task-specification README/template archived under `docs/tasks/archive/`.
- **Agent integration:** `AGENTS.md` + `agents/task-planner.md` and engineer inputs updated for `docs/tasks`.
- **Backfill:** US-001–US-014 / TASK-001-01–TASK-014-01 Done with evidence.
- **Unplanned inserted (historical):** TECH-001 Done (`c3619ba`, ADR-024).
- **Roadmap established:** Phases mapped from analysis M-sequence adjusted to repository reality.