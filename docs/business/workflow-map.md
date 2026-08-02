# Business Workflow Map

> Source: `docs/analysis/01-document-analysis.md` (the single source of truth for this document). Each workflow below reflects business behavior only — no APIs, database structures, or other implementation details are included. Where the underlying analysis notes an open decision or a conflict, the workflow description reflects only the confirmed part of the flow.

## How to Read This Map

Workflows are grouped by business area and numbered as in the source analysis (Section 5, "Main Business Workflows"). After the individual workflow entries, a **Workflow Relationships** section shows how these groups connect to each other logically.

---

## Sales Workflows

### 1. Sale: Draft to Posted Sale
- **Purpose:** Record the delivery of products to a business partner and increase the partner's signed debt balance.
- **Trigger:** An authorized user needs to record a sale of products to a partner.
- **Main Steps:** Select partner → enter products, quantities, prices, discounts, due date, and channel → save/revise as a draft → revalidate product quantity and rules → post. Optionally, in the same UI flow, choose to also create a separate Cash In (Workflow 2/10) linked to this sale. No warehouse selection (ADR-029). No currency selection — amounts are AZN (ADR-031).
- **Result:** Product quantity decreases; partner Debt Balance increases by the sale amount (`+=`). Cash is never mutated by the Sale record itself. If the user also records payment in the same flow, a separate Cash In is posted (same atomic commit allowed) with its own identity and audit trail; that receipt decreases partner Debt Balance (ADR-028, ADR-030).
- **Involved Modules:** Sales, Products, Business Partners, Settlement, Costing; Cash only when an optional linked receipt is also created.
- **Dependencies:** Requires active Business Partner and Product Catalog data; feeds Sale Payment and Allocation, Sales Return, and Reporting.

### 2. Sale Payment and Allocation
- **Purpose:** Record money received for one or more sales via a separate cash transaction and decrease the partner's signed debt balance.
- **Trigger:** Money is received for sales, immediately (including from the sale UI) or later from the Cash module.
- **Main Steps:** Create customer receipt (Cash In) → optionally display open sales → propose oldest-due document links → user confirms/edits links (partial, multi-document, or none) → post. Excess receipt still decreases Debt Balance (advance represented by signed balance). Unlinked receipts are allowed.
- **Result:** The chosen money account increases; partner Debt Balance decreases by the received amount (`-=`). Sale documents are not edited in place.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** Depends on prior Sale posting (Workflow 1) when linking to sales; feeds Cash Closing and Business Partner Statement.

### 3. Sales Return
- **Purpose:** Record that a customer has returned all or part of a previously sold product.
- **Trigger:** A customer returns product(s) from a posted sale.
- **Main Steps:** Select original sale line and quantity → record reason and condition → calculate value/cost from original sale → restore resaleable product quantity or record write-off/quantity adjustment for damaged goods (no damaged warehouse — ADR-029) → decrease partner Debt Balance by the reversed sale amount → apply any cash refund as a separate Cash Out if needed.
- **Result:** Resaleable product quantity increases at original cost (or damaged goods are written off / adjusted); partner Debt Balance decreases; any cash refund is a separate cash fact (ADR-028, ADR-030).
- **Involved Modules:** Sales, Products, Settlement, Cash (if refunded).
- **Dependencies:** Requires an original posted Sale (Workflow 1); may trigger a Cash Out/refund (Workflow 11) if cash is returned.

### 4. Sale Cancellation
- **Purpose:** Void a posted sale that is invalid, when a return is not the correct commercial fix.
- **Trigger:** An authorized user identifies that a posted sale must be voided.
- **Main Steps:** Assess linked payments/returns → **cancel every linked non-reversal POSTED Cash In** as its own cash cancellation (ADR-035) — Sale cancel is blocked while any such cash remains Posted (`SALE_HAS_LINKED_POSTED_CASH`) → execute Sale cancellation → reverse product quantity (via reversing history rows) and decrease partner Debt Balance by the reversed sale amount (same atomic action) → optionally create a corrected replacement sale.
- **Result:** Original sale is retained but marked cancelled (number never reused); product-quantity and partner debt-balance effects are reversed. Sale cancel never mutates cash. Linked cash remains separate history (may show Cancelled) and is not treated as an active payment (ADR-028, ADR-030, CHANGE-006).
- **Involved Modules:** Sales, Products, Settlement, Cash, Audit.
- **Dependencies:** Requires an original posted Sale (Workflow 1); depends on prior cancellation of any related Posted Cash In (Workflow 10 / US-046).

