import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  completePublicStaticContentHandoffV1,
} from "@/components/site/PublicStaticContentHandoffV1";
import {
  renderStudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublicArticleRendererV1";
import {
  formatStudioPublicArticleDateV1,
} from "@/studio/application/publication/StudioPublicArticlePresentationV1";
import {
  readStudioPublicArticleBootstrapV1,
  renderStudioPublicArticleBootstrapV1,
  STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID,
} from "@/studio/application/publication/StudioPublicArticleBootstrapV1";
import {
  readStudioPublicHomeBootstrapV1,
  renderStudioPublicHomeBootstrapV1,
  STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_ELEMENT_ID,
  STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_SCHEMA_ID,
  validateStudioPublicHomeBootstrapV1,
} from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import {
  STUDIO_PUBLISHED_ARTICLE_V1_SCHEMA_ID,
  type StudioPublishedArticleV1,
  validateStudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublishedArticleV1";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import {
  handleStudioPublicContentRequestV1,
} from "@/server/StudioPublicContentHandlerV1";
import type {
  StudioPublicContentDataSourceV1,
} from "@/server/StudioPublicContentDataSourceV1";
import {
  readStudioPublicContentServerConfigurationV1,
} from "@/server/StudioPublicContentDataSourceV1";

const TEMPLATE_V1 = `<!doctype html><html lang="en"><head><title>CircleHeart</title></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>`;

describe("Studio public content delivery V1", () => {
  it("keeps the render tier on anonymous publishable authority", () => {
    expect(readStudioPublicContentServerConfigurationV1({
      CIRCLEHEART_SUPABASE_URL: "https://example.supabase.co",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      CIRCLEHEART_CANONICAL_ORIGIN: "https://www.circleheart.dev",
    })).toEqual({
      canonicalOrigin: "https://www.circleheart.dev",
      publishableKey: "sb_publishable_example",
      supabaseUrl: "https://example.supabase.co",
    });
    expect(() => readStudioPublicContentServerConfigurationV1({
      CIRCLEHEART_SUPABASE_URL: "https://example.supabase.co",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: `sb_${"secret"}_forbidden`,
    })).toThrow(/only a publishable key/);
  });

  it("routes the bare origin through locale negotiation at the SSR boundary", () => {
    const firebase = JSON.parse(readFileSync(
      new URL("../firebase.json", import.meta.url),
      "utf8",
    )) as Readonly<{
      hosting: Readonly<{
        headers: readonly Readonly<{ source: string }>[];
        rewrites: readonly Readonly<{
          source: string;
          destination?: string;
          run?: Readonly<{ serviceId: string; region: string }>;
        }>[];
      }>;
    }>;
    const rootRewriteIndex = firebase.hosting.rewrites.findIndex(
      ({ source }) => source === "/",
    );
    const catchAllIndex = firebase.hosting.rewrites.findIndex(
      ({ source }) => source === "**",
    );

    expect(rootRewriteIndex).toBeGreaterThanOrEqual(0);
    expect(rootRewriteIndex).toBeLessThan(catchAllIndex);
    expect(firebase.hosting.rewrites[rootRewriteIndex]).toMatchObject({
      source: "/",
      run: {
        serviceId: "circleheart-public-content",
        region: "asia-northeast1",
      },
    });
    expect(firebase.hosting.headers.some(({ source }) => source === "/"))
      .toBe(false);
  });

  it("negotiates the bare origin without loading public catalog data", async () => {
    let dataSourceCalls = 0;
    const dependencies = dependenciesV1();
    const rootDependencies = Object.freeze({
      ...dependencies,
      dataSource: Object.freeze({
        readPublishedArticle: async () => {
          dataSourceCalls += 1;
          return null;
        },
        listPublicArticles: async () => {
          dataSourceCalls += 1;
          return Object.freeze({ items: Object.freeze([]), nextCursor: null });
        },
        listPublicExperiments: async () => {
          dataSourceCalls += 1;
          return Object.freeze({ items: Object.freeze([]), nextCursor: null });
        },
      }),
    });
    const savedPreference = await handleStudioPublicContentRequestV1(
      requestV1("/?utm_source=shared", {
        Cookie: "session=opaque; circleheart.locale=en",
        "Accept-Language": "ja-JP,ja;q=0.9",
      }),
      rootDependencies,
    );
    expect(savedPreference.status).toBe(302);
    expect(savedPreference.headers.get("location")).toBe(
      "https://www.circleheart.dev/en?utm_source=shared",
    );
    expect(savedPreference.headers.get("cache-control")).toBe(
      "private, no-store",
    );
    expect(savedPreference.headers.get("vary")).toBe(
      "Cookie, Accept-Language",
    );

    const weightedLanguage = await handleStudioPublicContentRequestV1(
      requestV1("/", {
        Cookie: "circleheart.locale=unsupported",
        "Accept-Language": "fr-FR, en-US;q=0.7, ja-JP;q=0.9",
      }),
      rootDependencies,
    );
    expect(weightedLanguage.headers.get("location")).toBe(
      "https://www.circleheart.dev/ja",
    );

    const englishBrowser = await handleStudioPublicContentRequestV1(
      requestV1("/", { "Accept-Language": "en-GB,en;q=0.8" }),
      rootDependencies,
    );
    expect(englishBrowser.headers.get("location")).toBe(
      "https://www.circleheart.dev/en",
    );

    const fallback = await handleStudioPublicContentRequestV1(
      requestV1("/", { "Accept-Language": "fr-FR,*;q=0.8" }),
      rootDependencies,
    );
    expect(fallback.headers.get("location")).toBe(
      "https://www.circleheart.dev/ja",
    );
    expect(dataSourceCalls).toBe(0);
  });

  it("renders every public block as semantic HTML and Markdown", () => {
    const rendered = renderStudioPublishedArticleV1({
      article: publishedArticleV1(),
      canonicalOrigin: "https://www.circleheart.dev",
      clientTemplate: TEMPLATE_V1,
    });

    expect(rendered.documentHtml).toContain(
      '<h1 class="article-title">血圧を考える</h1>',
    );
    expect(rendered.documentHtml).toContain('<div id="public-static-root">');
    expect(rendered.documentHtml).toContain('<div id="root" hidden></div>');
    expect(rendered.documentHtml).toContain('class="public-static-site-header"');
    expect(rendered.documentHtml).toContain('class="article-title"');
    expect(rendered.documentHtml).toContain('class="article-paragraph"');
    expect(rendered.documentHtml).toContain(
      `id="${STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID}"`,
    );
    expect(rendered.documentHtml).toContain("血圧は何で決まるでしょうか");
    expect(rendered.documentHtml).not.toContain("article-publication-kicker");
    expect(rendered.documentHtml).toContain("katex-mathml");
    expect(rendered.documentHtml).toContain("<details class=\"article-accordion public-static-accordion\"");
    expect(rendered.documentHtml).toContain("<strong>正解:</strong> 心拍出量と血管抵抗");
    expect(rendered.documentHtml).toContain("インタラクティブ・シミュレーション");
    expect(rendered.documentHtml).toContain("平均動脈圧");
    expect(rendered.documentHtml).toContain("public-static-experiment-inflow");
    const semanticMarkup = rendered.documentHtml.slice(
      0,
      rendered.documentHtml.indexOf(
        `<script id="${STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID}"`,
      ),
    );
    expect(semanticMarkup).not.toContain("pane/internal-pressure");
    expect(rendered.documentHtml).toContain(
      `<link rel="canonical" href="https://www.circleheart.dev/ja/articles/what-determines-blood-pressure" />`,
    );
    expect(rendered.documentHtml).toContain("application/ld+json");
    expect(rendered.documentHtml).toContain("type=\"text/markdown\"");
    expect(rendered.markdown).toContain("# 血圧を考える");
    expect(rendered.markdown).toContain("**正解:** 心拍出量と血管抵抗");
    expect(rendered.markdown).toContain("## インタラクティブ・シミュレーション");
    expect(JSON.parse(rendered.json)).toMatchObject({
      articleContentId: "22222222-2222-4222-8222-222222222222",
      publicSlug: "what-determines-blood-pressure",
    });
  });

  it("keeps a complex server-rendered experiment as compact as its Peek handoff", () => {
    const article = publishedArticleV1();
    const withComplexBriefing = validateStudioPublishedArticleV1({
      ...article,
      blocks: article.blocks.map((block) => {
        if (block.kind !== "experiment") return block;
        const firstGraph = block.placement.briefing.graphs[0]!;
        return {
          ...block,
          placement: {
            ...block.placement,
            briefing: {
              ...block.placement.briefing,
              graphs: [
                firstGraph,
                { ...firstGraph, paneId: "pane/second-pressure", order: 1 },
              ],
            },
          },
        };
      }),
    });
    const rendered = renderStudioPublishedArticleV1({
      article: withComplexBriefing,
      canonicalOrigin: "https://www.circleheart.dev",
      clientTemplate: TEMPLATE_V1,
    });

    expect(rendered.documentHtml).toContain(
      "article-reader-peek-surface public-static-experiment public-static-experiment-peek",
    );
    expect(rendered.documentHtml).toContain(
      'data-reader-presentation="peek"',
    );
    expect(rendered.documentHtml).toContain(
      'class="public-static-experiment-anchor-copy"',
    );
  });

  it("hands the validated public projection to the matching client route", () => {
    const article = publishedArticleV1();
    const script = renderStudioPublicArticleBootstrapV1(article);
    const json = script.slice(script.indexOf(">") + 1, script.lastIndexOf("<"));
    const documentLike = {
      getElementById: (id: string) => id === STUDIO_PUBLIC_ARTICLE_BOOTSTRAP_V1_ELEMENT_ID
        ? { textContent: json }
        : null,
    } as Pick<Document, "getElementById">;

    expect(readStudioPublicArticleBootstrapV1(article.publicSlug, documentLike))
      .toEqual(article);
    expect(readStudioPublicArticleBootstrapV1(article.articleId, documentLike))
      .toEqual(article);
    expect(readStudioPublicArticleBootstrapV1("another-article", documentLike))
      .toBeNull();
    expect(readStudioPublicArticleBootstrapV1(article.publicSlug, {
      getElementById: () => ({ textContent: "{not-json" }),
    } as unknown as Pick<Document, "getElementById">)).toBeNull();

    const authoredClosingTag = validateStudioPublishedArticleV1({
      ...article,
      title: "</script><script>alert('not executable')</script>",
    });
    const escapedScript = renderStudioPublicArticleBootstrapV1(
      authoredClosingTag,
    );
    const escapedJson = escapedScript.slice(
      escapedScript.indexOf(">") + 1,
      escapedScript.lastIndexOf("<"),
    );
    expect(escapedJson).not.toContain("<");
    expect(JSON.parse(escapedJson)).toMatchObject({
      title: authoredClosingTag.title,
    });
  });

  it("preserves reading position when the interactive Reader takes over", () => {
    const scrollHost = { scrollTop: 0 };
    const clientRoot = {
      hidden: true,
      querySelector: () => scrollHost,
    };
    let staticRemoved = false;
    const staticRoot = { remove: () => { staticRemoved = true; } };
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        getElementById: (id: string) => id === "root"
          ? clientRoot
          : id === "public-static-root" ? staticRoot : null,
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        requestAnimationFrame: (callback: FrameRequestCallback) => {
          callback(0);
          return 1;
        },
        scrollY: 420,
      },
    });

    try {
      completePublicStaticContentHandoffV1();
      expect(clientRoot.hidden).toBe(false);
      expect(staticRemoved).toBe(true);
      expect(scrollHost.scrollTop).toBe(420);
    } finally {
      Reflect.deleteProperty(globalThis, "document");
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("serves a semantic localized Home with one validated client bootstrap", async () => {
    const response = await handleStudioPublicContentRequestV1(
      requestV1("/ja"),
      dependenciesV1(),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toMatch(
      /^"home-ja-html-v1-[0-9a-f]{64}"$/,
    );
    expect(html).toContain("循環動態を、動かして学ぶ。");
    expect(html).toContain("血圧を考える");
    expect(html).toContain("公開シミュレーション");
    expect(html).toContain(
      "/ja/articles/what-determines-blood-pressure",
    );
    expect(html).toContain(
      "/ja/snapshots/44444444-4444-4444-8444-444444444444",
    );
    expect(html).toContain(`id="${STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_ELEMENT_ID}"`);
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('hreflang="ja"');
    expect(html).toContain('hreflang="en"');
    expect(html).toContain(
      'hreflang="x-default" href="https://www.circleheart.dev/"',
    );
    expect(html).toContain('<div id="root" hidden></div>');
    expect(html.indexOf("</main>")).toBeLessThan(html.indexOf("<footer"));

    const etag = response.headers.get("etag") ?? "";
    const cached = await handleStudioPublicContentRequestV1(
      requestV1("/ja", { "If-None-Match": etag }),
      dependenciesV1(),
    );
    expect(cached.status).toBe(304);
    expect(await cached.text()).toBe("");

    const weakListMatch = await handleStudioPublicContentRequestV1(
      requestV1("/ja", {
        "If-None-Match": `"unrelated", W/${etag}`,
      }),
      dependenciesV1(),
    );
    expect(weakListMatch.status).toBe(304);

    const anyRepresentation = await handleStudioPublicContentRequestV1(
      requestV1("/ja", { "If-None-Match": "*" }),
      dependenciesV1(),
    );
    expect(anyRepresentation.status).toBe(304);
  });

  it("keeps public dates stable across server and browser time zones", () => {
    expect(formatStudioPublicArticleDateV1(
      "2026-08-13T23:30:00.000Z",
      "ja",
    )).toBe("2026/08/13");
    expect(formatStudioPublicArticleDateV1(
      "2026-08-13T23:30:00.000Z",
      "en",
    )).toBe("Aug 13, 2026");
  });

  it("rejects stale-locale or executable Home bootstrap content", () => {
    const bootstrap = validateStudioPublicHomeBootstrapV1({
      schemaId: STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_SCHEMA_ID,
      locale: "ja",
      articles: [{
        articleId: "article/home",
        locale: "ja",
        title: "</script><script>alert('inert')</script>",
        excerpt: null,
        publicSlug: "home-article",
        publishedAt: "2026-08-13T00:00:00.000Z",
      }],
      experiments: [],
    });
    const script = renderStudioPublicHomeBootstrapV1(bootstrap);
    const json = script.slice(script.indexOf(">") + 1, script.lastIndexOf("<"));
    expect(json).not.toContain("<");
    const documentLike = {
      getElementById: (id: string) => id === STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_ELEMENT_ID
        ? { textContent: json }
        : null,
    } as Pick<Document, "getElementById">;
    expect(readStudioPublicHomeBootstrapV1("ja", documentLike)).toEqual(bootstrap);
    expect(readStudioPublicHomeBootstrapV1("en", documentLike)).toBeNull();
  });

  it("rejects extra public projection fields before rendering", () => {
    expect(() => validateStudioPublishedArticleV1({
      ...publishedArticleV1(),
      ownerId: "should-not-cross-public-boundary",
    })).toThrow(/keys must be exactly/);
    expect(() => validateStudioPublishedArticleV1({
      ...publishedArticleV1(),
      publicSlug: "11111111-1111-4111-8111-111111111111",
    })).toThrow(/canonical public slug/);
  });

  it("serves canonical HTML, Markdown and JSON with one immutable ETag", async () => {
    const dependencies = dependenciesV1();
    const html = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure"),
      dependencies,
    );
    expect(html.status).toBe(200);
    expect(html.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(html.headers.get("etag")).toMatch(
      /^"article-22222222-2222-4222-8222-222222222222-html-v1-[0-9a-f]{64}"$/,
    );
    expect(html.headers.get("cache-control")).toContain("stale-while-revalidate");
    expect(await html.text()).toContain("血圧は何で決まるでしょうか");

    const markdown = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure.md"),
      dependencies,
    );
    expect(markdown.status).toBe(200);
    expect(markdown.headers.get("etag")).toContain(
      "22222222-2222-4222-8222-222222222222-markdown-v1-",
    );
    expect(await markdown.text()).toContain("# 血圧を考える");

    const json = await handleStudioPublicContentRequestV1(
      requestV1("/api/v1/public/articles/what-determines-blood-pressure"),
      dependencies,
    );
    expect(json.status).toBe(200);
    expect(json.headers.get("etag")).toContain(
      "22222222-2222-4222-8222-222222222222-json-v1-",
    );
    expect(await json.json()).toMatchObject({
      schemaId: STUDIO_PUBLISHED_ARTICLE_V1_SCHEMA_ID,
      articleContentId: "22222222-2222-4222-8222-222222222222",
    });
  });

  it("changes a strong ETag whenever publication bytes change", async () => {
    const originalArticle = publishedArticleV1();
    let currentArticle = originalArticle;
    const dependencies = {
      ...dependenciesV1(),
      dataSource: Object.freeze({
        readPublishedArticle: async () => currentArticle,
        listPublicArticles: async () => Object.freeze({
          items: Object.freeze([]),
          nextCursor: null,
        }),
        listPublicExperiments: async () => Object.freeze({
          items: Object.freeze([]),
          nextCursor: null,
        }),
      }),
    };
    const first = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure"),
      dependencies,
    );
    const firstEtag = first.headers.get("etag");
    expect(firstEtag).not.toBeNull();

    currentArticle = validateStudioPublishedArticleV1({
      ...originalArticle,
      updatedAt: "2026-08-12T02:00:00.000Z",
    });
    const republished = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure", {
        "If-None-Match": firstEtag ?? "",
      }),
      dependencies,
    );
    expect(republished.status).toBe(200);
    expect(republished.headers.get("etag")).not.toBe(firstEtag);
    expect(await republished.text()).toContain("2026-08-12T02:00:00.000Z");
  });

  it("redirects public UUID and wrong-locale aliases to the canonical slug", async () => {
    const dependencies = dependenciesV1();
    for (const pathname of [
      "/ja/articles/11111111-1111-4111-8111-111111111111",
      "/en/articles/what-determines-blood-pressure",
    ]) {
      const response = await handleStudioPublicContentRequestV1(
        requestV1(pathname),
        dependencies,
      );
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(
        "https://www.circleheart.dev/ja/articles/what-determines-blood-pressure",
      );
    }
  });

  it("returns real 404, 304 and HEAD responses without leaking a SPA 200", async () => {
    const dependencies = dependenciesV1();
    const missing = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/not-published"),
      dependencies,
    );
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("noindex");

    const initial = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure"),
      dependencies,
    );
    const cached = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure", {
        "If-None-Match": initial.headers.get("etag") ?? "",
      }),
      dependencies,
    );
    expect(cached.status).toBe(304);
    expect(await cached.text()).toBe("");

    const head = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles/what-determines-blood-pressure", {}, "HEAD"),
      dependencies,
    );
    expect(head.status).toBe(200);
    expect(head.headers.get("etag")).not.toBeNull();
    expect(await head.text()).toBe("");
  });

  it("publishes canonical discovery documents and a semantic Article index", async () => {
    const dependencies = dependenciesV1();
    const sitemap = await handleStudioPublicContentRequestV1(
      requestV1("/sitemap.xml"),
      dependencies,
    );
    const sitemapXml = await sitemap.text();
    expect(sitemapXml).toContain(
      "https://www.circleheart.dev/ja/articles/what-determines-blood-pressure",
    );
    expect(sitemapXml).toContain("https://www.circleheart.dev/ja");
    expect(sitemapXml).toContain("https://www.circleheart.dev/en/articles");

    const robots = await handleStudioPublicContentRequestV1(
      requestV1("/robots.txt"),
      dependencies,
    );
    expect(await robots.text()).toContain(
      "Sitemap: https://www.circleheart.dev/sitemap.xml",
    );

    const directory = await handleStudioPublicContentRequestV1(
      requestV1("/ja/articles"),
      dependencies,
    );
    const directoryHtml = await directory.text();
    expect(directory.status).toBe(200);
    expect(directoryHtml).toContain("血圧を考える");
    expect(directoryHtml).toContain(
      "/ja/articles/what-determines-blood-pressure",
    );
  });
});

