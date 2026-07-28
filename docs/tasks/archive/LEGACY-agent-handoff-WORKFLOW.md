# TOPTANFLOW Task Workflow

> This document defines the operational path a single task takes from an initial request to `Done`. It complements `docs/tasks/README.md` (why the system exists, the lifecycle statuses) and `docs/tasks/TASK-TEMPLATE.md` (the structure of a task). Role authority, responsibilities, and forbidden actions are defined once in `agents/` and are referenced here, not repeated.

## Required Execution Principle

```
Business Analyst
   ↓
Solution Architect        (when needed)
   ↓
Task Planner
   ↓
Database Engineer         (when needed)
   ↓
Backend Engineer
   ↓
Frontend Engineer
   ↓
Code Reviewer
   ↓
QA Engineer
   ↓
Git Release
```

This is a **responsibility flow**, not a mandate that every task must invoke every agent. A task's `Handoff` section (per `docs/tasks/TASK-TEMPLATE.md`) states exactly which roles it actually needs. A task with no schema impact skips the Database Engineer; a backend-only task skips the Frontend Engineer; a task with no new architectural concern skips the Solution Architect. What may never be skipped is the *order* among the roles a task does need: a later role never starts before an earlier, needed role has handed off.

---

## Phase 1 — Business Clarification

- **Responsible agent:** Business Analyst (`agents/business-analyst.md`)
- **Required inputs:** The raw request or business need; `docs/analysis/01-document-analysis.md`; `docs/business/invariants.md`; `docs/business/terminology.md`; `docs/business/workflow-map.md`; any Approved Human Decision.
- **Allowed actions:** Identify the affected workflow(s); separate confirmed behavior from Open Decisions; produce an implementation-independent business specification; raise questions for human decision.
- **Required output:** A business specification, or an explicit list of blocking questions if the behavior is not yet approved.
- **Stop conditions:** As defined in `agents/business-analyst.md` (missing rule, document conflict, Open Decision, ambiguous request).
- **Handoff target:** Solution Architect (if an architectural concern exists) or directly to Task Planner.

## Phase 2 — Architecture Check

- **Responsible agent:** Solution Architect (`agents/solution-architect.md`)
- **Required inputs:** The approved business specification; `AGENTS.md`; all Accepted ADRs in `docs/decisions/`; `docs/business/invariants.md` and `docs/business/workflow-map.md`.
- **Allowed actions:** Map the workflow to module boundaries; define the frontend/backend boundary for the work; identify concurrency, security, audit, and failure concerns; propose a new ADR if a material decision is required.
- **Required output:** A technical design and implementation constraints, or a proposed ADR awaiting human approval.
- **Stop conditions:** As defined in `agents/solution-architect.md` (unapproved business behavior, ADR/invariant conflict, need for an unapproved dependency or pattern, Open Decision).
- **Handoff target:** Task Planner.

**Solution Architect involvement is mandatory when:**
- The task introduces a new module boundary or changes an existing one.
- The task requires a new transaction boundary, concurrency approach, or integration direction.
- The task appears to need a new architectural pattern, dependency, or framework not already covered by an Accepted ADR.
- The task's business specification does not clearly map onto existing module boundaries in `docs/analysis/01-document-analysis.md` (Section 12, "Recommended Module Boundaries").

Solution Architect involvement may be skipped when the task fits entirely within an already-approved module boundary and requires no new architectural decision.

## Phase 3 — Task Drafting

- **Responsible agent:** Task Planner (`agents/task-planner.md`)
- **Required inputs:** The approved business specification; the technical design (if Phase 2 occurred); `docs/tasks/TASK-TEMPLATE.md`.
- **Allowed actions:** Decompose the work into one or more single-vertical-slice tasks; define scope, allowed/forbidden files, dependencies, acceptance criteria, and required tests for each; assign each task's `Assigned Role`.
- **Required output:** One or more task files in `docs/tasks/`, each following `docs/tasks/TASK-TEMPLATE.md`, filed under the naming convention in `docs/tasks/README.md`, with `Status: Draft` initially. Any task involving a user interface must include its Azerbaijani content and responsive viewport requirements, per `docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md` and `docs/tasks/README.md` ("Rules for UI Tasks").
- **Stop conditions:** As defined in `agents/task-planner.md` (incomplete/unapproved input, task cannot be scoped to one vertical slice, dependency on an Open Decision).
- **Handoff target:** Human or delegated approval step (Phase 4).

