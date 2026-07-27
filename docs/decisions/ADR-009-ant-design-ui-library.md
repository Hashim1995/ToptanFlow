# ADR-009: Ant Design UI Library

## Status

Accepted

## Context

This ADR records an explicit Approved Human Decision, per the Source of Truth Hierarchy in `AGENTS.md`: Ant Design is the frontend component library for TOPTANFLOW. ADR-006 establishes React and TypeScript for the frontend; ADR-005 and `docs/technical/ui-requirements.md` establish that the UI is Azerbaijani-first, mobile-first, and fully responsive. This ADR selects the component library used to build that UI; it does not relax either the language or the responsive requirement, and it grants Ant Design no authority over business terminology or behavior.

## Decision

- Ant Design is the primary React component library used to build the TOPTANFLOW frontend.
- It is used to provide consistent forms, tables, navigation, dialogs, feedback, and data-display components across the application.
- Ant Design components must be adapted to satisfy Azerbaijani-first and mobile-first requirements (ADR-005, `docs/technical/ui-requirements.md`); a component's default behavior does not override those requirements.
- Default Ant Design text (labels, built-in messages, locale strings) must not cause English (or any non-Azerbaijani) leakage into user-facing screens; any default text must be localized before it reaches a user.
- An Ant Design component must not be accepted unchanged when its default behavior fails the responsive, accessibility, or business-workflow requirements already established in `docs/technical/ui-requirements.md`.
- Ant Design is a UI implementation tool: it has no authority over business terminology (`docs/business/terminology.md`) or business behavior (ADR-003); a component's naming or built-in workflow assumptions never redefine a business concept.

This ADR does not prescribe theme colors, exact visual design, CSS methodology, or breakpoint values.

## Consequences

- Frontend Engineer tasks (`agents/frontend-engineer.md`) use Ant Design components as the default building blocks for forms, tables, navigation, dialogs, and feedback, subject to the localization and responsive adaptation this ADR requires.
- Any Ant Design default (locale, copy, layout) that conflicts with ADR-005 or `docs/technical/ui-requirements.md` must be overridden before release; using it unmodified is a review finding (`agents/code-reviewer.md`).
- This ADR does not resolve exact visual design, theming, or breakpoint decisions; those remain future implementation choices consistent with `docs/technical/ui-requirements.md`.

## Alternatives Considered

- **Building all UI components from scratch:** Rejected. Not the approved technology; introducing fully custom components instead of Ant Design would contradict the explicit Approved Human Decision recorded in this ADR and increase implementation cost without a documented business need.
- **Another component library:** Rejected. Not the approved technology; introducing a different library would contradict the explicit Approved Human Decision recorded in this ADR.
- **Multiple competing component libraries:** Rejected. Would fragment UI consistency, terminology mapping, and localization effort across libraries, directly conflicting with the single-terminology and consistent-presentation requirements in `docs/technical/ui-requirements.md`.
