/**
 * Nest/tsc compiles Prisma's generated ESM client into CommonJS but leaves
 * `import.meta.url` intact. Node then loads the file as ESM and crashes with
 * `exports is not defined`. Replace that single expression with `__dirname`
 * so `nest start` / `node dist/src/main.js` can boot.
 *
 * This does not change Prisma schema, migrations, or business behavior.
 */
const fs = require('node:fs');
const path = require('node:path');

const clientPath = path.join(
  __dirname,
  '..',
  'dist',
  'generated',
  'prisma',
  'client.js',
);

if (!fs.existsSync(clientPath)) {
  console.warn(
    `[patch-prisma-client-dist] skip: ${clientPath} does not exist`,
  );
  process.exit(0);
}

const original = fs.readFileSync(clientPath, 'utf8');
const patched = original.replace(
  /path\.dirname\(\(0, node_url_1\.fileURLToPath\)\(import\.meta\.url\)\)/g,
  '__dirname',
);

if (original === patched) {
  if (original.includes('import.meta')) {
    console.error(
      '[patch-prisma-client-dist] import.meta still present; pattern mismatch',
    );
    process.exit(1);
  }
  process.exit(0);
}

fs.writeFileSync(clientPath, patched);
console.log('[patch-prisma-client-dist] patched import.meta.url -> __dirname');
