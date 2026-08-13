import { describe, expect, it } from "vitest";

import {
  renderStudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublicArticleRendererV1";
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

  it("renders every public block as semantic HTML and Markdown", () => {
    const rendered = renderStudioPublishedArticleV1({
      article: publishedArticleV1(),
      canonicalOrigin: "https://www.circleheart.dev",
      clientTemplate: TEMPLATE_V1,
    });

    expect(rendered.documentHtml).toContain("<h1>血圧を考える</h1>");
    expect(rendered.documentHtml).toContain('<div id="public-static-root">');
    expect(rendered.documentHtml).toContain('<div id="root" hidden></div>');
    expect(rendered.documentHtml).toContain("血圧は何で決まるでしょうか");
    expect(rendered.documentHtml).toContain("katex-mathml");
    expect(rendered.documentHtml).toContain("<details class=\"public-static-accordion\"");
    expect(rendered.documentHtml).toContain("<strong>正解:</strong> 心拍出量と血管抵抗");
    expect(rendered.documentHtml).toContain("インタラクティブ・シミュレーション");
    expect(rendered.documentHtml).toContain("平均動脈圧");
    expect(rendered.documentHtml).not.toContain("pane/internal-pressure");
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
    expect(await sitemap.text()).toContain(
      "https://www.circleheart.dev/ja/articles/what-determines-blood-pressure",
    );

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
