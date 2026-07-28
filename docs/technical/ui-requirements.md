# TOPTANFLOW User Interface Requirements

> This document is the authoritative, cross-cutting technical reference for language and responsive-layout requirements across TOPTANFLOW's user interface. It implements the Approved Human Decision recorded in [`docs/decisions/ADR-005-azerbaijani-responsive-user-interface.md`](../decisions/ADR-005-azerbaijani-responsive-user-interface.md) and does not redefine business behavior — see `docs/business/invariants.md` and `docs/business/workflow-map.md` for that. It does not select a CSS framework, component library, or exact breakpoint values; those remain implementation choices for an approved task, made consistent with this document.

## Purpose

To give every agent and human working on TOPTANFLOW's frontend a single, concrete, and consistent reference for how the Azerbaijani-first, mobile-first-but-fully-responsive requirement (ADR-005) applies in practice, so that language and responsiveness are implemented the same way regardless of which task, screen, or agent produces them.

## Language Requirements

- Azerbaijani is the default and required UI language for all user-facing content.
- Do not mix English and Azerbaijani in normal user-facing screens.
- Do not expose raw backend error messages directly to the user.
- Backend errors must be mapped to clear, Azerbaijani, user-facing messages before display.
- Do not expose enum keys, permission keys, API field names, database names, or internal status codes directly in the UI.
- UI labels must use the canonical terms defined in `docs/business/terminology.md`.
- When a canonical Azerbaijani UI term is missing or ambiguous for a business concept, stop and request clarification rather than inventing an inconsistent term (see "Stop Conditions" below).

## Terminology Requirements

- Every business term shown in the UI must trace back to an entry in `docs/business/terminology.md`; the UI label is the Azerbaijani presentation of that same canonical concept, not a new or parallel concept.
- The same business concept must use the same Azerbaijani label everywhere it appears (navigation, forms, tables, messages, reports); inconsistent labeling for one concept is treated as a defect.
- A new UI screen must not introduce a business term that does not already exist in `docs/business/terminology.md`; if one is needed, it is a business-specification gap to raise with the Business Analyst, not something to name independently in the UI layer.

## User-Facing Content Rules

- All content in navigation, page titles, form labels, placeholders, buttons, validation messages, empty states, confirmation dialogs, warnings, notifications, permission-denied messages, business status labels, report headings, and printable user-facing documents must be Azerbaijani.
- Backend responses (including error payloads) must be translated/mapped to Azerbaijani display text; the frontend never simply forwards a backend message string to the user.

## Technical Identifier Boundary

- Source-code identifiers, API property names, database table/column names, environment variables, log keys, protocol names, and third-party technical identifiers are not required to be translated and are not, by themselves, user-facing content.
- Any internal identifier that would otherwise be visible to a user (an enum value, a status code, a permission key, a raw field name) must always be presented behind an Azerbaijani display label; the identifier itself is never the user-visible text.

## Azerbaijani Character Support

- The following characters must render, store, transmit, and round-trip correctly everywhere user-facing text flows: `ə`, `ı`, `İ`, `ö`, `ü`, `ğ`, `ş`, `ç`.
- Text comparison, search, sorting, filtering, export, and on-screen display must not corrupt, strip, or misorder these characters.
- All user-facing text must use Unicode-safe storage and transport end to end.

## Mobile-First Principle

- Design and implementation start from the smallest supported screen (mobile) and progressively enhance for wider screens.
- Mobile-first is a priority for how a screen is built, not a ceiling on what a screen may become on a larger display.

## Responsive Layout Requirements

- Every business action available on a desktop screen must remain available on mobile, unless an approved requirement explicitly states otherwise for that specific action.
- No workflow may depend only on a hover interaction; hover may only be a supplementary affordance where an equivalent tap/click/focus path exists.
- Touch targets must remain usable (adequately sized and spaced) on touch devices.
- Forms must not require horizontal page scrolling to be completed.
- Validation messages must remain visible near the field they refer to, at every supported width.
- Dialogs and drawers must fit small screens without clipping content, and must remain keyboard-accessible on larger screens.
- Desktop and large-desktop screens should use the available width appropriately rather than rendering a permanently narrow, mobile-shaped column.
- Tables must not become unreadable through aggressive column compression; use one of the strategies below instead.
- Important identifiers, statuses, quantities, totals, and actions must remain accessible at every supported width — "accessible" means reachable and legible, not necessarily displayed identically.
- Responsive transformations (reflow, collapsing, reordering, alternative views) must never change business values, calculations, permissions, or workflow states — they are presentation-only.

