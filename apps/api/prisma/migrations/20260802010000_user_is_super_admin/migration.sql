-- CHANGE-007 / ADR-039: Super Admin flag for Users module only.
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_isSuperAdmin_idx" ON "User"("isSuperAdmin");

-- Existing DBs: promote the chronologically first user so bootstrap remains usable.
UPDATE "User" AS u
SET "isSuperAdmin" = true
FROM (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) AS first
WHERE u.id = first.id;
