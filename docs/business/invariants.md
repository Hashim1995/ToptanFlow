# Business Invariants

> Source: `docs/analysis/01-document-analysis.md` (the single source of truth for this document). Each invariant below is a confirmed business truth stated in the Business Requirements Document (BRD) and, where consistent, the Software Requirements & Technical Specification (SRS/TDS). Recommendations, safe defaults, unresolved conflicts, and implementation details are intentionally excluded. Where the source analysis marked an item as an open decision or a conflict between documents, it is omitted here rather than resolved.
>
> A small number of entries are explicitly marked **[Approved Human Decision]**. These were recorded directly by a human decision-maker after this document was first created, are not themselves derived from `docs/analysis/01-document-analysis.md`, and rank above this document in the Source of Truth Hierarchy (see `AGENTS.md`). They are included here because they refine or resolve behavior in the same business areas this document covers.

## Global Invariants

- Drafts have no product-quantity, cash, partner debt balance, cost, or profit effect.
- Posting is the official business event; all effects that belong to that posting
  commit together, or not at all. **Completing (posting) a Sale or Purchase never
  directly mutates a money-account cash balance.** A Sale posts product-quantity
  decrease and increases the partner's signed debt balance; a Purchase posts
  product-quantity increase and decreases the partner's signed debt balance. Cash
  changes only through a separate Cash In / Cash Out (money) transaction. A UI
  action may create that cash transaction in the same user flow and commit it in
  the same atomic operation, but the Sale/Purchase and Cash records remain
  separate, each with its own identity and audit trail. [Approved Human Decision —
  recorded 2026-07-31 as ADR-028; refines the cash/settlement separation already
  stated in analysis §5.1 / §5.5. Partner debt balance effects: ADR-030.]
- A document's stated total must match the total calculated from its own lines; a mismatched total is not accepted as authoritative.
- Posted facts are not deleted or silently edited — including informational fields such as notes/description on completed Sale, Purchase, Cash Transaction, and Cash Transfer. Corrections happen only through a return, cancellation, reversal, reallocation, or an authorized adjustment. [CHANGE-006, recorded 2026-08-02.]
- **Active/inactive (`isActive`) is for master data only** (Product, Business Partner, Cash Account, Expense Category). Completed financial/commercial operations use lifecycle statuses (`Draft` / `Posted` / `Cancelled`, or Cash `Posted` / `Cancelled`) — never soft-deactivate as a substitute for cancellation. [CHANGE-006, recorded 2026-08-02.]
- A reversal always preserves and links back to the original record; a cancelled document's number is never reused.
- Resubmitting the same action (for example after a network retry) must not create duplicate business effects.
- Every completion or cancellation that affects multiple ledgers (quantity, partner debt, cash, transfer legs) commits as **one indivisible business action**: all effects apply together, or the whole action leaves state unchanged. [CHANGE-006, recorded 2026-08-02.]
- Money and quantity values must be calculated without loss of precision; rounding must not silently change an official amount.

## Users & Permissions

- Viewing a screen and performing a transaction are separate permissions.
- High-risk actions — posting, cancellation, backdating, high discount, manual product-quantity adjustment, negative quantity/cash override, trip closing, and period reopening — each require their own granular authorization.
- A single person may hold several role packages, but every sensitive action must remain attributable to one identifiable user account and the specific permission exercised.
- User accounts are personal; when employment ends, the account is deactivated, not deleted.
- No role may alter audit history.
- Enforcing a restriction only in the user interface is not sufficient; the restriction must hold wherever the action could otherwise be performed.
- Requiring the document creator and its approver to be different people is an optional business policy, not a mandatory rule by default.
- **[Approved Human Decision — recorded 2026-07-29; see ADR-025.]** For v1, authentication uses JWT (access + refresh) with access-token lifetime 24 hours and refresh-token lifetime 30 days (rotating refresh). Passwords use Argon2id. Login uses `username`.
- **[Approved Human Decision — recorded 2026-07-29; see ADR-025.]** For v1, the product is single-company; multi-company / membership isolation is not implemented.
- **[Approved Human Decision — recorded 2026-07-29; see ADR-025.]** For v1, there are no role packages and no admin/user-type split: every authenticated **active** user may perform every available application action. Granular permissions and per-user overrides remain deferred until a future Approved Human Decision.

