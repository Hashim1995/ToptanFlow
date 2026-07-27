# TOPTANFLOW Joint Business and Technical Document Analysis

**Analyzed sources**

- **BRD:** *TOPTANFLOW ERP — Business Requirements Document*, version 1.1, July 27, 2026.
- **SRS/TDS:** *TOPTANFLOW — Software Requirements & Technical Specification*, version 1.0, July 27, 2026.

**Authority rule used in this analysis**

- The BRD is authoritative for real business behavior.
- The SRS/TDS is authoritative for implementation approach only where it does not change, omit, or contradict authoritative business behavior.
- A recommendation or safe default is not treated as an approved business decision.
- Contradictions are reported, not silently resolved.

**Citation format:** `[BRD §section — “section title”]` and `[SRS §section — “section title”]`. Section titles, rather than page numbers, are used throughout.

---

# 1. Executive Summary

TOPTANFLOW is a mobile-first ERP system for a small wholesale textile business that buys, stores, transports, and sells finished textile products and raw materials. It is intended to replace fragmented notebooks, spreadsheets, and personal messages with one controlled operational record for products, business partners, sales, purchases, warehouses, cash, receivables, payables, field sales, fixed assets, evidence documents, alerts, reporting, and audit history. The first release is designed for approximately two active users, while retaining a role and permission structure that can support growth. [BRD §1 — “Executive Summary”] [BRD §2.1 — “General Nature of the Business”] [SRS §1 — “Purpose, Scope, and Product Vision”]

Primary users are the Business Owner/Super Administrator, Manager, Sales Officer, Purchasing Officer, Warehouse Officer, Cashier, Controller/Accounting View, read-only users, Field Sales Representative, and Driver. A single person may hold several role packages, but every sensitive action must remain attributable to an individual account and an exercised permission. [BRD §6 — “User Roles and Responsibilities”] [BRD §6.1 — “Permission Principles”] [SRS §6 — “Identity, Roles, and Permissions”]

The core business problem is not data entry alone. The system must keep four operational positions synchronized and explainable:

1. physical and recorded inventory by warehouse;
2. money by cash or bank account;
3. receivables and payables by business partner and source document; and
4. immutable transaction and correction history.

A posted transaction is the official business event. Drafts have no inventory, cash, receivable, payable, cost, or profit effect. Posted transactions are not deleted or silently edited; corrections use returns, cancellation, reversal, reallocation, or authorized adjustments. [BRD §5 — “Core Business Principles”] [BRD Appendix B — “Business Impact Matrix for Transactions”] [SRS §5 — “Cross-Cutting Functional Rules”]

TOPTANFLOW also covers the business-specific **Yatı** process: goods and starting cash are transferred to a vehicle warehouse and vehicle cash account, field sales and old-balance collections are recorded against the trip, expenses and returns are captured, and the trip closes only after inventory and cash reconciliation. Loading a vehicle is a transfer of company inventory, not a sale or revenue event. [BRD §17.1 — “Yatı Concept and Core Business Principle”] [BRD §§17.4–17.10] [SRS §20 — “Field Sales Trips (Yatı)”]

The technical proposal is a React/TypeScript frontend and NestJS modular-monolith REST API backed by PostgreSQL and Prisma, with transactional posting, idempotent commands, explicit status transitions, append-only audit, object storage for files, and an outbox for asynchronous notifications and external delivery. [SRS §2 — “Technology Baseline”] [SRS §3 — “Architecture Principles”] [SRS §4 — “System Context and Deployment”]

The project is **not yet ready for a final domain database schema or business-module coding**. The SRS preserves many core invariants, but several material business decisions remain open, both approval pages are blank, and there are conflicts involving document authority, weighted-average costing, fixed-asset statuses, closed-trip reopening, zero-price sales, currency scope, Yellow Card overrides, payment/return settlement, and omitted migration workflows. [BRD §28 — “Open Decisions”] [BRD — “Approval Page for Final Business Decision”] [SRS Appendix B — “Open Decisions and Safe Defaults”] [SRS — “Implementation Baseline Approval”]

# 2. Source Document Summary

## 2.1 TOPTANFLOW ERP — Business Requirements Document

- **Title:** *TOPTANFLOW ERP — Business Requirements Document: Non-technical business plan and functional brief*.
- **Version:** 1.1, dated July 27, 2026.
- **Purpose:** Define how the business should operate, which operational rules must be protected, and which real-world scenarios the system must support; it explicitly states that it is not a technical architecture specification. [BRD — “Document Control and Usage”]
- **Role in the project:** Primary authority for business scope, actors, workflows, posting effects, permissions, controls, exception behavior, acceptance scenarios, operating procedures, migration preparation, and business decisions. [BRD — “Document Control and Usage”] [BRD §23 — “Acceptance Criteria”]
- **Main sections:** executive and business context; objectives; scope; core principles; roles; master data; partners; products; sales; purchasing; inventory; cash and settlements; bundles; fixed assets; Yatı, WhatsApp, mobile evidence, alerts, Yellow Cards, negative balances; approvals and closing; audit and reports; end-to-end scenarios; exceptions; acceptance; migration; daily operations; phased rollout; risks; open decisions; glossary and impact matrices. [BRD — “Table of Contents”]
- **Authority level:** Authoritative for real business behavior. Where the technical document changes this behavior, the difference must be treated as a conflict or an open decision, not as an automatic technical refinement.
- **Approval state:** The document says open decisions must be resolved and management approval obtained before technical planning; the included approval page is unsigned. [BRD §28 — “Open Decisions”] [BRD — “Approval Page for Final Business Decision”]

## 2.2 TOPTANFLOW — Software Requirements & Technical Specification

- **Title:** *TOPTANFLOW — Software Requirements & Technical Specification: AI-Friendly Implementation Blueprint for Vibe Coding*.
- **Version:** 1.0, dated July 27, 2026.
- **Purpose:** Translate BRD v1.1 into an SRS/TDS with technology choices, architecture principles, entity catalog, status transitions, API conventions, frontend design, milestones, test gates, security, deployment, and operational requirements. [SRS — “Document Control”] [SRS §1 — “Purpose, Scope, and Product Vision”]
- **Role in the project:** Primary authority for implementation approach after business rules and unresolved decisions are approved. It proposes the modular monolith, PostgreSQL/Prisma data access, transactional posting, REST API, frontend stack, testing, security, observability, and backup approach. [SRS §2 — “Technology Baseline”] [SRS §3 — “Architecture Principles”]
- **Main sections:** purpose and scope; technology baseline; architecture and deployment; cross-cutting rules; identity and permissions; domain entities; posting; domain modules; messaging and evidence; alerts; audit and period control; reporting; API; frontend; milestones; testing; security; operations; traceability; Prisma guidance; open decisions. [SRS — “Table of Contents”]
- **Authority level:** Authoritative for implementation approach, not for changing BRD business behavior. The SRS statement that it is the source of truth for software behavior conflicts with the authority hierarchy required for this analysis and with the BRD approval sequence. [SRS — “How to Use This Document”] [SRS §27.1 — “Coding Agent Operating Rules”] [BRD — “Document Control and Usage”]
- **Approval state:** It labels itself an “implementation-ready baseline,” but its approval page is unsigned and several business-facing choices remain open or have been resolved technically without BRD approval. [SRS — “Implementation Baseline Approval”] [SRS Appendix B — “Open Decisions and Safe Defaults”]

# 3. Business Modules

## 3.1 Identity, Users, Roles, and Permissions

- **Business purpose:** Ensure that each action is performed by an identifiable user under an authorized permission package.
- **Main responsibilities:** login eligibility; user activation/deactivation; role assignment; separate permissions for view, create, post, cancel, backdate, discount override, stock adjustment, negative-balance override, period close/reopen, reporting, and audit access.
- **Users/roles involved:** Business Owner/Super Administrator, Manager, all operational users, Controller, Read Only.
- **Dependencies:** Audit for every security-sensitive change; Control for period permissions; all transaction modules for authorization.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §6.1 — “Permission Principles”] [SRS §6 — “Identity, Roles, and Permissions”] [SRS §9 — “Authentication and User Management”]

## 3.2 Master Data and Configuration

- **Business purpose:** Maintain reusable, controlled reference data so that transactions and reports use consistent identities and classifications.
- **Main responsibilities:** partners, products, categories, units, warehouses, money accounts, expense categories, fixed-asset categories, users, vehicles/routes, message templates, alert notes, numbering, and typed business settings.
- **Users/roles involved:** Business Owner, Manager, authorized data maintainers; operational users consume but should not freely redefine masters.
- **Dependencies:** Identity and Audit; provides reference data to every operational module.
- **Related sources:** [BRD §7 — “Master Data Management”] [BRD §7.1 — “Master Data Types”] [SRS §10 — “Master Data”] [SRS §30.2 — “Configuration”]

## 3.3 Business Partners

- **Business purpose:** Maintain one record for a person or company that may be both customer and supplier, without merging receivable and payable directions.
- **Main responsibilities:** identity and contact data; payment terms; optional open-balance limit; WhatsApp details and consent; Yellow Cards; opening receivable/payable balances; partner statements; duplicate warnings and inactivation.
- **Users/roles involved:** Sales, Purchase, Cashier, Field Sales, Manager, Controller.
- **Dependencies:** Settlement for balances; Sales and Purchasing for activity; Messaging for sharing; Audit for warnings and master changes.
- **Related sources:** [BRD §8 — “Business Partner Management”] [BRD §14 — “Accounts Receivable, Accounts Payable, and Advances”] [SRS §11 — “Business Partners”]

## 3.4 Product Catalog, Categories, and Units

- **Business purpose:** Define sellable or purchasable products and their classification, units, price defaults, stock tracking, critical thresholds, and negative-stock eligibility.
- **Main responsibilities:** product code and name; finished-good/raw-material/mixed-use type; category; primary unit and fractional rule; standard sale price; latest purchase price; stock-tracked flag; minimum stock; barcode; active status.
- **Users/roles involved:** authorized master-data users, Sales, Purchase, Warehouse, Manager.
- **Dependencies:** Inventory, Sales, Purchasing, Bundles, Alerts, Reporting.
- **Related sources:** [BRD §9 — “Product and Category Management”] [SRS §12 — “Products, Categories, and Units”]

## 3.5 Sales

- **Business purpose:** Record delivery of goods, sales price and discounts, create receivables, and link immediate or later payment.
- **Main responsibilities:** draft and posting; inventory validation; price and discount control; due dates; fully/partially/unpaid states; returns; cancellation; correction; Yatı channel; invoice sharing.
- **Users/roles involved:** Sales Officer, Field Sales, Manager for overrides/cancellation, Warehouse for physical issue, Cashier for receipts.
- **Dependencies:** Partners, Catalog, Inventory, Settlement, Cash, Bundles, Trips, Messaging, Period Control, Audit.
- **Related sources:** [BRD §10 — “Sales Processes”] [SRS §13 — “Sales”]

## 3.6 Purchasing and Goods Receipt

- **Business purpose:** Record goods actually received from suppliers, increase inventory, create payables, and link immediate or later supplier payment.
- **Main responsibilities:** drafts; actual receipt quantity; supplier invoice duplicate warning; price verification; posting; evidence; returns; cancellation; later corrections; transport/additional-cost note.
- **Users/roles involved:** Purchasing Officer, Warehouse Officer, Cashier, Manager, mobile receipt creator/reviewer.
- **Dependencies:** Partners, Catalog, Inventory/Costing, Settlement, Cash, Attachments, Audit, Period Control.
- **Related sources:** [BRD §11 — “Purchasing Processes”] [SRS §14 — “Purchases”]

## 3.7 Inventory and Warehouses

- **Business purpose:** Maintain explainable product quantity and value by warehouse from immutable movements.
- **Main responsibilities:** opening balances; purchase receipts; sale issues; returns; counts; adjustments; write-offs; warehouse transfers; vehicle warehouses; movement history; as-of balances; negative-stock cases.
- **Users/roles involved:** Warehouse Officer, Manager, Sales, Purchase, Field Sales, Controller.
- **Dependencies:** Catalog, Sales, Purchasing, Bundles, Trips, Alerts, Costing, Audit, Period Control.
- **Related sources:** [BRD §12 — “Warehouse and Inventory Management”] [BRD §17.17 — “Controlled Negative Inventory and Automatic Netting”] [SRS §15 — “Inventory and Warehouses”]

## 3.8 Inventory Costing

- **Business purpose:** Provide management inventory value and COGS while preserving original transaction costs and provisional status when cost is unresolved.
- **Main responsibilities:** weighted-average proposal; purchase receipt cost; sale cost snapshot; original-cost returns; negative-stock provisional cost and later adjustment.
- **Users/roles involved:** system-calculated; Controller and Manager consume results; Purchasing supplies purchase price.
- **Dependencies:** Inventory movements, Purchasing, Sales, Returns, Reporting, Audit.
- **Related sources:** [BRD §9.3 — “Pricing and Cost Rules”] [BRD §17.17 — “Controlled Negative Inventory and Automatic Netting”] [SRS §12.3 — “Costing”]

## 3.9 Cash and Money Accounts

- **Business purpose:** Track every receipt, payment, refund, expense, contribution, withdrawal, and transfer by account.
- **Main responsibilities:** main/secondary/vehicle/bank accounts; immutable money movements; transfers; customer receipts; supplier payments; refunds; owner funding; cash adjustments; balance reporting.
- **Users/roles involved:** Cashier, Field Sales, Manager, Business Owner, Controller.
- **Dependencies:** Settlement, Sales/Purchases for allocations, Expenses, Trips, Negative Cash, Cash Closing, Audit.
- **Related sources:** [BRD §13 — “Cash, Payment, and Expense Management”] [SRS §16 — “Cash, Payments, and Expenses”]

## 3.10 Settlement, Receivables, Payables, and Advances

- **Business purpose:** Explain how posted sales and purchases are settled at document level without automatically netting opposite directions.
- **Main responsibilities:** open amounts; payment allocation and reallocation; customer and supplier advances; aging; due dates; return/cancellation effects; partner statements.
- **Users/roles involved:** Cashier, Sales, Purchase, Manager, Controller, Field Sales.
- **Dependencies:** Partners, Sales, Purchasing, Cash, Returns, Period Control, Audit, Reporting.
- **Related sources:** [BRD §14 — “Accounts Receivable, Accounts Payable, and Advances”] [SRS §17 — “Receivables, Payables, and Advances”]

## 3.11 Expenses and Personal Financing

- **Business purpose:** Record operating outflows separately from purchases and identify expenses paid with business versus personal money.
- **Main responsibilities:** category, amount, date, account, description, optional partner/asset/trip, evidence, cancellation/reversal, employee/owner reimbursement distinction.
- **Users/roles involved:** Cashier, Field Sales, Driver as evidence provider, Manager for limits, Business Owner.
- **Dependencies:** Cash, Attachments, Trips, Assets, Partners, Audit.
- **Related sources:** [BRD §13.5 — “Expenses”] [BRD §17.8 — “Yatı Expenses and Vehicle Cash Account”] [SRS §16.3 — “Rules”]

## 3.12 Cash Closing and Negative Cash

- **Business purpose:** Reconcile system cash to physical cash and keep temporary deficits visible rather than hidden.
- **Main responsibilities:** count; closing; difference reason and approval; adjustment; negative limit/age; personal-financing alternative; clearing movement.
- **Users/roles involved:** Cashier, Field Sales for vehicle cash, Manager, Business Owner, Controller.
- **Dependencies:** Cash ledger, Trips, Permissions, Notifications, Audit, Period Control.
- **Related sources:** [BRD §13.6 — “Cash Closing and Count”] [BRD §17.16 — “Controlled Negative Cash”] [SRS §16.4 — “Controlled Negative Cash”]

## 3.13 Bundles and Promotions

- **Business purpose:** Sell a commercial combination at one price while deducting and costing its physical components.
- **Main responsibilities:** effective dates; components and quantities; bundle price; availability; component issue; historical composition; return policy.
- **Users/roles involved:** Sales, Field Sales, Catalog maintainer, Manager.
- **Dependencies:** Catalog, Inventory, Costing, Sales, Returns, Trips.
- **Related sources:** [BRD §15 — “Promotions and Product Bundles”] [SRS §18 — “Bundles and Promotions”]

## 3.14 Fixed Assets

- **Business purpose:** Track long-lived operational assets separately from sellable inventory.
- **Main responsibilities:** acquisition; supplier and cost; location; responsible person; condition/status; warranty; maintenance; repair; expenses; sale; loss/write-off; permanent history.
- **Users/roles involved:** Business Owner, Manager, asset responsible person, Cashier, Purchasing, Controller.
- **Dependencies:** Partners, Cash/Purchasing, Expenses, Attachments, Audit, Notifications.
- **Related sources:** [BRD §16 — “Fixed Assets and Equipment”] [SRS §19 — “Fixed Assets”]

## 3.15 Yatı Field Sales

- **Business purpose:** Control goods and money entrusted to a vehicle for regional sales, deliveries, old-balance collection, returns, and trip expenses.
- **Main responsibilities:** trip creation; assignments; vehicle warehouse and cash; loading/additional loading; field sales; collection; returns; expenses; inventory/cash reconciliation; closing/reopening.
- **Users/roles involved:** Field Sales Representative, Driver, Warehouse Officer, Cashier, Manager, Business Owner.
- **Dependencies:** Inventory, Sales, Cash, Settlement, Expenses, Partners/Yellow Cards, Attachments, Audit, Notifications.
- **Related sources:** [BRD §17.1 — “Yatı Concept and Core Business Principle” through §17.11 — “Yatı Controls and Reports”] [SRS §20 — “Field Sales Trips (Yatı)”]

## 3.16 Messaging and Document Sharing

- **Business purpose:** Deliver a posted invoice or partner statement through WhatsApp without treating delivery as settlement.
- **Main responsibilities:** preview; consent and recipient validation; text/PDF/secure link; separate receivable/payable display; version and sending history; correction messages.
- **Users/roles involved:** Sales, Field Sales, Manager, authorized messaging users, Business Partner as recipient.
- **Dependencies:** Partners, Sales, Settlement, document generation, file access, Audit.
- **Related sources:** [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”] [SRS §21.1 — “WhatsApp Sharing”]

## 3.17 Attachments and Mobile Evidence

- **Business purpose:** Preserve photographs and documents captured at receipt, expense, trip, return, count, and asset events without allowing a file to post a transaction.
- **Main responsibilities:** upload metadata; authorization; duplicate aid; draft/review/reject; linkage; retention; immutable association with cancelled records.
- **Users/roles involved:** Warehouse, Purchase, Cashier, Field Sales, Driver, reviewer/approver, Controller.
- **Dependencies:** Object storage, Purchasing, Expenses, Trips, Assets, Audit, Security.
- **Related sources:** [BRD §17.13 — “Mobile Photo-Based Goods Receipt and Receipt Archive”] [SRS §21.2 — “Attachments and Mobile Capture”]

## 3.18 Alerts, Yellow Cards, and Notifications

- **Business purpose:** Make stock shortages, partner-specific restrictions, overdue balances, negative cases, trip differences, and critical changes visible to the right people.
- **Main responsibilities:** critical-stock lifecycle; acknowledgment/action; repeat suppression; in-app delivery; optional Telegram; Yellow Card info/confirm/block behavior; notification history.
- **Users/roles involved:** Manager, Purchasing, Sales, Field Sales, Purchase, Business Owner, Controller.
- **Dependencies:** Inventory, Partners, Sales, Trips, Negative cases, outbox, Audit.
- **Related sources:** [BRD §§17.14–17.15] [BRD §19 — “Notifications, Audit, and Management Control”] [SRS §22 — “Alerts, Yellow Cards, and Notifications”]

## 3.19 Audit, Approval, Period Control, and Corrections

- **Business purpose:** Preserve history, prevent silent mutation, approve risky actions, and stabilize closed reporting periods.
- **Main responsibilities:** append-only audit; before/after values; reason and actor; approvals/overrides; posting guards; period close/reopen; cancellation/reversal; correction links.
- **Users/roles involved:** all users as audit actors; Manager and Business Owner as approvers; Controller as reader.
- **Dependencies:** every transactional and master-data module.
- **Related sources:** [BRD §18 — “Approval, Period Closing, and Correction Rules”] [BRD §19.1 — “Audit History”] [SRS §23 — “Period Closing, Audit, and Corrections”]

## 3.20 Reporting, Dashboard, and Export

- **Business purpose:** Present reconciled management information derived from source transactions and movements.
- **Main responsibilities:** sales/purchases; COGS and gross profit; stock and valuation; cashbook; receivable/payable aging; advances; trip reports; exceptions; audit; exports.
- **Users/roles involved:** Business Owner, Manager, Controller, authorized operational users.
- **Dependencies:** all source ledgers, timezone/currency settings, provisional-cost indicators, authorization.
- **Related sources:** [BRD §20 — “Reports and Key Indicators”] [SRS §24 — “Reporting and Dashboard”]

## 3.21 Migration, Opening Balances, Cutover, and Operations

- **Business purpose:** Start the ERP from approved real balances and maintain daily discipline after go-live.
- **Main responsibilities:** cleansing; duplicate handling; cutover date; opening inventory/cash/receivable/payable/advance balances; sign-off; daily, weekly, and monthly controls; training and pilot.
- **Users/roles involved:** Business Owner, Operations Responsible Person, Financial Control, data owner, approver, all operational users.
- **Dependencies:** Master Data, Inventory, Cash, Settlement, Assets, Audit, Reporting.
- **Related sources:** [BRD §24 — “Initial Data Preparation”] [BRD §25 — “Operating Rules and Daily Procedures”] [BRD §26.1 — “Go-Live Strategy”]

# 4. Actors and Roles

## 4.1 Formal system roles

### Business Owner / Super Administrator

- **Business responsibility:** Full visibility; user and permission management; period close/reopen; critical correction and cancellation; all reports.
- **Risky permissions:** unrestricted access, role changes, reopen, override, cancellation, adjustments, audit export.
- **Restrictions:** must not delete audit history or silently change posted facts; reopen and critical actions require reasons and audit.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [SRS §6.1 — “Roles”]

### Manager

- **Business responsibility:** Broad operational control and approval of risky discounts, backdates, cancellations, limits, differences, and exceptions.
- **Risky permissions:** price/discount override, negative balance override, document cancellation, adjustment approval, trip-difference approval.
- **Restrictions:** approvals and exceptions must identify approver and reason; a manager override is not equivalent to changing a posted document.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §18.2 — “High-Risk Transactions Requiring Approval”]

### Sales Officer

- **Business responsibility:** Select partner, create sale draft, enter lines/prices/discounts, post within limits, initiate return.
- **Risky permissions:** sale posting, price change, discount, zero-price sale, return initiation.
- **Restrictions:** cannot directly change posted sales; insufficient stock, closed period, Yellow Card, balance limit, discount, and zero-price rules apply.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §10 — “Sales Processes”]

