# ADR-038: Cash primary operations model (In / Out / Expense / Transfer)

## Status

Accepted

## Context

EPIC-011 delivered foundation Cash In/Out (non-partner types), Expense, and
partner settlements as **separate** primary UX actions labeled Customer Receipt /
Supplier Payment. Operators need a simpler daily workspace: four clear actions
matching how the business thinks about cash.

## Business Decision

1. **Primary ordinary Cash operations (v1 UX and APIs):**
   - **Cash In** — requires active Business Partner; increases selected Cash
     Account; decreases partner signed debt (ADR-030); optional `saleId` for
     traceability only (never required; never a second debt mutation).
   - **Cash Out** — requires active Business Partner; decreases selected Cash
     Account; increases partner signed debt; optional `purchaseId` for
     traceability only (never required; never a second debt mutation);
     negative-balance override per ADR-037.
   - **Expense** — requires Expense Category and description; decreases cash;
     **no** partner field; **no** partner debt.
   - **Transfer** — ADR-034 atomic aggregate; not income/expense; no partner debt.
2. **User-facing names** are only Cash In, Cash Out, Expense, Transfer
   (Azerbaijani UI labels). Do not present Customer Receipt / Supplier Payment
   as separate primary navigation or menu features.
3. Internal persistence may keep enum values such as `CUSTOMER_RECEIPT` /
   `SUPPLIER_PAYMENT` for debt wiring and history classification; UI maps them
   to Cash In / Cash Out (ADR-005).
4. Sale/Purchase never mutate cash by themselves (ADR-028). Optional
   Receive payment / Pay now create separate Cash In / Cash Out rows.
5. System types (`OPENING_BALANCE`, `REVERSAL`) remain. Non-partner foundation
   types (`OTHER_INCOME`, `OWNER_DEPOSIT`, `OWNER_WITHDRAWAL`,
   `MANUAL_ADJUSTMENT`) are not primary workspace actions under this ADR.

## Decision

Adopt the four-operation Cash model above for product UX, acceptance criteria,
and ordinary posting APIs.

## Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Keep Customer Receipt / Supplier Payment as peer primary actions | Duplicate mental model; confusing menu |
| Cash In/Out without required partner | Contradicts owner simplified settlement model |
| Transfer as two unrelated Cash Out + Cash In | Forbidden by ADR-034 |

## Consequences

- Cash workspace exposes four actions; forms show partner + debt preview for
  In/Out; expense/transfer previews as specified by owner UX.
- Docs/stories (US-045, workflows) use Cash In / Cash Out naming.
- Reports must continue to exclude Transfer from income/expense (ADR-034).

## References

- Owner direction 2026-08-01 (CHANGE-005)
- ADR-028, ADR-030, ADR-032–037
- EPIC-011