## Business Partners

- One partner record represents the same person or company in both the customer role and the supplier role. The partner has **one signed debt balance** (AZN); sales and purchases with that partner affect the same balance (ADR-030).
- Possible duplicate partners are flagged using normalized name, phone, tax number, and other identifiers before a new record is created.
- A partner that has been used in transactions is inactivated, not deleted.
- An inactive partner remains visible in historical documents but cannot be selected for new documents.
- Sales-specific and purchasing-specific Yellow Card notes must not be mixed when one partner acts as both customer and supplier.
- A partner's WhatsApp number, communication consent, preferred language, and sending history are controlled communication data.
- A business partner statement lists sales, sales returns, purchases, purchase returns, receipts, payments, and approved adjustments chronologically, with source-document links, and shows **one running signed debt balance** (opening through closing), not separate receivable and payable closing balances. [Approved Human Decision — ADR-030, recorded 2026-07-31.]
- A business partner code is generated automatically by the backend as an independent sequential business code (initial seven-digit zero-padded decimal text; continues beyond seven digits without truncation or reset). Clients must not supply, preview, reserve, or override the code. [Approved Human Decision — recorded 2026-07-28; see ADR-024.]
- A business partner code is globally unique across its entire history — including inactivated or deleted partners — and a code is never reused after deactivation or deletion. The code is immutable after creation. [Approved Human Decision — recorded 2026-07-28; not derived from the BRD/SRS analysis.]
- A business partner is never hard-deleted; it is only ever deactivated (see the invariant above: "A partner that has been used in transactions is inactivated, not deleted"), which is the mechanism that guarantees its code can never be reused. [Approved Human Decision — recorded 2026-07-28; not derived from the BRD/SRS analysis.]

## Currency

> **[Approved Human Decision — ADR-031, recorded 2026-07-31.]** The 2026-07-28 optional multi-currency decision is **superseded** for the active product. Currency is not an active module in current domains.

- The current release uses a static **base currency of AZN** only. All monetary amounts in Products, Business Partners, Sales, and Purchases are AZN. There is no currency selection on those documents or on Business Partners. [ADR-031.]
- There is no Currency create/edit/delete/activate UI or API in the current product. Currency is reserved for a **future Cash** design (cash accounts / cash transactions) and must not be treated as a Product, Business Partner, Purchase, or Sale master-data property. [ADR-031.]
- Exchange-rate workflows and multi-currency document fields are out of scope until future Cash work is explicitly activated. Decimal precision for money remains governed by ADR-023.

## Products

- A product code is generated automatically by the backend as an independent sequential business code (initial seven-digit zero-padded decimal text; continues beyond seven digits without truncation or reset). Clients must not supply, preview, reserve, or override the code. [Approved Human Decision — recorded 2026-07-28; see ADR-024.]
- A product code is globally unique across its entire history — including inactivated products — and a code is never reused after a product is deactivated or deleted; a product that has been used is inactivated, not deleted. The code is immutable after creation. [Global-uniqueness and no-reuse rule: Approved Human Decision — recorded 2026-07-28; strengthens the BRD-derived "active codes are unique" rule and is not itself derived from the BRD/SRS analysis.]
- A product is never hard-deleted; it is only ever deactivated, which is the mechanism that guarantees its code can never be reused. [Approved Human Decision — recorded 2026-07-28; not derived from the BRD/SRS analysis.]
- Product type (finished good, raw material, or mixed-use) and product category are separate, independent classifications.
- Each product has exactly one primary unit of measure; whether fractional quantities are allowed follows that unit's configuration.
- Standard sale price and latest purchase price are informational defaults only; each posted document line keeps its own price and cost as recorded at posting time, regardless of later master-data changes.
- Setting a zero or negative price requires special permission and a stated justification.
- Each product has exactly one company-wide **current quantity** (`currentQuantity`); quantity belongs on the product, not in a separate Warehouse or Stock module. [Approved Human Decision — ADR-029, recorded 2026-07-31.]
- A product may have a single **minimum quantity** threshold used for low-quantity alerts; there are no main-warehouse or specific-warehouse critical stock levels. [Approved Human Decision — ADR-029, recorded 2026-07-31.]

## Sales