### Purchasing Officer

- **Business responsibility:** Create and verify purchases, enter actual receipt and purchase prices, post, and initiate purchase returns.
- **Risky permissions:** purchase posting/cancellation, price correction, supplier return.
- **Restrictions:** must use actual received quantity; duplicate supplier invoice warning applies; posted prices are not silently changed.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §11 — “Purchasing Processes”]

### Warehouse Officer

- **Business responsibility:** Verify receipt/issue; transfer; count; adjust; write off; hand over and receive Yatı goods.
- **Risky permissions:** inventory adjustment, count variance, write-off, negative-stock transfer, trip loading.
- **Restrictions:** must not change sale prices or cash; high-value differences require approval; every movement requires a source and reason.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §12 — “Warehouse and Inventory Management”]

### Cashier

- **Business responsibility:** Customer receipts, supplier payments, expenses, money transfers, cash counting, and main/vehicle cash handover.
- **Risky permissions:** payment/reversal, allocation/reallocation, cash adjustment, negative cash, closing.
- **Restrictions:** must not change source document amounts; cash movement must reflect actual money; personal funding is recorded separately.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §13 — “Cash, Payment, and Expense Management”]

### Controller / Accounting View

- **Business responsibility:** Review documents, balances, cash, inventory, reports, allocations, and audit.
- **Risky permissions:** access to sensitive financial and audit information.
- **Restrictions:** restricted or read-only write access; must not alter transactions or audit.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [SRS §6.1 — “Roles”]

### Read Only

- **Business responsibility:** View explicitly allowed records and reports.
- **Risky permissions:** exposure of business, partner, and financial information.
- **Restrictions:** no creation, posting, change, cancellation, allocation, adjustment, or override.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”]

### Field Sales Representative / Route Sales Representative

- **Business responsibility:** Operate assigned Yatı; sell/deliver from vehicle stock; collect current and old balances; accept returns; record expenses; submit reconciliation.
- **Risky permissions:** field sale, collection, refund, negative vehicle stock/cash, trip expense, reconciliation submission.
- **Restrictions:** only assigned active trip; correct vehicle warehouse/cash account; Yellow Cards and central price rules apply; cannot mix personal and vehicle money.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §§17.5–17.10]

### Driver

- **Business responsibility:** Physical custody of vehicle and goods, handover evidence, expense evidence, return of remaining goods.
- **Risky permissions:** physical custody and evidence creation; possible financial posting if separately authorized.
- **Restrictions:** does not approve sales or financial transactions merely by being the driver.
- **Related sources:** [BRD §6 — “User Roles and Responsibilities”] [BRD §17.1 — “Yatı Concept and Core Business Principle”]

## 4.2 Business Functions and Departments

- **Business Management:** Business Owner and Manager oversee permissions, exceptions, approvals, period control, performance, and final acceptance. [BRD §§6 and 25.4 — “Division of Responsibilities”]
- **Sales Function:** Sales Officer and Field Sales roles prepare, post, deliver, return, and follow up customer sales under price, stock, balance, and Yellow Card rules. [BRD §§6 and 10 — “Sales Processes”]
- **Purchasing Function:** Purchasing Officer manages supplier documents, prices, receipt differences, returns, and supplier obligations. [BRD §§6 and 11 — “Purchasing Processes”]
- **Warehouse Function:** Warehouse Officer controls physical receipt/issue, counts, transfers, write-offs, and trip loading/return. [BRD §§6 and 12 — “Warehouse and Inventory Management”]
- **Cash and Financial Control Function:** Cashier records actual money movement; Controller/Accounting View and Financial Control reconcile balances, statements, reports, and opening data. [BRD §§6, 13, and 24 — “Initial Data Preparation”]
- **Field Operations Function:** Field Sales Representative, Driver, and trip responsible persons control vehicle goods, vehicle money, delivery, collection, evidence, and reconciliation. [BRD §§6 and 17 — “Field Sales Trips (Yatı), Mobile Documentation, and Control Capabilities”]
- **Implementation and Quality Function:** The future technical team, software engineers, reviewers, QA, AI coding agents, and Product Owner consume the approved requirements but do not define unapproved business behavior. [BRD — “Document Control and Usage”] [SRS — “Document Control”]

## 4.3 Operational responsibilities that may or may not be separate accounts

- **Trip Responsible Person:** accountable for trip inventory and cash reconciliation; may be the Field Sales Representative or another assigned person. [BRD §17.1 — “Yatı Concept and Core Business Principle”]
- **Vehicle Responsible Person:** responsible for the assigned vehicle; changes during an active trip require handover history. [BRD §17.2 — “Yatı Record and Core Trip Information”] [BRD §17.3 — “Yatı Statuses and Status Transitions”]
- **Goods Handover Person / Goods Receiver:** confirms physical loading, receipt, or return; should not be conflated with financial posting approval. [BRD §11.2 — “Core Information on a Purchase Document”] [BRD §17.4 — “Starting a Trip and Loading Goods”]
- **Asset Responsible Person:** accountable for current custody/location of a fixed asset and its handover history. [BRD §16.2 — “Fixed Asset Record”]
- **Data Owner / Data Approver:** cleans and approves migration master data and opening balances. [BRD §24.3 — “Data-Cleansing Process”]
- **Operations Responsible Person and Financial Control:** signatories for business acceptance and opening reconciliation. [BRD — “Approval Page for Final Business Decision”]
- **Employee/Owner as Personal Funder:** supplies personal money for a business expense and becomes reimbursable; the amount must not be represented as business-cash outflow. [BRD §13.5 — “Expenses”] [BRD §17.16 — “Controlled Negative Cash”]

## 4.4 External business actors

- **Business Partner:** unified person/company that can be customer, supplier, or both; opposite balance directions remain separate. [BRD §8.1 — “Unified Business Partner Concept”]
- **Customer:** receives goods, invoices, refunds, statements, or messages and may owe receivables or hold an advance. [BRD §10 — “Sales Processes”]
- **Supplier:** supplies goods/assets/services, receives payments, refunds purchase returns, and may hold or be owed advances. [BRD §11 — “Purchasing Processes”]
- **Buyer of Fixed Asset:** pays immediately under the defined flow; deferred settlement is an unresolved policy. [BRD §16.3 — “Fixed Asset Life Cycle”] [BRD scenario S-26 — “Sale of a Fixed Asset”]
- **Partner Contact Person / WhatsApp Recipient:** receives approved information only at a confirmed number and with required consent. [BRD §8.2 — “Information Maintained on the Business Partner Record”] [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]
- **Fuel company, landlord, repair provider, and similar vendor:** may be optionally selected on an expense or linked to an asset/trip. [BRD §13.5 — “Expenses”]

## 4.5 External systems and channels

- **WhatsApp / optional WhatsApp Business API:** user-controlled invoice/statement delivery; direct API is optional and feature-flagged; delivery is not payment confirmation. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”] [SRS §21.1 — “WhatsApp Sharing”]
- **Telegram:** optional alert-delivery channel; in-app notification remains primary. [BRD §17.14 — “Automatic Critical Inventory Early Warning”] [BRD §19.3 — “Notification Management”]
- **Bank account:** manually recorded money account in v1; automatic bank feeds and reconciliation are excluded. [BRD §13.1 — “Cash Accounts”] [SRS §1.3 — “Out of Scope for v1”]
- **Object storage:** stores evidence bytes and exports behind authorization-controlled access; metadata remains in PostgreSQL. [SRS §4.1 — “Logical Components”] [SRS §21.2 — “Attachments and Mobile Capture”]
- **Notification/outbox worker:** asynchronously delivers notifications and exports; delivery failure must not roll back a posted business transaction. [SRS §22.1 — “Critical Stock Alert Lifecycle”] [SRS §29.3 — “Reliability”]

# 5. Main Business Workflows

## 5.1 Sale: Draft to Posted Sale

- **Trigger:** An authorized user needs to record delivery of products to a business partner.
- **Preconditions:** Active partner and products; valid warehouse; at least one positive-quantity line; price/discount authorization; open period; sufficient stock unless an authorized negative-stock exception applies; applicable Yellow Card and balance-limit controls satisfied.
- **Main steps:** Select partner and warehouse; enter products, quantities, prices, discounts, due date, and channel; save/revise draft; revalidate stock and rules; post.
- **Posting moment:** The sale becomes business-effective only when the post command succeeds atomically.
- **Inventory effect:** Draft: none. Posting: decrease stocked products or bundle components from the selected warehouse; snapshot sale cost.
- **Cash effect:** Sale posting alone has no cash effect unless the same atomic flow also creates a separately identifiable receipt.
- **Receivable/payable effect:** Full sale amount creates a receivable; allocated payment reduces it; any remainder stays open.
- **Audit effect:** Preserve creator, poster, date/time, prices, discounts, cost snapshots, partner/product snapshots, overrides, request ID, and source movements.
- **Failure cases:** insufficient stock; concurrent last-stock sale; blocked Yellow Card; unauthorized discount/zero price; closed period; inactive master; duplicate idempotency request; stale draft version.
- **Related sources:** [BRD §10.1 — “Purpose and Main Flow of a Sale”] [BRD §10.5 — “Inventory Check and Release of Goods”] [SRS §13.2 — “Sale Commands”] [SRS §8.2 — “Posting Service Pattern”]

## 5.2 Sale Payment and Allocation

- **Trigger:** Money is received for one or more open sales, immediately or later.
- **Preconditions:** Active partner and receiving money account; positive amount; open target sales in the receivable direction; open period; allocation permission.
- **Main steps:** Create customer receipt; display open sales; propose oldest-due allocation; user confirms or edits allocations; retain excess as customer advance; post receipt and allocations.
- **Posting moment:** When the customer receipt is posted; allocations and money movement must commit together.
- **Inventory effect:** None.
- **Cash effect:** Selected money account increases by the full received amount.
- **Receivable/payable effect:** Allocated sales receivables decrease; unallocated excess becomes a customer advance; payables are not affected.
- **Audit effect:** Preserve payment, target documents, allocation amounts/order, actor, reallocation or reversal links, and any advance.
- **Failure cases:** allocation exceeds receipt or target open amount; wrong partner/direction; closed period; duplicate posting; concurrent allocation closes the target first.
- **Related sources:** [BRD §13.3 — “Cash Receipt from a Customer”] [BRD §14.4 — “Allocating One Payment Across Multiple Documents”] [SRS §17.1 — “Allocation Model”]

## 5.3 Sales Return

- **Trigger:** A customer returns all or part of a product from a posted sale.
- **Preconditions:** Original posted sale found; unreturned quantity remains; product condition and receiving warehouse identified; return/refund permission; period rules satisfied.
- **Main steps:** Select original line and quantity; record reason and condition; calculate value and cost from original sale; receive into normal/damaged/scrap location; reduce receivable first; choose customer advance or cash refund for any excess.
- **Posting moment:** When the linked sales-return document is posted.
- **Inventory effect:** Resaleable stock increases at original-sale cost; damaged goods follow damaged-stock/write-off handling.
- **Cash effect:** None unless a cash refund is posted, in which case the selected account decreases.
- **Receivable/payable effect:** Open receivable decreases first; any excess becomes a refund obligation/customer advance under a still-ambiguous classification.
- **Audit effect:** Preserve original sale/line, prior returns, quantity, condition, reason, original price/cost, settlement choice, and refund link.
- **Failure cases:** return exceeds remaining sold quantity; original sale unavailable; closed period; insufficient cash for refund; product-condition destination not selected.
- **Related sources:** [BRD §10.6 — “Sales Returns”] [BRD scenarios S-06 and S-07] [SRS §13.4 — “Sale Return Settlement”]

## 5.4 Sale Cancellation

- **Trigger:** An authorized user identifies that a posted sale is invalid and a return is not the commercially correct correction.
- **Preconditions:** Cancellation permission and reason; open period or approved reopen; downstream allocations reviewed; reversal can restore stock and settlement consistently.
- **Main steps:** Assess linked payments/returns; unallocate or resolve payments; execute cancellation; create exact opposite stock, receivable, and eligible direct-payment effects; create corrected sale separately if needed.
- **Posting moment:** When the cancellation/reversal transaction commits; the original is retained and marked cancelled.
- **Inventory effect:** Reverse original sale issues, subject to integrity checks.
- **Cash effect:** Reverse only the cash effect that the approved cancellation model identifies; separately allocated receipts require explicit resolution.
- **Receivable/payable effect:** Reverse the receivable and reopen/reorganize linked settlement as applicable.
- **Audit effect:** Original number is retained and never reused; preserve cancellation reason, actor, reversal links, affected allocations, period reopen, and replacement reference.
- **Failure cases:** closed period; linked payment allocated elsewhere; later returns; inconsistent stock; unauthorized cancellation; duplicate cancellation.
- **Related sources:** [BRD §10.7 — “Sales Cancellation and Correction”] [BRD §18.3 — “Period Closing”] [SRS §23.3 — “Correction Matrix”]

## 5.5 Purchase: Draft to Posted Purchase

- **Trigger:** Goods or materials are physically received from a supplier.
- **Preconditions:** Active supplier, products, and receiving warehouse; actual quantity verified; purchase price available before posting; supplier invoice duplicate checked; open period.
- **Main steps:** Enter supplier, actual products/quantities/prices, supplier invoice, receiver, due date, and evidence; save draft if price/review incomplete; verify; post.
- **Posting moment:** When the purchase post command succeeds atomically.
- **Inventory effect:** Draft: none. Posting: increase inventory by actual received quantities and update cost under the approved costing policy.
- **Cash effect:** None unless a separate supplier payment is created and linked.
- **Receivable/payable effect:** Full purchase creates payable; allocated payment/advance reduces it.
- **Audit effect:** Preserve supplier/product snapshots, actual versus invoiced difference, receiver, poster, prices, evidence links, cost result, and source movements.
- **Failure cases:** missing price; unreadable or unreviewed evidence; duplicate invoice warning unresolved; closed period; inactive product; invalid quantity.
- **Related sources:** [BRD §11.1 — “Purpose and Main Flow of a Purchase”] [BRD §11.4 — “Receipt Differences and Invoice Discrepancies”] [SRS §14.1 — “Requirements”]

## 5.6 Supplier Payment and Allocation

- **Trigger:** The company pays one or more open purchases.
- **Preconditions:** Active partner and source money account; positive amount; open purchases in payable direction; sufficient cash unless negative-cash exception is authorized; open period.
- **Main steps:** Create supplier payment; show open purchases; propose allocation order; user confirms/edits; retain excess as supplier advance; post money movement and allocations.
- **Posting moment:** When the supplier payment and its allocations commit.
- **Inventory effect:** None.
- **Cash effect:** Source money account decreases by the full payment.
- **Receivable/payable effect:** Allocated purchase payables decrease; excess becomes supplier advance; receivables are not automatically netted.
- **Audit effect:** Preserve source account, payee, target documents, allocations, actor, reason, advance, and reversal/reallocation links.
- **Failure cases:** insufficient cash; wrong direction/partner; allocation exceeds source or open amount; closed period; duplicate idempotency key.
- **Related sources:** [BRD §13.4 — “Payment to a Supplier”] [BRD §14.4 — “Allocating One Payment Across Multiple Documents”] [SRS §17.1 — “Allocation Model”]

## 5.7 Purchase Return

- **Trigger:** Purchased goods are returned to the supplier.
- **Preconditions:** Original purchase where possible; unreturned quantity and sufficient physical stock; reason and dispatch details; period open.
- **Main steps:** Select original purchase lines; enter quantities/reason; issue stock; reduce payable first; if already paid, record supplier credit/advance/receivable or cash refund according to an approved settlement choice.
- **Posting moment:** When the linked purchase-return document is posted.
- **Inventory effect:** Decrease stock using original purchase cost where possible.
- **Cash effect:** None unless supplier refund receipt is posted, then cash increases.
- **Receivable/payable effect:** Open payable decreases; excess produces an unresolved supplier-side credit/advance/receivable classification.
- **Audit effect:** Preserve original purchase, quantity, original cost, reason, dispatch/receipt confirmation, settlement choice, and refund link.
- **Failure cases:** insufficient available stock because goods were sold; return exceeds original/unreturned quantity; closed period; missing fallback cost.
- **Related sources:** [BRD §11.5 — “Purchase Returns”] [BRD scenario S-15 — “Purchase Return While Payable Is Open”] [SRS §14.2 — “Purchase Return”]

## 5.8 Inventory Transfer

- **Trigger:** Stock must move between two warehouses, including central-to-vehicle or vehicle-to-central movement.
- **Preconditions:** Distinct active source and destination; positive quantities; source stock available unless controlled negative transfer is expressly permitted; open period.
- **Main steps:** Create transfer; enter lines and reason; verify source; post paired issue and receipt; optionally record dispatch/receipt stages if that future policy is enabled.
- **Posting moment:** In the initial one-step recommendation, both sides post atomically at transfer posting.
- **Inventory effect:** Source decreases and destination increases equally; company-total quantity and value do not change.
- **Cash effect:** None.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve both warehouses, lines, cost, actor, reason, and reversal links.
- **Failure cases:** same source/destination; insufficient stock; concurrent movement; incomplete staged receipt; unauthorized negative transfer.
- **Related sources:** [BRD §12.6 — “Warehouse Transfers”] [BRD scenario S-18 — “Warehouse Transfer”] [SRS §15.3 — “Stock Balance Invariant”]

## 5.9 Stock Count and Adjustment

- **Trigger:** Physical count identifies a difference from system quantity.
- **Preconditions:** Warehouse/count date selected; theoretical snapshot captured; actual quantities entered; difference reasons supplied; required approval obtained.
- **Main steps:** Create count; enter actual quantities; calculate differences; investigate source-document error; approve legitimate differences; post surplus/shortage movements.
- **Posting moment:** Count preparation has no effect; inventory changes only when the approved count/adjustment is posted.
- **Inventory effect:** Surplus increases; shortage decreases; each product difference remains separate.
- **Cash effect:** None.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve system snapshot, actual count, variance, reason, counter, approver, evidence, and correction source.
- **Failure cases:** missing reason; material/high-value difference without approval; closed period; attempt to edit posted count; duplicate adjustment for same difference.
- **Related sources:** [BRD §12.4 — “Physical Stock Count”] [BRD scenario S-17 — “Shortage Identified During a Physical Stock Count”] [SRS §15.4 — “Physical Count”]

## 5.10 Cash Receipt

- **Trigger:** Cash is physically received from a customer, supplier refund, owner contribution, or another approved source.
- **Preconditions:** Active destination account; amount, date, payer/source, movement type, and notes; open period.
- **Main steps:** Select movement type and account; enter amount/source; allocate to receivables where applicable; otherwise preserve as advance, supplier refund, contribution, or other approved category; post receipt.
- **Posting moment:** When the money transaction is posted.
- **Inventory effect:** None.
- **Cash effect:** Destination account increases.
- **Receivable/payable effect:** Depends on movement type: customer allocation reduces receivable; excess creates advance; supplier refund resolves supplier-side balance; contribution creates no partner balance.
- **Audit effect:** Preserve movement type, source, account, allocation, actor, and reversal link.
- **Failure cases:** fictitious receipt used to hide negative cash; wrong partner/account; closed period; duplicate posting; amount/allocation mismatch.
- **Related sources:** [BRD §13.2 — “Cash Movement Types”] [BRD §13.3 — “Cash Receipt from a Customer”] [SRS §16.2 — “Money Transaction Types”]

## 5.11 Supplier Payment

- **Trigger:** Money is paid to a supplier before a purchase, against a purchase, or as an approved supplier-side outflow.
- **Preconditions:** Active supplier and source account; amount/date/method; cash policy satisfied; open period.
- **Main steps:** Create payment; optionally allocate to open purchases; retain unallocated amount as supplier advance; post.
- **Posting moment:** When the supplier-payment money transaction is posted.
- **Inventory effect:** None.
- **Cash effect:** Source account decreases.
- **Receivable/payable effect:** Allocation decreases payable; unallocated payment creates supplier advance; it is not an expense.
- **Audit effect:** Preserve supplier, account, allocation/advance, actor, and reversal.
- **Failure cases:** insufficient cash; wrong party; false expense classification; closed period; duplicate posting.
- **Related sources:** [BRD §13.4 — “Payment to a Supplier”] [BRD scenario S-13 — “Supplier Advance Payment”] [SRS §16 — “Cash, Payments, and Expenses”]

## 5.12 Expense

- **Trigger:** A business operating cost is actually incurred and paid.
- **Preconditions:** Expense category, amount, date, payer/account, description; optional partner/trip/asset; evidence when possible; negative-cash or personal-financing rule selected correctly.
- **Main steps:** Capture details/evidence; distinguish physical-product purchase from expense; distinguish business account from personal funds; obtain approval if limit exceeded; post.
- **Posting moment:** When the expense is posted; a photo or draft alone has no effect.
- **Inventory effect:** None; a physical stocked product must use purchasing.
- **Cash effect:** Business account decreases only if it paid; personal payment does not reduce business cash.
- **Receivable/payable effect:** Normally none; personal payment creates a separately tracked reimbursable amount; deferred expense payable is undefined.
- **Audit effect:** Preserve category, amount, account/payer, trip/asset link, evidence, approval, and reversal.
- **Failure cases:** wrong use for stocked goods or fixed asset; unreadable/duplicate receipt; insufficient cash; false negative-cash treatment; missing category.
- **Related sources:** [BRD §13.5 — “Expenses”] [BRD scenario S-19 — “Daily Expense”] [SRS §16.3 — “Rules”]

## 5.13 Cash Transfer

- **Trigger:** Money must move from one money account to another.
- **Preconditions:** Distinct active source/destination accounts; positive amount; source balance or authorized negative-cash exception; open period.
- **Main steps:** Select accounts/amount/date; post paired transfer-out and transfer-in with one reference.
- **Posting moment:** Both paired money movements post atomically.
- **Inventory effect:** None.
- **Cash effect:** Source decreases and destination increases equally; company-total cash by currency is unchanged.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve pair reference, accounts, amount, actor, reason, and reversal pair.
- **Failure cases:** same account; insufficient source; currency mismatch without conversion rule; one-sided posting; duplicate retry.
- **Related sources:** [BRD §13.2 — “Cash Movement Types”] [BRD scenario S-20 — “Cash Transfer”] [SRS §16.3 — “Rules”]

## 5.14 Cash Closing

