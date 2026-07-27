# Business Workflow Map

> Source: `docs/analysis/01-document-analysis.md` (the single source of truth for this document). Each workflow below reflects business behavior only — no APIs, database structures, or other implementation details are included. Where the underlying analysis notes an open decision or a conflict, the workflow description reflects only the confirmed part of the flow.

## How to Read This Map

Workflows are grouped by business area and numbered as in the source analysis (Section 5, "Main Business Workflows"). After the individual workflow entries, a **Workflow Relationships** section shows how these groups connect to each other logically.

---

## Sales Workflows

### 1. Sale: Draft to Posted Sale
- **Purpose:** Record the delivery of products to a business partner and establish the resulting receivable.
- **Trigger:** An authorized user needs to record a sale of products to a partner.
- **Main Steps:** Select partner and warehouse → enter products, quantities, prices, discounts, due date, and channel → save/revise as a draft → revalidate stock and rules → post.
- **Result:** Inventory decreases at the source warehouse; a receivable is created for the sale amount; any payment received in the same flow reduces it.
- **Involved Modules:** Sales, Inventory, Business Partners, Settlement, Costing.
- **Dependencies:** Requires active Business Partner and Product Catalog data; feeds Sale Payment and Allocation, Sales Return, and Reporting.

### 2. Sale Payment and Allocation
- **Purpose:** Record money received for one or more open sales and reduce the corresponding receivables.
- **Trigger:** Money is received for open sales, immediately or later.
- **Main Steps:** Create customer receipt → display open sales → propose oldest-due allocation → user confirms/edits allocations → retain any excess as customer advance → post.
- **Result:** The chosen money account increases; allocated receivables decrease; unallocated excess becomes a customer advance.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** Depends on prior Sale posting (Workflow 1) to have open receivables; feeds Cash Closing and Business Partner Statement.

### 3. Sales Return
- **Purpose:** Record that a customer has returned all or part of a previously sold product.
- **Trigger:** A customer returns product(s) from a posted sale.
- **Main Steps:** Select original sale line and quantity → record reason and condition → calculate value/cost from original sale → receive into resaleable or damaged location → reduce receivable first → apply excess as advance or cash refund.
- **Result:** Resaleable stock increases at original cost; the open receivable decreases; any excess becomes a refund/advance.
- **Involved Modules:** Sales, Inventory, Settlement, Cash (if refunded).
- **Dependencies:** Requires an original posted Sale (Workflow 1); may trigger a Cash Receipt/refund (Workflow 10) if cash is returned.

### 4. Sale Cancellation
- **Purpose:** Void a posted sale that is invalid, when a return is not the correct commercial fix.
- **Trigger:** An authorized user identifies that a posted sale must be voided.
- **Main Steps:** Assess linked payments/returns → unallocate or resolve payments → execute cancellation → create opposite stock/receivable/cash effects → optionally create a corrected replacement sale.
- **Result:** Original sale is retained but marked cancelled (number never reused); its stock, receivable, and eligible cash effects are reversed.
- **Involved Modules:** Sales, Inventory, Settlement, Cash, Audit.
- **Dependencies:** Requires an original posted Sale (Workflow 1); depends on resolution of any related Sale Payment and Allocation (Workflow 2).

### 36. Bundle Sale
- **Purpose:** Sell a defined commercial combination of products at one price while deducting and costing its individual components.
- **Trigger:** A customer buys an active promotional bundle.
- **Main Steps:** Add bundle line to sale → explode into component quantities for validation/movement → calculate commercial total from bundle price and cost from components → post as part of the sale.
- **Result:** Each component decreases in inventory; the receivable reflects the bundle sale price.
- **Involved Modules:** Bundles and Promotions, Sales, Inventory, Costing.
- **Dependencies:** Part of the Sale workflow (Workflow 1); depends on Bundle master data (components and effective price).

---

## Purchasing Workflows

