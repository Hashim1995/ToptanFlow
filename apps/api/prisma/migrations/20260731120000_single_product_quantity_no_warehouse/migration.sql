-- CHANGE-002 / ADR-029: single product quantity; remove Warehouse / Stock module.
--
-- Impact:
-- 1) Add Product.currentQuantity, barcode, notes
-- 2) Migrate SUM(StockBalance.quantity) per product into Product.currentQuantity
--    (dev DBs typically only have seed warehouse + optional posted balances)
-- 3) Create ProductQuantityHistory (+ enum) and seed INITIAL_QUANTITY rows when
--    migrated quantity <> 0 (createdBy = first User if any; else skip history)
-- 4) Drop StockMovement, StockBalance, Warehouse and related enums/sequence
--
-- Does NOT truncate Product, Sale, Purchase, Cash, or User tables.

-- ---------------------------------------------------------------------------
-- 1. Product quantity columns
-- ---------------------------------------------------------------------------

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "currentQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "barcode" TEXT;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "Product_barcode_idx" ON "Product"("barcode");

-- ---------------------------------------------------------------------------
-- 2. Migrate warehouse balances → product quantity (if StockBalance exists)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StockBalance'
  ) THEN
    UPDATE "Product" p
    SET "currentQuantity" = COALESCE(agg.total_qty, 0)
    FROM (
      SELECT "productId", SUM("quantity") AS total_qty
      FROM "StockBalance"
      GROUP BY "productId"
    ) AS agg
    WHERE p.id = agg."productId";
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. ProductQuantityHistory
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ProductQuantityHistoryKind'
  ) THEN
    CREATE TYPE "ProductQuantityHistoryKind" AS ENUM (
      'PURCHASE',
      'PURCHASE_RETURN',
      'SALE',
      'SALE_RETURN',
      'INITIAL_QUANTITY',
      'MANUAL_ADJUSTMENT',
      'CANCELLATION_REVERSAL'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProductQuantityHistory" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "kind" "ProductQuantityHistoryKind" NOT NULL,
  "quantityChange" DECIMAL(18,4) NOT NULL,
  "quantityBefore" DECIMAL(18,4) NOT NULL,
  "quantityAfter" DECIMAL(18,4) NOT NULL,
  "reason" TEXT,
  "saleId" TEXT,
  "purchaseId" TEXT,
  "relatedDocumentType" TEXT,
  "relatedDocumentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByUserId" TEXT NOT NULL,

  CONSTRAINT "ProductQuantityHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductQuantityHistory_productId_createdAt_idx"
  ON "ProductQuantityHistory"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductQuantityHistory_kind_idx"
  ON "ProductQuantityHistory"("kind");
CREATE INDEX IF NOT EXISTS "ProductQuantityHistory_saleId_idx"
  ON "ProductQuantityHistory"("saleId");
CREATE INDEX IF NOT EXISTS "ProductQuantityHistory_purchaseId_idx"
  ON "ProductQuantityHistory"("purchaseId");
CREATE INDEX IF NOT EXISTS "ProductQuantityHistory_createdByUserId_idx"
  ON "ProductQuantityHistory"("createdByUserId");
CREATE INDEX IF NOT EXISTS "ProductQuantityHistory_relatedDocumentType_relatedDocumentId_idx"
  ON "ProductQuantityHistory"("relatedDocumentType", "relatedDocumentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductQuantityHistory_productId_fkey'
  ) THEN
    ALTER TABLE "ProductQuantityHistory"
      ADD CONSTRAINT "ProductQuantityHistory_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductQuantityHistory_saleId_fkey'
  ) THEN
    ALTER TABLE "ProductQuantityHistory"
      ADD CONSTRAINT "ProductQuantityHistory_saleId_fkey"
      FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductQuantityHistory_purchaseId_fkey'
  ) THEN
    ALTER TABLE "ProductQuantityHistory"
      ADD CONSTRAINT "ProductQuantityHistory_purchaseId_fkey"
      FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductQuantityHistory_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "ProductQuantityHistory"
      ADD CONSTRAINT "ProductQuantityHistory_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed INITIAL_QUANTITY history for migrated non-zero quantities (needs a User).
INSERT INTO "ProductQuantityHistory" (
  "id", "productId", "kind", "quantityChange", "quantityBefore", "quantityAfter",
  "reason", "createdAt", "createdByUserId"
)
SELECT
  'a0290000-' || substr(p.id, 10, 4) || '-' || substr(p.id, 15, 4) || '-' ||
    substr(p.id, 20, 4) || '-' || substr(p.id, 25, 12),
  p.id,
  'INITIAL_QUANTITY'::"ProductQuantityHistoryKind",
  p."currentQuantity",
  0,
  p."currentQuantity",
  'Migrated from StockBalance under ADR-029 / CHANGE-002',
  CURRENT_TIMESTAMP,
  u.id
FROM "Product" p
CROSS JOIN LATERAL (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) u
WHERE p."currentQuantity" <> 0
  AND NOT EXISTS (
    SELECT 1 FROM "ProductQuantityHistory" h WHERE h."productId" = p.id
  );

-- ---------------------------------------------------------------------------
-- 4. Drop obsolete warehouse / stock structures
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS "StockMovement";
DROP TABLE IF EXISTS "StockBalance";
DROP TABLE IF EXISTS "Warehouse";

DROP TYPE IF EXISTS "StockMovementKind";
DROP TYPE IF EXISTS "WarehouseKind";

DELETE FROM "NumberSequence" WHERE key = 'WAREHOUSE';
