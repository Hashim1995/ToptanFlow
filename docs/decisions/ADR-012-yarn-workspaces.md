# ADR-012: Yarn and Yarn Workspaces

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Yarn is the package manager and Yarn Workspaces is the monorepo workspace solution for TOPTANFLOW. ADR-001 already establishes that TOPTANFLOW is a single monorepo containing independently deployable frontend and backend applications (ADR-002); this ADR selects the concrete tooling that manages dependencies and workspace boundaries across that monorepo, closing one of the "Known Open Decisions" listed in `docs/technical/system-architecture.md` (monorepo package/workspace tooling).

## Decision

- Yarn is the package manager for the TOPTANFLOW monorepo.
- Yarn Workspaces is the workspace mechanism used to manage the `apps/` and `packages/` boundaries described in `docs/technical/repository-structure.md`.
- Dependency consistency is required across the monorepo: shared dependencies are resolved consistently across workspaces rather than duplicated with conflicting versions.
- A single lockfile governs dependency resolution for the entire monorepo; per-workspace lockfiles are not used.

This ADR does not decide the exact Yarn version; that remains a separate implementation detail.

## Consequences

- All dependency installation and workspace linking across `apps/web/`, `apps/api/`, and any approved `packages/` uses Yarn Workspaces.
- A single lockfile is committed at the repository root once dependencies are introduced by an approved implementation task; this ADR itself introduces no dependency and no lockfile.
- Any future task that adds a workspace or a shared package must remain consistent with Yarn Workspaces' resolution model, per `docs/technical/repository-structure.md`.
- This ADR removes "monorepo package/workspace tooling" from the Known Open Decisions in `docs/technical/system-architecture.md`; the exact Yarn version and any workspace-specific configuration remain implementation details for a future task.

## Alternatives Considered

- **npm workspaces:** Rejected. Not the approved technology; introducing npm workspaces instead of Yarn Workspaces would contradict the explicit Approved Human Decision recorded in this ADR.
- **pnpm workspaces:** Rejected. Not the approved technology; introducing pnpm instead of Yarn would contradict the explicit Approved Human Decision recorded in this ADR.
- **Separate repositories with no shared workspace tooling:** Rejected. Conflicts with ADR-001's monorepo decision and would prevent the single-lockfile dependency consistency this ADR requires.
