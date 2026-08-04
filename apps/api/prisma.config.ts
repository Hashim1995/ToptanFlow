// Prisma loads env before connecting via loadApiEnvFiles (NODE_ENV-aware).
// Shell / Vercel process.env always wins over files. Production never loads
// .env.development* or .env.local (see env-file-paths.ts).
import { loadApiEnvFiles } from './src/config/load-api-env';
import { defineConfig } from 'prisma/config';

loadApiEnvFiles(__dirname);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Optional bootstrap first user when BOOTSTRAP_* env vars are set and User
    // table is empty (ADR-025 / TASK-018-01). See apps/api/.env.development.
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
