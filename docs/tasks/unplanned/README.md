# Unplanned work

Urgent, discovered, or architectural interruptions must not require rewriting the whole roadmap.

## Types

| Type | Use when |
| --- | --- |
| **BUG** | Confirmed defect in expected behavior. |
| **HOTFIX** | Urgent production or delivery-critical correction. |
| **CHANGE** | Approved unplanned scope change. |
| **TECH** | Unplanned technical or architectural intervention. |

Template: [`../templates/UNPLANNED-TEMPLATE.md`](../templates/UNPLANNED-TEMPLATE.md).

## Workflow

1. Create `docs/tasks/unplanned/<TYPE>-NNN-short-title.md` with a new unused ID.
2. Link affected epics/stories/tasks.
3. Decide impact classification:
   - pause active story and set CURRENT.md resume target, **or**
   - attach as a task under the active story, **or**
   - promote to a technical-enabler user story, **or**
   - reorder roadmap dependencies.
4. Update [`../CURRENT.md`](../CURRENT.md) and [`../CHANGELOG.md`](../CHANGELOG.md).
5. Implement only after minimum safe acceptance criteria exist.
6. On completion: mark Done with evidence; resume paused work explicitly.

## Cross-cutting architecture

Prefer TECH (or a foundation technical-enabler story) when multiple modules/APIs/migrations are affected. Record:

- affected modules, APIs, docs, migrations
- backward compatibility
- dependency impact
- reason for interruption
- resume point for paused work

Example in this repository: [`TECH-001-automatic-business-code-generation.md`](TECH-001-automatic-business-code-generation.md).

## Do not

- Force every small bug into a new Epic.
- Hide major architectural work inside an unrelated feature task.
- Delete cancelled interruption records.
