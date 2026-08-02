# ADR-040: One-to-one Cash Account ownership and user default

## Status

Accepted

## Context

ADR-032 included a responsible user as Cash Account data but did not decide
whether assignment was mandatory or unique, who could manage it, or how it
affected operation forms. CHANGE-019 recorded those questions. On 2026-08-03
the repository owner explicitly resolved all four.

## Business Decision

1. Every Cash Account has exactly one responsible active User.
2. One User may be responsible for at most one Cash Account. A User may have no
   Cash Account when there are more users than accounts.
3. Only a Super Admin may create a Cash Account or assign/change its responsible
   User. This is a narrow extension of ADR-039, not general RBAC.
4. In every Cash operation selector—Cash In, Cash Out, Expense, Transfer source,
   and Sale/Purchase immediate collection/payment—the logged-in user's active
   responsible Cash Account is the default, including operations launched from
   an account page.
5. The default is editable: every active user may select any other active Cash
   Account. Ownership does not grant exclusive operation permission or visibility.
6. The transaction actor is always the authenticated user who performs the
   action, independently of the selected Cash Account's responsible User.
7. Existing development Cash Accounts are backfilled by randomly pairing them
   one-to-one with distinct active Users. Migration must fail explicitly when
   there are fewer active Users than Cash Accounts; it must not invent users.

## Consequences

- `CashAccount.responsibleUserId` is required and unique.
- A responsible User must be reassigned before that User can be deactivated.
- Cash Account creation and ownership changes are enforced by the API as Super
  Admin-only; hiding UI controls is supplementary UX.
- Ownership is a custody/defaulting aid only. Cash posting, balances, partner
  debt, transfers, reversals, and audit attribution remain unchanged.
- ADR-025 remains flat-equal for Cash operations; ADR-039's narrow administrative
  exception now covers Users and Cash Account creation/ownership.

## References

- Owner decisions, 2026-08-03
- ADR-032, ADR-039, CHANGE-019