- A sale is a list-based business document with lifecycle **Draft → Posted → Cancelled** (`DocumentStatus`). Drafts support normal create/read/update/delete. Posted and Cancelled documents are immutable (view/cancel-from-posted only) — partner, lines, quantities, prices, totals, dates, related cash links, and notes cannot be edited; they are never physically deleted and never soft-deactivated. A Cancelled sale cannot be posted again. [US-023 activation; CHANGE-006.]
- Document numbers are allocated by the backend (`SAL-` + `NumberSequence` key `SALE`) at draft creation, are globally unique, and are never reused — including after cancellation. Clients must not supply or override document numbers. [Approved Human Decision — US-023 / EPIC-010, recorded 2026-08-01; uses ADR-024 allocation pattern.]
- A sale records the delivery of goods to a business partner together with price, discounts, and total amount (AZN). Partner debt impact is on the partner's signed debt balance — not a cash balance stored on the sale.
- Draft sales have no product-quantity, partner-debt, or cash effect. Totals stored on a draft are document values only.
- The backend recalculates line and document totals; client-supplied totals are not trusted. The same product may appear on multiple sale lines (for example different unit prices or discounts); there is no uniqueness limit per product within one document. [Approved Human Decision — owner, recorded 2026-07-31; mirrors Purchasing.]
- Product code, name, and unit name are snapshotted on each sale line so historical details remain stable when master data changes.
- Posting a sale decreases the product quantity of the sold products (or the relevant bundle components) and **increases the partner's debt balance** by the sale amount (`partnerBalance += saleAmount`). There is no warehouse selection and no currency selection on a sale. [Approved Human Decision — ADR-029, ADR-030, ADR-031, recorded 2026-07-31.]
- **[Approved Human Decision — ADR-028, recorded 2026-07-31.]** Completing a sale never directly changes any money-account balance. Cash In for a sale (full, partial, or later) is always a separate cash transaction, optionally linked/allocated to the sale. The link may be created in the same UI save/post flow via an optional checkbox/action that also creates that separate cash record, or later from the Cash module. Even when created together, Sale and Cash remain separate records with separate audit logs. Unlinked cash receipts are allowed. A customer cash receipt from the partner **decreases** the partner's debt balance (`partnerBalance -= receivedAmount`) per ADR-030. Partial payments, multiple receipts for one sale, and one receipt linked across multiple sales remain supported by Settlement (optional document linkage).
- Quantity sufficiency is checked before posting; a sale that would take product quantity below zero is blocked unless posted under an authorized, reasoned negative-quantity exception (permission + mandatory reason). [Approved Human Decision — ADR-029 re-homes ADR-027 to product-level quantity; under ADR-025 v1 every active authenticated user has that permission, but the reason remains mandatory. Full BRD-OD-04 case lifecycle remains deferred.]
- A sales return must reference an original posted sale and cannot exceed the quantity sold minus quantities already returned; it uses the original sale's price and cost. **Sales Returns are deferred** relative to US-023 core draft/post/cancel.
- A returned, resaleable product increases product quantity at the original sale cost; damaged goods are handled via write-off or quantity adjustment with reason — not by directing them to a damaged warehouse (warehouses are abolished under ADR-029).
- A sale return or sale cancellation **decreases** the partner's debt balance by the reversed sale amount (ADR-030). Cash refunds, if any, are separate Cash Out facts (ADR-028).
- After posting, a sale's prices and discounts are not directly edited; corrections use cancellation followed by a new document, or a return.
- Cancelling a posted sale reverses its product-quantity and partner debt-balance effects via reversing quantity-history / balance-movement rows in the **same** atomic action. Sale cancellation **does not** mutate cash (ADR-028). **[Approved Human Decision — CHANGE-006 / US-048, recorded 2026-08-02.]** While any linked non-reversal Cash Transaction remains `POSTED`, Sale cancel is **blocked** (`SALE_HAS_LINKED_POSTED_CASH`); the operator must cancel those Cash In operations first (ADR-035). Cancelled cash rows may remain visibly linked for history but are not treated as active payments. The original sale is retained and marked cancelled, its number is never reused. Cancellation requires a non-empty reason and cannot be applied twice.

## Purchasing

