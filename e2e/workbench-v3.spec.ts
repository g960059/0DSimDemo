import { expect, test, type Locator, type Page } from "@playwright/test";

const EXACT_MODEL_ID =
  "circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-8";
const LIMITATIONS_SCOPE = `${EXACT_MODEL_ID}:disclosure-v1`;
const LIMITATIONS_KEY =
  `circleheart.modelLimitations.ack.${encodeURIComponent(LIMITATIONS_SCOPE)}`;

test.beforeEach(async ({ page }, testInfo) => {
  if (!testInfo.title.includes("limitations acknowledgement")) {
    await page.addInitScript(
      (key) => localStorage.setItem(key, "1"),
      LIMITATIONS_KEY,
    );
  }
  await page.goto("/ja/workbench");
  await expect(page.getByTestId("v3-dockview-workbench")).toBeVisible();
  await expect(page.getByText(EXACT_MODEL_ID, { exact: true })).toBeVisible();
  await expect.poll(() => acceptedRevision(page)).toBeGreaterThan(10);
});

test("@desktop playback, charts, analysis, controls, and settings stay live", async ({
  page,
}) => {
  const root = page.getByTestId("v3-dockview-workbench");
  const firstTime = await modelTime(root);
  await page.waitForTimeout(2_000);
  const secondTime = await modelTime(root);
  expect(secondTime - firstTime).toBeGreaterThan(0.6);
  expect(secondTime - firstTime).toBeLessThan(3.2);

  const playback = page.getByTestId("v3-playback-toggle");
  await playback.click();
  await expect(root).toHaveAttribute("data-playback", "paused");
  await page.waitForTimeout(100);
  const pausedAt = await modelTime(root);
  await page.waitForTimeout(800);
  expect(Math.abs((await modelTime(root)) - pausedAt)).toBeLessThanOrEqual(0.02);
  await playback.click();
  await expect(root).toHaveAttribute("data-playback", "playing");
  await expect.poll(() => modelTime(root)).toBeGreaterThan(pausedAt + 0.25);

  await expectNonZeroCanvas(page.locator('[data-chart-kind="sweeping-waveform-v3"]'));

  const lvPvTab = page.getByText("LV pressure-volume loop", { exact: true });
  await lvPvTab.scrollIntoViewIfNeeded();
  await lvPvTab.click();
  await expectNonZeroCanvas(page.locator('[data-chart-kind="pressure-volume-loop-v3"]'));
  await expect(page.locator('[data-orientation-guide-semantics="single-beat-orientation-references-not-formal-pressure-volume-relations"]'))
    .toBeVisible();

  const returnTab = page.getByText("Systemic venous-return orientation", {
    exact: true,
  });
  await returnTab.scrollIntoViewIfNeeded();
  await returnTab.click();
  const structural = page.locator(
    '[data-chart-kind="guyton-starling-structural-orientation-v3"]',
  );
  await expectNonZeroCanvas(structural);
  await expect(page.locator("[data-analysis-boundary-status]"))
    .toHaveAttribute("data-analysis-boundary-status", /current|stale/);

  const initialEpoch = await inputEpoch(page);
  const systemicResistance = page.getByRole("slider", {
    name: "Systemic resistance",
  });
  await systemicResistance.press("ArrowRight");
  await expect.poll(() => inputEpoch(page)).toBeGreaterThan(initialEpoch);
  await expect.poll(() => modelTime(root)).toBeGreaterThan(0.2);

  await page.getByRole("button", {
    name: "Open Outputs pane settings",
  }).click();
  const settings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(settings).toBeVisible();
  const firstOutput = settings.getByRole("checkbox").first();
  await expect(firstOutput).toBeChecked();
  await firstOutput.uncheck();
  await expect(firstOutput).not.toBeChecked();
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(settings).toBeHidden();
});

test("@desktop exact-model limitations acknowledgement persists", async ({
  page,
}) => {
  const dialog = page.getByRole("dialog", {
    name: "研究モデルの制限事項",
  });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "理解しました" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(dialog).toBeHidden();
});

test("@mobile 390px Workbench uses one graph tab group and keeps controls reachable", async ({
  page,
}) => {
  const graphArea = page.getByRole("region", { name: "グラフエリア" });
  await expect(graphArea).toBeVisible();
  await expect(graphArea.locator(".dv-groupview")).toHaveCount(1);
  const graphBox = await graphArea.boundingBox();
  expect(graphBox?.width ?? 0).toBeGreaterThan(360);
  await expectNonZeroCanvas(page.locator('[data-chart-kind="sweeping-waveform-v3"]'));

  const controlArea = page.getByRole("region", { name: "コントロールエリア" });
  await controlArea.scrollIntoViewIfNeeded();
  await expect(page.getByRole("slider", { name: "Systemic resistance" }))
    .toBeVisible();
  await page.getByRole("button", {
    name: "Open Parameters pane settings",
  }).click();
  await expect(page.getByRole("dialog", { name: "Pane設定" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Pane設定" }).getByRole("checkbox"))
    .toHaveCount(4);
});

async function modelTime(root: Locator): Promise<number> {
  const raw = await root.getAttribute("data-model-time-sec");
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`invalid model time ${raw}`);
  return value;
}

async function acceptedRevision(page: Page): Promise<number> {
  const raw = await page.getByTestId("v3-dockview-workbench")
    .getAttribute("data-accepted-revision");
  return Number(raw ?? -1);
}

async function inputEpoch(page: Page): Promise<number> {
  const text = await page.getByTestId("v3-runtime-status")
    .locator("dd")
    .nth(2)
    .textContent();
  return Number(text?.trim() ?? -1);
}

async function expectNonZeroCanvas(container: Locator): Promise<void> {
  const target = container.first();
  await expect(target).toBeVisible();
  const canvas = target.locator("canvas");
  await expect(canvas).toBeVisible();
  await expect.poll(async () => {
    const box = await canvas.boundingBox();
    return (box?.width ?? 0) * (box?.height ?? 0);
  }).toBeGreaterThan(10_000);
}
