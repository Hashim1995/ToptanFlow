import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for apps/web (ADR-018).
 * Separate from vite.config.ts so app React plugins are not required for
 * pure helper unit tests. Vitest 3.x chosen for Yarn workspace stability
 * on this environment (Vitest 4 suite-load flake observed).
 */
export default defineConfig({
  root,
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
