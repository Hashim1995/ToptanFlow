-- US-025: ExpenseCategory + optional FK on CashTransaction
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "deactivationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");
CREATE INDEX "ExpenseCategory_isActive_idx" ON "ExpenseCategory"("isActive");
CREATE INDEX "ExpenseCategory_createdByUserId_idx" ON "ExpenseCategory"("createdByUserId");

ALTER TABLE "ExpenseCategory"
  ADD CONSTRAINT "ExpenseCategory_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashTransaction"
  ADD COLUMN "expenseCategoryId" TEXT;

CREATE INDEX "CashTransaction_expenseCategoryId_idx" ON "CashTransaction"("expenseCategoryId");

ALTER TABLE "CashTransaction"
  ADD CONSTRAINT "CashTransaction_expenseCategoryId_fkey"
  FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
