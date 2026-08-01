# CHANGE-002: Single product quantity — remove Warehouse / Stock module

- **ID:** CHANGE-002
- **Type:** CHANGE
- **Title:** Single product quantity; abolish separate Warehouse and Stock modules
- **Status:** Done
- **Trigger:** Owner direction 2026-07-31 — deliberately simple ERP structure:
  Products, Business Partners, Purchases, Sales, Cash, Fixed Assets (future).
  Separate Warehouse / Stock / Transfer / Count / Vehicle Warehouse concepts are
  too complex for the business.
- **Urgency:** Critical (architecture reversal; supersedes Accepted ADR-026)
- **Affected epics / stories / tasks:** EPIC-008 (Cancelled as warehouse module);
  US-020 / US-021 / TASK-020-* / TASK-021-* (Cancelled or superseded);
  EPIC-009 / EPIC-010 / EPIC-014 (must not assume warehouse selection or vehicle
  warehouses); Products master data and future quantity APIs.
- **Why not in the original plan:** BRD/SRS and ADR-026 assumed multi-warehouse
  inventory. Owner now rejects that for current operations.
- **Approved Human Decisions (2026-07-31):**
  1. No separate Warehouse or Stock module; one `currentQuantity` per Product.
  2. Quantity history lives inside Products (auditable); not a renamed warehouse module.
  3. Posted Purchase ↑ quantity + payable; posted Sale ↓ quantity + receivable;
     neither mutates cash (ADR-028).
  4. Negative quantity: blocked without permission; with permission requires
     reason and audit (ADR-025: all active users have permission in v1).
  5. Fixed Assets remain separate from Products.
  6. Yatı vehicle-warehouse model is withdrawn pending redesign (EPIC-014 deferred).
- **Scope:** New ADR-029; update knowledge docs, analysis notes, planning;
  Prisma migration removing Warehouse/Stock* and adding product quantity +
  history; remove Nest warehouses/inventory modules and Web screens/nav;
  Products API quantity/history/adjustment; tests for quantity rules.
- **Out of scope:** Full Purchase/Sale/Cash Nest modules (remain EPIC-009–011);
  full BRD-OD-04 case engine; costing method (BRD-OD-06); Yatı redesign;
  Fixed Assets implementation.
- **Risks:** Contradicts prior Accepted ADR-026 until ADR-029 is applied everywhere;
  any local StockBalance data must migrate into Product.currentQuantity.
- **Acceptance criteria:**
  - [x] ADR-029 Accepted; ADR-026 superseded; docs consistent (no active warehouse module)
  - [x] Schema: no Warehouse / StockBalance / warehouse StockMovement; Product has quantity + history
  - [x] API/UI: warehouses and Inventar navigation removed
  - [x] Products expose current quantity, history, permission-controlled manual adjustment
  - [x] Tests cover quantity increase/decrease/draft/reversal/negative/cash-separation contracts at the quantity layer
  - [x] No warehouse selector in active application flows
- **Impact on current work:** Stop TASK-021-05; cancel EPIC-008 warehouse track.
- **Roadmap impact:** Next delivery focus returns to Products quantity capability
  then Purchasing / Sales (quantity effects without warehouse fields).
- **Result:** Done — warehouse/inventory modules removed; Product.currentQuantity +
  ProductQuantityHistory + ProductQuantityService; docs/planning aligned to ADR-029.
  Full Purchase/Sale/Cash Nest modules remain EPIC-009–011 (schema ready; posting
  must call ProductQuantityService; never mutate cash from Sale/Purchase).
- **Follow-up actions:** Start Purchasing (EPIC-009) with product-quantity posting.
- **Evidence:** ADR-029; this CHANGE; migration `20260731120000_single_product_quantity_no_warehouse`;
  ProductQuantityService unit tests; removed warehouses/inventory API + Web.
