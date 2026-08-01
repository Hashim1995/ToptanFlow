# CHANGE-003: Signed partner debt balance + remove Currency from current domains

- **ID:** CHANGE-003
- **Type:** CHANGE
- **Title:** One signed Business Partner debt balance; Currency reserved for future Cash only
- **Status:** Done
- **Trigger:** Owner direction 2026-07-31 — (1) single signed partner debt balance;
  (2) no Currency module in current domains; static AZN; Currency only for future Cash.
- **Urgency:** Critical (supersedes dual AR/AP invariants and 2026-07-28 multi-currency decision)
- **Affected epics / stories / tasks:** EPIC-004 / US-007 Currency; Business Partner
  stories/screens; EPIC-009–012 Sale/Purchase/Settlement planning; ADR-028 remains.
- **Approved Human Decisions (2026-07-31):**
  1. One signed debt balance per partner (ADR-030). Sign: `>0` partner owes us;
     `<0` we owe partner; `0` no debt. Sales/purchases/cash/returns affect the
     same balance; crossing zero allowed; no separate AR/AP primary balances.
  2. Currency removed from current domains (ADR-031). Static AZN. No Currency CRUD.
     Future multi-currency only under Cash.
- **Scope:** ADR-030/031; knowledge + planning docs; Prisma (drop Currency + FX
  columns; add partner debt balance + movements); remove Currencies API/UI;
  Business Partner API/UI debt display; AZN format helper; tests.
- **Out of scope:** Full Purchase/Sale/Cash Nest posting modules; multi-currency
  Cash implementation; aging reports beyond signed filters.
- **Data notes:** No stored receivable/payable columns existed — no AR/AP formula.
  Dropping `defaultCurrencyId` discards preferred-currency preference only.
- **Acceptance criteria:**
  - [x] ADR-030/031 Accepted; dual-balance and Currency CRUD contradictions removed from active docs
  - [x] Schema: signed debt balance + movements; no Currency model/FKs in current domains
  - [x] Currencies module/routes/nav gone; partners have no currency field
  - [x] Partner UI shows one Debt Balance with sign explanation
  - [x] PartnerDebtBalanceService tests for sale/purchase/cash/cross-zero/advance/cancel contracts
  - [x] AZN formatting utility; decimal precision preserved
- **Result:** Done — ADR-030/031; Currency CRUD removed; `currentDebtBalance` +
  `BusinessPartnerDebtMovement` + `PartnerDebtBalanceService`; static AZN display.
  Full Purchase/Sale/Cash posting Nest modules remain EPIC-009–011 and must call
  PartnerDebtBalanceService / ProductQuantityService without mutating cash.
- **Evidence:** ADR-030; ADR-031; this CHANGE; migration
  `20260731140000_signed_partner_debt_and_remove_currency`; partner-debt unit tests.