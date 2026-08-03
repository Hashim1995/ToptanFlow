# Multi-Cash-Account Impact Report (Phase 1)

> Prepared: 2026-08-01  
> Trigger: Owner direction to implement Multi-Cash-Account as financial core  
> Status: Pre-implementation audit — no code changes in this document  
> Related: [CHANGE-004](../tasks/unplanned/CHANGE-004-multi-cash-account-domain.md), EPIC-011, ADR-028 / ADR-031 / ADR-032+

## 1. Purpose

Concise current-state impact report before Multi-Cash-Account documentation and implementation. Identifies compatible assets, conflicts, affected surfaces, migration risks, and open decisions that this work may resolve or must not silently resolve.

## 2. Repository findings (summary)

| Area | Current state |
| --- | --- |
| Active modules delivered | Products (+ quantity), Business Partners (+ signed debt), Purchases (Review), Sales (Review), Auth (flat users), Units, Product Categories |
| Cash Nest/Web modules | **Absent** — no `apps/api/src/cash*`, no Cash UI routes |
| Prisma Cash models | Structural only: `MoneyAccount`, `CashTransaction` (+ enums) from EPIC-003 |
| Partner debt | `PartnerDebtBalanceService` exists; kinds include `CASH_RECEIPT` / `CASH_PAYMENT`; FK to `CashTransaction` ready |
| Sale/Purchase | Post/cancel mutate quantity + partner debt only; **do not** mutate cash (ADR-028) — compatible |
| Currency | Removed from current domains (ADR-031); reserved for future Cash |
| Permissions | ADR-025: flat equal users; **no** Role/Permission tables |
| AuditLog table | Planned (US-034); not implemented — audit today is domain movements + actor fields |
| Seed Cash data | None |
| Runtime Cash rows | Expected empty / unused (no Cash API ever existed) |

## 3. Existing compatible implementation

- **ADR-028** — Sale/Purchase must not directly mutate cash; optional separate Cash records. Aligns with owner direction.
- **ADR-030** — Signed partner debt; Cash receipt `-=`, Cash payment `+=`. PartnerDebtBalanceService is the shared owner of sign direction.
- **ADR-031** — AZN-only now; Currency owned by future Cash Accounts/Transactions (documentation already points here).
- **ADR-004 / ADR-023** — Immutability of posted facts; Decimal money precision.
- **NumberSequence** — Pattern for business numbers (Product, Partner, Purchase, Sale) reusable for Cash Transaction / Transfer numbers.
- **ProductQuantityService** — Pattern for transactional balance update + history + negative override with reason (adapt for Cash).
- **Purchase/Sale Nest modules** — Proof that posting/cancel + Decimal + Prisma `$transaction` conventions exist.
- **Frontend** — Ant Design list/form/detail patterns (Purchases/Sales/Partners); `formatMoney`; AZN display; AppShell navigation ready to extend.
- **Terminology / workflows** — Cash In, Cash Out, Transfer, Expense, Negative Cash already defined at high level.

## 4. Obsolete or conflicting assumptions

| Assumption | Conflict | Resolution direction |
| --- | --- | --- |
| `MoneyAccountType` = `MAIN_CASH` / `BANK` / `VEHICLE_CASH` / `PERSONAL_FUNDS` as primary model | Owner wants **any number of named accounts** (e.g. Nurtay’s Cash, Office Cash) as data, not hardcoded modules/types per person | Soften/replace type-centric model with named `CashAccount` configuration; vehicle/personal-fund special cases deferred (Yatı / AD-08) |
| One “main cash” as the only company cash | Multi-account + **Total Company Cash** = sum of active account balances | ADR-032 |
| `CashTransaction` with `status = DRAFT` default and no `currentBalance` on account | Owner prefers ordinary Cash In/Out/Transfer completed explicitly; balance only via movements | ADR-033 / ADR-036; add transactional `currentBalance` |
| Single `TRANSFER` type + optional `pairedTransactionId` only | Transfer must be one aggregate with linked OUT/IN; not two unrelated txs | ADR-034; introduce `CashTransfer` |
| Nullable `saleId`/`purchaseId` on CashTransaction as only link | Allocation across documents needs first-class allocation rows (EPIC-012 / US-026) | Keep optional single link for Stage 5–6; full allocation in later stage |
| Granular cash permission keys | **ADR-025** forbids Role/Permission tables in v1 | Document capability catalog; v1 enforce via auth + mandatory reasons; per-account visibility **Deferred** unless ADR-025 is partially superseded |
| Invariant: negative cash needs amount **and age** limits + case lifecycle | Owner specifies permission + reason + audit; full BRD-OD-05 case machinery still open | Partial resolution (ADR-037); amount/age/case Deferred |
| Personal-fund expense ≠ business cash outflow (AD-08) | Owner Stage 3 expenses are Cash Out with category from a Cash Account | Personal-fund reimbursement path remains **Deferred** (AD-08 open) |
| Deferred expense obligation (AD-07) | Not in owner Stage 1–5 | Cash-paid expenses only; unpaid accrued expense Deferred |
| `CashTransaction.amount` without `@db.Decimal(18, 4)` | Violates ADR-023 consistency | Fix in migration with Cash redesign |
| Analysis §3.10 dual AR/AP wording | Superseded by ADR-030 | Prefer invariants; do not reintroduce dual ledgers via Cash |

