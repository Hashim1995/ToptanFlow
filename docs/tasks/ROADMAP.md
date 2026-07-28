# TOPTANFLOW Roadmap

> High-level delivery sequence for the whole product.
> No fabricated calendar dates. Ordering follows business, domain, and architectural dependencies supported by `docs/analysis/01-document-analysis.md` §13 and current repository evidence.
> Epic details: [`epics/`](epics/). Active state: [`CURRENT.md`](CURRENT.md). Upcoming list: [`BACKLOG.md`](BACKLOG.md).

## Current phase

**Master-data backend (Business Partners)** — [EPIC-006](epics/EPIC-006-business-partners-backend.md) In Progress.

Likely upcoming phase after partner update/deactivate and remaining partner quality stories: either frontend master-data shell ([EPIC-021](epics/EPIC-021-frontend-application.md)) in parallel slices, or identity ([EPIC-007](epics/EPIC-007-identity-authz.md)) before transactional posting — **identity remains an open technical decision** and must not be invented.

## Phase map

### Horizon A — Completed foundation

| Epic | Status | Notes |
| --- | --- | --- |
| [EPIC-001](epics/EPIC-001-project-documentation-ai-foundation.md) Documentation & AI foundation | Done | AGENTS, agents, knowledge docs, ADRs |
| [EPIC-002](epics/EPIC-002-backend-platform-foundation.md) Backend platform | Done | NestJS, Prisma/Postgres path, health, OpenAPI/validation |
| [EPIC-003](epics/EPIC-003-domain-schema-foundation.md) Domain schema foundation | Done | Structural models only; transactional APIs not implied |
| [EPIC-004](epics/EPIC-004-currency-unit-reference-data.md) Currency & Unit | Done | Reference APIs |
| [EPIC-005](epics/EPIC-005-product-catalog-backend.md) Product catalog backend | Done | Create/read/update/deactivate + tests |
| Unplanned [TECH-001](unplanned/TECH-001-automatic-business-code-generation.md) Business codes | Done | Cross-cutting ADR-024 |

### Horizon B — Current

| Epic | Status | Focus |
| --- | --- | --- |
| [EPIC-006](epics/EPIC-006-business-partners-backend.md) Business partners backend | In Progress | US-014–016 Done; remaining [US-017](stories/US-017-business-partner-statement.md) (deferred) |
| [EPIC-023](epics/EPIC-023-testing-quality-infrastructure.md) Testing & quality | In Progress | Ongoing harness ([US-041](stories/US-041-quality-harness-expansion.md)) |
| [EPIC-021](epics/EPIC-021-frontend-application.md) Frontend application | In Progress | US-037 Done; [US-038](stories/US-038-frontend-master-data-screens.md) active |

### Horizon C — Next (near-term)

Ordered by dependency/value after current partner work:

1. EPIC-006 master-data slice largely complete (US-014–016 Done); [US-017](stories/US-017-business-partner-statement.md) waits on postings.
2. [US-037](stories/US-037-frontend-shell-foundation.md) / [US-038](stories/US-038-frontend-master-data-screens.md) when UI work is prioritized (**inference:** valuable once APIs exist; not mandated by a dated plan).
3. [EPIC-007](epics/EPIC-007-identity-authz.md) before production posting — **blocked on auth open decisions** for [US-019](stories/US-019-authentication-authorization.md).
4. [US-034](stories/US-034-append-only-audit-log.md) audit interface ideally before heavy posting (analysis M0 note) — elaborate when activated.

Estimate for near-term stories: deferred until each story activation.

### Horizon D — Later (transactional core)

Dependency spine (do not reorder casually):

```text
Warehouses/Inventory (EPIC-008)
    → Purchasing (EPIC-009)
    → Sales (EPIC-010)
Cash/Expenses (EPIC-011) alongside / after documents start posting
    → Settlement (EPIC-012)
Costing (EPIC-013) — Blocked until costing method decision
Attachments minimum (EPIC-017 / US-031) before evidence-heavy acceptance where required
```

| Epic | Status | Major dependency |
| --- | --- | --- |
| [EPIC-008](epics/EPIC-008-inventory-warehouses.md) Inventory & warehouses | Planned | Products; warehouse open decisions |
| [EPIC-009](epics/EPIC-009-purchasing.md) Purchasing | Planned | Partners, products, inventory |
| [EPIC-010](epics/EPIC-010-sales.md) Sales | Planned | Partners, products, inventory; preferably purchasing |
| [EPIC-011](epics/EPIC-011-cash-expenses.md) Cash & expenses | Planned | Partners; cash account open decisions |
| [EPIC-012](epics/EPIC-012-settlement.md) Settlement | Planned | Posted sales/purchases/cash |
| [EPIC-013](epics/EPIC-013-costing.md) Costing | Blocked | Open decision / conflict |
| [EPIC-019](epics/EPIC-019-audit-period-control.md) Audit & period control | Planned | Grows with posting modules |

### Horizon E — Deferred / gated

| Epic | Status | Gate |
| --- | --- | --- |
| [EPIC-014](epics/EPIC-014-field-sales-yati.md) Yatı | Planned | Core inventory/sales/cash/settlement; trip open decisions |
| [EPIC-015](epics/EPIC-015-fixed-assets.md) Fixed assets | Draft | Documented conflicts |
| [EPIC-016](epics/EPIC-016-bundles-promotions.md) Bundles | Draft | Open decisions |
| [EPIC-017](epics/EPIC-017-attachments-messaging.md) Attachments & messaging | Planned | Storage / WhatsApp decisions for sharing |
| [EPIC-018](epics/EPIC-018-alerts-notifications.md) Alerts | Planned | Yellow Card / threshold decisions |
| [EPIC-020](epics/EPIC-020-reporting-dashboards.md) Reporting | Planned | Ledgers first |
| [EPIC-022](epics/EPIC-022-deployment-operations-cutover.md) Deploy & cutover | Planned | Provider/backup decisions; go-live rehearsal |

## Repository vs analysis milestone note

**Inference (planning):** Analysis §13 places Identity (M1) before Master Data (M2). This repository has already delivered substantial master-data APIs **without** authentication. The roadmap records that fact honestly: continue completing master-data slices on the current branch, but treat production transactional posting as dependent on resolving identity/auth open decisions.

## Explicit non-goals of this roadmap

- No release dates or sprint calendars.
- No silent resolution of Open Decisions listed in `docs/analysis/01-document-analysis.md` §10.
- No treating Prisma models for Sale/Purchase/Cash as completed features.
