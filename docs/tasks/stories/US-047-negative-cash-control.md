# US-047: Control negative Cash balance

- **ID:** US-047
- **Title:** Control negative Cash balance
- **Parent Epic:** [EPIC-011](../epics/EPIC-011-cash-expenses.md)
- **Status:** Planned
- **Priority:** High
- **Business actor:** Cashier / Manager

## Statement

As a cashier, I want insufficient-balance Cash Out / Transfer Out blocked unless
I provide an explicit override reason, so that negative cash stays visible and
audited (ADR-037).

## High-level acceptance criteria

- Block without reason when result &lt; 0.
- With reason: allow; store reason + before/after.
- Overview surfaces negative accounts.
- Must not invent amount/age case lifecycle (still open).

## Dependencies

US-024; US-044 for transfer path.

## Task elaboration

Deferred until activation (implement with Stage 2 Out APIs).
