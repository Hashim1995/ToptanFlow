-- US-020 / ADR-026: Warehouse master + WAREHOUSE number sequence.

-- CreateEnum
CREATE TYPE "WarehouseKind" AS ENUM ('GENERAL', 'DAMAGED');

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "WarehouseKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_isActive_idx" ON "Warehouse"("isActive");

-- CreateIndex
CREATE INDEX "Warehouse_kind_idx" ON "Warehouse"("kind");

-- NumberSequence key for backend-generated Warehouse.code (ADR-024 pattern / ADR-026).
INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
VALUES ('WAREHOUSE', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