- **Trigger:** End of day/shift or other configured cash-count point.
- **Preconditions:** All known movements entered; calculated balance available; physical count completed; closing permission.
- **Main steps:** Compare system and actual cash; if equal, record close; if different, investigate and either enter missing source document or obtain approval for a cash adjustment.
- **Posting moment:** Closing records reconciliation; only an approved adjustment changes cash.
- **Inventory effect:** None.
- **Cash effect:** None when equal; approved difference adjusts account to actual.
- **Receivable/payable effect:** None unless investigation identifies a missing real settlement.
- **Audit effect:** Preserve expected/actual/difference, reason, counter, approver, adjustment, and linked clearing source.
- **Failure cases:** hidden difference through false sale/expense/contribution; unapproved adjustment; backdated movement after close; unresolved negative cash.
- **Related sources:** [BRD §13.6 — “Cash Closing and Count”] [BRD scenario S-22 — “Cash Count Difference”] [SRS §16.3 — “Rules”]

## 5.15 Business Partner Statement

- **Trigger:** An authorized user or partner requests activity for a date range.
- **Preconditions:** Partner and date range selected; statement-view permission; reliable source transactions and allocations.
- **Main steps:** Calculate opening balance; list sales/returns, purchases/returns, receipts/payments, advances, and approved adjustments chronologically; show source-document links; calculate closing balances separately by direction.
- **Posting moment:** None; statement generation is read-only.
- **Inventory effect:** None.
- **Cash effect:** None.
- **Receivable/payable effect:** No new effect; displays receivable, payable, customer advance, supplier advance, and informational net separately.
- **Audit effect:** Sensitive view/export/share should be auditable; generated filters/time/version should be retained where shared.
- **Failure cases:** net-only presentation; missing allocations; mixing directions; wrong date opening; stale/provisional data not identified.
- **Related sources:** [BRD §8.4 — “Business Partner Account Statement”] [SRS §11.2 — “Partner Balances”] [SRS §24.3 — “Report Rules”]

## 5.16 Bundle Sale

- **Trigger:** A customer buys an active promotional bundle.
- **Preconditions:** Active bundle and effective date; historical component version; sufficient components under the final approved negative-stock policy; sale controls satisfied.
- **Main steps:** Add commercial bundle line; explode component quantities for validation and movements; calculate commercial total from bundle price and cost from components; post sale.
- **Posting moment:** At sale posting.
- **Inventory effect:** Each component decreases; fictitious bundle stock does not move unless an approved physical-bundle mode exists.
- **Cash effect:** Same as ordinary sale payment.
- **Receivable/payable effect:** Receivable uses bundle sale price; payment reduces it normally.
- **Audit effect:** Preserve bundle definition version, component movements, component costs, price, and sale link.
- **Failure cases:** missing component; later bundle definition incorrectly changes history; double deduction during Yatı loading/sale; unresolved component-return pricing.
- **Related sources:** [BRD §15.3 — “Bundle Inventory and Cost Rules”] [BRD scenario S-10 — “Bundle Sale”] [SRS §18 — “Bundles and Promotions”]

## 5.17 Fixed Asset Lifecycle

- **Trigger:** An operational asset is acquired, assigned, moved, repaired, sold, lost, or written off.
- **Preconditions:** Asset category and identity; acquisition source/cost; responsible person/location where applicable; permission/approval for disposal or missing status.
- **Main steps:** Record acquisition and cash/purchase link; create asset card; assign custody/location; record maintenance/repair and status history; on sale record buyer/cash; on write-off retain reason/approval.
- **Posting moment:** Asset-history events post when approved; linked cash/purchase documents have their own posting moments.
- **Inventory effect:** No sellable-product inventory effect.
- **Cash effect:** Acquisition/repair decreases cash when paid; sale increases cash when received.
- **Receivable/payable effect:** Immediate flows are defined; deferred asset acquisition/sale settlement is not fully defined.
- **Audit effect:** Never delete asset history; retain status, location, responsibility, repair, sale/write-off, evidence, and actor.
- **Failure cases:** asset recorded only as routine expense; missing purchase/cash link; unsupported BRD status; sale on credit without policy; deletion of sold/written-off record.
- **Related sources:** [BRD §16.3 — “Fixed Asset Life Cycle”] [BRD §16.4 — “Depreciation and Statutory Accounting Boundary”] [SRS §19 — “Fixed Assets”]

## 5.18 Yatı Trip Creation

- **Trigger:** Management plans a field sales trip for a region/date.
- **Preconditions:** Active vehicle, route/region, representative, driver, source warehouse, vehicle warehouse, and vehicle cash account.
- **Main steps:** Create unique trip; enter assignments, planned dates/route, planned customers, warehouses/accounts, notes, and initial loading plan; keep in preparation.
- **Posting moment:** Creation in DRAFT/In Preparation has no ledger effect.
- **Inventory effect:** None.
- **Cash effect:** None.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve creator, assignments, planned details, and later changes/handover records.
- **Failure cases:** missing separate vehicle warehouse/account; overlapping or invalid assignment policy; duplicate trip number; unauthorized trip creation.
- **Related sources:** [BRD §17.2 — “Yatı Record and Core Trip Information”] [BRD §17.3 — “Yatı Statuses and Status Transitions”] [SRS §20.2 — “Trip Data”]

## 5.19 Yatı Loading

- **Trigger:** Goods and optionally starting expense cash are physically handed to the trip responsible person.
- **Preconditions:** Trip in preparation; products/quantities verified; source stock or authorized negative exception; two-party handover; accounts/warehouses selected.
- **Main steps:** Confirm actual load; post central-to-vehicle transfer; transfer starting float main-to-vehicle; record additional load or return as separate later movements.
- **Posting moment:** At loading post; inventory and optional cash transfer commit without creating a sale.
- **Inventory effect:** Main warehouse decreases; vehicle warehouse increases equally; company total unchanged.
- **Cash effect:** Main cash decreases and vehicle cash increases equally if float is issued; not an expense.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve handover parties, date, lines, cost, float, changes, and negative-stock responsibility.
- **Failure cases:** load treated as sale/revenue; double bundle deduction; wrong vehicle warehouse; insufficient stock; one-sided transfer; no acceptance.
- **Related sources:** [BRD §17.4 — “Starting a Trip and Loading Goods”] [BRD scenario S-27] [SRS §20 — “Field Sales Trips (Yatı)”]

## 5.20 Yatı Field Sale

- **Trigger:** Goods are delivered to a partner during an active trip.
- **Preconditions:** Active assigned trip; vehicle warehouse stock; valid partner; Yellow Card satisfied; price/discount/zero-price rules; vehicle cash account for payment.
- **Main steps:** Create sale linked to trip and vehicle warehouse; enter products/bundle and settlement; post; optionally share invoice.
- **Posting moment:** At field-sale posting, not at loading.
- **Inventory effect:** Vehicle stock or bundle components decrease.
- **Cash effect:** Received amount increases vehicle cash.
- **Receivable/payable effect:** Unpaid portion creates receivable; applied advance reduces it.
- **Audit effect:** Preserve trip, warehouse/account, representative, partner warnings, price override, receipt/allocation, and delivery.
- **Failure cases:** wrong warehouse/account; closed/reconciling trip; blocking Yellow Card; insufficient stock; offline duplicate; unauthorized zero price.
- **Related sources:** [BRD §17.5 — “Field Sales and Delivery of Products”] [BRD scenario S-28] [SRS §20.2 — “Trip Data”]

## 5.21 Yatı Collection of Previous Balances

- **Trigger:** The representative receives money against prior open sales without a new sale.
- **Preconditions:** Active trip and vehicle cash account; partner has open receivables or pays an advance; collection permission.
- **Main steps:** Create field receipt; show prior open sales; allocate to selected/oldest documents; retain excess as customer advance; issue receipt.
- **Posting moment:** When the trip-linked customer receipt and allocations post.
- **Inventory effect:** None.
- **Cash effect:** Vehicle cash increases.
- **Receivable/payable effect:** Allocated receivables decrease; excess becomes customer advance; no payable netting.
- **Audit effect:** Preserve trip, collector, partner, documents, allocations, excess, and custody.
- **Failure cases:** mixing personal cash; allocation to wrong partner/direction; collection recorded as sale; duplicate offline sync; closed trip.
- **Related sources:** [BRD §17.6 — “Collecting Previous Balances, Advances, and Refunds in the Field”] [BRD scenario S-29]

## 5.22 Yatı Expense

- **Trigger:** Fuel, meal, toll, parking, minor repair, accommodation, or another trip cost is paid.
- **Preconditions:** Active trip; amount/category/date/payer; correct vehicle account or personal-funding designation; evidence where possible.
- **Main steps:** Capture details/photo; select trip and payer; obtain limit approval where required; post expense.
- **Posting moment:** When approved expense posts.
- **Inventory effect:** None.
- **Cash effect:** Vehicle cash decreases only if it paid.
- **Receivable/payable effect:** Normally none; personal payment creates reimbursable amount.
- **Audit effect:** Preserve trip, category, payer/account, evidence, approval, and cancellation reversal.
- **Failure cases:** starting float misclassified as expense; personal money shown as vehicle outflow; duplicate receipt; closed trip; insufficient cash.
- **Related sources:** [BRD §17.8 — “Yatı Expenses and Vehicle Cash Account”] [SRS §20.2 — “Trip Data”]

## 5.23 Yatı Return

- **Trigger:** A customer returns goods during a trip.
- **Preconditions:** Original sale where possible; remaining returnable quantity; active trip; product condition recorded.
- **Main steps:** Create linked sales return; receive resaleable item to vehicle warehouse or damaged location; reduce receivable first; record advance/refund as required; keep any later resale separate.
- **Posting moment:** When field return posts.
- **Inventory effect:** Vehicle or damaged stock increases.
- **Cash effect:** Vehicle cash decreases only for an actual refund.
- **Receivable/payable effect:** Receivable decreases; excess becomes refund/advance.
- **Audit effect:** Preserve original sale, trip, condition, quantity, reason, settlement, and later resale separation.
- **Failure cases:** excess quantity; closed trip; wrong warehouse; product exchange recorded as one opaque action; insufficient vehicle cash refund.
- **Related sources:** [BRD §17.7 — “Product Returns in the Field”] [BRD scenario S-30]

## 5.24 Yatı Inventory Reconciliation

- **Trigger:** Trip returns and enters reconciliation.
- **Preconditions:** All loads, sales, returns, losses/write-offs, and remaining goods recorded; physical count completed.
- **Main steps:** Compare loaded + additional load + customer returns against sales/deliveries + damage/loss + returned-to-central + physical remainder; investigate each product; enter missing real documents or approved adjustments; return remaining goods under policy.
- **Posting moment:** Reconciliation itself records comparison; return transfer and approved differences post separately.
- **Inventory effect:** Remaining goods transfer vehicle-to-central; approved differences create explicit movements; company total changes only for genuine sale/return/write-off/adjustment.
- **Cash effect:** None.
- **Receivable/payable effect:** None unless investigation identifies a missing sale/return.
- **Audit effect:** Preserve theoretical/actual by product, reasons, evidence, responsible person, approver, and source corrections.
- **Failure cases:** netting one product surplus against another shortage; closing with unresolved high-value difference; false sale; unentered drafts.
- **Related sources:** [BRD §17.9 — “Yatı Closing and Inventory Reconciliation”] [BRD scenario S-32] [SRS §20.3 — “Stock Reconciliation Formula”]

## 5.25 Yatı Cash Reconciliation

- **Trigger:** Trip cash is counted during reconciliation.
- **Preconditions:** Opening float, field receipts, old-balance collections, expenses, refunds, and cash handovers recorded; physical cash counted.
- **Main steps:** Calculate expected cash; compare actual; enter missing real source documents or approved cash difference; transfer remaining cash to main account or retain approved float.
- **Posting moment:** Cash handover and approved difference post as separate money movements; reconciliation records the result.
- **Inventory effect:** None.
- **Cash effect:** Vehicle decreases and main increases for handover; approved difference adjusts vehicle cash; company total unchanged by handover.
- **Receivable/payable effect:** None unless missing collection/refund is identified.
- **Audit effect:** Preserve expected/actual, reason, responsible person, approver, clearing movement, and acknowledgment.
- **Failure cases:** concealed difference through false sale/expense/contribution; personal funds mixed; unresolved negative cash; closed-trip mutation.
- **Related sources:** [BRD §17.10 — “Yatı Closing and Cash Reconciliation”] [BRD scenario S-32] [SRS §20.4 — “Cash Reconciliation Formula”]

## 5.26 Yatı Closing

- **Trigger:** Inventory and cash reconciliations are complete and differences resolved or approved.
- **Preconditions:** No unresolved draft field documents; actual counts present; required goods/cash returned or approved carryover selected; acknowledgments complete.
- **Main steps:** Validate reconciliation guards; post final transfers/adjustments; capture representative and manager acknowledgment; mark trip closed and issue summary.
- **Posting moment:** Close command finalizes trip control state; ledger effects belong to the linked transfer/adjustment commands.
- **Inventory effect:** Normally vehicle stock reaches zero by transfer to central; approved retained stock policy is an open decision.
- **Cash effect:** Normally remaining vehicle cash transfers to main; approved fixed float may remain.
- **Receivable/payable effect:** Existing field sales/collections remain; closing itself creates none.
- **Audit effect:** Preserve final summary, counts, differences, approvals, handovers, close actor/time, and any later reopen.
- **Failure cases:** unresolved drafts/differences; missing counts; negative balance without approval; new activity after close; conflict over whether reopening is allowed.
- **Related sources:** [BRD §17.3 — “Yatı Statuses and Status Transitions”] [BRD §§17.9–17.10] [SRS §20.5 — “Trip Closing Guards”]

## 5.27 WhatsApp Invoice Sharing

- **Trigger:** An authorized user wants to send a posted invoice.
- **Preconditions:** Posted, valid document; correct confirmed number; consent; authorized user; receivable/payable direction verified; stable text/PDF/link version.
- **Main steps:** Preview recipient, template, amount, open balance, and link; initiate user-controlled share or direct API; store result/provider reference; send correction version after later return/cancellation if needed.
- **Posting moment:** None; sharing never posts or settles the invoice.
- **Inventory effect:** None.
- **Cash effect:** None.
- **Receivable/payable effect:** None; displayed balances remain separate.
- **Audit effect:** Preserve recipient, template/version, document version/hash, actor, time, result, and error; prior shares are never erased.
- **Failure cases:** draft/cancelled document; wrong recipient; missing consent; insecure link exposes another partner; delivery treated as payment.
- **Related sources:** [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”] [SRS §21.1 — “WhatsApp Sharing”]

## 5.28 WhatsApp Statement Sharing

- **Trigger:** An authorized user sends a partner statement for a date range.
- **Preconditions:** Statement generated from reconciled sources; opening/closing and both directions visible; correct number and consent; secure artifact.
- **Main steps:** Preview date range, open documents, payments, advances, separate receivable/payable, and recipient; generate stable version; share; record result.
- **Posting moment:** None.
- **Inventory effect:** None.
- **Cash effect:** None.
- **Receivable/payable effect:** None; informational delivery only.
- **Audit effect:** Preserve filters, generated version, recipient, actor, time, and outcome.
- **Failure cases:** net-only balance; missing allocations; stale version; wrong recipient; absent statement-specific API.
- **Related sources:** [BRD §8.4 — “Business Partner Account Statement”] [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”] [SRS §21.1 — “WhatsApp Sharing”]

## 5.29 Photo Evidence Attachment

- **Trigger:** Goods, delivery note, receipt, damage, expense, trip, count, or asset evidence is captured.
- **Preconditions:** Authorized uploader; allowed type/size; business-purpose content; target draft/event; storage available.
- **Main steps:** Upload; validate MIME/size/hash; store metadata; link to target; review readability/duplicate suspicion; approve/reject source document separately.
- **Posting moment:** Upload has no business posting effect. Only the authorized source transaction post changes ledgers.
- **Inventory effect:** None from attachment.
- **Cash effect:** None from attachment.
- **Receivable/payable effect:** None from attachment.
- **Audit effect:** Preserve uploader, capture time, hash, filename, MIME, size, target, reviewer/approver, and cancelled-document link.
- **Failure cases:** unreadable or suspicious file; duplicate receipt; malware; unauthorized access; orphan upload; legal retention not satisfied.
- **Related sources:** [BRD §17.13 — “Mobile Photo-Based Goods Receipt and Receipt Archive”] [SRS §21.2 — “Attachments and Mobile Capture”]

## 5.30 Critical Stock Alert

- **Trigger:** An approved inventory movement crosses a warehouse or company threshold, worsens materially, remains unresolved, or later recovers.
- **Preconditions:** Product threshold basis and recipients configured; movement posted.
- **Main steps:** Calculate correct basis; open or update alert; notify in-app and optionally Telegram; allow acknowledgment/action status; resolve when stock rises above approved restore rule.
- **Posting moment:** Alert is created after/with the source movement, but notification failure must not roll back that movement.
- **Inventory effect:** None beyond source movement.
- **Cash effect:** None.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve threshold, basis, triggering movement, recipients, delivery attempts, acknowledgments, reminders, and resolution date.
- **Failure cases:** confusing main-warehouse with company total; notification storm; duplicate event; missing restore threshold; automatic purchase created without authority.
- **Related sources:** [BRD §17.14 — “Automatic Critical Inventory Early Warning”] [SRS §22.1 — “Critical Stock Alert Lifecycle”]

## 5.31 Yellow Card Warning

- **Trigger:** A partner is selected for a transaction to which an active note applies.
- **Preconditions:** Effective, scoped note with INFO, CONFIRM, or BLOCK level.
- **Main steps:** Display before continuation; INFO allows continue; CONFIRM records acknowledgment/reason; BLOCK rejects unless an approved override policy applies.
- **Posting moment:** Warning itself has no ledger effect; it is a guard before posting the target transaction.
- **Inventory effect:** None beyond target transaction.
- **Cash effect:** None beyond target transaction.
- **Receivable/payable effect:** None beyond target transaction.
- **Audit effect:** Preserve note/version, creator/change/deactivation, display, acknowledgment, override actor/reason, and blocked attempt.
- **Failure cases:** sales note applied to purchasing; expired note enforced; blocking rule silently bypassed; sensitive personal text stored; override authority undefined.
- **Related sources:** [BRD §17.15 — “Business-Partner-Specific Reminder Notes - ‘Yellow Card’”] [SRS §11.3 — “Yellow Cards”]

## 5.32 Negative Stock Case

- **Trigger:** An authorized post would take selected product/warehouse stock below zero because physical goods allegedly exist but receipt entry is delayed.
- **Preconditions:** Feature enabled; eligible product/warehouse/user; permission; structured reason; quantity/value limit and resolution target; open period.
- **Main steps:** Show deficit; authorize exception; post source transaction; open negative-stock case; mark cost/profit provisional; later receipt nets quantity and links clearance; finalize cost through an approved method.
- **Posting moment:** Source sale/transfer posts atomically with exception case and audit.
- **Inventory effect:** Warehouse balance becomes negative; later receipt raises it and closes/partially closes case.
- **Cash effect:** Normal source transaction effect.
- **Receivable/payable effect:** Normal source transaction effect.
- **Audit effect:** Preserve reason, user, limit, age, warnings, responsibility, source issue, clearing receipt, and cost adjustment.
- **Failure cases:** ordinary use becomes normalized; limit exceeded; unresolved case; report omits provisional flag; history rewritten; bundle applicability unclear.
- **Related sources:** [BRD §17.17 — “Controlled Negative Inventory and Automatic Netting”] [BRD scenario S-37] [SRS §15.5 — “Controlled Negative Stock”]

## 5.33 Negative Cash Case

- **Trigger:** An urgent authorized payment would make a money account negative.
- **Preconditions:** Feature enabled; eligible account/user; permission; mandatory reason; amount and age limit; personal-funding alternative considered.
- **Main steps:** Show deficit; select reason; post real payment and open case; display red status; later valid receipt/funding clears balance and links closure.
- **Posting moment:** Real source payment posts atomically with negative-cash case; no fictitious receipt is created.
- **Inventory effect:** None beyond source transaction.
- **Cash effect:** Account becomes negative, then later receipt/funding increases it.
- **Receivable/payable effect:** Normal source effect; personal funds create separate reimbursable obligation.
- **Audit effect:** Preserve reason, actor, limit, age, responsible person, approvals, source payment, and clearing movement.
- **Failure cases:** false sale/collection/contribution; personal money not recorded; overdue case; trip/day closed without approval; cash deficit hidden.
- **Related sources:** [BRD §17.16 — “Controlled Negative Cash”] [BRD scenario S-38] [SRS §16.4 — “Controlled Negative Cash”]

## 5.34 Period Closing

- **Trigger:** Management completes month-end or another approved period-end process.
- **Preconditions:** Cash reconciled; stock differences reviewed; open receivables/payables/advances reviewed; drafts and trip reconciliations reviewed; close permission.
- **Main steps:** Run validations; resolve blockers; close period; reject subsequent business-date postings/changes; if correction is required, reopen with reason, correct, and close again.
- **Posting moment:** Close/reopen are control events, not inventory/cash/debt postings.
- **Inventory effect:** None directly.
- **Cash effect:** None directly.
- **Receivable/payable effect:** None directly.
- **Audit effect:** Preserve closer/reopener, time, reason, validation result, documents changed while reopened, and reclose.
- **Failure cases:** post racing with close; unresolved negative/trip case; unauthorized reopen; historical allocation changed; report changes without trace.
- **Related sources:** [BRD §18.3 — “Period Closing”] [BRD §25.3 — “Monthly Closing Procedure”] [SRS §23.1 — “Accounting Period”]

## 5.35 Correction and Reversal

- **Trigger:** A posted sale, purchase, money transaction, count, transfer, expense, share, or allocation is wrong.
- **Preconditions:** Correct correction type selected; permission and reason; open period or approved policy for current-period correction/reopen; dependent documents understood.
- **Main steps:** Do not edit original; choose return when commercially accurate, otherwise cancel/reverse and recreate; reverse/reallocate payment where appropriate; create new correction for posted count; share new document version.
- **Posting moment:** When compensating transaction posts; original remains immutable.
- **Inventory effect:** Exact opposite or explicit correcting movement as appropriate.
- **Cash effect:** Exact opposite money movement as appropriate.
- **Receivable/payable effect:** Reverse/reopen/reallocate affected balances without netting unrelated directions.
- **Audit effect:** Preserve original, reversal/correction, reason, actor, period decision, request ID, and replacement links.
- **Failure cases:** silent update; hard delete; partial reversal; duplicate reversal; current-period correction changes historical truth without declared policy.
- **Related sources:** [BRD §18 — “Approval, Period Closing, and Correction Rules”] [BRD §19.1 — “Audit History”] [SRS §23.3 — “Correction Matrix”]

## 5.36 Purchase Cancellation

