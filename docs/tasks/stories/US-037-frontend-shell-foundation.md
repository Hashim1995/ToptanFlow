# US-037: Frontend application shell foundation

- **ID:** US-037
- **Title:** Frontend application shell foundation
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Priority:** High
- **Business actor:** N/A (technical enabler)

## Statement

Technical enabler: replace Vite template with TOPTANFLOW shell (routing, Ant Design, Axios, Azerbaijani baseline).

## Business value

UI host for feature screens.

## High-level scope

- Replace Vite React template UI with providers + Azerbaijani Ant Design baseline
- Shared Axios HTTP client foundation
- Router + responsive app chrome (header / mobile-reachable nav) with placeholder home only
- **No** master-data or transactional business screens (US-038+)

## High-level acceptance criteria

- User-facing shell chrome is Azerbaijani (ADR-005); `lang="az"`; Ant Design `az_AZ` locale
- Root providers: Ant Design ConfigProvider, Redux Toolkit Provider (UI/client state only), TanStack QueryClientProvider
- Shared Axios instance with configurable API base URL
- Client-side routing with a placeholder home route; no invented domain module screens
- Mobile-reachable shell navigation per `docs/technical/ui-requirements.md`
- Vite template marketing/counter UI removed
- `yarn workspace web build` succeeds

## Dependencies

ADR-005, ADR-006, ADR-009, ADR-010, ADR-011, ADR-013, ADR-016; ui-requirements.md. (ADR-017 available; forms deferred until screens exist.)

## Related domain rules

ui-requirements.md (language, navigation, responsive shell). No new business invariants.

## Related ADRs / docs

ADR-005–006, 009–011, 013, 016; EPIC-021; repository-structure.md (`apps/web`).

## Known risks

Exact breakpoint pixel values are not prescribed — use Ant Design responsive primitives without inventing a second breakpoint system.

## Open questions

| Question | Disposition |
| --- | --- |
| SPA router library? | **Approved Human Decision (2026-07-29).** Use `react-router-dom` for client routing under the ADR-006 React SPA. |
| Domain nav items (products, partners, …)? | **Out of scope.** Placeholder home + shell chrome only until US-038 / feature stories activate labels from terminology. |
| Auth session / protected routes? | **Out of scope** — blocked on US-019 open decisions. Shell remains unauthenticated. |
| Full Azerbaijani error message catalog? | **Stub only in US-037** (mapper hook / structure). Full mapping expands with feature screens. |

## Readiness checklist

- [x] Behavior traceable to ADR-005 and ui-requirements (shell/language/responsive)
- [x] No silent resolution of auth or costing open decisions
- [x] Dependencies (ADRs + scaffold) satisfied
- [x] Acceptance criteria refined at activation
- [x] Tasks elaborated

## Task elaboration

- [TASK-037-01](../tasks/TASK-037-01-wire-frontend-providers-replace-template.md) — **Done**
- [TASK-037-02](../tasks/TASK-037-02-add-axios-http-client-foundation.md) — **Done**
- [TASK-037-03](../tasks/TASK-037-03-add-routing-and-responsive-app-shell.md) — **Done**
