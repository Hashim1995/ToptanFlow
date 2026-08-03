# ADR-032: Multiple Cash Accounts Within One Cash Domain

## Status

Accepted

## Context

Operational cash is held and used by multiple responsible people and locations
(e.g. Nurtay’s Cash, Toğrul’s Cash, Office Cash, Main Cash). Earlier schema
sketched `MoneyAccount` with rigid types (`MAIN_CASH`, `VEHICLE_CASH`,
`PERSONAL_FUNDS`, …) and planning treated initial account topology as open
(BRD-OD-03). Hardcoding separate modules per person would be unmaintainable.

On **2026-08-01** the repository owner directed that TOPTANFLOW must have
**one Cash domain** supporting **any number of Cash Accounts as data**, without
code changes per new account, and that Total Company Cash is the sum of active
account balances.

## Business Decision

1. **One Cash domain** owns all operational money accounts and movements.
2. A **Cash Account** is configuration/master data: name, unique code (when
   codes are used), responsible person/user, current balance, active status,
   notes, and audit metadata. Examples are data values, never module names.
3. **Any number** of Cash Accounts may exist; creating an account does not
   require a deploy or a new Nest module.
4. **Total Company Cash** = sum of `currentBalance` over all **active** Cash
   Accounts. Inactive accounts remain in history but are excluded from the
   total unless a report explicitly includes them.
5. A movement on one account never silently changes another (except an explicit
   Internal Transfer — ADR-034).
6. Person names (Nurtay, Toğrul, …) appear only as account **data**, never in
   authorization or business-logic branches.
7. Vehicle-cash / Yatı-specific account rules remain deferred with EPIC-014.
8. Personal-funds reimbursement ledger remains gated by AD-08 (Deferred).
9. **Amended by ADR-040 (2026-08-03):** each Cash Account has exactly one
   responsible active User and a User may own at most one Cash Account.
   Ownership supplies the logged-in user's default selection, but does not
   prevent selecting another active account.

### BRD-OD-03

**Resolved** for go-live topology: seed or create whatever named Cash Accounts
operations need; no fixed mandatory set beyond “at least the accounts the
business operates.” Exact seed list is an ops choice, not a code constant.

## Decision

Accept Multi-Cash-Account within one Cash domain. Prefer Prisma model name
`CashAccount` (evolve/rename from structural `MoneyAccount`). Soft-typed
`kind` (e.g. cash vs bank) may exist later for reporting; it must not encode
people.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| One global company cash balance | Cannot explain custody per responsible person; breaks operational reality |
| Hardcoded Nest modules per person (NurtayCash, TogrulCash) | Does not scale; names in code; violates configuration-as-data |
| Rigid enum as the only identity (`MAIN_CASH` only) | Insufficient for multiple parallel cash boxes |
| Separate “Cashbox” product unrelated to Cash domain | Duplicates financial truth |

## Consequences

- EPIC-011 scope is Multi-Cash-Account Management (not a single till).
- Invariants and UI must show per-account balances and Total Company Cash.
- ADR-025 still applies: v1 has no Role/Permission tables. Except for Cash
  Account creation/ownership under ADR-040, Cash **capability
  catalog** is documented for future auth; v1 = any active authenticated user
  may operate Cash, with mandatory reasons for high-risk actions (see
  CHANGE-004 impact report §12 and ADR-037).
- Per-account visibility restrictions are **Deferred** until authorization
  evolves beyond ADR-025.
- ADR-031 remains: all current Cash amounts are AZN; future currency belongs on
  Cash Account / Cash Transaction, not Product/Partner.

## References

- Owner direction 2026-08-01 — Multi-Cash-Account
- BRD-OD-03; `docs/analysis/02-multi-cash-account-impact-report.md`
- ADR-028, ADR-031, ADR-033, ADR-034
- CHANGE-004; EPIC-011
