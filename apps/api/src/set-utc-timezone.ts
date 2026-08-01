/**
 * Prisma maps DateTime → PostgreSQL `TIMESTAMP(3)` (without time zone) and
 * writes UTC calendar components. The `pg` driver reads those naive values in
 * the Node process timezone. If Node is Asia/Baku, every read shifts by −4h.
 *
 * Force UTC before any Prisma/pg import so storage and reads stay aligned.
 * UI still displays Asia/Baku via shared datetime helpers.
 */
process.env.TZ = 'UTC';
