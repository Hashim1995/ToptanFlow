# EPIC-007: Identity, authentication, and authorization

- **ID:** EPIC-007
- **Title:** Identity, authentication, and authorization
- **Status:** Planned

## Business objective

Attributable users with backend-enforced authentication and authorization.

## User / business value

Security boundary before production transactional use.

## Scope

Users beyond placeholder; authn/authz once decided; later frontend guards.

## Exclusions

Inventing auth mechanism before Approved Human Decision.

## Dependencies

EPIC-002; open auth decisions.

## Related ADRs / docs

invariants Users & Permissions; system-architecture Known Open Decisions; analysis M1.

## Child user stories

- US-018
- US-019

## Completion definition

Protected APIs require authenticated, authorized actors.

## Known risks

Per-user overrides and maker/approver separation open.

## Open questions

Authentication implementation; authorization details; AD-17/18.

## Repository evidence

Only minimal User model exists — not authentication.
