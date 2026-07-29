# Planning changelog

Planning-history only. Not a product release-notes replacement.

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