- A purchase is a list-based business document with lifecycle **Draft → Posted → Cancelled** (`DocumentStatus`). Drafts support normal create/read/update/delete. Posted and Cancelled documents are immutable (view/cancel-from-posted only) — partner, lines, quantities, prices, totals, dates, related cash links, and notes cannot be edited; they are never physically deleted and never soft-deactivated. A Cancelled purchase cannot be posted again. [US-022 activation; CHANGE-006.]
- Document numbers are allocated by the backend (`PUR-` + `NumberSequence` key `PURCHASE`) at draft creation, are globally unique, and are never reused — including after cancellation. Clients must not supply or override document numbers. [Approved Human Decision — US-022 / EPIC-009, recorded 2026-07-31; uses ADR-024 allocation pattern.]
- A purchase records goods actually received from a supplier together with actual quantity, price, and total amount (AZN). Partner debt impact is on the partner's signed debt balance — not a cash balance stored on the purchase.
- Draft purchases have no product-quantity, partner-debt, or cash effect. Totals stored on a draft are document values only.
- The backend recalculates line and document totals; client-supplied totals are not trusted. The same product may appear on multiple purchase lines (for example different unit prices or discounts); there is no uniqueness limit per product within one document. [Approved Human Decision — owner, recorded 2026-07-31.]
- Product code, name, and unit name are snapshotted on each purchase line so historical details remain stable when master data changes.
- Posting a purchase increases product quantity by the actual received quantity and **decreases the partner's debt balance** by the purchase amount (`partnerBalance -= purchaseAmount`). There is no warehouse selection and no currency selection on a purchase. [Approved Human Decision — ADR-029, ADR-030, ADR-031, recorded 2026-07-31; cash separation per ADR-028.]
- **[Approved Human Decision — ADR-028, recorded 2026-07-31.]** Completing a purchase never directly changes any money-account balance. Cash Out for a purchase (full, partial, or later) is always a separate cash transaction, optionally linked/allocated to the purchase. The link may be created in the same UI save/post flow via an optional checkbox/action that also creates that separate cash record, or later from the Cash module. Even when created together, Purchase and Cash remain separate records with separate audit logs. Unlinked cash payments are allowed. A supplier cash payment to the partner **increases** the partner's debt balance (`partnerBalance += paidAmount`) per ADR-030. Partial payments, multiple payments for one purchase, and one payment linked across multiple purchases remain supported via Settlement (optional document linkage).
- A purchase is posted based on the quantity actually physically received, not the invoiced quantity; differences between the two are recorded separately.
- Entering the same supplier invoice number more than once triggers a duplicate warning.
- A purchase return references the original purchase wherever possible, cannot exceed the unreturned quantity, and requires sufficient available product quantity; if the goods have already been sold onward, a physical return is not possible without a separately defined settlement. Purchase return is a separate workflow from full-document cancellation (deferred relative to US-022 core draft/post/cancel).
- A purchase return or purchase cancellation **increases** the partner's debt balance by the reversed purchase amount (ADR-030). Cash effects, if any, are separate Cash facts (ADR-028).
- Cancelling a posted purchase reverses its product-quantity increase and partner debt-balance effect via reversing quantity-history / balance-movement rows in the **same** atomic action; cancellation is **blocked** if available product quantity is insufficient to reverse the original receipt (`PURCHASE_CANCEL_INSUFFICIENT_QUANTITY`). Cancellation requires a non-empty reason and cannot be applied twice. Purchase cancellation **does not** mutate cash (ADR-028).
- **[Approved Human Decision — CHANGE-006 / US-048, recorded 2026-08-02.]** While any linked non-reversal Cash Transaction remains `POSTED`, Purchase cancel is **blocked** (`PURCHASE_HAS_LINKED_POSTED_CASH`); the operator must cancel those Cash Out operations first (ADR-035). Cancelled cash rows may remain visibly linked for history but are not treated as active payments. Cash is never edited into the purchase row.

## Product Quantity

> **[Approved Human Decision — ADR-029, recorded 2026-07-31.]** There is no separate Warehouse or Stock module. Product quantity is owned by Products. The former Inventory / warehouse-scoped stock ledger is withdrawn.

