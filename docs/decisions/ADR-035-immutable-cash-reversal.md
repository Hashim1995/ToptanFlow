# ADR-035: Immutable Cash Movements and Reversal-Based Cancellation

## Status

Accepted

## Context

ADR-004 requires immutability of posted business facts. Cash is high-risk:
silent edits or deletes erase custody evidence and break partner-debt and
account reconciliation.

## Business Decision

1. **Completed** Cash Transactions and Transfers are not silently edited or
   deleted — including notes/description. Soft-deactivate is **not** a
   lifecycle for cash operations (master data only). [CHANGE-006.]
2. Correction path: **cancel with mandatory reason** → create opposite financial
   effect (reversal) → preserve original rows and before/after balances → link
   reversal to original.
3. Where partner debt was affected (Cash In / Cash Out),
   cancellation posts the **opposite** partner debt movement via
   `PartnerDebtBalanceService` in the **same** DB transaction as cash reversal.
   Expense cancel restores cash only and never touches partner debt.
4. Allocations (when present) are reversed/unallocated with history — never
   dropped silently. Optional Sale/Purchase FK links remain for history;
   cancelled cash is not treated as an active payment.
5. Transfer cancellation reverses **both** accounts atomically (ADR-034);
   Total Company Cash returns to the pre-transfer total.
6. **Cash In cancellation** must always succeed even when the OUT reversal
   would make `currentBalance < 0`. Do **not** apply the ADR-037 insufficient-
   balance block or require a negative-balance override for this case. Cancel
   reason remains mandatory and is distinct from ADR-037 override. Resulting
   negative balances stay visible. Ordinary Cash Out / Expense / Transfer Out
   **creation** remains gated by ADR-037. [CHANGE-006 correction, 2026-08-02.]

## Decision

Cash uses reversal-based cancellation consistent with Sale/Purchase and partner
debt patterns. History is append-only for financial effects.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Editable completed financial records | Destroys audit trail |
| Delete original movement on cancel | Loses evidence; breaks reconciliation |
| Soft-delete without reversing balance | Balance and history diverge |

## Consequences

- Cancel endpoints require reason + capability (v1: authenticated user).
- Idempotent cancel: second cancel rejected.
- UI shows cancelled/reversal state clearly; originals remain visible.

## References

- ADR-004, ADR-028, ADR-030, ADR-033, ADR-034
- Owner direction 2026-08-01
- CHANGE-004
