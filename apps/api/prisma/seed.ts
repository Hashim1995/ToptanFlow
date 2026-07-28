// TOPTANFLOW — Prisma Seed Entry Point
//
// Scope: this is infrastructure only. No business reference data (currencies,
// units, users, products, business partners, documents, or cash records) is
// inserted here. Business seed data is explicitly out of scope for the task
// that created this file (database infrastructure) and requires its own
// approved task, sourced from docs/business/invariants.md and
// docs/business/terminology.md, before any row is written.
//
// This script is intentionally a safe no-op: it logs a message and exits
// successfully. It is safe to run repeatedly (idempotent by virtue of doing
// nothing), and is wired up so `prisma db seed`, and `prisma migrate dev` /
// `prisma migrate reset` (which run the seed automatically), do not fail with
// a missing-seed-script error.
//
// See docs/technical/database-development.md for how this fits into the
// overall local development workflow.

function main(): void {
  // eslint-disable-next-line no-console
  console.log(
    '[prisma:seed] No-op: business reference/seed data is not yet defined. ' +
      'This will be implemented in a future, separately approved task.',
  );
}

main();
