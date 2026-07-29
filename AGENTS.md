# AGENTS.md — TOPTANFLOW Repository Constitution

## Purpose

This document defines how every AI agent — human-directed or autonomous — must operate inside the TOPTANFLOW repository. TOPTANFLOW is a business-critical ERP system covering inventory, cash, receivables/payables, and field sales (Yatı) for a real operating business. Mistakes here are not cosmetic: they can misstate stock, money, or debt.

AGENTS.md does not describe *what* the system does. It describes *how any agent must think, decide, and act* before, during, and after touching this repository. It is implementation-independent and outlives any particular framework, language, or architecture chosen later.

Every agent must read and follow this document before performing any task in this repository, regardless of the size of the task.

## Cursor Project Rules

Cursor rules under [`.cursor/rules/`](.cursor/rules/) are **mandatory** for every agent and every new chat (`alwaysApply: true`). They do not replace this constitution; they operationalize session behavior:

- **Repository context** is loaded progressively (start here, then task docs and scope-relevant sources only) — see `repository-context.mdc`.
- **Repository work** (analysis, planning, implementation, technical writing) is performed in **English**; Azerbaijani user-facing UI remains as required by ADR-005 — see `response-language.mdc`.
- **Every final response** ends with a short Azerbaijani summary; when repository files changed, a Conventional Commit recommendation is the last section — see `response-language.mdc` and `commit-recommendation.mdc`.

## Project Philosophy

- **Business-first.** The business reality described in the Business Requirements Document (BRD) always outranks technical convenience.
- **Documentation-first.** No business behavior is implemented before it is written down, approved, and traceable to a source document.
- **Correctness over speed.** A slower, correct change is always preferred over a fast, ambiguous one.
- **Small incremental changes.** Prefer the smallest change that fully and correctly completes the current task.
- **One completed task at a time.** Do not batch unrelated tasks, do not partially finish several things at once.
- **Traceability over memory.** Every important decision must be traceable to a document and a section, not to an agent's inferred understanding.
- **Silence is not agreement.** An unresolved question is not a "probably yes."

## Source of Truth Hierarchy

When sources disagree, or when a task requires information, the following priority order applies. A lower-priority source may never override a higher-priority one; it may only fill gaps the higher-priority source leaves open.

```
Business Requirements Document (BRD)
        ↓
Approved Human Decisions (explicit sign-off, not a "safe default")
        ↓
Business Knowledge Documents
   (docs/business/invariants.md, docs/business/terminology.md,
    docs/business/workflow-map.md)
        ↓
Technical Specification (SRS/TDS) — authoritative for implementation
 approach only, never for business behavior
 ↓
Task Management (`docs/tasks/`) — roadmap, epics, user stories,
 implementation tasks, and unplanned work; never invents business behavior
 ↓
The Current Task Instructions
 ↓
Implementation (code, schema, configuration)
```

Notes on this hierarchy:

- `docs/analysis/01-document-analysis.md` is the reconciliation record between the BRD and the SRS/TDS. It does not sit above either source; it explains how they align, where they conflict, and what remains undecided. Agents must consult it to understand alignment status and known conflicts before acting.
- The SRS/TDS is authoritative only for *how* something is built once the business behavior it builds is already approved. It is never authoritative for *what* the business behavior is.
- A "recommendation" or "safe default" found in any document is not an approved decision. It becomes usable only after it is confirmed as an Approved Human Decision.

## Task Management

Repository-owned planning lives under [`docs/tasks/`](docs/tasks/README.md). It is the source of truth for roadmap, epics, user stories, implementation tasks, dependencies, current/blocked/completed work, hotfixes, and unplanned changes.

Before implementing, agents must:

1. Read [`docs/tasks/README.md`](docs/tasks/README.md) and [`docs/tasks/CURRENT.md`](docs/tasks/CURRENT.md).
2. Read the active Epic, User Story, and assigned Task (or Unplanned item) by ID.
3. Follow that item’s scope and acceptance criteria; update status, evidence, and `CURRENT.md` honestly when active work changes.
4. Elaborate detailed tasks for a future story **only when that story is activated** (progressive elaboration).
5. Report planning conflicts instead of silently rewriting the roadmap.

Canonical ownership and prompt patterns are defined in `docs/tasks/README.md`. Do not invent a parallel tracker.

## AI Operating Principles

Before making any change, an agent must:

1. **Identify the business behavior involved.** Locate the relevant rule(s) in `docs/business/invariants.md`, the relevant term(s) in `docs/business/terminology.md`, and the relevant workflow(s) in `docs/business/workflow-map.md`.
2. **Check alignment status.** Consult `docs/analysis/01-document-analysis.md` for whether this area is Covered, Partially covered, Not covered, a Conflict, or an Open Decision.
3. **Consult task management.** Identify the Epic / User Story / Task (or Unplanned item) that authorizes the change via `docs/tasks/CURRENT.md` and the linked files.
4. **Reason before acting.** State, even briefly, which business rule and which source justify the intended change. If no rule justifies it, do not invent one.
5. **Prefer the narrowest correct action.** Do not expand the task to "while I'm here" improvements.
6. **Verify against invariants after the change.** A change that appears to satisfy the task but violates a stated invariant is not acceptable, regardless of how it was requested.
7. **Never resolve ambiguity by guessing.** If two valid interpretations exist, treat the situation as an Open Decision and stop.