## Phase 4 — Task Approval

- **Responsible agent:** Task Planner prepares; approval itself is a human or explicitly delegated decision, per `AGENTS.md` ("Approved Human Decisions" in the Source of Truth Hierarchy).
- **Required inputs:** The drafted task file(s).
- **Allowed actions:** Confirm the task's business behavior is approved, its scope is bounded, and it does not depend on an unresolved Open Decision.
- **Required output:** Task status changes from `Draft` to `Ready` (or to `Needs Business Decision` / `Blocked` if approval cannot be given).
- **Stop conditions:** Any unresolved Open Decision, missing business rule, or scope ambiguity found during approval sends the task back to Phase 1 or Phase 3, not forward.
- **Handoff target:** The role named in the task's `Assigned Role` field.

## Phase 5 — Implementation

- **Responsible agent:** Database Engineer (if needed), then Backend Engineer, then Frontend Engineer (if needed) — per `agents/database-engineer.md`, `agents/backend-engineer.md`, `agents/frontend-engineer.md`.
- **Required inputs:** The `Ready` task file.
- **Allowed actions:** Modify only files listed in `Allowed Files`; implement exactly the `Required Changes`; add the tests listed in `Test Requirements`. The Frontend Engineer follows `docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md` and `docs/technical/ui-requirements.md` for any user-facing work.
- **Required output:** An implementation summary per the assigned role's `Required Outputs`, with task status moved to `In Progress` during work.
- **Stop conditions:** As defined in the assigned role's file (missing behavior, ADR/invariant conflict, Open Decision, insufficient allowed files).
- **Handoff target:** Code Reviewer, with status moved to `In Review`.

**Database Engineer involvement is mandatory when:**
- The task's `Required Changes` include a new or modified schema, migration, constraint, or index.
- The task's business rule depends on a data-integrity guarantee (uniqueness, referential integrity, precision) not already supported by the existing schema.

Database Engineer involvement may be skipped when the task uses only existing, already-modeled data structures.

**Backend Engineer must precede Frontend Engineer when:**
- The task's `Scope` includes any new or changed backend contract, validation rule, calculation, or permission check that the frontend will present or depend on — per ADR-002 and ADR-003, the frontend never owns business logic, so it cannot correctly present a contract that does not yet exist.

