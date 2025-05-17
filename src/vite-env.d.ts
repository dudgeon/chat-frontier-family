
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_MODEL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_OPENAI_REALTIME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
