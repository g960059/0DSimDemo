import React from "react";
import katex from "katex";

import type {
  StudioArticleDividerBlockV2,
  StudioArticleEquationBlockV2,
  StudioArticleImageBlockV2,
} from "@/studio/contracts/v2/article";

export function renderArticleEquationHtmlV3(expression: string): string {
  if (expression.length === 0) return "";
  return katex.renderToString(expression, {
    displayMode: true,
    output: "htmlAndMathml",
    strict: false,
    throwOnError: false,
    trust: false,
  });
}

export function ArticleEquationPresentationV3({
  block,
  className = "",
}: Readonly<{
  block: StudioArticleEquationBlockV2;
  className?: string;
}>) {
  const html = React.useMemo(
    () => renderArticleEquationHtmlV3(block.expression),
    [block.expression],
  );
  if (html.length === 0) return null;
  return (
    <div
      className={`article-equation-v3 overflow-x-auto py-3 text-center text-wb-text ${className}`}
      data-testid="article-equation-v3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ArticleImagePresentationV3({
  block,
  className = "",
}: Readonly<{
  block: StudioArticleImageBlockV2;
  className?: string;
}>) {
  if (block.url.length === 0) return null;
  return (
    <figure className={`my-8 ${className}`} data-testid="article-image-v3">
      <img
        src={block.url}
        alt={block.altText}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain"
      />
      {block.caption.length > 0 && (
        <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-wb-muted">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function ArticleDividerPresentationV3({
  block: _block,
  className = "",
}: Readonly<{
  block: StudioArticleDividerBlockV2;
  className?: string;
}>) {
  return (
    <hr
      className={`my-10 border-0 border-t border-wb-line/70 ${className}`}
      data-testid="article-divider-v3"
    />
  );
}
