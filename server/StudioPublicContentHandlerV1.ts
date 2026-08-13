import {
  injectStudioPublicDocumentV1,
  renderStudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublicArticleRendererV1";
import type {
  StudioPublicArticleSummaryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import type {
  StudioPublicContentDataSourceV1,
} from "@/server/StudioPublicContentDataSourceV1";

export type StudioPublicContentHandlerDependenciesV1 = Readonly<{
  canonicalOrigin: string;
  clientTemplate: string;
  dataSource: StudioPublicContentDataSourceV1;
}>;

const PUBLIC_SLUG_OR_UUID_V1 =
  /^(?:[a-z0-9][a-z0-9-]{2,95}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const PUBLIC_CACHE_V1 =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export async function handleStudioPublicContentRequestV1(
  request: Request,
  dependencies: StudioPublicContentHandlerDependenciesV1,
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return responseV1("Method not allowed\n", 405, "text/plain; charset=utf-8", {
      Allow: "GET, HEAD",
    }, request.method);
  }
  if (url.pathname === "/healthz") {
    return responseV1("ok\n", 200, "text/plain; charset=utf-8", {}, request.method);
  }
  if (url.pathname === "/robots.txt") {
    return responseV1(
      robotsTextV1(dependencies.canonicalOrigin),
      200,
      "text/plain; charset=utf-8",
      publicHeadersV1(),
      request.method,
    );
  }
  if (url.pathname === "/sitemap.xml") {
    const articles = await listAllPublicArticlesV1(dependencies.dataSource);
    return responseV1(
      sitemapXmlV1(articles, dependencies.canonicalOrigin),
      200,
      "application/xml; charset=utf-8",
      publicHeadersV1(),
      request.method,
    );
  }

  const apiMatch = /^\/api\/v1\/public\/articles\/([^/]+)$/.exec(url.pathname);
  if (apiMatch !== null) {
    return publishedArticleResponseV1({
      dependencies,
      format: "json",
      locale: null,
      request,
      routeKey: decodedRouteKeyV1(apiMatch[1]),
    });
  }

  const directoryMatch = /^\/(ja|en)\/articles\/?$/.exec(url.pathname);
  if (directoryMatch !== null) {
    const locale = directoryMatch[1] as "ja" | "en";
    const articles = (await listAllPublicArticlesV1(dependencies.dataSource))
      .filter((article) => article.locale === locale);
    const canonicalUrl = new URL(`/${locale}/articles`, dependencies.canonicalOrigin)
      .toString();
    const title = locale === "ja" ? "記事 | CircleHeart" : "Articles | CircleHeart";
    const description = locale === "ja"
      ? "循環動態をシミュレーションで学ぶCircleHeartの記事一覧です。"
      : "CircleHeart articles for learning hemodynamics through simulation.";
    const documentHtml = injectStudioPublicDocumentV1({
      additionalHeadHtml: `<meta property="og:type" content="website" />`,
      bodyHtml: articleDirectoryBodyV1(articles, locale),
      canonicalUrl,
      clientTemplate: dependencies.clientTemplate,
      description,
      language: locale,
      title,
    });
    return responseV1(
      documentHtml,
      200,
      "text/html; charset=utf-8",
      publicHeadersV1(),
      request.method,
    );
  }

  const articleMatch = /^\/(ja|en)\/articles\/([^/]+?)(\.(?:md|json))?$/.exec(
    url.pathname,
  );
  if (articleMatch !== null) {
    const locale = articleMatch[1] as "ja" | "en";
    const format = articleMatch[3] === ".md"
      ? "markdown"
      : articleMatch[3] === ".json"
        ? "json"
        : "html";
    return publishedArticleResponseV1({
      dependencies,
      format,
      locale,
      request,
      routeKey: decodedRouteKeyV1(articleMatch[2]),
    });
  }

  return notFoundResponseV1(request, dependencies);
}

async function publishedArticleResponseV1(input: Readonly<{
  dependencies: StudioPublicContentHandlerDependenciesV1;
  format: "html" | "json" | "markdown";
  locale: "ja" | "en" | null;
  request: Request;
  routeKey: string | null;
}>): Promise<Response> {
  if (input.routeKey === null || !PUBLIC_SLUG_OR_UUID_V1.test(input.routeKey)) {
    return notFoundResponseV1(input.request, input.dependencies);
  }
  const article = await input.dependencies.dataSource.readPublishedArticle(
    input.routeKey,
  );
  if (article === null) {
    return notFoundResponseV1(input.request, input.dependencies);
  }

  if (
    input.routeKey !== article.publicSlug
    || (input.format !== "json" && input.locale !== article.locale)
  ) {
    const location = input.format === "json"
      ? new URL(
          `/api/v1/public/articles/${article.publicSlug}`,
          input.dependencies.canonicalOrigin,
        ).toString()
      : new URL(
          `/${article.locale}/articles/${article.publicSlug}${input.format === "markdown" ? ".md" : ""}`,
          input.dependencies.canonicalOrigin,
        ).toString();
    return responseV1("", 308, "text/plain; charset=utf-8", {
      Location: location,
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    }, input.request.method);
  }

  const rendered = renderStudioPublishedArticleV1({
    article,
    canonicalOrigin: input.dependencies.canonicalOrigin,
    clientTemplate: input.dependencies.clientTemplate,
  });
  const etag = `"article-${article.articleContentId}-${input.format}-v1"`;
  if (input.request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: secureHeadersV1({
        "Cache-Control": PUBLIC_CACHE_V1,
        ETag: etag,
      }),
    });
  }
  const formatBody = input.format === "html"
    ? rendered.documentHtml
    : input.format === "markdown"
      ? rendered.markdown
      : rendered.json;
  const contentType = input.format === "html"
    ? "text/html; charset=utf-8"
    : input.format === "markdown"
      ? "text/markdown; charset=utf-8"
      : "application/json; charset=utf-8";
  const markdownUrl = `${rendered.metadata.canonicalUrl}.md`;
  const jsonUrl = new URL(
    `/api/v1/public/articles/${article.publicSlug}`,
    input.dependencies.canonicalOrigin,
  ).toString();
  const contentLocation = input.format === "html"
    ? rendered.metadata.canonicalUrl
    : input.format === "markdown"
      ? markdownUrl
      : jsonUrl;
  return responseV1(formatBody, 200, contentType, {
    ...publicHeadersV1(),
    ...(input.format === "html" ? {} : { "X-Robots-Tag": "noindex" }),
    ETag: etag,
    "Content-Location": contentLocation,
    Link: [
      `<${rendered.metadata.canonicalUrl}>; rel="canonical"`,
      `<${markdownUrl}>; rel="alternate"; type="text/markdown"`,
      `<${jsonUrl}>; rel="alternate"; type="application/json"`,
    ].join(", "),
  }, input.request.method);
}

