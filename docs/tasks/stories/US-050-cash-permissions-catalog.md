# US-050: Cash capabilities catalog under ADR-025

- **ID:** US-050
- **Title:** Cash capabilities catalog under ADR-025
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Deferred
- **Priority:** Medium
- **Business actor:** N/A (technical / governance)
- **Deferred:** 2026-08-02 — owner: no permission catalog needed yet (CHANGE-007).

## Statement

As the repository, we need a documented Cash capability catalog (view, create
in/out, transfer, cancel, adjustment, negative override, allocation) without
introducing Role/Permission tables that contradict ADR-025.

## High-level acceptance criteria

- Catalog documented in technical or ADR appendix.
- v1: authenticated active users may perform Cash ops; high-risk actions require
  mandatory reasons.
- Per-account visibility Deferred.
- Frontend may hide nothing for capability splits in v1 (login gate only), except
  UX organization.

## Dependencies

ADR-025, ADR-032, CHANGE-004 impact §12.

## Task elaboration

Deferred until activation (documentation task; no Permission schema).
