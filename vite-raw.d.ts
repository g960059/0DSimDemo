declare module "*?raw" {
  const rawText: string;
  export default rawText;
}

interface ImportMetaEnv {
  readonly MODE: string;
  readonly PROD: boolean;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_MODEL_LAB_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