### 36. Bundle Sale
- **Purpose:** Sell a defined commercial combination of products at one price while deducting and costing its individual components.
- **Trigger:** A customer buys an active promotional bundle.
- **Main Steps:** Add bundle line to sale → explode into component quantities for validation/history → calculate commercial total from bundle price and cost from components → post as part of the sale.
- **Result:** Each component's product quantity decreases; partner Debt Balance increases by the bundle sale price (ADR-030).
- **Involved Modules:** Bundles and Promotions, Sales, Products, Costing.
- **Dependencies:** Part of the Sale workflow (Workflow 1); depends on Bundle master data (components and effective price).

---

## Purchasing Workflows

### 5. Purchase: Draft to Posted Purchase
- **Purpose:** Record goods actually received from a supplier and decrease the partner's signed debt balance.
- **Trigger:** Goods or materials are physically received from a supplier.
- **Main Steps:** Enter supplier, actual products/quantities/prices, supplier invoice, receiver, due date, evidence → save draft if incomplete → verify → post. Optionally, in the same UI flow, choose to also create a separate Cash Out (Workflow 6/11) linked to this purchase. No warehouse selection (ADR-029). No currency selection — amounts are AZN (ADR-031).
- **Result:** Product quantity increases by actual received quantities at the applicable cost; partner Debt Balance decreases by the purchase amount (`-=`). Cash is never mutated by the Purchase record itself. If the user also records payment in the same flow, a separate Cash Out is posted (same atomic commit allowed) with its own identity and audit trail; that payment increases partner Debt Balance (ADR-028, ADR-030).
- **Involved Modules:** Purchasing, Products, Costing, Business Partners, Settlement; Cash only when an optional linked payment is also created.
- **Dependencies:** Requires active Supplier and Product Catalog data; feeds Supplier Payment and Allocation, Purchase Return, and Reporting.

### 6. Supplier Payment and Allocation
- **Purpose:** Record money paid to a supplier via a separate cash transaction and increase the partner's signed debt balance.
- **Trigger:** The company pays one or more purchases, immediately (including from the purchase UI) or later from the Cash module.
- **Main Steps:** Create supplier payment (Cash Out) → optionally show open purchases → propose document links → user confirms/edits (partial, multi-document, or none) → post. Excess payment still increases Debt Balance (advance represented by signed balance). Unlinked payments are allowed.
- **Result:** The source money account decreases; partner Debt Balance increases by the paid amount (`+=`). Purchase documents are not edited in place.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** Depends on prior Purchase posting (Workflow 5) when linking to purchases; feeds Cash Closing and Business Partner Statement.

### 7. Purchase Return
- **Purpose:** Return previously received goods to a supplier.
- **Trigger:** Purchased goods are returned to the supplier.
- **Main Steps:** Select original purchase lines → enter quantities/reason → decrease product quantity → increase partner Debt Balance by the reversed purchase amount → record any cash settlement as a separate Cash fact if already paid.
- **Result:** Product quantity decreases at original purchase cost; partner Debt Balance increases; any cash effect is a separate cash fact (ADR-028, ADR-030).
- **Involved Modules:** Purchasing, Products, Settlement, Cash (if refunded).
- **Dependencies:** Requires an original posted Purchase (Workflow 5); blocked if goods were already sold onward (see Sale workflow, Workflow 1).

