# ADR-008: PostgreSQL Primary Database

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: PostgreSQL is the primary relational database for TOPTANFLOW. ADR-003 establishes the backend as the authoritative source of business behavior, and ADR-004 establishes that posted business facts are immutable and corrected only through new, linked actions. This ADR selects the durable storage technology that must support both; it does not grant the database independent authority over business behavior.

## Decision

- PostgreSQL is the primary transactional relational database for TOPTANFLOW.
- It stores authoritative operational data for all business modules described in `docs/analysis/01-document-analysis.md` and `docs/business/workflow-map.md`.
- It must support:
  - relational integrity
  - transactions
  - concurrency control
  - precise numeric storage (for money and quantities)
  - auditability
  - correction links (per ADR-004: reversals, cancellations, returns, reallocations, adjustments)
  - immutable posted history
- Database records and constraints must support, not replace, backend-authoritative behavior: constraints protect data integrity, but the business decision itself is made by the backend (ADR-003), not inferred from the database alone.
- Database choice must not be used to move undocumented business logic into hidden triggers or stored procedures; any business rule enforced at the database layer must still be traceable to a source document, per `AGENTS.md` ("AI Operating Principles").
- Physical schema details (tables, columns, indexes, exact constraint definitions) remain separate implementation decisions for the Database Engineer (`agents/database-engineer.md`), made task by task.

This ADR does not select an ORM, database version, hosting provider, backup provider, or deployment topology.

## Consequences

- All new authoritative operational data is modeled in PostgreSQL; no parallel operational data store is introduced without a new ADR.
- Database Engineer tasks (`agents/database-engineer.md`) design schemas that preserve immutability, auditability, and correction-link requirements already established in `docs/business/invariants.md` and ADR-004.
- Choice of PostgreSQL does not resolve the Open Decisions on ORM/database-access strategy, migration tooling, backup/restore strategy, or hosting (see `docs/technical/system-architecture.md`, "Known Open Decisions"); those remain unresolved by this ADR.
- Any hidden trigger or stored procedure that would encode an undocumented business rule is a review finding (`agents/code-reviewer.md`), not an acceptable implementation shortcut.

## Alternatives Considered

- **SQLite as the production database:** Rejected. Does not meet the concurrency-control and multi-user transactional requirements of a business-critical ERP system serving concurrent operational workflows.
- **MySQL or MariaDB:** Rejected. Not the approved technology; introducing a different relational database would contradict the explicit Approved Human Decision recorded in this ADR.
- **Document-oriented database as the primary operational store:** Rejected. Does not natively provide the relational integrity, transactional guarantees, and precise numeric storage this ADR requires for money, quantities, and posted-fact immutability.
