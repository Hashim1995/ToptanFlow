/**
 * Production-only Prisma migrate deploy with safety checks.
 *
 * Usage (Git Bash / PowerShell / cmd):
 *   yarn workspace api prisma:migrate:prod
 *
 * Requires a non-local DATABASE_URL from:
 *   - the shell / CI / Vercel env, or
 *   - apps/api/.env.production(.local) after NODE_ENV=production loading.
 */
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

process.env.NODE_ENV = 'production';

const apiRoot = resolve(__dirname, '..');

// Load the same env rules as prisma.config.ts (CommonJS mirror).
const { config } = require('dotenv');
const mode = 'production';
const ascending = ['.env', `.env.${mode}`, `.env.${mode}.local`];
const locked = new Map();
for (const [key, value] of Object.entries(process.env)) {
  if (value !== undefined) locked.set(key, value);
}
for (const file of ascending) {
  config({
    path: resolve(apiRoot, file),
    override: true,
    quiet: true,
    debug: false,
  });
}
for (const [key, value] of locked) {
  process.env[key] = value;
}

const databaseUrl = (process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error(
    '[prisma:migrate:prod] DATABASE_URL is missing.\n' +
      'Set it in the shell, or in apps/api/.env.production, then retry.\n' +
      'Example (Git Bash):\n' +
      '  export DATABASE_URL="postgresql://...@ep-....neon.tech/neondb?sslmode=require"\n' +
      '  yarn workspace api prisma:migrate:prod',
  );
  process.exit(1);
}

function isLocalDatabaseUrl(url) {
  const lower = url.toLowerCase();
  return (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0') ||
    lower.includes('@::1') ||
    /\/toptanflow_dev(\?|$)/.test(lower)
  );
}

if (isLocalDatabaseUrl(databaseUrl) && process.env.ALLOW_LOCAL_PROD_MIGRATE !== '1') {
  console.error(
    '[prisma:migrate:prod] Refusing to migrate a local database.\n' +
      'Detected localhost / toptanflow_dev in DATABASE_URL.\n' +
      'Point DATABASE_URL at Neon production (shell or .env.production).\n' +
      'Emergency override only: ALLOW_LOCAL_PROD_MIGRATE=1',
  );
  process.exit(1);
}

let hostLabel = '(unparsed)';
try {
  const parsed = new URL(databaseUrl.replace(/^postgresql:/i, 'http:'));
  hostLabel = `${parsed.hostname}${parsed.pathname}`;
} catch {
  hostLabel = '(invalid DATABASE_URL format)';
}

console.log('[prisma:migrate:prod] NODE_ENV=production');
console.log(`[prisma:migrate:prod] target: ${hostLabel}`);
console.log('[prisma:migrate:prod] running: prisma migrate deploy');

const result = spawnSync(
  process.platform === 'win32' ? 'yarn.cmd' : 'yarn',
  ['prisma', 'migrate', 'deploy'],
  {
    cwd: apiRoot,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('[prisma:migrate:prod] migrate deploy finished successfully.');
console.log(
  '[prisma:migrate:prod] Reminder: set WEB_PUSH_VAPID_* + WEB_PUSH_CONTACT on the Vercel API project for push sending.',
);
