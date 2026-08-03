# Backlog

> Upcoming user stories that are **not** the current implementation focus.
> Full text lives in [`stories/`](stories/). Do not duplicate acceptance detail here.
> Active work: [`CURRENT.md`](CURRENT.md). Order context: [`ROADMAP.md`](ROADMAP.md).

Priority: **H** High · **M** Medium · **L** Low

## Ready / immediate next

| ID | Title | Epic | Priority | Depends on | Task elaboration |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | See Active — finish CHANGE-003 first |

## Active (see CURRENT.md)

| ID | Title | Track | Priority | Status | Next |
| --- | --- | --- | --- | --- | --- |
| [CHANGE-003](unplanned/CHANGE-003-signed-partner-balance-and-azn-only.md) | Signed partner debt + AZN-only | ADR-030 / ADR-031 | H | In Progress | Complete CHANGE-003 acceptance |

## EPIC-006 remaining (after US-016)

| ID | Title | Priority | Depends on | Notes |
| --- | --- | --- | --- | --- |
| [US-017](stories/US-017-business-partner-statement.md) | Business partner statement | M | EPIC-009–012 | **Deferred**; dual AR/AP **superseded** by ADR-030 signed balance |

## Near-term enablers

| ID | Title | Epic | Priority | Notes |
| --- | --- | --- | --- | --- |
| [US-037](stories/US-037-frontend-shell-foundation.md) | Frontend shell foundation | EPIC-021 | H | **Done** |
| [US-038](stories/US-038-frontend-master-data-screens.md) | Master-data UI screens | EPIC-021 | H | **Done**; Currency UI removed under CHANGE-003 / ADR-031 |
| [US-041](stories/US-041-quality-harness-expansion.md) | Quality harness expansion | EPIC-023 | M | **Done** |
| [US-018](stories/US-018-user-account-foundation.md) | User account foundation | EPIC-007 | H | **Done** |
| [US-019](stories/US-019-authentication-authorization.md) | Authentication & authorization | EPIC-007 | H | **Done** |
| [US-034](stories/US-034-append-only-audit-log.md) | Append-only audit history | EPIC-019 | H | Prefer before heavy posting |

## Transactional core (later)

| ID | Title | Epic | Priority | Major gate |
| --- | --- | --- | --- | --- |
| [US-007](stories/US-007-currency-reference-data.md) | Currency reference data | EPIC-004 | — | **Cancelled** (superseded ADR-031); not current master data |
| [US-020](stories/US-020-warehouse-master-data.md) | Warehouse master data | EPIC-008 | — | **Cancelled** (superseded ADR-029); was Done historically |
| [US-021](stories/US-021-inventory-movements-balances.md) | Inventory movements & balances | EPIC-008 | — | **Cancelled** (superseded ADR-029); TASK-021-05 abandoned |
| — | Product quantity / history | Products / CHANGE-002 | H | **Done** — one `currentQuantity` per product (ADR-029) |
| — | Signed partner debt + AZN | CHANGE-003 | H | **Active** — ADR-030 / ADR-031 |
| [US-022](stories/US-022-purchase-draft-post.md) | Purchase draft→post | EPIC-009 | H | Partners + product quantity + signed debt; AZN-only; **no** warehouseId |
| [US-023](stories/US-023-sale-draft-post.md) | Sale draft→post | EPIC-010 | H | Partners + product quantity + signed debt; AZN-only; **no** warehouseId |
| [US-024](stories/US-024-money-accounts-cash-movements.md) | Cash Accounts & foundation movements | EPIC-011 | H | **Ready** — CHANGE-004 / ADR-032–037; TASK-024-01..04 |
| [US-025](stories/US-025-expense-recording.md) | Expense recording | EPIC-011 | M | US-024 |
| [US-026](stories/US-026-payment-allocation-advances.md) | Allocations & advances | EPIC-012 | H | Posted documents + cash; **retargeted** signed balance (ADR-030) |
| [US-027](stories/US-027-inventory-costing-method.md) | Costing method | EPIC-013 | H | **Blocked** — BRD-OD-06 / conflict |
| [US-035](stories/US-035-period-closing-corrections.md) | Period closing & corrections | EPIC-019 | M | Posting + audit |
| [US-036](stories/US-036-operational-reporting.md) | Reporting & dashboard | EPIC-020 | M | Ledgers |

## Deferred / gated

| ID | Title | Epic | Priority | Gate |
| --- | --- | --- | --- | --- |
| [US-028](stories/US-028-yati-trip-lifecycle.md) | Yatı trip lifecycle | EPIC-014 | M | **Redesign required** under ADR-029 (vehicle warehouses withdrawn); core modules |
| [US-029](stories/US-029-fixed-asset-lifecycle.md) | Fixed assets | EPIC-015 | L | Conflicts; separate from Products |
| [US-030](stories/US-030-bundle-sale.md) | Bundle sale | EPIC-016 | L | Open decisions |
| [US-031](stories/US-031-attachments-evidence.md) | Attachments / evidence | EPIC-017 | M | File storage OD |
| [US-032](stories/US-032-whatsapp-document-sharing.md) | WhatsApp sharing | EPIC-017 | L | Consent/provider ODs |
| [US-033](stories/US-033-critical-stock-yellow-cards.md) | Alerts & Yellow Cards | EPIC-018 | M | BRD-OD-18/19; retarget to product quantity thresholds |
| [US-039](stories/US-039-deployment-topology.md) | Deployment topology | EPIC-022 | M | Provider OD |
| [US-040](stories/US-040-opening-balances-cutover.md) | Opening balances & cutover | EPIC-022 | M | Ledgers + ops |

## Completed (index only)

See story files marked Done (US-001–US-016 except US-007 **Cancelled** under ADR-031; US-037) and [`CHANGELOG.md`](CHANGELOG.md). Do not re-list full detail here. Cancelled warehouse stories (US-020/021) and Currency (US-007) keep historical task evidence in their files.
