/**
 * Jest loads this before tests so Prisma/pg timestamp reads match UTC writes
 * (same as apps/api/src/set-utc-timezone.ts for the running API).
 */
process.env.TZ = 'UTC';
