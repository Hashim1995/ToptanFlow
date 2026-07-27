# ADR-003: Backend as the Authoritative Source for Validation, Calculations, Permissions, and Business Rules

## Status

Accepted

## Context

`docs/analysis/01-document-analysis.md` (Section 7.2, "Backend") states directly that "the backend is authoritative for totals, decimal calculations, stock/cash/settlement effects, permissions, status transitions, numbering, and report values." The same analysis (Section 7.6, "Authorization") states that "permission checks are server-side; denied authenticated actions return 403 and are audited where sensitive," and that the permission list itself must be treated as a single canonical registry rather than something re-derived per client.

`AGENTS.md` ("Coding Principles") already establishes "backend as source of truth" as a repository-wide principle, and `docs/business/invariants.md` contains numerous invariants that only hold if a single component enforces them consistently: for example, that a payment allocation can never exceed the source payment or the target's open amount (Receivables & Payables), that stock sufficiency is checked before a sale posts (Sales), and that high-risk actions each require their own granular authorization (Users & Permissions).

TOPTANFLOW involves multiple actors who can act concurrently on the same business data — for example, two sales against the last unit of stock, or two allocations against the same open receivable (see `docs/analysis/01-document-analysis.md`, Section 11, "High-Risk Areas," discussing concurrency and race conditions). Correctness under concurrency requires one authoritative decision-maker per business fact; distributing that authority across multiple components (frontend, multiple backend instances acting independently, or client-supplied results) would make it impossible to guarantee invariants like "the current stock balance must always reconcile to the sum of its movements" (`docs/business/invariants.md`, "Inventory").

## Decision

The backend is the single authoritative source of truth for:

- **Validation** — every business rule that determines whether an action is allowed (e.g., stock sufficiency, period status, Yellow Card status, duplicate checks) is evaluated and enforced by the backend, regardless of what any client has already checked or displayed.
- **Calculations** — every business-relevant number (totals, discounts, cost snapshots, balances, allocations, aging) is computed by the backend from its own authoritative inputs; a value supplied by a client is never accepted as authoritative on its own.
- **Permissions** — every permission check that gates a business action is enforced by the backend at the moment the action is attempted, independent of what the client believes the user is allowed to do.
- **Business rules** — every rule captured in `docs/business/invariants.md` is enforced at the point where the backend would otherwise record a business effect; the backend refuses any action that would violate one.

A client (the frontend, or any other future channel) may present, suggest, or pre-compute any of the above for responsiveness, but such client-side results carry no authority and are always re-verified by the backend before a business effect (inventory, cash, receivable/payable, audit) is recorded.

## Consequences

- Every business invariant becomes enforceable at exactly one point, making it possible to reason about correctness without accounting for every possible client.
- Concurrent actions on the same business data are resolved by the backend's own rules, not by whichever client acted first or computed fastest.
- Any future client, integration, or channel added to TOPTANFLOW automatically inherits full business-rule enforcement without needing to reimplement it.
- Testing and review can focus on backend behavior as the definitive source of correctness; a client-side check failing to match backend behavior is a defect in the client, not a business-rule ambiguity.
- This decision creates a strict dependency: no business decision may ship in a client without a corresponding, already-authoritative backend enforcement of the same decision.

## Alternatives Considered

- **Shared validation/calculation logic split between frontend and backend, each trusted for part of the decision:** Rejected. This would fragment authority for a single business fact across two components that can disagree, be out of sync, or be bypassed independently, contradicting the "backend as source of truth" principle already stated in `AGENTS.md`.
- **Trusting client-supplied totals, permissions, or calculated values as authoritative when explicitly signed or validated client-side:** Rejected. `docs/business/invariants.md` requires that "a document's stated total must match the total calculated from its own lines," which is only meaningful if the backend independently recalculates it rather than trusting any client-provided value.
