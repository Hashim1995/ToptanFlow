-- Cross-cutting: automatic Product / BusinessPartner business codes (ADR-024).
-- Creates NumberSequence and safely initializes PRODUCT / BUSINESS_PARTNER rows.
-- Does not alter Product or BusinessPartner column definitions or existing codes.

-- CreateTable
CREATE TABLE "NumberSequence" (
    "key" TEXT NOT NULL,
    "currentValue" BIGINT NOT NULL DEFAULT 0,
    "padding" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("key")
);

-- Fail clearly when historical codes cannot be converted to a non-negative bigint.
DO $$
DECLARE
  bad_product_count INTEGER;
  bad_partner_count INTEGER;
  product_max BIGINT;
  partner_max BIGINT;
BEGIN
  SELECT COUNT(*)::INTEGER INTO bad_product_count
  FROM "Product"
  WHERE code IS NULL
     OR btrim(code) = ''
     OR code <> btrim(code)
     OR code !~ '^[0-9]+$'
     OR length(code) > 18;

  IF bad_product_count > 0 THEN
    RAISE EXCEPTION
      'Unsupported Product.code values for NumberSequence initialization (% row(s)). Remediate historical codes before migrating.',
      bad_product_count;
  END IF;

  SELECT COUNT(*)::INTEGER INTO bad_partner_count
  FROM "BusinessPartner"
  WHERE code IS NULL
     OR btrim(code) = ''
     OR code <> btrim(code)
     OR code !~ '^[0-9]+$'
     OR length(code) > 18;

  IF bad_partner_count > 0 THEN
    RAISE EXCEPTION
      'Unsupported BusinessPartner.code values for NumberSequence initialization (% row(s)). Remediate historical codes before migrating.',
      bad_partner_count;
  END IF;

  SELECT COALESCE(MAX(code::BIGINT), 0) INTO product_max FROM "Product";
  SELECT COALESCE(MAX(code::BIGINT), 0) INTO partner_max FROM "BusinessPartner";

  INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
  VALUES
    ('PRODUCT', product_max, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BUSINESS_PARTNER', partner_max, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
END $$;