- Each product has exactly one company-wide **current quantity** (`currentQuantity`); there are no warehouses, location balances, or warehouse transfers.
- Product quantity changes only through explained, auditable **Product Quantity History** rows (e.g. `ProductQuantityHistory`) linked to a source document or authorized adjustment, user, quantity delta, and (where applicable) cost — never by silently editing history or overwriting `currentQuantity` without a history row.
- `currentQuantity` must always reconcile to (equal) the sum of that product's immutable quantity-history deltas.
- Drafts have no product-quantity effect.
- A posted purchase increases product quantity; a posted sale decreases product quantity.
- Cancellations and returns do not delete original history rows; they create reversing history rows.
- A manual quantity adjustment (including write-off-style removal) requires permission, a mandatory reason, and an auditable history row.
- A decrease that would make quantity &lt; 0 is **blocked** without permission; with permission it requires a mandatory reason and is audited on the history row. Under ADR-025 v1 (flat equal users), every active authenticated user has that permission; the reason remains mandatory. Full BRD-OD-04 case limits/lifecycle remain deferred. [ADR-029 re-homes ADR-027.]
- Sale and purchase documents never require or accept warehouse selection.

## Costing

- A sale's cost is recorded (snapshotted) at the cost applicable at the time of posting; this snapshot does not change afterward even if the product's cost later changes.
- A sales return restores product quantity using the cost recorded on the original sale.
- A purchase return reduces product quantity using the cost of the original purchase wherever possible.
- Profit and product-quantity valuation remain provisional for as long as a negative-quantity cost has not been resolved; the historical negative-quantity history row is not deleted even after it is later cleared.

## Cash

> **[Approved Human Decision — ADR-032–038 / CHANGE-004 / CHANGE-005, recorded 2026-08-01.]** One Cash domain supports any number of named **Cash Accounts** as data (not hardcoded person modules). Balances change only through auditable Cash Transactions / Transfer movements. Current amounts are AZN (ADR-031). **Primary ordinary operations are exactly: Cash In, Cash Out, Expense, Transfer** (ADR-038).

- Cash changes only when money actually moves, or through an approved opening entry or an approved adjustment — never as a side effect embedded inside a Sale or Purchase document. [Approved Human Decision — ADR-028, recorded 2026-07-31.]
- **Cash Account balance cannot be manually overwritten.** Every change to `currentBalance` requires a completed Cash Transaction or Transfer-linked movement that stores balance before/after, actor, type, and reason/source as applicable (ADR-033).
- Every money movement identifies the account, amount, date, movement type, actor, and business reason or source.
- A cash transaction (Cash In / Cash Out / Expense / transfer) is its own posted fact with its own audit trail. Optional linkage to one Sale or Purchase provides traceability; unlinked partner Cash In/Out remain allowed. Ordinary Cash In/Out/Expense/Transfer complete in one step (no Draft effect) per ADR-036.
- **Cash In (primary):** requires Business Partner; cash ↑; partner debt ↓; optional Sale link (ADR-038 / ADR-030).
- **Cash Out (primary):** requires Business Partner; cash ↓; partner debt ↑; optional Purchase link; negative override per ADR-037 (ADR-038 / ADR-030).
- **Expense (primary):** requires Expense Category and description; cash ↓; **no** partner; **no** partner debt (ADR-038).
- **Multiple Cash Accounts** (e.g. named tills such as office cash or an employee’s operational cash) are separate custody pools; a movement recorded in one account is never used to silently increase another except via an explicit Internal Transfer (ADR-032, ADR-034). Person names appear only as account data — never as hardcoded modules or auth branches.
- **Total Company Cash** = sum of current balances of all **active** Cash Accounts. Inactive accounts remain visible in history but are excluded from that total for normal overview.
- A transfer between Cash Accounts is one atomic business aggregate producing linked transfer-out and transfer-in movements; it does **not** change Total Company Cash; it is neither income nor expense; it does not affect partner debt (ADR-034).
- **Opening balance** is posted as an auditable `OPENING_BALANCE` movement when an account starts with a non-zero balance; later corrections use reversal/adjustment, not silent field edit (ADR-033).
- **Negative cash:** Cash Out / Expense / Transfer Out that would make balance &lt; 0 is blocked unless an authorized override supplies a mandatory reason; before/after balances and actor are stored. Amount/age limits and formal case lifecycle remain open (partial BRD-OD-05 — ADR-037). Negative cash must never be concealed using a false receipt.
- Money paid using an employee's or the owner's personal funds is tracked as a separate reimbursable amount, not as a business-cash outflow (**AD-08 still open** — Deferred relative to Multi-Cash Stages 1–5; Stage 3 expenses are paid from a Cash Account).
- Cash closing compares the calculated (system) balance to the physically counted balance; any difference requires an investigated reason and, if it cannot be explained by a missing source document, an approved adjustment. (Closing UI may follow core posting.)
- Completed Cash Transactions/Transfers are not silently edited or deleted (including notes); they are never soft-deactivated. Cancellation requires a non-empty reason, cannot be applied twice, and posts reversing effects (ADR-035). Transfer cancel reverses **both** account effects atomically; Total Company Cash is unchanged by a successful transfer and is restored to the pre-transfer total after a successful transfer cancel.
- **Cash In cancellation** is always allowed even when reversing the receipt would make the Cash Account balance negative. It must not be blocked for insufficient balance and must not require the ordinary ADR-037 negative-cash override. Cancel reason remains mandatory; cash and partner debt reverse together; original and reversal history are preserved. The resulting negative balance remains visible on the account and in history. This exception applies only to cancellation of Cash In — not to ordinary Cash Out, Expense, or Transfer **creation**. [CHANGE-006 correction, recorded 2026-08-02.]
- Cash In / Cash Out cancel reverses cash and partner debt together; Expense cancel restores cash only and never changes partner debt; optional Sale/Purchase links are traceability only and never cause a second cash or debt mutation when created, changed, or left in place after cancel (ADR-038).
- New normal operations are not created against an inactive Cash Account; historical transactions remain intact after deactivation. Deactivation does not alter balances or history.
- Primary UX must not expose separate **Customer Receipt** / **Supplier Payment** features (ADR-038).

