# Backlog

> Upcoming user stories that are **not** the current implementation focus.
> Full text lives in [`stories/`](stories/). Do not duplicate acceptance detail here.
> Active work: [`CURRENT.md`](CURRENT.md). Order context: [`ROADMAP.md`](ROADMAP.md).

Priority: **H** High · **M** Medium · **L** Low

## Ready / immediate next

| ID | Title | Epic | Priority | Depends on | Task elaboration |
| --- | --- | --- | --- | --- | --- |
| — | *(none — US-037 is active; see CURRENT.md)* | — | — | — | — |

## Active (see CURRENT.md)

| ID | Title | Epic | Priority | Status | Next task |
| --- | --- | --- | --- | --- | --- |
| [US-037](stories/US-037-frontend-shell-foundation.md) | Frontend shell foundation | EPIC-021 | H | In Progress | [TASK-037-02](tasks/TASK-037-02-add-axios-http-client-foundation.md) |

## EPIC-006 remaining (after US-016)

| ID | Title | Priority | Depends on | Notes |
| --- | --- | --- | --- | --- |
| [US-017](stories/US-017-business-partner-statement.md) | Business partner statement | M | EPIC-009–012 | Far; needs postings |

## Near-term enablers

| ID | Title | Epic | Priority | Notes |
| --- | --- | --- | --- | --- |
| [US-037](stories/US-037-frontend-shell-foundation.md) | Frontend shell foundation | EPIC-021 | H | Scaffold exists; shell not Done |
| [US-038](stories/US-038-frontend-master-data-screens.md) | Master-data UI screens | EPIC-021 | H | After US-037 + backend readiness |
| [US-041](stories/US-041-quality-harness-expansion.md) | Quality harness expansion | EPIC-023 | M | Ongoing |
| [US-018](stories/US-018-user-account-foundation.md) | User account foundation | EPIC-007 | H | Placeholder User model only today |
| [US-019](stories/US-019-authentication-authorization.md) | Authentication & authorization | EPIC-007 | H | **Draft** — open decisions |
| [US-034](stories/US-034-append-only-audit-log.md) | Append-only audit history | EPIC-019 | H | Prefer before heavy posting |

## Transactional core (later)

| ID | Title | Epic | Priority | Major gate |
| --- | --- | --- | --- | --- |
| [US-020](stories/US-020-warehouse-master-data.md) | Warehouse master data | EPIC-008 | H | BRD-OD-02 |
| [US-021](stories/US-021-inventory-movements-balances.md) | Inventory movements & balances | EPIC-008 | H | US-020; BRD-OD-04 |
| [US-022](stories/US-022-purchase-draft-post.md) | Purchase draft→post | EPIC-009 | H | Inventory + partners |
| [US-023](stories/US-023-sale-draft-post.md) | Sale draft→post | EPIC-010 | H | Inventory + partners |
| [US-024](stories/US-024-money-accounts-cash-movements.md) | Money accounts & cash | EPIC-011 | H | BRD-OD-03/05 |
| [US-025](stories/US-025-expense-recording.md) | Expense recording | EPIC-011 | M | US-024 |
| [US-026](stories/US-026-payment-allocation-advances.md) | Allocations & advances | EPIC-012 | H | Posted documents + cash |
| [US-027](stories/US-027-inventory-costing-method.md) | Costing method | EPIC-013 | H | **Blocked** — BRD-OD-06 / conflict |
| [US-035](stories/US-035-period-closing-corrections.md) | Period closing & corrections | EPIC-019 | M | Posting + audit |
| [US-036](stories/US-036-operational-reporting.md) | Reporting & dashboard | EPIC-020 | M | Ledgers |

## Deferred / gated

| ID | Title | Epic | Priority | Gate |
| --- | --- | --- | --- | --- |
| [US-028](stories/US-028-yati-trip-lifecycle.md) | Yatı trip lifecycle | EPIC-014 | M | Core modules + trip ODs |
| [US-029](stories/US-029-fixed-asset-lifecycle.md) | Fixed assets | EPIC-015 | L | Conflicts |
| [US-030](stories/US-030-bundle-sale.md) | Bundle sale | EPIC-016 | L | Open decisions |
| [US-031](stories/US-031-attachments-evidence.md) | Attachments / evidence | EPIC-017 | M | File storage OD |
| [US-032](stories/US-032-whatsapp-document-sharing.md) | WhatsApp sharing | EPIC-017 | L | Consent/provider ODs |
| [US-033](stories/US-033-critical-stock-yellow-cards.md) | Alerts & Yellow Cards | EPIC-018 | M | BRD-OD-18/19 |
| [US-039](stories/US-039-deployment-topology.md) | Deployment topology | EPIC-022 | M | Provider OD |
| [US-040](stories/US-040-opening-balances-cutover.md) | Opening balances & cutover | EPIC-022 | M | Ledgers + ops |

## Completed (index only)

See story files marked Done (US-001–US-016) and [`CHANGELOG.md`](CHANGELOG.md). Do not re-list full detail here.
