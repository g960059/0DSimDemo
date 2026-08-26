export function articleEditorErrorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