## Business Partner Debt Balance

> **[Approved Human Decision — ADR-030, recorded 2026-07-31.]** Separate receivable and payable primary balances, and the prohibition against netting them, are **superseded**. Advances and overpayments are represented by the same signed balance (no separate customer/supplier advance primary balances).

- Each Business Partner has exactly **one signed debt balance** in AZN. Sign convention: `balance > 0` means the partner owes the company; `balance < 0` means the company owes the partner; `balance = 0` means no outstanding debt.
- Exact balance effects: Completed Sale `+=` sale amount; **Cash In** from partner `-=` received amount; Completed Purchase `-=` purchase amount; **Cash Out** to partner `+=` paid amount; sale return / sale cancellation decreases balance by the reversed sale amount; purchase return / purchase cancellation increases balance by the reversed purchase amount.
- Drafts have no debt-balance effect. Crossing zero is allowed. Sales and purchases with the same partner intentionally offset on this single balance.
- Every change is recorded as an auditable **Business Partner balance movement**. Manually editing the balance without a movement is forbidden. Manual adjustment (if supported) requires permission, reason, a movement, and audit; reverse rather than delete.
- Sale/Purchase documents never mutate money-account cash (ADR-028). Partner cash settlements are separate **Cash In / Cash Out** facts (ADR-038), optionally linked to documents for traceability.
- Optional document linkage / allocation is for traceability, history, and reporting; it is optional — unlinked cash movements remain valid. A payment allocation can never exceed either the amount of the source payment or the open amount of the target document.
- Cancelling a payment reverses its linkages/allocations and posts the corresponding reversing partner balance movement (and cash reversal as separate cash facts).

## Expenses

- An expense is a business operating outflow and does not need to be linked to a sales or purchase document.
- An expense does not increase sellable product quantity; acquiring a physical, sellable product must use a purchase document instead.
- Every expense requires an expense category **and a description** (ADR-038).
- **Financial posting of an expense is a Cash Transaction** against a Cash Account; there is no disconnected balance-changing Expense ledger (CHANGE-004 / EPIC-011).
- An expense paid from an employee's or owner's personal funds is not shown as a business cash-account outflow; the person whose funds were used is recorded separately as reimbursable (**AD-08 open** — Deferred; initial expense UX posts from business Cash Accounts only).
- Unpaid / accrued expense obligation (**AD-07**) remains open — Deferred; initial scope is cash-paid expenses.
- Cancelling a posted expense creates a reversing Cash entry rather than deleting the original (ADR-035). Expense Category on the original row is preserved for history; deactivating a category later does not rewrite posted expense amounts.
- Expense does **not** change Business Partner debt and must not show a Business Partner field (ADR-038).
- Expense Category is master data with soft-deactivate/reactivate; inactive categories cannot be selected for new expenses; historical expenses remain readable.

