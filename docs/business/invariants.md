# Business Invariants

> Source: `docs/analysis/01-document-analysis.md` (the single source of truth for this document). Each invariant below is a confirmed business truth stated in the Business Requirements Document (BRD) and, where consistent, the Software Requirements & Technical Specification (SRS/TDS). Recommendations, safe defaults, unresolved conflicts, and implementation details are intentionally excluded. Where the source analysis marked an item as an open decision or a conflict between documents, it is omitted here rather than resolved.

## Global Invariants

- Drafts have no inventory, cash, receivable, payable, cost, or profit effect.
- Posting is the official business event; all of a transaction's effects (inventory, cash, receivable/payable, cost, audit) are created together, or not at all.
- A document's stated total must match the total calculated from its own lines; a mismatched total is not accepted as authoritative.
- Posted facts are not deleted or silently edited. Corrections happen only through a return, cancellation, reversal, reallocation, or an authorized adjustment.
- A reversal always preserves and links back to the original record; a cancelled document's number is never reused.
- Resubmitting the same action (for example after a network retry) must not create duplicate business effects.
- Money and quantity values must be calculated without loss of precision; rounding must not silently change an official amount.

## Users & Permissions

- Viewing a screen and performing a transaction are separate permissions.
- High-risk actions — posting, cancellation, backdating, high discount, stock adjustment, negative stock/cash override, trip closing, and period reopening — each require their own granular authorization.
- A single person may hold several role packages, but every sensitive action must remain attributable to one identifiable user account and the specific permission exercised.
- User accounts are personal; when employment ends, the account is deactivated, not deleted.
- No role may alter audit history.
- Enforcing a restriction only in the user interface is not sufficient; the restriction must hold wherever the action could otherwise be performed.
- Requiring the document creator and its approver to be different people is an optional business policy, not a mandatory rule by default.

## Business Partners

- One partner record represents the same person or company in both the customer role and the supplier role; the receivable direction and the payable direction are never merged into a single balance.
- Possible duplicate partners are flagged using normalized name, phone, tax number, and other identifiers before a new record is created.
- A partner that has been used in transactions is inactivated, not deleted.
- An inactive partner remains visible in historical documents but cannot be selected for new documents.
- Sales-specific and purchasing-specific Yellow Card notes must not be mixed when one partner acts as both customer and supplier.
- A partner's WhatsApp number, communication consent, preferred language, and sending history are controlled communication data.
- A business partner statement lists sales, sales returns, purchases, purchase returns, receipts, payments, advances, and approved adjustments chronologically, with source-document links, and shows the receivable and payable closing balances separately rather than netted.

## Products

- An active product code is unique; a product that has been used is inactivated, not deleted.
- Product type (finished good, raw material, or mixed-use) and product category are separate, independent classifications.
- Each product has exactly one primary unit of measure; whether fractional quantities are allowed follows that unit's configuration.
- Standard sale price and latest purchase price are informational defaults only; each posted document line keeps its own price and cost as recorded at posting time, regardless of later master-data changes.
- Setting a zero or negative price requires special permission and a stated justification.
- A critical (minimum) stock threshold must be capable of being evaluated at main-warehouse, specific-warehouse, and company-total levels separately.

## Sales

- A sale records the delivery of goods to a business partner together with price, discounts, total amount, and payment status.
- Posting a sale decreases the stock of the sold products (or the relevant bundle components) from the selected warehouse and creates a receivable for the unpaid amount.
- A sale may be posted fully paid, partially paid, or unpaid; any unpaid remainder becomes an open receivable.
- Stock sufficiency is checked before posting; a sale that would take stock below zero is blocked unless posted under an authorized, reasoned negative-stock exception.
- A sales return must reference an original posted sale and cannot exceed the quantity sold minus quantities already returned; it uses the original sale's price and cost.
- A returned, resaleable product increases stock at the original sale cost; damaged goods are directed to damaged-stock/write-off handling instead of ordinary resaleable stock.
- When settling a return, reducing the existing open receivable takes priority; only an excess beyond the open receivable becomes a refund or advance.
- After posting, a sale's prices and discounts are not directly edited; corrections use cancellation followed by a new document, or a return.
- Cancelling a posted sale reverses its stock, receivable, and eligible cash effects; the original document is retained and marked cancelled, its number is never reused, and any replacement document keeps a reference to the original.

