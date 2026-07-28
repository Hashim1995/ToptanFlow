/**
 * Used as `nest start --watch --exec "node scripts/run-patched-main.cjs"`.
 * Nest appends the compiled entry path; patch the Prisma client, then load it.
 */
require('./patch-prisma-client-dist.cjs');

const entry = process.argv[2];
if (!entry) {
  console.error('[run-patched-main] missing entry file argument from nest start');
  process.exit(1);
}

require(require('node:path').resolve(entry));
