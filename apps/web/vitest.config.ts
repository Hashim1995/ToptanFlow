import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for apps/web (ADR-018).
 * Unit helpers run in node; *.tsx smoke tests use jsdom + Testing Library.
 * Vitest 3.x chosen for Yarn workspace stability on this environment.
 *
 * React plugin deliberately omitted — vitest.config is separate from
 * vite.config; JSX transform is handled by esbuild defaults in test mode.
 */
export default defineConfig({
  root,
  test: {
    testTimeout: 15_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.{test,spec}.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
