# Task

> Reusable template. See `docs/tasks/README.md` for the task system's purpose, lifecycle, and filename convention, and `docs/tasks/WORKFLOW.md` for the end-to-end process this task moves through. Do not remove a section; write "None" or "N/A" with a reason if a section does not apply.

## Metadata

- **Task ID:** TASK-<MODULE>-<NUMBER>
- **Title:** <short, descriptive title>
- **Module:** <business module, per `docs/analysis/01-document-analysis.md` Section 3>
- **Status:** Draft
- **Priority:** <e.g., High / Medium / Low, or a business-driven ranking if defined>
- **Created By:** <agent or human>
- **Assigned Role:** <Backend Engineer / Frontend Engineer / Database Engineer>
- **Reviewer Role:** Code Reviewer
- **QA Role:** QA Engineer
- **Release Role:** Git Release
- **Depends On:** <Task ID(s), or "None">
- **Blocks:** <Task ID(s), or "None">

## Goal

<One or two sentences stating the single vertical slice this task delivers. Must map to one workflow or one clearly bounded part of one workflow in `docs/business/workflow-map.md`.>

## Business Context

<Why this task exists in business terms. Summarize the relevant workflow's trigger, purpose, and result as defined in `docs/business/workflow-map.md`, without duplicating its full text — reference it instead.>

- **User-facing Azerbaijani terminology involved:** <list the business terms this task will present in Azerbaijani, per `docs/business/terminology.md`, or "N/A — no user interface in this task">

## Source References

- BRD: <section and title>
- SRS/TDS: <section and title, if applicable>
- `docs/analysis/01-document-analysis.md`: <section>
- `docs/business/invariants.md`: <group/heading>
- `docs/business/terminology.md`: <term(s)>
- `docs/business/workflow-map.md`: <workflow name>
- `docs/decisions/`: <ADR ID(s), if applicable — include ADR-005 for any UI task>
- `docs/technical/ui-requirements.md`: <relevant section(s), or "N/A — no user interface in this task">
- Approved Human Decision: <reference, or "None">

## Preconditions

<Conditions that must already be true before this task can start: prior tasks completed, prior data/state that must exist, approvals already obtained.>

## Dependencies

<Other tasks, modules, or documents this task depends on. Must match the `Depends On` metadata field.>

## Scope

<Precise statement of what this task includes. Enumerate the exact behavior being added or changed.>

- **Screens and responsive states included:** <list the screens/views in scope and the viewport categories (mobile, tablet, laptop/desktop, large desktop) they must be verified at, or "N/A — no user interface in this task">

## Out of Scope

<Explicit list of related things this task does NOT include, to prevent scope creep, per `AGENTS.md` ("Scope Rules") and `docs/tasks/README.md`.>

- **Unsupported languages or unrelated screen redesigns:** <state explicitly that languages other than Azerbaijani and any screen/workflow redesign outside this task's Scope are excluded, or "N/A">


## Allowed Files

<Explicit list or explicit path patterns of files this task may create or modify. No file outside this list may be touched.>

## Forbidden Files

<Explicit list or explicit path patterns of files this task must not touch, even if related. Include at minimum: `AGENTS.md`, files under `agents/`, files under `docs/business/`, `docs/analysis/`, `docs/decisions/`, and any file outside `Allowed Files`.>

## Required Changes

<Concrete list of changes to make, described in implementation-relevant but non-code terms: which behavior must exist, which validation must be enforced, which effect must be produced.>

## Business Rules

<Every business rule this task must enforce, each referencing its source: an invariant heading/ID from `docs/business/invariants.md`, a workflow name from `docs/business/workflow-map.md`, or an Approved Human Decision. Do not restate full invariant text — cite it.>

- **Canonical Azerbaijani terms:** <list the canonical term(s) from `docs/business/terminology.md` this task must display, or "N/A — no user interface in this task">

## Technical Constraints

<Every technical constraint this task must respect, referencing the relevant ADR(s) from `docs/decisions/` (e.g., ADR-002 frontend/backend boundary, ADR-003 backend authority, ADR-004 immutability) and any other approved technical decision. Do not restate full ADR text — cite it.>