### 35. Purchase Cancellation
- **Purpose:** Void a posted purchase that is invalid.
- **Trigger:** A posted purchase is invalid and must be reversed.
- **Main Steps:** Check sold/consumed quantity and returns → **cancel every linked non-reversal POSTED Cash Out** as its own cash cancellation (ADR-035) — Purchase cancel is blocked while any such cash remains Posted (`PURCHASE_HAS_LINKED_POSTED_CASH`) → post reversal of product quantity and increase partner Debt Balance by the reversed purchase amount (same atomic action; reversing history / balance-movement rows) → create a corrected replacement purchase if needed.
- **Result:** Purchase receipt and partner debt effect are reversed; blocked if available product quantity is insufficient to reverse (`PURCHASE_CANCEL_INSUFFICIENT_QUANTITY`). Purchase cancel never mutates cash. Linked cash remains separate history (may show Cancelled) and is not treated as an active payment (ADR-028, ADR-030, CHANGE-006).
- **Involved Modules:** Purchasing, Products, Settlement, Cash, Audit.
- **Dependencies:** Requires an original posted Purchase (Workflow 5); depends on product-quantity availability and prior cancellation of any related Posted Cash Out (Workflow 11 / US-046).

---

## Product Quantity Workflows

> Under ADR-029 there is no Warehouse or Stock module. Former Inventory Transfer / warehouse Stock Count workflows are cancelled or replaced by product-level quantity operations inside Products.

### 8. Inventory Transfer
- **Status:** **Cancelled / N/A under ADR-029.**
- **Purpose (historical):** Move stock between two warehouses, including central-to-vehicle or vehicle-to-central movement.
- **Notes:** Warehouses and transfers are abolished. Do not implement. Yatı loading must not use this workflow (see Field Sales section — deferred redesign).

### 9. Physical Quantity Check and Manual Adjustment
- **Purpose:** Reconcile a physical count of goods on hand with system product quantity (product-level; not per warehouse).
- **Trigger:** A physical count identifies a difference from `currentQuantity`.
- **Main Steps:** Compare physical count to system quantity → investigate source-document errors → approve legitimate differences → post Manual Quantity Adjustment (Product Quantity History) with reason.
- **Result:** Surplus increases and shortage decreases product quantity via auditable history rows; each variance is recorded with reason and approval. Replaces warehouse Stock Count (ADR-029).
- **Involved Modules:** Products, Audit.
- **Dependencies:** May uncover missing Sale or Purchase documents that must be entered separately; feeds Reporting. Former warehouse Stock Count process is obsolete.

### 37. Product Quantity Write-Off
- **Purpose:** Remove damaged, lost, obsolete, or expired goods from product quantity, or record approved internal use.
- **Trigger:** Goods are damaged, lost, obsolete, expired, or issued for approved use.
- **Main Steps:** Create write-off / quantity adjustment → record product, quantity, reason, evidence → approve → post Product Quantity History decrease.
- **Result:** Product quantity decreases; no cash or partner debt-balance effect. Not warehouse-scoped (ADR-029).
- **Involved Modules:** Products, Audit.
- **Dependencies:** May be identified during Physical Quantity Check (Workflow 9). Former warehouse-scoped write-off is obsolete.

### 32. Negative Quantity Case
- **Purpose:** Allow an authorized sale (or other decrease) to proceed when physical goods exist but their receipt has not yet been recorded, while making the resulting deficit visible and controlled.
- **Trigger:** A posting would take a product's `currentQuantity` below zero.
- **Main Steps:** Show deficit → authorize exception with mandatory reason (permission required; under ADR-025 v1 all active users have permission) → post source transaction with Product Quantity History → mark cost/profit provisional where applicable → clear when a later receipt arrives. Full BRD-OD-04 case machinery remains deferred.
- **Result:** Product quantity goes negative under a tracked, reasoned exception; later purchase raises it and closes (or partially closes) the case.
- **Involved Modules:** Products, Costing, Sales/Purchasing (as the source transaction), Audit.
- **Dependencies:** Depends on the source Sale (Workflow 1) or Purchase (Workflow 5) that triggered it; resolved by a later Purchase. Inventory Transfer (Workflow 8) is no longer a trigger (ADR-029).

---

## Cash Workflows

