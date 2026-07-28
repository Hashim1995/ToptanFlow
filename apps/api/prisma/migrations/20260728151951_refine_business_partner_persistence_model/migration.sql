/*
  Warnings:

  - Added the required column `defaultCurrencyId` to the `BusinessPartner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BusinessPartner" ADD COLUMN     "address" TEXT,
ADD COLUMN     "defaultCurrencyId" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "BusinessPartner_defaultCurrencyId_idx" ON "BusinessPartner"("defaultCurrencyId");

-- AddForeignKey
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_defaultCurrencyId_fkey" FOREIGN KEY ("defaultCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
