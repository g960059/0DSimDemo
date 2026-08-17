import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const registryAdmissionLock = JSON.parse(readFileSync(new URL(
  "../studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json",
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
  if (testInfo.title.includes("baseline duplication stays independent")) {
    // Keep this liveness regression reproducible on high-core developer Macs:
    // two live lanes leave one serialized background slot on the supported
    // four-logical-core tier, matching the constrained CI/device contract.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", {
        configurable: true,
        get: () => 4,
      });
    });
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

test("@desktop selected tab accents update immediately in every split group", async ({
  page,
}) => {
  const graphArea = page.getByRole("region", { name: "グラフエリア" });
  const pvTab = graphArea.locator(".dv-tab").filter({ hasText: "PV loop" });
  const pressureTab = graphArea
    .locator(".dv-tab")
    .filter({ hasText: "Pressure waveforms" });
  const structuralTab = graphArea
    .locator(".dv-tab")
    .filter({ hasText: "Systemic Guyton / Starling" });

  await expect(pressureTab).toHaveClass(/dv-active-tab/);
  await expect(structuralTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(pressureTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(structuralTab.locator(".workbench-dock-tab"));

  await pvTab.locator(".workbench-dock-tab").click();
  await expect(pvTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(pvTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(structuralTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(pressureTab.locator(".workbench-dock-tab"));

  await structuralTab.locator(".workbench-dock-tab").click();
  await expect(structuralTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(structuralTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(pvTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(pressureTab.locator(".workbench-dock-tab"));

  await pressureTab.locator(".workbench-dock-tab").click();
  await expect(pressureTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(pressureTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(structuralTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(pvTab.locator(".workbench-dock-tab"));
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

  const playbackRateTrigger = page.getByTestId("v3-playback-rate-trigger");
  const saveAction = page.getByTestId("v3-save-experiment");
  const headerActions = [
    page.getByTestId("workbench-simulation-info-trigger-v3"),
    themeToggle,
    page.getByTestId("v3-header-information-playback-separator"),
    playback,
    playbackRateTrigger,
    page.getByTestId("v3-header-playback-authoring-separator"),
    saveAction,
  ];
  const headerActionXs = await Promise.all(headerActions.map(async (action) =>
    (await action.boundingBox())?.x ?? Number.NaN
  ));
  expect(headerActionXs.every(Number.isFinite)).toBe(true);
  expect(headerActionXs).toEqual([...headerActionXs].sort((a, b) => a - b));

  await playbackRateTrigger.click();
  const playbackRatePopover = page.getByTestId("v3-playback-rate-popover");
  await expect(playbackRatePopover).toBeVisible();
  await expect(playbackRateTrigger.locator("svg")).toHaveCount(0);
  await expect(
    playbackRatePopover.getByRole("slider", { name: "再生速度を変更" }),
  ).toBeEnabled();
  expect(await playbackRatePopover.evaluate((popover) => {
    const bounds = popover.getBoundingClientRect();
    const topmost = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + Math.min(24, bounds.height / 2),
    );
    return topmost !== null && popover.contains(topmost);
  })).toBe(true);
  await playbackRatePopover.getByRole("button", {
    name: "0.25×",
    exact: true,
  }).click();
  await expect(playbackRateTrigger).toContainText("0.25×");
  await playbackRateTrigger.click();
  await expect(playbackRatePopover).toBeHidden();

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
  const outputArea = page.getByRole("region", { name: "出力エリア" });
  const areaLayout = page.getByTestId("workbench-area-layout");
  const [outputBox, areaLayoutBox] = await Promise.all([
    outputArea.boundingBox(),
    areaLayout.boundingBox(),
  ]);
  expect(outputBox).not.toBeNull();
  expect(areaLayoutBox).not.toBeNull();
  expect(outputBox!.height / areaLayoutBox!.height).toBeLessThan(0.21);
  const outputGridLayout = await outputArea.locator(".workbench-output-grid")
    .evaluate((grid) => ({
      columnCount: getComputedStyle(grid).gridTemplateColumns
        .split(" ")
        .filter(Boolean).length,
      horizontalOverflowPx: grid.scrollWidth - grid.clientWidth,
    }));
  expect(outputGridLayout.columnCount).toBeGreaterThan(1);
  expect(outputGridLayout.horizontalOverflowPx).toBeLessThanOrEqual(1);

  await openPaneSettings(page, "Pressure waveforms");
  const waveformSettings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(
    waveformSettings.getByRole("heading", { name: "Pressure waveforms" }),
  ).toBeVisible();
  await expect(waveformSettings.getByText("Graph pane", { exact: true }))
    .toBeVisible();
  const waveformWindow = waveformSettings.getByRole("slider", {
    name: "表示時間幅",
  });
  await expect(waveformWindow).toHaveValue("6");
  await waveformWindow.fill("3.5");
  await expect(waveformWindow).toHaveValue("3.5");
  await waveformSettings.getByRole("button", { name: "完了" }).click();
  await expect(waveformSettings).toBeHidden();
  await openPaneSettings(page, "Pressure waveforms");
  await expect(
    page
      .getByRole("dialog", { name: "Pane設定" })
      .getByRole("slider", { name: "表示時間幅" }),
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
  await expect(graphGroups).toHaveCount(3);
  await expect(
    graphArea.getByRole("button", { name: "Paneを追加" }),
  ).toHaveCount(3);
  const groupBounds = await graphGroups.evaluateAll((groups) =>
    groups.map((group) => {
      const bounds = group.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    })
  );
  const topGroups = [...groupBounds].sort((a, b) => a.y - b.y).slice(0, 2);
  const lowerGroup = [...groupBounds].sort((a, b) => b.y - a.y)[0]!;
  expect(Math.abs(topGroups[0]!.y - topGroups[1]!.y)).toBeLessThan(4);
  expect(lowerGroup.y).toBeGreaterThan(topGroups[0]!.y + 20);
  expect(lowerGroup.width).toBeGreaterThan(topGroups[0]!.width * 1.7);
  const structuralTab = graphArea.getByText("Systemic Guyton / Starling", {
    exact: true,
  });
  await expect(structuralTab).toBeVisible();
  await structuralTab.click();
  const structuralDockTab = graphArea
    .locator(".dv-tab")
    .filter({ hasText: "Systemic Guyton / Starling" });
  await expect(structuralDockTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(structuralDockTab.locator(".workbench-dock-tab"));
  const structural = page.locator(
    '[data-chart-kind="guyton-starling-structural-orientation-v3"][data-circulation-side="right"]',
  );
  await expect(structural).toHaveCount(1);
  await expectNonZeroCanvas(structural.first());
  await expect(page.locator(
    '[data-analysis-boundary-status][data-circulation-side="right"]',
  )).toHaveAttribute(
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
  const addGraphMenu = page.getByRole("menu", { name: "Paneを追加" });
  await expect(addGraphMenu.getByRole("menuitem")).toHaveText([
    "PV loop",
    "圧波形",
    "流量波形",
    "体循環 Guyton / Starling（CVP）",
    "肺循環 Guyton / Starling（PCWP）",
  ]);
  await addGraphMenu
    .getByRole("menuitem", { name: "肺循環 Guyton / Starling（PCWP）" })
    .click();
  const pulmonaryTab = graphArea.getByText("Pulmonary Guyton / Starling", {
    exact: true,
  });
  await expect(structuralTab).toBeVisible();
  await expect(pulmonaryTab).toBeVisible();
  await pulmonaryTab.click();
  const pulmonaryDockTab = graphArea
    .locator(".dv-tab")
    .filter({ hasText: "Pulmonary Guyton / Starling" });
  await expect(pulmonaryDockTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(pulmonaryDockTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(structuralDockTab.locator(".workbench-dock-tab"));
  const pulmonaryStructural = page.locator(
    '[data-chart-kind="guyton-starling-structural-orientation-v3"][data-circulation-side="left"]',
  );
  await expect(pulmonaryStructural).toHaveCount(1);
  await expect(page.locator(
    '[data-chart-kind="guyton-starling-structural-orientation-v3"]',
  )).toHaveCount(2);
  expect(
    Number(await pulmonaryStructural.getAttribute("data-pressure-maximum-mmhg")),
  ).toBeLessThan(30);
  await openPaneSettings(page, "Pulmonary Guyton / Starling");
  await expect(
    page
      .getByRole("dialog", { name: "Pane設定" })
      .getByRole("combobox", { name: "表示する循環" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "閉じる" }).click();
  await structuralTab.click();
  await expect(structuralDockTab).toHaveClass(/dv-active-tab/);
  await expectDockTabAccent(structuralDockTab.locator(".workbench-dock-tab"));
  await expectDockTabAccent(pulmonaryDockTab.locator(".workbench-dock-tab"));
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
    name: "体血管抵抗 (SVR)",
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
  await expect(page.locator(
    '[data-analysis-input-epoch][data-circulation-side="right"]',
  )).toHaveAttribute(
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
    name: "心拍数 (HR)",
    exact: true,
  });
  await expect(selectedHeartRate).toBeVisible();
  await settings.getByRole("button", {
    name: "項目を編集: 心拍数 (HR)",
  }).click();
  await settings
    .getByRole("menu", { name: "心拍数 (HR)" })
    .getByRole("menuitem", { name: "Paneから外す" })
    .click();
  await expect(selectedHeartRate).toHaveCount(0);
  await settings.locator(".workbench-pane-add-item").click();
  const catalogDrawer = settings.getByTestId(
    "pane-settings-context-drawer-v3",
  );
  await expect(catalogDrawer).toHaveAttribute("data-open", "true");
  await catalogDrawer.getByRole("searchbox").fill("心拍数");
  await expect(
    catalogDrawer.getByRole("button", { name: "項目を追加: 心拍数 (HR)" }),
  ).toBeVisible();
  await catalogDrawer
    .getByRole("button", { name: "項目を追加: 心拍数 (HR)" })
    .click();
  await expect(catalogDrawer.getByRole("button", {
    name: "項目を編集: 心拍数 (HR)",
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
      .getByRole("button", { name: "心拍数 (HR)", exact: true }),
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
  const allocatedCopyLvp = await copyTraceColors.nth(1).inputValue();
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
  await expect(copyTraceColorsAfterBase.nth(1)).toHaveValue(allocatedCopyLvp);
  await copyTraceColorsAfterBase.nth(1).fill("#00a37a");
  await expect(copyTraceColorsAfterBase.nth(1)).toHaveValue("#00a37a");
  const resetCopyLvp = automaticColors
    .locator("section")
    .nth(1)
    .getByRole("button", {
      name: "自動配色に戻す: LVP",
    });
  await expect(resetCopyLvp).toBeVisible();
  await resetCopyLvp.click();
  await expect(copyTraceColorsAfterBase.nth(1)).toHaveValue(allocatedCopyLvp);
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(colorSettings).toBeHidden();

  const copyScenario = scenarioRegion.getByRole("button", {
    name: "起動時baseline のコピー scenario/workbench-live-default-copy",
    exact: true,
  });
  await expect(copyScenario).toBeVisible();
  const copyEpoch = await inputEpoch(page);
  const systemicResistance = page.getByRole("slider", {
    name: "体血管抵抗 (SVR)",
  });
  await expect(systemicResistance).toBeEnabled({ timeout: 60_000 });
  await systemicResistance.press("ArrowRight");
  await expect.poll(() => inputEpoch(page)).toBeGreaterThan(copyEpoch);
  await expect(systemicResistance).toHaveValue("1.01");

  await page.getByText("PV loop", { exact: true }).click();
  // The edit above invalidates any relation Worker forked for the duplicate's
  // old input epoch. On a one-slot background tier that stale sweep must be
  // cancelled, otherwise it can sit ahead of the current target indefinitely.
  // This is a liveness/epoch assertion; the separate benchmark owns general
  // live-throughput budgets.
  await expect(
    page.locator('[data-chart-kind="pressure-volume-loop-v3"]'),
  ).toHaveAttribute("data-pv-current-relation-trace-count", "2", {
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

test("@desktop deleting nested Scenario copies never renders a disposed lane", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const root = page.getByTestId("v3-dockview-workbench");
  const scenarioRegion = page.getByRole("region", { name: "Scenarios" });
  const labels = [
    "起動時baseline",
    "起動時baseline のコピー",
    "起動時baseline のコピー のコピー",
    "起動時baseline のコピー のコピー のコピー",
  ] as const;

  for (let index = 0; index < labels.length - 1; index += 1) {
    await openScenarioMenu(page, scenarioRegion, labels[index]!);
    await page
      .getByRole("menu", { name: `Scenarioメニュー: ${labels[index]}` })
      .getByRole("menuitem", { name: "複製" })
      .click();
    await expect(scenarioRegion.getByRole("button", {
      name: new RegExp(`^${labels[index + 1]}`),
    })).toBeVisible({ timeout: 30_000 });
  }

  for (let index = labels.length - 1; index > 0; index -= 1) {
    await openScenarioMenu(page, scenarioRegion, labels[index]!);
    await page
      .getByRole("menu", { name: `Scenarioメニュー: ${labels[index]}` })
      .getByRole("menuitem", { name: "削除" })
      .click();
    await expect(scenarioRegion.getByRole("button", {
      name: new RegExp(`^${labels[index]}`),
    })).toHaveCount(0, { timeout: 30_000 });
    await expect(root).toBeVisible();
    await expect(page.getByText("Something went wrong.")).toHaveCount(0);
  }

  expect(pageErrors.filter((message) =>
    message.includes("parallel Scenario not found")
  )).toEqual([]);
});

test("@mobile 390px Workbench uses a live Stage and one-scroll task deck", async ({
  page,
}) => {
  await expect(page.getByTestId("workbench-theme-toggle")).toBeHidden();
  await expect(page.getByRole("button", {
    name: "シミュレーションのメモ",
  })).toHaveCount(0);
  await page.getByTestId("workbench-simulation-info-trigger-v3").click();
  const simulationInfo = page.getByRole("dialog", {
    name: "シミュレーション情報",
  });
  await simulationInfo.getByRole("tab", {
    name: "シミュレーションのメモ",
  }).click();
  await expect(simulationInfo.getByPlaceholder(
    "このシミュレーションの解釈、制限事項、参考文献などを記入…",
  )).toBeVisible();
  await expect(simulationInfo.getByText("制限事項", { exact: false }))
    .toBeVisible();
  await simulationInfo.getByRole("button", { name: "閉じる" }).click();

  const rateTrigger = page.getByTestId("v3-playback-rate-trigger");
  await expect(rateTrigger).toBeVisible();
  await expect(rateTrigger).toContainText("×");
  await rateTrigger.click();
  const ratePopover = page.getByTestId("v3-playback-rate-popover");
  await expect(ratePopover).toBeVisible();
  await expect(
    ratePopover.getByRole("slider", { name: "再生速度を変更" }),
  ).toBeVisible();
  const rateSlider = ratePopover.getByRole("slider", {
    name: "再生速度を変更",
  });
  await expect(rateSlider).toBeEnabled();
  await expect(rateSlider).toHaveAttribute("min", "0.25");
  await expect(rateSlider).toHaveAttribute("step", "0.25");
  await expect(ratePopover.getByRole("button", {
    name: "0.25×",
    exact: true,
  })).toBeVisible();
  await expect(ratePopover.getByRole("button", {
    name: "0.5×",
    exact: true,
  })).toBeVisible();
  await expect(ratePopover.getByRole("button", {
    name: "1×",
    exact: true,
  })).toBeVisible();
  await expect(ratePopover.getByRole("button", {
    name: "2×",
    exact: true,
  })).toBeVisible();
  await expect(ratePopover.getByRole("button", {
    name: "5×",
    exact: true,
  })).toBeVisible();
  const maximumRate = Number(await rateSlider.getAttribute("max"));
  expect(maximumRate).toBeGreaterThanOrEqual(0.25);
  expect(maximumRate).toBeLessThanOrEqual(5);
  expect(maximumRate === 0.25 || Number.isInteger(maximumRate * 2)).toBe(true);

  const initialRate = Number(await rateSlider.inputValue());
  await rateSlider.press("ArrowRight");
  const selectedRate = Math.min(maximumRate, initialRate + 0.25);
  await expect(rateSlider).toHaveValue(String(selectedRate));
  await page.waitForTimeout(500);
  await expect(rateSlider).toHaveValue(String(selectedRate));
  await expect(rateTrigger).toContainText(`${selectedRate}×`);
  const ratePopoverBox = await ratePopover.boundingBox();
  expect(ratePopoverBox?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect(
    (ratePopoverBox?.x ?? 0) + (ratePopoverBox?.width ?? 391),
  ).toBeLessThanOrEqual(390);
  await page.getByTestId("v3-playback-rate-backdrop").click();
  await expect(ratePopover).toBeHidden();

  const mobileShell = page.getByTestId("workbench-mobile-stage-deck");
  const graphArea = page.getByTestId("workbench-mobile-stage");
  const taskDeck = page.getByTestId("workbench-mobile-task-deck");
  const taskScroll = page.getByTestId("workbench-mobile-task-scroll");
  await expect(mobileShell).toBeVisible();
  await expect(graphArea).toBeVisible();
  await expect(taskDeck).toBeVisible();
  await expect(mobileShell.locator(".dv-groupview")).toHaveCount(0);
  await expect.poll(() => taskScroll.evaluate((element) =>
    getComputedStyle(element).overflowY)).toBe("auto");
  const graphBox = await graphArea.boundingBox();
  expect(graphBox?.width ?? 0).toBeGreaterThan(360);
  const graphRail = page.getByTestId("workbench-mobile-graph-view-rail");
  const graphTabs = graphRail.getByRole("tab");
  await expect(graphTabs).toHaveCount(3);
  await expect(graphRail.getByRole("tab", { name: "PV loop" }))
    .toHaveAttribute("aria-selected", "true");
  const pressureTab = graphRail.getByRole("tab", {
    name: "Pressure waveforms",
  });
  await pressureTab.click();
  await expect(pressureTab).toHaveAttribute("aria-selected", "true");
  await expectNonZeroCanvas(
    page.locator('[data-chart-kind="sweeping-waveform-v3"]'),
  );
  await pressureTab.press("ArrowLeft");
  await expect(graphTabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await pressureTab.click();
  const addGraphView = graphRail.getByRole("button", {
    name: "グラフビューを追加",
  });
  await addGraphView.click();
  const graphAddSheet = page.getByRole("dialog", { name: "グラフを追加" });
  await expect(graphAddSheet).toBeVisible();
  await expect(
    graphAddSheet.locator(".workbench-mobile-pane-choice"),
  ).toHaveCount(5);
  await graphAddSheet.getByRole("button", { name: "追加メニューを閉じる" })
    .click();
  await expect(graphAddSheet).toBeHidden();
  await expect(addGraphView).toBeFocused();

  await expect(taskDeck.getByRole("tab", { name: "コントロール" }))
    .toHaveAttribute("aria-selected", "true");
  const controlGroup = taskDeck.locator(
    '[data-mobile-pane-group-role="control"]',
  ).first();
  const controlGroupToggle = controlGroup.locator("button[aria-expanded]");
  await expect(controlGroupToggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("slider", { name: "体血管抵抗 (SVR)" }),
  ).toBeVisible();
  await controlGroupToggle.click();
  await expect(controlGroupToggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("slider", { name: "体血管抵抗 (SVR)" }),
  ).toBeHidden();
  await controlGroupToggle.click();
  await graphRail.getByRole("button", { name: "グラフを拡大" }).click();
  await expect(mobileShell).toHaveAttribute("data-graph-focused", "true");
  await expect(taskScroll).toHaveCount(0);
  await taskDeck.getByRole("tab", { name: "出力" }).click();
  await expect(mobileShell).toHaveAttribute("data-graph-focused", "false");
  const outputGroup = taskDeck.locator(
    '[data-mobile-pane-group-role="output"]',
  ).first();
  const outputGroupToggle = outputGroup.locator("button[aria-expanded]");
  await expect(outputGroupToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("大動脈圧 (AoP)", { exact: true }))
    .toBeVisible();
  await outputGroupToggle.click();
  await expect(page.getByText("大動脈圧 (AoP)", { exact: true }))
    .toBeHidden();
  await outputGroupToggle.click();
  await taskDeck.getByRole("tab", { name: "Scenario" }).click();
  await expect(
    taskDeck.getByTestId("workbench-scenario-manager-v3"),
  ).toHaveAttribute("data-scenario-manager-variant", "embedded-mobile");
  await taskDeck.getByRole("tab", { name: "コントロール" }).click();
  await taskDeck.locator(".workbench-mobile-pane-group-settings").first()
    .click();
  const settings = page.getByRole("dialog", { name: "Pane設定" });
  await expect(settings).toBeVisible();
  await expect(
    settings.getByRole("heading", { name: "このPaneの項目" }),
  ).toBeVisible();
  await expect(
    settings.getByRole("button", { name: /項目を並べ替え:/ }),
  ).toHaveCount(8);
  await expect(
    settings.getByRole("button", { name: /Paneから外す:/ }),
  ).toHaveCount(0);
  await settings.locator(".workbench-pane-add-item").click();
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
  await expect(catalogDrawer.getByText("循環動態", { exact: true }))
    .toBeVisible();
  await expect(catalogDrawer.getByText("心筋・心室力学", { exact: true }))
    .toBeVisible();
  await catalogDrawer.getByRole("button", { name: "パネルを閉じる" }).click();
  await expect(catalogDrawerHost).toHaveAttribute("data-open", "false");
  await expect.poll(async () =>
    (await catalogDrawerHost.boundingBox())?.width ?? 0
  ).toBeLessThan(1);
  await settings.getByRole("button", {
    name: "心拍数 (HR)",
    exact: true,
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

async function expectDockTabAccent(tab: Locator): Promise<void> {
  await expect(tab).toBeVisible();
  await expect.poll(() => tab.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return style.content !== "none" &&
      style.backgroundColor !== "transparent" &&
      style.backgroundColor !== "rgba(0, 0, 0, 0)";
  })).toBe(true);
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
