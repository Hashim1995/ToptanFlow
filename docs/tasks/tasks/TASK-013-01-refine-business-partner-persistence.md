# TASK-013-01: Refine BusinessPartner persistence model

## Metadata

- **Task ID:** TASK-013-01
- **Title:** Refine BusinessPartner persistence model
- **Parent User Story:** [US-013](../stories/US-013-business-partner-persistence-refinement.md)
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Type:** Migration
- **Priority:** High
- **Estimate:** M
- **Dependencies:** TASK-008-01
- **Legacy reference:** Step 16.1

## Objective

Refine BusinessPartner schema for unified partner + default currency.

## Scope

Migration 20260728151951_refine_business_partner_persistence_model.

## Out of scope

HTTP APIs.

## Acceptance criteria

- [x] Refinement migration exists

## Implementation notes

Commit 24a527a.

## Documentation impact

Schema cites invariants.

## Testing expectations

Migration present.

## Validation expectations

Migrate path.

## Risks

None.

## Assumptions

Unified partner model required by invariants.

## Evidence

Commit 24a527a; migration 20260728151951_refine_business_partner_persistence_model.

## Result

Done.
## Completion date

2026-07-28 (commit 24a527a)
