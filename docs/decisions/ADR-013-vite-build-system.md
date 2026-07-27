# ADR-013: Vite Build System

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Vite is the build tool for the React/TypeScript frontend (ADR-006). This closes the "frontend build tooling" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It does not change the frontend's responsibilities or authority boundaries already established by ADR-002, ADR-003, ADR-005, ADR-006, or ADR-009.

## Decision

- Vite powers the React/TypeScript frontend application (`apps/web/`, per `docs/technical/repository-structure.md`).
- Vite is used to provide fast local development (rapid startup, hot module replacement) and fast production builds for the frontend.
- Vite is a build-tooling choice only; it grants no authority over business logic, validation, or calculations, which remain backend-authoritative per ADR-003.

This ADR does not define the specific Vite plugin set; plugin selection remains a separate, future implementation detail.

## Consequences

- The frontend application is built and served in development using Vite.
- Any future task introducing a Vite plugin (e.g., for TypeScript path aliases, environment handling, or asset processing) must remain consistent with this ADR and does not require a new ADR unless it introduces a material architectural change.
- This ADR removes "frontend build tooling" from the Known Open Decisions in `docs/technical/system-architecture.md`.

## Alternatives Considered

- **Webpack:** Rejected. Not the approved technology; introducing Webpack instead of Vite would contradict the explicit Approved Human Decision recorded in this ADR.
- **Create React App (or equivalent bundled toolchains):** Rejected. Not the approved technology, and largely unmaintained relative to the fast development/build requirement this ADR records.
- **No build tool (manual bundling):** Rejected. Does not meet the fast development and fast production build requirements this ADR requires for a business-critical ERP frontend.
