declare module "*?raw" {
  const rawText: string;
  export default rawText;
}

interface ImportMetaEnv {
  readonly MODE: string;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
