# TASK-041-02: Lock reactivation and CHANGE-001 helper regressions

## Metadata

- **Task ID:** TASK-041-02
- **Title:** Lock reactivation and CHANGE-001 helper regressions
- **Parent User Story:** [US-041](../stories/US-041-quality-harness-expansion.md)
- **Parent Epic:** [EPIC-023](../epics/EPIC-023-testing-quality-infrastructure.md)
- **Status:** Done
- **Type:** Test
- **Priority:** Medium
- **Estimate:** S
- **Dependencies:** TASK-041-01 Done; owner reactivation decision 2026-07-29

## Objective

Resume US-041 after CHANGE-001 pause. Add automated regression coverage for
master-data soft-deactivate **reactivation** (operational completeness) and
keep web pure-helper suite current for CHANGE-001 helpers already shipped.

## Scope

- API e2e: PATCH `isActive: true` reactivation for products and business partners
  (and currency/unit/category if missing)
- Align any e2e wording that still claims “no reactivation”
- Confirm web Vitest still covers `sanitizeDecimalInput` (+ existing helpers)
- Evidence in this task; update CURRENT honestly

## Out of scope

- Browser E2E framework selection
- CI provider wiring
- New business features beyond tests
- Open Decision resolutions

## Acceptance criteria

- [x] Product and partner e2e prove PATCH reactivation
- [x] Existing “without reactivation” e2e updated to match policy
- [x] `yarn workspace web test` still green (includes decimal sanitize)
- [x] Targeted API e2e green
- [x] No Open Decisions silently resolved

## Testing expectations

`yarn workspace api test:e2e` (targeted suites); `yarn workspace web test`.

## Evidence

- E2E reactivation cases: products, business-partners, currencies, units, product-categories
- Product e2e renamed: inactive update without changing `isActive` when omitted
- Currency/unit P2002 mapping: duck-type `code === 'P2002'` (fixes dual Prisma client `instanceof` 500s in e2e)
- Targeted e2e: **5 suites / 72 passed**
- `yarn workspace web test`: **17 passed** (includes sanitize-decimal-input)

## Result

Done. Reactivation regressions locked; US-041 resume slice complete.

## Completion date

2026-07-29
