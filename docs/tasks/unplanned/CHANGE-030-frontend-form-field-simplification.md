# CHANGE-030: Frontend form field simplification

- **ID:** CHANGE-030
- **Type:** CHANGE
- **Title:** Frontend form field simplification
- **Status:** Done
- **Trigger:** Owner requested removal of unused optional fields from create/edit forms (partners, products, sale/purchase discounts, cash notes) without backend/schema changes; follow-up removed phone and invoice notes.
- **Urgency:** Medium
- **Affected epics / stories / tasks:** Master data / Sales / Purchases / Cash UI only.
- **Scope:** Hide/remove optional form fields and related frontend validation/UI; keep API payloads compatible; preserve existing stored values on edit by omitting hidden fields from update payloads (or round-tripping discounts invisibly).
- **Out of scope:** Backend DTOs, migrations, list/detail columns unless form-only, business calculation changes beyond removing discount UI.
- **Result:** Frontend create/edit forms no longer show unused optional partner/product metadata, invoice discounts/notes, supplier invoice number, or optional cash notes (Expense notes remain required). Existing stored values are preserved; discount totals still round-trip for legacy invoices. Sale/Purchase line layouts tightened for mobile.
- **Evidence:**
  - Partner form: removed phone, tax number, address, notes; omit from create/update payloads; compact single-section layout.
  - Product form: removed barcode, notes; omit from create/update payloads.
  - Sale/Purchase forms: removed line/document discounts, document notes, line notes, purchase supplier invoice number; discounts remain in form state for edit round-trip.
  - Cash: removed optional notes UI from account / cash in / cash out / transfer; Expense notes kept required; account update omits notes.
  - Verification: scoped ESLint + schema tests + Vite production build (see CHANGELOG).
