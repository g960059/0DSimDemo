export function portableArticleEditorIdV3(
  kind: "block" | "placement" | "article" | "choice",
): string {
  const random = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (kind === "article") return `article-${random}`;
  return `${kind}/local-${random}`;
}
