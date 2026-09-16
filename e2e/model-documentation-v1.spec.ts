import { expect, test } from "@playwright/test";
import current from "../studio/presentation/modelDocumentation/packages/standard73-document-v2.index.json" with { type: "json" };
import { modelDocumentationHref } from "../homeLinks";

const guide = modelDocumentationHref({ locale: "ja", ...current.identity, documentId: current.documentId });
test.setTimeout(40_000);

const tags = "@desktop @mobile @webkit";

test(`model explanation is readable and navigable without JavaScript ${tags}`, async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport, baseURL: testInfo.project.use.baseURL as string });
  const page = await context.newPage();
  const response = await page.goto(guide);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Standard 73のしくみ" })).toBeVisible();
  await expect(page.locator(".katex-mathml").first()).toBeAttached();
  await expect(page.locator("#root")).toBeHidden();
  await expect(page.locator('[data-model-reading-body]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("model-guide-no-js.png"), fullPage: false });
  await page.getByRole("link", { name: "baseline・プリセット", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "baseline", exact: true })).toBeVisible();
  const fine = page.locator('[data-reader-record]').nth(1);
  await fine.click();
  await expect(page.locator('[data-reader-record][aria-current="page"]')).toContainText("1 ms");
  expect(new URL(page.url()).searchParams.get("record")).toBe("dt-0.001");
  await page.getByText("保存", { exact: true }).click();
  const archiveHref = await page.getByRole("link", { name: "文書一式（HTML）", exact: true }).getAttribute("href");
  const archiveResponse = await context.request.get(archiveHref!);
  expect(archiveResponse.status()).toBe(200);
  const archive = await archiveResponse.text();
  expect(archive).toContain(current.contentSha256);
  expect(archive).toContain('id="baseline-record-1"');
  expect(archive).not.toMatch(/<script|<select/);
  expect((await context.request.get(guide + "&record=missing")).status()).toBe(404);
  expect((await context.request.get(guide.replace(current.documentId, "missing"))).status()).toBe(404);
  await context.close();
});

test(`model reader reuses first-response prose and only fetches the selected record ${tags}`, async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto(guide);
  await expect(page.locator("#public-static-root")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Standard 73のしくみ" })).toBeVisible();
  expect(requests.filter(url => url.includes("/model-documents/"))).toHaveLength(0);
  expect(requests.some(url => /standard73-document-v2.*\.js/.test(url))).toBe(false);
  await page.getByRole("link", { name: "baseline・プリセット", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "baseline", exact: true })).toBeVisible();
  await expect(page.locator('[data-control-id]')).toHaveCount(53);
  await page.locator('[data-model-reading-body] details > summary').first().click();
  await page.locator('[data-reader-record]').nth(1).click();
  await expect(page.locator('[data-model-reading-body] details').first()).toHaveAttribute("open", "");
  await expect(page.locator('[data-reader-record][aria-current="page"]')).toContainText("1 ms");
  expect(requests.filter(url => url.includes("/model-documents/") && url.endsWith(".json"))).toHaveLength(2);
  expect(requests.some(url => /(?:archive\.html|measurements\.json|tables\.csv)$/.test(url))).toBe(false);
  // Clicking the selected record must not leave scroll restoration for a later page.
  await page.locator('[data-reader-record][aria-current="page"]').click();
  await page.getByRole("link", { name: "しくみ・数式", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Standard 73のしくみ" })).toBeInViewport();
  await page.getByRole("link", { name: "baseline・プリセット", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "baseline", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "すべて開く", exact: true }).click();
  expect(await page.locator('[data-model-reading-body] details:not([open])').count()).toBe(0);
  await page.getByRole("button", { name: "すべて閉じる", exact: true }).click();
  expect(await page.locator('[data-model-reading-body] details[open]').count()).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("model-presets.png"), fullPage: false });
});


test(`model data failures stop retrying automatically and can be retried explicitly ${tags}`, async ({ page }) => {
  await page.goto(guide);
  await expect(page.locator("#public-static-root")).toHaveCount(0);
  let attempts = 0;
  await page.route("**/model-documents/**/ja/presets.json", route => {
    attempts += 1;
    return attempts === 1 ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" }) : route.continue();
  });
  await page.getByRole("link", { name: "baseline・プリセット", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "再試行", exact: true })).toBeVisible();
  expect(attempts).toBe(1);
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(page.getByRole("heading", { name: "baseline", level: 1, exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test(`leaving a pending record does not restore its position into the guide ${tags}`, async ({ page }) => {
  await page.goto(guide + "&view=presets");
  await expect(page.locator("#public-static-root")).toHaveCount(0);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/model-documents/**/ja/presets-r-*.json", async route => {
    await held;
    await route.continue();
  });
  try {
    await page.locator('[data-reader-record]').nth(1).click();
    await page.getByRole("link", { name: "しくみ・数式", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Standard 73のしくみ" })).toBeInViewport();
  } finally { release(); }
});
