import { renderCourseBootstrapV1 } from "../studio/application/course/StudioCourseBootstrapV1";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  courseFixtureV1 as course,
  courseArticleFixtureV1,
} from "../__tests__/fixtures/courseFixtureV1";
import type { CourseDraftV1 } from "../studio/application/course/StudioCourseV1";

const supabaseUrl = "https://public-content.test";
const bundle = JSON.parse(
  readFileSync(
    new URL("../data/model-releases/standard73/bundle.json", import.meta.url),
    "utf8",
  ),
);
const artifact = readFileSync(
  new URL(
    "../data/model-releases/standard73/artifact.mjs.txt",
    import.meta.url,
  ),
  "utf8",
);

test.beforeEach(async ({ context }) => {
  // Only registry metadata is mocked: the Worker executes the committed artifact.
  // No request from this suite may fall through to a production content service.
  await context.route(`${supabaseUrl}/**`, async (route) => {
    const url = new URL(route.request().url());
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/rpc/get_model_release_v2")
      return route.fulfill({
        headers,
        json: [
          {
            model_id: bundle.manifest.modelId,
            artifact_revision_id: bundle.artifactRevisionId,
            artifact_path: "test-artifacts/current.mjs",
            module_abi: "circleheart-exact-model-esm-v1",
            manifest: bundle.manifest,
            default_fixture: bundle.baseline.capture.fixture,
            stage: "stable",
          },
        ],
      });
    if (url.pathname === "/rest/v1/rpc/get_model_surface_release_v1")
      return route.fulfill({
        headers,
        json: [{ manifest: bundle.surface, stage: "stable" }],
      });
    if (url.pathname === "/storage/v1/object/public/test-artifacts/current.mjs")
      return route.fulfill({
        headers,
        contentType: "text/javascript",
        body: artifact,
      });
    return route.abort();
  });
});

async function signInFixture(page: Page) {
  const user = {
    id: course.ownerId,
    aud: "authenticated",
    role: "authenticated",
    email: "course@example.test",
    is_anonymous: false,
    user_metadata: { full_name: "Course editor" },
    app_metadata: {},
    created_at: "2026-09-13T00:00:00Z",
  };
  await page.route("**/auth/v1/user", (r) => r.fulfill({ json: user }));
  await page.addInitScript(
    ({ user, url }) => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const jwt = `${btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${btoa(JSON.stringify({ sub: user.id, exp, aud: "authenticated", role: "authenticated" }))}.fixture`;
      localStorage.setItem(
        `sb-${new URL(url).hostname.split(".")[0]}-auth-token`,
        JSON.stringify({
          access_token: jwt,
          refresh_token: "fixture-refresh",
          token_type: "bearer",
          expires_at: exp,
          expires_in: 3600,
          user,
        }),
      );
    },
    { user, url: supabaseUrl },
  );
}
async function publicFixtures(page: Page) {
  await page.route("**/rest/v1/rpc/list_courses_v1", (r) =>
    r.fulfill({ json: [course] }),
  );
  await page.route("**/rest/v1/rpc/read_public_course_v1", (r) =>
    r.fulfill({ json: course }),
  );
  await page.route("**/rest/v1/rpc/read_public_article_route_v1", (r) => {
    const key = r.request().postDataJSON().p_article_route_key;
    const index = course.entries.findIndex(
      (e) => e.articleId === key || e.publicSlug === key,
    );
    return r.fulfill({
      json:
        index >= 0 && course.entries[index].available
          ? courseArticleFixtureV1(index)
          : null,
    });
  });
}
test("@desktop @mobile @webkit public course navigation, direct reload and unavailable chapters", async ({
  page,
}) => {
  await publicFixtures(page);
  await page.goto(`/ja/courses/${course.courseId}`);
  const reader = page.getByTestId("course-reader");
  await expect(
    reader.getByRole("heading", { name: course.title }),
  ).toBeVisible();
  await expect(reader).toContainText("この記事は現在公開されていません");
  await expect(reader).toContainText("Author A");
  await expect(reader).toContainText("Author B");
  await reader.getByRole("link", { name: "一拍を読む", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`read-a-beat\\?course=${course.courseId}`),
  );
  const navigation = page
    .getByRole("navigation", { name: "コースのナビゲーション" })
    .first();
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "循環をつなぐ →" }).click();
  await expect(
    page.getByRole("heading", { name: "循環をつなぐ", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("navigation", { name: "コースのナビゲーション" })
      .first()
      .getByRole("link", { name: "← 一拍を読む" }),
  ).toBeVisible();
  await expect(page.locator(".article-document")).not.toContainText("null");
  expect(
    await page
      .locator(".article-document")
      .evaluate((e) => e.scrollWidth > e.clientWidth + 1),
  ).toBe(false);
  await page.goto("/ja/articles/read-a-beat");
  await expect(
    page.getByRole("complementary", { name: "この記事を含むコース" }),
  ).toContainText(course.title);
});