## Responsive Workflow Preservation

- A workflow defined in `docs/business/workflow-map.md` must be completable end to end at every supported viewport category (mobile, tablet, laptop/desktop, large desktop).
- No step, field, action, correction option (return, cancellation, reversal, reallocation, adjustment), status indicator, or total may be dropped, hidden without an equivalent access path, or made non-functional purely because of screen width.

## Forms

- Forms must remain single-column-usable on mobile without horizontal scrolling.
- Wider screens may use multi-column layouts where it improves usability, without changing field behavior, order of required information, or validation logic.
- Field labels, help text, and validation errors must stay legible and correctly positioned relative to their field at every width.

### Forms / Filters / Ant Design quality bar (mandatory for `apps/web`)

Owner decision 2026-07-29 ([CHANGE-001](../tasks/unplanned/CHANGE-001-product-category-and-frontend-ux-uplift.md)):
functional-but-bare screens are **not** acceptable. Every user-facing frontend
task that adds or changes screens must meet all of the following:

- **Label + placeholder:** every editable field has an Azerbaijani label and a
  useful placeholder (or an explicit reason why a placeholder would hurt clarity).
- **Field-level validation:** React Hook Form + Zod (ADR-017) show errors on
  the field via Ant Design `Form.Item` `help` / `validateStatus`; do not rely on
  toasts alone for validation failures.
- **Input semantics:** use correct Ant Design controls and HTML affordances
  (`Input`, `Input.TextArea`, `Input.Password`, `Select` with `showSearch` for
  long lists, `Switch`/`Checkbox` for booleans, `inputMode`/`type`/`autoComplete`
  where they improve mobile entry). Decimal money/quantity fields stay
  string-safe (ADR-023) with `inputMode="decimal"`.
- **Required marks:** required fields are visibly marked; optional fields are
  not implied required.
- **Read-only business codes:** backend-generated codes (ADR-024) are visible,
  disabled/read-only, never submitted, with a short Azerbaijani hint.
- **List FilterBar:** every list screen has a usable filter row (at least
  search + active status when the API supports them, plus domain filters such
  as type/role/category/currency). Filters must reset pagination to page 1.
- **Tables:** desktop tables may use column sort when the API `sortBy` allows
  it; dense tables use `scroll.x` and/or mobile cards so no action/value is lost
  (see Tables section).
- **States:** loading, empty, success, and failure are Azerbaijani and reachable
  (retry on failure). Soft-deactivate uses an explicit confirm dialog.
- **Ant Design usage:** prefer full useful Ant Design capabilities already in
  the stack (ADR-009) — Form, Modal/Drawer, Select, Table, Tag, Space, Grid,
  Pagination `showSizeChanger` — rather than under-specified bare inputs.
- **Shell:** navigation is grouped, spacing/typography are intentional, and
  large-desktop layouts use available width without a permanently cramped column.

A PR/task that ships a new master-data or operational screen without this bar
is incomplete, even if build/lint pass.

## Tables and Data-Dense Screens

Acceptable responsive strategies for dense ERP tables include:

- Horizontal scrolling for the table body while keeping headers/context clear.
- Responsive column priority (less critical columns hide first, remain reachable via an explicit action).
- Expandable rows for secondary detail.
- Card-based presentation on smaller screens in place of a full table.
- Sticky key columns (e.g., identifier, status, total) while other columns scroll.
- An alternative, purpose-built mobile view of the same data.

Whichever strategy is used, every column's data must remain reachable, and no business-critical value (total, balance, status, due date) may be silently dropped.

## Navigation

- Primary navigation must be reachable and usable on mobile (e.g., a collapsible/menu pattern) and may expand to a persistent pattern on larger screens.
- Navigation must not require memorizing a hidden gesture with no visible affordance.
- The current location/workflow context must remain clear at every screen size.

## Dialogs and Overlays

- Dialogs, drawers, and modals must fit within small screens without requiring the user to scroll to find the primary action or the close control.
- On larger screens, dialogs must remain keyboard-accessible (focus trapped appropriately, dismissible, navigable).
- A dialog must never be the only way to see a business-critical warning that then becomes unreachable on a smaller screen.

## Validation and Error Presentation

