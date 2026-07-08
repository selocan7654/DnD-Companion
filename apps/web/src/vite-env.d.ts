/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_WS_URL?: string;
  readonly SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
