# TASK-037-01: Wire frontend providers and replace Vite template

## Metadata

- **Task ID:** TASK-037-01
- **Title:** Wire frontend providers and replace Vite template
- **Parent User Story:** [US-037](../stories/US-037-frontend-shell-foundation.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Frontend
- **Priority:** High
- **Estimate:** S
- **Dependencies:** none (scaffold exists)

## Objective

Replace the Vite marketing template with a TOPTANFLOW React root that mounts approved providers and an Azerbaijani Ant Design baseline.

## Scope

- `index.html`: `lang="az"`, product title
- Root providers: Ant Design `ConfigProvider` (`az_AZ`), Redux Toolkit store + `Provider`, TanStack `QueryClientProvider`
- Minimal empty (or UI-only) Redux store — no server-entity caching
- Replace `App.tsx` template with a simple Azerbaijani placeholder home (no domain modules)
- Remove unused template CSS/assets as needed for a clean build
- `yarn workspace web build` green

## Out of scope

- Routing / layout chrome (TASK-037-03)
- Axios client (TASK-037-02)
- Master-data screens (US-038)
- Auth
- React Hook Form screens

## Acceptance criteria

- [x] Vite counter/docs/social template UI gone
- [x] Document `lang` is `az`; Ant Design locale is Azerbaijani
- [x] Query + Redux providers mount without runtime error
- [x] User-facing placeholder text is Azerbaijani
- [x] `yarn workspace web build` succeeds

## Implementation notes

`src/app/` holds providers, store, query client. Placeholder home only.

## Documentation impact

Planning evidence only.

## Testing expectations

Build smoke (`yarn workspace web build`).

## Validation expectations

Build green.

## Risks

Ant Design CSS — Typography works without separate CSS import in antd v6 reset path used by components.

## Assumptions

Dependencies already listed in `apps/web/package.json` are authoritative.

## Evidence

- `apps/web/src/app/providers.tsx`, `store.ts`, `query-client.ts`
- `apps/web/src/App.tsx`, `main.tsx`, `index.html` (`lang="az"`)
- Removed Vite template `App.css` / template asset logos
- Validation: `yarn workspace web build` → success

## Result

Done. Providers + Azerbaijani placeholder replace Vite template. Next: TASK-037-02 Axios.

## Completion date

2026-07-29
