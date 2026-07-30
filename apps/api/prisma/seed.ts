// TOPTANFLOW — Prisma Seed Entry Point
//
// 1) Default GENERAL warehouse when Warehouse table is empty (ADR-026 / US-020).
// 2) Optional bootstrap first user when BOOTSTRAP_USERNAME + BOOTSTRAP_PASSWORD
//    are set and the User table is empty (ADR-025).
//
// Uses `pg` + `argon2` (not the generated Prisma ESM client) so `ts-node`
// seed works under CommonJS. See docs/technical/database-development.md.

import 'dotenv/config';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

async function seedDefaultWarehouse(client: Client): Promise<void> {
  const countResult = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM "Warehouse"',
  );
  const count = Number(countResult.rows[0]?.count ?? 0);
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[prisma:seed] Skip default warehouse: ${count} warehouse(s) already exist.`,
    );
    return;
  }

  await client.query(
    `INSERT INTO "NumberSequence" ("key", "currentValue", "padding", "createdAt", "updatedAt")
     VALUES ('WAREHOUSE', 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT ("key") DO NOTHING`,
  );

  const seq = await client.query<{ currentValue: string; padding: number }>(
    `UPDATE "NumberSequence"
     SET "currentValue" = "currentValue" + 1,
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE key = 'WAREHOUSE'
     RETURNING "currentValue"::text AS "currentValue", padding`,
  );

  if (seq.rows.length === 0) {
    throw new Error(
      '[prisma:seed] NumberSequence key WAREHOUSE is not configured.',
    );
  }

  const currentValue = BigInt(seq.rows[0].currentValue);
  const padding = seq.rows[0].padding;
  const code = currentValue.toString().padStart(padding, '0');
  const id = randomUUID();

  await client.query(
    `INSERT INTO "Warehouse" (id, code, name, kind, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'GENERAL', true, NOW(), NOW())`,
    [id, code, 'Əsas anbar'],
  );

  // eslint-disable-next-line no-console
  console.log(
    `[prisma:seed] Created default warehouse "Əsas anbar" code=${code} (${id}).`,
  );
}

async function seedBootstrapUser(client: Client): Promise<void> {
  const username = process.env.BOOTSTRAP_USERNAME?.trim();
  const password = process.env.BOOTSTRAP_PASSWORD;
  const fullName =
    process.env.BOOTSTRAP_FULL_NAME?.trim() || 'Bootstrap User';

  if (!username || !password) {
    // eslint-disable-next-line no-console
    console.log(
      '[prisma:seed] Skip bootstrap user: set BOOTSTRAP_USERNAME and BOOTSTRAP_PASSWORD to create the first user when the table is empty.',
    );
    return;
  }

  if (password.length < 8) {
    throw new Error(
      '[prisma:seed] BOOTSTRAP_PASSWORD must be at least 8 characters.',
    );
  }

  const countResult = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM "User"',
  );
  const count = Number(countResult.rows[0]?.count ?? 0);
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[prisma:seed] Skip bootstrap user: ${count} user(s) already exist.`,
    );
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });
  const id = randomUUID();
  const inserted = await client.query<{
    id: string;
    username: string;
    fullName: string;
  }>(
    `INSERT INTO "User" (id, "fullName", username, "passwordHash", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, true, NOW(), NOW())
     RETURNING id, username, "fullName"`,
    [id, fullName, username, passwordHash],
  );

  const user = inserted.rows[0];
  // eslint-disable-next-line no-console
  console.log(
    `[prisma:seed] Created bootstrap user "${user.username}" (${user.id}).`,
  );
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('[prisma:seed] DATABASE_URL is required.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await seedDefaultWarehouse(client);
    await seedBootstrapUser(client);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[prisma:seed] Failed:', error);
  process.exit(1);
});
