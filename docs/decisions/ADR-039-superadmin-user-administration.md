# ADR-039: Super Admin for user administration (narrow)

## Status

Accepted

## Context

[ADR-025](ADR-025-jwt-auth-flat-users-v1.md) chose flat equal active users for v1
and explicitly rejected a separate Super Admin user type, including equal access
to user administration.

On 2026-08-02 the repository owner recorded a new Approved Human Decision:
introduce a **database flag** `User.isSuperAdmin` so only the bootstrap Super
Admin can administer users. Granular roles/permissions remain deferred (US-050
Deferred). Other business modules stay flat-equal under ADR-025.

## Business Decision

- One operational Super Admin (seed/bootstrap) administers user accounts.
- Ordinary users must not see or use the Users module.
- This is **not** a general permission system.

## Decision

1. **Schema:** `User.isSuperAdmin Boolean @default(false)`. No Role/Permission
   tables.
2. **Bootstrap:** seed creates the first user with `isSuperAdmin = true`, or
   promotes the bootstrap username / chronologically first user when migrating
   existing databases so at least one Super Admin exists.
3. **API:** all `/users` routes require authenticated **active** user **and**
   `isSuperAdmin = true` (`403 SUPERADMIN_REQUIRED` otherwise).
4. **Create path:** API-created users always `isSuperAdmin = false`. Clients
   cannot set the flag.
5. **Safety:** Super Admin accounts are immutable for activation lifecycle —
   they cannot be soft-deactivated (including self-deactivate). API never
   hard-deletes users. API-created users are never Super Admin; the flag is
   not writable via update DTO.
6. **Auth payload:** login/refresh `user` object includes `isSuperAdmin` so the
   frontend can hide the Users nav (UX only; backend remains authoritative).
7. **Scope limit (amended by ADR-040):** Super Admin gates user administration,
   Cash Account creation, and responsible-user assignment/change only. Sales,
   purchases, Cash operations, and other master data remain available to every
   active authenticated user (ADR-025 unchanged for those actions).

## Consequences

- Supersedes ADR-025 clauses that (a) rejected a Super Admin user type and
  (b) allowed any active user to administer users.
- Does **not** supersede ADR-025 JWT/Argon2id/TTL/single-company rules, nor
  flat equality for non-user-admin actions.
- US-050 remains Deferred until a future decision introduces capability keys.
- ADR-040 adds only the Cash Account creation/ownership administrative boundary;
  it does not restrict who may operate an active Cash Account.

## Alternatives Considered

- **Keep ADR-025 flat user admin:** Rejected by owner — any user could create
  accounts.
- **Full Role/Permission tables now:** Rejected — unnecessary for current ops;
  US-050 Deferred.
