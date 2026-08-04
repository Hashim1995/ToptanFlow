/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Required for production builds; optional in local Vite (uses `/api` proxy). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