- **Trigger:** A posted purchase is invalid and must be reversed.
- **Preconditions:** Cancellation permission/reason; open period; sufficient stock remains to reverse receipt; linked payments resolved.
- **Main steps:** Check sold/consumed quantity and returns; unallocate or decide refund/advance treatment; post reversal; create corrected purchase separately.
- **Posting moment:** When cancellation reversal commits.
- **Inventory effect:** Reverse purchase receipt; block if available stock is insufficient.
- **Cash effect:** Resolve linked direct payment under approved cancellation behavior.
- **Receivable/payable effect:** Reverse payable and reopen/reorganize payment allocations.
- **Audit effect:** Preserve original, blocked attempts, reason, actor, reversal, linked sales investigation, and replacement.
- **Failure cases:** goods already sold; linked payments; closed period; cost impact cannot be reversed consistently.
- **Related sources:** [BRD §11.6 — “Purchase Cancellation”] [BRD scenario S-16] [SRS §14.1 — “Requirements”]

## 5.37 Inventory Write-Off

- **Trigger:** Goods are damaged, lost, obsolete, expired, or issued for approved use.
- **Preconditions:** Available stock; mandatory reason; value/quantity approval threshold; evidence where required.
- **Main steps:** Create write-off; record product, quantity, reason, evidence; approve; post; reverse with opposite movement if wrong.
- **Posting moment:** At approved write-off posting.
- **Inventory effect:** Decrease selected warehouse stock.
- **Cash effect:** None.
- **Receivable/payable effect:** None.
- **Audit effect:** Preserve reason, cost, evidence, actor, approver, and reversal.
- **Failure cases:** exceeds available stock; used to hide sale/shortage; high value without approval; posted record edited.
- **Related sources:** [BRD §12.5 — “Inventory Write-Off”] [SRS §15.2 — “Stock Movement Types”]

## 5.38 Opening Balances and Cutover

- **Trigger:** Approved go-live cutover is performed.
- **Preconditions:** Cleaned masters; physical inventory count; actual cash count; verified separate receivable/payable/advance lists; cutover date and sign-off.
- **Main steps:** Enter opening stock with cost, cash by account, receivable/payable by partner/document where possible, advances, and disputed flags; run reconciliation; management signs off.
- **Posting moment:** At authorized opening-balance posting; entries are not ordinary sales, purchases, receipts, or payments.
- **Inventory effect:** Establish opening quantity and cost by warehouse.
- **Cash effect:** Establish opening amount by money account.
- **Receivable/payable effect:** Establish separate opening receivables, payables, customer advances, and supplier advances.
- **Audit effect:** Preserve migration batch, source, approver, disputed status, cutover date, and reconciliation report; ordinary users cannot alter.
- **Failure cases:** fictitious operational documents; duplicate/unclean masters; missing cost; disputed balances treated as confirmed; later silent edit.
- **Related sources:** [BRD §24.1 — “Data Required for System Migration”] [BRD §24.2 — “Principle for Entering Opening Balances”]

# 6. Business Rules and Invariants

## 6.1 Global Posting Rules

- Drafts have no inventory, cash, receivable, payable, cost, or profit effect. [BRD §5 — “Core Business Principles”] [SRS §5 — “Cross-Cutting Functional Rules”]
- Posting is the official business event; all related effects must be created together or not at all. [BRD §5 — “Core Business Principles”] [SRS §3 — “Architecture Principles”]
- The backend recalculates document totals and rejects mismatched client totals. [SRS §5 — “Cross-Cutting Functional Rules”]
- Posted facts are not deleted or silently edited. Corrections use return, cancellation, reversal, reallocation, or authorized adjustment. [BRD §18 — “Approval, Period Closing, and Correction Rules”] [SRS §23.3 — “Correction Matrix”]
- Every reversal preserves and links the original record; cancelled numbers are not reused. [BRD §10.7 — “Sales Cancellation and Correction”] [SRS §5 — “Cross-Cutting Functional Rules”]
- Posting, cancellation, reversal, sharing, and other retryable mutations must be idempotent. [SRS §3 — “Architecture Principles”] [SRS §25.1 — “REST Conventions”]
- Money and quantity calculations use decimal-safe arithmetic, never authoritative floating-point `number` arithmetic. [SRS §7.2 — “Money and Quantity Types”]

## 6.2 Inventory

- Inventory changes only through an explained, approved movement linked to a source document, warehouse, user, quantity, and cost. [BRD §12.1 — “Core Inventory Concept”] [BRD §12.3 — “Inventory Card and Movement History”]
- Current balance must reconcile to the sum of immutable stock movements. [SRS §15.3 — “Stock Balance Invariant”]
- Warehouse transfer and Yatı loading change location but not company-total quantity or value. [BRD §12.6 — “Warehouse Transfers”] [BRD §17.1 — “Yatı Concept and Core Business Principle”]
- A sales return restores original-sale cost; purchase return uses original-purchase cost wherever possible. [BRD §9.3 — “Pricing and Cost Rules”]
- A return cannot exceed original quantity less prior returns. [BRD §10.6 — “Sales Returns”] [BRD §11.5 — “Purchase Returns”]
- A stock count affects inventory only after approval; each variance needs a reason and material variances need manager approval. [BRD §12.4 — “Physical Stock Count”]
- Negative inventory is a temporary visible exception, limited by product/warehouse/user, reason, quantity/value, and age; it is not physical availability. [BRD §17.17 — “Controlled Negative Inventory and Automatic Netting”]
- Profit and valuation remain provisional while negative-stock cost is unresolved. [BRD §17.17 — “Controlled Negative Inventory and Automatic Netting”] [SRS §12.3 — “Costing”]

## 6.3 Cash

- Cash changes only when money actually moves or an approved opening/adjustment entry posts. [BRD §13 — “Cash, Payment, and Expense Management”]
- Each money movement identifies account, amount, date, type, actor, and business reason/source. [BRD §13.2 — “Cash Movement Types”]
- Cash, bank, vehicle cash, and personal funds are separate; movement in one does not silently increase another. [BRD §13.1 — “Cash Accounts”] [BRD §13.6 — “Cash Closing and Count”]
- A transfer is a paired out/in movement and does not change company-total cash in the same currency. [BRD scenario S-20 — “Cash Transfer”] [SRS §16.3 — “Rules”]
- Owner contribution is not sales revenue; owner withdrawal is not operating expense. [BRD §13.2 — “Cash Movement Types”]
- Negative cash is a visible exception with permission, reason, amount limit, age, approval, and clearing link; false receipts must not conceal it. [BRD §17.16 — “Controlled Negative Cash”]
- Personal payment creates a separately tracked reimbursable amount rather than fictitious business cash. [BRD §13.5 — “Expenses”]

## 6.4 Receivables, Payables, and Advances

- Receivable and payable for the same partner remain separate; net position is informational only. [BRD §14.1 — “Separation of Accounts Receivable and Accounts Payable”] [SRS §11.2 — “Partner Balances”]
- Posted sale creates receivable; posted purchase creates payable; payments, returns, and cancellations settle or reverse the relevant direction. [BRD §14.2 — “Creation and Settlement of Outstanding Balances”]
- A payment allocation cannot exceed either the source payment or the target open amount. [BRD §14.4 — “Allocating One Payment Across Multiple Documents”] [SRS §17.1 — “Allocation Model”]
- One payment may settle several documents in one direction; it must not settle both receivables and payables automatically. [BRD §14.4 — “Allocating One Payment Across Multiple Documents”]
- Unallocated customer money is customer advance; unallocated supplier payment is supplier advance; advances are neither revenue nor expense. [BRD §14.3 — “Advances”]
- Advance application should be proposed and user-confirmed unless the business separately approves automatic use. [BRD §14.3 — “Advances”]
- Payment cancellation reverses allocations and reopens affected documents. [BRD §14.4 — “Allocating One Payment Across Multiple Documents”]

## 6.5 Partners

- One partner record represents the same person/company in both customer and supplier roles. [BRD §8.1 — “Unified Business Partner Concept”]
- Possible duplicates are shown based on normalized name, phone, tax number, and other identifiers; used partners are inactivated, not deleted. [BRD §7.2 — “Duplicate Prevention and Data Quality Rules”] [SRS §10 — “Master Data”]
- Inactive partners remain visible historically but are unavailable for new documents. [BRD §7.2 — “Duplicate Prevention and Data Quality Rules”]
- Sales-specific and purchasing-specific Yellow Cards must not be mixed when one partner has both roles. [BRD §17.15 — “Business-Partner-Specific Reminder Notes - ‘Yellow Card’”]
- WhatsApp number, consent, preferred language, and sending history are controlled partner communication data. [BRD §8.2 — “Information Maintained on the Business Partner Record”]

## 6.6 Products

- Active product codes are unique; used products are not deleted. [BRD §7.2 — “Duplicate Prevention and Data Quality Rules”]
- Product type and category are separate concepts. [BRD §9.1 — “Product Types”]
- Each product has one primary unit; fractional quantity permission follows unit configuration. [BRD §9.4 — “Units of Measure and Fractional Quantities”]
- Standard sale price and latest purchase price are informational defaults; posted line price and cost snapshots preserve history. [BRD §9.3 — “Pricing and Cost Rules”] [SRS §12.2 — “Product Requirements”]
- Zero or negative price requires special permission and justification under the BRD. [BRD §9.3 — “Pricing and Cost Rules”]
- Critical threshold basis must distinguish main warehouse, specific warehouse, and company-total stock. [BRD §17.14 — “Automatic Critical Inventory Early Warning”]

## 6.7 Bundles

- A commercial bundle normally has a sale price but consumes component stock. [BRD §15.1 — “Bundle Concept”]
- Availability is limited by the least available required component. [BRD §15.3 — “Bundle Inventory and Cost Rules”]
- Bundle COGS is the sum of component costs at sale time. [BRD §15.3 — “Bundle Inventory and Cost Rules”]
- Historical bundle sales preserve the component definition/version used at posting. [BRD §15.3 — “Bundle Inventory and Cost Rules”] [SRS §18 — “Bundles and Promotions”]
- Component substitutions are not recommended for the initial phase. [BRD §15.2 — “Bundle Record”]
- Bundle return behavior is an open decision and must not be invented. [BRD §15.3 — “Bundle Inventory and Cost Rules”] [BRD §28 — “Open Decisions”]

## 6.8 Yatı

- Goods loaded into a vehicle remain company-owned unsold inventory. [BRD §17.1 — “Yatı Concept and Core Business Principle”]
- Vehicle warehouse and vehicle cash remain separate from central ledgers while consolidating into company totals. [BRD §17.1 — “Yatı Concept and Core Business Principle”]
- Field sales use the vehicle warehouse and, for received money, the vehicle cash account; they cannot silently use another warehouse/account. [BRD §17.5 — “Field Sales and Delivery of Products”]
- Starting expense cash is an account transfer, not an expense. [BRD §17.4 — “Starting a Trip and Loading Goods”]
- Old-balance collection can occur without a new sale and must be allocated to prior sales. [BRD §17.6 — “Collecting Previous Balances, Advances, and Refunds in the Field”]
- Inventory and cash differences are investigated separately and cannot be concealed with false sales or expenses. [BRD §§17.9–17.10]
- Closed trips accept no new operation unless a controlled reopening policy applies; the BRD and SRS conflict on whether reopening is possible. [BRD §17.3 — “Yatı Statuses and Status Transitions”] [SRS §20.1 — “Trip Status Machine”]

## 6.9 Attachments

- A photograph or file is evidence only and never posts or approves a transaction by itself. [BRD §17.13 — “Mobile Photo-Based Goods Receipt and Receipt Archive”]
- Evidence remains linked to cancelled transactions and is not deleted to hide history. [BRD §17.13 — “Mobile Photo-Based Goods Receipt and Receipt Archive”]
- Upload access and download access require authorization; metadata includes hash, MIME, size, name, uploader, and capture time. [SRS §21.2 — “Attachments and Mobile Capture”]
- Duplicate aid may use file hash and supplier/date/amount metadata, but suspected duplicates require review. [BRD §17.13 — “Mobile Photo-Based Goods Receipt and Receipt Archive”] [SRS §21.2 — “Attachments and Mobile Capture”]
- Physical-document retention and photo-quality policy remain human decisions. [BRD §28 — “Open Decisions”]

## 6.10 WhatsApp

- Only a posted, valid document may be shared as an official invoice. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]
- Recipient number and message content must be previewed; consent and correct number are required. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]
- Receivable and payable are shown separately; net-only messaging is prohibited. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]
- Sending or reading a message is not payment confirmation. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]
- Cancellation/return does not erase previous sending history; a new correction message may be sent. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]
- Shared links must be partner-isolated and invalidatable after cancellation. [BRD §17.12 — “Sharing Invoices and Balances Through WhatsApp”]

## 6.11 Audit

- Audit is append-only and no user may edit or delete it. [BRD §19.1 — “Audit History”] [SRS §23.2 — “Audit Log”]
- Audit identifies actor, time, action, entity/document, old/new material values, reason, and source/reversal links. [BRD §19.1 — “Audit History”]
- Creation, posting, cancellation, status transition, payment allocation, permission change, period close/reopen, override, export, and sensitive view are auditable. [BRD §19.1 — “Audit History”] [SRS §3 — “Architecture Principles”]
- Notification history does not replace audit history. [BRD §19.3 — “Notification Management”]
- Sensitive values such as passwords, tokens, full signed URLs, and unnecessary partner notes must not enter logs/audit payloads. [SRS §29.1 — “Security”] [SRS §30.3 — “Observability”]

## 6.12 Period Closing

- Closed periods block new backdated postings, business-date changes, cancellation, and allocation changes. [BRD §18.3 — “Period Closing”]
- Reopening requires management permission, reason, audit notification, correction, and reclose. [BRD §18.3 — “Period Closing”]
- The closing checklist includes cash, inventory, open balances/advances, drafts, returns, write-offs, and cancellations. [BRD §25.3 — “Monthly Closing Procedure”]
- Closing and posting must not race; the SRS requires transactional protection generally but does not define a period-lock protocol. [SRS §8.2 — “Posting Service Pattern”] [SRS §23.1 — “Accounting Period”]

## 6.13 Permissions

- Viewing a screen and performing a transaction are separate permissions. [BRD §6.1 — “Permission Principles”]
- Posting, cancellation, backdating, high discount, stock adjustment, negative stock/cash, trip close, and period reopen require granular authorization. [BRD §6.1 — “Permission Principles”] [SRS §6.2 — “Permission Model”]
- Frontend hiding is not security; the API independently enforces every protected action. [SRS §9 — “Authentication and User Management”]
- User accounts are personal and are deactivated rather than deleted when employment ends. [BRD §6.1 — “Permission Principles”]
- No role may alter audit history. [BRD §6.1 — “Permission Principles”]
- Maker/approver separation is optional and remains a business policy decision. [BRD §6.1 — “Permission Principles”]

# 7. Technical Architecture Summary

## 7.1 Frontend

- React 19, TypeScript strict mode, and Vite provide a single-page, mobile-first application. Ant Design is the required UI library; React Hook Form and Zod handle form state and client validation. [SRS §2 — “Technology Baseline”]
- Redux Toolkit is limited to authentication, permissions, preferences, feature flags, offline draft queue, and cross-feature UI state. Server entities should not be duplicated into Redux without an explicit offline reason. [SRS §26.2 — “State Strategy”]
- Axios is the single configured HTTP client with request IDs, auth handling, normalized errors, abort/cancellation support, and a feature-hook/query-cache pattern. [SRS §2 — “Technology Baseline”] [SRS §26.2 — “State Strategy”]
- The UI is Azerbaijani in v1, mobile-usable at 360px, permission-aware, and required to expose persistent negative/warning states rather than transient toasts only. [SRS §4.3 — “Time, Locale, and Currency”] [SRS §26.3 — “UX Rules”]

## 7.2 Backend

- NestJS with TypeScript implements a REST API as a modular monolith. Each domain has its own module, service, controller, repository boundary, DTOs, policy checks, and tests. [SRS §2 — “Technology Baseline”] [SRS §3 — “Architecture Principles”]
- The backend is authoritative for totals, decimal calculations, stock/cash/settlement effects, permissions, status transitions, numbering, and report values. [SRS §3 — “Architecture Principles”]
- Multi-ledger posting uses a PostgreSQL transaction and must commit stock, cash, settlement, status, audit, and outbox records atomically. [SRS §8.2 — “Posting Service Pattern”]
- Serializable isolation, row locking, or checked atomic updates prevent overselling; optimistic `version` checks protect draft edits. [SRS §8.2 — “Posting Service Pattern”] [SRS §25.1 — “REST Conventions”]

## 7.3 Database

- PostgreSQL is the single transactional database, with UTC timestamps, separate business dates, UUID identifiers, numeric money/quantity fields, immutable ledger movements, and indexed reporting paths. [SRS §2 — “Technology Baseline”] [SRS §7.1 — “Common Entity Fields”] [SRS §29.2 — “Performance and Scale”]
- Every proposed entity carries `companyId`, although the SRS does not define a `Company` or membership model; this blocks a final schema. [SRS §7.1 — “Common Entity Fields”]
- Stock and money movements are immutable sources; current balances and advance totals are projections/materializations that must reconcile to source transactions. [SRS §7 — “Domain Model and Data Ownership”] [SRS §15.3 — “Stock Balance Invariant”]

## 7.4 ORM

- Prisma owns schema migrations and typed persistence access. Business logic must remain in services, not Prisma middleware. [SRS §2 — “Technology Baseline”]
- Prisma `Decimal`/decimal-safe utilities are required for authoritative money, quantity, price, cost, and rate calculations. [SRS §7.2 — “Money and Quantity Types”]
- Transactional entities avoid cascade deletion; unique constraints are company-scoped; snapshots and explicit reversal/source relations preserve historical meaning. [SRS Appendix A — “Recommended Prisma Modeling Rules”]

## 7.5 Authentication

- JWT uses short-lived access tokens and rotating refresh tokens; refresh-token hashes are stored per device/session with revocation support. [SRS §6.3 — “Authentication Requirements”]
- Passwords use Argon2id; failed-attempt lockout is configurable; logout and administrative revocation invalidate sessions. [SRS §6.3 — “Authentication Requirements”]
- Access tokens are not stored in `localStorage`; the SRS prefers an in-memory access token and secure same-site refresh cookie. [SRS §6.3 — “Authentication Requirements”]

## 7.6 Authorization

- Roles are permission collections and the API uses guards/policy services for granular action checks. The SRS also proposes explicit per-user additions/removals but does not model their storage or precedence. [SRS §6.2 — “Permission Model”]
- Permission checks are server-side; denied authenticated actions return 403 and are audited where sensitive. [SRS §9 — “Authentication and User Management”] [SRS §25.1 — “REST Conventions”]
- The permission list and endpoint catalog are inconsistent, so one canonical registry is required before implementation. [SRS §6.2 — “Permission Model”] [SRS §25.2 — “Error Contract” and endpoint catalog]

## 7.7 File Storage

- File bytes use S3-compatible object storage, MinIO, or a local adapter; PostgreSQL stores metadata and polymorphic business links. [SRS §2 — “Technology Baseline”] [SRS §21.2 — “Attachments and Mobile Capture”]
- Uploads require allowlisted type/size validation, hash and metadata, authorization-checked signed downloads, and optional malware scanning. [SRS §21.2 — “Attachments and Mobile Capture”] [SRS §29.1 — “Security”]
- Orphan upload handling, retention, deletion policy, legal archive rules, and backup-consistent restore are not fully specified.

## 7.8 API Style

- REST under `/api/v1`; JSON; UUIDs; ISO dates; pagination/filter/sort; `Idempotency-Key` on mutations; `version` for optimistic updates; `x-request-id` on responses. [SRS §25.1 — “REST Conventions”]
- OpenAPI/Swagger is generated from NestJS DTOs/decorators. Validation returns HTTP 422 with field detail; business conflict/concurrency uses 409; auth uses 401/403. [SRS §2 — “Technology Baseline”] [SRS §25.2 — “Error Contract”]
- Decimal wire encoding, date-only business-date encoding, complete command payloads, and several domain endpoints remain unspecified.

## 7.9 Testing

- Frontend uses Vitest and React Testing Library; backend uses Jest/Supertest; PostgreSQL integration tests verify real transaction behavior. [SRS §2 — “Technology Baseline”] [SRS §28.1 — “Test Pyramid”]
- Required levels are unit, service integration, API integration, component, critical E2E, and concurrency. [SRS §28.1 — “Test Pyramid”]
- Mandatory concurrency cases include simultaneous last-stock posting, duplicate idempotency keys, and refresh-token reuse. [SRS §28.1 — “Test Pyramid”]
- The SRS contains 15 critical E2E tests, but the BRD contains 38 scenarios and no complete mapping exists. [BRD §21 — “End-to-End Business Scenarios”] [SRS §28.2 — “Critical E2E Scenarios”]

## 7.10 Deployment

- Docker Compose is proposed for web, API, PostgreSQL, optional MinIO, and optional worker. The web is a static React build served by nginx or a platform; the API is a Node process. [SRS §30.1 — “Docker Services”]
- Environments are local, test, staging, and production with synthetic/resettable/anonymized/live data rules. [SRS §4.2 — “Environments”]
- Exact production hosting, CI/CD, DNS/TLS termination, rolling deployment, rollback, worker topology, and platform-specific mapping are not selected. The source documents do not define a Netlify deployment approach.

## 7.11 Observability

- Structured JSON logs include request ID, user, company, route, duration, status, and safe error code. [SRS §30.3 — “Observability”]
- Metrics cover request rate/error/latency, DB pool, posting failures, outbox backlog, exports, and storage failures; alerts cover backup failure, space, repeated posting errors, backlog, and 5xx rate. [SRS §30.3 — “Observability”]
- Health endpoints cover liveness, readiness, database, object storage, and queue/outbox. [SRS §29.3 — “Reliability”]
- The telemetry vendor, retention, dashboards, on-call ownership, and escalation policy remain unspecified.

## 7.12 Backup and Recovery

- Database and object-storage backups must be encrypted at rest. Daily automated backup is required; the recommendation is 7 daily, 4 weekly, and 6 monthly copies. [SRS §29.1 — “Security”] [SRS §29.3 — “Reliability”]
- A documented restore procedure and periodic restore test are required. [SRS §29.3 — “Reliability”]
- RPO, RTO, off-site/region strategy, backup owner, restore-test frequency, and consistency between PostgreSQL and object storage remain open operational decisions.

# 8. Business and Technical Alignment

## 8.1 Authority and Approval — **Conflict**

- **Business requirement:** BRD approval and open-decision resolution precede technical planning.
- **Technical coverage:** SRS declares itself the software-behavior source of truth and an implementation-ready baseline.
- **Gap/risk:** Technical defaults can override unapproved business behavior; both approval pages are unsigned.
- **Recommended next action:** Approve the authority hierarchy and disposition every conflict/open decision before domain coding. [BRD — “Document Control and Usage”] [SRS — “How to Use This Document”]

## 8.2 Scope Boundaries — **Covered**

