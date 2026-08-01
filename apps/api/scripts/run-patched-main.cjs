/**
 * Used as `nest start --watch --exec "node scripts/run-patched-main.cjs"`.
 * Nest may append Node flags (e.g. --enable-source-maps) plus the compiled
 * entry path; patch the Prisma client, then load the entry.
 */
process.env.TZ = 'UTC';
require('./patch-prisma-client-dist.cjs');

const entry = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
if (!entry) {
  console.error(
    '[run-patched-main] missing entry file argument from nest start',
    process.argv.slice(2),
  );
  process.exit(1);
}

require(require('node:path').resolve(entry));