Frontend work may proceed in parallel with backend work only when it does not depend on a not-yet-existing backend contract (for example, static UI layout unrelated to the task's business behavior); the task's `Handoff` section must state this explicitly.

**Parallel work is allowed when:**
- Two tasks touch disjoint `Allowed Files` and neither is listed in the other's `Depends On`.
- Frontend and backend work on the same task are both scoped, and the frontend work does not depend on an unmerged backend contract (see above).

**Parallel work is forbidden when:**
- Two tasks would modify the same file.
- One task's `Depends On` names the other.
- The work would require two agents to independently decide the same business rule (violates single-authority principles in ADR-003).

## Phase 6 — Code Review

- **Responsible agent:** Code Reviewer (`agents/code-reviewer.md`)
- **Required inputs:** The task file; the implementation summary; `docs/business/invariants.md`; `docs/business/terminology.md`; all Accepted ADRs.
- **Allowed actions:** Review in the fixed order defined in `agents/code-reviewer.md`; classify findings as Blocker, Major, Minor, or Note. For user-facing changes, the reviewer additionally verifies Azerbaijani language and responsive-behavior compliance per `docs/technical/ui-requirements.md`.
- **Required output:** A review verdict (Approved, Approved with minor notes, or Changes Required) with itemized findings.
- **Stop conditions:** As defined in `agents/code-reviewer.md` (ambiguous acceptance criteria, unflagged Open Decision dependency, document conflict).
- **Handoff target:** Back to the implementing role if Changes Required; forward to QA Engineer if approved, with status moved to `In QA`.

**How review findings are returned:** Findings are appended to the task file (or a linked review record) with file, location, issue, violated rule, and required correction, and the task status reverts to `In Progress` until every Blocker and Major finding is resolved. Minor findings and Notes may be resolved in the same cycle or explicitly deferred with reviewer agreement, but deferral must be recorded in the task file.

## Phase 7 — QA

- **Responsible agent:** QA Engineer (`agents/qa-engineer.md`)
- **Required inputs:** The task's `Acceptance Criteria` and `QA Scenarios`; the reviewed implementation; the Code Reviewer's verdict.
- **Allowed actions:** Execute the defined QA scenarios (happy path, validation failure, permission failure, boundary case, retry/idempotency, correction/reversal, as applicable); report results per scenario. For user-facing tasks, QA additionally verifies Azerbaijani content and the supported viewport categories per `docs/technical/ui-requirements.md`.
- **Required output:** A QA verdict (Passed, Failed, or Blocked) with defects and requirement gaps distinguished, per `agents/qa-engineer.md`.
- **Stop conditions:** As defined in `agents/qa-engineer.md` (ambiguous expected behavior, dependency on an Open Decision).
- **Handoff target:** Back to the implementing role if Failed; forward to Git Release if Passed, with status moved to `Ready for Release`.

**How QA defects are returned:** Defects are appended to the task file with reproduction steps and evidence, and the task status reverts to `In Progress`. A requirement gap (as opposed to an implementation defect) is returned to the Business Analyst or Task Planner instead of the implementing role, since it means the task itself was incompletely specified.

## Phase 8 — Git and Release

- **Responsible agent:** Git Release (`agents/git-release.md`)
- **Required inputs:** The task's `Allowed Files`; the Code Reviewer's verdict; the QA Engineer's verdict.
- **Allowed actions:** Verify only allowed files changed; verify both verdicts are satisfactory; prepare a focused, task-traceable commit and release notes.
- **Required output:** A release verdict (Ready, Blocked, or Released) per `agents/git-release.md`.
- **Stop conditions:** As defined in `agents/git-release.md` (missing/insufficient review or QA verdict, out-of-scope files, missing migration rollback strategy).
- **Handoff target:** Back to the relevant agent if Blocked; task moves to `Done` once released.

## Phase 9 — Completion

- **Responsible agent:** Git Release confirms; Task Planner records final status.
- **Required inputs:** The release result; the task's `Completion Evidence` section.
- **Allowed actions:** Fill in `Completion Evidence` (files changed, tests run, results, reviewer verdict, QA verdict, commit/PR reference); set status to `Done`.
- **Required output:** A task file with `Status: Done` and complete `Completion Evidence`, permanently retained in `docs/tasks/` per `docs/tasks/README.md`. A user-facing task cannot reach `Done` without its `Completion Evidence` recording viewports tested and Azerbaijani UI content verified, per `docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md`.
- **Stop conditions:** None — this phase only records an already-successful outcome. If any prior phase was not actually satisfied, the task does not reach this phase.
- **Handoff target:** None; the task is closed.

---

## Reopening a Task

A task already `Done` is not edited to change its recorded behavior. If a defect is found afterward, or new business behavior changes what was built, a **new task** is created referencing the original (via `Depends On` or a note in `Business Context`), following ADR-004's principle that a completed, posted fact is corrected through a new, linked action, not an in-place edit. A task not yet `Done` (e.g., returned from Review or QA) is "reopened" simply by moving its status back to `In Progress` as described in Phases 6–7; this is a normal part of the lifecycle, not a special procedure.

## Cancelling a Task

A task is set to `Status: Cancelled` when it will not proceed, with a stated reason recorded in the task file (e.g., superseded by another task, business need removed, blocked indefinitely by an Open Decision that will not be resolved soon). The file is retained, never deleted, and its Task ID is never reused, per `docs/tasks/README.md`.

## Approving a Task Scope Change

A scope change to a task already `Ready` or later must be requested to the Task Planner, not made unilaterally by an implementing agent. The Task Planner records the change directly in the task file (what changed, who requested it, why) rather than overwriting the original scope silently. If the change would alter the task's business behavior itself, it returns to Phase 1 (Business Clarification) before the scope is edited. If the change would turn the task into a different vertical slice, it is not a scope change — a new task is created instead.

## Recording Discovered but Unrelated Issues

Any agent in any phase that discovers an issue outside the current task's scope must report it, not fix it, per `AGENTS.md` ("Scope Rules"). The issue is recorded as a note in the current task's file (a short description, where it was found, and its apparent impact) and, if it warrants its own work, becomes a candidate for a new task created by the Task Planner in a future planning pass. It is never folded into the current task's `Required Changes` or `Allowed Files`.
