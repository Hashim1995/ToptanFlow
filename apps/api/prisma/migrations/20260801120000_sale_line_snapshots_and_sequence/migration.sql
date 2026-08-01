-- EPIC: Sale line snapshots, decimal precision, subtotal,
-- negative-quantity override reason, and SALE document-number sequence.
-- Safe for empty Sale/SaleItem tables. Existing Sale rows (if any)
-- get subtotalAmount backfilled from totalAmount; existing items get snapshot
-- backfill from Product/Unit and lineSubtotal from lineTotal.

-- Sale header: add subtotalAmount (NOT NULL after backfill)
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "subtotalAmount" DECIMAL(18, 4);

UPDATE "Sale"
SET "subtotalAmount" = COALESCE("subtotalAmount", "totalAmount")
WHERE "subtotalAmount" IS NULL;

ALTER TABLE "Sale" ALTER COLUMN "subtotalAmount" SET NOT NULL;

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "negativeQuantityOverrideReason" TEXT;

-- Tighten money column types on Sale (preserve values)
ALTER TABLE "Sale" ALTER COLUMN "totalAmount" TYPE DECIMAL(18, 4);
ALTER TABLE "Sale" ALTER COLUMN "discountAmount" TYPE DECIMAL(18, 4);

CREATE INDEX IF NOT EXISTS "Sale_createdByUserId_idx" ON "Sale"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Sale_createdAt_idx" ON "Sale"("createdAt");

-- SaleItem snapshots and calculation columns
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "productCodeSnapshot" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "productNameSnapshot" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "unitNameSnapshot" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "lineSubtotal" DECIMAL(18, 4);
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "SaleItem" AS si
SET
  "productCodeSnapshot" = COALESCE(si."productCodeSnapshot", p.code),
  "productNameSnapshot" = COALESCE(si."productNameSnapshot", p.name),
  "unitNameSnapshot" = COALESCE(si."unitNameSnapshot", u.name),
  "lineSubtotal" = COALESCE(si."lineSubtotal", si."lineTotal")
FROM "Product" AS p, "Unit" AS u
WHERE si."productId" = p.id
  AND si."unitId" = u.id
  AND (
    si."productCodeSnapshot" IS NULL
    OR si."productNameSnapshot" IS NULL
    OR si."unitNameSnapshot" IS NULL
    OR si."lineSubtotal" IS NULL
  );

UPDATE "SaleItem"
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

ALTER TABLE "SaleItem" ALTER COLUMN "productCodeSnapshot" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "productNameSnapshot" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "unitNameSnapshot" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "lineSubtotal" SET NOT NULL;

ALTER TABLE "SaleItem" ALTER COLUMN "quantity" TYPE DECIMAL(18, 4);
ALTER TABLE "SaleItem" ALTER COLUMN "unitPrice" TYPE DECIMAL(18, 4);
ALTER TABLE "SaleItem" ALTER COLUMN "discountAmount" TYPE DECIMAL(18, 4);
ALTER TABLE "SaleItem" ALTER COLUMN "lineTotal" TYPE DECIMAL(18, 4);
ALTER TABLE "SaleItem" ALTER COLUMN "costAtPosting" TYPE DECIMAL(18, 4);

-- Cascade draft line cleanup when a draft Sale is deleted
ALTER TABLE "SaleItem" DROP CONSTRAINT IF EXISTS "SaleItem_saleId_fkey";
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Document number sequence for Sales (allocation pattern mirrors ADR-024)
INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
VALUES ('SALE', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