## 5. Affected documentation

| Document | Change needed |
| --- | --- |
| `docs/business/invariants.md` — Cash / Expenses | Multi-account rules, balance-only-via-tx, transfer total unchanged, negative override, opening balance movement |
| `docs/business/terminology.md` | Cash Account (alias Money Account), Cash Transfer, Expense Category, Total Company Cash; soften vehicle-cash primacy |
| `docs/business/workflow-map.md` | Workflows 10–14, 33; multi-account; transfer aggregate |
| `docs/analysis/01-document-analysis.md` | Mark BRD-OD-03 resolved; BRD-OD-05 / OD-08 partially resolved |
| `docs/technical/system-architecture.md` | Cash module boundary = multi Cash Account domain |
| `docs/tasks/epics/EPIC-011-*.md` | Retitle/scope to Multi-Cash-Account |
| `docs/tasks/stories/US-024`, `US-025` | Activate / rewrite acceptance |
| New stories US-043+ | Overview, transfer, cancel, reports, immediate payment, permissions UX, etc. |
| `ROADMAP.md`, `CURRENT.md`, `BACKLOG.md`, `CHANGELOG.md` | Point active work to Cash after Sales Review |
| ADR-028 / ADR-031 | Cross-link; no contradiction expected |
| New ADRs 032–037 | Multi-account, balance via tx, transfer, immutability/reversal, lifecycle, negative cash |

## 6. Affected Prisma models

| Model / enum | Impact |
| --- | --- |
| `MoneyAccount` | **Evolve / rename** → `CashAccount` (preferred): `code`, `responsibleUserId`, `currentBalance`, notes, deactivation metadata; drop or demote rigid `MoneyAccountType` |
| `MoneyAccountType` | Obsolete as person/vehicle-hardcoded taxonomy for v1 Cash; optional soft `kind` later |
| `CashTransaction` | Add number, direction, balanceBefore/After, category FKs, reversal link, negative override reason; refine types; Decimal scale; prefer POSTED not long-lived DRAFT |
| `CashTransactionType` | Align to business types (CUSTOMER_RECEIPT, SUPPLIER_PAYMENT, EXPENSE, TRANSFER_OUT/IN, OPENING_BALANCE, …) |
| **New** `CashTransfer` | Aggregate for internal transfer |
| **New** `ExpenseCategory` (and optional IncomeCategory) | Soft-managed categories |
| **New** `CashTransactionAllocation` | Stage 6 / EPIC-012 |
| `BusinessPartnerDebtMovement` | Already has `cashTransactionId` — compatible |
| `Sale` / `Purchase` | Optional relation already; no cash columns — keep |
| `NumberSequence` | Add keys for cash txn / transfer numbers |
| `User` | Responsible-person + actor relations for CashAccount |

## 7. Affected backend modules

| Module | Impact |
| --- | --- |
| **New** `cash-accounts`, `cash-transactions`, `cash-transfers`, `expense-categories` | Core Nest modules |
| `business-partners` / `PartnerDebtBalanceService` | Add convenience wrappers `applyCustomerReceipt` / `applySupplierPayment` / reverse; must share Prisma tx |
| `sales` / `purchases` | Stage 7 optional immediate payment orchestration only; Stages 1–5 must not break ADR-028 |
| `number-sequences` | New sequence keys |
| `auth` | Still JWT; no Role tables unless ADR-025 superseded |
| Shared money helpers | Extend Decimal-safe compare/add for cash balances |

## 8. Affected frontend modules

