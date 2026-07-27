# ADR-001: Use a Monorepo for TOPTANFLOW

## Status

Accepted

## Context

TOPTANFLOW consists of a frontend application, a backend API, and shared knowledge that both must agree on: business terminology, business invariants, workflow definitions, and API-level contracts describing the same underlying business events (sales, purchases, inventory, cash, settlement, and Field Sales/Yatı).

Per `docs/analysis/01-document-analysis.md`, the Software Requirements & Technical Specification identifies a monorepo as the base repository structure for this project [SRS §2 — "Technology Baseline"], and the analysis identifies "Monorepo Scaffolding" as a distinct readiness milestone that depends on prior business and technical decisions being resolved first (Section 15.4, "Monorepo Scaffolding — Ready after decisions").

The business itself (per `docs/analysis/01-document-analysis.md`, Section 1, "Executive Summary") is small in initial scale — approximately two active users at launch — but the domain is highly interconnected: a single business event (for example, a Yatı field sale) simultaneously affects inventory, cash, receivables, and audit history across what would otherwise be several separately versioned components. Business invariants such as "posting is the official business event; all related effects must be created together or not at all" (`docs/business/invariants.md`, "Global Invariants") depend on frontend and backend agreeing, at every point in time, on the same business rules, terminology, and workflow definitions.

## Decision

TOPTANFLOW is developed as a single monorepo containing the frontend application, the backend API, and the shared business/technical documentation that governs both.

A single repository is used so that:
- A change to a business rule, a workflow, or a shared term is visible and reviewable alongside every part of the system it affects, rather than being scattered across independently versioned repositories.
- Frontend and backend changes that jointly implement one business workflow (see `docs/business/workflow-map.md`) can be proposed, reviewed, and released together, preventing a state where one side implements a rule the other side has not yet adopted.
- The knowledge documents referenced by `AGENTS.md` (`docs/analysis/`, `docs/business/`, `docs/decisions/`) remain the single, authoritative, versioned record for every part of the system, rather than being duplicated or drifting across repositories.

## Consequences

- All contributors and agents work against one version history, one set of knowledge documents, and one point of truth for what has been decided.
- Coordinated changes across frontend and backend can be reviewed as a single unit of work, reducing the risk of one side silently diverging from an approved business rule.
- The repository will grow to contain multiple applications and packages; internal organization (workspaces, folders, boundaries) must be defined separately and must not by itself create authority for business behavior — that authority remains governed by the Source of Truth Hierarchy in `AGENTS.md`.
- Tooling (build, lint, test, dependency management) must be capable of operating across multiple applications within the same repository; the specific tooling choice is an implementation detail outside the scope of this decision.

## Alternatives Considered

- **Separate repositories for frontend and backend:** Rejected for the current stage of the project. This would require duplicating or synchronizing the shared business knowledge documents across repositories, increasing the risk that frontend and backend implement diverging versions of the same business rule, and complicating coordinated review of a single business workflow.
- **Separate repository per business module (e.g., Sales, Inventory, Yatı):** Rejected. The business modules described in `docs/analysis/01-document-analysis.md` (Section 3, "Business Modules") are heavily interdependent — for example, Sales depends on Inventory, Settlement, and Costing simultaneously — making independent versioning premature and increasing coordination overhead without a corresponding benefit at this project's scale.
