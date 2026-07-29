// TOPTANFLOW — Prisma Seed Entry Point
//
// Bootstrap first user when BOOTSTRAP_USERNAME + BOOTSTRAP_PASSWORD are set and
// the User table is empty (ADR-025 / TASK-018-01). No other business reference
// data is seeded here.
//
// See docs/technical/database-development.md and apps/api/.env.example.

import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

async function main(): Promise<void> {
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

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('[prisma:seed] DATABASE_URL is required.');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const count = await prisma.user.count();
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
    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log(
      `[prisma:seed] Created bootstrap user "${user.username}" (${user.id}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[prisma:seed] Failed:', error);
  process.exit(1);
});
