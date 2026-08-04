// TOPTANFLOW — Prisma Seed Entry Point
//
// Optional bootstrap first user when BOOTSTRAP_USERNAME + BOOTSTRAP_PASSWORD
// are set (ADR-025). Bootstrap user is Super Admin (ADR-039 / CHANGE-007).
//
// Default warehouse seed removed under ADR-029 / CHANGE-002.
//
// Uses `pg` + `argon2` (not the generated Prisma ESM client) so `ts-node`
// seed works under CommonJS. See docs/technical/database-development.md.

import { loadApiEnvFiles } from '../src/config/load-api-env';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Client } from 'pg';

loadApiEnvFiles(resolve(__dirname, '..'));

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

  const existing = await client.query<{
    id: string;
    username: string;
    isSuperAdmin: boolean;
  }>(
    `SELECT id, username, "isSuperAdmin" FROM "User" WHERE username = $1 LIMIT 1`,
    [username],
  );

  if (existing.rows[0]) {
    if (!existing.rows[0].isSuperAdmin) {
      await client.query(
        `UPDATE "User" SET "isSuperAdmin" = true, "updatedAt" = NOW() WHERE id = $1`,
        [existing.rows[0].id],
      );
      // eslint-disable-next-line no-console
      console.log(
        `[prisma:seed] Promoted bootstrap user "${username}" to Super Admin.`,
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `[prisma:seed] Bootstrap user "${username}" already exists as Super Admin.`,
      );
    }
    return;
  }

  const countResult = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM "User"',
  );
  const count = Number(countResult.rows[0]?.count ?? 0);
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[prisma:seed] Skip create: ${count} user(s) already exist and BOOTSTRAP_USERNAME was not found.`,
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
    `INSERT INTO "User" (id, "fullName", username, "passwordHash", "isActive", "isSuperAdmin", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, true, true, NOW(), NOW())
     RETURNING id, username, "fullName"`,
    [id, fullName, username, passwordHash],
  );

  const user = inserted.rows[0];
  // eslint-disable-next-line no-console
  console.log(
    `[prisma:seed] Created Super Admin bootstrap user "${user.username}" (${user.id}).`,
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