- Azerbaijani-first (ADR-005).
- Mobile-first (ADR-005).
- Fully responsive across supported viewport categories (ADR-005, `docs/technical/ui-requirements.md`).
- No raw technical identifier exposure in the UI (`docs/technical/ui-requirements.md`).
- Backend remains authoritative for validation, calculation, and permissions (ADR-002, ADR-003).

## Acceptance Criteria

- [ ] <Criterion 1, phrased as a verifiable, business-traceable outcome>
- [ ] <Criterion 2>
- [ ] <Criterion 3>
- [ ] ...
- [ ] Azerbaijani UI labels are correct and complete (or "N/A — no user interface in this task")
- [ ] No mixed-language leakage into user-facing content
- [ ] Mobile behavior verified
- [ ] Tablet behavior verified
- [ ] Desktop behavior verified
- [ ] Large-screen behavior verified, where relevant
- [ ] Azerbaijani character rendering verified (`ə`, `ı`, `İ`, `ö`, `ü`, `ğ`, `ş`, `ç`)
- [ ] Long-content handling verified
- [ ] All business actions remain accessible at every supported viewport

## Test Requirements

- **Unit tests:** <what must be covered, or "None required" with reason>
- **Integration tests:** <what must be covered, or "None required" with reason>
- **Frontend tests:** <what must be covered, or "None required" with reason>
- **Migration verification:** <what must be verified if a schema/migration is involved, or "N/A">
- **Manual verification:** <any steps that cannot be automated, or "None required">
- **Localization tests:** <Azerbaijani content/character coverage, or "N/A — no user interface in this task">
- **Responsive frontend tests:** <viewport categories covered, or "N/A — no user interface in this task">
- **Manual viewport verification:** <where automation is insufficient, or "None required">

## Review Checklist

<Task-specific points the Code Reviewer must check in addition to the standard review order defined in `agents/code-reviewer.md` (business correctness, invariant compliance, open-decision safety, scope compliance, ADR compliance, responsibility boundary, immutability/audit, concurrency/precision/idempotency, test adequacy, readability).>

- Language: Azerbaijani content is correct and complete (or "N/A").
- Terminology: matches `docs/business/terminology.md`.
- Error mapping: backend errors are shown in Azerbaijani, not raw.
- Identifier leakage: no internal technical identifier is visible in the UI.
- Responsive behavior: verified across all required viewport categories.
- Accessibility: no regression introduced by a responsive change.

## QA Scenarios

- **Happy path:** <scenario>
- **Validation failure:** <scenario>
- **Permission failure:** <scenario>
- **Boundary case:** <scenario>
- **Retry/idempotency (if relevant):** <scenario, or "N/A" with reason>
- **Correction/reversal (if relevant):** <scenario, or "N/A" with reason>
- **Mobile (if UI):** <scenario, or "N/A">
- **Tablet (if UI):** <scenario, or "N/A">
- **Desktop (if UI):** <scenario, or "N/A">
- **Long Azerbaijani text (if UI):** <scenario, or "N/A">
- **Validation errors displayed to user (if UI):** <scenario, or "N/A">
- **Permission errors displayed to user (if UI):** <scenario, or "N/A">
- **Empty/loading/failure states (if UI):** <scenario, or "N/A">

## Handoff

<Where this task goes next at each stage: Assigned Role → Code Reviewer → QA Engineer → Git Release, per `docs/tasks/WORKFLOW.md`. Note any role this specific task skips and why (e.g., no Database Engineer involvement needed).>

## Stop Conditions

<Task-specific conditions under which the assigned agent must stop and escalate, in addition to the general Stop Conditions in `AGENTS.md` and the assigned role's file in `agents/`.>

## Completion Evidence

- **Files changed:** <list, must match `Allowed Files`>
- **Tests run:** <list>
- **Results:** <pass/fail summary>
- **Reviewer verdict:** <Approved / Approved with minor notes / Changes Required>
- **QA verdict:** <Passed / Failed / Blocked>
- **Commit or PR reference:** <reference, or "N/A" if not yet released>
- **Viewports tested:** <mobile / tablet / laptop-desktop / large desktop, or "N/A — no user interface in this task">
- **Azerbaijani UI content verified:** <yes/no and brief note, or "N/A — no user interface in this task">
- **Screenshots or test evidence:** <reference, where required, or "N/A">
