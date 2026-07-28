# TOPTANFLOW Task Specification System

## Why Task Specifications Exist

A task specification is the single, written boundary between "what is approved" and "what an implementation agent is allowed to build." Per `AGENTS.md` ("Project Philosophy" and "AI Operating Principles"), no business behavior is implemented before it is written down, approved, and traceable to a source document, and every agent must reason from a specific rule and source before acting. A task specification is where that reasoning is captured once, so that the Backend Engineer, Frontend Engineer, Database Engineer, Code Reviewer, QA Engineer, and Git Release agent (see `agents/`) can all work from the same, unambiguous instruction instead of re-deriving business intent independently.

Without a task specification, an implementation agent would have to infer scope, correctness, and intent from a large request, which directly risks the failure modes `AGENTS.md` forbids: inventing a requirement, silently resolving an Open Decision, or expanding a task beyond what was asked.

## Why Large, Vague Requests Must Be Decomposed

`AGENTS.md` ("Project Philosophy") requires small, incremental changes and one completed task at a time. A large request (for example, "build the Sales module") spans multiple workflows, multiple invariant groups, and multiple roles (`docs/business/workflow-map.md` lists Sales-related workflows alone across Sales, Inventory, Settlement, Costing, and Bundles). Attempting it as one task makes correctness unverifiable: a reviewer or QA engineer cannot confirm business correctness (`AGENTS.md`, "Review Principles") against a scope that is too broad to check line by line. The Task Planner's role (`agents/task-planner.md`) exists specifically to decompose such requests into work a single agent can complete and a single reviewer can safely verify.

## The One-Vertical-Slice-at-a-Time Rule

Each task specification must correspond to **one vertical slice**: one workflow, or one clearly bounded part of one workflow (as named in `docs/business/workflow-map.md`), carried through whichever layers it actually touches (business rule, backend, frontend, database) — not one technical layer across many workflows. A task is not "add a database table" or "build the API layer"; it is "implement Workflow X's posting effect," scoped to the files that workflow requires. This keeps every task traceable to one business event and reviewable as a complete, coherent change, consistent with `AGENTS.md`'s "Definition of Done" (the change is the smallest one that correctly satisfies the task).

## Relationship Between Business Requirements, Architecture Decisions, Task Specifications, Implementation, Review, QA, and Release

This system sits inside the Source of Truth Hierarchy defined in `AGENTS.md`:

```
Business Requirements Document (BRD)
        ↓
Approved Human Decisions
        ↓
Business Knowledge Documents (docs/business/)
        ↓
Technical Specification (SRS/TDS) + Accepted ADRs (docs/decisions/)
        ↓
Task Specification (docs/tasks/)
        ↓
Implementation → Review → QA → Release
```

- **Business requirements** (BRD, `docs/business/invariants.md`, `docs/business/terminology.md`, `docs/business/workflow-map.md`) define *what* must be true. A task specification never redefines this; it only references it.
- **Architecture decisions** (`docs/decisions/`) define *how* the system is structured to satisfy those requirements. A task specification must stay inside Accepted ADRs, or it is not ready.
- **Task specifications** (this system) translate approved business behavior and architecture into a scoped, executable, verifiable unit of work, per `agents/task-planner.md`.
- **Implementation** (`agents/backend-engineer.md`, `agents/frontend-engineer.md`, `agents/database-engineer.md`) builds exactly what the task specifies, nothing more.
- **Review** (`agents/code-reviewer.md`) checks the implementation against the task, the invariants, and the ADRs, in that order.
- **QA** (`agents/qa-engineer.md`) verifies the implementation behaves correctly against the task's acceptance criteria and the underlying invariants.
- **Release** (`agents/git-release.md`) packages only reviewed, QA-passed work traceable to the task.

A task specification is the pivot point of this chain: everything above it must already be approved before the task is written; everything below it must be traceable back to it.

## Who May Create a Task

Only the Task Planner (`agents/task-planner.md`) creates a task specification, and only from an already-approved business specification (Business Analyst, `agents/business-analyst.md`) and, where architecture is involved, an already-approved technical design (Solution Architect, `agents/solution-architect.md`). A task must not be created directly from a raw, undecomposed request.

## Who May Execute a Task

Only the role named in the task's `Assigned Role` metadata field may implement it (Backend Engineer, Frontend Engineer, or Database Engineer, per `agents/`). An implementation agent may only touch the files listed under `Allowed Files` in the task.

## When a Task Is Ready