test("@desktop @mobile Course editor saves and publishes separately; New never overwrites the previous course", async ({
  page,
}) => {
  await signInFixture(page);
  await publicFixtures(page);
  let draft: CourseDraftV1 = {
    courseId: course.courseId,
    version: 1,
    published: true,
    updatedAt: course.updatedAt,
    content: {
      title: course.title,
      description: course.description,
      audience: course.audience,
      locale: "ja",
      articleIds: [course.entries[0].articleId, course.entries[2].articleId],
    },
  };
  const saves: Record<string, unknown>[] = [];
  let publishes = 0;
  await page.route("**/rest/v1/rpc/read_my_course_v1", (r) =>
    r.fulfill({ json: draft }),
  );
  await page.route("**/rest/v1/rpc/save_course_v1", (r) => {
    const p = r.request().postDataJSON();
    saves.push(p);
    draft = {
      ...draft,
      courseId: p.p_course_id ?? "a0000000-0000-4000-8000-000000000099",
      version: p.p_expected_version === null ? 0 : p.p_expected_version + 1,
      content: p.p_content,
      published: p.p_course_id !== null,
    };
    return r.fulfill({ json: draft });
  });
  await page.route("**/rest/v1/rpc/publish_course_v1", (r) => {
    publishes++;
    draft = { ...draft, version: draft.version + 1, published: true };
    return r.fulfill({ json: draft });
  });
  await page.goto(`/ja/courses/${course.courseId}/edit`);
  await page.getByLabel("タイトル", { exact: true }).fill("編集中のコース");
  await page.getByRole("button", { name: "下へ", exact: true }).first().click();
  await page.getByRole("button", { name: "下書きを保存", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("下書きを保存しました");
  expect(publishes).toBe(0);
  expect((saves[0].p_content as { articleIds: string[] }).articleIds[0]).toBe(
    course.entries[2].articleId,
  );
  await page
    .getByRole("button", { name: "保存した内容を公開", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("公開しました");
  expect(publishes).toBe(1);
  // The actual shared menu keeps the same page component mounted across this route change.
  await page.getByTestId("site-create-trigger-v3").click();
  await page.getByRole("menuitem", { name: /新しいコース/ }).click();
  await expect(page.getByLabel("タイトル", { exact: true })).toHaveValue("");
  await page
    .getByLabel("タイトル", { exact: true })
    .fill("新しい独立したコース");
  await page
    .getByLabel("追加する公開記事のURL")
    .fill("https://www.circleheart.dev/ja/articles/read-a-beat");
  await page.getByRole("button", { name: "記事を追加", exact: true }).click();
  await page.getByRole("button", { name: "下書きを保存", exact: true }).click();
  await expect(page).toHaveURL(/000000000099\/edit$/);
  expect(saves[1].p_course_id).toBeNull();
  expect(saves[1].p_expected_version).toBeNull();
});

for (const operation of ["save", "delete"] as const)
  test(`@desktop @mobile @webkit Completed ${operation} from a retired Course editor preserves the new editor`, async ({
    page,
  }) => {
    await signInFixture(page);
    await publicFixtures(page);
    const first: CourseDraftV1 = {
      courseId: course.courseId,
      version: 0,
      published: false,
      updatedAt: course.updatedAt,
      content: {
        title: "最初のコース",
        description: "",
        audience: "",
        locale: "ja",
        articleIds: [],
      },
    };
    await page.route("**/rest/v1/rpc/read_my_course_v1", (r) =>
      r.fulfill({ json: first }),
    );
    await page.route("**/rest/v1/rpc/list_courses_v1", (r) =>
      r.fulfill({ json: [] }),
    );
    let release!: () => void;
    const delayed = new Promise<void>((resolve) => {
      release = resolve;
    });
    const endpoint = `**/rest/v1/rpc/${operation}_course_v1`;
    await page.route(endpoint, async (r) => {
      await delayed;
      await r.fulfill({
        json:
          operation === "save"
            ? first
            : { courseId: first.courseId, deleted: true },
      });
    });
    await page.goto(
      operation === "save"
        ? "/ja/courses/new"
        : `/ja/courses/${first.courseId}/edit`,
    );
    await expect(page.getByLabel("タイトル", { exact: true })).toBeVisible();
    if (operation === "save")
      await page
        .getByLabel("タイトル", { exact: true })
        .fill(first.content.title);
    else page.once("dialog", (dialog) => dialog.accept());
    const requested = page.waitForRequest(endpoint);
    await page
      .getByRole("button", {
        name: operation === "save" ? "下書きを保存" : "コースを削除",
        exact: true,
      })
      .click();
    await requested;
    await page
      .getByRole("link", { name: "← 自分のコース", exact: true })
      .click();
    await page.getByRole("link", { name: "コースを作成", exact: true }).click();
    await page
      .getByLabel("タイトル", { exact: true })
      .fill("入力を続けている新しいコース");
    const response = page.waitForResponse(endpoint);
    release();
    await (await response).finished();
    // Let fetch completion and React navigation commit before checking the new editor.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page).toHaveURL(/\/ja\/courses\/new$/);
    await expect(page.getByLabel("タイトル", { exact: true })).toHaveValue(
      "入力を続けている新しいコース",
    );
  });

for (const signedIn of [false, true])
  test(`@desktop ${signedIn ? "owner" : "guest"} public Snapshot opens detached Workbench at1x with its public title`, async ({
    page,
  }) => {
    if (signedIn) await signInFixture(page);
    const baseline = JSON.parse(
      readFileSync(
        new URL(
          "../data/model-baselines/standard73-baseline-v1.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const snapshot = {
      schemaId: "circleheart-studio-experiment-snapshot-v2",
      snapshotId: "a0000000-0000-4000-8000-000000000030",
      createdAt: "2026-09-13T00:00:00.000Z",
      surfaceReleaseId: baseline.surfaceReleaseId,
      content: {
        modelId: baseline.modelId,
        surfaceSeriesId:
          "circleheart.main-wire.surface.static-anatomy.workbench",
        scenarios: [
          {
            scenarioId: "baseline",
            label: "基準状態",
            capture: baseline.capture,
          },
        ],
        surface: {
          graphPanes: [
            {
              paneId: "wave",
              role: "graph",
              label: "左室圧",
              order: 0,
              priority: 1,
              graphId: "hemodynamics.pressure.waveform.comprehensive-v1",
              scenarioScope: { mode: "visible-scenarios" },
              excludedTraces: [],
              windowSec: 2,
              series: [{ seriesId: "LVP", label: "LVP", order: 0 }],
            },
          ],
          outputPanes: [],
          controlPanes: [],
          note: { text: "" },
        },
      },
    };
    let saves = 0;
    await page.route("**/rest/v1/rpc/read_experiment_snapshot_v1", (r) =>
      r.fulfill({ json: snapshot }),
    );
    await page.route("**/rest/v1/rpc/read_public_snapshot_title_v1", (r) =>
      r.fulfill({ json: "一拍を読む：PV・圧・流量の対応" }),
    );
    await page.route("**/rest/v1/rpc/save_experiment_v1", (r) => {
      saves++;
      return r.abort();
    });
    await page.goto(`/ja/snapshots/${snapshot.snapshotId}`);
    await expect(page.getByTestId("v3-dockview-workbench")).toBeVisible();
    const title = page.getByTestId("workbench-experiment-title-v3");
    await expect(title).toHaveValue("一拍を読む：PV・圧・流量の対応");
    await expect(page.getByTestId("v3-playback-rate-trigger")).toHaveText("1×");
    const canvas = page.locator("canvas").first();
    const initial = await canvas.evaluate((e: HTMLCanvasElement) =>
      e.toDataURL(),
    );
    await expect
      .poll(() => canvas.evaluate((e: HTMLCanvasElement) => e.toDataURL()))
      .not.toBe(initial);
    await title.fill("自分の探索");
    await title.press("Enter");
    expect(saves).toBe(0);
    await page.reload();
    await expect(title).toHaveValue("一拍を読む：PV・圧・流量の対応");
    expect(saves).toBe(0);
  });

test("@desktop server Course navigation survives a failed client refresh", async ({
  page,
}) => {
  await publicFixtures(page);
  await page.route("**/rest/v1/rpc/read_public_course_v1", (route) =>
    route.abort(),
  );
  await page.route("**/ja/articles/read-a-beat?course=*", async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      "</body>",
      `${renderCourseBootstrapV1(course)}</body>`,
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto(`/ja/articles/read-a-beat?course=${course.courseId}`);
  await expect(
    page.getByRole("heading", { name: "一拍を読む", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "コースのナビゲーション" })
      .first()
      .getByRole("link", { name: "循環をつなぐ →" }),
  ).toBeVisible();
});
