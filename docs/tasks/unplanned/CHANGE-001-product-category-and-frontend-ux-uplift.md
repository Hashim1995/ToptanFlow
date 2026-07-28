# CHANGE-001: ProductCategory reference data + frontend UX quality bar

- **ID:** CHANGE-001
- **Type:** CHANGE
- **Title:** ProductCategory flat reference entity and elevated frontend UX quality bar
- **Status:** Done
- **Trigger:** Owner feedback 2026-07-29 — product categories must be selectable related
  reference data (separate table); master-data UI/UX and app shell judged insufficient;
  future frontend must meet a high Ant Design UX bar.
- **Urgency:** High (corrects Product master-data model and prevents weak UI recurrence)
- **Affected epics / stories / tasks:** EPIC-005, EPIC-021; Product APIs; US-038 screens;
  new [US-042](../stories/US-042-product-category-and-frontend-ux-uplift.md)
- **Why not in the original plan:** Product.category was deferred as free-text scalar;
  US-038 delivered functional screens without a full Ant Design form/filter quality bar.
- **Approved Human Decisions (2026-07-29):**
  1. ProductCategory is a **flat** reusable reference list (name + soft-deactivate);
     Product uses nullable `categoryId` FK instead of free-text `category`.
  2. UX uplift covers **entire app shell + all master-data screens**; future `apps/web`
     UI work must satisfy the Forms/Filters quality bar in `docs/technical/ui-requirements.md`.
  3. BRD-CA-18 (historical category reporting) remains **open** — not resolved here.
- **Scope:** Docs/gates; ProductCategory API + migration; shared web UX kit; shell polish;
  category + currencies/units/products/partners screen uplift; verification
- **Out of scope:** Hierarchical categories; BRD-CA-18 snapshots; auth; warehouses; costing;
  non-Ant UI kits; browser E2E framework choice
- **Risks:** Existing free-text categories need backfill; UI rewrite touches all US-038 screens
- **Acceptance criteria:**
  - [x] ProductCategory CRUD/list soft-deactivate delivered
  - [x] Product create/update/list use `categoryId` + category summary
  - [x] Category dropdown on product form; category master screen
  - [x] App shell + master-data screens meet ui-requirements Forms/Filters bar
  - [x] Cursor rule points agents at UX bar
  - [x] Build/lint (+ API tests, web Vitest) green
- **Impact on current work:** Pauses further US-041 elaboration; US-042 becomes active
- **Roadmap impact:** Temporary frontend/quality focus; resume warehouses only after BRD-OD-02
- **Result:** Done — flat ProductCategory + Product.categoryId; UX kit/shell; all master-data screens uplifted; BRD-CA-18 still open.
- **Follow-up actions:** Owner chooses next story (US-041 resume or other).
- **Evidence:** TASK-042-01..05 Done; API unit 65 + e2e 32; web test 14 + lint/build green.
