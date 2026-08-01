# ADR-037: Controlled Negative Cash Balance (Partial BRD-OD-05)

## Status

Accepted (partial resolution of BRD-OD-05 / OD-08 for Cash)

## Context

BRD-OD-05 and OD-08 ask which accounts/users may run negative cash, with what
deficit and age limits, and whether the feature is enabled. Product quantity
already uses “block unless allow + mandatory reason” under ADR-027/029 with
ADR-025 (all active users have the capability in v1).

Owner direction (2026-08-01): normal Cash Out / Transfer Out is **blocked** when
insufficient balance; authorized override requires explicit reason, stores
before/after, actor, account, and audit evidence. Suggested capability key:
`cash.allow_negative_balance`.

## Business Decision

1. **Default:** refuse Cash Out / Transfer Out that would make
   `currentBalance < 0`.
2. **Override:** allowed only when the caller asserts negative-balance
   capability **and** provides a non-empty override reason. Persist reason on
   the transaction/movement; store balance before/after.
3. **v1 capability (ADR-025):** every active authenticated user is treated as
   having `cash.allow_negative_balance` **if and only if** they supply the
   reason when needed — i.e. the gate is **reason-mandatory override**, not a
   Role table. Blind negative posting without reason remains blocked.
4. **Still Deferred (not resolved by this ADR):** maximum deficit amount, maximum
   age, formal “negative cash case” lifecycle, mandatory management review
   queues, and personal-funding alternative workflows (AD-08).
5. Never conceal a deficit with a false Cash In.
6. **Exception — Cash In cancellation (CHANGE-006):** Cancelling a posted Cash
   In creates an OUT reversal that must **not** be refused for insufficient
   balance and must **not** require the ADR-037 override reason. Cancel reason
   (ADR-035) remains mandatory. This exception does **not** apply to ordinary
   Cash Out, Expense, or Transfer Out creation.

## Decision

Implement insufficient-balance hard block + reasoned override for Cash, parallel
to product quantity. Document remaining BRD-OD-05 controls as open.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Always allow negative with no reason | Conceals custody risk; contradicts invariants |
| Never allow negative | Too rigid for urgent authorized payments (owner allows override) |
| Full case lifecycle in v1 | Over-scope; limits undecided |

## Consequences

- Error messages must be user-clear (available vs required amount).
- Reports should surface accounts with negative balances.
- Analysis docs mark BRD-OD-05 / OD-08 **partially resolved**.

## References

- Owner direction 2026-08-01
- BRD-OD-05; OD-08; ADR-025; ADR-027/029 analogy
- CHANGE-004; invariants Cash
