/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SUPABASE_URL: string;
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly SUPABASE_SECRET_KEY: string;
  readonly SUPABASE_JWT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
