import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Fail production builds early when the API base URL is missing, so a
  // deployed bundle cannot silently target localhost.
  if (
    command === 'build' &&
    mode === 'production' &&
    !env.VITE_API_BASE_URL?.trim()
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be set for production builds (apps/web/.env.production or Vercel env). Local `yarn workspace web dev` does not require it.',
    );
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Avoid browser CORS in local dev: web (5173) → api (3000) via same origin.
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
