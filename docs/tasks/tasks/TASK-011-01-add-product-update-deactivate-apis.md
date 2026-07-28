# TASK-011-01: Add Product update and deactivation APIs

## Metadata

- **Task ID:** TASK-011-01
- **Title:** Add Product update and deactivation APIs
- **Parent User Story:** [US-011](../stories/US-011-product-update-deactivate-apis.md)
- **Parent Epic:** [EPIC-005](../epics/EPIC-005-product-catalog-backend.md)
- **Status:** Done
- **Type:** API
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-010-01

## Objective

Implement Product update and deactivation without hard delete; keep code immutable.

## Scope

PATCH/DELETE(deactivate) paths; update DTO excludes code.

## Out of scope

Category master module; UI.

## Acceptance criteria

- [x] Update/deactivate APIs exist
- [x] code not accepted on update

## Implementation notes

Commit 1b02537; ADR-024 immutability reinforced in c3619ba.

## Documentation impact

Controller descriptions cite ADR-024.

## Testing expectations

Unit tests + e2e.

## Validation expectations

Update/deactivate behaviors.

## Risks

None.

## Assumptions

Inactivate-not-delete invariant.

## Evidence

Commit 1b02537; apps/api/src/products; update-product.dto.ts.

## Result

Done.
## Completion date

2026-07-28 (commit 1b02537)