- **Business requirement:** Operational ERP only; production, payroll, statutory accounting, e-commerce, GPS, and automatic bank feeds excluded.
- **Technical coverage:** SRS exclusions substantially match.
- **Gap/risk:** No material scope conflict.
- **Recommended next action:** Preserve exclusions in traceability and backlog. [BRD §4 — “Scope and Boundaries”] [SRS §1.3 — “Out of Scope for v1”]

## 8.3 Core Posting and Ledger Invariants — **Covered**

- **Business requirement:** drafts have no effect; posting is authoritative; posted facts are immutable; directions and vehicle ledgers remain separate.
- **Technical coverage:** Atomic transaction, immutable ledgers, explicit transitions, reversals, idempotency, and backend authority.
- **Gap/risk:** Protocol details for idempotency and some ledgers remain incomplete.
- **Recommended next action:** Treat BRD effects as acceptance oracles and specify command protocols. [BRD §5 — “Core Business Principles”] [SRS §§3 and 5]

## 8.4 Roles, Permissions, and Approvals — **Partially covered**

- **Business requirement:** role packages plus separate high-risk permissions and optional maker/approver separation.
- **Technical coverage:** granular roles/permissions, API guards, and session security.
- **Gap/risk:** Permission registry does not match endpoints; no approval-request model; override is confused with approval.
- **Recommended next action:** Define canonical permissions and approval lifecycle before transactional modules. [BRD §§6 and 18.2] [SRS §6]

## 8.5 Master Data — **Partially covered**

- **Business requirement:** all reusable operational masters, duplicate control, inactivation, history.
- **Technical coverage:** partner/product/category/unit entities and general master rules.
- **Gap/risk:** Vehicle/route, expense category, asset category, message template, alert recipients, and several setup APIs are incomplete.
- **Recommended next action:** Complete master-data catalog and ownership in the traceability matrix. [BRD §7 — “Master Data Management”] [SRS §§7 and 10]

## 8.6 Unified Partners and Separate Balances — **Covered**

- **Business requirement:** one partner, two separate balance directions, informational net only.
- **Technical coverage:** BusinessPartner and direction-specific balance/allocation rules preserve this.
- **Gap/risk:** Underlying obligation/advance source model remains incomplete.
- **Recommended next action:** Define immutable settlement sources before schema finalization. [BRD §§8 and 14] [SRS §§11 and 17]

## 8.7 Product and Unit Rules — **Partially covered**

- **Business requirement:** product types, categories, primary unit, fractional control, defaults, thresholds.
- **Technical coverage:** Catalog entities and unit/stock flags are proposed.
- **Gap/risk:** unit conversion, historical category reporting, semi-finished terminology, and some configuration remain open.
- **Recommended next action:** Resolve business policies without creating a fourth product type implicitly. [BRD §9 — “Product and Category Management”] [SRS §12]

## 8.8 Weighted-Average Cost — **Conflict**

- **Business requirement:** weighted average is recommended but explicitly awaits approval.
- **Technical coverage:** SRS mandates perpetual weighted average for v1.
- **Gap/risk:** An unapproved business choice controls inventory value and gross profit.
- **Recommended next action:** Obtain explicit approval and define scope, negative-stock fallback, and cost-adjustment method. [BRD §§9.3 and 28] [SRS §12.3]

## 8.9 Sales — **Partially covered**

- **Business requirement:** full draft/post/payment/return/cancel/discount/zero-price/limit behavior.
- **Technical coverage:** sale entities and core commands exist.
- **Gap/risk:** discount order/input, payment and return status dimensions, balance-limit behavior, same-day cancellation settlement, and approval model are incomplete.
- **Recommended next action:** Create a sales state/effect matrix before schema/API work. [BRD §10 — “Sales Processes”] [SRS §13]

## 8.10 Purchasing — **Partially covered**

- **Business requirement:** actual receipt, duplicate supplier invoice, evidence review, price correction, payment, return, cancellation.
- **Technical coverage:** major posting/return guards are present.
- **Gap/risk:** no complete purchase schema/API, mobile review status, later price-adjustment command, or supplier refund obligation model.
- **Recommended next action:** Specify purchase and goods-receipt state models separately where needed. [BRD §11 — “Purchasing Processes”] [SRS §14]

## 8.11 Inventory and Warehouses — **Partially covered**

- **Business requirement:** immutable movements, counts, write-offs, transfers, as-of valuation, negative cases.
- **Technical coverage:** strong movement/balance model and negative-case concept.
- **Gap/risk:** write-off APIs, transfer staging, opening controls, cost finalization, and as-of algorithm are incomplete.
- **Recommended next action:** Finalize movement catalog and invariants after costing decision. [BRD §12] [SRS §15]

## 8.12 Cash and Money Accounts — **Partially covered**

- **Business requirement:** receipts, payments, expenses, transfers, owner movements, closing, negative cash.
- **Technical coverage:** money accounts and movement types cover most flows.
- **Gap/risk:** personal reimbursement, deferred expenses, opening cash, and some reversal/closing states lack complete models.
- **Recommended next action:** Define the money/obligation boundary before implementation. [BRD §13] [SRS §16]

## 8.13 Payment Allocation and Advances — **Partially covered**

- **Business requirement:** document-level allocation, reallocation, advances, no cross-direction netting.
- **Technical coverage:** PaymentAllocation and direction rules are proposed.
- **Gap/risk:** no canonical receivable/payable ledger; advance source/use and return-generated balances are ambiguous.
- **Recommended next action:** Approve a settlement ledger model and exact cancellation/reallocation semantics. [BRD §14] [SRS §17]

## 8.14 Bundles — **Open Decision**

- **Business requirement:** component issue/cost and historical definition; return policy unresolved.
- **Technical coverage:** bundle explosion/versioning covered.
- **Gap/risk:** physical stocked-bundle mode conflicts with always-explode behavior; return allocation missing.
- **Recommended next action:** Decide physical mode and return/refund allocation. [BRD §15] [SRS §§5 and 18]

## 8.15 Fixed Assets — **Conflict**

- **Business requirement:** required purchase/cash linkage and statuses including reserve, unusable, missing, sold, written off.
- **Technical coverage:** simplified asset card and movement history; linkage is optional and statuses are collapsed.
- **Gap/risk:** business state and financial traceability are lost.
- **Recommended next action:** Reconcile status catalog and required acquisition/disposal commands. [BRD §16] [SRS §19]

## 8.16 Yatı — **Partially covered**

- **Business requirement:** complete vehicle inventory/cash lifecycle, field operations, reconciliation, controlled reopening.
- **Technical coverage:** strong trip data and formulas.
- **Gap/risk:** SRS makes CLOSED terminal; `CANCELLED_WITH_REVERSAL` is undefined; additional-load/cash-handover command details and carryover rules are incomplete.
- **Recommended next action:** Approve one trip state machine and ledger command matrix. [BRD §17] [SRS §20]

## 8.17 WhatsApp Sharing — **Partially covered**

- **Business requirement:** invoices and statements, preview, consent, secure invalidatable links, history.
- **Technical coverage:** invoice/share version history and optional deep-link/direct API.
- **Gap/risk:** statement endpoint, preview enforcement, link invalidation, and provider-result semantics are incomplete.
- **Recommended next action:** Define v1 as user-controlled deep link or direct API and specify security lifecycle. [BRD §17.12] [SRS §21.1]

## 8.18 Mobile Evidence — **Partially covered**

- **Business requirement:** photo-created draft, review/reject, duplicate warning, creator/reviewer/approver, retention.
- **Technical coverage:** secure file metadata and generic links.
- **Gap/risk:** review state, rejection, orphan handling, and retention are absent.
- **Recommended next action:** Add a document-evidence lifecycle without allowing uploads to post transactions. [BRD §17.13] [SRS §21.2]

## 8.19 Critical Stock and Notifications — **Partially covered**

- **Business requirement:** correct threshold basis, recipients, state/action, repeat suppression, recovery.
- **Technical coverage:** alert lifecycle, outbox, in-app/optional Telegram.
- **Gap/risk:** critical source, restore threshold, reminder cadence, and recipients remain undecided.
- **Recommended next action:** Approve configuration semantics before alert automation. [BRD §17.14] [SRS §22]

## 8.20 Yellow Cards — **Open Decision**

- **Business requirement:** INFO, acknowledgment, BLOCK; override authority is a business decision.
- **Technical coverage:** levels exist; unspecified explicit override permission may bypass BLOCK.
- **Gap/risk:** “blocking” meaning and approval versus override remain inconsistent.
- **Recommended next action:** Decide whether BLOCK is absolute or manager-overridable and model acknowledgment/approval. [BRD §§17.15 and 28] [SRS §11.3]

## 8.21 Audit — **Covered**

- **Business requirement:** immutable history for material action and correction.
- **Technical coverage:** append-only AuditLog with actor, request, before/after, reason, and sensitive-view coverage.
- **Gap/risk:** data-retention and audit payload redaction policy still require operational detail.
- **Recommended next action:** Make audit a foundation service used by every vertical slice. [BRD §19.1] [SRS §23.2]

## 8.22 Period Closing and Corrections — **Partially covered**

- **Business requirement:** block historical changes; controlled reopen; reverse rather than edit.
- **Technical coverage:** period entity, guards, correction matrix.
- **Gap/risk:** SRS both permits closed-period reallocation with permission/current correction and rejects changing allocations in closed periods.
- **Recommended next action:** Decide current-period correction versus reopen policy and define locking. [BRD §18] [SRS §§17.1 and 23.1]

## 8.23 Reporting — **Partially covered**

- **Business requirement:** complete operational, financial, trip, evidence, and control reports.
- **Technical coverage:** primary dashboard and register reports are listed.
- **Gap/risk:** best/slow sellers, price changes, non-moving stock, payment-allocation report, owner movements, average collection period, and evidence completeness are omitted.
- **Recommended next action:** Build report traceability to source ledgers and BRD definitions. [BRD §20] [SRS §24]

## 8.24 Migration and Opening Balances — **Not covered**

- **Business requirement:** cleansed masters, cutover, opening stock/cash/balances/advances, disputed flags, sign-off.
- **Technical coverage:** no complete migration/opening-balance contract or API.
- **Gap/risk:** go-live data may be fabricated as ordinary transactions or remain unauditable.
- **Recommended next action:** Define migration batch, opening document types, approvals, and reconciliation before schema finalization. [BRD §24] [SRS §7]

## 8.25 Daily Operations and Go-Live — **Not covered**

- **Business requirement:** daily/weekly/monthly controls, training, pilot, daily first-month reconciliation.
- **Technical coverage:** environments and quality gates, but no operating-runbook contract.
- **Gap/risk:** technically correct software may be operated outside the intended controls.
- **Recommended next action:** Convert BRD procedures into go-live checklist and operational acceptance. [BRD §§25 and 26.1] [SRS §§28–30]

## 8.26 API and Frontend — **Partially covered**

- **Business requirement:** all workflows must be operable with simple mobile-first screens.
- **Technical coverage:** coherent REST conventions, route map, UX rules, and partial endpoint catalog.
- **Gap/risk:** missing endpoints/permissions for bundles, assets, write-offs, opening balances, statement sharing, settings, approvals, and several masters.
- **Recommended next action:** Complete endpoint-command traceability before scaffolding domain modules. [SRS §§25–26]

## 8.27 Testing and Traceability — **Partially covered**

- **Business requirement:** test real connected scenarios, including two-user inventory races and report reconciliation.
- **Technical coverage:** strong test pyramid and 15 critical E2E cases.
- **Gap/risk:** no mapping of all 38 BRD scenarios to requirements, entities, endpoints, screens, and tests.
- **Recommended next action:** Create the requirement traceability matrix next. [BRD §§21 and 23.1] [SRS §§28 and 31]

## 8.28 Security, Reliability, and Backup — **Covered**

- **Business requirement:** controlled access, evidence privacy, audit, and operational reliability.
- **Technical coverage:** robust baseline for TLS, Argon2id, cookies, rate limits, upload validation, logs, outbox, backup, and restore.
- **Gap/risk:** deployment-specific CSRF/CORS, RPO/RTO, vendor choices, and ownership remain open.
- **Recommended next action:** Capture these as ADRs and operational decisions before production deployment. [SRS §§29–30]

# 9. Contradictions and Ambiguities

## 9.1 Inside the Business Requirements Document

1. **BRD-CA-01 — Initial account/warehouse count:** “at least one warehouse and one cash account” with multiples possibly in the future conflicts with initial-scope Yatı, which requires a separate vehicle warehouse and vehicle cash account. [BRD §4.3 — “Initial Business Assumptions”] [BRD §17.1 — “Yatı Concept and Core Business Principle”]
2. **BRD-CA-02 — Closed trip versus retained balance:** CLOSED says remaining goods and cash are handed over, while later rules permit permanent vehicle stock and a fixed expense float. [BRD §17.3 — “Yatı Statuses and Status Transitions”] [BRD §§17.9–17.10]
3. **BRD-CA-03 — Transfer shortage:** warehouse transfers may use a negative-stock exception, while scenario S-18 says transfer quantity cannot exceed available inventory. [BRD §12.6 — “Warehouse Transfers”] [BRD scenario S-18]
4. **BRD-CA-04 — Bundle shortage:** bundle sale is absolutely blocked when a component is unavailable, while general sales may use controlled negative inventory; bundle-component applicability is unstated. [BRD §15.3 — “Bundle Inventory and Cost Rules”] [BRD §10.5 — “Inventory Check and Release of Goods”]
5. **BRD-CA-05 — Blocking Yellow Card:** BLOCK is described as preventing posting, but the scenario and open decision refer to manager-approved exceptions. [BRD §17.15] [BRD scenario S-36] [BRD §28]
6. **BRD-CA-06 — Embedded versus separate payment:** sale/purchase headers contain paid amount, method, and account, but cash receipt/payment is repeatedly a separate document. Atomicity and cancellation ownership are unclear. [BRD §§10.2–10.3] [BRD §§11.2–11.3] [BRD §§13.3–13.4]
7. **BRD-CA-07 — Sale cancellation cash outcome:** cancellation reverses all effects, but allocated receipts must first be reorganized; cancel, unallocate-to-advance, or refund behavior is not selected. [BRD §10.7] [BRD §14.4]
8. **BRD-CA-08 — Allocation equality:** unallocated money may remain an advance, while another rule says allocations must equal the payment exactly and any remainder is an advance; whether advance is an allocation target is unclear. [BRD §14.4] [BRD §18.4 — “Rounding and Amount Precision”]
9. **BRD-CA-09 — One status field:** POSTED, PAID, PARTIALLY_PAID, PARTIALLY_RETURNED, and FULLY_RETURNED are presented together although several can be true simultaneously. [BRD §18.1 — “Document Statuses”]
10. **BRD-CA-10 — Mobile receipt posting point:** approved receipt-stage inventory impact may occur before price verification, while the rest of the BRD states posted purchase creates inventory and payable together. [BRD §11.4] [BRD §17.13]
11. **BRD-CA-11 — Fixed-asset acquisition:** an asset links to purchase/cash, but ordinary purchase increases sellable inventory and no non-stock asset purchase/payable flow is defined. [BRD §13.5] [BRD §16.3]
12. **BRD-CA-12 — Fixed-asset sale on credit:** cash sale is described, but later collection explicitly requires an undefined receivable policy. [BRD §16.3] [BRD scenario S-26]
13. **BRD-CA-13 — Return balance type:** paid sale return may create customer advance or refund; paid purchase return may create supplier receivable, credit, or advance, without selection criteria. [BRD §10.6] [BRD §11.5]
14. **BRD-CA-14 — Negative-stock costing:** provisional profit must later change, but no formula identifies how receipt cost, old average, negative quantity, and prior sale COGS interact. [BRD §9.3] [BRD §17.17]
15. **BRD-CA-15 — Product taxonomy:** product types exclude semi-finished goods, but critical-stock rules name semi-finished products. [BRD §9.1] [BRD §17.14]
16. **BRD-CA-16 — Official invoice content:** an “official invoice” may be shared, but tax/VAT/legal invoice requirements remain open and statutory accounting is excluded. [BRD §17.12] [BRD §§4.2 and 28]
17. **BRD-CA-17 — Discount calculation:** line and document discounts may coexist, but order and percentage-versus-amount input are undecided. [BRD §10.4 — “Discounts and Price Changes”]
18. **BRD-CA-18 — Historical category reporting:** historical documents must not change, but reports may use current or transaction-date category; no policy is selected. [BRD §7.2]
19. **BRD-CA-19 — Additional purchase cost:** transport/additional costs are captured, but capitalization into inventory cost is unresolved. [BRD §11.2]
20. **BRD-CA-20 — Duplicate merge:** partner merge/transfer is required as a controlled process, but its identity, balance, and audit behavior is not defined. [BRD §22 — “Exceptions and High-Risk Cases”]

## 9.2 Inside the Software Requirements & Technical Specification

1. **SRS-CA-01 — Permission registry mismatch:** endpoint permissions such as `sales.read`, `purchases.read`, `purchases.return`, `inventory.read`, `cash.read`, `cash.manage`, `cash.close`, `settlement.manage`, and `trips.read` are absent from the canonical permission list. [SRS §6.2] [SRS §25]
2. **SRS-CA-02 — Closed-period allocation:** reallocation may use permission/current-period correction, while Accounting Period rejects allocation changes in a closed period. [SRS §17.1] [SRS §23.1]
3. **SRS-CA-03 — Undefined trip status:** LOADED can transition to `CANCELLED_WITH_REVERSAL`, but that state is not defined; `CANCELLED` is defined separately. [SRS §20.1]
4. **SRS-CA-04 — Bundle stock mode:** core rules permit explicitly stocked physical bundles, while bundle posting and mandatory test behavior always explode components; no mode or entity behavior distinguishes them. [SRS §5] [SRS §18] [SRS §28.2]
5. **SRS-CA-05 — Universal company scope without Company:** every entity has `companyId`, but there is no `Company` or user-company membership entity. [SRS §7.1]
6. **SRS-CA-06 — Per-user permission overrides:** explicit additions/removals are promised without an entity or precedence rule. [SRS §6.2] [SRS §7]
7. **SRS-CA-07 — Settlement source ambiguity:** `paidTotal`, `openTotal`, allocations, and derived `AdvanceBalance` exist without a canonical receivable/payable obligation ledger or exact reversal derivation. [SRS §§7, 11.2, and 17.1]
8. **SRS-CA-08 — Incomplete status machines:** transfer, count, adjustment, expense, payment, cash closing, reconciliation, attachment, and export lifecycle states are not fully specified. [SRS §8.1]
9. **SRS-CA-09 — Idempotency protocol:** keys are required, but scope, payload hash, pending behavior, failure replay, retention, and mismatch response are not defined. [SRS §§25.1 and 29.3]
10. **SRS-CA-10 — Period-close race:** transactional posting is described, but no lock/serialization rule prevents a posting transaction racing with period close. [SRS §§8.2 and 23.1]
11. **SRS-CA-11 — Offline draft queue:** Redux stores an offline draft queue, but synchronization, conflict resolution, security, and prohibition of offline posting are unstated. [SRS §2] [SRS §26.2]
12. **SRS-CA-12 — Missing domain contracts:** assets, bundles, write-offs, opening balances, approvals, statement sharing, and several masters lack full entity/API/permission coverage despite being milestone deliverables. [SRS §§7, 25, and 27.2]

## 9.3 Between the Two Documents

1. **X-CA-01 — Authority:** BRD requires business approval before technical planning; SRS calls itself the behavior source and implementation-ready. [BRD — “Document Control and Usage”] [SRS — “How to Use This Document”]
2. **X-CA-02 — Conflict priority:** SRS tells coding agents to prioritize its core invariants during conflict, contrary to the BRD-first authority used here. [SRS §27.1] [BRD — “Document Control and Usage”]
3. **X-CA-03 — Costing:** BRD leaves weighted average open; SRS mandates it and omits the decision from its open-decision appendix. [BRD §§9.3 and 28] [SRS §12.3]
4. **X-CA-04 — Zero-price sale:** BRD requires special permission/reason; SRS validation says price `>= 0`, making zero ordinarily valid unless another unstated guard exists. [BRD §§9.3 and 10.4] [SRS §13.3]
5. **X-CA-05 — Closed-trip reopening:** BRD permits controlled reopening; SRS makes CLOSED terminal. [BRD §17.3] [SRS §20.1]
6. **X-CA-06 — Fixed-asset lifecycle:** BRD requires richer statuses and acquisition linkage; SRS simplifies statuses and makes purchase/money linkage optional. [BRD §16] [SRS §19]
7. **X-CA-07 — Currency scope:** BRD recommends one base currency initially; SRS introduces per-document/account currency and separated multi-currency reporting without defining whether multi-currency is active. [BRD §§22 and 28] [SRS §4.3]
8. **X-CA-08 — Sales KPI:** BRD defines sales revenue net of returns; SRS “today sales” excludes cancelled sales but shows returns separately, leaving net/gross presentation ambiguous. [BRD §20.6] [SRS §24.1]
9. **X-CA-09 — Status dimensions:** BRD includes payment and return statuses; SRS generic machine omits payment statuses without explicitly replacing them with orthogonal dimensions. [BRD §18.1] [SRS §8.1]
10. **X-CA-10 — Yellow Card override:** BRD leaves manager override as an open decision; SRS allows an unspecified explicit override permission. [BRD §§17.15 and 28] [SRS §11.3]
11. **X-CA-11 — Migration and operations:** BRD requires cutover/opening-balance and daily operating controls; SRS has no equivalent implementation contract. [BRD §§24–26] [SRS §§27–31]
12. **X-CA-12 — Required workflow coverage:** BRD has 38 end-to-end scenarios; SRS defines 15 critical E2E tests without a complete mapping. [BRD §21] [SRS §28.2]

# 10. Open Decisions

The BRD open-decision table has topics but no decision IDs. This analysis assigns `BRD-OD-*` identifiers only for traceability; they are not source-issued IDs. SRS IDs `OD-01` through `OD-12` are source-issued. Defaults below remain recommendations, not approvals.

## 10.1 Explicit BRD Open Decisions

### BRD-OD-01 — Base Currency

- **Question:** Will v1 use one base currency only?
- **Current recommendation/safe default:** One currency in the initial phase.
- **Business impact:** Determines document, balance, cash, pricing, and reporting interpretation.
- **Technical impact:** Currency constraints, account/document fields, conversion prohibition, report aggregation.
- **Decision deadline:** Before schema and money API design. [BRD §28 — “Open Decisions”]

### BRD-OD-02 — Initial Warehouses

- **Question:** How many warehouses are active at go-live, including vehicle and damaged locations?
- **Current recommendation/safe default:** At least one warehouse with future multi-warehouse support; this recommendation is insufficient for initial Yatı.
- **Business impact:** Custody, stock availability, counting, transfers, and trip operation.
- **Technical impact:** Seed/configuration, warehouse types, assignment constraints, reporting.
- **Decision deadline:** Before master-data and opening-stock design. [BRD §28 — “Open Decisions”] [BRD §17.1]