## Purchasing

- A purchase records goods actually received from a supplier together with actual quantity, price, and payment status.
- Posting a purchase increases inventory by the actual received quantity and creates a payable for the unpaid amount.
- A purchase is posted based on the quantity actually physically received, not the invoiced quantity; differences between the two are recorded separately.
- Entering the same supplier invoice number more than once triggers a duplicate warning.
- A purchase return references the original purchase wherever possible, cannot exceed the unreturned quantity, and requires sufficient available stock; if the goods have already been sold onward, a physical return is not possible without a separately defined settlement.
- Cancelling a posted purchase reverses its inventory increase and payable effect; cancellation is blocked if available stock is insufficient to reverse the original receipt.
- Payments already linked to a purchase being cancelled must be unallocated or otherwise resolved as part of the cancellation.

## Inventory

- Inventory changes only through an explained, approved movement that is linked to a source document, warehouse, user, quantity, and cost.
- The current stock balance must always reconcile to (equal) the sum of its underlying, immutable stock movements.
- A warehouse transfer, including a central-to-vehicle or vehicle-to-central movement, changes the storage location only; it does not change company-total quantity or value.
- A physical stock count changes inventory only after approval; every variance requires a stated reason, and a material or high-value variance requires manager approval.
- Negative inventory is a temporary, visible exception limited by product, warehouse, and user, with a mandatory reason, a quantity/value limit, and an age limit; it does not represent physically available stock.
- Cancelling a transaction does not delete its original stock movement; a reversing movement is created instead.

## Costing

- A sale's cost is recorded (snapshotted) at the cost applicable at the time of posting; this snapshot does not change afterward even if the product's cost later changes.
- A sales return restores inventory using the cost recorded on the original sale.
- A purchase return reduces inventory using the cost of the original purchase wherever possible.
- Profit and inventory valuation remain provisional for as long as a negative-stock cost has not been resolved; the historical negative-stock movement is not deleted even after it is later cleared.

## Cash

- Cash changes only when money actually moves, or through an approved opening entry or an approved adjustment.
- Every money movement identifies the account, amount, date, movement type, actor, and business reason or source.
- The main cash account, bank account, vehicle cash accounts, and personal funds are separate; a movement recorded in one account is never used to silently increase another.
- A transfer between money accounts is a paired decrease/increase that does not change company-total cash.
- An owner's capital contribution is not sales revenue; an owner's withdrawal is not an operating expense.
- Negative cash is a visible, temporary exception requiring permission, a stated reason, an amount limit, and an age limit; it must never be concealed using a false receipt.
- Money paid using an employee's or the owner's personal funds is tracked as a separate reimbursable amount, not as a business-cash outflow.
- Cash closing compares the calculated (system) balance to the physically counted balance; any difference requires an investigated reason and, if it cannot be explained by a missing source document, an approved adjustment.

## Receivables & Payables

- The receivable balance and the payable balance for the same partner are always kept separate; any combined "net" figure shown is informational only and is never used to automatically offset the two directions.
- A posted sale creates a receivable; a posted purchase creates a payable; payments, returns, and cancellations settle or reverse the relevant direction.
- A payment allocation can never exceed either the amount of the source payment or the open amount of the target document.
- One payment may settle several documents in the same direction, but must never automatically settle receivables and payables together.
- Unallocated customer money becomes a customer advance; an unallocated supplier payment becomes a supplier advance; an advance is neither revenue nor an expense.
- Applying an existing advance to a new document is proposed to the user for confirmation rather than applied automatically, unless a separate business policy approves automatic application.
- Cancelling a payment reverses its allocations and reopens the balances of the affected documents.

## Expenses

