# TOPTANFLOW Roadmap

> High-level delivery sequence for the whole product.
> No fabricated calendar dates. Ordering follows business, domain, and architectural dependencies supported by `docs/analysis/01-document-analysis.md` §13, [ADR-029](../decisions/ADR-029-single-product-quantity-no-warehouse.md), [ADR-030](../decisions/ADR-030-signed-business-partner-debt-balance.md), [ADR-031](../decisions/ADR-031-currency-reserved-for-future-cash.md), and current repository evidence.
> Epic details: [`epics/`](epics/). Active state: [`CURRENT.md`](CURRENT.md). Upcoming list: [`BACKLOG.md`](BACKLOG.md).

## Current phase

**CHANGE-003 / ADR-030 / ADR-031 — signed partner debt + AZN-only.** One signed Business Partner debt balance; Currency not current master data (reserved for future Cash). [CHANGE-002](unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) / ADR-029 **Done** (product quantity; EPIC-008 Cancelled). After CHANGE-003: Purchasing / Sales with `Product.currentQuantity` + signed balance; no currency fields.

## Phase map

### Horizon A — Completed foundation

| Epic | Status | Notes |
| --- | --- | --- |
| [EPIC-001](epics/EPIC-001-project-documentation-ai-foundation.md) Documentation & AI foundation | Done | AGENTS, agents, knowledge docs, ADRs |
| [EPIC-002](epics/EPIC-002-backend-platform-foundation.md) Backend platform | Done | NestJS, Prisma/Postgres path, health, OpenAPI/validation |
| [EPIC-003](epics/EPIC-003-domain-schema-foundation.md) Domain schema foundation | Done | Structural models only; transactional APIs not implied |
| [EPIC-004](epics/EPIC-004-currency-unit-reference-data.md) Currency & Unit | Done (Units); Currency **Cancelled** | Units remain; Currency CRUD superseded by ADR-031 / CHANGE-003 |
| [EPIC-005](epics/EPIC-005-product-catalog-backend.md) Product catalog backend | Done | Create/read/update/deactivate + tests; quantity extended under CHANGE-002 / ADR-029 |
| Unplanned [TECH-001](unplanned/TECH-001-automatic-business-code-generation.md) Business codes | Done | Cross-cutting ADR-024 |

### Horizon B — Current

| Epic / CHANGE | Status | Focus |
| --- | --- | --- |
| [CHANGE-003](unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md) Signed partner debt + AZN-only | In Progress | ADR-030/031; remove Currency CRUD; partner signed balance |
| [CHANGE-002](unplanned/CHANGE-002-single-product-quantity-no-warehouse.md) Product quantity (ADR-029) | Done | `Product.currentQuantity` + history; no warehouse/stock |
| [EPIC-006](epics/EPIC-006-business-partners-backend.md) Business partners backend | In Progress | US-014–016 Done; [US-017](stories/US-017-business-partner-statement.md) deferred (retarget signed balance) |
| [EPIC-023](epics/EPIC-023-testing-quality-infrastructure.md) Testing & quality | In Progress | Ongoing harness ([US-041](stories/US-041-quality-harness-expansion.md)) |
| [EPIC-021](epics/EPIC-021-frontend-application.md) Frontend application | In Progress | US-037/038 Done; Currency UI to be removed under CHANGE-003 |

### Horizon C — Next (near-term)

Ordered by dependency/value after CHANGE-003:

1. Finish CHANGE-003 / ADR-030 / ADR-031 (signed partner debt; no Currency master data; static AZN).
2. EPIC-006 master-data slice largely complete (US-014–016 Done); [US-017](stories/US-017-business-partner-statement.md) waits on postings (one signed running balance).
3. [EPIC-009](epics/EPIC-009-purchasing.md) Purchases — `Product.currentQuantity` + signed partner debt; **no** `warehouseId`; AZN-only.
4. [EPIC-010](epics/EPIC-010-sales.md) Sales — same quantity + signed balance model; preferably after purchasing.
5. [EPIC-007](epics/EPIC-007-identity-authz.md) largely Done (US-018/019); production posting still assumes auth in place.
6. [US-034](stories/US-034-append-only-audit-log.md) audit interface ideally before heavy posting — elaborate when activated.

