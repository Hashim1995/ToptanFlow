# TOPTANFLOW Task Management System

> Canonical, repository-owned source of truth for roadmap, epics, user stories, implementation tasks, unplanned work, and delivery history.
> This system supersedes the earlier task-*specification-only* layout. Preserved history: [`archive/`](archive/).

## Purpose

TOPTANFLOW is a business-critical ERP. Planning must live in version control with the code so any agent or human can answer:

- what has been completed
- what is active now
- what comes next
- why work exists
- what depends on what
- which user story owns a task
- whether a change was planned or unplanned

This system is **lightweight but disciplined**: useful for a solo developer today, suitable for a larger team later. It does **not** require Jira/Trello/GitHub Projects to understand project state.

## Hierarchy

```
Roadmap (ROADMAP.md)
  └── Epic (EPIC-xxx)
        └── User Story (US-xxx)
              └── Task (TASK-xxx-nn)   ← detailed only when story is active/completed/next
Unplanned work (BUG / HOTFIX / CHANGE / TECH)
  └── may pause stories, create dependencies, or become technical-enabler stories
```

Canonical ownership:

| File / folder | Owns |
| --- | --- |
| [`ROADMAP.md`](ROADMAP.md) | High-level delivery order and phases |
| [`CURRENT.md`](CURRENT.md) | Active operational state (keep short) |
| [`BACKLOG.md`](BACKLOG.md) | Upcoming stories not yet active |
| [`CHANGELOG.md`](CHANGELOG.md) | Planning history (not product release notes) |
| [`epics/`](epics/) | Epic scope, exclusions, risks |
| [`stories/`](stories/) | Business acceptance and readiness |
| [`tasks/`](tasks/) | Implementation acceptance, results, evidence |
| [`unplanned/`](unplanned/) | Interruptions and approved scope changes |

Do **not** duplicate status across many files. Update the owning file; other files link.

## ID conventions

| Kind | Pattern | Example |
| --- | --- | --- |
| Epic | `EPIC-NNN` | `EPIC-006` |
| User Story | `US-NNN` | `US-015` |
| Task | `TASK-NNN-nn` | `TASK-014-01` (parent story `US-014`) |
| Bug | `BUG-NNN` | `BUG-001` |
| Hotfix | `HOTFIX-NNN` | `HOTFIX-001` |
| Unplanned change | `CHANGE-NNN` | `CHANGE-001` |
| Technical intervention | `TECH-NNN` | `TECH-001` |

Rules:

- IDs are **stable** and **never reused**, even if Cancelled.
- Filenames include the ID: `EPIC-006-business-partners-backend.md`.
- Parent–child links are explicit in each file.
- Conversational “Step 16.x” labels are **legacy references** only, not permanent IDs.

## Statuses

| Status | Meaning |
| --- | --- |
| **Draft** | Requirement incomplete or unresolved. |
| **Planned** | Understood at high level; not ready to start. |
| **Ready** | Dependencies and acceptance criteria sufficient for implementation. |
| **In Progress** | Implementation is active. |
| **Blocked** | Cannot proceed; blocker must be documented. |
| **Review** | Implementation complete; awaiting review/acceptance. |
| **Done** | Accepted and validated with evidence. |
| **Cancelled** | Intentionally abandoned; file retained. |
| **Deferred** | Intentionally postponed; not abandoned. |

Do not use vague statuses (“almost done”, “pending-ish”).

Honest completion rules:

- **Confirmed Done** — implementation + tests + repository evidence support completion.
- **Partially Done** — some pieces exist; acceptance incomplete (record on the story, not as a fake Done).
- **Planned** — documentation/placeholders only.
- **Unknown** — evidence insufficient.

A Prisma model, empty module, or single endpoint alone does **not** make a story Done.

## Estimates

Use relative sizes (no invented calendar dates/hours):

| Size | Meaning |
| --- | --- |
| **XS** | Less than one normal session |
| **S** | About one session |
| **M** | Two to three sessions |
| **L** | Several sessions |
| **XL** | Must be decomposed before implementation |

Where unknown: `Estimate deferred until story activation.`

## Progressive elaboration

Do **not** fully decompose every future story today.

| Story state | Task elaboration |
| --- | --- |
| Draft / Planned / far future | `Deferred until activation` |
| Active, next, partially implemented, or completed | Detailed `TASK-*` files exist |

### Activate a user story