### BRD-OD-03 — Initial Cash Accounts

- **Question:** Which cash, vehicle cash, and manually tracked bank accounts exist at go-live?
- **Current recommendation/safe default:** At least one main cash account plus additional required accounts.
- **Business impact:** Cash custody, reconciliation, trip operation, and owner-fund separation.
- **Technical impact:** Account types, opening balances, transfer rules, access control.
- **Decision deadline:** Before money-account setup and opening cash. [BRD §28]

### BRD-OD-04 — Negative Inventory Scope and Limits

- **Question:** Which products, warehouses, users, quantities/values, and durations may go negative?
- **Current recommendation/safe default:** Delayed-entry cases only; permission, reason, limit, warning, and target clearance within one business day.
- **Business impact:** Trading continuity versus inventory/profit reliability.
- **Technical impact:** policy engine, locks, case lifecycle, provisional cost, alerts, reports.
- **Decision deadline:** Before inventory posting and costing. [BRD §28]

### BRD-OD-05 — Negative Cash Scope and Limits

- **Question:** Which accounts/users, maximum deficit, and maximum age are allowed?
- **Current recommendation/safe default:** Authorized users only, mandatory reason, daily management review.
- **Business impact:** Continuity versus concealed cash/personal-funding risk.
- **Technical impact:** posting guard, exception case, approval, alert, clearance linkage.
- **Decision deadline:** Before cash posting and trip cash. [BRD §28]

### BRD-OD-06 — Inventory Costing Method

- **Question:** Is weighted average accepted, and at what scope?
- **Current recommendation/safe default:** Weighted average is recommended by the BRD.
- **Business impact:** inventory value, COGS, gross profit, returns, historical correction.
- **Technical impact:** cost engine, movement valuation, negative-stock adjustment, reports.
- **Decision deadline:** Before final inventory schema and any purchase/sale posting code. [BRD §§9.3 and 28]

### BRD-OD-07 — Discount Approval Threshold

- **Question:** Above which percentage/amount is manager approval required?
- **Current recommendation/safe default:** Configurable; no hard-coded value.
- **Business impact:** margin control and sales speed.
- **Technical impact:** settings, approval/override, audit, UI, tests.
- **Decision deadline:** Before sales acceptance and production configuration. [BRD §28]

### BRD-OD-08 — Open-Balance Limit Behavior

- **Question:** Does exceeding a partner limit warn, require approval, or block?
- **Current recommendation/safe default:** Warning plus manager approval.
- **Business impact:** commercial risk and customer service.
- **Technical impact:** partner policy, approval flow, post guard, audit.
- **Decision deadline:** Before sales posting rules. [BRD §28]

### BRD-OD-09 — Due-Date Requirement

- **Question:** Is due date mandatory when an open sale/purchase balance remains, and what standard term is proposed?
- **Current recommendation/safe default:** Mandatory with a proposed standard number of days.
- **Business impact:** aging and collection/payment discipline.
- **Technical impact:** validation, default terms, aging, reports, notifications.
- **Decision deadline:** Before sale/purchase DTO and schema finalization. [BRD §28]

### BRD-OD-10 — Bundle Returns

- **Question:** Must a full bundle be returned, or may selected components be returned?
- **Current recommendation/safe default:** Show returned components explicitly.
- **Business impact:** customer refund, stock condition, and margin.
- **Technical impact:** price/discount/COGS allocation, returnable quantity, invoice presentation.
- **Decision deadline:** Before bundle and sales-return implementation. [BRD §§15.3 and 28]

### BRD-OD-11 — Mutual Offset Settlement

- **Question:** May receivables and payables for the same partner be manually offset?
- **Current recommendation/safe default:** No automatic netting; add a separate offset document only if required.
- **Business impact:** legal/commercial settlement and statement clarity.
- **Technical impact:** optional command/entity, dual-direction allocations, audit.
- **Decision deadline:** Before settlement schema is frozen. [BRD §28]

### BRD-OD-12 — Fixed-Asset Depreciation

- **Question:** Is simple management depreciation required in v1?
- **Current recommendation/safe default:** No; registration and expenses only.
- **Business impact:** asset value reporting.
- **Technical impact:** depreciation schedule, posting/report fields, period processing.
- **Decision deadline:** Before fixed-asset module scope approval. [BRD §§16.4 and 28]

### BRD-OD-13 — Tax/VAT

- **Question:** Must tax/VAT be represented separately on documents?
- **Current recommendation/safe default:** Out of scope unless legally required; clarify before technical planning.
- **Business impact:** invoice legality, pricing, partner communication.
- **Technical impact:** line/document tax fields, rounding, PDF, reports, migration.
- **Decision deadline:** Before sale/purchase schema and invoice template. [BRD §28]

### BRD-OD-14 — Backdating Limit

- **Question:** How far back may an ordinary user enter a transaction?
- **Current recommendation/safe default:** Only within the current open period and with additional permission.
- **Business impact:** historical accuracy and operational correction.
- **Technical impact:** date guard, permissions, period lock, audit.
- **Decision deadline:** Before posting policy implementation. [BRD §28]

### BRD-OD-15 — Yatı Remaining Stock and Float

- **Question:** May a closed trip retain vehicle stock and fixed expense float?
- **Current recommendation/safe default:** Return all stock; only an approved fixed cash float may remain.
- **Business impact:** trip accountability and next-trip opening.
- **Technical impact:** closing guards, carryover records, reconciliation formulas.
- **Decision deadline:** Before trip status and close command design. [BRD §28]

### BRD-OD-16 — Yatı Reconciliation Signatories

- **Question:** Who signs inventory and cash reconciliation?
- **Current recommendation/safe default:** Route Sales Representative plus Warehouse Officer/Cashier; Manager for differences.
- **Business impact:** custody accountability.
- **Technical impact:** required acknowledgments, role checks, approval records.
- **Decision deadline:** Before trip close workflow. [BRD §28]

### BRD-OD-17 — WhatsApp Consent

- **Question:** Is separate messaging consent required for each partner?
- **Current recommendation/safe default:** Store consent and confirmed number on partner record.
- **Business impact:** privacy and customer communication.
- **Technical impact:** partner fields, sharing guard, audit, data retention.
- **Decision deadline:** Before messaging production use. [BRD §28]

### BRD-OD-18 — Critical-Inventory Basis

- **Question:** Is threshold calculated for main warehouse, each warehouse, company total, or more than one basis?
- **Current recommendation/safe default:** Separate main-warehouse available and total-company thresholds for raw materials.
- **Business impact:** purchasing response and production availability.
- **Technical impact:** threshold model, event keys, alert deduplication, reporting.
- **Decision deadline:** Before alert schema and rules. [BRD §28]

### BRD-OD-19 — Yellow Card Override

- **Question:** Who may override BLOCK and for which reasons?
- **Current recommendation/safe default:** Manager only; mandatory reason and approval audit.
- **Business impact:** enforcement of partner-specific commercial restrictions.
- **Technical impact:** permission, approval entity, policy guard, audit.
- **Decision deadline:** Before partner warning and sales/Yatı posting. [BRD §28]

### BRD-OD-20 — Physical and Photo Retention

- **Question:** How long are physical documents/files retained and what photo quality is required?
- **Current recommendation/safe default:** Approve a written archive policy with Financial Control.
- **Business impact:** evidence, disputes, privacy, legal compliance.
- **Technical impact:** storage lifecycle, retention, deletion/legal hold, backup capacity.
- **Decision deadline:** Before production file storage. [BRD §28]

## 10.2 Explicit SRS/TDS Open Decisions

### OD-01 — Document Numbering Format

- **Question:** What sequences and formats apply by document/company/year?
- **Current recommendation/safe default:** `SAL-YYYY-000001`, `PUR-YYYY-000001`, `TRP-YYYY-000001` per company.
- **Business impact:** human traceability and document convention.
- **Technical impact:** sequence entity, uniqueness, transactional allocation, rollover.
- **Decision deadline:** Before schema and posting. [SRS Appendix B — “Open Decisions and Safe Defaults”]

### OD-02 — Primary Business Currency

- **Question:** Which currency is primary and is multi-currency active?
- **Current recommendation/safe default:** Configurable; never assume conversion.
- **Business impact:** prices, statements, cash, and reports.
- **Technical impact:** currency constraints and no-cross-currency aggregation.
- **Decision deadline:** Before money schema. [SRS Appendix B]

### OD-03 — Transport Cost Capitalization

- **Question:** Do purchase transport/additional costs increase inventory cost?
- **Current recommendation/safe default:** Off; record as expense until approved.
- **Business impact:** inventory value, COGS, gross profit.
- **Technical impact:** landed-cost allocation and cost adjustments.
- **Decision deadline:** Before purchase costing implementation. [SRS Appendix B]

### OD-04 — Trip Remaining Stock

- **Question:** Can stock remain in vehicle at close?
- **Current recommendation/safe default:** Return all to central.
- **Business impact:** custody and trip separation.
- **Technical impact:** closing guards and carryover.
- **Decision deadline:** Before trip close design. [SRS Appendix B]

### OD-05 — Trip Remaining Cash

- **Question:** Can cash remain in vehicle at close?
- **Current recommendation/safe default:** Transfer all to central cash.
- **Business impact:** cash custody and next-trip funding.
- **Technical impact:** handover command and close guard.
- **Decision deadline:** Before trip close design. [SRS Appendix B]

### OD-06 — Automatic Advance Application

- **Question:** Does a new sale/purchase automatically consume available advance?
- **Current recommendation/safe default:** Suggest only; user confirms.
- **Business impact:** partner expectations and document settlement.
- **Technical impact:** allocation command, UI confirmation, idempotency.
- **Decision deadline:** Before settlement integration. [SRS Appendix B]

### OD-07 — Discount Approval Threshold

- **Question:** What configurable threshold triggers approval?
- **Current recommendation/safe default:** Configurable percentage; no hard-coded value.
- **Business impact:** margin control.
- **Technical impact:** settings and policy checks.
- **Decision deadline:** Before sales production configuration. [SRS Appendix B]

### OD-08 — Negative Stock/Cash Activation

- **Question:** Are negative exceptions enabled, and under which explicit flags and permissions?
- **Current recommendation/safe default:** Globally disabled; enable explicitly.
- **Business impact:** operational continuity versus control.
- **Technical impact:** feature flags, guards, case lifecycles, tests.
- **Decision deadline:** Before transactional posting. [SRS Appendix B]

### OD-09 — WhatsApp Integration

- **Question:** User-initiated deep link or direct Business API?
- **Current recommendation/safe default:** Deep link in v1; direct API later.
- **Business impact:** automation, delivery evidence, operating effort.
- **Technical impact:** provider credentials, webhooks, retry, result semantics.
- **Decision deadline:** Before messaging implementation. [SRS Appendix B]

### OD-10 — Telegram Recipients

- **Question:** How are users/chats mapped to alerts?
- **Current recommendation/safe default:** Configured mapping; no code-level IDs.
- **Business impact:** who receives critical alerts.
- **Technical impact:** secure configuration, outbox destination, delivery audit.
- **Decision deadline:** Before Telegram enablement. [SRS Appendix B]

### OD-11 — Tax/VAT

- **Question:** Is tax required?
- **Current recommendation/safe default:** Out of scope until decided.
- **Business impact:** invoice legality and commercial amounts.
- **Technical impact:** schema, formulas, PDF, reports.
- **Decision deadline:** Before commercial document schema. [SRS Appendix B]

### OD-12 — Multi-Currency FX Gains/Losses

- **Question:** Will FX accounting be supported?
- **Current recommendation/safe default:** Out of scope; documents/accounts remain currency-specific.
- **Business impact:** multi-currency settlement and profit.
- **Technical impact:** no implicit conversion; currency-isolated reports.
- **Decision deadline:** Before enabling more than one operational currency. [SRS Appendix B]

## 10.3 Additional Material Decisions Stated Outside the Registers

These have no source-issued IDs; `AD-*` identifiers are analysis-local.

### AD-01 — Unit Conversion

- **Question:** May a product be purchased and sold in different units, and what conversion precision/rounding applies?
- **Recommendation:** Do not enable until approved.
- **Impacts/deadline:** Quantity, cost, returns, and reports; decide before product and line schema. [BRD §4.3 — “Initial Business Assumptions”]

### AD-02 — Maker/Approver Separation

- **Question:** Must creator and approver be different for selected actions?
- **Recommendation:** Configurable per risk class; no silent assumption.
- **Impacts/deadline:** Staffing, approval entities, permissions; decide before approval architecture. [BRD §6.1]

### AD-03 — Historical Category Attribution

- **Question:** Do reports use current category or transaction-date category snapshot?
- **Recommendation:** Preserve snapshot capability; business must select report semantics.
- **Impacts/deadline:** historical comparability and line schema; decide before catalog/report schema. [BRD §7.2]

### AD-04 — Discount Input and Order

- **Question:** Percentage, amount, or both; and in what order do line and document discounts apply?
- **Recommendation:** No formula should be coded until approved.
- **Impacts/deadline:** totals, tax if added, refunds, margin; decide before sale DTO/formula. [BRD §10.4]

### AD-05 — Damaged Receipt Destination

- **Question:** Should damaged received goods enter normal, damaged, or immediate-return flow?
- **Recommendation:** Require explicit choice per receipt.
- **Impacts/deadline:** stock availability, payable, evidence; decide before goods-receipt posting. [BRD §11.4]

### AD-06 — Transfer Staging

- **Question:** One-step transfer or dispatched/in-transit/received stages?
- **Recommendation:** One-step for initial simple operations; retain staged flow as future capability.
- **Impacts/deadline:** custody, in-transit stock, cancellation; decide before transfer state model. [BRD §12.6]

### AD-07 — Deferred Expense Obligation

- **Question:** How is an expense incurred now but paid later represented?
- **Recommendation:** No source recommendation beyond requiring a separate decision.
- **Impacts/deadline:** payables, cash timing, reports; decide before expense schema. [BRD scenario S-19]

### AD-08 — Personal-Fund Reimbursement

- **Question:** What obligation entity and settlement command repay employee/owner funding?
- **Recommendation:** Keep separate from negative cash and ordinary supplier payable.
- **Impacts/deadline:** cash and liability correctness; decide before cash/expense schema. [BRD §§13.5 and 17.16]

### AD-09 — Return Credit Classification

- **Question:** When do return excesses become advance, refund payable, supplier receivable, or supplier credit?
- **Recommendation:** No source-selected answer.
- **Impacts/deadline:** settlement ledger, partner statements, refunds; decide before returns. [BRD §§10.6 and 11.5]

### AD-10 — Physical Pre-Packaged Bundles

- **Question:** Can a bundle be a separately stocked physical product?
- **Recommendation:** Component mode is the initial norm; separately stocked mode needs explicit approval.
- **Impacts/deadline:** loading, movement duplication, availability, returns; decide before bundle schema. [BRD §17.4] [SRS §5]

### AD-11 — Message Templates

- **Question:** Which texts/languages are approved and who may edit them?
- **Recommendation:** Business-approved templates with version history.
- **Impacts/deadline:** legal/commercial communication and audit; decide before sharing. [BRD §17.12]

### AD-12 — Alert Threshold/Reminder Semantics

- **Question:** What is a major further decrease, restore threshold, reminder cadence, action status, and recipient threshold?
- **Recommendation:** Typed configuration, not hard-coded values.
- **Impacts/deadline:** alert usefulness/noise and event model; decide before notifications. [BRD §17.14] [SRS §22.1]

### AD-13 — Negative-Stock Cost Finalization

- **Question:** Recalculate prior COGS or post an explicit cost adjustment, and is weighted average warehouse- or company-scoped?
- **Recommendation:** Preserve posted history and use traceable adjustments unless business/accounting approval selects otherwise.
- **Impacts/deadline:** profit, valuation, audit, period reports; decide before cost engine. [BRD §17.17] [SRS §12.3]

### AD-14 — Orthogonal Document States

- **Question:** Are lifecycle, payment, return, approval, and cancellation represented as separate states?
- **Recommendation:** Separate dimensions are technically safer, but business terminology must be approved.
- **Impacts/deadline:** schema, commands, UI, reports; decide before transaction models. [BRD §18.1] [SRS §8.1]

### AD-15 — Closed-Period Correction Policy

- **Question:** Reopen the old period or post a current-period correcting entry, and under which cases?
- **Recommendation:** No single source-consistent answer; require management policy.
- **Impacts/deadline:** historical reports, audit, allocations, cost; decide before period control. [BRD scenario S-24] [SRS §§17.1 and 23.1]

### AD-16 — Fixed-Asset Credit Acquisition/Sale

- **Question:** How are unpaid asset purchases and deferred asset sales represented?
- **Recommendation:** Do not reuse product inventory or ordinary sales without an approved obligation model.
- **Impacts/deadline:** cash, receivable/payable, asset history; decide before assets. [BRD §16.3] [BRD scenario S-26]

### AD-17 — Company and Membership Model

- **Question:** Is v1 truly single-company, and why does every entity contain `companyId`?
- **Recommendation:** Either define Company/membership isolation or remove unimplemented multi-company semantics from the baseline.
- **Impacts/deadline:** security boundary, uniqueness, queries, migration; decide before Prisma schema. [SRS §7.1]

### AD-18 — Per-User Permission Overrides

- **Question:** How are explicit additions/removals stored and which takes precedence over roles?
- **Recommendation:** Deny undeclared overrides until modeled.
- **Impacts/deadline:** authorization correctness; decide before Identity schema. [SRS §6.2]

### AD-19 — Idempotency Protocol

- **Question:** What scopes a key, how is payload mismatch handled, and how long are results retained?
- **Recommendation:** Actor + route/command + key, request hash, stable result, conflict on changed payload; this is a technical safe default requiring ADR approval.
- **Impacts/deadline:** duplicate posting/payment/reversal; decide in foundation. [SRS §§25.1 and 29.3]

### AD-20 — Offline Draft Queue

- **Question:** Which drafts are stored offline, how are conflicts resolved, and are sensitive fields encrypted?
- **Recommendation:** Queue drafts only; never queue posting or financial commands until a full sync policy is approved.
- **Impacts/deadline:** duplicate posting, privacy, stale stock; decide before frontend offline work. [SRS §§2 and 26.2]

### AD-21 — Production Deployment and Recovery Targets

- **Question:** Which hosting platform, CI/CD, worker topology, RPO, RTO, backup owner, and restore cadence apply?
- **Recommendation:** No source-selected platform; retain daily encrypted backup and restore drill as minimum.
- **Impacts/deadline:** availability, cost, operations, security; decide before production scaffolding/deployment. [SRS §§29.3 and 30]

# 11. High-Risk Areas

## 11.1 Multi-Ledger Transactions

- **Risk:** Sale, purchase, return, cancellation, trip load, transfer, and payment can update several ledgers and statuses. Partial commit would make stock, cash, balances, and audit disagree.
- **Required control:** One database transaction, backend recalculation, immutable source movements, and rollback on any failed effect.
- **Unresolved exposure:** Exact settlement and return-generated obligation models are incomplete.
- **Sources:** [BRD §5 — “Core Business Principles”] [SRS §8.2 — “Posting Service Pattern”]

## 11.2 Concurrency

- **Risk:** Two users can post against the same last stock, open amount, cash position, number sequence, or draft version.
- **Required control:** Database-enforced serialization/checked update, optimistic versioning, unique constraints, and concurrency tests.
- **Unresolved exposure:** The SRS describes sale-stock concurrency but not complete allocation, close, costing, and trip concurrency.
- **Sources:** [BRD §10.5 — “Inventory Check and Release of Goods”] [BRD §23.1 — “Business Testing Principle”] [SRS §28.1 — “Test Pyramid”]

## 11.3 Race Conditions

- **Risk:** Period close can race a post; trip close can race a field transaction; alert resolution can race a new issue; cancellation can race payment allocation.
- **Required control:** Explicit command-ordering and lock strategy on period, trip, target document, stock balance, and allocation aggregate.
- **Unresolved exposure:** Lock order and deadlock/retry policy are unspecified.
- **Sources:** [SRS §8.2 — “Posting Service Pattern”] [SRS §23.1 — “Accounting Period”]

## 11.4 Database Locking and Isolation

- **Risk:** Serializable isolation alone may cause retries/deadlocks; row locking without a canonical order can deadlock; stale materialized balances can allow overselling.
- **Required control:** ADR for isolation by command, deterministic lock order, checked balance predicates, retry limits, and invariant-based tests.
- **Unresolved exposure:** Prisma/PostgreSQL lock implementation is not selected.
- **Sources:** [SRS §8.2 — “Posting Service Pattern”] [SRS §15.3 — “Stock Balance Invariant”]

## 11.5 Idempotency

- **Risk:** Network retry or double click can duplicate sale, payment, cancellation, share, transfer, or notification.
- **Required control:** Persisted idempotency record with command scope, actor/company, request hash, state, stable response, retention, and conflict on changed payload.
- **Unresolved exposure:** Protocol details and retention are absent.
- **Sources:** [SRS §3 — “Architecture Principles”] [SRS §25.1 — “REST Conventions”] [SRS §29.3 — “Reliability”]

## 11.6 Duplicate Posting

- **Risk:** Different idempotency keys can still submit the same business event; supplier invoices and photo receipts can be entered twice.
- **Required control:** Business uniqueness where valid, duplicate heuristics, immutable source references, warning/approval, and reconciliation.
- **Unresolved exposure:** Duplicate detection must not incorrectly block legitimate repeated amounts/documents.
- **Sources:** [BRD §11.4 — “Receipt Differences and Invoice Discrepancies”] [BRD §17.13 — “Mobile Photo-Based Goods Receipt and Receipt Archive”]

## 11.7 Historical Corrections

- **Risk:** Backdated or reopened-period changes alter as-of stock, cost, profit, cash, and aging.
- **Required control:** Immutable correction, explicit business date, open-period guard, audit, reason, report regeneration/provisional markers.
- **Unresolved exposure:** Reopen versus current-period correcting-entry policy is inconsistent.
- **Sources:** [BRD §18.3 — “Period Closing”] [BRD scenario S-24] [SRS §23.3 — “Correction Matrix”]

## 11.8 Cancellation

- **Risk:** Exact reversal may be impossible after goods are sold, payments are reallocated, returns exist, or cost has changed.
- **Required control:** Dependency analysis, guard matrix, exact source links, unallocation/resolution, and idempotent reversal.
- **Unresolved exposure:** Direct payment cancellation and return interaction are not fully defined.
- **Sources:** [BRD §§10.7 and 11.6] [SRS §23.3]

## 11.9 Returns

