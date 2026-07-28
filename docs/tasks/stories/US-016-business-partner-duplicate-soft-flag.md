# US-016: BusinessPartner duplicate soft-flag checks

- **ID:** US-016
- **Title:** BusinessPartner duplicate soft-flag checks
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Planned
- **Priority:** Medium
- **Business actor:** Master-data maintainer

## Statement

As a master-data maintainer, I want possible duplicate partners flagged using normalized identifiers before create, so that I do not silently create duplicates.

## Business value

Supports partner-quality invariant without hard unique rejection on phone/tax.

## High-level scope

Soft flag/warning behavior on create (and possibly update); not a hard unique constraint on phone/tax.

## High-level acceptance criteria

- Duplicate candidates can be detected/flagged per invariants
- Does not invent hard-block policy beyond docs

## Dependencies

US-014.

## Related domain rules

invariants Business Partners (duplicate flagging).

## Related ADRs / docs

invariants.md Business Partners.

## Known risks

Normalization rules may need elaboration at activation.

## Open questions

Exact UX for warnings vs API error shape to confirm at activation.

## Readiness checklist

- [ ] Business behavior approved / traceable for this slice
- [ ] No unresolved Open Decision that this story would silently resolve
- [ ] Dependencies satisfied or explicitly accepted
- [ ] Acceptance criteria sufficient to implement

## Task elaboration

Deferred until activation
