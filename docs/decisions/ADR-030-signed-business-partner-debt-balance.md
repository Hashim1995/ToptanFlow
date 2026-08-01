# ADR-030: One Signed Business Partner Debt Balance

## Status

Accepted

## Context

Prior knowledge documents required **separate** receivable and payable balances
for each Business Partner and forbade automatic netting between the two
directions. Settlement (allocations, advances) was deferred as a future module.

On **2026-07-31** the repository owner directed a simpler model: **one signed
debt balance** per Business Partner. Sales and purchases with the same partner
intentionally offset on that single balance. Crossing zero is allowed. Advances
and overpayments are represented by the same signed balance (no separate
customer/supplier advance fields as primary balances).

ADR-028 (Sale/Purchase must not directly mutate cash) remains in force.

## Business Decision

### Sign convention (mandatory)

| Balance | Meaning |
| --- | --- |
| `balance > 0` | Partner owes the company |
| `balance < 0` | Company owes the partner |
| `balance = 0` | No outstanding debt |

### Effects (exact)

| Event | Effect |
| --- | --- |
| Completed Sale | `partnerBalance += saleAmount` |
| Customer Cash Receipt (Cash In from partner) | `partnerBalance -= receivedAmount` |
| Completed Purchase | `partnerBalance -= purchaseAmount` |
| Supplier Cash Payment (Cash Out to partner) | `partnerBalance += paidAmount` |
| Sale return / sale cancellation | decrease balance by reversed sale amount |
| Purchase return / purchase cancellation | increase balance by reversed purchase amount |

Drafts have no balance effect. Corrections are auditable reversing movements;
original posted documents are not silently edited or deleted.

### Source of truth

- Preferred: append-only **Business Partner balance movements** plus a
  transactionally maintained `currentDebtBalance` (or equivalent) on the partner.
- Manually editable balance without a movement is forbidden.
- Manual adjustment (if supported): permission + reason + movement + audit;
  reverse rather than delete.

### UI

Show one **Debt Balance** with clear sign explanation. Do not show separate
Receivable / Payable cards. Partner statement uses one running signed balance.

### Withdrawn

- Separate receivable and payable balances as primary business truth
- Automatic prohibition against receivable/payable netting
- Separate customer-advance / supplier-advance **primary** balance fields
  (derived reporting labels from the signed ledger are optional later)

## Decision

1. Model one signed AZN debt balance per Business Partner.
2. Record every change as an auditable balance movement.
3. Update invariants, terminology, workflows, Settlement planning, and UI to
   match.
4. Preserve ADR-028 cash separation and optional Cash↔document linking.

## Consequences

- Prior “never net receivable and payable” invariants are **superseded**.
- EPIC-012 Settlement stories that assume dual balances must be retargeted.
- No historical AR/AP columns existed on BusinessPartner; initial balance is `0`
  with movements added as Purchase/Sale/Cash posting is implemented.

## References

- Owner direction 2026-07-31 — single signed partner debt balance
- ADR-028 — Sale/Purchase cash separation
- ADR-031 — Currency reserved for future Cash (amounts are AZN)
