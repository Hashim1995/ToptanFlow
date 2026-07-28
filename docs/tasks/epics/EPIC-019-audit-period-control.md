# EPIC-019: Audit, period control, and corrections

- **ID:** EPIC-019
- **Title:** Audit, period control, and corrections
- **Status:** Planned

## Business objective

Append-only audit, period guards, correction/reversal workflows.

## User / business value

Immutable history and controlled amendments.

## Scope

Audit log; period close; correction overlay.

## Exclusions

Editing posted facts in place.

## Dependencies

Transactional modules; foundation hooks ideally early.

## Related ADRs / docs

invariants Audit; ADR-004; period/correction workflows.

## Child user stories

- US-034
- US-035

## Completion definition

Sensitive actions attributable; corrections are new linked actions.

## Known risks

Full audit entity not in initial schema.

## Open questions

AD-14/15.

## Repository evidence

Per-record timestamps/actors only today.