### 5. Purchase: Draft to Posted Purchase
- **Purpose:** Record goods actually received from a supplier and establish the resulting payable.
- **Trigger:** Goods or materials are physically received from a supplier.
- **Main Steps:** Enter supplier, actual products/quantities/prices, supplier invoice, receiver, due date, evidence → save draft if incomplete → verify → post.
- **Result:** Inventory increases by actual received quantities at the applicable cost; a payable is created for the purchase amount.
- **Involved Modules:** Purchasing, Inventory, Costing, Business Partners, Settlement.
- **Dependencies:** Requires active Supplier and Product Catalog data; feeds Supplier Payment and Allocation, Purchase Return, and Reporting.

### 6. Supplier Payment and Allocation
- **Purpose:** Record money paid to a supplier and reduce the corresponding payables.
- **Trigger:** The company pays one or more open purchases.
- **Main Steps:** Create supplier payment → show open purchases → propose allocation order → user confirms/edits → retain any excess as supplier advance → post.
- **Result:** The source money account decreases; allocated payables decrease; unallocated excess becomes a supplier advance.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** Depends on prior Purchase posting (Workflow 5) to have open payables; feeds Cash Closing and Business Partner Statement.

### 7. Purchase Return
- **Purpose:** Return previously received goods to a supplier.
- **Trigger:** Purchased goods are returned to the supplier.
- **Main Steps:** Select original purchase lines → enter quantities/reason → issue stock → reduce payable first → record supplier-side settlement (credit/advance/receivable/refund) if already paid.
- **Result:** Inventory decreases at original purchase cost; the open payable decreases; any excess is settled with the supplier.
- **Involved Modules:** Purchasing, Inventory, Settlement, Cash (if refunded).
- **Dependencies:** Requires an original posted Purchase (Workflow 5); blocked if goods were already sold onward (see Sale workflow, Workflow 1).

### 35. Purchase Cancellation
- **Purpose:** Void a posted purchase that is invalid.
- **Trigger:** A posted purchase is invalid and must be reversed.
- **Main Steps:** Check sold/consumed quantity and returns → unallocate or resolve linked payments → post reversal → create a corrected replacement purchase if needed.
- **Result:** Purchase receipt and payable are reversed; blocked if available stock is insufficient to reverse.
- **Involved Modules:** Purchasing, Inventory, Settlement, Cash, Audit.
- **Dependencies:** Requires an original posted Purchase (Workflow 5); depends on Inventory availability and any Supplier Payment and Allocation (Workflow 6).

---

## Inventory Workflows

### 8. Inventory Transfer
- **Purpose:** Move stock between two warehouses, including central-to-vehicle or vehicle-to-central movement.
- **Trigger:** Stock must move between warehouses.
- **Main Steps:** Create transfer → enter lines and reason → verify source stock → post paired issue and receipt.
- **Result:** Source warehouse decreases and destination warehouse increases by equal amounts; company-total quantity and value are unchanged.
- **Involved Modules:** Inventory.
- **Dependencies:** Feeds/depends on Yatı Loading (Workflow 19) and Yatı Inventory Reconciliation (Workflow 24) for vehicle-related transfers.

### 9. Stock Count and Adjustment
- **Purpose:** Reconcile physical count results with system quantities.
- **Trigger:** A physical count identifies a difference from system quantity.
- **Main Steps:** Create count → enter actual quantities → calculate differences → investigate source-document errors → approve legitimate differences → post surplus/shortage movements.
- **Result:** Surplus increases and shortage decreases inventory for the affected products; each variance is recorded with reason and approval.
- **Involved Modules:** Inventory, Audit.
- **Dependencies:** May uncover missing Sale, Purchase, or Transfer documents that must be entered separately; feeds Reporting.

### 37. Inventory Write-Off
- **Purpose:** Remove damaged, lost, obsolete, or expired goods from stock, or record approved internal use.
- **Trigger:** Goods are damaged, lost, obsolete, expired, or issued for approved use.
- **Main Steps:** Create write-off → record product, quantity, reason, evidence → approve → post.
- **Result:** Stock decreases at the selected warehouse; no cash or receivable/payable effect.
- **Involved Modules:** Inventory, Audit.
- **Dependencies:** May be identified during Stock Count (Workflow 9) or Yatı Inventory Reconciliation (Workflow 24).