> Multi-Cash-Account domain (ADR-032–037 / CHANGE-004). All amounts AZN (ADR-031). Sale/Purchase never mutate cash directly (ADR-028).

### 10. Cash In
- **Purpose:** Record money entering a Cash Account **from a Business Partner** (ADR-038). Primary settlement path that increases cash and decreases partner debt (ADR-028, ADR-030).
- **Trigger:** Cash is physically received (from Cash module, or optionally via Sale “Receive payment” that creates this separate record — US-048).
- **Main Steps:** Default Cash Account to the logged-in user's responsible account (editable to any active account) → Business Partner → amount / date / note → optional Sale link → confirm cash + partner debt before/after → post in one step as the authenticated actor (ADR-036, ADR-040).
- **Result:** Selected Cash Account increases; partner Debt Balance decreases. Sale documents are not mutated.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** May accompany Sale Payment (Workflow 2). Feeds Cash Closing.

### 11. Cash Out
- **Purpose:** Record money leaving a Cash Account **paid to a Business Partner** (ADR-038). Primary settlement path that decreases cash and increases partner debt.
- **Trigger:** Money is paid (from Cash module, or optionally via Purchase “Pay now” — US-048).
- **Main Steps:** Default Cash Account to the logged-in user's responsible account (editable) → Business Partner → amount / date / note → optional Purchase link → balance check or negative override (ADR-037) → confirm cash + partner debt preview → post as the authenticated actor (ADR-040).
- **Result:** Source Cash Account decreases; partner Debt Balance increases. Purchase documents are not mutated.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** Overlaps with Supplier Payment and Allocation (Workflow 6) for multi-doc allocation later; feeds Cash Closing.

### 12. Expense
- **Purpose:** Record an ordinary business operating cost paid from a Cash Account (fuel, rent, utilities, salary, etc.) — **not** a partner settlement (ADR-038).
- **Trigger:** A business operating cost is paid from a Cash Account.
- **Main Steps:** Default Cash Account to the logged-in user's responsible account (editable) → Expense Category → amount / date → **required description** → confirm cash before/after + category → post as the authenticated actor. No Business Partner field (ADR-040).
- **Result:** Selected Cash Account decreases; partner debt unchanged.
- **Involved Modules:** Cash, Expenses.
- **Dependencies:** Expense categories; AD-07/AD-08 deferred; feeds reporting and Cash Closing.

### 13. Cash Transfer
- **Purpose:** Move money from one Cash Account to another as one atomic aggregate (ADR-034 / ADR-038).
- **Trigger:** Money must move between accounts.
- **Main Steps:** Default source to the logged-in user's responsible Cash Account (editable) → select source ≠ destination → amount/date/notes → balance check / override → confirm preview (source/target before/after; Total Company Cash unchanged) → post linked TRANSFER_OUT + TRANSFER_IN as the authenticated actor (ADR-040).
- **Result:** Source decreases and destination increases by equal amounts; Total Company Cash unchanged; not income/expense; no partner-debt effect.
- **Involved Modules:** Cash.
- **Dependencies:** Used by cash float moves between accounts.

### 14. Cash Closing
- **Purpose:** Reconcile system-calculated cash to physically counted cash per Cash Account.
- **Trigger:** End of day/shift or another configured cash-count point.
- **Main Steps:** Compare system and actual cash → if equal, record close → if different, investigate and enter a missing source document or obtain approval for an adjustment.
- **Result:** Cash is unchanged when equal; an approved difference adjusts the account to the actual amount via adjustment movement (ADR-033).
- **Involved Modules:** Cash, Audit.
- **Dependencies:** Consumes results of Workflows 10–13; feeds Period Closing (Workflow 34). Initial Multi-Cash stages may defer full closing UI.

