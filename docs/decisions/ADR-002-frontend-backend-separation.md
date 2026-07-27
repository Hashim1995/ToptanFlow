# ADR-002: Independent Frontend and Backend, Frontend Never Owns Business Logic

## Status

Accepted

## Context

`docs/analysis/01-document-analysis.md` (Section 7, "Technical Architecture Summary") describes a frontend application and a backend API as separate technical components: the frontend is a mobile-first, permission-aware presentation layer, while the backend is described as "authoritative for totals, decimal calculations, stock/cash/settlement effects, permissions, status transitions, numbering, and report values" (Section 7.2, "Backend"). The same analysis explicitly states that "frontend hiding is not security; the API independently enforces every protected action" (Section 7.6, "Authorization").

`docs/business/invariants.md` ("Global Invariants") states that a document's total must match the total calculated from its own lines, and that posting is the official business event whose effects must be created together or not at all. These are business facts, not implementation preferences: they require one place where a business decision is made and enforced, independent of how or where a user interacts with the system (main application screens, a field/offline context such as a Yatı trip, or a future channel not yet built).

TOPTANFLOW's users include roles operating in constrained or intermittent conditions (Field Sales Representative, Driver — see `docs/analysis/01-document-analysis.md`, Section 4, "Actors and Roles"), which means the presentation layer may need to operate before every value has been confirmed by the authoritative source. A business decision computed only in the presentation layer would then be unverifiable and untrustworthy the moment conditions change.

## Decision

The frontend and the backend are independent components with a clear responsibility boundary:

- The backend is the sole owner and enforcer of business logic: validation, calculation, permission checks, business rule evaluation, and the recording of business effects (inventory, cash, receivable/payable, audit).
- The frontend is responsible for presenting information, collecting user input, and guiding the user through a workflow (see `docs/business/workflow-map.md`), but it never independently decides a business outcome.
- Any business rule, calculation, or permission check that appears in the frontend for responsiveness or user experience is a convenience only. It does not replace, and must always be re-verified by, the equivalent check on the backend before a business effect is recorded.
- The frontend and backend communicate through a defined interface; the frontend does not directly access data, calculations, or authorization decisions belonging to the backend by any other means.

## Consequences

- A business rule stated in `docs/business/invariants.md` is guaranteed to hold regardless of which frontend, client, or future channel initiates the action, because enforcement lives in one place.
- Frontend code can be simplified, replaced, or extended (including future channels) without re-implementing or risking divergence in business logic.
- Any offline, cached, or locally computed value shown to a user must be treated as provisional until confirmed by the backend; the frontend must be able to represent "provisional" versus "confirmed" states without this distinction being lost or hidden from the user.
- Reviews of frontend changes must reject any change that introduces a new business decision, calculation, or permission check that is not already enforced by the backend.

## Alternatives Considered

- **Business logic embedded directly in the frontend for speed/offline use:** Rejected. This would allow a locally computed business outcome (for example, a stock or cash effect) to exist without backend confirmation, directly contradicting the invariant that "posting is the official business event" and that drafts/unconfirmed actions have no inventory, cash, receivable, payable, cost, or profit effect (`docs/business/invariants.md`, "Global Invariants").
- **A single combined application where presentation and business logic are not separated:** Rejected. This would make it structurally impossible to guarantee that "frontend hiding is not security" (per the analysis, Section 7.6) and would allow business rules to be bypassed simply by using a different entry point into the same codebase.
