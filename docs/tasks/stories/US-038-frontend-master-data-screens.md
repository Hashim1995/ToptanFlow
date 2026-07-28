# US-038: Frontend master-data screens for delivered APIs

- **ID:** US-038
- **Title:** Frontend master-data screens for delivered APIs
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** In Progress
- **Priority:** High
- **Business actor:** Master-data maintainer

## Statement

As a master-data maintainer, I want Azerbaijani responsive screens for units, currencies, products, and partners, so that I can operate delivered APIs from the UI.

## Business value

Usable master-data operations.

## High-level scope

- Shared typed frontend API/query conventions for delivered master-data APIs
- Responsive CRUD/deactivate screens for currencies and units
- Responsive CRUD/deactivate screens for products
- Responsive CRUD/deactivate screens for business partners, including the
  approved soft-duplicate `409` + acknowledge flow
- Backend-generated Product / BusinessPartner code fields are read-only

## High-level acceptance criteria

- Currencies, units, products, and business partners can be listed, searched,
  created, updated, and deactivated through their delivered backend contracts
- TanStack Query owns server state; Axios is the only HTTP transport; Redux
  does not duplicate server entities
- Forms use React Hook Form + Zod for frontend boundary validation; backend
  validation remains authoritative
- Loading, empty, success, and failure states are Azerbaijani
- Mobile uses a readable card/reflow strategy; desktop may use tables, with
  all fields and actions still reachable
- Product and BusinessPartner codes are visible but never editable/supplied
- BusinessPartner soft-duplicate conflicts show candidates and require
  explicit user acknowledgement before retrying
- No authentication, permission policy, or unresolved business behavior is
  invented

## Dependencies

US-006–015 backend readiness; US-037.

## Related domain rules

terminology.md; ADR-005.

## Related ADRs / docs

ui-requirements.md.

## Known risks

- Currency / unit Azerbaijani navigation and screen labels are not entries in
  `docs/business/terminology.md`; owner approved `Valyutalar` /
  `Ölçü vahidləri` for US-038 (2026-07-29).
- Responsive CRUD forms can become too large; each vertical slice must preserve
  all fields/actions without forcing horizontal form scrolling.

## Open questions

| Question | Disposition |
| --- | --- |
| Exact screen inventory? | Four delivered modules only: currencies, units, products, business partners. |
| Authentication / protected routes? | Out of scope; US-019 remains blocked. |
| Delete behavior? | UI invokes delivered soft-deactivate endpoints only; no hard delete or reactivation UI. |
| Currency/unit Azerbaijani labels? | Approved (owner, 2026-07-29 via next-task proceed): `Valyutalar`, `Ölçü vahidləri`. |
| Automated browser testing? | Add focused component/UI tests only when the project test harness is activated; each task requires build/lint plus responsive manual evidence. |

## Readiness checklist

- [x] Business behavior traceable to delivered APIs, ADR-005, and UI requirements
- [x] No unresolved Open Decision is silently resolved
- [x] US-037 and backend dependencies satisfied
- [x] Acceptance criteria sufficient to implement incrementally

## Task elaboration

Elaborated:

- [TASK-038-01](../tasks/TASK-038-01-add-master-data-frontend-api-foundation.md) — **Done**
- [TASK-038-02](../tasks/TASK-038-02-add-currency-unit-screens.md) — **Done**
- [TASK-038-03](../tasks/TASK-038-03-add-product-screens.md) — Ready
- [TASK-038-04](../tasks/TASK-038-04-add-business-partner-screens.md) — Ready
- [TASK-038-05](../tasks/TASK-038-05-verify-master-data-ui-responsive-states.md) — Ready after 038-02..04
