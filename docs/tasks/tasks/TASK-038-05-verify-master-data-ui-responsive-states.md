# TASK-038-05: Verify master-data UI responsive states

## Metadata

- **Task ID:** TASK-038-05
- **Title:** Verify master-data UI responsive states
- **Parent User Story:** [US-038](../stories/US-038-frontend-master-data-screens.md)
- **Parent Epic:** [EPIC-021](../epics/EPIC-021-frontend-application.md)
- **Status:** Done
- **Type:** Test
- **Priority:** High
- **Estimate:** S
- **Dependencies:** TASK-038-02, TASK-038-03, TASK-038-04

## Objective

Verify US-038 end to end against ADR-005 and UI requirements.

## Scope

- Mobile, tablet, desktop, and large-desktop behavior
- Loading, empty, success, failure, validation, and deactivate states
- Azerbaijani character/content and technical-identifier boundary
- Product/partner read-only codes and partner duplicate acknowledgement
- Build/lint and any available frontend tests

## Out of scope

- New features or visual redesign
- Backend contract changes

## Acceptance criteria

- [x] Every delivered action/value remains reachable across viewports
- [x] No raw backend messages, enum keys, or API field names leak
- [x] Azerbaijani characters render correctly
- [x] All acceptance flows have evidence
- [x] Build/lint/tests pass

## Testing expectations

Record explicit viewport and state evidence in this task.

## Evidence

### Method

Static verification against ADR-005 / `ui-requirements.md` plus
`yarn workspace web build` and `yarn workspace web lint` (2026-07-29).
No automated browser harness is activated yet (US-038 open question);
viewport behavior verified from shared responsive patterns in code.

Breakpoint strategy (Ant Design `Grid.useBreakpoint()`, `md`):

| Category | Approx Ant token | Shell | Lists |
| --- | --- | --- | --- |
| Mobile | `< md` | Header + drawer nav | Cards |
| Tablet / desktop / large | `>= md` | Persistent sider | Tables (`scroll.x` where dense) |
| Large desktop | `>= md` + content `maxWidth: 1200` | Same | Same |

Screens covered: `/currencies`, `/units`, `/products`, `/business-partners`.

### Viewport / reachability matrix

| Concern | Mobile (`< md`) | Desktop+ (`>= md`) |
| --- | --- | --- |
| Nav to all four modules | Drawer “Naviqasiya” | Sider links |
| Search / status filter | Present | Present |
| Type/role filters (product/partner) | Present | Present |
| Create | Primary button | Primary button |
| Edit / deactivate | Card actions | Table link actions |
| Form fields | Vertical single-column modals | Same modals |
| Pagination | Present | Present |
| Product/partner code | Read-only on edit | Read-only on edit |
| Soft-duplicate review | Modal (candidates, no UUID) | Same |

### State coverage (all four modules)

| State | Mechanism | Language |
| --- | --- | --- |
| Loading | Table spinner / “Yüklənir…” | AZ |
| Empty | `locale.emptyText` / card empty text | AZ |
| Success | `message.success` create/update/deactivate | AZ |
| Failure | `mapApiError` Alert / message | AZ |
| Validation | RHF+Zod Form.Item help | AZ |
| Deactivate | `Modal.confirm` | AZ |
| Soft-duplicate | Dedicated modal + explicit acknowledge | AZ |

### Technical-identifier boundary

- Product types rendered via `productTypeLabel` (Hazır məhsul / Xammal /
  Qarışıq təyinatlı) — enum keys not shown as labels.
- Partner roles via Müştəri / Təchizatçı / Hər ikisi.
- Duplicate matched fields via Ad / Telefon / Vergi nömrəsi.
- Candidates show business `code`, not UUID.
- `html lang="az"`; Ant `ConfigProvider` locale `az_AZ`.
- Source scan: enum/API names appear only as code identifiers / Select
  option values, not as user-visible label text.

### Build / lint

- `yarn workspace web build` — pass
- `yarn workspace web lint` — pass
- No dedicated web UI test suite activated yet

## Result

Done. US-038 responsive and language DoD verified; no code defects requiring
fix under this task’s out-of-scope rule.