### 32. Negative Stock Case
- **Purpose:** Allow an authorized sale or transfer to proceed when physical goods exist but their receipt has not yet been recorded, while making the resulting deficit visible and controlled.
- **Trigger:** A posting would take a product/warehouse's stock below zero.
- **Main Steps:** Show deficit → authorize exception with reason → post source transaction → open negative-stock case → mark cost/profit provisional → clear when a later receipt arrives.
- **Result:** Warehouse balance goes negative under a tracked, reasoned exception; later receipt raises it and closes (or partially closes) the case.
- **Involved Modules:** Inventory, Costing, Sales/Purchasing (as the source transaction), Audit.
- **Dependencies:** Depends on the source Sale (Workflow 1), Purchase (Workflow 5), or Inventory Transfer (Workflow 8) that triggered it; resolved by a later Purchase.

---

## Cash Workflows

### 10. Cash Receipt
- **Purpose:** Record cash physically received from a customer, a supplier refund, an owner contribution, or another approved source.
- **Trigger:** Cash is physically received.
- **Main Steps:** Select movement type and account → enter amount/source → allocate to receivables where applicable, or record as advance/refund/contribution → post.
- **Result:** The destination money account increases; receivable/payable effect depends on the movement type.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** May be part of Sale Payment and Allocation (Workflow 2) or Yatı Collection (Workflow 21); feeds Cash Closing.

### 11. Supplier Payment
- **Purpose:** Pay money to a supplier before, during, or independent of a specific purchase.
- **Trigger:** Money is paid to a supplier.
- **Main Steps:** Create payment → optionally allocate to open purchases → retain unallocated amount as supplier advance → post.
- **Result:** The source money account decreases; allocation decreases payable, or an advance is created.
- **Involved Modules:** Cash, Settlement, Business Partners.
- **Dependencies:** Overlaps with Supplier Payment and Allocation (Workflow 6); feeds Cash Closing.

### 12. Expense
- **Purpose:** Record an actual business operating cost.
- **Trigger:** A business operating cost is incurred and paid.
- **Main Steps:** Capture details/evidence → distinguish a physical-product purchase from an expense → distinguish business-account payment from personal funds → obtain approval if a limit is exceeded → post.
- **Result:** The business account decreases only if it paid; a personal payment creates a reimbursable amount instead.
- **Involved Modules:** Expenses, Cash, Attachments.
- **Dependencies:** May be linked to a Fixed Asset (Workflow 17) or a Yatı Trip (Workflow 22); feeds Cash Closing.

### 13. Cash Transfer
- **Purpose:** Move money from one money account to another.
- **Trigger:** Money must move between accounts.
- **Main Steps:** Select accounts/amount/date → post paired transfer-out and transfer-in with one reference.
- **Result:** Source account decreases and destination account increases by equal amounts; company-total cash is unchanged.
- **Involved Modules:** Cash.
- **Dependencies:** Used by Yatı Loading (Workflow 19, starting float) and Yatı Cash Reconciliation (Workflow 25, handover to main account).

### 14. Cash Closing
- **Purpose:** Reconcile system-calculated cash to physically counted cash.
- **Trigger:** End of day/shift or another configured cash-count point.
- **Main Steps:** Compare system and actual cash → if equal, record close → if different, investigate and enter a missing source document or obtain approval for an adjustment.
- **Result:** Cash is unchanged when equal; an approved difference adjusts the account to the actual amount.
- **Involved Modules:** Cash, Audit.
- **Dependencies:** Consumes results of Cash Receipt (Workflow 10), Supplier Payment (Workflow 11), Expense (Workflow 12), and Cash Transfer (Workflow 13); feeds Period Closing (Workflow 34).

