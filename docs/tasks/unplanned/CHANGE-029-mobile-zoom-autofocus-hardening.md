# CHANGE-029: Mobile zoom and automatic focus hardening

- **ID:** CHANGE-029
- **Type:** CHANGE
- **Title:** Mobile zoom and automatic focus hardening
- **Status:** Done
- **Trigger:** Owner reported iOS/mobile auto-zoom on input focus and unwanted automatic focus (page load, modals, new sale/purchase rows).
- **Urgency:** High
- **Affected epics / stories / tasks:** Frontend UX / ADR-005 responsive UI; presentation only.
- **Why not in the original plan:** Viewport and some 16px rules existed, but `autoFocus` remained on Cash forms/confirmations and RHF default error-focus still moved focus into inputs.
- **Scope:** Viewport confirmation; mobile ≥16px form controls; `touch-action: manipulation`; remove `autoFocus` / automatic form-field focus; disable RHF `shouldFocusError`; Ant Design Modal/Drawer focusable defaults; confirm dialogs without auto-focus button; sale/purchase add-line blur. Frontend only.
- **Out of scope:** Business logic, API, auth, routing, PWA cache, desktop layout redesign, print-window `.focus()` (required for print).
- **Acceptance criteria:** No automatic input focus; no auto keyboard; no focus zoom; pinch/double-tap zoom constrained by viewport; manual tap still works; lint + one Vite build pass.
- **Result:** Viewport already matched the required meta. Mobile CSS enforces 16px on form controls and `touch-action: manipulation`. All `autoFocus` props removed from Cash forms and cancel-reason TextArea. All `useForm` calls set `shouldFocusError: false`. Modal/Drawer trap autofocus into inputs disabled via ConfigProvider. Confirms use `confirmWithoutAutofocus` (`autoFocusButton: null`). Sale/Purchase add-line blurs the button after append.
- **Follow-up actions:** Owner visual check on iOS Safari for zoom and keyboard.
- **Evidence:**
  - Removed `autoFocus` from `cash-form-modals.tsx` (6) and `cash-account-detail-page.tsx` cancel TextArea (1).
  - Kept `printWindow.focus()` in print helpers (not form inputs).
  - Scoped ESLint — passed.
  - `yarn vite build` — passed (existing chunk-size warning only).
