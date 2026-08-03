# CHANGE-004: Multi-Cash-Account domain

- **ID:** CHANGE-004
- **Title:** Multi-Cash-Account domain (financial core)
- **Status:** In Progress
- **Type:** CHANGE (approved unplanned / owner-directed architecture)
- **Priority:** High
- **Created:** 2026-08-01
- **Related Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Related ADRs:** ADR-028, ADR-031, ADR-032–037
- **Impact report:** [02-multi-cash-account-impact-report.md](../../analysis/02-multi-cash-account-impact-report.md)

## Problem / opportunity

Cash is the most critical and frequently used operational module. The repository had only structural `MoneyAccount` / `CashTransaction` Prisma stubs, no Cash Nest/Web modules, and planning gated on open decisions (BRD-OD-03/05). The owner directed a full Multi-Cash-Account domain: any number of named Cash Accounts as data, balance changes only via auditable transactions, atomic transfers that preserve Total Company Cash, Sale/Purchase separation preserved, AZN-only now with Currency reserved for future Cash.

## Approved direction (owner, 2026-08-01)

- One Cash domain; multiple Cash Accounts (configuration/data — never hardcoded person modules).
- Total Company Cash = sum of active Cash Account balances.
- Internal transfers do not change Total Company Cash.
- Purchases/Sales never directly mutate Cash (ADR-028 confirmed).
- Partner settlements use signed debt (ADR-030) via Cash In/Out.
- Current currency AZN only; future multi-currency belongs to Cash Accounts (ADR-031).
- Immutability + reversal-based cancellation; no silent balance edits.
- Negative cash only with capability + mandatory reason (partial BRD-OD-05).
- Granular Role/Permission tables remain constrained by ADR-025 (see impact report §12).

## Scope

Documentation (ADRs, business docs, epic/stories/tasks), then staged implementation per EPIC-011:

1. Foundation → 2. Cash In/Out → 3. Expenses → 4. Transfers → 5. Partner settlements → 6. Allocation → 7. Immediate payment UX → 8. Reports/UX.

## Out of scope

Multi-currency runtime; personal-fund reimbursement (AD-08); deferred unpaid expense (AD-07); Yatı vehicle cash; full negative-cash case lifecycle; DB reset.

## Impact on current work

- US-023 Sales remains Review (do not regress).
- EPIC-011 becomes active planning + implementation focus after documentation gate.
- EPIC-012 allocation stories retargeted to follow Cash Stages 5–6.

## Acceptance for this CHANGE

- [x] Phase 1 impact report in repository
- [ ] ADRs 032–037 Accepted in repository
- [ ] Business invariants/terminology/workflows updated
- [ ] EPIC-011 + stories + Stage tasks elaborated
- [ ] Staged implementation with tests; no advancing on failing financial tests
- [ ] Final contradiction search clean for listed anti-patterns

## Evidence

See linked impact report, ADRs, EPIC-011, CURRENT.md updates as work proceeds.