### 33. Negative Cash Case
- **Purpose:** Allow an urgent, authorized payment to proceed even when it would make a money account negative, while keeping the deficit visible and controlled.
- **Trigger:** An urgent authorized payment would make a money account negative.
- **Main Steps:** Show deficit → select reason → post real payment and open case → display exception status → clear via later valid receipt/funding.
- **Result:** The account becomes negative under a tracked exception; a later receipt or personal funding clears it.
- **Involved Modules:** Cash, Audit.
- **Dependencies:** Depends on the source payment (e.g., Supplier Payment, Workflow 11, or Yatı Expense, Workflow 22); resolved by Cash Receipt (Workflow 10) or personal financing.

---

## Settlement & Reporting Workflows

### 15. Business Partner Statement
- **Purpose:** Present a partner's activity for a date range for review or sharing.
- **Trigger:** An authorized user or partner requests a statement.
- **Main Steps:** Calculate opening balance → list sales/returns, purchases/returns, receipts/payments, advances, and adjustments chronologically → show source-document links → calculate closing balances separately by direction.
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
- **Dependencies:** Acquisition may depend on a Cash Receipt/Payment (Workflows 10–11); does not affect sellable inventory.

---

## Field Sales (Yatı) Workflows

### 18. Yatı Trip Creation
- **Purpose:** Plan a field sales trip for a region/date.
- **Trigger:** Management plans a field sales trip.
- **Main Steps:** Create unique trip → enter assignments, planned dates/route, planned customers, warehouses/accounts, notes, and initial loading plan → keep in preparation.
- **Result:** A trip record exists in preparation, with no ledger effect yet.
- **Involved Modules:** Field Sales (Yatı).
- **Dependencies:** Precedes Yatı Loading (Workflow 19).

### 19. Yatı Loading
- **Purpose:** Physically hand goods and starting cash to the trip responsible person.
- **Trigger:** Goods and optionally starting expense cash are handed to the trip responsible person.
- **Main Steps:** Confirm actual load → post central-to-vehicle transfer → transfer starting float main-to-vehicle → record any additional load or return as separate later movements.
- **Result:** Main warehouse decreases and vehicle warehouse increases equally; main cash decreases and vehicle cash increases equally if a float is issued; this is not a sale.
- **Involved Modules:** Field Sales (Yatı), Inventory, Cash.
- **Dependencies:** Depends on Yatı Trip Creation (Workflow 18); uses Inventory Transfer (Workflow 8) and Cash Transfer (Workflow 13) mechanics; precedes Yatı Field Sale (Workflow 20).

### 20. Yatı Field Sale
- **Purpose:** Deliver goods to a partner during an active trip.
- **Trigger:** Goods are delivered to a partner during an active trip.
- **Main Steps:** Create sale linked to trip and vehicle warehouse → enter products/bundle and settlement → post → optionally share invoice.
- **Result:** Vehicle stock (or bundle components) decrease; received amount increases vehicle cash; unpaid portion creates a receivable.
- **Involved Modules:** Field Sales (Yatı), Sales, Inventory, Cash, Settlement.
- **Dependencies:** Depends on Yatı Loading (Workflow 19) for available vehicle stock; is a variant of the general Sale workflow (Workflow 1); may trigger WhatsApp Invoice Sharing (Workflow 27).

### 21. Yatı Collection of Previous Balances
- **Purpose:** Collect money in the field against prior open sales without a new sale.
- **Trigger:** The representative receives money against prior open sales.
- **Main Steps:** Create field receipt → show prior open sales → allocate to selected/oldest documents → retain excess as customer advance → issue receipt.
- **Result:** Vehicle cash increases; allocated receivables decrease; excess becomes a customer advance.
- **Involved Modules:** Field Sales (Yatı), Cash, Settlement.
- **Dependencies:** Depends on previously posted Sales (Workflow 1 or 20) having open receivables.

### 22. Yatı Expense
- **Purpose:** Record a trip-related operating cost.
- **Trigger:** Fuel, meal, toll, parking, minor repair, accommodation, or another trip cost is paid.
- **Main Steps:** Capture details/photo → select trip and payer → obtain limit approval where required → post expense.
- **Result:** Vehicle cash decreases only if it paid; personal payment creates a reimbursable amount instead.
- **Involved Modules:** Field Sales (Yatı), Expenses, Cash, Attachments.
- **Dependencies:** Is a variant of the general Expense workflow (Workflow 12), scoped to the trip's vehicle cash account.