### 33. Negative Cash Override
- **Purpose:** Allow an urgent, authorized Cash Out / Transfer Out even when it would make a Cash Account negative, while keeping the deficit visible and reasoned (ADR-037).
- **Trigger:** An urgent authorized payment would make a Cash Account negative.
- **Main Steps:** Show available vs required → require override reason → post real payment with before/after → surface negative balance on overview.
- **Result:** Account becomes negative under tracked reason; later receipt or funding clears it. False receipts to hide deficit are forbidden.
- **Involved Modules:** Cash, Audit.
- **Dependencies:** Source payment/transfer workflows. Amount/age/case lifecycle still open (BRD-OD-05 remainder).

---

## Settlement & Reporting Workflows

### 15. Business Partner Statement
- **Purpose:** Present a partner's activity for a date range for review or sharing.
- **Trigger:** An authorized user or partner requests a statement.
- **Main Steps:** Calculate opening signed Debt Balance → list sales/returns, purchases/returns, receipts/payments, and adjustments chronologically → show source-document links → calculate one running closing signed Debt Balance (ADR-030).
- **Result:** A read-only statement is produced; no ledger effect.
- **Involved Modules:** Business Partners, Settlement, Reporting.
- **Dependencies:** Draws on Sales (Workflow 1), Purchasing (Workflow 5), Sale/Purchase Payments (Workflows 2, 6), and Returns (Workflows 3, 7); feeds WhatsApp Statement Sharing (Workflow 28).

---

## Fixed Asset Workflows

### 17. Fixed Asset Lifecycle
- **Purpose:** Track an operational asset from acquisition through assignment, maintenance, and eventual sale or write-off.
- **Trigger:** An asset is acquired, assigned, moved, repaired, sold, lost, or written off.
- **Main Steps:** Record acquisition and cash/purchase link → create asset card → assign custody/location → record maintenance/repair and status history → on sale record buyer/cash → on write-off retain reason/approval.
- **Result:** A permanent asset history is maintained; cash decreases on acquisition/repair and increases on sale.
- **Involved Modules:** Fixed Assets, Cash, Business Partners, Attachments, Audit.
- **Dependencies:** Acquisition may depend on a Cash Receipt/Payment (Workflows 10–11); does not affect sellable product quantity (ADR-029).

---

## Field Sales (Yatı) Workflows

> **Deferred / withdrawn under ADR-029.** Vehicle-warehouse and warehouse-transfer loading are abolished. Field Sales (Yatı) must be redesigned without multi-location stock before implementation. Workflows 18–26 below are retained only as historical/deferred reference; they are **not** active design rules.

### 18. Yatı Trip Creation
- **Status:** **Deferred under ADR-029** (pending redesign without multi-location stock).
- **Purpose:** Plan a field sales trip for a region/date.
- **Trigger:** Management plans a field sales trip.
- **Main Steps:** Create unique trip → enter assignments, planned dates/route, planned customers, accounts, notes, and initial loading plan → keep in preparation. Do **not** assign vehicle warehouses.
- **Result:** A trip record exists in preparation, with no ledger effect yet (when redesigned).
- **Involved Modules:** Field Sales (Yatı).
- **Dependencies:** Precedes Yatı Loading (Workflow 19) after redesign.

### 19. Yatı Loading
- **Status:** **Withdrawn under ADR-029** (warehouse-transfer loading abolished); deferred pending redesign.
- **Purpose (historical):** Physically hand goods and starting cash to the trip responsible person via central-to-vehicle inventory transfer.
- **Notes:** Must not be implemented as Inventory Transfer (Workflow 8). Any future loading model must use the single product-quantity model without vehicle warehouses. Cash float transfer (main → vehicle cash), if retained in redesign, is independent of warehouses and still deferred with Yatı.

### 20. Yatı Field Sale
- **Status:** **Deferred under ADR-029** pending redesign.
- **Purpose:** Deliver goods to a partner during an active trip.
- **Notes:** Must not draw from a vehicle warehouse. After redesign, quantity effects must use company-wide product quantity (same as Workflow 1), with cash separation per ADR-028. Do not implement the historical vehicle-warehouse variant.

