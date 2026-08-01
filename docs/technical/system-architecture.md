# TOPTANFLOW System Architecture

> This document describes TOPTANFLOW's architecture at a high level only. It implements and references `AGENTS.md` and all Accepted ADRs (`docs/decisions/`); it does not restate business rules already recorded in `docs/business/invariants.md`, `docs/business/terminology.md`, or `docs/business/workflow-map.md`, and it does not resolve any Open Decision. Where this document and an Accepted ADR appear to differ, the ADR governs.

## Purpose

To give every agent and human a single, high-level reference for how TOPTANFLOW's approved technologies (ADR-001 through ADR-011) fit together, so that architectural boundaries are understood consistently before any task is planned or implemented.

## Architecture Principles

- The backend is the authoritative source of business behavior (ADR-003); the frontend and database support that authority, they do not share or replace it.
- Posted business facts are immutable; corrections happen through new, linked actions (ADR-004).
- Frontend and backend are independently deployable applications inside one monorepo (ADR-001, ADR-002).
- The UI is Azerbaijani-first, mobile-first, and fully responsive (ADR-005).
- Every approved technology choice (React/TypeScript, NestJS/TypeScript, PostgreSQL, Ant Design, Axios, Redux Toolkit — ADR-006 through ADR-011) is a means of implementing these principles, never a justification for weakening them.

## System Context

TOPTANFLOW is a business-critical ERP system covering products (including product quantity), cash, business partner debt balance, and (deferred) field sales (Yatı), per `AGENTS.md` and `docs/analysis/01-document-analysis.md`. There is no separate Warehouse or Stock module; sellable goods quantity lives on Product (`currentQuantity` + quantity history) per ADR-029. Partner debt is one signed AZN balance per ADR-030; Currency is not an active current-domain module (reserved for future Cash per ADR-031). It consists of a browser-based frontend application and a backend API, backed by a single primary relational database, operated as a monorepo (ADR-001).

## Applications

- **Frontend application** — a React/TypeScript single-page application (ADR-006), styled and componentized with Ant Design (ADR-009), communicating with the backend over HTTP via Axios (ADR-010), using Redux Toolkit only where genuinely shared client state is required (ADR-011).
- **Backend application** — a NestJS/TypeScript API (ADR-007), organized around business-capability module boundaries, authoritative for validation, calculation, permissions, and business effects (ADR-003).
- **Database** — PostgreSQL (ADR-008), the primary transactional store for authoritative operational data.

## Frontend Responsibilities

- Present business workflows (`docs/business/workflow-map.md`) using canonical terminology (`docs/business/terminology.md`), in Azerbaijani (ADR-005).
- Collect and validate user input for usability only; such validation is a convenience, never authoritative (ADR-002, ADR-003).
- Map backend-confirmed states, statuses, and errors to clear Azerbaijani display content (`docs/technical/ui-requirements.md`).
- Remain fully responsive and usable across all supported viewport categories (ADR-005).
- Hold no authoritative business data; any locally held state is either UI/session state (Redux Toolkit, ADR-011) or a display cache of backend-confirmed data.

## Backend Responsibilities

- Own all authoritative validation, calculation, permission enforcement, workflow-state transitions, and business effects (ADR-003, ADR-007).
- Enforce posted-fact immutability and correction-via-new-linked-action (ADR-004).
- Organize modules by business capability (`docs/business/workflow-map.md`), not arbitrary technical grouping (ADR-007).
- Return deterministic, mappable results (including errors) that the frontend can present, without depending on the frontend to complete any business decision.

## Database Responsibilities

- Provide durable, transactional, concurrency-safe storage for authoritative operational data (ADR-008).
- Enforce relational integrity, precise numeric storage, and constraints that support — but do not independently invent — business rules; the business decision is made by the backend, the database enforces the resulting data shape (ADR-003, ADR-008).
- Preserve immutable posted history and support correction links (ADR-004, ADR-008).
- Must not encode undocumented business logic in hidden triggers or stored procedures (ADR-008).

## Responsibility Boundaries

- Frontend ⇄ Backend: defined by ADR-002 — the frontend never owns business logic; the backend never trusts frontend-supplied totals or permission decisions.
- Backend ⇄ Database: the backend is the business-decision authority (ADR-003); the database is the durability and integrity layer (ADR-008). The database does not decide business behavior independently of the backend.
- Every boundary crossing (frontend→backend, backend→database) is presentation/transport only with respect to business meaning; the business meaning itself is decided once, in the backend.

## Business Module Boundaries

Business module boundaries follow the business capabilities already mapped in `docs/analysis/01-document-analysis.md` (Section 3, "Business Modules") and `docs/business/workflow-map.md`, aligned with ADR-029 / ADR-030 / ADR-031 for active modules (e.g., Users, Business Partners including signed Debt Balance, Products including product quantity, Sales, Purchasing, Costing, Cash, Expenses, Fixed Assets, Audit, Reporting). A separate Warehouse / Inventory / Stock module is **not** an active boundary (ADR-029 supersedes ADR-026). A separate Currency reference module is **not** an active boundary in current domains (ADR-031 — Currency reserved for future Cash). Separate Receivables & Payables primary ledgers are **not** the active boundary; use Business Partner Debt Balance (ADR-030). Field Sales/Yatı remains deferred pending redesign without multi-location stock. Backend module structure (ADR-007) and any future package structure (`docs/technical/repository-structure.md`) must reflect these boundaries, not an arbitrary technical layering.

## Request and Response Flow

