# TASK-024-01: Cash domain Prisma schema and migration

## Metadata

- **Task ID:** TASK-024-01
- **Title:** Cash domain Prisma schema and migration
- **Parent User Story:** [US-024](../stories/US-024-money-accounts-cash-movements.md)
- **Parent Epic:** EPIC-011
- **Status:** Done
- **Type:** Database
- **Priority:** High
- **Estimate:** M
- **Dependencies:** ADR-032–037; CHANGE-004 impact report; no DB reset

## Objective

Replace structural `MoneyAccount` / `CashTransaction` stubs with Multi-Cash-Account
schema: `CashAccount` with `currentBalance`, refined `CashTransaction`, sequences,
Decimal scale — safe migration without dropping unrelated financial data.

## Acceptance criteria

- [x] Schema matches ADR-032/033/036 and invariants Cash
- [x] `currentBalance` present; no API that overwrites without movement
- [x] Decimal precision on money fields (ADR-023 money scale 18,2)
- [x] Migration applies on existing DB without reset; Sale/Purchase/Partner intact
- [x] `prisma validate` succeeds

## Evidence

- Schema: `apps/api/prisma/schema.prisma` (`CashAccount`, `CashTransaction`, enums)
- Migration: `apps/api/prisma/migrations/20260801180000_multi_cash_account_domain/migration.sql` applied to `toptanflow_dev` (`prisma migrate deploy`)
- Sequences: `CASH_ACCOUNT`, `CASH_TRANSACTION`, `CASH_TRANSFER`
- Impact notes: `docs/tasks/tasks/TASK-024-01-migration-impact.md`

## Result

Done — Multi-Cash schema live; legacy stubs replaced without DB reset.

## Completion date

2026-08-01
