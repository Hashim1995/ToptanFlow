# ADR-020: UUID Primary Identifier Strategy

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: UUID is the primary identifier strategy for TOPTANFLOW entities. This closes the "identifier strategy" item in the Known Open Decisions listed in `docs/technical/system-architecture.md`. It does not change any business rule; it defines how records are technically identified, consistent with ADR-004's requirement that posted facts and their corrections remain durably and uniquely traceable.

## Decision

- UUID is the primary identifier strategy for TOPTANFLOW entities stored in PostgreSQL (ADR-008) via Prisma (ADR-014).
- No sequential (auto-incrementing integer) identifier is exposed publicly, whether via the REST API (ADR-015), the frontend, or any printable/user-facing document, per `docs/technical/ui-requirements.md`'s technical-identifier boundary.
- Any human-readable, business-meaningful reference number (e.g., an invoice or document number meaningful to users) remains a separate, business-defined concern from the technical primary identifier; this ADR governs only the technical identifier strategy, not business numbering rules, which remain sourced from `docs/business/invariants.md` or `docs/business/terminology.md` where they exist.

This ADR does not decide the exact UUID version (e.g., v4 vs. v7) or storage representation (e.g., native UUID type vs. string); those remain separate, future implementation details for the Database Engineer.

## Consequences

- New entity schemas designed by the Database Engineer (`agents/database-engineer.md`) use UUID as the primary identifier by default.
- Backend and frontend code must not assume or expose sequential, guessable identifiers for any entity.
- This ADR removes "identifier strategy" from the Known Open Decisions in `docs/technical/system-architecture.md`; the exact UUID version and column storage representation remain open, future implementation decisions.

## Alternatives Considered

- **Sequential auto-incrementing integer IDs:** Rejected. Not the approved technology; also risks exposing internal record counts and ordering externally, which is undesirable for a business-critical ERP system, and would contradict the explicit Approved Human Decision recorded in this ADR.
- **Composite natural keys as primary identifiers:** Rejected as the primary identifier strategy. Not the approved technology; UUID is the explicitly Approved Human Decision for the primary identifier.
- **A custom identifier scheme (e.g., prefixed short IDs):** Rejected. Not the approved technology; introducing a custom scheme instead of UUID would contradict the explicit Approved Human Decision recorded in this ADR.
