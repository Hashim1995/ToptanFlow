-- ADR-040 / CHANGE-019: every Cash Account has one unique responsible User.
-- This repository is still in development, so existing accounts are assigned
-- randomly to distinct active users as explicitly approved by the owner.
DO $$
DECLARE
  account_count integer;
  active_user_count integer;
BEGIN
  SELECT COUNT(*) INTO account_count FROM "CashAccount";
  SELECT COUNT(*) INTO active_user_count FROM "User" WHERE "isActive" = true;

  IF active_user_count < account_count THEN
    RAISE EXCEPTION
      'Cannot assign one unique responsible user per Cash Account: % accounts, % active users',
      account_count,
      active_user_count;
  END IF;
END $$;

WITH randomized_accounts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) AS position
  FROM "CashAccount"
),
randomized_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) AS position
  FROM "User"
  WHERE "isActive" = true
)
UPDATE "CashAccount" AS account
SET "responsibleUserId" = randomized_users.id
FROM randomized_accounts
JOIN randomized_users USING (position)
WHERE account.id = randomized_accounts.id;

DROP INDEX IF EXISTS "CashAccount_responsibleUserId_idx";
ALTER TABLE "CashAccount"
  ALTER COLUMN "responsibleUserId" SET NOT NULL;
CREATE UNIQUE INDEX "CashAccount_responsibleUserId_key"
  ON "CashAccount"("responsibleUserId");

ALTER TABLE "CashAccount"
  DROP CONSTRAINT "CashAccount_responsibleUserId_fkey";
ALTER TABLE "CashAccount"
  ADD CONSTRAINT "CashAccount_responsibleUserId_fkey"
  FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
