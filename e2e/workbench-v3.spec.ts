import { expect, test, type Locator, type Page } from "@playwright/test";

const EXACT_MODEL_ID =
  "circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-12";
const LIMITATIONS_SCOPE = `${EXACT_MODEL_ID}:disclosure-v1`;
const LIMITATIONS_KEY =
  `circleheart.modelLimitations.ack.${encodeURIComponent(LIMITATIONS_SCOPE)}`;
const E2E_WORKBENCH_ID = "workbench-e2e-primary";

test.beforeEach(async ({ page }, testInfo) => {
  if (!testInfo.title.includes("limitations acknowledgement")) {
    await page.addInitScript(
      (key) => localStorage.setItem(key, "1"),
      LIMITATIONS_KEY,
    );
  }
  if (testInfo.title.includes("selector creates")) {
    await page.goto("/ja/workbench");
    return;
  }
  await page.goto(`/ja/workbench/${E2E_WORKBENCH_ID}`);
  const root = page.getByTestId("v3-dockview-workbench");
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-model-id", EXACT_MODEL_ID);
  await expect(page.getByTestId("workbench-model-menu-trigger-v3"))
    .toContainText("MW V3");
  await expect.poll(() => acceptedRevision(page)).toBeGreaterThan(10);
});

test("@desktop selector creates a model-independent opaque Workbench route", async ({
  page,
}) => {
  await expect(page.getByTestId("workbench-selector-v3")).toBeVisible();
  await page.getByTestId("create-workbench-v3").click();
  await expect(page).toHaveURL(/\/ja\/workbench\/workbench-[A-Za-z0-9_-]+$/);
  await expect(page.getByTestId("v3-dockview-workbench")).toBeVisible();
  await expect(page.getByTestId("workbench-unavailable-model-v3"))
    .toHaveCount(0);
  expect(page.url()).not.toContain(encodeURIComponent(EXACT_MODEL_ID));
});

test("@desktop playback, charts, analysis, controls, and settings stay live", async ({
  page,
}) => {
  const root = page.getByTestId("v3-dockview-workbench");
  const firstTime = await modelTime(root);
  // The deterministic scheduler suite owns the wall-clock pacing contract.
  // This production-browser smoke runs on variable shared CI hardware, so it
  // verifies sustained numerical progress without turning solver throughput
  // into a runner benchmark.
  await expect.poll(
    () => modelTime(root),
    { timeout: 10_000, intervals: [250] },
  ).toBeGreaterThan(firstTime + 0.6);
  const secondTime = await modelTime(root);
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

  await page.getByRole("button", {
    name: "Pane設定: Left-heart pressure",
  }).click();
  const waveformSettings = page.getByRole("dialog", { name: "Pane設定" });
  const waveformWindow = waveformSettings.getByRole("spinbutton", {
    name: "表示時間幅",
  });
  await waveformWindow.fill("3.5");
  await waveformWindow.press("Enter");
  await expect(waveformWindow).toHaveValue("3.5");
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(waveformSettings).toBeHidden();

  const pvTab = page.getByText("Pressure-volume loops", { exact: true });
  await pvTab.scrollIntoViewIfNeeded();
  await pvTab.click();
  await expectNonZeroCanvas(page.locator('[data-chart-kind="pressure-volume-loop-v3"]'));
  await expect(page.locator('[data-orientation-guide-semantics="single-beat-orientation-references-not-formal-pressure-volume-relations"]'))
    .toBeVisible();

  const graphArea = page.getByRole("region", { name: "グラフエリア" });
  await graphArea.getByRole("button", { name: "Paneを追加" }).click();
  const addedGraphSettings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(addedGraphSettings.getByRole("button", { name: "Paneを追加" }))
    .toHaveCount(0);
  await addedGraphSettings.getByRole("combobox").selectOption(
    "hemodynamics.structural-return.systemic",
  );
  const structuralTab = graphArea.getByText(
    "Systemic venous-return orientation",
    { exact: true },
  );
  await expect(structuralTab).toBeVisible();
  await addedGraphSettings.getByRole("button", { name: "閉じる" }).click();
  await structuralTab.click();
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
    name: "Pane設定: Outputs",
  }).click();
  const settings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(settings).toBeVisible();
  await expect(settings.locator('input[type="color"]')).toHaveCount(0);
  const firstOutput = settings.getByRole("checkbox").first();
  await expect(firstOutput).toBeChecked();
  await firstOutput.uncheck();
  await expect(firstOutput).not.toBeChecked();
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(settings).toBeHidden();
});

