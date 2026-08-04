/**
 * Ordered dotenv files for Nest ConfigModule / Prisma tooling.
 * First existing file wins per key (Nest ConfigModule + dotenv default).
 * Prefer private overrides (*.local), then committed mode files.
 * On Vercel, process env is the source of truth (files usually absent).
 */
export function resolveEnvFilePaths(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string[] {
  const mode = nodeEnv?.trim() || 'development';
  return [
    `.env.${mode}.local`,
    '.env.local',
    `.env.${mode}`,
    '.env',
  ];
}
