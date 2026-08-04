import { config } from 'dotenv';
import { resolve } from 'node:path';
import { resolveEnvFilePaths } from './env-file-paths';

/**
 * Load API env files for Prisma CLI / seed (outside Nest).
 * Does not override variables already set in the process environment (Vercel).
 */
export function loadApiEnvFiles(apiRoot: string = process.cwd()): void {
  for (const file of resolveEnvFilePaths()) {
    config({ path: resolve(apiRoot, file) });
  }
}
