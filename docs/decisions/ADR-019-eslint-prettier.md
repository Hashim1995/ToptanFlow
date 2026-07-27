# ADR-019: ESLint and Prettier

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: ESLint is used for linting and Prettier is used for code formatting across the TOPTANFLOW monorepo (ADR-001, ADR-012). This is a code-quality tooling decision; it does not affect business behavior, authority boundaries, or any other Accepted ADR.

## Decision

- ESLint is used for linting TypeScript code across `apps/web/`, `apps/api/`, and any approved shared `packages/`.
- Prettier is used for consistent code formatting across the same scope.
- Formatting and linting are applied consistently across the monorepo rather than per-application, consistent with the single-lockfile, dependency-consistency principle in ADR-012.

This ADR does not customize a specific style guide, rule set, or formatting configuration; those remain separate, future implementation details.

## Consequences

- All new TypeScript code across the monorepo is expected to pass the agreed ESLint rules and Prettier formatting once configured by an approved implementation task.
- This ADR does not itself introduce any configuration file; exact rule sets and formatting options are configured by a future, separately approved task.
- Readability and consistency review (`agents/code-reviewer.md`, "Readability and maintainability") may reference ESLint/Prettier compliance as a baseline once configured, without replacing the reviewer's business-correctness review order.

## Alternatives Considered

- **No linting or formatting tooling:** Rejected. Increases inconsistency and review burden across a multi-agent, multi-contributor codebase.
- **A different linter (e.g., a custom or alternative tool) or formatter (e.g., dprint):** Rejected. Not the approved technology; introducing a different tool instead of ESLint/Prettier would contradict the explicit Approved Human Decision recorded in this ADR.
- **Heavily customized style-guide rules from the start:** Rejected. This ADR explicitly does not decide style-guide customization; a heavily customized rule set is a future, separate decision, not an assumption of this ADR.