## Fixed Assets

- A fixed asset is a long-lived operational asset used by the business over time, tracked separately from Products and product quantity. [ADR-029.]
- A fixed asset record retains its full history — status, location, responsible person, maintenance/repair, sale, or write-off — and this history is never deleted, even after the asset is sold or written off.
- Acquiring a fixed asset is linked to its purchase and cash source rather than being recorded only as a routine, unlinked expense.
- Selling or writing off a fixed asset does not affect sellable product quantity.

## Field Sales (Yatı)

> **Withdrawn / deferred under ADR-029 (recorded 2026-07-31).** Vehicle-warehouse and warehouse-transfer loading rules below are **not** active design invariants. Field Sales (Yatı) remains deferred pending a redesign that does not use multi-location stock. Cash-related trip ideas that depended on vehicle warehouses are likewise deferred with that redesign; they must not be implemented against the old model.

- ~~Goods loaded onto a vehicle for a trip remain company-owned, unsold inventory; loading is a transfer from the main warehouse to the vehicle warehouse, not a sale or revenue event, and company-total inventory does not change.~~ **Withdrawn under ADR-029** — no vehicle warehouse; loading-as-transfer is abolished pending redesign.
- ~~The vehicle warehouse and vehicle cash account are tracked separately from the main warehouse and main cash account, while still consolidating into company totals.~~ **Withdrawn under ADR-029** for the warehouse half; any future vehicle cash account rules require redesign and a new Approved Human Decision.
- ~~A field sale draws stock from the vehicle warehouse and, when money is received, deposits it into the vehicle cash account; it must not silently use the main warehouse, main cash account, or another vehicle's accounts.~~ **Withdrawn under ADR-029** — field sale quantity must use the single product quantity model after redesign; do not implement warehouse-scoped field sales.
- Starting cash issued to a vehicle for a trip as a transfer from the main cash account (not an expense) is **deferred with Yatı redesign** — it does not itself require a warehouse, but must not be implemented as part of the withdrawn vehicle-warehouse loading model.
- Collecting a customer's previous outstanding balance in the field can occur without a new sale; it posts a separate Cash In that decreases the partner's signed Debt Balance and may optionally link to prior sales (ADR-028, ADR-030). **Deferred with Yatı redesign**.
- Money received in the field must never be mixed with the representative's personal funds. **Deferred with Yatı redesign** (principle remains valid).
- ~~A trip's inventory and cash differences identified during reconciliation are investigated and classified by reason, product, and amount separately; they must never be concealed by recording a false sale or expense.~~ **Withdrawn / deferred under ADR-029** — trip inventory reconciliation against a vehicle warehouse is abolished; cash reconciliation awaits redesign.
- ~~A trip is not considered closed until its vehicle inventory and vehicle cash have been reconciled against physical counts.~~ **Withdrawn / deferred under ADR-029** pending redesign without multi-location stock.

## Audit

- The audit history is append-only; no user may edit or delete it.
- The audit history records the actor, the time, the action taken, the affected entity or document, the previous and new values of material fields, and the reason given for a cancellation or other risky change.
- Creation, posting, cancellation, status transitions, payment allocation, permission changes, period closing/reopening, overrides, exports, and sensitive views are all events that must be captured in the audit history.
- Notification history does not replace or substitute for audit history.

## Reporting

