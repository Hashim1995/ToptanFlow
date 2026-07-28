-- ProductCategory flat reference + Product.categoryId (CHANGE-001 / US-042).
-- Backfills distinct non-null Product.category strings before dropping the column.
-- BRD-CA-18 historical document category reporting is intentionally not addressed.

CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE INDEX "ProductCategory_isActive_idx" ON "ProductCategory"("isActive");

ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

INSERT INTO "ProductCategory" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, trimmed.name, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT TRIM("category") AS name
  FROM "Product"
  WHERE "category" IS NOT NULL AND TRIM("category") <> ''
) AS trimmed;

UPDATE "Product" AS p
SET "categoryId" = c."id"
FROM "ProductCategory" AS c
WHERE p."category" IS NOT NULL
  AND TRIM(p."category") <> ''
  AND c."name" = TRIM(p."category");

ALTER TABLE "Product" DROP COLUMN "category";

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
