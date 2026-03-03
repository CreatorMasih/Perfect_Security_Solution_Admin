/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USERNAME?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_ADMIN_NAME?: string;
  readonly VITE_OTP_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
