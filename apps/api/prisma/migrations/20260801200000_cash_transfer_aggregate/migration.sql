-- CHANGE-005 / ADR-034 / US-044: CashTransfer aggregate + link on CashTransaction
-- IDs are TEXT (Prisma uuid() default), matching CashAccount / User.

CREATE TABLE "CashTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceCashAccountId" TEXT NOT NULL,
    "destinationCashAccountId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'POSTED',
    "negativeBalanceOverrideReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "CashTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashTransfer_transferNumber_key" ON "CashTransfer"("transferNumber");
CREATE INDEX "CashTransfer_sourceCashAccountId_idx" ON "CashTransfer"("sourceCashAccountId");
CREATE INDEX "CashTransfer_destinationCashAccountId_idx" ON "CashTransfer"("destinationCashAccountId");
CREATE INDEX "CashTransfer_status_idx" ON "CashTransfer"("status");
CREATE INDEX "CashTransfer_transactionDate_idx" ON "CashTransfer"("transactionDate");
CREATE INDEX "CashTransfer_createdByUserId_idx" ON "CashTransfer"("createdByUserId");

ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_sourceCashAccountId_fkey" FOREIGN KEY ("sourceCashAccountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_destinationCashAccountId_fkey" FOREIGN KEY ("destinationCashAccountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashTransaction" ADD COLUMN "cashTransferId" TEXT;
CREATE INDEX "CashTransaction_cashTransferId_idx" ON "CashTransaction"("cashTransferId");
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_cashTransferId_fkey" FOREIGN KEY ("cashTransferId") REFERENCES "CashTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
VALUES ('CASH_TRANSFER', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