### 21. Yatı Collection of Previous Balances
- **Status:** **Deferred under ADR-029** with Yatı redesign.
- **Purpose:** Collect money in the field against prior open sales without a new sale.
- **Main Steps (cash/settlement principle — still valid when redesigned):** Create field receipt → optionally show prior sales → link to selected/oldest documents → issue receipt (ADR-028). Partner Debt Balance decreases by the received amount (ADR-030).
- **Result:** Cash increases; partner Debt Balance decreases.
- **Involved Modules:** Field Sales (Yatı), Cash, Settlement.
- **Dependencies:** Depends on previously posted Sales. Does not itself require a vehicle warehouse.

### 22. Yatı Expense
- **Status:** **Deferred under ADR-029** with Yatı redesign.
- **Purpose:** Record a trip-related operating cost.
- **Notes:** Cash/expense principles remain those of Workflow 12; do not couple to a vehicle warehouse.

### 23. Yatı Return
- **Status:** **Withdrawn / deferred under ADR-029.**
- **Purpose (historical):** Record a customer's return of goods during a trip into a vehicle warehouse.
- **Notes:** Vehicle-warehouse receipt is abolished. After redesign, returns must restore company-wide product quantity (see Workflow 3).

### 24. Yatı Inventory Reconciliation
- **Status:** **Withdrawn under ADR-029.**
- **Purpose (historical):** Verify loaded/sold/returned/remaining trip inventory against vehicle warehouse stock.
- **Notes:** Vehicle-warehouse reconciliation is abolished with multi-location stock. Any future trip goods check must not reintroduce warehouses.

### 25. Yatı Cash Reconciliation
- **Status:** **Deferred under ADR-029** with Yatı redesign.
- **Purpose:** Verify that trip cash movements and physical cash agree.
- **Notes:** Cash reconciliation does not itself require a warehouse, but is deferred with the overall Yatı redesign so it is not implemented against the withdrawn vehicle-warehouse model.

### 26. Yatı Closing
- **Status:** **Withdrawn / deferred under ADR-029.**
- **Purpose (historical):** Finalize a trip once vehicle inventory and cash reconciliations are complete.
- **Notes:** Closing that requires vehicle stock to transfer back to central is withdrawn. Redesign must define closing without multi-location stock.

---

## Messaging & Evidence Workflows

### 27. WhatsApp Invoice Sharing
- **Purpose:** Send a posted invoice to a business partner.
- **Trigger:** An authorized user wants to send a posted invoice.
- **Main Steps:** Preview recipient, template, amount, open balance, and link → initiate user-controlled share or direct send → store result/reference → send a correction version after a later return/cancellation if needed.
- **Result:** No ledger effect; informational delivery only, never treated as payment confirmation.
- **Involved Modules:** Messaging and Document Sharing, Business Partners, Sales.
- **Dependencies:** Requires a posted Sale (Workflow 1; Workflow 20 only after Yatı redesign); may be re-triggered by Sales Return (Workflow 3) or Sale Cancellation (Workflow 4).

### 28. WhatsApp Statement Sharing
- **Purpose:** Send a partner statement for a date range.
- **Trigger:** An authorized user sends a partner statement.
- **Main Steps:** Preview date range, open documents, payments, one running signed Debt Balance, and recipient → generate a stable version → share → record result.
- **Result:** No ledger effect; informational delivery only.
- **Involved Modules:** Messaging and Document Sharing, Business Partners, Reporting.
- **Dependencies:** Depends on Business Partner Statement (Workflow 15).

### 29. Photo Evidence Attachment
- **Purpose:** Preserve visual/documentary evidence for a business event.
- **Trigger:** Goods, delivery note, receipt, damage, expense, trip, quantity check, or asset evidence is captured.
- **Main Steps:** Upload → validate type/size/hash → store metadata → link to target → review readability/duplicate suspicion → approve/reject the source document separately.
- **Result:** No ledger effect; only the linked source transaction's own posting changes ledgers.
- **Involved Modules:** Attachments and Mobile Evidence.
- **Dependencies:** Commonly linked to Purchase (Workflow 5), Expense (Workflow 12), Fixed Asset Lifecycle (Workflow 17), or Physical Quantity Check (Workflow 9). Yatı Expense (Workflow 22) only after redesign.