## Business Invariants

All confirmed business truths are maintained in [`docs/business/invariants.md`](docs/business/invariants.md), grouped by module. This document does not restate them.

- No implementation, refactor, migration, or configuration change may violate any invariant listed there.
- If a task appears to require violating an invariant, the task is wrong, not the invariant. Stop and ask for clarification instead of adjusting the invariant to fit the task.
- If new business behavior is discovered during a task that is not yet captured as an invariant, do not silently add it to the implementation. Surface it for review before relying on it.

## Open Decisions

Open decisions and unresolved conflicts are tracked in `docs/analysis/01-document-analysis.md` (Sections 9 and 10) and summarized in the "Excluded as Open Decisions or Unresolved Conflicts" note at the end of `docs/business/invariants.md`.

- An open decision must never be implemented automatically using a "reasonable default," a "common industry practice," or a value inferred from the SRS/TDS alone.
- If a task depends on an open decision, the agent must stop and request a human decision before proceeding with that part of the task.
- An agent must never mark an open decision as resolved on its own authority. Only an explicit, recorded human decision resolves it.

## File Modification Policy

An agent **may create** a file when:
- A task explicitly requires a new file, and no existing file already serves that purpose.
- The new file's scope is clearly limited to what the task requires.

An agent **may modify** a file when:
- The change is within the explicit scope of the current task.
- The change does not contradict any Business Invariant or introduce a resolution to an Open Decision.
- The change preserves the intent and structure of documents it depends on.

An agent **must refuse to modify** a file when:
- The requested change would violate a stated invariant.
- The requested change would silently resolve a documented conflict or open decision.
- The requested change is outside the scope of the current task.
- The requested change would alter or duplicate the content of a knowledge document (`docs/analysis/`, `docs/business/`) instead of referencing it.
- The task instructions explicitly restrict which files may be created or touched, and the change falls outside that list.

When refusing, the agent must state which rule blocks the change and what is needed to unblock it (e.g., a human decision, a missing business rule, or a scope clarification).

## Scope Rules

An AI agent must never, as part of an unrelated task:

- Solve unrelated issues it happens to notice.
- Refactor unrelated code, even if the refactor seems beneficial.
- Rename unrelated symbols, files, or identifiers.
- Optimize anything outside the explicit scope of the current task.
- Introduce new architecture, patterns, dependencies, or frameworks not requested.
- Reorganize documentation or folder structure beyond what the task requires.

If an unrelated issue is discovered, it must be reported, not silently fixed.

## Coding Principles

These are high-level and framework-independent. They apply to any technology chosen later.

- **Simplicity.** The simplest correct solution is preferred over a clever one.
- **Readability.** Code should be understandable by a future agent or human without needing external context.
- **Deterministic behavior.** The same input and the same business state must always produce the same outcome. Hidden randomness or environment-dependent behavior in business logic is not acceptable.
- **Explicit business logic.** Business rules must be visible and traceable in the code, not implied, hidden in configuration, or scattered without reference to their source rule.
- **Backend as source of truth.** Business-critical validation, calculation, and decision logic is authoritative on the backend; a client-side or presentation-layer check is a convenience, never a guarantee.
- **Immutability of posted facts.** Once something is posted, it is corrected through a new, linked action, never edited or deleted in place, matching the invariant documents.
- **No hidden coupling.** A change in one business area must not silently change the behavior of an unrelated business area.

This section deliberately excludes framework-, language-, and library-specific rules; those belong in technical documentation, not in this constitution.

Approved technology choices are recorded as Accepted ADRs and must be followed by every implementation agent: [`ADR-006`](docs/decisions/ADR-006-react-typescript-frontend.md) (React/TypeScript frontend), [`ADR-007`](docs/decisions/ADR-007-nestjs-typescript-backend.md) (NestJS/TypeScript backend), [`ADR-008`](docs/decisions/ADR-008-postgresql-primary-database.md) (PostgreSQL), [`ADR-009`](docs/decisions/ADR-009-ant-design-ui-library.md) (Ant Design), [`ADR-010`](docs/decisions/ADR-010-axios-http-client.md) (Axios), [`ADR-011`](docs/decisions/ADR-011-redux-toolkit-client-state.md) (Redux Toolkit), [`ADR-012`](docs/decisions/ADR-012-yarn-workspaces.md) (Yarn/Yarn Workspaces), [`ADR-013`](docs/decisions/ADR-013-vite-build-system.md) (Vite), [`ADR-014`](docs/decisions/ADR-014-prisma-orm.md) (Prisma ORM), [`ADR-015`](docs/decisions/ADR-015-rest-openapi.md) (REST/OpenAPI), [`ADR-016`](docs/decisions/ADR-016-tanstack-query.md) (TanStack Query), [`ADR-017`](docs/decisions/ADR-017-react-hook-form-zod.md) (React Hook Form/Zod), [`ADR-018`](docs/decisions/ADR-018-testing-strategy.md) (Vitest/Jest/Supertest), [`ADR-019`](docs/decisions/ADR-019-eslint-prettier.md) (ESLint/Prettier), [`ADR-020`](docs/decisions/ADR-020-uuid-identifiers.md) (UUID identifiers), [`ADR-021`](docs/decisions/ADR-021-prisma-migrate.md) (Prisma Migrate), [`ADR-023`](docs/decisions/ADR-023-postgresql-decimal-precision.md) (PostgreSQL decimal precision), [`ADR-024`](docs/decisions/ADR-024-automatic-business-code-generation.md) (automatic Product/BusinessPartner business codes), and [`ADR-025`](docs/decisions/ADR-025-jwt-auth-flat-users-v1.md) (JWT auth, flat equal users v1). High-level architecture and logical repository structure are described in [`docs/technical/system-architecture.md`](docs/technical/system-architecture.md) and [`docs/technical/repository-structure.md`](docs/technical/repository-structure.md), which these ADRs do not duplicate.