- **Risk:** Excess quantity, wrong cost, wrong stock condition, or wrong refund/advance classification distorts all ledgers.
- **Required control:** Original-line link, remaining-returnable quantity, original price/cost, condition destination, and explicit settlement command.
- **Unresolved exposure:** Bundle return allocation and supplier/customer credit classification are open.
- **Sources:** [BRD §§10.6, 11.5, and 15.3] [SRS §§13.4 and 14.2]

## 11.10 Payment Allocation

- **Risk:** Over-allocation, cross-direction netting, wrong partner/document, concurrent settlement, or closed-period reallocation can corrupt balances.
- **Required control:** Direction and partner checks, source/target aggregate locks, exact decimal sums, immutable reversals, and audit.
- **Unresolved exposure:** Canonical receivable/payable and advance source model is missing.
- **Sources:** [BRD §14.4] [SRS §17.1]

## 11.11 Weighted-Average Cost

- **Risk:** Unapproved method/scope and historical receipt changes materially alter valuation and gross profit.
- **Required control:** Approved formula and scope, decimal precision, immutable cost snapshots, explicit cost adjustments, reconciliation tests.
- **Unresolved exposure:** Method remains open in BRD but mandatory in SRS; negative quantity makes the simple formula insufficient.
- **Sources:** [BRD §§9.3 and 28] [SRS §12.3]

## 11.12 Negative Stock

- **Risk:** Exception becomes normal, physical availability is overstated, COGS is provisional, and later receipt may clear the wrong issue.
- **Required control:** default disabled, narrow eligibility, reason/limit/age, FIFO-like case linkage or another approved allocation, alerts, and provisional reporting.
- **Unresolved exposure:** cost finalization, bundle applicability, and warehouse/company costing scope are open.
- **Sources:** [BRD §17.17] [SRS §15.5]

## 11.13 Negative Cash

- **Risk:** Deficit can hide missing receipts, personal financing, fraud, or late entry.
- **Required control:** default disabled, permission, reason, amount/age, personal-funding alternative, management review, and clearing link.
- **Unresolved exposure:** employee/owner reimbursement ledger is undefined.
- **Sources:** [BRD §17.16] [SRS §16.4]

## 11.14 Offline Draft Queue

- **Risk:** A stale offline draft may use old stock, price, Yellow Card, permission, or period state; retry can duplicate posting.
- **Required control:** drafts only, local sensitivity protection, server revalidation, version conflict UX, and no offline ledger commands.
- **Unresolved exposure:** SRS names the queue but supplies no sync protocol.
- **Sources:** [SRS §2 — “Technology Baseline”] [SRS §26.2 — “State Strategy”]

## 11.15 File Uploads

- **Risk:** malware, oversized files, content spoofing, unauthorized access, orphan files, duplicate receipts, privacy leakage, and backup inconsistency.
- **Required control:** MIME/extension/size validation, hash, signed access after authorization, quarantine/scanning, lifecycle cleanup, retention, and audit.
- **Unresolved exposure:** orphan/retention/legal-hold and PostgreSQL/object-store consistency are unspecified.
- **Sources:** [BRD §17.13] [SRS §21.2] [SRS §29.1]

## 11.16 WhatsApp Sharing

- **Risk:** disclosure to wrong recipient, stale balance, insecure link, unrecorded delivery result, or message treated as payment proof.
- **Required control:** consent/number preview, stable document version, partner-isolated expiring/invalidation-capable link, immutable share history.
- **Unresolved exposure:** deep link versus direct API, statement endpoint, invalidation, and delivery semantics.
- **Sources:** [BRD §17.12] [SRS §21.1]

## 11.17 Authorization

- **Risk:** frontend-only controls, permission-name mismatch, role escalation, shared accounts, or confused approval/override lets users bypass controls.
- **Required control:** canonical permission registry, server policy checks, session revocation, least privilege, reasoned approvals, and security tests.
- **Unresolved exposure:** endpoint list and permission list differ; per-user override precedence is absent.
- **Sources:** [BRD §6.1] [SRS §§6.2 and 9]

## 11.18 Audit

- **Risk:** missing, mutable, excessive, or sensitive audit data makes incidents unexplained or leaks information.
- **Required control:** append-only writes in the same transaction, required actor/request/source/reason fields, redaction, restricted reads/exports, retention.
- **Unresolved exposure:** retention and immutable infrastructure controls are not defined beyond application API prohibition.
- **Sources:** [BRD §19.1] [SRS §23.2] [SRS §29.1]

## 11.19 Reporting Correctness

- **Risk:** duplicated calculations, mutable master classifications, provisional cost, currency mixing, return treatment, or historical corrections cause reports not to reconcile.
- **Required control:** reports derive from source ledgers, display filters/timezone/currency/provisional flags, and reconcile to document lists.
- **Unresolved exposure:** sales net-of-returns definition conflicts; historical category and cost-adjustment semantics are open.
- **Sources:** [BRD §§20.6 and 23.1] [SRS §§24.1 and 24.3]

## 11.20 Yatı Reconciliation

- **Risk:** goods/cash entrusted to a vehicle can be double-counted, mixed with personal funds, or hidden through false documents.
- **Required control:** separate vehicle ledgers, complete formulas, two-party handover, actual counts, difference reasons/approval, and close guards.
- **Unresolved exposure:** retained balances, reopen behavior, additional-load/cash-handover commands, and bundle loading mode.
- **Sources:** [BRD §§17.4–17.10] [SRS §§20.2–20.5]

## 11.21 Period and Sequence Integrity

- **Risk:** sequence allocation gaps/duplicates or posting after close creates inconsistent legal/business numbering and history.
- **Required control:** transactional company-scoped uniqueness, no promise of gapless numbers unless approved, and period serialization.
- **Unresolved exposure:** sequence allocation timing/gap policy and period locking are unspecified.
- **Sources:** [SRS §7 — “Domain Model and Data Ownership”] [SRS Appendix B — “Open Decisions and Safe Defaults”]

# 12. Recommended Module Boundaries

These are recommended modular-monolith boundaries. They clarify ownership; they do not approve unresolved entity shapes or business rules.

## 12.1 Identity

- **Responsibility:** users, roles, permissions, sessions, authentication, deactivation, session revocation.
- **Owns data:** `User`, `Role`, `Permission`, `UserRole`, `Session`; any approved user-permission override records.
- **Exposes commands:** login, refresh, logout, revoke, create/update/deactivate user, assign role/permission.
- **Depends on:** Audit and Configuration; no operational domain dependency.
- **Must not do:** decide transaction permissions in frontend only, own partner/employee business records, or mutate audit.
- **Sources:** [SRS §§6, 7, and 9]

## 12.2 Configuration and Control

- **Responsibility:** typed settings, numbering, feature flags, business date/period rules, approval-policy definitions, idempotency protocol.
- **Owns data:** `SystemSetting`, `Sequence`, `AccountingPeriod`; recommended approval/idempotency records after design approval.
- **Exposes commands:** change setting, allocate number, close/reopen period, request/approve/reject override, register/replay idempotent command.
- **Depends on:** Identity and Audit.
- **Must not do:** contain sales/purchase formulas or silently convert open decisions into defaults.
- **Sources:** [SRS §7] [SRS §§23 and 30.2]

## 12.3 Master Data

- **Responsibility:** generic lifecycle and conventions for reusable masters not owned by a more specific module.
- **Owns data:** expense categories, asset categories, vehicles/routes if not owned by Trips, and approved reference lists.
- **Exposes commands:** create/update/inactivate/search; duplicate suggestion.
- **Depends on:** Identity, Configuration, Audit.
- **Must not do:** hard-delete referenced records or own transaction history.
- **Sources:** [BRD §7] [SRS §10]

## 12.4 Partners

- **Responsibility:** unified partner identity/contact, terms, consent, limits, and Yellow Cards.
- **Owns data:** `BusinessPartner`, `PartnerContact`, `PartnerWarning`, warning acknowledgments/overrides once approved.
- **Exposes commands:** create/update/inactivate partner, create/deactivate warning, validate partner policy, retrieve partner profile.
- **Depends on:** Identity, Configuration, Audit.
- **Must not do:** own or net financial balances; send messages directly; alter historical document snapshots.
- **Sources:** [BRD §8] [SRS §11]

## 12.5 Catalog and Bundles

- **Responsibility:** products, categories, units, price defaults/history, bundle definitions and versions.
- **Owns data:** `Product`, `ProductCategory`, `UnitOfMeasure`, `ProductPrice`, `Bundle`, `BundleItem`.
- **Exposes commands:** maintain/inactivate catalog, validate quantity unit, version bundle, explode bundle definition for a business date.
- **Depends on:** Configuration and Audit.
- **Must not do:** own stock balances, calculate final sale totals, or rewrite historical bundle components.
- **Sources:** [BRD §§9 and 15] [SRS §§12 and 18]

## 12.6 Inventory

- **Responsibility:** immutable stock movement, balance, transfer, count, adjustment, write-off, opening stock, negative-stock cases.
- **Owns data:** `Warehouse`, `StockMovement`, `StockBalance`, `StockTransfer`/lines, `StockCount`/lines, `StockAdjustment`, `NegativeStockCase`.
- **Exposes commands:** validate/reserve-for-post transactionally, post receipt/issue/transfer/count/adjustment/write-off/reversal, query as-of stock, clear negative case.
- **Depends on:** Catalog, Configuration/Period, Identity, Audit; calls Costing policy.
- **Must not do:** create sales/purchases, infer commercial price, or treat vehicle transfer as revenue.
- **Sources:** [BRD §12] [SRS §15]

## 12.7 Costing

- **Responsibility:** approved inventory valuation, COGS snapshot, return cost, provisional negative-stock cost, explicit cost adjustment.
- **Owns data:** cost fields/adjustment records attached to immutable inventory movements; final model pending decision.
- **Exposes commands:** calculate receipt average, issue cost, return cost, finalize provisional cost, report valuation.
- **Depends on:** Inventory and Purchasing source costs, Configuration/Period, Audit.
- **Must not do:** change posted cost silently or select weighted-average policy without approval.
- **Sources:** [BRD §§9.3 and 17.17] [SRS §12.3]

## 12.8 Sales

- **Responsibility:** sale draft, total calculation, posting orchestration, returns, cancellation, channels, document snapshots.
- **Owns data:** `Sale`, `SaleLine`, `SaleReturn`, `SaleReturnLine`; orthogonal statuses after approval.
- **Exposes commands:** create/update/delete draft, post, return, cancel, generate invoice version request.
- **Depends on:** Partners, Catalog, Inventory/Costing, Settlement, optional Cash, Trips context, Control, Audit.
- **Must not do:** directly own stock/money ledgers, automatically net payable, or edit posted lines.
- **Sources:** [BRD §10] [SRS §13]

## 12.9 Purchasing

- **Responsibility:** purchase/receipt draft, actual quantity/price, posting orchestration, returns, cancellation, supplier invoice uniqueness.
- **Owns data:** `Purchase`, `PurchaseLine`, `PurchaseReturn`, `PurchaseReturnLine`; receipt-review state after approval.
- **Exposes commands:** create/update/delete draft, submit/review receipt, post, return, cancel, correct through approved command.
- **Depends on:** Partners, Catalog, Inventory/Costing, Settlement, optional Cash, Documents, Control, Audit.
- **Must not do:** receive invoiced rather than actual quantity, treat evidence as approval, or silently edit posted price.
- **Sources:** [BRD §11] [SRS §14]

## 12.10 Cash and Expenses

- **Responsibility:** money accounts and immutable movements, receipts, payments, expenses, transfers, refunds, owner movements, cash closing, negative-cash cases, personal funding.
- **Owns data:** `MoneyAccount`, `MoneyTransaction`, `Expense`, `CashClosing`, `NegativeCashCase`; personal-funding obligation model pending decision.
- **Exposes commands:** receive, pay, expense, refund, transfer, reverse, count/close, open/clear negative case.
- **Depends on:** Partners, Settlement, Trips context, Documents, Control, Audit.
- **Must not do:** own sale/purchase amounts, invent receipts to clear deficits, or mix personal and business cash.
- **Sources:** [BRD §13] [SRS §16]

## 12.11 Settlement

- **Responsibility:** direction-specific obligations/open amounts, payment allocations/reallocations, advances, aging, return/cancellation settlement.
- **Owns data:** `PaymentAllocation`; canonical obligation/advance source model must be approved before schema.
- **Exposes commands:** create receivable/payable effect from posted source, allocate, reallocate/reverse, apply/refund advance, settle return/cancellation, produce statement projection.
- **Depends on:** Sales, Purchasing, Cash, Partners, Control/Period, Audit.
- **Must not do:** net receivable/payable automatically, exceed source/target amounts, or mutate money/source documents.
- **Sources:** [BRD §14] [SRS §17]

## 12.12 Field Trips

- **Responsibility:** trip plan/status/assignments, load orchestration, field-context guards, stock/cash reconciliation, closing.
- **Owns data:** `FieldTrip`, `TripLoad`/lines, `TripExpense` link/context, `TripReconciliation`, handover/acknowledgment records.
- **Exposes commands:** create, load/add/return load, activate, submit reconciliation, record counts/differences, close/reopen/cancel under approved state machine.
- **Depends on:** Inventory, Sales, Cash, Settlement, Partners, Documents, Control, Audit.
- **Must not do:** duplicate stock/cash ledgers, treat loading as sale, or hide differences.
- **Sources:** [BRD §17] [SRS §20]

## 12.13 Fixed Assets

- **Responsibility:** asset identity, acquisition link, location/responsibility, condition, maintenance/repair, sale/write-off/loss history.
- **Owns data:** `FixedAsset`, `AssetMovement`, approved maintenance/warranty fields.
- **Exposes commands:** register, assign/handover, move, send/return repair, mark missing, sell, write off, attach evidence.
- **Depends on:** Partners, Purchasing/Cash, Documents, Notifications, Control, Audit.
- **Must not do:** enter sellable stock, disappear sold/written-off assets, or invent deferred settlement.
- **Sources:** [BRD §16] [SRS §19]

## 12.14 Documents

- **Responsibility:** file metadata, secure upload/download, polymorphic links, evidence review support, document/PDF version artifacts.
- **Owns data:** `Attachment`, upload state, file hash/metadata, document version metadata; object bytes via adapter.
- **Exposes commands:** presign/initiate upload, complete, link, review/reject evidence, authorize download, generate stable artifact, invalidate link.
- **Depends on:** Identity, object storage, Configuration, Audit.
- **Must not do:** post or approve business transactions, expose cross-partner files, or delete evidence silently.
- **Sources:** [BRD §17.13] [SRS §21.2]

## 12.15 Messaging

- **Responsibility:** approved templates, recipient preview/consent guard, WhatsApp/deep-link/provider adapter, immutable share attempts.
- **Owns data:** `MessageShare`, message template/version if not Master Data, provider result/error.
- **Exposes commands:** preview invoice/statement, share, retry delivery safely, send correction version.
- **Depends on:** Partners, Sales/Settlement statement projections, Documents, outbox, Audit.
- **Must not do:** change balances, treat delivery as payment, erase prior shares, or expose unrestricted links.
- **Sources:** [BRD §17.12] [SRS §21.1]

## 12.16 Notifications

- **Responsibility:** in-app notifications, critical-stock alert lifecycle, optional Telegram delivery, repeat suppression, acknowledgment/action.
- **Owns data:** `Notification`, `StockAlert`, delivery/outbox records.
- **Exposes commands:** open/update/resolve alert, enqueue delivery, acknowledge/action, retry/escalate.
- **Depends on:** source domain events, Configuration, Identity recipient mapping, Audit.
- **Must not do:** roll back source posting on delivery failure, create purchases automatically, or replace audit.
- **Sources:** [BRD §§17.14 and 19] [SRS §22]

## 12.17 Audit

- **Responsibility:** append-only record of security, master, business, control, export, share, and sensitive-view events.
- **Owns data:** `AuditLog`.
- **Exposes commands:** append within caller transaction, search/export under permission.
- **Depends on:** Identity/request context; no operational-domain ownership.
- **Must not do:** allow update/delete, store secrets, or become the source ledger for balances.
- **Sources:** [BRD §19.1] [SRS §23.2]

## 12.18 Reporting

- **Responsibility:** read-only reconciled dashboards, registers, statements, aging, valuation, trip/control reports, exports.
- **Owns data:** report definitions, export jobs/artifacts; not duplicated business facts.
- **Exposes commands:** run report, export, monitor/download export.
- **Depends on:** every source ledger, Configuration, Documents for files, Authorization, Audit.
- **Must not do:** calculate authoritative values only in frontend, hide provisional data, or combine currencies implicitly.
- **Sources:** [BRD §20] [SRS §24]

## 12.19 Migration and Cutover

- **Responsibility:** import validation, opening-balance batches, disputed flags, reconciliation, and sign-off.
- **Owns data:** migration batch/source/error/sign-off metadata and links to approved opening entries.
- **Exposes commands:** validate/import masters, stage opening balances, reconcile, approve/post cutover.
- **Depends on:** Partners, Catalog, Inventory, Cash, Settlement, Assets, Audit, Reporting.
- **Must not do:** fabricate ordinary sales/purchases or allow ordinary-user edits after approval.
- **Sources:** [BRD §24 — “Initial Data Preparation”]

# 13. Recommended Implementation Order

## 13.1 Assessment of the SRS Milestone Order

The SRS M0–M11 sequence is a sound dependency spine, but it is **not safe to execute unchanged**. Four adjustments are necessary:

1. Add a non-coding decision and traceability gate before M0 because the BRD requires approval and the current sources contain material conflicts.
2. Move foundational Audit, idempotency, approval/override, and period-guard capability into M0/M1; they cannot wait for M10 because every earlier posting command depends on them.
3. Introduce minimal secure Attachment infrastructure before Purchasing/Yatı acceptance because receipt and trip evidence are part of those workflows; leave full Messaging/Notifications in M9.
4. Implement bundle versioning/explosion with Sales before Field Trips because Yatı can load and sell bundles; the current order places Bundles after Trips.

These changes preserve the modular-monolith plan while removing circular or late cross-cutting dependencies. [BRD §26 — “Phased Implementation Plan”] [SRS §27.2 — “Recommended Milestones”]

## 13.2 Recommended Adjusted Sequence

### G0 — Business Decisions, Conflict Disposition, and Traceability

- **Deliverable:** Approved authority hierarchy; signed decision register; contradiction disposition; requirement traceability matrix; canonical state/effect matrices.
- **Why first:** A schema or code implementation would otherwise invent settlement, costing, status, approval, and trip behavior.
- **Dependency:** Source documents only; no application code.
- **Sources:** [BRD §28 — “Open Decisions”] [BRD — “Approval Page for Final Business Decision”] [SRS §31.1 — “Requirement Traceability”]

### M0 — Foundation

- **Base SRS deliverable:** Monorepo, lint/typecheck/test, Docker Compose, configuration validation, PostgreSQL, Prisma, request ID, error contract, OpenAPI.
- **Required addition:** Decimal/date conventions, idempotency framework, transactional command boundary, append-only Audit interface, outbox core, period guard/locking strategy, and minimal object-storage adapter.
- **Why it depends on G0:** Company scope, currency, deployment, numbering, and business-date assumptions affect foundation contracts.
- **Why later milestones depend on it:** Every API, migration, transaction, test, and operational service uses these primitives.
- **Sources:** [SRS §§2–4] [SRS §27.2]

### M1 — Identity

- **Deliverable:** Users, roles, canonical permissions, sessions, login/logout/refresh, frontend guards, session revocation, security audit.
- **Why it depends on M0:** Requires database, API/error conventions, request context, cookies/configuration, and audit.
- **Why later milestones depend on it:** All commands and sensitive reads require actor and permission context.
- **Required gate:** Resolve per-user permission overrides and permission-catalog mismatch.
- **Sources:** [SRS §§6 and 9] [SRS §27.2]

### M2 — Master Data

- **Deliverable:** Partners, Yellow Cards, categories, units, products, warehouses, money accounts, expense/asset categories, vehicles/routes, templates, and settings.
- **Why it depends on M1:** Maintenance and inactivation require authorization and actor audit.
- **Why later milestones depend on it:** All transactions reference approved partners, products, locations, accounts, and policies.
- **Required gate:** Decide initial warehouse/account topology, units, category history, Yellow Card override, and company scope.
- **Sources:** [BRD §§7–9] [SRS §27.2]

### M3 — Inventory Core and Costing Contract

- **Deliverable:** Immutable movement ledger, balance reconciliation, opening stock, transfers, counts, adjustments, write-offs, warehouse types, negative-stock cases; approved costing interface.
- **Why it depends on M2:** Requires products, units, warehouses, settings, and permissions.
- **Why Purchasing/Sales depend on it:** Purchase receipt and sale issue cannot post safely without stock and cost contracts.
- **Required gate:** Approve weighted-average method/scope and negative-cost finalization before cost implementation.
- **Sources:** [BRD §§9.3 and 12] [SRS §§12.3, 15, and 27.2]

### M3A — Minimal Documents and Evidence Core

- **Deliverable:** Secure upload/download adapter, metadata/hash, authorization, attachment links, review status primitives, backup interface.
- **Why it depends on M0–M2:** Requires identity, storage configuration, and target master/transaction references.
- **Why Purchasing/Yatı depend on it:** Goods-receipt and expense evidence are acceptance requirements.
- **Scope limit:** No WhatsApp provider or broad notification UX yet.
- **Sources:** [BRD §17.13] [SRS §21.2]

### M4 — Purchasing

- **Deliverable:** Purchase draft/review/post/cancel, actual receipt, duplicate supplier invoice, payable source, returns, cost update, evidence.
- **Why it depends on M3/M3A:** It creates stock/cost and consumes evidence; it also needs approved settlement-source semantics.
- **Why Sales follows:** Purchases establish realistic stock and cost for sale COGS tests.
- **Required gate:** Transport capitalization, return credit classification, and fixed-asset/non-stock purchasing boundary.
- **Sources:** [BRD §11] [SRS §§14 and 27.2]

### M5 — Sales and Bundle Core

- **Deliverable:** Sale draft/post/cancel/return, stock issue, cost snapshot, receivable source, discount/limit/Yellow Card guards, bundle version/explosion.
- **Why it depends on M3/M4:** Needs available stock and an operating cost engine; purchasing provides receipt/cost history.
- **Why Bundles move here:** Yatı field sale supports bundles, so component behavior must exist before M7.
- **Required gate:** discounts, zero price, statuses, cancellation settlement, bundle return/physical mode.
- **Sources:** [BRD §§10 and 15] [SRS §§13, 18, and 27.2]

### M6 — Cash and Settlement

