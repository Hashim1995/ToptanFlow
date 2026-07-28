# Planning changelog

Planning-history only. Not a product release-notes replacement.

## 2026-07-29

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