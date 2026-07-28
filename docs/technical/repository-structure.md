# TOPTANFLOW Repository Structure

> This document defines the intended logical repository structure for TOPTANFLOW. It is a target reference, not a scaffold: no directories, applications, packages, or configuration files are created by this document. It implements ADR-001 (monorepo) and ADR-002 (independent frontend/backend applications) at the structural level, and it does not resolve any Open Decision listed in `docs/technical/system-architecture.md`.

## Purpose

To give every agent and human a single, consistent, logical reference for where different kinds of content belong in the TOPTANFLOW monorepo, so that future structural decisions are made consistently once implementation begins.

## Structural Principles

- The repository is a single monorepo (ADR-001), containing independently deployable frontend and backend applications (ADR-002).
- Structure follows business and application boundaries, not arbitrary technical convenience, consistent with `AGENTS.md` ("Coding Principles").
- Documentation, business knowledge, technical decisions, and repository-owned task management remain under `docs/`, already established by prior tasks (`docs/business/`, `docs/analysis/`, `docs/decisions/`, `docs/technical/`, `docs/tasks/` — see `docs/tasks/README.md`).
- Agent role instructions remain under `agents/`, already established.
- This document does not introduce, rename, or move any existing file or directory.

## Proposed Top-Level Structure

```
/
├── apps/
│   ├── web/
│   └── api/
├── packages/
├── docs/
├── agents/
└── AGENTS.md
```

This is a **logical target structure**, describing where future application code will live once an implementation task creates it — it is not application scaffolding, and no part of it is created by this document.

## Application Boundaries

- `apps/web/` is intended to contain the React/TypeScript frontend application (ADR-006), including its Ant Design UI (ADR-009), Axios usage (ADR-010), and Redux Toolkit usage where applicable (ADR-011).
- `apps/api/` is intended to contain the NestJS/TypeScript backend application (ADR-007), organized around business-capability module boundaries (`docs/business/workflow-map.md`).
- `apps/web/` and `apps/api/` remain independently buildable and deployable, per ADR-002; neither directory's internal structure is decided by this document.

## Shared Package Rules

- `packages/` may contain approved shared technical contracts (e.g., shared type definitions) or shared configuration, when and if such sharing is explicitly approved.
- `packages/` must never become a place for duplicated or client-authoritative business logic; any business rule remains authoritative in `apps/api/`, per ADR-002 and ADR-003.
- A new package must not be created speculatively; it is created only when an approved task explicitly requires shared code between `apps/web/` and `apps/api/`.

## Documentation Boundaries

- `docs/` remains the source for business analysis (`docs/analysis/`), business knowledge (`docs/business/`), technical documents (`docs/technical/`), architecture decisions (`docs/decisions/`), and task management (`docs/tasks/`).
- Application code must not duplicate the content of these documents; it implements what they specify and references them where traceability is needed (e.g., in code comments citing a task ID), consistent with `AGENTS.md`.

## Dependency Direction

- `apps/web/` may depend on `packages/` (approved shared contracts/config) and communicates with `apps/api/` only through its defined HTTP interface (ADR-002, ADR-010) — never through direct code-level or database-level access.
- `apps/api/` may depend on `packages/` (approved shared contracts/config) and owns its own data-access layer to PostgreSQL (ADR-008).
- `packages/` must not depend on `apps/web/` or `apps/api/`; dependency direction flows from applications to shared packages, never the reverse.

## Naming Principles

- Directory and package names should reflect business or application purpose (e.g., `apps/web`, `apps/api`), not implementation trivia.
- Exact internal folder naming within `apps/web/` and `apps/api/` (e.g., feature-based vs. layer-based organization) is not decided by this document.

## Generated Files

- Build output, dependency directories, and any other generated artifacts must not be committed to the repository.
- Exact generated-output locations depend on tooling not yet selected (see "Future Structure Decisions").

## Environment and Secrets

- Environment files and secrets must never be committed to the repository, consistent with general secret-handling expectations for a business-critical system.
- Exact environment-variable management strategy is an implementation detail for a future, separately approved task.

## Test Locations

- Tests are expected to live alongside or within the application they test (`apps/web/`, `apps/api/`), consistent with each application's own testing framework once selected.
- Exact test directory conventions are not decided by this document (see "Future Structure Decisions").

## Migration Locations

- Database migrations are expected to live within `apps/api/`, associated with the backend application that owns the authoritative data model (ADR-003, ADR-007, ADR-008).
- Exact migration tooling and directory convention are not decided by this document (see "Future Structure Decisions").

## Future Structure Decisions

The following remain unresolved and are not decided by this document; they require an explicit Approved Human Decision or a dedicated technical task before implementation, consistent with `docs/technical/system-architecture.md` ("Known Open Decisions"):

- Exact package manager and workspace tooling for the monorepo.
- Exact internal folders inside `apps/web/` and `apps/api/`.
- ORM/database-access layer placement.
- Test directory and framework conventions.
- Migration tooling and directory convention.
- Any additional `packages/` beyond what an approved task explicitly requires.

Speculative package or directory creation ahead of an approved need is not permitted, per `AGENTS.md` ("Scope Rules").
