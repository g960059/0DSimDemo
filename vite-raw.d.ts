declare module "*?raw" {
  const rawText: string;
  export default rawText;
}

interface ImportMetaEnv {
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
