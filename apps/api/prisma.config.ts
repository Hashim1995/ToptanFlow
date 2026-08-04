// Prisma loads env before connecting. Prefer `.env.<NODE_ENV>`, then `.env`.
// Production on Vercel uses Project Environment Variables (no file required).
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