A task is **Ready** only when:
- Its business behavior is approved and traceable to the BRD, an Approved Human Decision, or `docs/business/invariants.md` / `docs/business/workflow-map.md`.
- Its technical approach does not conflict with any Accepted ADR.
- It does not depend on an unresolved Open Decision.
- Its scope, allowed files, and acceptance criteria are fully specified using `docs/tasks/TASK-TEMPLATE.md`.

## When a Task Is Blocked

A task is **Blocked** when it depends on:
- A missing business rule.
- A conflict between source documents.
- An unresolved Open Decision.
- An unapproved architecture decision.
- Another task that has not reached `Done`.

A blocked task must state the exact blocking reason and what is needed to unblock it, consistent with `AGENTS.md`'s "File Modification Policy" refusal rule.

## Task Status Lifecycle

```
Draft
  ↓
Needs Business Decision  (only if a business gap or Open Decision is found)
  ↓
Ready
  ↓
In Progress
  ↓
In Review
  ↓
In QA
  ↓
Ready for Release
  ↓
Done
```

Two statuses exist outside this line and may apply at any point:

- **Blocked** — the task cannot currently proceed for a stated reason; it returns to the lifecycle once the reason is resolved.
- **Cancelled** — the task will not proceed at all; the file is retained for traceability, never deleted.

A task only advances forward through the lifecycle; it never skips a stage, and a return to an earlier stage (e.g., `In Review` → `In Progress` after review findings) is a normal handoff, not a lifecycle violation.

## Task ID and Filename Convention

```
TASK-<MODULE>-<NUMBER>-<short-kebab-title>.md
```

- `<MODULE>` is the business module name in upper case, consistent with the module names used in `docs/analysis/01-document-analysis.md` (Section 3, "Business Modules") and `docs/business/workflow-map.md` (e.g., `USERS`, `PARTNERS`, `PRODUCTS`, `SALES`, `PURCHASING`, `INVENTORY`, `CASH`, `SETTLEMENT`, `EXPENSES`, `ASSETS`, `YATI`, `MESSAGING`, `ATTACHMENTS`, `ALERTS`, `AUDIT`, `REPORTING`, `MIGRATION`).
- `<NUMBER>` is a zero-padded, sequential, per-module number (`001`, `002`, ...), never reused, even if a task is cancelled.
- `<short-kebab-title>` is a concise, lowercase, hyphenated summary of the task's single vertical slice.

Examples:
- `TASK-USERS-001-create-user-foundation.md`
- `TASK-PARTNERS-001-create-partner-foundation.md`
- `TASK-SALES-001-create-sale-draft.md`

## Where Completed Tasks Remain Stored

All task files, regardless of status, remain permanently in `docs/tasks/`, organized as one file per task. A task reaching `Done` or `Cancelled` is never deleted or moved; its file is the historical record of what was decided, built, reviewed, and released, consistent with the immutability principle in `docs/business/invariants.md` ("Global Invariants") and ADR-004.

## Rules for Changing an Approved Task

- A task's business behavior, scope, or acceptance criteria may only be changed by returning it to the Task Planner; an implementation agent must not silently reinterpret scope.
- Any scope change to a task already `Ready` or later must be recorded in the task file itself (not overwritten silently), including who requested it and why.
- A scope change that would require resolving an Open Decision is not permitted; the task instead moves to `Needs Business Decision` or `Blocked`.
- A scope change that materially changes the vertical slice (e.g., adding an unrelated workflow) is not an edit — it requires a new task.

## Rules for UI Tasks

Per `docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md` and `docs/technical/ui-requirements.md`:

- Every task involving a user interface must reference ADR-005 and `docs/technical/ui-requirements.md` in its Source References.
- Every UI task must explicitly define its Azerbaijani user-facing content requirements.
- Every UI task must explicitly define the relevant responsive viewport categories it must satisfy (e.g., mobile, tablet, laptop/desktop, large desktop).
- "Make it responsive" is not sufficient task scope; the specific viewport categories and preserved behaviors must be named.
- Language (Azerbaijani content) and responsive acceptance criteria are part of a UI task's Definition of Done, per `AGENTS.md`.

## Rules Preventing Scope Creep

- Every task must state explicit `Out of Scope` and `Forbidden Files` sections (see `docs/tasks/TASK-TEMPLATE.md`); anything not explicitly allowed is forbidden.
- An implementation agent encountering an unrelated issue must report it, not fix it, per `AGENTS.md` ("Scope Rules").
- A task must not be combined with another task's scope to save effort; one task remains one vertical slice.
- A reviewer or QA engineer finding scope creep in a submitted change must treat it as a review finding (per `agents/code-reviewer.md`), not silently accept it.