function publishedArticleV1(): StudioPublishedArticleV1 {
  return validateStudioPublishedArticleV1({
    schemaId: STUDIO_PUBLISHED_ARTICLE_V1_SCHEMA_ID,
    articleId: "11111111-1111-4111-8111-111111111111",
    articleContentId: "22222222-2222-4222-8222-222222222222",
    publicSlug: "what-determines-blood-pressure",
    locale: "ja",
    title: "血圧を考える",
    publishedAt: "2026-08-12T00:00:00.000Z",
    updatedAt: "2026-08-12T01:00:00.000Z",
    blocks: [
      {
        blockId: "block/intro",
        kind: "paragraph",
        text: "血圧は何で決まるでしょうか。まず予測してみましょう。",
      },
      {
        blockId: "block/heading",
        kind: "heading",
        level: 2,
        text: "式で確認する",
      },
      {
        blockId: "block/equation",
        kind: "equation",
        expression: "MAP = CO \\times SVR",
      },
      {
        blockId: "block/image",
        kind: "image",
        url: "https://www.circleheart.dev/figure.png",
        altText: "血圧の模式図",
        caption: "図1",
      },
      { blockId: "block/divider", kind: "divider" },
      {
        blockId: "block/link",
        kind: "link",
        href: "/ja/articles/next-lesson",
        label: "次の記事",
        description: "出血を考えます",
      },
      {
        blockId: "block/quiz",
        kind: "quiz",
        question: "平均動脈圧を決める主な組み合わせは？",
        choices: [
          { choiceId: "choice/a", label: "心拍出量と血管抵抗" },
          { choiceId: "choice/b", label: "心拍数だけ" },
        ],
        correctChoiceId: "choice/a",
        explanation: "両方の積として考えると整理できます。",
      },
      {
        blockId: "block/accordion",
        kind: "accordion",
        title: "もう一歩",
        blocks: [{
          blockId: "block/accordion-text",
          kind: "paragraph",
          text: "後期研修医向けの補足です。",
        }],
      },
      {
        blockId: "block/experiment",
        kind: "experiment",
        placement: {
          schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
          placementId: "placement/bp",
          snapshotId: "33333333-3333-4333-8333-333333333333",
          titleOverride: null,
          caption: "血管抵抗を変えて観察します。",
          briefing: {
            defaultTitle: "血圧を動かす",
            scenarioScope: {
              visibleScenarioIds: ["scenario/baseline"],
              initialFocusScenarioId: "scenario/baseline",
            },
            graphs: [{
              paneId: "pane/internal-pressure",
              order: 0,
              emphasis: "primary",
            }],
            outputs: [{
              sourcePaneId: "pane/internal-output",
              outputId: "output/map",
              scenarioId: "scenario/baseline",
              label: "平均動脈圧",
              order: 0,
            }],
            controls: [{
              sourcePaneId: "pane/internal-control",
              controlId: "control/svr",
              label: "体血管抵抗",
              order: 0,
              presentation: { kind: "slider" },
              binding: {
                mode: "fixed",
                scenarioIds: ["scenario/baseline"],
                application: "absolute",
              },
            }],
          },
        },
      },
    ],
  });
}