---

## Alerts Workflows

### 30. Minimum Quantity Alert
- **Purpose:** Make low product quantity visible to the right people (replaces warehouse-scoped Critical Stock Alert — ADR-029).
- **Trigger:** An approved product-quantity decrease crosses a product-level minimum threshold, worsens materially, remains unresolved, or later recovers.
- **Main Steps:** Calculate product-level basis → open or update alert → notify in-app and optionally by an external channel → allow acknowledgment/action status → resolve when quantity recovers.
- **Result:** No ledger effect beyond the source quantity history; an alert is opened, tracked, and eventually resolved.
- **Involved Modules:** Alerts, Products.
- **Dependencies:** Triggered by quantity-decreasing workflows (Sale, Write-Off / Manual Adjustment); resolved by a later Purchase or upward adjustment. Transfer is N/A (Workflow 8 cancelled).

### 31. Yellow Card Warning
- **Purpose:** Enforce a partner-specific reminder or restriction before a transaction proceeds.
- **Trigger:** A partner with an active note is selected for a transaction.
- **Main Steps:** Display note before continuation → INFO allows continuing → CONFIRM records acknowledgment/reason → BLOCK rejects unless an approved override policy applies.
- **Result:** No ledger effect by itself; it acts as a guard before the target transaction (e.g., Sale or Purchase) can post.
- **Involved Modules:** Alerts, Business Partners.
- **Dependencies:** Gates Sale (Workflow 1), Purchase (Workflow 5), or other partner-linked transactions. Yatı Field Sale (Workflow 20) only after redesign.

---

## Period Control & Correction Workflows

### 34. Period Closing
- **Purpose:** Lock a completed business period against further changes.
- **Trigger:** Management completes month-end or another approved period-end process.
- **Main Steps:** Run validations → resolve blockers → close period → reject subsequent business-date postings/changes for that period → reopen with reason if a correction is later required, then reclose.
- **Result:** No direct product-quantity/cash/partner debt-balance effect; it is a control event.
- **Involved Modules:** Audit, Cash, Products, Settlement.
- **Dependencies:** Depends on Cash Closing (Workflow 14) and Physical Quantity Check (Workflow 9) where applicable. Yatı Closing (Workflow 26) is deferred under ADR-029.

### 38. Correction and Reversal
- **Purpose:** Fix a mistake in a posted sale, purchase, money transaction, quantity adjustment, expense, share, or allocation.
- **Trigger:** A posted transaction is identified as wrong.
- **Main Steps:** Do not edit the original → choose a return when commercially accurate, otherwise cancel/reverse and recreate → reverse/reallocate payment where appropriate → create a new correction via Product Quantity History for a quantity adjustment → share a new document version if needed.
- **Result:** A compensating transaction posts; the original remains immutable and linked to its correction.
- **Involved Modules:** Audit, Sales, Purchasing, Cash, Products, Settlement.
- **Dependencies:** Underlies Sale Cancellation (Workflow 4), Purchase Cancellation (Workflow 35), and any reallocation within Settlement workflows. Warehouse count/transfer corrections are N/A (ADR-029).

### 39. Opening Balances and Cutover
- **Purpose:** Establish the company's approved starting position when go-live occurs.
- **Trigger:** Approved go-live cutover is performed.
- **Main Steps:** Enter opening product quantity with cost (per product, not per warehouse), cash by account, and signed partner Debt Balance (per partner; document links where possible), with disputed flags → run reconciliation → management signs off.
- **Result:** Opening quantity/cost per product, opening cash by account, and opening signed partner debt balances are established as a distinct migration action (ADR-029, ADR-030).
- **Involved Modules:** Migration and Opening Balances, Products, Cash, Settlement, Audit.
- **Dependencies:** Must precede all ordinary operational workflows (Sale, Purchase, Cash; Yatı after redesign) for a newly migrated business.

---

## Workflow Relationships

The workflows above connect into a small number of recurring logical chains. These chains show how one business event flows into the next; they do not represent a fixed technical sequence.

