# ADR-025: JWT Authentication and Flat Equal Users (v1)

## Status

Accepted

## Context

`docs/technical/system-architecture.md` listed authentication and authorization
implementation as Known Open Decisions. The SRS recommends JWT with short-lived
access tokens, rotating refresh tokens, and Argon2id passwords, but SRS
recommendations are not Approved Human Decisions until confirmed.

On 2026-07-29 the repository owner recorded Approved Human Decisions for v1
identity:

1. Use standard JWT-based authentication, with **longer** token lifetimes than
   typical short-lived defaults.
2. The product is **single-company** (no multi-company / membership isolation).
3. **No roles** for now — every user is the same.
4. **No admin/user type split** — any authenticated active user may perform every
   application action available in v1 (including user administration).

This ADR records the technical consequences. It does not invent role packages,
per-user overrides (AD-18), or multi-company semantics (AD-17).

## Business Decision

- User accounts remain personal; deactivation (not deletion) when employment ends
  (existing invariant).
- v1 has one capability class: authenticated + active.
- Viewing/acting permission separation and granular high-risk permissions remain
  future work; they are **deferred**, not denied forever.
- Maker/approver separation remains optional (existing invariant).

## Decision

### Authentication

- Mechanism: **JWT** (access + refresh).
- Password hashing: **Argon2id**.
- Access token lifetime: **24 hours**.
- Refresh token lifetime: **30 days**, with **rotation** on use and server-side
  stored refresh-token hash supporting revocation (logout / admin revoke later).
- Access token is **not** stored in `localStorage`; prefer in-memory access token
  and httpOnly same-site refresh cookie (SRS §6.3 approach, now approved).
- Failed-attempt lockout: configurable; exact thresholds may be tuned later
  without a new ADR if documented in env/config.
- Login identifier: existing `User.username` (unique).

### Authorization (v1)

- After authentication succeeds, an **active** user is authorized for all v1 API
  actions. Inactive users are rejected (401/403 as appropriate).
- Do **not** introduce Role, Permission, or per-user override tables in v1.
- Frontend may hide affordances for UX only; backend remains authoritative
  (ADR-003). For v1, “hide” is unnecessary for capability splits because there
  are none — login gate only.

### Company model (AD-17 for v1)

- v1 is **single-company**. Do not implement Company/membership isolation or
  require `companyId` scoping for security.
- Existing schema columns that mention company semantics (if any) must not be
  treated as multi-tenant enforcement until a future Approved Human Decision
  revisits AD-17.

### User administration

- Any authenticated active user may create, list, update, deactivate, and
  reactivate users (operational completeness: soft-deactivate implies
  reactivate).
- Bootstrap: a seed or documented first-user creation path is required so the
  system is usable before the first login (chicken-and-egg).

## Consequences

- Closes “Authentication implementation” and “Authorization implementation
  details” for **v1 flat equal users** in `system-architecture.md`.
- Resolves AD-17 for v1 as single-company; AD-18 deferred (no overrides).
- US-018 / US-019 may be activated and implemented against this ADR.
- Future introduction of roles/permissions requires a new Approved Human
  Decision and will supersede the flat-authorization clause of this ADR.

## Alternatives Considered

- **Short-lived access tokens (e.g. 15 minutes):** Rejected by owner; longer
  lifetimes preferred for v1 operator convenience.
- **Role packages from day one (BRD §6):** Deferred by owner for v1.
- **Separate Super Admin user type:** Rejected by owner for v1.
- **Multi-company `companyId` isolation:** Rejected for v1 (single company).
