import { stripArticleReadingMarkupV1 } from "@/studio/application/article/StudioArticleReadingV1";
import type { StudioArticleBlockV2 } from "@/studio/contracts/v2/article";

/** Human-facing article preview; never exposes block IDs or storage metadata. */
export function publicArticleExcerptV3(
  blocks: readonly StudioArticleBlockV2[],
): string | null {
  const paragraph = blocks.find(({ kind }) => kind === "paragraph");
  if (paragraph?.kind === "paragraph" && stripArticleReadingMarkupV1(paragraph.text).trim()) {
    return stripArticleReadingMarkupV1(paragraph.text).trim();
  }
  const authoredText = blocks.find((block) =>
    (block.kind === "heading" || block.kind === "paragraph") &&
    block.text.trim());
  return authoredText?.kind === "heading" || authoredText?.kind === "paragraph"
    ? stripArticleReadingMarkupV1(authoredText.text).trim()
    : null;
}