### 23. Yatı Return
- **Purpose:** Record a customer's return of goods during a trip.
- **Trigger:** A customer returns goods during a trip.
- **Main Steps:** Create linked sales return → receive resaleable item to vehicle warehouse or damaged location → reduce receivable first → record advance/refund as required.
- **Result:** Vehicle or damaged stock increases; vehicle cash decreases only for an actual refund; receivable decreases.
- **Involved Modules:** Field Sales (Yatı), Sales, Inventory, Cash, Settlement.
- **Dependencies:** Is a variant of the general Sales Return workflow (Workflow 3), scoped to the trip's vehicle warehouse/account.

### 24. Yatı Inventory Reconciliation
- **Purpose:** Verify that loaded, sold, returned, and remaining trip inventory account for all vehicle stock.
- **Trigger:** Trip returns and enters reconciliation.
- **Main Steps:** Compare loaded + additional load + customer returns against sales/deliveries + damage/loss + returned-to-central + physical remainder → investigate each product → enter missing real documents or approved adjustments → return remaining goods.
- **Result:** Remaining goods transfer vehicle-to-central; approved differences create explicit movements.
- **Involved Modules:** Field Sales (Yatı), Inventory, Audit.
- **Dependencies:** Depends on Yatı Loading (Workflow 19), Yatı Field Sale (Workflow 20), and Yatı Return (Workflow 23); precedes Yatı Closing (Workflow 26).

### 25. Yatı Cash Reconciliation
- **Purpose:** Verify that trip cash movements and physical cash agree.
- **Trigger:** Trip cash is counted during reconciliation.
- **Main Steps:** Calculate expected cash → compare actual → enter missing real source documents or approved cash difference → transfer remaining cash to main account or retain approved float.
- **Result:** Vehicle cash decreases and main cash increases for the handover; approved differences adjust vehicle cash; company total is unchanged by the handover.
- **Involved Modules:** Field Sales (Yatı), Cash, Audit.
- **Dependencies:** Depends on Yatı Loading (Workflow 19), Yatı Field Sale (Workflow 20), Yatı Collection (Workflow 21), and Yatı Expense (Workflow 22); precedes Yatı Closing (Workflow 26).

### 26. Yatı Closing
- **Purpose:** Finalize a trip once its inventory and cash reconciliations are complete.
- **Trigger:** Inventory and cash reconciliations are complete and differences resolved or approved.
- **Main Steps:** Validate reconciliation guards → post final transfers/adjustments → capture representative and manager acknowledgment → mark trip closed and issue summary.
- **Result:** Vehicle stock normally reaches zero (transferred to central); remaining vehicle cash normally transfers to main; the trip's control state becomes closed.
- **Involved Modules:** Field Sales (Yatı), Inventory, Cash, Audit.
- **Dependencies:** Depends on Yatı Inventory Reconciliation (Workflow 24) and Yatı Cash Reconciliation (Workflow 25).

---

## Messaging & Evidence Workflows

### 27. WhatsApp Invoice Sharing
- **Purpose:** Send a posted invoice to a business partner.
- **Trigger:** An authorized user wants to send a posted invoice.
- **Main Steps:** Preview recipient, template, amount, open balance, and link → initiate user-controlled share or direct send → store result/reference → send a correction version after a later return/cancellation if needed.
- **Result:** No ledger effect; informational delivery only, never treated as payment confirmation.
- **Involved Modules:** Messaging and Document Sharing, Business Partners, Sales.
- **Dependencies:** Requires a posted Sale (Workflow 1 or 20); may be re-triggered by Sales Return (Workflow 3) or Sale Cancellation (Workflow 4).

### 28. WhatsApp Statement Sharing
- **Purpose:** Send a partner statement for a date range.
- **Trigger:** An authorized user sends a partner statement.
- **Main Steps:** Preview date range, open documents, payments, advances, separate receivable/payable, and recipient → generate a stable version → share → record result.
- **Result:** No ledger effect; informational delivery only.
- **Involved Modules:** Messaging and Document Sharing, Business Partners, Reporting.
- **Dependencies:** Depends on Business Partner Statement (Workflow 15).

