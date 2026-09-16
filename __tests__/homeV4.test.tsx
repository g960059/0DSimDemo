import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Home } from "@/components/Home";
import { HomePageV1 } from "@/components/home/HomePageV1";
import {
  homeItemsV1,
  selectHomeItemsV1,
  HOME_FILTER_V1,
  readHomeBookmarksV1,
  writeHomeBookmarksV1,
  readHomeIntroCollapsedV1,
  HOME_INTRO_COLLAPSED_KEY_V1,
} from "@/components/home/HomeDiscoveryV1";
import {
  validateStudioPublicHomeBootstrapV1,
  type StudioPublicHomeBootstrapV1,
} from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import { courseFixtureV1 } from "./fixtures/courseFixtureV1";
import { generateHeroDemoV1 } from "@/tools/home/generateHeroDemoV1";
import beats from "@/components/home/HomeHeroBeatsV1.json";
import "@/i18n";
const author = {
  userId: courseFixtureV1.ownerId,
  displayName: "CircleHeart",
  official: true,
};
const course = {
  ...courseFixtureV1,
  author,
  entries: courseFixtureV1.entries.map((e) =>
    e.available ? { ...e, author } : e,
  ),
};
const otherAuthor = {
  userId: "b0000000-0000-4000-8000-000000000001",
  displayName: "Community",
  official: false,
};
const bootstrap: StudioPublicHomeBootstrapV1 = {
  schemaId: "circleheart-public-home-bootstrap-v1",
  locale: "ja",
  courses: [course],
  featuredCourseIds: [course.courseId],
  articles: [
    {
      articleId: course.entries[0].articleId,
      title: "一拍を読む",
      locale: "ja",
      excerpt: "前負荷とPVループ",
      publicSlug: "read-a-beat",
      publishedAt: course.updatedAt,
      author,
    },
    {
      articleId: "community-article",
      title: "Community PV loop",
      locale: "ja",
      excerpt: null,
      publicSlug: "community-pv-loop",
      publishedAt: course.updatedAt,
      author: otherAuthor,
    },
  ],
  experiments: [],
};
describe("Home discovery", () => {
  it("keeps loading readable and limits the lightweight illustration to its own data", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ja"]}>
        <Home />
      </MemoryRouter>,
    );
    expect(html).toContain("公開コンテンツを読み込んでいます…");
    expect(html).not.toContain("条件に合うコンテンツはありません");
    expect(html).toContain("本体の計算結果ではありません");
    expect(html).toContain("数理モデル・プリセット");
  });
  it("groups only available same-author chapters in recommended All, preserving direct search and article tabs", () => {
    const items = homeItemsV1(bootstrap),
      chapter = items.find((i) => i.id === course.entries[0].articleId)!;
    expect(selectHomeItemsV1(items, HOME_FILTER_V1).map((i) => i.key)).toEqual([
      "course:" + course.courseId,
      "article:community-article",
    ]);
    expect(
      selectHomeItemsV1(items, { ...HOME_FILTER_V1, kind: "article" }),
    ).toContain(chapter);
    expect(
      selectHomeItemsV1(items, { ...HOME_FILTER_V1, query: "一拍" }),
    ).toContain(chapter);
    expect(
      selectHomeItemsV1(items, { ...HOME_FILTER_V1, sort: "new" }),
    ).toContain(chapter);
    expect(
      selectHomeItemsV1(
        items,
        { ...HOME_FILTER_V1, sort: "saved" },
        new Set([chapter.key]),
      ),
    ).toEqual([chapter]);
    const cross = homeItemsV1({
      ...bootstrap,
      courses: [
        {
          ...course,
          entries: course.entries.map((e) => ({
            ...e,
            author: e.available ? otherAuthor : undefined,
          })),
        },
      ],
    });
    expect(
      selectHomeItemsV1(cross, HOME_FILTER_V1).some(
        (i) => i.key === chapter.key,
      ),
    ).toBe(true);
  });
  it("keeps the canonical course/author distinction and escapes authored labels in SSR", () => {
    const html = renderToStaticMarkup(
      <HomePageV1
        locale="ja"
        data={{
          ...bootstrap,
          courses: [{ ...course, title: "<img src=x onerror=alert(1)>" }],
        }}
      />,
    );
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("Community");
    expect(html).toContain("home-card-wide");
    expect(html).toContain("?course=");
    expect(html).not.toContain("対象ユーザー");
  });
  it("validates course promotion references and HTTPS cover projection", () => {
    expect(
      validateStudioPublicHomeBootstrapV1(bootstrap).featuredCourseIds,
    ).toEqual([course.courseId]);
    expect(() =>
      validateStudioPublicHomeBootstrapV1({
        ...bootstrap,
        featuredCourseIds: ["missing"],
      }),
    ).toThrow();
    expect(() =>
      validateStudioPublicHomeBootstrapV1({
        ...bootstrap,
        articles: [
          { ...bootstrap.articles[0], thumbnailUrl: "javascript:alert(1)" },
        ],
      }),
    ).toThrow();
    expect(
      validateStudioPublicHomeBootstrapV1({
        ...bootstrap,
        articles: [
          {
            ...bootstrap.articles[0],
            thumbnailUrl: "https://example.org/figure.png",
          },
        ],
      }).articles[0].thumbnailUrl,
    ).toBe("https://example.org/figure.png");
  });
  it("isolates account saves and handles malformed or denied browser storage", () => {
    const store = new Map<string, string>(),
      storage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      };
    expect(writeHomeBookmarksV1("a", new Set(["article:one"]), storage)).toBe(
      true,
    );
    expect([...readHomeBookmarksV1("a", storage)]).toEqual(["article:one"]);
    expect(readHomeBookmarksV1("b", storage).size).toBe(0);
    expect(readHomeBookmarksV1(null, storage).size).toBe(0);
    expect(readHomeBookmarksV1("a", { getItem: () => "{bad" }).size).toBe(0);
    expect(
      writeHomeBookmarksV1("a", new Set(), {
        setItem: () => {
          throw Error("denied");
        },
      }),
    ).toBe(false);
  });
  it("ships exactly reproducible, finite cached illustration beats without an online solver", () => {
    expect(generateHeroDemoV1()).toEqual(beats);
    for (const beat of beats) {
      expect(beat.points).toHaveLength(100);
      expect(beat.points.flat().every(Number.isFinite)).toBe(true);
      expect(beat.points.every((p) => p[1] > 0 && p[2] >= 0)).toBe(true);
    }
    expect(beats[1].strokeVolume).toBeLessThan(beats[0].strokeVolume);
    expect(beats[2].strokeVolume).toBeLessThan(beats[0].strokeVolume);
    expect(beats[3].strokeVolume).toBeGreaterThan(beats[0].strokeVolume);
  });
  it("does not infer experience from a page visit, and respects an explicit introduction preference", () => {
    const storage = {
      getItem: (key: string) =>
        key === "circleheart.home.last-visit.v1" ? String(Date.now()) : null,
    };
    expect(readHomeIntroCollapsedV1(storage)).toBe(false);
    expect(
      readHomeIntroCollapsedV1({
        getItem: (key) => (key === HOME_INTRO_COLLAPSED_KEY_V1 ? "1" : null),
      }),
    ).toBe(true);
    expect(
      readHomeIntroCollapsedV1({
        getItem: () => {
          throw Error("denied");
        },
      }),
    ).toBe(false);
    const html = renderToStaticMarkup(
      <HomePageV1
        locale="ja"
        data={bootstrap}
        returning
        resume={{
          title: course.entries[0].title!,
          href: "/ja/articles/read-a-beat?course=test",
          courseId: course.courseId,
          articleId: course.entries[0].articleId,
          chapter: 1,
        }}
      />,
    );
    expect(html).toContain('<h1 class="sr-only">');
    expect(html).toContain('href="/ja/articles/read-a-beat?course=test"');
    expect(html).not.toContain("home-mini-demo");
  });
  it("offers sign-in in place and only shows Saved to signed-in accounts", () => {
    const anonymous = renderToStaticMarkup(
      <HomePageV1 locale="ja" data={bootstrap} loginPrompt />,
    );
    expect(anonymous).toContain("ログインすると保存できます");
    expect(anonymous).toContain('href="/ja/login"');
    expect(anonymous).not.toContain("保存済み");
    const signedIn = renderToStaticMarkup(
      <HomePageV1 locale="ja" data={bootstrap} signedIn />,
    );
    expect(signedIn).toContain("保存済み");
  });
  it("uses published chapter images as a course collage without inventing plot data", () => {
    const items = homeItemsV1({
      ...bootstrap,
      articles: [
        {
          ...bootstrap.articles[0],
          thumbnailUrl: "https://example.org/published-figure.png",
        },
      ],
    });
    expect(items.find((i) => i.kind === "course")?.chapterThumbnails).toEqual([
      "https://example.org/published-figure.png",
    ]);
    const html = renderToStaticMarkup(
      <HomePageV1
        locale="ja"
        data={bootstrap}
        filter={{ ...HOME_FILTER_V1, kind: "article" }}
      />,
    );
    expect(html.match(/Community PV loop/g)).toHaveLength(3); // Cover link label, heading, save label; no duplicate title inside the cover.
    expect(html).not.toContain("READ &amp; EXPLAIN");
  });
});
