# TASK-038-01: Add master-data frontend API foundation

## Metadata

- **Task ID:** TASK-038-01
- **Title:** Add master-data frontend API foundation
- **Parent User Story:** [US-038](../stories/US-038-frontend-master-data-screens.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** S
- **Dependencies:** US-037 Done

## Objective

Provide shared typed pagination, list-query, query-key, and API-error contracts
for the master-data screens without adding a business screen.

## Scope

- Shared paginated response and list-query types
- Stable query-key factory for currencies, units, products, and partners
- Query-parameter normalization compatible with delivered APIs
- Structured API error payload typing, including US-016 duplicate candidates
- Build/lint validation

## Out of scope

- User-facing screens or business labels
- Domain endpoint hooks (owned by each vertical screen task)
- Generated OpenAPI client tooling
- Auth, retries, or business validation

## Acceptance criteria

- [x] Shared pagination/list-query contracts exist
- [x] Query keys are deterministic and module-scoped
- [x] Undefined/empty list parameters are omitted
- [x] Structured backend error and duplicate-candidate payloads are typed
- [x] Web build and lint pass

## Implementation notes

Keep server state in TanStack Query (ADR-016); do not mirror it into Redux.

## Documentation impact

Task evidence only.

## Testing expectations

Build and lint. Unit tests are deferred until a web test harness exists.

## Validation expectations

`yarn workspace web build` and `yarn workspace web lint`.

## Risks

Manual types may drift until OpenAPI client generation is separately approved.

## Assumptions

Current backend REST contracts are authoritative.

## Evidence

- `apps/web/src/features/master-data/api/master-data.types.ts`
- `apps/web/src/features/master-data/api/normalize-list-query.ts`
- `apps/web/src/features/master-data/api/master-data-query-keys.ts`
- `apps/web/src/api/api-error.types.ts`
- `apps/web/src/api/map-api-error.ts`
- `yarn workspace web lint` — passed
- `yarn workspace web build` — passed (existing bundle-size warning remains)

## Result

Done. Shared typed query/error foundation is ready for the three UI slices.

## Completion date

2026-07-29
