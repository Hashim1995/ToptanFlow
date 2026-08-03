-- Multi-Cash-Account domain (CHANGE-004 / ADR-032–037 / TASK-024-01)
-- Expects MoneyAccount / CashTransaction tables empty or unused (no Cash API).
-- Does not reset the database or drop Sale/Purchase/Partner/Product data.

-- Drop legacy Cash FKs and tables
ALTER TABLE "BusinessPartnerDebtMovement" DROP CONSTRAINT IF EXISTS "BusinessPartnerDebtMovement_cashTransactionId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_moneyAccountId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_partnerId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_saleId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_purchaseId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_pairedTransactionId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_postedByUserId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_cancelledByUserId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_createdByUserId_fkey";
ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_currencyId_fkey";

DROP TABLE IF EXISTS "CashTransaction";
DROP TABLE IF EXISTS "MoneyAccount";

DROP TYPE IF EXISTS "CashTransactionType";
DROP TYPE IF EXISTS "MoneyAccountType";

-- New enums
CREATE TYPE "CashTransactionDirection" AS ENUM ('IN', 'OUT');
CREATE TYPE "CashTransactionType" AS ENUM (
  'CUSTOMER_RECEIPT',
  'SUPPLIER_PAYMENT',
  'OTHER_INCOME',
  'EXPENSE',
  'OWNER_DEPOSIT',
  'OWNER_WITHDRAWAL',
  'OPENING_BALANCE',
  'MANUAL_ADJUSTMENT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'REVERSAL'
);

-- CashAccount
CREATE TABLE "CashAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "notes" TEXT,
  "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "responsibleUserId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deactivatedAt" TIMESTAMP(3),
  "deactivatedByUserId" TEXT,
  "deactivationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdByUserId" TEXT NOT NULL,

  CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashAccount_name_key" ON "CashAccount"("name");
CREATE UNIQUE INDEX "CashAccount_code_key" ON "CashAccount"("code");
CREATE INDEX "CashAccount_isActive_idx" ON "CashAccount"("isActive");
CREATE INDEX "CashAccount_responsibleUserId_idx" ON "CashAccount"("responsibleUserId");
CREATE INDEX "CashAccount_createdByUserId_idx" ON "CashAccount"("createdByUserId");

ALTER TABLE "CashAccount" ADD CONSTRAINT "CashAccount_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashAccount" ADD CONSTRAINT "CashAccount_deactivatedByUserId_fkey" FOREIGN KEY ("deactivatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashAccount" ADD CONSTRAINT "CashAccount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CashTransaction
CREATE TABLE "CashTransaction" (
  "id" TEXT NOT NULL,
  "transactionNumber" TEXT NOT NULL,
  "cashAccountId" TEXT NOT NULL,
  "direction" "CashTransactionDirection" NOT NULL,
  "type" "CashTransactionType" NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'POSTED',
  "amount" DECIMAL(18,2) NOT NULL,
  "transactionDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "balanceBefore" DECIMAL(18,2) NOT NULL,
  "balanceAfter" DECIMAL(18,2) NOT NULL,
  "negativeBalanceOverrideReason" TEXT,
  "partnerId" TEXT,
  "saleId" TEXT,
  "purchaseId" TEXT,
  "reversalOfTransactionId" TEXT,
  "postedAt" TIMESTAMP(3),
  "postedByUserId" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledByUserId" TEXT,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdByUserId" TEXT NOT NULL,

  CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashTransaction_transactionNumber_key" ON "CashTransaction"("transactionNumber");
CREATE UNIQUE INDEX "CashTransaction_reversalOfTransactionId_key" ON "CashTransaction"("reversalOfTransactionId");
CREATE INDEX "CashTransaction_cashAccountId_transactionDate_idx" ON "CashTransaction"("cashAccountId", "transactionDate");
CREATE INDEX "CashTransaction_type_idx" ON "CashTransaction"("type");
CREATE INDEX "CashTransaction_direction_idx" ON "CashTransaction"("direction");
CREATE INDEX "CashTransaction_status_idx" ON "CashTransaction"("status");
CREATE INDEX "CashTransaction_partnerId_idx" ON "CashTransaction"("partnerId");
CREATE INDEX "CashTransaction_saleId_idx" ON "CashTransaction"("saleId");
CREATE INDEX "CashTransaction_purchaseId_idx" ON "CashTransaction"("purchaseId");
CREATE INDEX "CashTransaction_createdByUserId_idx" ON "CashTransaction"("createdByUserId");
CREATE INDEX "CashTransaction_postedAt_idx" ON "CashTransaction"("postedAt");

ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_reversalOfTransactionId_fkey" FOREIGN KEY ("reversalOfTransactionId") REFERENCES "CashTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Re-link partner debt movements to CashTransaction
ALTER TABLE "BusinessPartnerDebtMovement" ADD CONSTRAINT "BusinessPartnerDebtMovement_cashTransactionId_fkey" FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Number sequences for Cash Account codes and Cash Transaction numbers
INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
VALUES
  ('CASH_ACCOUNT', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CASH_TRANSACTION', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CASH_TRANSFER', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
