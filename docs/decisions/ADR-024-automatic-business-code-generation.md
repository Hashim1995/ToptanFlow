# ADR-024: Automatic Backend Business Code Generation (Product and BusinessPartner)

## Status

Accepted

## Context

Product and BusinessPartner create contracts previously accepted client-supplied business codes. An Approved Human Decision requires that these codes be generated automatically by the backend as independent, sequential, immutable business codes. Technical primary identifiers remain UUIDs (ADR-020); this ADR governs only the human-readable business `code` fields on Product and BusinessPartner.

This decision complements existing uniqueness/no-reuse invariants in `docs/business/invariants.md` ("Products", "Business Partners") and ADR-003 (backend as source of truth). It must not be confused with Unit/Currency codes, which remain manually entered reference codes outside this ADR’s scope.

## Business Decision

- Users, frontend clients, and API clients must not enter, preview, reserve, or override Product or BusinessPartner codes.
- The backend alone allocates codes.
- Product and BusinessPartner each have an independent sequence (creating one must not advance the other).
- Initial display format is seven-digit zero-padded decimal text (`0000001`, `0000002`, …).
- When the decimal representation exceeds seven digits, the full value is returned without truncation, wrapping, reset, or failure solely due to padding width (`10000000` remains `10000000`).
- Codes are immutable after creation.
- Inactive records retain their codes permanently; deactivated codes are never reused.
- Failed entity creation must not leave a committed sequence advancement without the entity.
- No public API exposes sequence state.

## Decision

### Architecture

- Introduce a single internal `NumberSequence` table (Prisma model) with one row per application-owned sequence key.
- Required initial keys (string constants, not a PostgreSQL enum): `PRODUCT`, `BUSINESS_PARTNER`.
- Shared NestJS infrastructure (`NumberSequencesModule` / `NumberSequencesService`) allocates the next formatted code inside an existing Prisma interactive transaction.
- Product create and BusinessPartner create each:
  1. open one Prisma transaction,
  2. allocate the next code for their sequence key,
  3. persist the entity with that code,
  4. commit both together (rollback undoes both).

### Atomic allocation

- Allocation uses a single parameterized PostgreSQL operation equivalent to:

```sql
UPDATE "NumberSequence"
SET "currentValue" = "currentValue" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE key = $key
RETURNING "currentValue", padding
```

- Sequence keys come only from internal constants; never from HTTP input.
- Rejected approaches: `SELECT MAX(code) + 1` at runtime, record count + 1, application-memory counters, timestamps, UUID fragments, random numbers, frontend generation, read-last-row-then-increment, application-level mutexes, separate hardcoded counters inside each entity service.

### Formatting

- One shared BigInt-safe formatter converts the allocated `currentValue` and `padding` into a decimal string using string-based formatting only (never `Number(bigint)` / `parseInt` on sequence values).
- Public `Product.code` / `BusinessPartner.code` remain strings on the HTTP boundary.
- `NumberSequence.currentValue` is never returned through HTTP.

### API contract

- `CreateProductDto` and `CreateBusinessPartnerDto` omit `code` entirely.
- Global `ValidationPipe` (`forbidNonWhitelisted`) rejects create/update bodies that include `code`.
- Responses continue to return `code`.
- Product update must not map or advertise `code` as editable.
- `NumberSequence` has no public controller, DTO, or REST endpoint.

### Historical initialization

- Migration initializes each sequence from existing entity data when codes are valid non-negative integer strings: `currentValue = MAX(code::BIGINT)`, else `0` for empty tables.
- Unsupported historical codes (blank, non-numeric, negative, decimal, malformed, duplicates unsafe to convert) must stop migration with a clear failure — no automatic rewrite, delete, or guessed remediation.

### Backup / restore

- Sequence state lives in ordinary table rows and is included in standard PostgreSQL backup/restore with entity data. Restoring without the matching `NumberSequence` rows is unsafe; restore procedures must keep them consistent.

## Deliberate Exclusions

Out of scope for this ADR (do not implement under this decision alone):

- prefixes / suffixes (`PRD-…`, `BP-…`)
- yearly or other resets
- tenant / warehouse / branch scoped numbering
- user-configurable numbering UI or admin CRUD
- next-number preview or reservation endpoints
- manual override fields
- document numbering (sales, purchases, cash)
- changing Unit or Currency code behavior

## Consequences

- Product and BusinessPartner create APIs no longer accept `code`.
- Concurrent creates are safe under PostgreSQL row-level locking of the sequence row within the shared transaction.
- Future internal sequence consumers may reuse `NumberSequencesService` with new approved keys and matching migration seed rows — without exposing sequence management over HTTP.
- ADR-020 remains unchanged: UUIDs stay technical primary keys; business codes are a separate concern.

## Alternatives Considered

- **Client- or frontend-generated codes:** Rejected. Violates backend authority (ADR-003) and concurrency/uniqueness guarantees.
- **Runtime `SELECT MAX(code) + 1`:** Rejected. Race-prone under concurrency; not an atomic allocator.
- **Application-memory counters / mutexes:** Rejected. Not durable across processes; unsafe under multi-instance deploy and restart.
- **Separate hardcoded counters inside ProductService and BusinessPartnersService:** Rejected. Duplicates allocation logic; harder to keep transactional and consistent.
- **PostgreSQL `SEQUENCE` objects per entity:** Rejected for this task in favor of one application-owned `NumberSequence` table that stores padding metadata, supports shared transactions clearly, and keeps keys as plain strings without enum migrations for each new consumer.
- **Exposing sequence state or preview endpoints:** Rejected. Clients must not reserve or observe next values.
