-- EPIC-009 / US-022: Purchase line snapshots, decimal precision, subtotal,
-- and PURCHASE document-number sequence.
-- Safe for empty Purchase/PurchaseItem tables. Existing Purchase rows (if any)
-- get subtotalAmount backfilled from totalAmount; existing items get snapshot
-- backfill from Product/Unit and lineSubtotal from lineTotal.

-- Purchase header: add subtotalAmount (NOT NULL after backfill)
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "subtotalAmount" DECIMAL(18, 4);

UPDATE "Purchase"
SET "subtotalAmount" = COALESCE("subtotalAmount", "totalAmount")
WHERE "subtotalAmount" IS NULL;

ALTER TABLE "Purchase" ALTER COLUMN "subtotalAmount" SET NOT NULL;

-- Tighten money column types on Purchase (preserve values)
ALTER TABLE "Purchase" ALTER COLUMN "totalAmount" TYPE DECIMAL(18, 4);
ALTER TABLE "Purchase" ALTER COLUMN "discountAmount" TYPE DECIMAL(18, 4);

CREATE INDEX IF NOT EXISTS "Purchase_createdByUserId_idx" ON "Purchase"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- PurchaseItem snapshots and calculation columns
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "productCodeSnapshot" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "productNameSnapshot" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "unitNameSnapshot" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(18, 4);
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "lineSubtotal" DECIMAL(18, 4);
ALTER TABLE "PurchaseItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "PurchaseItem" AS pi
SET
  "productCodeSnapshot" = COALESCE(pi."productCodeSnapshot", p.code),
  "productNameSnapshot" = COALESCE(pi."productNameSnapshot", p.name),
  "unitNameSnapshot" = COALESCE(pi."unitNameSnapshot", u.name),
  "lineSubtotal" = COALESCE(pi."lineSubtotal", pi."lineTotal")
FROM "Product" AS p, "Unit" AS u
WHERE pi."productId" = p.id
  AND pi."unitId" = u.id
  AND (
    pi."productCodeSnapshot" IS NULL
    OR pi."productNameSnapshot" IS NULL
    OR pi."unitNameSnapshot" IS NULL
    OR pi."lineSubtotal" IS NULL
  );

-- If orphaned items somehow lack product/unit (should not happen), use placeholders
UPDATE "PurchaseItem"
SET
  "productCodeSnapshot" = COALESCE("productCodeSnapshot", 'UNKNOWN'),
  "productNameSnapshot" = COALESCE("productNameSnapshot", 'UNKNOWN'),
  "unitNameSnapshot" = COALESCE("unitNameSnapshot", 'UNKNOWN'),
  "lineSubtotal" = COALESCE("lineSubtotal", "lineTotal")
WHERE
  "productCodeSnapshot" IS NULL
  OR "productNameSnapshot" IS NULL
  OR "unitNameSnapshot" IS NULL
  OR "lineSubtotal" IS NULL;

ALTER TABLE "PurchaseItem" ALTER COLUMN "productCodeSnapshot" SET NOT NULL;
ALTER TABLE "PurchaseItem" ALTER COLUMN "productNameSnapshot" SET NOT NULL;
ALTER TABLE "PurchaseItem" ALTER COLUMN "unitNameSnapshot" SET NOT NULL;
ALTER TABLE "PurchaseItem" ALTER COLUMN "lineSubtotal" SET NOT NULL;

ALTER TABLE "PurchaseItem" ALTER COLUMN "receivedQuantity" TYPE DECIMAL(18, 4);
ALTER TABLE "PurchaseItem" ALTER COLUMN "invoicedQuantity" TYPE DECIMAL(18, 4);
ALTER TABLE "PurchaseItem" ALTER COLUMN "unitCost" TYPE DECIMAL(18, 4);
ALTER TABLE "PurchaseItem" ALTER COLUMN "lineTotal" TYPE DECIMAL(18, 4);

-- Cascade draft line cleanup when a draft Purchase is deleted
ALTER TABLE "PurchaseItem" DROP CONSTRAINT IF EXISTS "PurchaseItem_purchaseId_fkey";
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey"
  FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Document number sequence for Purchases (allocation pattern mirrors ADR-024)
INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
VALUES ('PURCHASE', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