1. The frontend collects user input and sends a request via Axios (ADR-010) to the backend.
2. The backend authenticates, authorizes, validates, and applies business rules (ADR-003, ADR-007).
3. The backend persists any resulting authoritative effect in PostgreSQL within a transaction (ADR-008).
4. The backend returns a deterministic result (success or a classified error) to the frontend.
5. The frontend maps that result to an Azerbaijani, responsive presentation (ADR-005, `docs/technical/ui-requirements.md`).

## Authoritative Data Flow

All business-authoritative data (totals, balances, statuses, permissions, calculated values) originates from and is confirmed by the backend. Any value held in frontend state (component state or Redux Toolkit, ADR-011) that mirrors backend data is a display cache, not a source of truth; a stale or locally computed value never overrides a fresh backend response.

## Posting and Transaction Flow

A posted business action must create all of its related effects atomically, within a single backend-managed transaction (ADR-003, ADR-004, ADR-008), or none of them; there is no partially posted state visible to the rest of the system. Draft or provisional states have no ledger effect until posting occurs, per `docs/business/invariants.md` ("Global Invariants").

## Correction and Reversal Flow

Once posted, a business fact is not edited or deleted in place (ADR-004). A correction (reversal, cancellation, return, reallocation, or adjustment, as defined in `docs/business/terminology.md` and `docs/business/workflow-map.md`) is implemented as a new record, linked to the original, that is itself subject to the same authoritative backend rules and atomic posting behavior.

## Authentication and Authorization Boundary

Authentication and authorization decisions are enforced by the backend (ADR-003, ADR-007, ADR-025); the frontend may hide or disable UI affordances for a user without permission, as a usability convenience only (ADR-002, `docs/technical/ui-requirements.md`), but this UI-level hiding is never a security control. For v1, ADR-025 defines JWT authentication and flat equal active users (no role packages).

## Audit Boundary

Audit-relevant actions are recorded by the backend as part of the same transaction that produces the business effect being audited, consistent with ADR-004 and the "Audit" module in `docs/business/invariants.md` and `docs/business/workflow-map.md`. The database (ADR-008) must support this durably and without allowing after-the-fact alteration of the audit record itself.

## Shared Contracts

Any shared technical contract between frontend and backend (e.g., shared type definitions) may describe the shape of a request or response, but must never become a second source of business truth: the backend's runtime validation and calculation remain authoritative even if a shared contract exists, per ADR-002 and ADR-003. Exact contract-sharing/generation mechanics are not decided by this document (see "Known Open Decisions").

## Error Handling Boundary

The backend classifies and returns errors (validation, permission, conflict, technical) deterministically (ADR-003, ADR-007). The frontend, using Axios for transport (ADR-010), maps these to Azerbaijani, user-facing messages (ADR-005, `docs/technical/ui-requirements.md`) without altering their underlying meaning, and never displays a raw backend error or technical identifier directly to a user.

## Localization Boundary

Azerbaijani is the default and required language for all user-facing content; internal technical identifiers (source-code identifiers, API property names, database names, enum keys) are not required to be translated and must never leak into user-facing content without an Azerbaijani display label, per ADR-005 and `docs/technical/ui-requirements.md`. Ant Design's default locale/text (ADR-009) is subject to this same boundary and must not be the source of unintended English leakage.

## Responsive UI Boundary

Every business action, status, total, and correction option available at one supported viewport category (mobile, tablet, laptop/desktop, large desktop) must remain available at every other supported category, per ADR-005 and `docs/technical/ui-requirements.md`. Responsive transformations are presentation-only and must never change a business value, calculation, permission, or workflow state.

## Deployment Independence

The frontend and backend are independently buildable and deployable applications within the monorepo (ADR-001, ADR-002, ADR-006, ADR-007). Neither application's deployment lifecycle is coupled to the other's internal implementation details; they interact only through the defined backend interface. Exact deployment providers and topology are not decided by this document (see "Known Open Decisions").

## Known Open Decisions

The following technical decisions remain unresolved and are not decided by this document, any ADR referenced here, or any prior task. They must not be implemented using a "reasonable default"; each requires an explicit Approved Human Decision before implementation, per `AGENTS.md` ("Open Decisions"):

- OpenAPI contract-generation tooling (e.g., automatic client generation) — the API style itself is resolved by ADR-015.
- UUID version and column storage representation — the identifier strategy itself is resolved by ADR-020. Human-readable Product and BusinessPartner business codes are a separate concern resolved by ADR-024 (backend-generated sequential codes via internal `NumberSequence`); they are not technical primary identifiers.
- Exact migration workflow/process (branching, review, deployment order) — the migration tool itself is resolved by ADR-021.
- Logging and monitoring approach.
- Deployment providers.
- File storage approach.
- Backup and restore strategy.
- Offline support details.

The following items are now resolved by Accepted ADRs and are no longer Open Decisions: monorepo package/workspace tooling (ADR-012, Yarn/Yarn Workspaces), frontend build tooling (ADR-013, Vite), ORM/database access strategy (ADR-014, Prisma), API style (ADR-015, REST with OpenAPI), server-state strategy (ADR-016, TanStack Query), frontend validation library (ADR-017, Zod with React Hook Form), testing frameworks (ADR-018, Vitest/Jest/Supertest), primary identifier strategy (ADR-020, UUID), migration tooling (ADR-021, Prisma Migrate), and **v1 authentication/authorization** (ADR-025: JWT + Argon2id, 24h access / 30d refresh, single-company, flat equal active users).

## Architecture Stop Conditions

An agent using this document must stop and request clarification when:

- A task requires resolving one of the Known Open Decisions above as a prerequisite to proceeding.
- A task's technical approach would require deviating from ADR-001 through ADR-025.
- A proposed shared contract would become authoritative over backend validation or calculation.
- A responsive or localization requirement cannot be satisfied without a design decision not yet approved.