test("@desktop baseline duplication stays independent and requires explicit save", async ({
  page,
}) => {
  const root = page.getByTestId("v3-dockview-workbench");
  const scenarioRegion = page.getByRole("region", { name: "Scenarios" });
  await expect(scenarioRegion.getByRole("button", { name: "複製" }))
    .toHaveCount(1);
  await scenarioRegion.getByRole("button", { name: "複製" }).click();
  await expect(scenarioRegion.getByRole("button", { name: "複製" }))
    .toHaveCount(2);
  await expect(page.getByRole("button", { name: "保存", exact: true }))
    .toBeVisible();

  const copyScenario = scenarioRegion.getByRole("button", {
    name: "起動時baseline のコピー scenario/workbench-live-default-copy",
    exact: true,
  });
  await expect(copyScenario).toBeVisible();
  const copyEpoch = await inputEpoch(page);
  const systemicResistance = page.getByRole("slider", {
    name: "Systemic resistance",
  });
  await systemicResistance.press("ArrowRight");
  await expect.poll(() => inputEpoch(page)).toBeGreaterThan(copyEpoch);
  await expect(systemicResistance).toHaveValue("1.01");

  await expect.poll(() => modelTime(root)).toBeGreaterThan(0.2);
  const playback = page.getByTestId("v3-playback-toggle");
  await playback.click();
  await expect(root).toHaveAttribute("data-playback", "paused");

  const baselineScenario = scenarioRegion.getByRole("button", {
    name: "起動時baseline workbench-live-default",
    exact: true,
  });
  await baselineScenario.click();
  await expect(systemicResistance).toHaveValue("1");
  const baselineCheckpointTime = await modelTime(root);

  await copyScenario.click();
  await expect(systemicResistance).toHaveValue("1.01");
  // Selection waits for global Pause to drain every lane, so this is the
  // exact copy time that the following explicit Save must capture.
  const copyCheckpointTime = await modelTime(root);

  // Save captures every exact branch, not only the active Scenario. Keep the
  // baseline active so reload must restore the inactive divergent copy from
  // its durable fixture + checkpoint rather than from live UI state.
  await baselineScenario.click();
  const save = page.getByTestId("v3-save-draft");
  await save.click();
  await expect(save).toContainText("保存済み");
  await expect(root).toHaveAttribute("data-playback", "paused");

  await page.reload();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-model-id", EXACT_MODEL_ID);
  await expect(scenarioRegion.getByRole("button", { name: "複製" }))
    .toHaveCount(2);

  const restoredBaseline = scenarioRegion.getByRole("button", {
    name: "起動時baseline workbench-live-default",
    exact: true,
  });
  const restoredCopy = scenarioRegion.getByRole("button", {
    name: "起動時baseline のコピー scenario/workbench-live-default-copy",
    exact: true,
  });
  await restoredBaseline.click();
  if (await root.getAttribute("data-playback") !== "playing") {
    await playback.click();
  }
  await expect(root).toHaveAttribute("data-playback", "playing");
  await expect.poll(
    () => modelTime(root),
    { timeout: 10_000, intervals: [100] },
  ).toBeGreaterThan(baselineCheckpointTime + 0.08);

  await playback.click();
  await expect(root).toHaveAttribute("data-playback", "paused");
  // Scenario selection drains any final in-flight batches before adopting the
  // selected frame, making both post-reload times stable for comparison.
  await restoredCopy.click();
  await expect(systemicResistance).toHaveValue("1.01");
  await restoredBaseline.click();
  await expect(systemicResistance).toHaveValue("1");
  const restoredBaselineTime = await modelTime(root);
  const baselineAutostartAdvance =
    restoredBaselineTime - baselineCheckpointTime;
  expect(baselineAutostartAdvance).toBeGreaterThan(0.02);

  await restoredCopy.click();
  await expect(systemicResistance).toHaveValue("1.01");
  const restoredCopyTime = await modelTime(root);
  const copyAutostartAdvance = restoredCopyTime - copyCheckpointTime;
  // The copy was never selected while playback ran. Its positive advancement
  // therefore proves that inactive Scenarios also simulate live, while the
  // bounded delta rejects a reset or hidden-tab debt replay.
  expect(copyAutostartAdvance).toBeGreaterThan(0.02);
  expect(Math.abs(copyAutostartAdvance - baselineAutostartAdvance))
    .toBeLessThanOrEqual(0.25);

  // Mutating the restored copy remains branch-local after the durable
  // round-trip; the baseline fixture is still untouched.
  await systemicResistance.press("ArrowRight");
  await expect(systemicResistance).toHaveValue("1.02");
  await restoredBaseline.click();
  await expect(systemicResistance).toHaveValue("1");
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
    name: "Pane設定: Parameters",
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
  const raw = await page.getByTestId("v3-dockview-workbench")
    .getAttribute("data-input-epoch");
  return Number(raw ?? -1);
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