### 29. Photo Evidence Attachment
- **Purpose:** Preserve visual/documentary evidence for a business event.
- **Trigger:** Goods, delivery note, receipt, damage, expense, trip, count, or asset evidence is captured.
- **Main Steps:** Upload → validate type/size/hash → store metadata → link to target → review readability/duplicate suspicion → approve/reject the source document separately.
- **Result:** No ledger effect; only the linked source transaction's own posting changes ledgers.
- **Involved Modules:** Attachments and Mobile Evidence.
- **Dependencies:** Commonly linked to Purchase (Workflow 5), Expense (Workflow 12), Yatı Expense (Workflow 22), Fixed Asset Lifecycle (Workflow 17), or Stock Count (Workflow 9).

---

## Alerts Workflows

### 30. Critical Stock Alert
- **Purpose:** Make stock shortages visible to the right people.
- **Trigger:** An approved inventory movement crosses a threshold, worsens materially, remains unresolved, or later recovers.
- **Main Steps:** Calculate correct basis → open or update alert → notify in-app and optionally by an external channel → allow acknowledgment/action status → resolve when stock recovers.
- **Result:** No ledger effect beyond the source movement; an alert is opened, tracked, and eventually resolved.
- **Involved Modules:** Alerts, Inventory.
- **Dependencies:** Triggered by any inventory-decreasing workflow (Sale, Yatí Field Sale, Transfer, Write-Off); resolved by a later Purchase or Transfer.

### 31. Yellow Card Warning
- **Purpose:** Enforce a partner-specific reminder or restriction before a transaction proceeds.
- **Trigger:** A partner with an active note is selected for a transaction.
- **Main Steps:** Display note before continuation → INFO allows continuing → CONFIRM records acknowledgment/reason → BLOCK rejects unless an approved override policy applies.
- **Result:** No ledger effect by itself; it acts as a guard before the target transaction (e.g., Sale or Purchase) can post.
- **Involved Modules:** Alerts, Business Partners.
- **Dependencies:** Gates Sale (Workflow 1), Yatı Field Sale (Workflow 20), Purchase (Workflow 5), or other partner-linked transactions.

---

## Period Control & Correction Workflows

### 34. Period Closing
- **Purpose:** Lock a completed business period against further changes.
- **Trigger:** Management completes month-end or another approved period-end process.
- **Main Steps:** Run validations → resolve blockers → close period → reject subsequent business-date postings/changes for that period → reopen with reason if a correction is later required, then reclose.
- **Result:** No direct inventory/cash/receivable effect; it is a control event.
- **Involved Modules:** Audit, Cash, Inventory, Settlement.
- **Dependencies:** Depends on Cash Closing (Workflow 14), Stock Count (Workflow 9), and Yatı Closing (Workflow 26) being resolved beforehand.

### 38. Correction and Reversal
- **Purpose:** Fix a mistake in a posted sale, purchase, money transaction, count, transfer, expense, share, or allocation.
- **Trigger:** A posted transaction is identified as wrong.
- **Main Steps:** Do not edit the original → choose a return when commercially accurate, otherwise cancel/reverse and recreate → reverse/reallocate payment where appropriate → create a new correction document for a posted count → share a new document version if needed.
- **Result:** A compensating transaction posts; the original remains immutable and linked to its correction.
- **Involved Modules:** Audit, Sales, Purchasing, Cash, Inventory, Settlement.
- **Dependencies:** Underlies Sale Cancellation (Workflow 4), Purchase Cancellation (Workflow 35), and any reallocation within Settlement workflows.

