import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const registryAdmissionLock = JSON.parse(readFileSync(new URL(
  "../studio/integrations/mainWireIntegratedV3/registry-admission-lock.json",
  import.meta.url,
), "utf8")) as Readonly<{ modelId: string }>;

const EXACT_MODEL_ID = registryAdmissionLock.modelId;
const UUID_RESOURCE_ID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const EXPERIMENT_RESOURCE_ID =
  `(?:${UUID_RESOURCE_ID}|experiment-[A-Za-z0-9_-]+)`;

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.includes("selector stays")) {
    await page.goto("/ja/me/experiments");
    return;
  }
  await page.goto("/ja/experiments/new");
  const root = page.getByTestId("v3-dockview-workbench");
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-model-id", EXACT_MODEL_ID);
  await expect(
    page.getByTestId("workbench-simulation-info-trigger-v3"),
  ).toBeVisible();
  await expect.poll(() => acceptedRevision(page)).toBeGreaterThan(10);
});

test("@desktop selector stays ID-less until the first explicit Save", async ({
  page,
}) => {
  await expect(page.getByTestId("workbench-selector-v3")).toBeVisible();
  await page.getByTestId("create-workbench-v3").click();
  await expect(page).toHaveURL(/\/ja\/experiments\/new$/);
  await expect(page.getByTestId("v3-dockview-workbench")).toBeVisible();
  await expect(page.getByTestId("workbench-unavailable-model-v3")).toHaveCount(
    0,
  );
  expect(page.url()).not.toContain(encodeURIComponent(EXACT_MODEL_ID));

  const title = page.getByTestId("workbench-experiment-title-v3");
  await title.fill("Acute afterload comparison");
  await title.press("Enter");
  await expect(title).not.toBeFocused();

  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存済み", exact: true }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(new RegExp(
    `/ja/experiments/${EXPERIMENT_RESOURCE_ID}$`,
  ));

  await page.goto("/ja/me/experiments");
  const experimentRow = page.getByRole("listitem").filter({
    hasText: "Acute afterload comparison",
  });
  await expect(experimentRow).toContainText("未公開");
  await expect(experimentRow.getByRole("link", { name: "開く" })).toBeVisible();
  await expect(experimentRow.getByRole("button", {
    name: "シミュレーションを削除",
  })).toBeVisible();
  await expect(page.getByRole("button", { name: /書き出/ })).toHaveCount(0);
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
  await expect
    .poll(() => modelTime(root), { timeout: 10_000, intervals: [250] })
    .toBeGreaterThan(firstTime + 0.6);
  const secondTime = await modelTime(root);
  expect(secondTime - firstTime).toBeLessThan(3.2);

  const playback = page.getByTestId("v3-playback-toggle");
  await playback.click();
  await expect(root).toHaveAttribute("data-playback", "paused");
  // The pause intent is rendered immediately while the scheduler drains an
  // already accepted presentation batch. Wait for that bounded drain rather
  // than treating a slow shared runner's queued frame delivery as playback.
  await expect.poll(async () => {
    const beforeDrain = await modelTime(root);
    await page.waitForTimeout(150);
    return Math.abs((await modelTime(root)) - beforeDrain);
  }, { timeout: 5_000 }).toBeLessThanOrEqual(0.02);
  const pausedAt = await modelTime(root);
  await page.waitForTimeout(800);
  expect(Math.abs((await modelTime(root)) - pausedAt)).toBeLessThanOrEqual(
    0.02,
  );
  await playback.click();
  await expect(root).toHaveAttribute("data-playback", "playing");
  await expect.poll(() => modelTime(root)).toBeGreaterThan(pausedAt + 0.25);

  await expectNonZeroCanvas(
    page.locator('[data-chart-kind="sweeping-waveform-v3"]'),
  );

  await expect(page.getByText(/\d+\.\d+ s/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "記事" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Brief" })).toHaveCount(0);

  const themeToggle = page.getByTestId("workbench-theme-toggle");
  await expect(themeToggle).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-app-theme", "dark");
  await themeToggle.click();
  await expect(page.locator("body")).toHaveAttribute("data-app-theme", "light");
  await themeToggle.click();
  await expect(page.locator("body")).toHaveAttribute("data-app-theme", "dark");

  const scenarioRegion = page.getByRole("region", { name: "Scenarios" });
  const controlArea = page.getByRole("region", { name: "コントロールエリア" });
  const scenarioBox = await scenarioRegion.boundingBox();
  const controlBox = await controlArea.boundingBox();
  expect(
    (scenarioBox?.y ?? 0) + (scenarioBox?.height ?? 0),
  ).toBeLessThanOrEqual((controlBox?.y ?? 0) + 1);
  await expect(
    controlArea.getByRole("region", { name: "Scenarios" }),
  ).toHaveCount(0);

  await openPaneSettings(page, "Pressure waveforms");
  const waveformSettings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(
    waveformSettings.getByRole("heading", { name: "Pressure waveforms" }),
  ).toBeVisible();
  await expect(waveformSettings.getByText("Graph pane", { exact: true }))
    .toBeVisible();
  const waveformWindow = waveformSettings.getByRole("spinbutton", {
    name: "表示時間幅",
  });
  await waveformWindow.fill("3.5");
  await waveformWindow.press("Enter");
  await expect(waveformWindow).toHaveValue("3.5");
  await waveformSettings.getByRole("button", { name: "完了" }).click();
  await expect(waveformSettings).toBeHidden();
  await openPaneSettings(page, "Pressure waveforms");
  await expect(
    page
      .getByRole("dialog", { name: "Pane設定" })
      .getByRole("spinbutton", { name: "表示時間幅" }),
  ).toHaveValue("3.5");
  await page.getByRole("button", { name: "キャンセル" }).click();

  const pvTab = page.getByText("PV loop", { exact: true });
  await pvTab.scrollIntoViewIfNeeded();
  await pvTab.click();
  await expectNonZeroCanvas(
    page.locator('[data-chart-kind="pressure-volume-loop-v3"]'),
  );
  await expect(
    page.locator(
      '[data-pv-relation-semantics="responsive-fixed-tbv-multi-load-pv-loop-support-envelope-preview-not-validated-espvr-edpvr"]',
    ),
  ).toBeVisible({ timeout: 60_000 });

  const graphArea = page.getByRole("region", { name: "グラフエリア" });
  const graphGroups = graphArea.locator(".dv-groupview");
  await expect(graphGroups).toHaveCount(2);
  await expect(
    graphArea.getByRole("button", { name: "Paneを追加" }),
  ).toHaveCount(2);
  await graphGroups.first().getByRole("button", { name: "Paneを追加" }).click();
  const addGraphMenu = page.getByRole("menu", { name: "Paneを追加" });
  await expect(addGraphMenu.getByRole("menuitem")).toHaveText([
    "PV loop",
    "圧波形",
    "流量波形",
    "体循環 Guyton / Starling（CVP）",
    "肺循環 Guyton / Starling（PCWP）",
  ]);
  await addGraphMenu
    .getByRole("menuitem", {
      name: "体循環 Guyton / Starling（CVP）",
    })
    .click();
  await expect(graphGroups).toHaveCount(2);
  const structuralTab = graphArea.getByText("Systemic Guyton / Starling", {
    exact: true,
  });
  await expect(structuralTab).toBeVisible();
  await structuralTab.click();
  const structural = page.locator(
    '[data-chart-kind="guyton-starling-structural-orientation-v3"]',
  );
  await expect(structural).toHaveCount(1);
  await expectNonZeroCanvas(structural.first());
  await expect(page.locator("[data-analysis-boundary-status]")).toHaveAttribute(
    "data-analysis-boundary-status",
    "current-input-epoch",
  );
  await expect
    .poll(
      async () => {
        const completed = Number(
          await structural
            .first()
            .getAttribute("data-starling-completed-points"),
        );
        const total = Number(
          await structural.first().getAttribute("data-starling-total-points"),
        );
        // The reader renders every accepted continuation point immediately.
        // Full-locus convergence is covered by deterministic protocol tests;
        // this variable-hardware browser smoke owns progressive first paint,
        // not a numerical-throughput benchmark.
        return completed > 0 && total >= completed;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  expect(
    Number(await structural.getAttribute("data-pressure-maximum-mmhg")),
  ).toBeLessThan(25);

  await openPaneSettings(page, "Systemic Guyton / Starling");
  const structuralSettings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(
    structuralSettings.getByRole("combobox", {
      name: "表示する循環",
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(structural).toHaveCount(1);

  await graphGroups.first().getByRole("button", { name: "Paneを追加" }).click();
  await page
    .getByRole("menu", { name: "Paneを追加" })
    .getByRole("menuitem", { name: "肺循環 Guyton / Starling（PCWP）" })
    .click();
  const pulmonaryTab = graphArea.getByText("Pulmonary Guyton / Starling", {
    exact: true,
  });
  await expect(structuralTab).toBeVisible();
  await expect(pulmonaryTab).toBeVisible();
  await pulmonaryTab.click();
  await expect(structural).toHaveCount(1);
  expect(
    Number(await structural.getAttribute("data-pressure-maximum-mmhg")),
  ).toBeLessThan(30);
  await openPaneSettings(page, "Pulmonary Guyton / Starling");
  await expect(
    page
      .getByRole("dialog", { name: "Pane設定" })
      .getByRole("combobox", { name: "表示する循環" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "閉じる" }).click();
  await structuralTab.click();
  // Let the source analysis finish when the runner permits it. History itself
  // deliberately retains the last renderable preview, so a slower client does
  // not lose the curve that was visible immediately before this mutation.
  await expect(structural).toHaveAttribute(
    "data-pending-scenario-count",
    "0",
    { timeout: 60_000 },
  );

  const initialEpoch = await inputEpoch(page);
  const preControlTime = await modelTime(root);
  const preControlRevision = await acceptedRevision(page);
  const systemicResistance = page.getByRole("slider", {
    name: "Systemic resistance",
  });
  await expect(systemicResistance).toBeEnabled({ timeout: 60_000 });
  await systemicResistance.press("ArrowRight");
  await expect(
    page.getByTestId("workbench-scenario-manager-v3").getByRole("status", {
      name: "Guyton / Starlingを再計算中: 起動時baseline",
      exact: true,
    }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(structural).toHaveAttribute("data-history-count", "1", {
    timeout: 20_000,
  });
  await expect.poll(() => inputEpoch(page)).toBeGreaterThan(initialEpoch);
  const changedEpoch = await inputEpoch(page);
  expect(await modelTime(root)).toBeGreaterThanOrEqual(preControlTime);
  expect(await acceptedRevision(page)).toBeGreaterThanOrEqual(
    preControlRevision,
  );
  await expect.poll(() => modelTime(root)).toBeGreaterThan(preControlTime);
  await expect(page.locator("[data-analysis-input-epoch]")).toHaveAttribute(
    "data-analysis-input-epoch",
    String(changedEpoch),
    {
      timeout: 20_000,
    },
  );
  await expect(structural).toHaveAttribute("data-history-count", "1");

  await openPaneSettings(page, "Outputs");
  const settings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(settings).toBeVisible();
  await expect(settings.locator('input[type="color"]')).toHaveCount(0);
  const selectedHeartRate = settings.getByRole("button", {
    name: "Heart rate signal · bpm",
  });
  await expect(selectedHeartRate).toBeVisible();
  await settings.getByRole("button", {
    name: "項目を編集: Heart rate",
  }).click();
  await settings
    .getByRole("menu", { name: "Heart rate" })
    .getByRole("menuitem", { name: "Paneから外す" })
    .click();
  await expect(selectedHeartRate).toHaveCount(0);
  await settings.getByRole("button", {
    name: "項目を追加",
    exact: true,
  }).click();
  const catalogDrawer = settings.getByTestId(
    "pane-settings-context-drawer-v3",
  );
  await expect(catalogDrawer).toHaveAttribute("data-open", "true");
  await expect(
    catalogDrawer.getByRole("button", { name: "項目を追加: Heart rate" }),
  ).toBeVisible();
  await catalogDrawer
    .getByRole("button", { name: "項目を追加: Heart rate" })
    .click();
  await expect(catalogDrawer.getByRole("button", {
    name: "項目を編集: Heart rate",
  })).toBeVisible();
  await catalogDrawer.getByRole("button", { name: "パネルを閉じる" }).click();
  await expect(catalogDrawer).toHaveAttribute("data-open", "false");
  await expect(
    settings.getByRole("button", { name: "Paneを削除" }),
  ).toHaveCount(0);
  await settings.getByRole("button", { name: "キャンセル" }).click();
  await expect(settings).toBeHidden();

  await openPaneSettings(page, "Outputs");
  await expect(
    page
      .getByRole("dialog", { name: "Pane設定" })
      .getByRole("button", { name: "Heart rate signal · bpm" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();

  await page.getByRole("button", { name: "Pane設定: Outputs" }).click();
  const outputPaneMenu = page.getByRole("menu", { name: "Outputs" });
  await expect(
    outputPaneMenu.getByRole("menuitem", { name: "右に分割" }),
  ).toBeVisible();
  await expect(
    outputPaneMenu.getByRole("menuitem", { name: "下に分割" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await expect(controlArea.locator(".dv-groupview")).toHaveCount(1);
  await controlArea.getByRole("button", { name: "Paneを追加" }).click();
  const controllerSettingsButtons = controlArea.getByRole("button", {
    name: /Pane設定: Parameters/,
  });
  await expect(controllerSettingsButtons).toHaveCount(2);
  const activeControllerSettings = controlArea
    .locator(".dv-tab.dv-active-tab")
    .getByRole("button", { name: "Pane設定: Parameters" });
  await expect(activeControllerSettings).toHaveCount(1);
  await expect(controlArea.locator(".dv-tab")).toHaveCount(2);
  await expect(controlArea.locator(".dv-groupview")).toHaveCount(1);

  await activeControllerSettings.click();
  const controllerPaneMenu = page.getByRole("menu", { name: "Parameters" });
  await expect(
    controllerPaneMenu.getByRole("menuitem", { name: "右に分割" }),
  ).toHaveCount(0);
  await controllerPaneMenu.getByRole("menuitem", { name: "下に分割" }).click();
  await expect(controlArea.locator(".dv-groupview")).toHaveCount(2);
  const upperControllerGroup = await controlArea
    .locator(".dv-groupview")
    .first()
    .boundingBox();
  const lowerControllerGroup = await controlArea
    .locator(".dv-groupview")
    .nth(1)
    .boundingBox();
  expect(lowerControllerGroup?.y ?? 0).toBeGreaterThan(
    upperControllerGroup?.y ?? 0,
  );
});

test("@desktop baseline duplication stays independent and requires explicit save", async ({
  page,
}) => {
  const root = page.getByTestId("v3-dockview-workbench");
  const scenarioRegion = page.getByRole("region", { name: "Scenarios" });
  await expect(
    scenarioRegion.getByRole("button", { name: /Scenarioメニュー:/ }),
  ).toHaveCount(1);
  const baselineMenuButton = scenarioRegion.getByRole("button", {
    name: "Scenarioメニュー: 起動時baseline",
  });
  await openScenarioMenu(page, scenarioRegion, "起動時baseline");
  const baselineMenu = page.getByRole("menu", {
    name: "Scenarioメニュー: 起動時baseline",
  });
  await expect(baselineMenu.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(baselineMenu).toBeHidden();
  await expect(baselineMenuButton).toBeFocused();
  await openScenarioMenu(page, scenarioRegion, "起動時baseline");
  await page.getByRole("menuitem", { name: "複製" }).click();
  await expect(
    scenarioRegion.getByRole("button", { name: /Scenarioメニュー:/ }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-chart-kind="sweeping-waveform-v3"]'),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "起動時baseline, LVP",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "起動時baseline のコピー, LVP",
      exact: true,
    }),
  ).toBeVisible();

  const graphArea = page.getByRole("region", { name: "グラフエリア" });
  await graphArea
    .locator(".dv-groupview")
    .first()
    .getByRole("button", { name: "Paneを追加" })
    .click();
  await page
    .getByRole("menu", { name: "Paneを追加" })
    .getByRole("menuitem", { name: "体循環 Guyton / Starling（CVP）" })
    .click();
  await graphArea
    .getByText("Systemic Guyton / Starling", { exact: true })
    .click();
  const structuralComparisons = graphArea.locator(
    '[data-chart-kind="guyton-starling-structural-orientation-v3"]',
  );
  await expect(structuralComparisons).toHaveCount(1, { timeout: 20_000 });
  await expect(structuralComparisons.first()).toHaveAttribute(
    "data-scenario-count",
    "2",
    { timeout: 45_000 },
  );
  await expect(
    graphArea.locator('[data-chart-legend="scenario-only"]'),
  ).toHaveCount(1);
  await expect(
    graphArea.getByRole("button", { name: "解析を更新" }),
  ).toHaveCount(0);

  await graphArea.getByText("Pressure waveforms", { exact: true }).click();
  await openPaneSettings(page, "Pressure waveforms");
  const colorSettings = page.getByRole("dialog", { name: "Pane設定" });
  await colorSettings.getByRole("button", { name: "配色" }).click();
  const automaticColors = colorSettings
    .getByRole("heading", { name: "配色", exact: true })
    .locator("..");
  const scenarioColorSections = automaticColors.locator("section");
  await expect(scenarioColorSections).toHaveCount(2);
  const copyTraceColors = scenarioColorSections
    .nth(1)
    .locator('input[type="color"]');
  await expect(copyTraceColors).toHaveCount(3);
  const allocatedCopyLvp = await copyTraceColors.nth(0).inputValue();
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(colorSettings).toBeHidden();
  const copyBaseColor = page.getByLabel(
    "新しいtraceのbase色: 起動時baseline のコピー",
  );
  await copyBaseColor.fill("#8b76d1");
  await expect(copyBaseColor).toHaveValue("#8b76d1");
  await openPaneSettings(page, "Pressure waveforms");
  await colorSettings.getByRole("button", { name: "配色" }).click();
  const copyTraceColorsAfterBase = automaticColors
    .locator("section")
    .nth(1)
    .locator('input[type="color"]');
  await expect(copyTraceColorsAfterBase.nth(0)).toHaveValue(allocatedCopyLvp);
  await copyTraceColorsAfterBase.nth(0).fill("#00a37a");
  await expect(copyTraceColorsAfterBase.nth(0)).toHaveValue("#00a37a");
  const resetCopyLvp = automaticColors
    .locator("section")
    .nth(1)
    .getByRole("button", {
      name: "自動配色に戻す: LVP",
    });
  await expect(resetCopyLvp).toBeVisible();
  await resetCopyLvp.click();
  await expect(copyTraceColorsAfterBase.nth(0)).toHaveValue(allocatedCopyLvp);
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(colorSettings).toBeHidden();

  const copyScenario = scenarioRegion.getByRole("button", {
    name: "起動時baseline のコピー scenario/workbench-live-default-copy",
    exact: true,
  });
  await expect(copyScenario).toBeVisible();
  const copyEpoch = await inputEpoch(page);
  const systemicResistance = page.getByRole("slider", {
    name: "Systemic resistance",
  });
  await expect(systemicResistance).toBeEnabled({ timeout: 60_000 });
  await systemicResistance.press("ArrowRight");
  await expect.poll(() => inputEpoch(page)).toBeGreaterThan(copyEpoch);
  await expect(systemicResistance).toHaveValue("1.01");

  await page.getByText("PV loop", { exact: true }).click();
  await expect(
    page.locator('[data-chart-kind="pressure-volume-loop-v3"]'),
  ).toHaveAttribute("data-pv-relation-trace-count", "2", {
    timeout: 60_000,
  });

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
  const save = page.getByTestId("v3-save-experiment");
  await save.click();
  await expect(save).toContainText("保存済み");
  await expect(root).toHaveAttribute("data-playback", "paused");

  await page.reload();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-model-id", EXACT_MODEL_ID);
  await expect(
    scenarioRegion.getByRole("button", { name: /Scenarioメニュー:/ }),
  ).toHaveCount(2);

  const restoredBaseline = scenarioRegion.getByRole("button", {
    name: "起動時baseline workbench-live-default",
    exact: true,
  });
  const restoredCopy = scenarioRegion.getByRole("button", {
    name: "起動時baseline のコピー scenario/workbench-live-default-copy",
    exact: true,
  });
  await restoredBaseline.click();
  if ((await root.getAttribute("data-playback")) !== "playing") {
    await playback.click();
  }
  await expect(root).toHaveAttribute("data-playback", "playing");
  await expect
    .poll(() => modelTime(root), { timeout: 10_000, intervals: [100] })
    .toBeGreaterThan(baselineCheckpointTime + 0.08);

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
  expect(
    Math.abs(copyAutostartAdvance - baselineAutostartAdvance),
  ).toBeLessThanOrEqual(0.25);

  // Mutating the restored copy remains branch-local after the durable
  // round-trip; the baseline fixture is still untouched.
  const restoredCopyEpoch = await inputEpoch(page);
  await systemicResistance.press("ArrowRight");
  await expect(systemicResistance).toHaveValue("1.02");
  await expect.poll(() => inputEpoch(page), { timeout: 30_000 })
    .toBeGreaterThan(restoredCopyEpoch);
  await restoredBaseline.click();
  await expect(systemicResistance).toHaveValue("1");
});

test("@desktop simulation information stays human-facing", async ({
  page,
}) => {
  await page.getByTestId("workbench-simulation-info-trigger-v3").click();
  const dialog = page.getByRole("dialog", { name: "シミュレーション情報" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "シナリオの状態 · 1" }))
    .toBeVisible();
  await dialog.getByRole("tab", { name: "数理モデル" }).click();
  await expect(dialog.getByText("統合循環動態モデル", { exact: true }))
    .toBeVisible();
  await expect(dialog.getByText("検証と妥当性", { exact: true }))
    .toBeVisible();
  await expect(dialog.getByText("Exact model ID", { exact: true }))
    .toHaveCount(0);
  await expect(dialog.getByText("Fixture schema", { exact: true }))
    .toHaveCount(0);
  await expect(dialog.getByText("Checkpoint codec", { exact: true }))
    .toHaveCount(0);
  await expect(dialog.getByText("Snapshot gate", { exact: true }))
    .toHaveCount(0);
});

test("@mobile 390px Workbench uses one graph tab group and keeps controls reachable", async ({
  page,
}) => {
  const graphArea = page.getByRole("region", { name: "グラフエリア" });
  await expect(graphArea).toBeVisible();
  await expect(graphArea.locator(".dv-groupview")).toHaveCount(1);
  const graphBox = await graphArea.boundingBox();
  expect(graphBox?.width ?? 0).toBeGreaterThan(360);
  await expectNonZeroCanvas(
    page.locator('[data-chart-kind="sweeping-waveform-v3"]'),
  );

  const controlArea = page.getByRole("region", { name: "コントロールエリア" });
  await controlArea.scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("slider", { name: "Systemic resistance" }),
  ).toBeVisible();
  await openPaneSettings(page, "Parameters");
  const settings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(settings).toBeVisible();
  await expect(
    settings.getByRole("heading", { name: "このPaneの項目" }),
  ).toBeVisible();
  await expect(
    settings.getByRole("button", { name: /項目を並べ替え:/ }),
  ).toHaveCount(5);
  await expect(
    settings.getByRole("button", { name: /Paneから外す:/ }),
  ).toHaveCount(0);
  await settings.getByRole("button", {
    name: "項目を追加",
    exact: true,
  }).click();
  const catalogDrawer = settings.getByTestId(
    "pane-settings-context-drawer-v3",
  );
  const catalogDrawerHost = settings.getByTestId(
    "pane-settings-drawer-host-v3",
  );
  const settingsContent = settings.locator(
    ".workbench-pane-editor-content",
  );
  await expect(catalogDrawer).toHaveAttribute("data-open", "true");
  await expect(catalogDrawerHost).toHaveAttribute("data-open", "true");
  await expect.poll(async () =>
    (await catalogDrawerHost.boundingBox())?.width ?? 0
  ).toBeGreaterThan(300);
  // The inspector pushes the settings content while sliding in. Assert its
  // final adjacency after the transition, not an intermediate animation
  // frame whose exact x coordinate depends on shared-runner paint timing.
  await expect.poll(async () => {
    const contentBoxWithDrawer = await settingsContent.boundingBox();
    const drawerBox = await catalogDrawer.boundingBox();
    if (contentBoxWithDrawer === null || drawerBox === null) return -Infinity;
    return drawerBox.x -
      (contentBoxWithDrawer.x + contentBoxWithDrawer.width);
  }, { timeout: 5_000 }).toBeGreaterThanOrEqual(-1);
  await expect(
    catalogDrawer.getByRole("button", { name: /項目を追加:/ }),
  ).toHaveCount(2);
  await catalogDrawer.getByRole("button", { name: "パネルを閉じる" }).click();
  await expect(catalogDrawerHost).toHaveAttribute("data-open", "false");
  await expect.poll(async () =>
    (await catalogDrawerHost.boundingBox())?.width ?? 0
  ).toBeLessThan(1);
  await settings.getByRole("button", {
    name: "Heart rate 40–100 bpm",
  }).click();
  await expect(catalogDrawer).toHaveAttribute("data-open", "true");
  await expect(
    catalogDrawer.getByRole("radio", { name: "スライダー" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    catalogDrawer.getByRole("heading", { name: "プレビュー" }),
  ).toBeVisible();
  await catalogDrawer.getByRole("radio", { name: "カスタムボタン" }).click();
  await expect(
    catalogDrawer.getByRole("radio", { name: "カスタムボタン" }),
  ).toHaveAttribute("aria-checked", "true");
  await catalogDrawer.getByRole("button", { name: "パネルを閉じる" }).click();
  await expect(
    settings.getByRole("button", { name: "キャンセル" }),
  ).toBeVisible();
  await expect(settings.getByRole("button", { name: "完了" })).toBeVisible();
  await settings.getByRole("button", { name: "キャンセル" }).click();
});

async function modelTime(root: Locator): Promise<number> {
  const raw = await root.getAttribute("data-model-time-sec");
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`invalid model time ${raw}`);
  return value;
}

async function acceptedRevision(page: Page): Promise<number> {
  const raw = await page
    .getByTestId("v3-dockview-workbench")
    .getAttribute("data-accepted-revision");
  return Number(raw ?? -1);
}

async function inputEpoch(page: Page): Promise<number> {
  const raw = await page
    .getByTestId("v3-dockview-workbench")
    .getAttribute("data-input-epoch");
  return Number(raw ?? -1);
}

async function expectNonZeroCanvas(container: Locator): Promise<void> {
  const target = container.first();
  await expect(target).toBeVisible();
  const canvas = target.locator("canvas");
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => {
      const box = await canvas.boundingBox();
      return (box?.width ?? 0) * (box?.height ?? 0);
    })
    .toBeGreaterThan(10_000);
}

async function openPaneSettings(page: Page, paneTitle: string): Promise<void> {
  await page
    .getByRole("button", {
      name: `Pane設定: ${paneTitle}`,
    })
    .click();
  await page
    .getByRole("menu", { name: paneTitle })
    .getByRole("menuitem", { name: "Pane設定" })
    .click();
}

async function openScenarioMenu(
  page: Page,
  scenarioRegion: Locator,
  scenarioLabel: string,
): Promise<void> {
  await scenarioRegion
    .getByRole("button", {
      name: `Scenarioメニュー: ${scenarioLabel}`,
    })
    .click();
  await expect(
    page.getByRole("menu", {
      name: `Scenarioメニュー: ${scenarioLabel}`,
    }),
  ).toBeVisible();
}
