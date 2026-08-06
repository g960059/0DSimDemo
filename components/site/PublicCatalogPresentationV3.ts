import type { StudioArticleBlockV2 } from "@/studio/contracts/v2/article";

/** Human-facing article preview; never exposes block IDs or storage metadata. */
export function publicArticleExcerptV3(
  blocks: readonly StudioArticleBlockV2[],
): string | null {
  const paragraph = blocks.find(({ kind }) => kind === "paragraph");
  if (paragraph?.kind === "paragraph" && paragraph.text.trim()) {
    return paragraph.text.trim();
  }
  const authoredText = blocks.find((block) =>
    (block.kind === "heading" || block.kind === "paragraph") &&
    block.text.trim());
  return authoredText?.kind === "heading" || authoredText?.kind === "paragraph"
    ? authoredText.text.trim()
    : null;
}