function dependenciesV1() {
  const article = publishedArticleV1();
  const source: StudioPublicContentDataSourceV1 = Object.freeze({
    readPublishedArticle: async (routeKey: string) =>
      routeKey === article.publicSlug || routeKey === article.articleId
        ? article
        : null,
    listPublicArticles: async () => Object.freeze({
      items: Object.freeze([{
        articleId: article.articleId,
        locale: article.locale,
        title: article.title,
        excerpt: "血圧は何で決まるでしょうか。",
        publicSlug: article.publicSlug,
        publishedAt: article.publishedAt,
      }]),
      nextCursor: null,
    }),
    listPublicExperiments: async () => Object.freeze({
      items: Object.freeze([{
        experimentId: "experiment/public-simulation",
        title: "公開シミュレーション",
        publicSlug: "public-simulation",
        publishedAt: "2026-08-12T00:30:00.000Z",
        snapshotId: "44444444-4444-4444-8444-444444444444",
        modelId: "model/test",
        scenarioCount: 2,
      }]),
      nextCursor: null,
    }),
  });
  return Object.freeze({
    canonicalOrigin: "https://www.circleheart.dev",
    clientTemplate: TEMPLATE_V1,
    dataSource: source,
  });
}

function requestV1(
  pathname: string,
  headers: Readonly<Record<string, string>> = {},
  method = "GET",
): Request {
  return new Request(`https://www.circleheart.dev${pathname}`, {
    headers,
    method,
  });
}
