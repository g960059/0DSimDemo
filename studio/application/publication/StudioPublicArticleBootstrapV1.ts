import {
  type StudioPublishedArticleV1,
  validateStudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublishedArticleV1";

export const STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID =
  "circleheart-public-article-bootstrap-v1";

/**
 * Publishes the already-authoritative public projection to the client without
 * a second Article request. Escaping '<' makes an authored closing script tag
 * inert while preserving byte-exact JSON after parsing.
 */
export function renderStudioPublicArticleBootstrapV1(
  article: StudioPublishedArticleV1,
): string {
  const json = JSON.stringify(article).replaceAll("<", "\\u003c");
  return `<script id="${STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID}" type="application/json">${json}</script>`;
}

/**
 * Reads only a projection that belongs to the current public route. The full
 * published contract is revalidated because document HTML is an untrusted
 * transport boundary even when it came from CircleHeart's render service.
 */
export function readStudioPublicArticleBootstrapV1(
  routeKey: string | undefined,
  documentLike: Pick<Document, "getElementById"> | undefined =
    typeof document === "undefined" ? undefined : document,
): StudioPublishedArticleV1 | null {
  if (routeKey === undefined || documentLike === undefined) return null;
  const element = documentLike.getElementById(
    STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID,
  );
  if (element === null || element.textContent === null) return null;
  try {
    const article = validateStudioPublishedArticleV1(
      JSON.parse(element.textContent) as unknown,
    );
    return article.publicSlug === routeKey || article.articleId === routeKey
      ? article
      : null;
  } catch {
    return null;
  }
}