Estimate for near-term stories: deferred until each story activation.

### Horizon D — Later (transactional core)

Dependency spine (ADR-029; do not reorder casually):

```text
Products (incl. quantity / history) — CHANGE-002 / EPIC-005
    → Business Partners (EPIC-006; signed debt per ADR-030 / CHANGE-003)
    → Purchases (EPIC-009)
    → Sales (EPIC-010)
Cash Multi-Account (EPIC-011 / CHANGE-004) after Purchases/Sales posting exists
    → Settlement allocation (EPIC-012; signed balance, not dual AR/AP)
Fixed Assets (EPIC-015) — future; separate from Products
Costing (EPIC-013) — Blocked until costing method decision
Attachments minimum (EPIC-017 / US-031) before evidence-heavy acceptance where required
Currency CRUD is not on this spine (ADR-031); future multi-currency only under Cash.
```

| Epic | Status | Major dependency |
| --- | --- | --- |
| [EPIC-008](epics/EPIC-008-inventory-warehouses.md) Inventory & warehouses | **Cancelled** | Superseded by ADR-029 / CHANGE-002 |
| [EPIC-009](epics/EPIC-009-purchasing.md) Purchasing | Planned | Partners, products + quantity; signed debt; AZN-only; no warehouse |
| [EPIC-010](epics/EPIC-010-sales.md) Sales | Planned | Partners, products + quantity; signed debt; AZN-only; preferably purchasing |
| [EPIC-011](epics/EPIC-011-cash-expenses.md) Multi-Cash-Account | In Progress | CHANGE-004 / ADR-032–037; AZN; Currency runtime still future (ADR-031) |
| [EPIC-012](epics/EPIC-012-settlement.md) Settlement | Planned | Posted sales/purchases/cash; **retargeted** to signed balance (ADR-030) |
| [EPIC-013](epics/EPIC-013-costing.md) Costing | Blocked | Open decision / conflict |
| [EPIC-019](epics/EPIC-019-audit-period-control.md) Audit & period control | Planned | Grows with posting modules |

### Horizon E — Deferred / gated

| Epic | Status | Gate |
| --- | --- | --- |
| [EPIC-014](epics/EPIC-014-field-sales-yati.md) Yatı | Planned | **Blocked:** vehicle-warehouse model withdrawn; redesign required under ADR-029 before implementation; also core sales/cash/settlement |
| [EPIC-015](epics/EPIC-015-fixed-assets.md) Fixed assets | Draft | Documented conflicts; separate from Products (ADR-029) |
| [EPIC-016](epics/EPIC-016-bundles-promotions.md) Bundles | Draft | Open decisions |
| [EPIC-017](epics/EPIC-017-attachments-messaging.md) Attachments & messaging | Planned | Storage / WhatsApp decisions for sharing |
| [EPIC-018](epics/EPIC-018-alerts-notifications.md) Alerts | Planned | Yellow Card / threshold decisions |
| [EPIC-020](epics/EPIC-020-reporting-dashboards.md) Reporting | Planned | Ledgers first |
| [EPIC-022](epics/EPIC-022-deployment-operations-cutover.md) Deploy & cutover | Planned | Provider/backup decisions; go-live rehearsal |

## Repository vs analysis milestone note

**Inference (planning):** Analysis §13 places Identity (M1) before Master Data (M2). This repository has already delivered substantial master-data APIs **with** authentication (EPIC-007 Done). ADR-029 removes the warehouse spine; ADR-030/031 replace dual AR/AP and Currency CRUD. Finish CHANGE-003, then transactional Purchases/Sales.

## Explicit non-goals of this roadmap

- No release dates or sprint calendars.
- No silent resolution of Open Decisions listed in `docs/analysis/01-document-analysis.md` §10.
- No treating Prisma models for Sale/Purchase/Cash as completed features.
- No resurrecting EPIC-008 warehouse/stock module without a new Approved Human Decision.
- No resurrecting Currency reference CRUD as current master data without a new Approved Human Decision (ADR-031).