### Chain 1 — Core Sales Cycle

```
Sale (Draft → Posted)
      ↓
Product Quantity (decrease at posting; ADR-029)
      ↓
Partner Debt Balance (+= sale amount; ADR-030)
      ↓
Sale Payment and Allocation (separate Cash In -= debt; ADR-028)
      ↓
Cash (account increases; separate Cash In — ADR-028)
      ↓
Business Partner Statement / Reporting (one running signed balance)
```

Branches from this chain: **Sales Return** (reverses product quantity and decreases partner debt from a prior Sale), **Sale Cancellation** (reverses the whole Sale), **WhatsApp Invoice Sharing** (informational, no ledger effect), **Photo Evidence Attachment** (supporting evidence only).

### Chain 2 — Core Purchasing Cycle

```
Purchase (Draft → Posted)
      ↓
Product Quantity (increase at posting; ADR-029)
      ↓
Partner Debt Balance (-= purchase amount; ADR-030)
      ↓
Supplier Payment and Allocation (separate Cash Out += debt; ADR-028)
      ↓
Cash (account decreases; separate Cash Out — ADR-028)
      ↓
Business Partner Statement / Reporting (one running signed balance)
```

Branches from this chain: **Purchase Return** (reverses product quantity and increases partner debt from a prior Purchase), **Purchase Cancellation** (reverses the whole Purchase), **Photo Evidence Attachment** (receipt evidence).

### Chain 3 — Field Sales (Yatı) Cycle

**Withdrawn / deferred under ADR-029.** The historical chain (Loading as Inventory Transfer → vehicle warehouse Field Sale → vehicle Inventory Reconciliation → Closing transfer back) is **not** an active design rule. Yatı awaits redesign without multi-location stock. Cash collection/expense ideas that do not require vehicle warehouses remain deferred with that redesign (ADR-028 cash separation still applies when redesigned).

### Chain 4 — Cash Discipline Cycle

```
Cash Receipt / Supplier Payment / Expense / Cash Transfer
      ↓
Cash Closing (system balance vs. physical count)
      ↓
Negative Cash Case (if a deficit was authorized) ──→ later Cash Receipt clears it
      ↓
Period Closing
```

### Chain 5 — Product Quantity Discipline Cycle

```
Physical Quantity Check / Manual Adjustment / Write-Off
      ↓
Negative Quantity Case (if a deficit was authorized) ──→ later Purchase clears it
      ↓
Minimum Quantity Alert (triggered by any decrease crossing a product threshold)
      ↓
Period Closing
```

Inventory Transfer (Workflow 8) is cancelled under ADR-029 and is not part of this chain.

### Chain 6 — Correction Overlay

Correction and Reversal is not a separate linear stage; it overlays every other chain. Any posted Sale, Purchase, Cash movement, Quantity Adjustment, or Expense can be corrected only through this shared mechanism (return, cancellation/reversal, or reallocation), never by editing the original document. Sale Cancellation and Purchase Cancellation are specific applications of this shared correction mechanism. Warehouse Count/Transfer corrections are N/A.

### Chain 7 — Guards and Governance Overlay

Yellow Card Warning and Minimum Quantity Alert act as guards that sit in front of Chain 1 and Chain 2 rather than after them — they intercept a transaction before or as it posts. Audit and Period Closing sit underneath every chain, recording every event and eventually locking a completed period against further change. Chain 3 (Yatı) is deferred under ADR-029.

### Chain 8 — Non-Ledger Support Workflows

WhatsApp Invoice Sharing, WhatsApp Statement Sharing, and Photo Evidence Attachment never themselves post ledger effects. They attach to and follow events in Chains 1 and 2 (an invoice follows a Sale; a statement follows the Business Partner Statement; a photo follows a Purchase or Expense). Yatı attachments await redesign.

### Chain 9 — Foundational Workflow

Opening Balances and Cutover is the one workflow that must complete before any of Chains 1–5 can meaningfully begin for a newly migrated business, since it establishes the starting product quantities, cash, and signed partner debt positions that all subsequent workflows build upon.