| Area | Impact |
| --- | --- |
| Navigation / home | Add Cash workspace (Overview, Accounts, Transactions, Transfers, Expenses, Reports) |
| **New** features under `apps/web/src/features/cash/` | Dashboard, accounts, forms, statements |
| Sales/Purchases UI | Stage 7 “receive/pay now” only |
| Labels (ADR-005) | Azerbaijani business labels for types; never expose enum keys |
| Money formatting | Reuse `formatMoney` |

## 9. Affected tests

| Suite | Impact |
| --- | --- |
| New cash unit/integration specs | Extensive (owner list ~85 scenarios across stages) |
| `partner-debt-balance.service.spec.ts` | Extend for cash receipt/payment/reversal |
| Purchase/Sale specs | Assert still no cash mutation; later immediate-payment tests |
| Frontend component tests | Forms, previews, permission-hidden actions (when applicable) |

## 10. Migration risks

| Risk | Mitigation |
| --- | --- |
| Renaming `MoneyAccount` → `CashAccount` | No Cash API/seed; expect zero or unused rows; migrate rename explicitly; **do not** reset DB |
| Enum redesign (`CashTransactionType`) | Prisma enum migrate carefully; empty table expected |
| Adding `currentBalance` NOT NULL | Default `0`; opening balance via OPENING_BALANCE movement |
| Missing Decimal scale on `amount` | Alter to `Decimal(18,4)` / money scale per ADR-023 |
| Rollback | Prefer additive then rename; keep reversible SQL notes in migration report |
| Legacy dual meaning of “Money Account” in docs | Terminology alias; code uses CashAccount |

## 11. Dependencies

| Dependency | Status |
| --- | --- |
| Partners + signed debt | Available |
| Purchases / Sales posting | Available (Review) — needed before allocation / immediate payment stages |
| ADR-028 / 030 / 031 | Accepted |
| BRD-OD-03 initial accounts | **Resolved by this owner direction** (multi named accounts as data) |
| BRD-OD-05 / OD-08 negative cash | **Partially** resolved (permission+reason); limits/case Deferred |
| AD-07 / AD-08 | Remain open — Deferred from Stage 1–5 expense scope |
| US-034 AuditLog | Prefer domain audit fields + movements now; central AuditLog later |
| ADR-025 permissions | Tension with granular cash ACL — see §12 |
| EPIC-012 allocation | After standalone Cash + partner settlement |

## 12. Authorization tension (must not be silent)

Owner request lists granular cash permissions (`cash-account.view`, `cash.allow-negative-balance`, …).  
**ADR-025** states: no Role/Permission tables in v1; every active authenticated user may perform all v1 actions.

**Planning decision for CHANGE-004 (documented in ADR-032 consequences / permissions note):**

1. Define a **Cash capability catalog** in docs (keys + meaning).
2. **v1 enforcement:** authenticated + active user may perform Cash operations (ADR-025).
3. **Always require** non-empty reasons for: negative-balance override, cancellation, manual adjustment, opening-balance correction.
4. **Defer** per-account visibility (only responsible user sees account) and Role/Permission CRUD until an explicit ADR supersedes or extends ADR-025.
5. Frontend may organize UX by capability labels later; backend remains authoritative.

This avoids inventing an authorization subsystem that contradicts ADR-025 while preserving the catalog for a future auth epic.

## 13. Implementation staging (approved sequence)

1. Core Cash foundation (accounts, opening balance, balance movement)
2. Standalone Cash In / Cash Out (non-partner types) + cancel/reversal
3. Expenses + categories
4. Internal transfers
5. Partner settlements (receipt/payment + PartnerDebtBalanceService)
6. Document linking / allocation (coordinate EPIC-012)
7. Immediate payment UX on Sale/Purchase
8. Reports + UX hardening

Do not advance stages with failing financial tests.

## 14. Explicit non-goals (this change)

- Multi-currency / FX / Currency CRUD
- Hardcoded Nurtay/Toğrul modules
- Sale/Purchase directly mutating cash
- Personal-fund reimbursement ledger (AD-08)
- Accrued unpaid expense (AD-07)
- Yatı vehicle cash workflows
- Full negative-cash case lifecycle (amount/age limits beyond reason+permission pattern)
- Central AuditLog table (US-034) unless activated separately
- Role/Permission database (unless new ADR)

## 15. Verdict

The repository is **ready for Cash documentation and staged implementation**. Structural Prisma stubs are a starting point but **must be redesigned** for multi-account balances, transfer aggregates, categories, and Decimal safety. Business separation from Sale/Purchase and signed partner debt are already correct. Planning and ADRs must land before Nest/Web code.
