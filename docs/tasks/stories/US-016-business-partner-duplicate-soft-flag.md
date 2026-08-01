# US-016: BusinessPartner duplicate soft-flag checks

- **ID:** US-016
- **Title:** BusinessPartner duplicate soft-flag checks
- **Parent Epic:** [EPIC-006](../epics/EPIC-006-business-partners-backend.md)
- **Status:** Done
- **Priority:** Medium
- **Business actor:** Master-data maintainer

## Statement

As a master-data maintainer, I want possible duplicate partners flagged using normalized identifiers on create/update, so that I do not silently create a second card for the same real-world counterparty.

## Business value

Master-data quality / operator clarity. Technical identity remains `id` (UUID) + `code` (ADR-024). Name/phone/taxNumber are helper fields — soft flag only.

## High-level scope

- Soft duplicate check **inside** `POST /business-partners` and `PATCH /business-partners/:id` (when name/phone/taxNumber change)
- First attempt with matches → **`409`** + candidate list (`BUSINESS_PARTNER_DUPLICATE_SUSPECTED`)
- Retry with `acknowledgeDuplicate: true` → proceed (soft flag preserved)
- **No** separate `duplicate-check` endpoint; frontend only calls create/update
- Unit + e2e coverage

## High-level acceptance criteria

- Possible duplicates on normalized name / phone / taxNumber return 409 with candidates
- `acknowledgeDuplicate: true` allows create/update to proceed
- Empty/null helper fields never match
- Inactive partners included in candidates
- Self excluded on update
- No dedicated duplicate HTTP route
- uuid/code uniqueness unchanged (ADR-024)

## Dependencies

[US-014](US-014-business-partner-create-read-apis.md) Done; [US-015](US-015-business-partner-update-deactivate-apis.md) Done.

## Related domain rules

`docs/business/invariants.md` — Business Partners soft flag before create.

## Related ADRs / docs

- ADR-003, ADR-015, ADR-022, ADR-024
- Analysis §6.5; BRD §7.2
- BRD-CA-20 merge — out of scope

## Known risks

Exact-after-normalize only (no fuzzy match).

## Open questions

| Question | Disposition |
| --- | --- |
| Separate duplicate-check API? | **Rejected (2026-07-29, owner).** Check runs inside create/update only; frontend must not call a separate suggestion API. |
| Soft vs hard? | **Approved (2026-07-29):** `409` + candidates; proceed only with `acknowledgeDuplicate: true`. Soft flag preserved (not hard unique on phone/tax). |
| Normalization? | Unchanged: name trim/collapse/case-fold; phone `+`+digits; tax whitespace-stripped/case-fold; OR match; inactive included. |
| “Other identifiers”? | Deferred — name/phone/taxNumber only. |
| PATCH? | **In scope** when name/phone/taxNumber change (exclude self). |
| BRD-CA-20 merge? | Out of scope / remains open. |

## Readiness checklist

- [x] Business behavior approved / traceable
- [x] No silent resolution of BRD-CA-20
- [x] Dependencies satisfied
- [x] Tasks elaborated

## Task elaboration

- [TASK-016-01](../tasks/TASK-016-01-add-business-partner-duplicate-check-api.md) — **Done** (revised: create/update 409+ack; no standalone route)
- [TASK-016-02](../tasks/TASK-016-02-extend-business-partner-duplicate-check-e2e.md) — **Done**
