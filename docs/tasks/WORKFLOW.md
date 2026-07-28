# Agent execution workflow (handoff path)

> This document defines the **agent responsibility flow** for executing an already-specified task.
> Planning hierarchy, IDs, roadmap, and current state live in [`README.md`](README.md), [`ROADMAP.md`](ROADMAP.md), and [`CURRENT.md`](CURRENT.md).
> Role authority remains in `agents/*` and is referenced here, not duplicated.

## When to use this document

Use this after a User Story has been activated and its `TASK-*` files exist (or for an approved unplanned item with acceptance criteria).

Do **not** use this document as a second roadmap.

## Responsibility flow

```
Business Analyst
   ↓
Solution Architect        (when needed)
   ↓
Task Planner              (activates story / creates TASK-* files)
   ↓
Database Engineer         (when needed)
   ↓
Backend Engineer
   ↓
Frontend Engineer         (when needed)
   ↓
Code Reviewer
   ↓
QA Engineer
   ↓
Git Release
```

This is a responsibility order, not a mandate to invoke every agent on every task. Skip roles the task does not need; never invert the order of needed roles.

## Mapping to planning statuses

| Planning status (`README.md`) | Typical agent phase |
| --- | --- |
| Draft / Planned | BA / Architect / Planner clarification |
| Ready | Approved for implementation |
| In Progress | Database / Backend / Frontend implementation |
| Review | Code Reviewer + QA |
| Done | Git Release recorded; evidence filled |
| Blocked | Stop; document blocker on the task/story |

The older granular labels (In QA, Ready for Release) are **not** separate planning statuses. Record review/QA outcomes in the task’s Evidence/Result sections while status is Review, then move to Done.

## UI tasks

Per ADR-005 and `docs/technical/ui-requirements.md`: every UI task must name Azerbaijani content requirements and viewport categories. “Make it responsive” alone is insufficient.

## Recording unrelated discoveries

Any agent that finds an issue outside scope must report it (per `AGENTS.md` Scope Rules), not fix it. Prefer registering a BUG/CHANGE/TECH item or a backlog note for the Task Planner.

## Historical snapshot

A pre-consolidation copy of the longer phase narrative is preserved at [`archive/LEGACY-agent-handoff-WORKFLOW.md`](archive/LEGACY-agent-handoff-WORKFLOW.md).