## User Interface Principles

TOPTANFLOW's user interface is governed by an Accepted, repository-wide decision: [`docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md`](docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md), with detailed implementation-level rules in [`docs/technical/ui-requirements.md`](docs/technical/ui-requirements.md). This section states the principle; it does not restate either document.

- **Azerbaijani-first.** The user-facing interface is Azerbaijani by default; user-facing content is not mixed with other languages.
- **Mobile-first, fully responsive.** The application is designed mobile-first, but mobile-first is an implementation priority, not a device limitation — it must remain a fully usable, responsive web application on mobile, tablet, laptop, desktop, and large desktop screens.
- **No internal technical identifiers exposed to users.** Enum keys, permission keys, API field names, database names, and internal status codes are never shown directly; they are always presented behind an Azerbaijani display label.
- **Canonical terminology only.** Every business term shown in the UI must remain consistent with `docs/business/terminology.md`; the UI does not introduce a parallel or inconsistent vocabulary.
- **Responsive layouts preserve business functionality.** No business action, status, total, or correction option may be lost or made unreachable purely because of screen size.
- **Stop when a term is missing.** An agent must stop and request clarification when a required Azerbaijani business term is missing or ambiguous, rather than inventing one, consistent with the "Stop Conditions" below.

## Review Principles

When reviewing code (its own or another agent's/human's), an agent must check, in order:

1. **Business correctness** — Does the change match an invariant, workflow, or approved decision? Cite the source.
2. **Scope correctness** — Does the change touch only what the task required?
3. **Traceability** — Can every non-trivial decision in the change be traced to a document, an approved decision, or the task itself?
4. **Consistency** — Does the change use terminology consistent with `docs/business/terminology.md`?
5. **Reversibility** — Can the change be safely corrected later without violating immutability/audit invariants?
6. **Silence on the rest** — A review must not introduce commentary on unrelated code quality unless explicitly asked.

A review that cannot confirm business correctness must say so explicitly rather than approving by default.

## Definition of Done

A task is complete only when all of the following are true:

- The task's explicit requirements are fully satisfied — no more, no less.
- No stated Business Invariant has been violated.
- No Open Decision has been silently resolved.
- No unrelated file, symbol, or behavior has been changed.
- Every new or changed business-relevant behavior is traceable to a source document or an approved decision.
- The change is the smallest one that correctly satisfies the task.
- For a user-facing task specifically: the required Azerbaijani UI content is present, responsive behavior has been verified at the relevant viewport categories, and no internal technical text leaks into the UI, per `docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md` and `docs/technical/ui-requirements.md`.

A task that is "mostly done" or "done except for one edge case" is not done.

## Stop Conditions

An agent must stop and explicitly ask for clarification — rather than proceed, guess, or apply a default — whenever:

- A business rule needed for the task is missing from the knowledge documents.
- The BRD and the SRS/TDS conflict on the behavior the task depends on.
- The task touches an area listed as an Open Decision.
- The requested change would violate a documented invariant.
- Two knowledge documents (analysis, invariants, terminology, workflow map) appear inconsistent with each other.
- The task itself is ambiguous enough that two reasonable, materially different implementations exist.

Stopping is a valid and expected outcome. It is preferred over producing an incorrect or unapproved result.

## Communication Style

All agent responses in this repository must be:

- **Concise.** State only what is necessary to understand the decision or the block.
- **Explicit.** Name the exact rule, document, and section involved.
- **Deterministic.** Given the same state and the same task, the response should reach the same conclusion.

Agents must not:

- Speculate about business intent that is not documented.
- Assume an unstated default is acceptable.
- Invent a requirement, rule, or business term not found in the knowledge documents.

---

## Rules Governing This Document

- This is a Markdown-only document.
- It does not duplicate the content of `docs/analysis/01-document-analysis.md`, `docs/business/invariants.md`, `docs/business/terminology.md`, or `docs/business/workflow-map.md`. It references them.
- It applies repository-wide, to every agent, on every task, regardless of which part of the repository is touched.
- It is implementation-independent: it must remain valid regardless of the specific frontend, backend, database, or deployment technology eventually chosen.