### 39. Opening Balances and Cutover
- **Purpose:** Establish the company's approved starting position when go-live occurs.
- **Trigger:** Approved go-live cutover is performed.
- **Main Steps:** Enter opening stock with cost, cash by account, receivable/payable by partner/document where possible, and advances, with disputed flags → run reconciliation → management signs off.
- **Result:** Opening quantity/cost by warehouse, opening cash by account, and opening receivable/payable/advance balances are established as a distinct migration action.
- **Involved Modules:** Migration and Opening Balances, Inventory, Cash, Settlement, Audit.
- **Dependencies:** Must precede all ordinary operational workflows (Sale, Purchase, Cash, Yatı) for a newly migrated business.

---

## Workflow Relationships

The workflows above connect into a small number of recurring logical chains. These chains show how one business event flows into the next; they do not represent a fixed technical sequence.

### Chain 1 — Core Sales Cycle

```
Sale (Draft → Posted)
      ↓
Inventory (decrease at posting)
      ↓
Receivable (created for unpaid amount)
      ↓
Sale Payment and Allocation (settles receivable)
      ↓
Cash (account increases)
      ↓
Business Partner Statement / Reporting
```

Branches from this chain: **Sales Return** (reverses inventory/receivable from a prior Sale), **Sale Cancellation** (reverses the whole Sale), **WhatsApp Invoice Sharing** (informational, no ledger effect), **Photo Evidence Attachment** (supporting evidence only).

### Chain 2 — Core Purchasing Cycle

```
Purchase (Draft → Posted)
      ↓
Inventory (increase at posting)
      ↓
Payable (created for unpaid amount)
      ↓
Supplier Payment and Allocation (settles payable)
      ↓
Cash (account decreases)
      ↓
Business Partner Statement / Reporting
```

Branches from this chain: **Purchase Return** (reverses inventory/payable from a prior Purchase), **Purchase Cancellation** (reverses the whole Purchase), **Photo Evidence Attachment** (receipt evidence).

### Chain 3 — Field Sales (Yatí) Cycle

```
Yatı Trip Creation
      ↓
Yatı Loading (Inventory Transfer + Cash Transfer: main → vehicle)
      ↓
Yatı Field Sale ──→ Inventory (vehicle decrease) ──→ Receivable ──→ Cash (vehicle increase)
      │
      ├──→ Yatı Collection of Previous Balances (settles earlier receivables)
      ├──→ Yatı Return (reverses part of a Yatı/central Sale)
      └──→ Yatı Expense (vehicle cash decrease)
      ↓
Yatı Inventory Reconciliation ──┐
Yatı Cash Reconciliation ───────┤
      ↓
Yatı Closing (Inventory Transfer + Cash Transfer: vehicle → main)
```

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

### Chain 5 — Inventory Discipline Cycle

```
Inventory Transfer / Stock Count / Inventory Write-Off
      ↓
Negative Stock Case (if a deficit was authorized) ──→ later Purchase clears it
      ↓
Critical Stock Alert (triggered by any decrease crossing a threshold)
      ↓
Period Closing
```

### Chain 6 — Correction Overlay

Correction and Reversal is not a separate linear stage; it overlays every other chain. Any posted Sale, Purchase, Cash movement, Count, Transfer, or Expense can be corrected only through this shared mechanism (return, cancellation/reversal, or reallocation), never by editing the original document. Sale Cancellation and Purchase Cancellation are specific applications of this shared correction mechanism.

### Chain 7 — Guards and Governance Overlay

Yellow Card Warning and (for inventory) Critical Stock Alert act as guards that sit in front of Chain 1, Chain 2, and Chain 3 rather than after them — they intercept a transaction before or as it posts. Audit and Period Closing sit underneath every chain, recording every event and eventually locking a completed period against further change.

### Chain 8 — Non-Ledger Support Workflows

WhatsApp Invoice Sharing, WhatsApp Statement Sharing, and Photo Evidence Attachment never themselves post ledger effects. They attach to and follow events in Chains 1, 2, and 3 (an invoice follows a Sale; a statement follows the Business Partner Statement; a photo follows a Purchase, Expense, or Yatı event).

### Chain 9 — Foundational Workflow

Opening Balances and Cutover is the one workflow that must complete before any of Chains 1–5 can meaningfully begin for a newly migrated business, since it establishes the starting inventory, cash, and receivable/payable positions that all subsequent workflows build upon.