async function listAllPublicArticlesV1(
  source: StudioPublicContentDataSourceV1,
): Promise<readonly StudioPublicArticleSummaryV1[]> {
  const result: StudioPublicArticleSummaryV1[] = [];
  let cursor = null;
  for (let pageIndex = 0; pageIndex < 100; pageIndex += 1) {
    const page = await source.listPublicArticles({ limit: 100, cursor });
    result.push(...page.items);
    if (page.nextCursor === null) return Object.freeze(result);
    cursor = page.nextCursor;
  }
  throw new Error("Public Article sitemap exceeded 10,000 entries");
}

function articleDirectoryBodyV1(
  articles: readonly StudioPublicArticleSummaryV1[],
  locale: "ja" | "en",
): string {
  const heading = locale === "ja" ? "記事" : "Articles";
  const empty = locale === "ja"
    ? "公開中の記事はまだありません。"
    : "No public articles yet.";
  const cards = articles.length === 0
    ? `<p>${empty}</p>`
    : articles.map((article) => {
        const href = `/${locale}/articles/${encodeURIComponent(article.publicSlug)}`;
        const excerpt = article.excerpt === null
          ? ""
          : `<p>${escapeHtmlTextV1(article.excerpt)}</p>`;
        return `<li><a href="${href}"><h2>${escapeHtmlTextV1(article.title)}</h2>${excerpt}<time datetime="${escapeHtmlAttributeV1(article.publishedAt)}">${escapeHtmlTextV1(article.publishedAt.slice(0, 10))}</time></a></li>`;
      }).join("\n");
  return `<main class="public-static-shell"><section class="public-static-directory"><header><p class="public-static-kicker">CircleHeart</p><h1>${heading}</h1></header>${articles.length === 0 ? cards : `<ul>${cards}</ul>`}</section></main>`;
}

function sitemapXmlV1(
  articles: readonly StudioPublicArticleSummaryV1[],
  canonicalOrigin: string,
): string {
  const urls = articles.map((article) => {
    const location = new URL(
      `/${article.locale}/articles/${article.publicSlug}`,
      canonicalOrigin,
    ).toString();
    return `  <url><loc>${escapeXmlV1(location)}</loc><lastmod>${escapeXmlV1(article.publishedAt)}</lastmod></url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

function robotsTextV1(canonicalOrigin: string): string {
  return [
    "User-agent: *",
    "Allow: /ja/articles/",
    "Allow: /en/articles/",
    "Disallow: /ja/me/",
    "Disallow: /en/me/",
    "Disallow: /ja/dev/",
    "Disallow: /en/dev/",
    "Disallow: /ja/experiments/new",
    "Disallow: /en/experiments/new",
    `Sitemap: ${new URL("/sitemap.xml", canonicalOrigin).toString()}`,
    "",
  ].join("\n");
}

function notFoundResponseV1(
  request: Request,
  dependencies: StudioPublicContentHandlerDependenciesV1,
): Response {
  const documentHtml = injectStudioPublicDocumentV1({
    additionalHeadHtml: `<meta name="robots" content="noindex" />`,
    bodyHtml: `<main class="public-static-shell"><section class="public-static-message"><p class="public-static-kicker">404</p><h1>Page not found</h1><p>The requested public content does not exist.</p><a href="/">CircleHeart</a></section></main>`,
    canonicalUrl: new URL("/404", dependencies.canonicalOrigin).toString(),
    clientTemplate: dependencies.clientTemplate,
    description: "The requested public content does not exist.",
    language: "en",
    title: "Page not found | CircleHeart",
  });
  return responseV1(
    documentHtml,
    404,
    "text/html; charset=utf-8",
    { "Cache-Control": "public, max-age=0, s-maxage=60" },
    request.method,
  );
}

function responseV1(
  body: string,
  status: number,
  contentType: string,
  headers: Readonly<Record<string, string>>,
  requestMethod: string,
): Response {
  return new Response(requestMethod === "HEAD" ? null : body, {
    status,
    headers: secureHeadersV1({
      "Content-Type": contentType,
      ...headers,
    }),
  });
}

function publicHeadersV1(): Record<string, string> {
  return { "Cache-Control": PUBLIC_CACHE_V1 };
}

function secureHeadersV1(
  headers: Readonly<Record<string, string>>,
): Headers {
  return new Headers({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...headers,
  });
}

function decodedRouteKeyV1(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function escapeHtmlTextV1(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlAttributeV1(value: string): string {
  return escapeHtmlTextV1(value).replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXmlV1(value: string): string {
  return escapeHtmlAttributeV1(value);
}
