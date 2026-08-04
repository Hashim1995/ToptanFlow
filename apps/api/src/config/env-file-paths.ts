/**
 * Ordered dotenv files for Nest ConfigModule / Prisma tooling.
 *
 * Nest `ConfigModule` assigns the **first** value encountered for a key, so
 * paths are returned most-specific → least-specific.
 *
 * Production never loads `.env.local` or any `.env.development*` file — those
 * commonly hold localhost DATABASE_URL and were causing migrate/deploy to hit
 * the wrong database when run from a developer machine.
 */
export function resolveEnvFilePaths(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string[] {
  const mode = (nodeEnv?.trim() || 'development').toLowerCase();

  if (mode === 'production') {
    return ['.env.production.local', '.env.production', '.env'];
  }

  if (mode === 'test') {
    return ['.env.test.local', '.env.test', '.env'];
  }

  // development (default when NODE_ENV unset)
  return [
    `.env.${mode}.local`,
    '.env.local',
    `.env.${mode}`,
    '.env',
  ];
}

/**
 * Least-specific → most-specific order for dotenv loaders that use
 * `override: true` between files (later file wins among files only).
 */
export function resolveEnvFilePathsAscending(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string[] {
  return resolveEnvFilePaths(nodeEnv).slice().reverse();
}