- An expense is a business operating outflow and does not need to be linked to a sales or purchase document.
- An expense does not increase sellable inventory; acquiring a physical, stocked product must use a purchase document instead.
- Every expense requires an expense category.
- An expense paid from an employee's or owner's personal funds is not shown as a business cash-account outflow; the person whose funds were used is recorded separately as reimbursable.
- Cancelling a posted expense creates a reversing entry rather than deleting the original.

## Fixed Assets

- A fixed asset is a long-lived operational asset used by the business over time, tracked separately from sellable inventory.
- A fixed asset record retains its full history — status, location, responsible person, maintenance/repair, sale, or write-off — and this history is never deleted, even after the asset is sold or written off.
- Acquiring a fixed asset is linked to its purchase and cash source rather than being recorded only as a routine, unlinked expense.
- Selling or writing off a fixed asset does not affect sellable product inventory.

## Field Sales (Yatı)

- Goods loaded onto a vehicle for a trip remain company-owned, unsold inventory; loading is a transfer from the main warehouse to the vehicle warehouse, not a sale or revenue event, and company-total inventory does not change.
- The vehicle warehouse and vehicle cash account are tracked separately from the main warehouse and main cash account, while still consolidating into company totals.
- A field sale draws stock from the vehicle warehouse and, when money is received, deposits it into the vehicle cash account; it must not silently use the main warehouse, main cash account, or another vehicle's accounts.
- Starting cash issued to a vehicle for a trip is a transfer from the main cash account, not an expense.
- Collecting a customer's previous outstanding balance in the field can occur without a new sale and must be allocated to the specific prior open sale(s).
- Money received in the field is recorded in the vehicle cash account and must never be mixed with the representative's personal funds.
- A trip's inventory and cash differences identified during reconciliation are investigated and classified by reason, product, and amount separately; they must never be concealed by recording a false sale or expense.
- A trip is not considered closed until its vehicle inventory and vehicle cash have been reconciled against physical counts.

## Audit

- The audit history is append-only; no user may edit or delete it.
- The audit history records the actor, the time, the action taken, the affected entity or document, the previous and new values of material fields, and the reason given for a cancellation or other risky change.
- Creation, posting, cancellation, status transitions, payment allocation, permission changes, period closing/reopening, overrides, exports, and sensitive views are all events that must be captured in the audit history.
- Notification history does not replace or substitute for audit history.

## Reporting

- Reports must be derived from and reconcile to the same source documents and movements as the operational ledgers; they are not calculated independently of them.
- Sales revenue used for reporting purposes is defined net of returns.
- An increase in cash does not by itself represent profit (for example, an owner's capital contribution increases cash without being revenue).
- Receivable and payable totals are always shown separately in reports; they are never netted into one figure.
- A report or indicator that depends on an unresolved negative-stock cost must be marked as provisional.
- A business partner statement shows sales, purchases, returns, receipts, payments, advances, and adjustments chronologically, with opening and closing balances, and with receivable and payable directions shown separately.

---

## Excluded as Open Decisions or Unresolved Conflicts (not stated as invariants above)

The following business-relevant topics are referenced in the analysis but are explicitly marked as open decisions, safe defaults awaiting approval, or unresolved conflicts between the BRD and SRS/TDS. They are intentionally **not** stated as invariants:

- The exact costing method (e.g., weighted-average cost) — recommended in the BRD but not yet approved; mandated only in the SRS/TDS.
- Whether a closed Yatı trip may be reopened, and under what conditions.
- Whether a Yellow Card "BLOCK" level can be overridden by a manager, and by what authority.
- The exact settlement classification (advance, credit, or refund) produced by an over-paid sales return or purchase return.
- The full fixed-asset status catalog and whether deferred (credit) settlement is allowed on an asset sale.
- Bundle return/refund allocation policy and whether a "physical bundle" stocking mode exists alongside always-exploding components.
- Multi-currency scope (single base currency versus per-document/per-account currency).
- Maker/approver separation as a default (mandatory) versus optional policy.