1. Read the story and parent Epic.
2. Inspect current code, ADRs, and business docs.
3. Resolve or report open questions (`AGENTS.md` Stop Conditions).
4. Create implementation tasks under `docs/tasks/tasks/`.
5. Define dependencies and acceptance criteria.
6. Update [`CURRENT.md`](CURRENT.md) and [`CHANGELOG.md`](CHANGELOG.md).
7. Set story to Ready or In Progress.
8. Begin implementation only after planning is coherent.

### Close work

1. Mark task Done only with evidence (paths, migrations, tests, commits if known).
2. When all story tasks Done and acceptance met → story Done.
3. Update CURRENT.md; append CHANGELOG.md.
4. Never delete Done/Cancelled files.

## Unplanned work, hotfixes, and cross-cutting changes

See [`unplanned/README.md`](unplanned/README.md).

Summary:

- **BUG** — confirmed defect in expected behavior.
- **HOTFIX** — urgent production/delivery-critical correction.
- **CHANGE** — approved unplanned scope change.
- **TECH** — unplanned technical/architectural intervention.

An unplanned item may pause the active story, become a child task, become a technical-enabler story, or reorder the roadmap. Classification depends on impact — do not force every small bug into a new Epic.

Paused work representation (example):

```text
CURRENT.md:
- Active story US-014 temporarily Paused
- TECH-001 In Progress
- Resume target: US-015 after TECH-001 Done
```

Cross-cutting architecture work is tracked as:

1. a technical-enabler user story under a foundation epic, **or**
2. an unplanned TECH item, **or**
3. a task shared by multiple stories — choose by scope; never hide major architecture inside a tiny feature task.

## Agent usage

Before implementing:

1. Read this README.
2. Read [`CURRENT.md`](CURRENT.md).
3. Read the active Epic, User Story, and assigned Task (or Unplanned item).
4. Read relevant ADRs and `docs/business/*`.
5. Follow task scope and acceptance criteria exactly.
6. Update status/result/evidence honestly after validation.
7. Update CURRENT.md when active work changes.
8. Elaborate future story tasks **only** when the story is activated.
9. Report planning conflicts; do not silently rewrite the roadmap.

Role agents (`agents/*`) still apply. Detailed agent handoff order (BA → Architect → Planner → implement → review → QA → release) is preserved in [`WORKFLOW.md`](WORKFLOW.md) as the **agent execution path**, subordinate to this planning hierarchy.

Primary planning role: [`agents/task-planner.md`](../../agents/task-planner.md).

## Prompt patterns (minimal)

```text
Activate US-xxx.
Read its Epic, repository state, ADRs and architecture docs.
Resolve or report open questions, create implementation tasks,
update CURRENT.md, prepare the first Ready task. Do not implement yet.
```

```text
Implement TASK-xxx-nn.
Read its User Story, Epic, ADRs, agents and conventions.
Follow scope and acceptance criteria. Update result and evidence after validation.
```

```text
Register and plan an urgent hotfix for [problem].
Create HOTFIX-xxx, link affected work, update CURRENT.md,
define minimum safe acceptance criteria before implementation.
```

```text
Register this approved unplanned change: [change].
Classify as CHANGE, TECH, task, or new User Story.
Record impact on current work and update the roadmap.
```

```text
Resume US-xxx after completion of TECH-xxx.
Verify dependencies, update statuses and CURRENT.md, identify next Ready task.
```

The repository documents contain the full rules — prompts only reference IDs.

## Relationship to AGENTS.md

This system sits under the Source of Truth Hierarchy in `AGENTS.md`. Task files never invent business behavior; they reference `docs/business/*`, Approved Human Decisions, and Accepted ADRs.

## Templates

- [`templates/EPIC-TEMPLATE.md`](templates/EPIC-TEMPLATE.md)
- [`templates/USER-STORY-TEMPLATE.md`](templates/USER-STORY-TEMPLATE.md)
- [`templates/TASK-TEMPLATE.md`](templates/TASK-TEMPLATE.md)
- [`templates/UNPLANNED-TEMPLATE.md`](templates/UNPLANNED-TEMPLATE.md)

## Superseded material

| Former file | Status |
| --- | --- |
| Pre-2026-07-28 `docs/tasks/README.md` (task-spec philosophy only) | Archived → [`archive/LEGACY-task-specification-README.md`](archive/LEGACY-task-specification-README.md) |
| Old `TASK-TEMPLATE.md` at folder root | Replaced by [`templates/TASK-TEMPLATE.md`](templates/TASK-TEMPLATE.md); archive copy retained |
| Agent handoff phases | Still live as [`WORKFLOW.md`](WORKFLOW.md); archive snapshot also kept |

There must be **one** active roadmap: [`ROADMAP.md`](ROADMAP.md).
