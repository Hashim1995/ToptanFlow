# EPIC-011: Multi-Cash-Account Management

- **ID:** EPIC-011
- **Title:** Multi-Cash-Account Management
- **Status:** In Progress
- **Former title:** Cash, money accounts, and expenses

## Business objective

Deliver the financial-core **Cash** domain: any number of named Cash Accounts as
data; primary ordinary operations **Cash In / Cash Out / Expense / Transfer**
([ADR-038](../../decisions/ADR-038-cash-primary-operations-model.md)); partner
debt via signed balance; optional Sale/Purchase linkage for traceability; clear
Total Company Cash — without Sale/Purchase ever mutating cash directly
([ADR-028](../../decisions/ADR-028-sale-purchase-cash-separation.md),
[ADR-032](../../decisions/ADR-032-multiple-cash-accounts.md)–[037](../../decisions/ADR-037-controlled-negative-cash.md),
[CHANGE-004](../unplanned/CHANGE-004-multi-cash-account-domain.md),
[CHANGE-005](../unplanned/CHANGE-005-cash-primary-operations-model.md)).

## User / business value

Custody clarity per responsible person/location; daily cash speed with four clear
actions; auditability; correct company total; correct partner settlements without
duplicate “receipt/payment” product names.

## Scope

- Cash Account master data (create/update/deactivate/reactivate, opening balance).
- **Four primary operations:** Cash In, Cash Out, Expense, Transfer (ADR-038).
- Cancellation/reversal; controlled negative balance (reason).
- Partner debt on Cash In / Cash Out via `PartnerDebtBalanceService` (not separate
  primary UX named Customer Receipt / Supplier Payment).
- Optional Sale/Purchase link (traceability; EPIC-012 for multi-doc allocation).
- Optional Receive payment / Pay now on Sale/Purchase (separate Cash In / Cash Out).
- Overview workspace (per-account cards + Total Company Cash), statements, reports.
- AZN only; Currency fields reserved for future (ADR-031) — YAGNI now.

## Exclusions

- Multi-currency / FX runtime
- Hardcoded person-specific modules
- Personal-fund reimbursement ledger (AD-08)
- Accrued unpaid expense (AD-07)
- Yatı vehicle cash (EPIC-014)
- Full negative-cash case lifecycle (amount/age limits beyond ADR-037)
- Role/Permission database (ADR-025) — capability catalog documented only
- Central AuditLog table unless US-034 activated
- Primary navigation items named Customer Receipt / Supplier Payment (ADR-038)

## Dependencies

Partners + signed debt (ADR-030); Purchases/Sales posting for optional links and
immediate-payment stages; ADR-028/031/032–038; CHANGE-004 / CHANGE-005.

## Related ADRs / docs

invariants Cash/Expenses; terminology Cash Account / Cash In / Cash Out / Expense /
Transfer; workflows 10–14, 33; impact report
`docs/analysis/02-multi-cash-account-impact-report.md`; ADR-004, 023, 025, 028,
030–038.

## Child user stories

| ID | Title | Stage | Status |
| --- | --- | --- | --- |
| [US-024](../stories/US-024-money-accounts-cash-movements.md) | Manage Cash Accounts + foundation movements | 1–2 | Review |
| [US-043](../stories/US-043-cash-overview-dashboard.md) | Cash workspace overview | 8 (partial early) | Done |
| [US-025](../stories/US-025-expense-recording.md) | Record Expenses | 3 | Done |
| [US-044](../stories/US-044-cash-transfer.md) | Transfer Between Cash Accounts | 4 | Done |
| [US-045](../stories/US-045-cash-partner-settlements.md) | Cash In / Cash Out (partner settlements) | 5 | Done (reframed ADR-038) |
| [US-046](../stories/US-046-cancel-reverse-cash.md) | Cancel and Reverse Cash Transactions | 2+ | Done |
| [US-047](../stories/US-047-negative-cash-control.md) | Control Negative Cash Balance | 2+ | Done |
| [US-026](../stories/US-026-payment-allocation-advances.md) | Allocate Payments (EPIC-012) | 6 | Planned |
| [US-048](../stories/US-048-immediate-payment-sale-purchase.md) | Immediate Payment on Sale/Purchase | 7 | Done |
| [US-049](../stories/US-049-cash-reports-statements.md) | Cash Reports & Statements | 8 | Done |
| [US-050](../stories/US-050-cash-permissions-catalog.md) | Cash Capabilities Catalog (ADR-025) | docs | Planned |

## Implementation stages

1. Core foundation (schema, accounts, opening balance, balance service)
2. Standalone Cash In/Out + cancel/reversal (+ negative control)
3. Expenses + categories
4. Internal transfers
5. Partner Cash In / Cash Out (debt wiring; ADR-038 naming)
6. Allocation / document linking (with EPIC-012)
7. Immediate payment UX
8. Workspace, reports, UX hardening (four primary actions)

## Completion definition

Posted cash movements are account-specific, attributable, immutable (reversible),
Decimal-safe, concurrency-safe; Total Company Cash preserved on transfers;
Sale/Purchase never mutate cash; primary UX exposes only Cash In / Cash Out /
Expense / Transfer; AZN-only; tests for critical financial scenarios green.

## Known risks

Concurrency overspend; double post/cancel; allocation double-counting partner
debt; ADR-025 vs granular ACL expectations; AD-07/08 deferred scope confusion;
regressing to dual primary names (Receipt/Payment) in UI.

## Open questions

- Exact go-live Cash Account seed names (ops) — not a code decision.
- BRD-OD-05 remainder (limits/case).
- AD-07 / AD-08.
- Whether US-034 AuditLog is required before production Cash (prefer domain
  audit fields first).

## Repository evidence

Impact report Phase 1; MoneyAccount/CashTransaction live; Cash Nest/Web modules
under EPIC-011; CHANGE-005 / ADR-038 reframes primary operations.