- Validation errors from the backend (per ADR-003, the backend is authoritative for validation) must be mapped to Azerbaijani messages and displayed adjacent to the relevant field or action.
- The frontend must not invent, soften, or reinterpret the meaning of a backend validation error; it translates presentation, not meaning.
- Permission-denied responses must be presented as a clear Azerbaijani message, never as a raw status code or silent failure.

## Loading, Empty, Success, and Failure States

- Every screen that fetches or submits data must define a loading state, an empty state (no data yet), a success state, and a failure state, each in Azerbaijani.
- A failure state must not expose a raw technical error; it must present a clear Azerbaijani explanation and, where applicable, a next step.
- These states must render correctly at every supported viewport category.

## Permission-Aware Presentation

- The UI may hide or disable an action a user is not permitted to perform, for usability — consistent with ADR-002, this is a convenience only, never a security control, since the backend independently enforces every permission.
- A permission-denied outcome returned by the backend must still be handled and displayed clearly, even if the UI attempted to hide the action in advance.

## Numbers, Dates, Money, and Quantities

- Display formatting of numbers, dates, money, and quantities must be presentation-only and consistent across the application; it must never alter the underlying authoritative value computed by the backend (ADR-003).
- Currency codes or symbols must not be guessed or defaulted by the frontend; the currency displayed must be the one associated with the actual business record.
- Dates and times must be presented in a way that is understandable to Azerbaijani-speaking users.
- Decimal formatting for display must not introduce rounding that changes the value used in any subsequent calculation or submission.

## Accessibility and Usability

- Status (success, warning, danger, blocked) must never be communicated by color alone; it must also be conveyed through text or an icon with an accessible label.
- Every interactive control must have a visible label or an accessible name.
- Keyboard navigation must function for all interactive elements where the platform supports it.
- Focus must remain visible when navigating by keyboard.
- Text must remain readable when the user resizes it (no fixed-size containers that clip enlarged text).
- Responsive design changes must not reduce accessibility compared to any other supported viewport.

## Testing Requirements

At minimum, testing for user-facing work must cover:

- Azerbaijani labels are present and correct.
- Azerbaijani special characters (`ə`, `ı`, `İ`, `ö`, `ü`, `ğ`, `ş`, `ç`) render and round-trip correctly.
- No unintended English (or other) language leakage into user-facing content.
- Mobile viewport behavior.
- Tablet viewport behavior.
- Laptop/desktop viewport behavior.
- Large desktop viewport behavior.
- Form behavior (completion without horizontal scrolling, validation visibility,
  placeholders, field-level errors, FilterBar usefulness — see Forms/Filters bar).
- Table behavior (chosen responsive strategy preserves all data access).
- Dialog behavior (fits small screens, keyboard-accessible on larger screens).
- Navigation behavior across viewport categories.
- Validation and backend-error presentation in Azerbaijani.
- Permission-denied state presentation.
- Long Azerbaijani text (labels/content that are longer than typical English equivalents).
- Empty, loading, success, and failure states.

This document intentionally does not specify exact breakpoint pixel values; a task introducing specific breakpoints must reference an approved technical decision for them.

## Review Checklist

A reviewer checking user-facing work must confirm:

- Azerbaijani language compliance across all new/changed user-facing text.
- Canonical business terminology (`docs/business/terminology.md`) is used consistently.
- No internal technical identifier (enum key, permission key, API field, database name, status code) is exposed directly.
- Forms/Filters/Ant Design quality bar is met for any changed `apps/web` screen.
- Backend errors are mapped to Azerbaijani messages, not passed through raw.
- Azerbaijani character safety (no corruption in storage, comparison, search, sort, filter, export, display).
- Mobile-first behavior is implemented and verified.
- Tablet and desktop responsiveness is implemented and verified.
- Every business action, status, total, and correction option remains accessible across all supported viewport categories.
- No accessibility regression was introduced by a responsive change.
- Required localization and responsive tests are present.

## Stop Conditions

Stop and request clarification, rather than guessing, when:

- A canonical Azerbaijani UI term for a business concept is missing or ambiguous in `docs/business/terminology.md`.
- A task's responsive requirement is stated only as "make it responsive" without naming the required viewport categories or preserved behaviors.
- A required business action, status, or value cannot be preserved at a supported viewport without a design decision that has not been approved.
- A specific breakpoint value or CSS/framework choice is needed but not yet covered by an approved technical decision.