- Reports must be derived from and reconcile to the same source documents and movements as the operational ledgers; they are not calculated independently of them.
- Sales revenue used for reporting purposes is defined net of returns.
- An increase in cash does not by itself represent profit (for example, an owner's capital contribution increases cash without being revenue).
- Partner debt is reported from the signed debt balance (and its movements). Derived labels that describe “partner owes us” versus “we owe partner” from the sign of the balance are optional; separate receivable/payable primary totals are not the business truth (ADR-030).
- A report or indicator that depends on an unresolved negative-quantity cost must be marked as provisional.
- A business partner statement shows sales, purchases, returns, receipts, payments, and adjustments chronologically, with one running signed opening and closing debt balance (ADR-030).

---

## Excluded as Open Decisions or Unresolved Conflicts (not stated as invariants above)

The following business-relevant topics are referenced in the analysis but are explicitly marked as open decisions, safe defaults awaiting approval, or unresolved conflicts between the BRD and SRS/TDS. They are intentionally **not** stated as invariants:

- The exact costing method (e.g., weighted-average cost) — recommended in the BRD but not yet approved; mandated only in the SRS/TDS.
- Whether a closed Yatı trip may be reopened, and under what conditions. (Yatı redesign itself is deferred under ADR-029.)
- Whether a Yellow Card "BLOCK" level can be overridden by a manager, and by what authority.
- The exact settlement classification (advance, credit, or refund) produced by an over-paid sales return or purchase return.
- The full fixed-asset status catalog and whether deferred (credit) settlement is allowed on an asset sale.
- Bundle return/refund allocation policy and whether a "physical bundle" stocking mode exists alongside always-exploding components.
- Maker/approver separation as a default (mandatory) versus optional policy.

**Partially superseded for v1 by Approved Human Decision (2026-07-29, ADR-025):** authentication mechanism (JWT + Argon2id, longer TTLs), single-company operation, and flat equal users (no roles/admin types). Still deferred / not decided by that entry: granular role packages, per-user permission overrides (AD-18), and multi-company membership if ever required later.

**Superseded by Approved Human Decision (2026-07-31, ADR-029):** ADR-026 (initial warehouse topology, seeded GENERAL warehouse, multi-warehouse support) is superseded — there is no Warehouse or Stock module. BRD-OD-02 (multi-warehouse topology) and AD-06 (transfer staging) are **N/A** for the active product. Damaged-goods warehouse destination (AD-05) is **N/A**; damaged handling must not reintroduce warehouses.

**Re-homed by Approved Human Decision (2026-07-31, ADR-029):** ADR-027’s allow-negative intent applies to `Product.currentQuantity` with permission + mandatory reason (see Product Quantity). Still open under BRD-OD-04: quantity/value/age limits, case lifecycle, and provisional cost clearance.

**Resolved by Approved Human Decision (2026-07-31, ADR-028):** Sale/Purchase posting never directly mutates money-account cash; cash changes only via separate Cash In / Cash Out; optional allocation/link for traceability and settlement; unlinked cash allowed; partial and multi-document allocation supported. See Sales, Purchasing, Cash, and Business Partner Debt Balance sections above.

**Resolved by Approved Human Decision (2026-07-31, ADR-029):** No separate Warehouse or Stock module; one `currentQuantity` per Product with auditable Product Quantity History inside Products; posted Purchase ↑ quantity and decreases partner debt balance; posted Sale ↓ quantity and increases partner debt balance (debt effects refined by ADR-030); Fixed Assets remain separate; Yatı vehicle-warehouse / transfer-loading invariants withdrawn pending redesign. See Products, Sales, Purchasing, Product Quantity, and Field Sales (Yatı) sections above.

**Resolved by Approved Human Decision (2026-07-31, ADR-030):** One signed Business Partner debt balance (AZN). Sign: `>0` partner owes us; `<0` we owe partner; `=0` none. Sale/Purchase/Cash/return/cancellation effects as stated in Business Partner Debt Balance; drafts no effect; auditable movements; crossing zero allowed; advances via the same signed balance. Separate receivable/payable primary balances and “never net” rules are superseded. See Business Partners, Sales, Purchasing, Business Partner Debt Balance, and Reporting sections above.

**Resolved by Approved Human Decision (2026-07-31, ADR-031):** Current release is static AZN only; no Currency CRUD or currency selectors on Products, Business Partners, Purchases, or Sales. Currency is reserved for future Cash only. The 2026-07-28 optional multi-currency decision is superseded for the active product. Exchange-rate source/timing and non-AZN money-account balances remain undecided until future Cash work is activated — they are not open for current domains. See "## Currency" above.

**Resolved by Approved Human Decision (2026-08-01, ADR-032–037 / CHANGE-004):** Multi-Cash-Account domain — any number of named Cash Accounts as data; balance only via transactions; atomic transfers preserving Total Company Cash; immutable cash with reversals; ordinary cash without Draft; controlled negative cash with mandatory reason (amount/age/case still open). BRD-OD-03 resolved. See "## Cash" and "## Expenses" above.
