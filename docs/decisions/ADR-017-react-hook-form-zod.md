# ADR-017: React Hook Form with Zod for Frontend Boundary Validation

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: React Hook Form manages form state in the frontend, with Zod used for frontend boundary validation. This closes part of the "validation library" item in the Known Open Decisions listed in `docs/technical/system-architecture.md` for the frontend. ADR-003 already establishes that the backend remains authoritative for validation; this ADR does not change that boundary — backend validation inside NestJS (ADR-007) remains authoritative regardless of what Zod checks on the frontend.

## Decision

- React Hook Form is used to manage form state (input values, touched/dirty state, submission) in the frontend application.
- Zod is used for frontend boundary validation only: validating user input shape and basic constraints before submission, to improve usability.
- Backend validation remains authoritative inside NestJS (ADR-003, ADR-007); a Zod check passing on the frontend never means a request is guaranteed to succeed on the backend, and a Zod check is never treated as a substitute for backend validation.
- Frontend (Zod/React Hook Form) validation exists to improve user experience — catching obvious input errors early and guiding correction — not to make any business decision.
- Validation messages shown to the user must be Azerbaijani, per ADR-005 and `docs/technical/ui-requirements.md`, regardless of whether the message originates from frontend or backend validation.

## Consequences

- Frontend forms are built with React Hook Form, with Zod schemas describing expected input shape for frontend-side checks only.
- Frontend Engineer tasks (`agents/frontend-engineer.md`) must not encode authoritative business validation rules in a Zod schema as if it were a substitute for backend validation; any business rule enforced by Zod must mirror, not replace, a backend rule already documented in `docs/business/invariants.md`.
- Backend validation strategy/library (inside NestJS) is not decided by this ADR and remains open where not already covered by ADR-007.
- This ADR resolves the frontend portion of "validation library" in the Known Open Decisions in `docs/technical/system-architecture.md`.

## Alternatives Considered

- **Formik (with or without Yup):** Rejected. Not the approved technology; introducing Formik instead of React Hook Form, or Yup instead of Zod, would contradict the explicit Approved Human Decision recorded in this ADR.
- **No frontend validation library (manual validation):** Rejected. Increases inconsistency in how usability validation is implemented and increases risk of drift from backend rules without a shared schema-based approach.
- **Treating frontend (Zod) validation as authoritative:** Rejected. Directly conflicts with ADR-002 and ADR-003, which require the backend to remain authoritative for all business validation.
