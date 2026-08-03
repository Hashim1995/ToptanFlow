# ADR-036: Cash Transaction Lifecycle Without Draft for Ordinary Operations

## Status

Accepted

## Context

Sale/Purchase use Draft → Posted → Cancelled because documents are complex and
edited before stock/debt effects. Structural `CashTransaction` defaulted to
`DRAFT`, which would invite incomplete cash rows and ambiguous UX for the most
frequent module.

Owner guidance (2026-08-01): prefer ordinary Cash In, Cash Out, and Transfer to
be **completed explicitly** in one step; do not add Draft purely for consistency
if it harms UX. Draft may remain useful later for complex expense/settlement
forms.

## Business Decision

### v1 Cash lifecycle

| Status | Meaning |
| --- | --- |
| `POSTED` (UI: completed / tamamlanmış) | Balance (and partner debt if applicable) effects applied |
| `CANCELLED` | Reversed; original preserved (ADR-035) |

1. Ordinary **Cash In**, **Cash Out**, **Expense**, and **Transfer** APIs
   create and complete in one operation (no user-visible Draft).
2. **No balance effect** until Posted.
3. Complex Draft for expenses/settlements is **out of scope for v1**; if added
   later, Draft must have zero cash/debt effect until explicit complete.
4. Schema may retain `DocumentStatus` including `DRAFT` for shared enum reuse,
   but Cash v1 services must not leave ordinary transactions in Draft.

## Decision

v1 Cash posting is immediate completion; cancellation via reversal. Do not
implement Cash Draft workflows in the first Cash stages.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Mandatory Draft for every cash movement | Extra clicks; frequent-use friction; partial rows |
| Editable Posted cash | Forbidden by ADR-035 |

## Consequences

- Fast Cash In/Out forms with confirmation preview, then single submit.
- Tests assert create = posted with balance effect in one call.
- Aligns UX priority: low click count without sacrificing confirmation safety.

## References

- Owner direction 2026-08-01
- ADR-033, ADR-035
- CHANGE-004; EPIC-011