- **Deliverable:** Receipts, supplier payments, expenses, transfers, refunds, allocations/reallocations, advances, cash closing, personal financing, negative cash.
- **Why it depends on M4/M5:** Allocations need posted purchase/sale targets and return/cancellation source behavior.
- **Why Trips depend on it:** Yatı requires vehicle cash, field collection, refunds, expenses, and handover.
- **Required gate:** canonical obligation/advance model, return credit classification, deferred expenses, current-period versus reopen correction.
- **Sources:** [BRD §§13–14] [SRS §§16–17 and 27.2]

### M7 — Field Trips

- **Deliverable:** vehicle warehouse/cash, trip plan/load/activate, field sale/collection/return/expense, stock/cash reconciliation, close/reopen/cancel under one approved machine.
- **Why it depends on M3–M6:** It orchestrates inventory, sales/bundles, cash, settlement, expenses, and evidence rather than replacing them.
- **Required gate:** carryover, signatories, tolerance, closed-trip reopening, additional-load and cash-handover commands.
- **Sources:** [BRD §17] [SRS §§20 and 27.2]

### M8 — Fixed Assets

- **Deliverable:** complete BRD asset register, assignment/location/status history, maintenance/repair, purchase/cash link, sale/write-off/loss.
- **Why it depends on M2/M4/M6/M3A:** Uses masters, supplier/purchase/cash relationships, expenses, evidence, and authorization.
- **Change from SRS:** Bundles have moved to M5; Assets remain here.
- **Required gate:** status alignment, depreciation, and deferred asset settlement.
- **Sources:** [BRD §16] [SRS §§19 and 27.2]

### M9 — Messaging and Notifications

- **Deliverable:** stable PDF/document versions, invoice and statement sharing, deep-link/provider adapter, MessageShare history, in-app alerts, critical stock, Telegram outbox.
- **Why it depends on stable domain documents:** A share/alert must reference immutable posted versions and correct balances.
- **Why it precedes final reporting:** Operational alert and share history become report sources.
- **Required gate:** consent, templates, secure-link invalidation, direct API choice, recipient/threshold configuration.
- **Sources:** [BRD §§17.12–17.15 and 19] [SRS §§21–22 and 27.2]

### M10 — Reports and Control Interfaces

- **Deliverable:** dashboard, source-ledger reports, exports, audit search, period-control UI, exception lists, migration reconciliation reports.
- **Why it depends on completed ledgers:** Reports must reconcile to stable transaction sources.
- **Clarification:** Core Audit and period guards already exist from M0; M10 adds complete search, export, dashboard, and management UX.
- **Required gate:** report definitions, historical category policy, net-of-returns KPI, provisional cost, currency display.
- **Sources:** [BRD §§18–20] [SRS §§23–24 and 27.2]

### M11 — Hardening and Go-Live

- **Deliverable:** full E2E and concurrency coverage, security review, performance, backup/restore drill, migration rehearsal, UAT, training, cutover, first-month reconciliation plan.
- **Why it depends on all earlier milestones:** It validates connected workflows and operational recovery, not isolated modules.
- **Required gate:** All critical traceability rows pass; no unresolved critical decision/TODO; signed opening reconciliation.
- **Sources:** [BRD §§23–26] [SRS §§28–31]

# 14. Questions Requiring Human Decision

Only questions that materially affect business behavior, data, permissions, transaction logic, reporting, deployment, or maintainability are included.

## 14.1 Business Behavior and Transaction Logic

1. Will v1 operate in exactly one currency, and what is that currency? [BRD §28] [SRS §4.3]
2. Which central, damaged, vehicle, and branch warehouses exist at go-live? [BRD §§4.3 and 28]
3. Which cash, vehicle cash, manually tracked bank, and owner-clearing accounts exist at go-live? [BRD §§13.1 and 28]
4. May one product use different purchase and sale units; if yes, what conversion and rounding rules apply? [BRD §4.3]
5. Is weighted-average cost approved, is it per warehouse or company, and how is negative-stock COGS finalized? [BRD §§9.3, 17.17, and 28] [SRS §12.3]
6. Are line and document discounts entered as percentage, amount, or both, and in what order are they calculated? [BRD §10.4]
7. What discount, below-standard-price, and zero-price thresholds require approval, and is zero price always permission-controlled? [BRD §§9.3, 10.4, and 28] [SRS §13.3]
8. Is a partner open-balance limit informational, approval-required, or blocking? [BRD §28]
9. Is due date mandatory for every open sale/purchase, and what default terms apply? [BRD §28]
10. Are lifecycle, payment, return, and approval states separate dimensions, and what transitions are valid? [BRD §18.1] [SRS §8.1]
11. When a paid sales return exceeds open receivable, is the result customer advance, refund payable, or an immediate refund choice? [BRD §10.6]
12. When a paid purchase return exceeds open payable, is the result supplier receivable, supplier credit, supplier advance, or cash refund? [BRD §11.5]
13. When cancelling a sale/purchase with linked payment, is payment reversed, unallocated to advance, refunded, or handled by a separate decision? [BRD §§10.7 and 11.6]
14. Is manual receivable/payable offset allowed through a dedicated settlement document? [BRD §28]
15. Are warehouse transfers one-step or dispatched/in-transit/received? [BRD §12.6]
16. Which products/warehouses/users may use negative inventory, with what quantity/value and maximum age? [BRD §28]
17. Which money accounts/users may use negative cash, with what amount and maximum age? [BRD §28]
18. What obligation and repayment workflow represents employee/owner personal funding? [BRD §§13.5 and 17.16]
19. Can expenses be incurred now and paid later; if yes, which payable workflow applies? [BRD scenario S-19]
20. Can physical bundles be stocked separately, and may customers return selected components; how are price, discount, and cost allocated? [BRD §§15.3, 17.4, and 28]
21. Which fixed-asset statuses are required, is acquisition linkage mandatory, is depreciation in v1, and how are credit purchases/sales handled? [BRD §§16 and 28] [SRS §19]
22. Can Yatı close with stock or cash, can CLOSED be reopened, who signs, and what difference tolerance requires approval? [BRD §§17.3, 17.9, 17.10, and 28] [SRS §20]
23. Is a Yellow Card BLOCK absolute or manager-overridable, and what constitutes valid approval? [BRD §§17.15 and 28]
24. Which historical corrections require reopening the original period versus a current-period correcting entry? [BRD scenario S-24] [SRS §§17.1 and 23.1]

## 14.2 Data Model and Reporting

25. Does v1 require a real Company and user-company membership model, or is `companyId` only future-proofing? [SRS §7.1]
26. What is the canonical source model for receivables, payables, return credits, personal reimbursements, and advances? [SRS §§7 and 17]
27. Do historical reports classify transactions by current category or transaction-date category snapshot? [BRD §7.2]
28. Is the sales KPI net of returns in every dashboard/report, and how are returns displayed separately without changing the net definition? [BRD §20.6] [SRS §24.1]
29. How are opening receivables/payables/advances represented by document, and how are disputed balances approved? [BRD §24.2]
30. What fallback cost applies when original purchase cost is unavailable for return? [BRD §9.3]
31. Which omitted BRD reports are mandatory for v1 acceptance rather than later backlog? [BRD §20] [SRS §24.2]

## 14.3 Permissions and Control

32. Must maker and approver be different for any transaction classes? [BRD §6.1]
33. What is the authoritative permission catalog, and how do per-user additions/removals override roles? [SRS §§6.2 and 25]
34. Which actions are approval workflows versus immediate actions by a user with override permission? [BRD §18.2] [SRS §6.2]
35. What backdating limit applies by role and transaction type? [BRD §28]
36. Who may view/download photo evidence, partner warnings, audit exports, and financial reports? [BRD §§6 and 17.13] [SRS §29.1]

## 14.4 Messaging, Attachments, and Alerts

37. Is WhatsApp consent mandatory, which templates/languages are approved, and is v1 deep-link or direct API? [BRD §§17.12 and 28] [SRS Appendix B]
38. What expiration/invalidation behavior applies to shared invoice and statement links? [BRD §17.12]
39. What are file retention, physical-document retention, photo quality, malware scanning, and legal-hold rules? [BRD §§17.13 and 28] [SRS §29.1]
40. Are critical thresholds warehouse-specific, company-wide, or both; what restore level, reminder cadence, and recipients apply? [BRD §§17.14 and 28] [SRS §22.1]
41. Which Telegram recipients and escalation rules are approved? [SRS Appendix B]

## 14.5 Deployment and Maintainability

42. Which package manager/workspace tooling and CI/CD platform are standard for the monorepo? [SRS §§2.1 and 27.2]
43. What production hosting topology serves the React frontend, NestJS API, PostgreSQL, object storage, and worker? [SRS §30.1]
44. What RPO, RTO, backup owner, off-site strategy, and restore-test frequency are required? [SRS §29.3]
45. What is the full idempotency-key protocol, lock order, retry policy, and sequence gap policy? [SRS §§8.2, 25.1, and 29.3]
46. Is offline capability restricted to drafts, and how are encryption, sync conflicts, and stale policy/stock handled? [SRS §26.2]
47. What audit and business-document retention periods apply? [BRD §19.1] [SRS §23.2]
48. What tax/VAT or legal invoice requirements must be settled before invoice schema and PDF work? [BRD §28] [SRS Appendix B]

# 15. Initial Conclusion

## 15.1 Requirement Traceability Matrix — **Ready now**

The source documents, this analysis, 38 BRD scenarios, SRS requirement/invariant IDs, endpoint catalog, and test list provide enough material to build a matrix that explicitly marks gaps, conflicts, and open decisions. The matrix should not pretend unresolved rows are approved. [BRD §21 — “End-to-End Business Scenarios”] [SRS §31.1 — “Requirement Traceability”]

## 15.2 AGENTS.md — **Ready now**

An `AGENTS.md` can safely encode the authority hierarchy, no-invention rule, posting invariants, prohibition on silent edits/netting/vehicle-sale treatment, requirement-citation discipline, and stop-on-open-decision behavior. It must not encode unresolved defaults as approved business rules. [SRS — “How to Use This Document”] [SRS §27.1 — “Coding Agent Operating Rules”] [SRS Appendix C — “AI Pre-Commit Checklist”]

## 15.3 Cursor Rules — **Ready now**

Stable procedural and architectural rules can be created now: BRD-first behavior, SRS implementation authority, transactional/idempotent commands, decimal-safe math, backend authorization, audit, tests, and one bounded module per batch. Business values and disputed state/settlement behavior must remain excluded until approved. [SRS §§3, 5, and 27.1]

## 15.4 Monorepo Scaffolding — **Ready after decisions**

The structural baseline is strong, but package/workspace tooling, production deployment topology, company scope, object-storage/worker setup, and CI/CD need confirmation. Scaffolding before those decisions risks avoidable rework, although no domain business logic is needed for the choice. [SRS §§2.1, 27.2, and 30]

## 15.5 Database Schema — **Ready after decisions**

The entity catalog is conceptual rather than migration-ready. Final schema work requires decisions on Company scope, settlement/advance obligations, orthogonal statuses, approvals, opening balances, personal funding, return credits, costing, physical bundles, fixed assets, and trip lifecycle. [SRS §7 — “Domain Model and Data Ownership”] [BRD §§24 and 28]

## 15.6 Actual Coding — **Not ready**

Business-module coding should not begin while the BRD approval page and SRS implementation approval are unsigned, material conflicts remain undispositioned, and no full traceability matrix or approved schema exists. The next safe work is governance and requirements completion, not application implementation. [BRD — “Approval Page for Final Business Decision”] [SRS — “Implementation Baseline Approval”] [SRS §31.2 — “Definition of Done”]

## 15.7 Overall Conclusion

TOPTANFLOW has a detailed and unusually strong operational BRD and a technically credible modular-monolith proposal. The main risk is not missing technology; it is allowing technical defaults to become unapproved business behavior. The project should proceed next with a requirement traceability matrix and a formal decision/conflict register. After business management approves the material decisions, the architecture can be converted into a canonical domain model, API command contracts, and an implementation-ready schema without inventing rules.

# Appendix A. Section-Title Citation Key

Direct citations above include the section title. For compact repeated or compound references such as `[BRD §§17.4–17.10]` or `[SRS §§28–31]`, the exact source section titles are listed below. No citation uses a page number.

## A.1 BRD Section Titles

- **§1:** “Executive Summary”
- **§2:** “Business Context and Current Problem”; **§2.1:** “General Nature of the Business”; **§2.2:** “Current Management Problems”; **§2.3:** “Key Business Questions to Be Answered”
- **§3:** “Objectives and Expected Benefits”
- **§4:** “Scope and Boundaries”; **§4.2:** “Areas Excluded from the Initial Phase”; **§4.3:** “Initial Business Assumptions”
- **§5:** “Core Business Principles”
- **§6:** “User Roles and Responsibilities”; **§6.1:** “Permission Principles”
- **§7:** “Master Data Management”; **§7.1:** “Master Data Types”; **§7.2:** “Duplicate Prevention and Data Quality Rules”
- **§8:** “Business Partner Management”; **§8.1:** “Unified Business Partner Concept”; **§8.2:** “Information Maintained on the Business Partner Record”; **§8.4:** “Business Partner Account Statement”
- **§9:** “Product and Category Management”; **§9.1:** “Product Types”; **§9.3:** “Pricing and Cost Rules”; **§9.4:** “Units of Measure and Fractional Quantities”
- **§10:** “Sales Processes”; **§10.2:** “Core Information on a Sales Document”; **§10.3:** “Sales Payment Scenarios”; **§10.4:** “Discounts and Price Changes”; **§10.5:** “Inventory Check and Release of Goods”; **§10.6:** “Sales Returns”; **§10.7:** “Sales Cancellation and Correction”
- **§11:** “Purchasing Processes”; **§11.2:** “Core Information on a Purchase Document”; **§11.3:** “Purchase Payment Scenarios”; **§11.4:** “Receipt Differences and Invoice Discrepancies”; **§11.5:** “Purchase Returns”; **§11.6:** “Purchase Cancellation”
- **§12:** “Warehouse and Inventory Management”; **§12.4:** “Physical Stock Count”; **§12.5:** “Inventory Write-Off”; **§12.6:** “Warehouse Transfers”
- **§13:** “Cash, Payment, and Expense Management”; **§13.1:** “Cash Accounts”; **§13.2:** “Cash Movement Types”; **§13.3:** “Cash Receipt from a Customer”; **§13.4:** “Payment to a Supplier”; **§13.5:** “Expenses”; **§13.6:** “Cash Closing and Count”
- **§14:** “Accounts Receivable, Accounts Payable, and Advances”; **§14.1:** “Separation of Accounts Receivable and Accounts Payable”; **§14.2:** “Creation and Settlement of Outstanding Balances”; **§14.3:** “Advances”; **§14.4:** “Allocating One Payment Across Multiple Documents”
- **§15:** “Promotions and Product Bundles”; **§15.3:** “Bundle Inventory and Cost Rules”
- **§16:** “Fixed Assets and Equipment”; **§16.3:** “Fixed Asset Life Cycle”; **§16.4:** “Depreciation and Statutory Accounting Boundary”
- **§17:** “Field Sales Trips (Yatı), Mobile Documentation, and Control Capabilities”
- **§17.1:** “Yatı Concept and Core Business Principle”; **§17.2:** “Yatı Record and Core Trip Information”; **§17.3:** “Yatı Statuses and Status Transitions”; **§17.4:** “Starting a Trip and Loading Goods”; **§17.5:** “Field Sales and Delivery of Products”
- **§17.6:** “Collecting Previous Balances, Advances, and Refunds in the Field”; **§17.7:** “Product Returns in the Field”; **§17.8:** “Yatı Expenses and Vehicle Cash Account”; **§17.9:** “Yatı Closing and Inventory Reconciliation”; **§17.10:** “Yatı Closing and Cash Reconciliation”
- **§17.11:** “Yatı Controls and Reports”; **§17.12:** “Sharing Invoices and Balances Through WhatsApp”; **§17.13:** “Mobile Photo-Based Goods Receipt and Receipt Archive”; **§17.14:** “Automatic Critical Inventory Early Warning”; **§17.15:** “Business-Partner-Specific Reminder Notes - ‘Yellow Card’”; **§17.16:** “Controlled Negative Cash”; **§17.17:** “Controlled Negative Inventory and Automatic Netting”
- **§18:** “Approval, Period Closing, and Correction Rules”; **§18.1:** “Document Statuses”; **§18.2:** “High-Risk Transactions Requiring Approval”; **§18.3:** “Period Closing”; **§18.4:** “Rounding and Amount Precision”
- **§19:** “Notifications, Audit, and Management Control”; **§19.1:** “Audit History”; **§19.3:** “Notification Management”
- **§20:** “Reports and Key Indicators”; **§20.6:** “Business Definitions of Key Indicators”
- **§21:** “End-to-End Business Scenarios”
- **§22:** “Exceptions and High-Risk Cases”
- **§23:** “Acceptance Criteria”; **§23.1:** “Business Testing Principle”
- **§24:** “Initial Data Preparation”; **§24.1:** “Data Required for System Migration”; **§24.2:** “Principle for Entering Opening Balances”; **§24.3:** “Data-Cleansing Process”
- **§25:** “Operating Rules and Daily Procedures”; **§25.3:** “Monthly Closing Procedure”
- **§26:** “Phased Implementation Plan”; **§26.1:** “Go-Live Strategy”
- **§27:** “Business Risks and Mitigation Measures”
- **§28:** “Open Decisions”
- **Appendix B:** “Business Impact Matrix for Transactions”

### BRD Scenario Titles Cited Compactly

- **S-06:** “Partial Sales Return for an Unpaid Sale”; **S-07:** “Return of a Fully Paid Sale”; **S-10:** “Bundle Sale”
- **S-15:** “Purchase Return While Payable Is Open”; **S-16:** “Cancelling a Purchase After the Product Has Been Sold”; **S-17:** “Shortage Identified During a Physical Stock Count”; **S-18:** “Warehouse Transfer”
- **S-19:** “Daily Expense”; **S-20:** “Cash Transfer”; **S-22:** “Cash Count Difference”; **S-24:** “Cancellation Request in a Closed Period”; **S-26:** “Sale of a Fixed Asset”
- **S-27:** “Starting a Yatı Trip and Loading the Vehicle Warehouse”; **S-28:** “Cash and Partially Paid Sale During Yatı”; **S-29:** “Collecting a Previous Balance and Overpayment During Yatı”; **S-30:** “Customer Product Return During Yatı”; **S-32:** “Inventory or Cash Difference at Yatı Closing”
- **S-36:** “Restricted Sale Under a Yellow Card Rule”; **S-37:** “Controlled Negative Inventory and Subsequent Automatic Clearance”; **S-38:** “Controlled Negative Cash and Subsequent Clearance”

## A.2 SRS/TDS Section Titles

- **§1:** “Purpose, Scope, and Product Vision”; **§1.3:** “Out of Scope for v1”
- **§2:** “Technology Baseline”; **§2.1:** “Repository Structure”
- **§3:** “Architecture Principles”
- **§4:** “System Context and Deployment”; **§4.1:** “Logical Components”; **§4.2:** “Environments”; **§4.3:** “Time, Locale, and Currency”
- **§5:** “Cross-Cutting Functional Rules”
- **§6:** “Identity, Roles, and Permissions”; **§6.1:** “Roles”; **§6.2:** “Permission Model”; **§6.3:** “Authentication Requirements”
- **§7:** “Domain Model and Data Ownership”; **§7.1:** “Common Entity Fields”; **§7.2:** “Money and Quantity Types”
- **§8:** “Status Machines and Transaction Posting”; **§8.1:** “Generic Document Status”; **§8.2:** “Posting Service Pattern”
- **§9:** “Authentication and User Management”
- **§10:** “Master Data”
- **§11:** “Business Partners”; **§11.2:** “Partner Balances”; **§11.3:** “Yellow Cards”
- **§12:** “Products, Categories, and Units”; **§12.2:** “Product Requirements”; **§12.3:** “Costing”
- **§13:** “Sales”; **§13.2:** “Sale Commands”; **§13.3:** “Validation Rules”; **§13.4:** “Sale Return Settlement”
- **§14:** “Purchases”; **§14.1:** “Requirements”; **§14.2:** “Purchase Return”
- **§15:** “Inventory and Warehouses”; **§15.2:** “Stock Movement Types”; **§15.3:** “Stock Balance Invariant”; **§15.4:** “Physical Count”; **§15.5:** “Controlled Negative Stock”
- **§16:** “Cash, Payments, and Expenses”; **§16.2:** “Money Transaction Types”; **§16.3:** “Rules”; **§16.4:** “Controlled Negative Cash”
- **§17:** “Receivables, Payables, and Advances”; **§17.1:** “Allocation Model”
- **§18:** “Bundles and Promotions”
- **§19:** “Fixed Assets”
- **§20:** “Field Sales Trips (Yatı)”; **§20.1:** “Trip Status Machine”; **§20.2:** “Trip Data”; **§20.3:** “Stock Reconciliation Formula”; **§20.4:** “Cash Reconciliation Formula”; **§20.5:** “Trip Closing Guards”
- **§21:** “Messaging and Document Evidence”; **§21.1:** “WhatsApp Sharing”; **§21.2:** “Attachments and Mobile Capture”
- **§22:** “Alerts, Yellow Cards, and Notifications”; **§22.1:** “Critical Stock Alert Lifecycle”
- **§23:** “Period Closing, Audit, and Corrections”; **§23.1:** “Accounting Period”; **§23.2:** “Audit Log”; **§23.3:** “Correction Matrix”
- **§24:** “Reporting and Dashboard”; **§24.1:** “Dashboard KPIs”; **§24.2:** “Required Reports”; **§24.3:** “Report Rules”
- **§25:** “API Standards and Endpoint Catalog”; **§25.1:** “REST Conventions”; **§25.2:** “Error Contract”
- **§26:** “Frontend Specification”; **§26.2:** “State Strategy”; **§26.3:** “UX Rules”
- **§27:** “AI-Friendly Implementation Plan”; **§27.1:** “Coding Agent Operating Rules”; **§27.2:** “Recommended Milestones”
- **§28:** “Testing and Quality Gates”; **§28.1:** “Test Pyramid”; **§28.2:** “Critical E2E Scenarios”; **§28.3:** “Quality Gate”
- **§29:** “Security and Non-Functional Requirements”; **§29.1:** “Security”; **§29.2:** “Performance and Scale”; **§29.3:** “Reliability”
- **§30:** “Deployment, Operations, and Backup”; **§30.1:** “Docker Services”; **§30.2:** “Configuration”; **§30.3:** “Observability”
- **§31:** “Traceability and Definition of Done”; **§31.1:** “Requirement Traceability”; **§31.2:** “Definition of Done”
- **Appendix A:** “Recommended Prisma Modeling Rules”
- **Appendix B:** “Open Decisions and Safe Defaults”
- **Appendix C:** “AI Pre-Commit Checklist”

