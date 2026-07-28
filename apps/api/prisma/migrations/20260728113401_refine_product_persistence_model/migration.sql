/*
  Warnings:

  - You are about to alter the column `standardSalePrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,4)`.
  - You are about to alter the column `latestPurchasePrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,4)`.
  - You are about to alter the column `criticalStockThreshold` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,4)`.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "standardSalePrice" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "latestPurchasePrice" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "criticalStockThreshold" SET DATA TYPE DECIMAL(18,4);

-- CreateIndex
CREATE INDEX "Product_unitId_idx" ON "Product"("unitId");
