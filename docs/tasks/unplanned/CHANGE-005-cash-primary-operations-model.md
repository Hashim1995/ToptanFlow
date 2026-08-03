# CHANGE-005: Cash primary operations model (In / Out / Expense / Transfer)

- **ID:** CHANGE-005
- **Title:** Cash primary operations model
- **Status:** Done (documentation + implementation in same wave)
- **Recorded:** 2026-08-01
- **Type:** Approved Human Decision (owner product direction)

## Decision

The Cash module’s **primary user-facing operations** are exactly four:

1. **Cash In** — money enters a Cash Account **from a Business Partner**; partner debt `-=` amount; optional Sale link (traceability only).
2. **Cash Out** — money leaves a Cash Account **to a Business Partner**; partner debt `+=` amount; optional Purchase link (traceability only).
3. **Expense** — operating Cash Out with **Expense Category** + required description; **no** Business Partner; no partner debt.
4. **Transfer** — atomic move between two Cash Accounts (ADR-034); Total Company Cash unchanged; no partner debt.

### Terminology / UX

- Do **not** expose separate primary features, pages, or menu items named **Customer Receipt** or **Supplier Payment**.
- Those phrases may appear only as clarifying copy that Cash In / Cash Out settle partner debt.
- Sale/Purchase may offer optional **Receive payment** / **Pay now** actions that still create a **separate** Cash In / Cash Out (ADR-028 / US-048).

### Non-primary / system types

- `OPENING_BALANCE` remains for account opening (ADR-033).
- `REVERSAL` remains for cancellation (ADR-035).
- Owner deposit / other income / manual adjustment are **not** primary Cash workspace actions in this model (reserved / system; not shown as equal top-level actions).

## Binding ADRs

- [ADR-038](../../decisions/ADR-038-cash-primary-operations-model.md) (this decision)
- ADR-028, 030, 032–037 (unchanged except UX naming clarified by ADR-038)

## Planning impact

- US-045 reframed as Cash In / Cash Out (partner-required), not separate primary products.
- US-044 Transfer activated as a primary workspace action.
- EPIC-011 scope language updated accordingly.
