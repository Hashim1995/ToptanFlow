# US-015: BusinessPartner update and deactivation APIs

- **ID:** US-015
- **Title:** BusinessPartner update and deactivation APIs
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** Master-data maintainer
- **Legacy reference:** Step 16.3

## Statement

As a master-data maintainer, I want to update partners and deactivate them without hard delete, so that historical documents remain coherent and codes are never reused.

## Business value

Completes partner master-data lifecycle parity with Product update/deactivate APIs.

## High-level scope

- `PATCH /business-partners/:id` partial update (no `code`, no `isActive`)
- `DELETE /business-partners/:id` soft deactivation (`isActive = false`, idempotent)
- Unit + e2e tests aligned with Product patterns

## High-level acceptance criteria

- Partner fields updatable except immutable `code`
- Empty PATCH body rejected
- At least one of `isCustomer` / `isSupplier` remains true after any role change
- Inactive currency cannot be assigned as `defaultCurrencyId`
- Inactive partners remain readable via GET; PATCH may update inactive partners but must not reactivate
- Deactivation is soft-delete only, idempotent, preserves `code`
- Request bodies containing `code` are rejected (`forbidNonWhitelisted`)
- Unit and e2e tests cover happy path, validation failures, immutability, and idempotent deactivate

## Dependencies

- [US-014](US-014-business-partner-create-read-apis.md) Done
- [TECH-001](../unplanned/TECH-001-automatic-business-code-generation.md) Done

## Related domain rules

`docs/business/invariants.md` — Business Partners:

- inactivated, not deleted
- inactive remains visible historically but cannot be selected for new documents (enforcement deferred until document APIs exist)
- code immutable; never reused; never hard-deleted

## Related ADRs / docs

- ADR-024 (code immutability / no client override)
- Product parity: `products.controller.ts` PATCH/DELETE behavior
- Create DTO / controller notes already reference Step 16.3

## Known risks

- Duplicate soft-flag UX is **not** in this story ([US-016](US-016-business-partner-duplicate-soft-flag.md))
- No authentication yet (same as existing master-data APIs)

## Open questions

| Question | Disposition |
| --- | --- |
| Enforce “inactive partner cannot be selected for new documents”? | **Out of scope for US-015.** No Sale/Purchase posting APIs exist yet. Record as follow-up for those modules; this story only sets `isActive = false`. |
| Reactivation endpoint? | **Not in scope.** Match Product: PATCH must not change `isActive`; no reactivate API in this story. |
| Schema migration needed? | **No.** `isActive` and updatable fields already exist. |

## Readiness checklist

- [x] Business behavior approved / traceable for update/deactivate + code immutability
- [x] Depends on US-014 and TECH-001
- [x] Implementation tasks elaborated at activation
- [x] Acceptance criteria refined against current controllers and Product parity

## Task elaboration

Elaborated:

- [TASK-015-01](../tasks/TASK-015-01-add-business-partner-update-deactivate-apis.md) — **Done**
- [TASK-015-02](../tasks/TASK-015-02-extend-business-partner-update-deactivate-e2e.md) — **Done**
