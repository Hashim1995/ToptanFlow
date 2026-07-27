# ADR-005: Azerbaijani-First Responsive User Interface

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision (per the Source of Truth Hierarchy in `AGENTS.md`): TOPTANFLOW's complete user-facing interface must use Azerbaijani as its primary and default language, and the application must be designed mobile-first while remaining fully responsive and usable across mobile phones, tablets, laptops, desktops, and large desktop screens. This decision governs presentation only; it does not change any business behavior recorded in `docs/business/invariants.md`, `docs/business/workflow-map.md`, or `docs/analysis/01-document-analysis.md`.

`docs/analysis/01-document-analysis.md` (Section 7.1, "Frontend") already notes that "the UI is Azerbaijani in v1, mobile-usable at 360px, permission-aware, and required to expose persistent negative/warning states rather than transient toasts only." This ADR elevates that statement from a technical-specification note to an Accepted, repository-wide architectural decision, and extends it: mobile-first is confirmed as an implementation priority, not a device limitation, so every supported workflow (`docs/business/workflow-map.md`) must remain fully usable — not merely rendered — at every supported screen category.

ADR-002 ("Independent Frontend and Backend, Frontend Never Owns Business Logic") already establishes that the frontend is a presentation layer with no business authority. ADR-003 ("Backend as the Authoritative Source...") already establishes that the backend owns every calculation, validation, and permission decision. This ADR is consistent with both: language and responsive layout are presentation concerns, and this decision must not be read as granting the frontend any new authority over business logic, calculations, or permissions.

Without a single, Accepted statement of language and responsive requirements, individual tasks or agents could each choose different UI languages, mix English and Azerbaijani inconsistently, expose internal technical identifiers directly to users, or build layouts that work only on one device class — each of which would materially affect real users of a business-critical ERP system (`AGENTS.md`, "Purpose").

## Decision

### Language

- **Azerbaijani is the primary and default user-interface language.** All user-facing application text must be Azerbaijani, including: navigation, page titles, form labels, placeholders, buttons, validation messages, empty states, confirmation dialogs, warnings, notifications, permission-denied messages, business status labels, report headings, printable user-facing documents, and the frontend's presentation of backend errors.
- **Internal technical identifiers remain in implementation-appropriate English where appropriate.** The following are not required to be translated: source-code identifiers, API property names, database table and column names, environment variables, log keys, protocol names, and third-party technical identifiers.
- **Internal English identifiers must never leak into visible UI without an Azerbaijani display label.** A raw enum value, permission key, status code, or field name must never be shown to a user directly.
- **Business terminology shown in the UI must remain consistent with `docs/business/terminology.md`.** The canonical business meaning of a term is not renegotiated by translation; the Azerbaijani label used for a term must consistently map to the same business concept everywhere it appears.
- **Azerbaijani-specific characters must be supported correctly** in every layer that touches user-facing text: `ə`, `ı`, `İ`, `ö`, `ü`, `ğ`, `ş`, `ç`.
- **Text comparison, search, sorting, filtering, export, and display must not corrupt Azerbaijani characters.** Text must use Unicode-safe storage and transport throughout.

### Responsive Design

- **The UI is mobile-first.** Mobile-first defines implementation priority — design and build for the smallest supported screen first, then progressively enhance — it does not define a device limitation.
- **Every supported workflow (`docs/business/workflow-map.md`) must remain usable on mobile, tablet, laptop, desktop, and large desktop screens.**
- **Desktop layouts must use available space appropriately** rather than displaying a permanently narrow, mobile-shaped layout on a wide screen.
- **Responsive behavior must preserve business meaning and functionality.** No action, field, status, total, validation message, or correction option may disappear merely because screen size changes.
- **Dense ERP tables and data-heavy screens may use responsive strategies** such as horizontal scrolling, responsive column priority, expandable rows, cards on smaller screens, sticky key columns, or alternative mobile views — chosen per screen, not prescribed here.

This ADR intentionally does not prescribe a specific CSS framework, component library, or exact breakpoint pixel values; those are implementation choices for a future technical task, made consistent with this decision, not by this decision.

## Consequences

- Every future UI-facing task must specify Azerbaijani content requirements and the responsive viewport categories it must support; "make it responsive" or an unspecified language is not sufficient task scope (see `docs/tasks/README.md` and `docs/tasks/TASK-TEMPLATE.md`).
- The Frontend Engineer role (`agents/frontend-engineer.md`) must implement every screen Azerbaijani-first and fully responsive, and must map technical statuses/errors to Azerbaijani display text rather than exposing them directly.
- The Code Reviewer (`agents/code-reviewer.md`) and QA Engineer (`agents/qa-engineer.md`) must verify language and responsive compliance as part of their standard checks, not as an optional extra.
- Any missing or ambiguous canonical Azerbaijani term for a business concept is a Stop Condition, per `docs/technical/ui-requirements.md`; it must be raised for clarification rather than invented inconsistently.
- Detailed, day-to-day UI implementation rules (forms, tables, navigation, dialogs, states, accessibility, testing) are defined once in `docs/technical/ui-requirements.md` and referenced from `AGENTS.md` and the relevant agent files, not duplicated.
- This decision does not change, and must never be used to change, any business invariant, workflow effect, or backend authority already established in `docs/business/invariants.md`, `docs/business/workflow-map.md`, or ADR-002/ADR-003/ADR-004.

## Alternatives Considered

- **English-only interface:** Rejected. It does not match the Approved Human Decision and would make the system unusable for its intended Azerbaijani-speaking business users, who include field roles (Field Sales Representative, Driver) operating under time pressure where a foreign-language interface would materially increase error risk.
- **Mixed Azerbaijani and English interface:** Rejected. Mixing languages within normal user-facing screens creates inconsistent terminology, increases translation drift from `docs/business/terminology.md`, and risks technical identifiers leaking into the UI simply because "English is already allowed here." A single default language keeps the terminology boundary (business language vs. internal identifier) unambiguous.
- **Mobile-only design:** Rejected. The Approved Human Decision explicitly states mobile-first does not mean mobile-only; TOPTANFLOW's users include roles (e.g., Manager, Controller/Accounting View, Business Owner — `docs/analysis/01-document-analysis.md`, Section 4) who are expected to work from laptops and desktops, particularly for reporting and reconciliation workflows that benefit from more screen space.
- **Desktop-first design with mobile adaptation added later:** Rejected. TOPTANFLOW's field-facing workflows (Yatı field sales, mobile evidence capture — `docs/business/workflow-map.md`) are used primarily on mobile devices in the field; designing desktop-first and retrofitting mobile support risks exactly the failure mode this decision forbids: a business action available on desktop becoming unavailable or unusable on the device where it is actually needed most.
