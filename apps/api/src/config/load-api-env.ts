import { config } from 'dotenv';
import { resolve } from 'node:path';
import { resolveEnvFilePathsAscending } from './env-file-paths';

/**
 * Load API env files for Prisma CLI / seed (outside Nest).
 *
 * Rules:
 * - Variables already present in `process.env` (shell, Vercel, CI) always win.
 * - Among env files, more specific files override less specific ones.
 * - Production mode never loads development / `.env.local` files
 *   (see `resolveEnvFilePaths`).
 */
export function loadApiEnvFiles(apiRoot: string = process.cwd()): void {
  const locked = new Map<string, string>();
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      locked.set(key, value);
    }
  }

  for (const file of resolveEnvFilePathsAscending()) {
    config({
      path: resolve(apiRoot, file),
      // Allow later (more specific) files to override earlier file values.
      override: true,
      // Quiet tips so CI/migrate output stays readable (dotenv ≥16.4).
      quiet: true,
      debug: false,
    });
  }

  // Restore any values that were already defined before file loading.
  for (const [key, value] of locked) {
    process.env[key] = value;
  }
}
