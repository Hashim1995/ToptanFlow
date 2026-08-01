-- CHANGE-003 / ADR-030 / ADR-031:
-- 1) Add BusinessPartner.currentDebtBalance + BusinessPartnerDebtMovement
-- 2) Remove Currency FKs/columns from BusinessPartner, Sale, Purchase,
--    MoneyAccount, CashTransaction; drop Currency table
--
-- Data notes:
-- - No stored receivable/payable columns existed → no AR/AP migration formula.
-- - currentDebtBalance defaults to 0 for all partners.
-- - Dropping defaultCurrencyId discards preferred-currency preference only.
-- Does NOT truncate Product, Sale, Purchase, Cash, User, or BusinessPartner rows.

-- ---------------------------------------------------------------------------
-- 1. Partner signed debt balance (ADR-030)
-- ---------------------------------------------------------------------------

ALTER TABLE "BusinessPartner"
  ADD COLUMN IF NOT EXISTS "currentDebtBalance" DECIMAL(18,4) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "BusinessPartner_currentDebtBalance_idx"
  ON "BusinessPartner"("currentDebtBalance");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'BusinessPartnerDebtMovementKind'
  ) THEN
    CREATE TYPE "BusinessPartnerDebtMovementKind" AS ENUM (
      'SALE',
      'SALE_RETURN',
      'SALE_CANCELLATION',
      'PURCHASE',
      'PURCHASE_RETURN',
      'PURCHASE_CANCELLATION',
      'CASH_RECEIPT',
      'CASH_PAYMENT',
      'MANUAL_ADJUSTMENT',
      'OPENING_BALANCE',
      'REVERSAL'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BusinessPartnerDebtMovement" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "kind" "BusinessPartnerDebtMovementKind" NOT NULL,
  "signedAmount" DECIMAL(18,4) NOT NULL,
  "balanceBefore" DECIMAL(18,4) NOT NULL,
  "balanceAfter" DECIMAL(18,4) NOT NULL,
  "reason" TEXT,
  "saleId" TEXT,
  "purchaseId" TEXT,
  "cashTransactionId" TEXT,
  "relatedDocumentType" TEXT,
  "relatedDocumentId" TEXT,
  "reversalOfId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByUserId" TEXT NOT NULL,

  CONSTRAINT "BusinessPartnerDebtMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_partnerId_createdAt_idx"
  ON "BusinessPartnerDebtMovement"("partnerId", "createdAt");
CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_kind_idx"
  ON "BusinessPartnerDebtMovement"("kind");
CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_saleId_idx"
  ON "BusinessPartnerDebtMovement"("saleId");
CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_purchaseId_idx"
  ON "BusinessPartnerDebtMovement"("purchaseId");
CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_cashTransactionId_idx"
  ON "BusinessPartnerDebtMovement"("cashTransactionId");
CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_createdByUserId_idx"
  ON "BusinessPartnerDebtMovement"("createdByUserId");
CREATE INDEX IF NOT EXISTS "BusinessPartnerDebtMovement_reversalOfId_idx"
  ON "BusinessPartnerDebtMovement"("reversalOfId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessPartnerDebtMovement_partnerId_fkey'
  ) THEN
    ALTER TABLE "BusinessPartnerDebtMovement"
      ADD CONSTRAINT "BusinessPartnerDebtMovement_partnerId_fkey"
      FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessPartnerDebtMovement_saleId_fkey'
  ) THEN
    ALTER TABLE "BusinessPartnerDebtMovement"
      ADD CONSTRAINT "BusinessPartnerDebtMovement_saleId_fkey"
      FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessPartnerDebtMovement_purchaseId_fkey'
  ) THEN
    ALTER TABLE "BusinessPartnerDebtMovement"
      ADD CONSTRAINT "BusinessPartnerDebtMovement_purchaseId_fkey"
      FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessPartnerDebtMovement_cashTransactionId_fkey'
  ) THEN
    ALTER TABLE "BusinessPartnerDebtMovement"
      ADD CONSTRAINT "BusinessPartnerDebtMovement_cashTransactionId_fkey"
      FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessPartnerDebtMovement_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "BusinessPartnerDebtMovement"
      ADD CONSTRAINT "BusinessPartnerDebtMovement_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessPartnerDebtMovement_reversalOfId_fkey'
  ) THEN
    ALTER TABLE "BusinessPartnerDebtMovement"
      ADD CONSTRAINT "BusinessPartnerDebtMovement_reversalOfId_fkey"
      FOREIGN KEY ("reversalOfId") REFERENCES "BusinessPartnerDebtMovement"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Remove Currency from current domains (ADR-031)
-- ---------------------------------------------------------------------------

ALTER TABLE "BusinessPartner" DROP CONSTRAINT IF EXISTS "BusinessPartner_defaultCurrencyId_fkey";
DROP INDEX IF EXISTS "BusinessPartner_defaultCurrencyId_idx";
ALTER TABLE "BusinessPartner" DROP COLUMN IF EXISTS "defaultCurrencyId";

ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_currencyId_fkey";
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "currencyId";
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "foreignCurrencyAmount";
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "exchangeRate";

ALTER TABLE "Purchase" DROP CONSTRAINT IF EXISTS "Purchase_currencyId_fkey";
ALTER TABLE "Purchase" DROP COLUMN IF EXISTS "currencyId";
ALTER TABLE "Purchase" DROP COLUMN IF EXISTS "foreignCurrencyAmount";
ALTER TABLE "Purchase" DROP COLUMN IF EXISTS "exchangeRate";

ALTER TABLE "MoneyAccount" DROP CONSTRAINT IF EXISTS "MoneyAccount_currencyId_fkey";
ALTER TABLE "MoneyAccount" DROP COLUMN IF EXISTS "currencyId";

ALTER TABLE "CashTransaction" DROP CONSTRAINT IF EXISTS "CashTransaction_currencyId_fkey";
ALTER TABLE "CashTransaction" DROP COLUMN IF EXISTS "currencyId";
ALTER TABLE "CashTransaction" DROP COLUMN IF EXISTS "foreignCurrencyAmount";
ALTER TABLE "CashTransaction" DROP COLUMN IF EXISTS "exchangeRate";

DROP TABLE IF EXISTS "Currency";
