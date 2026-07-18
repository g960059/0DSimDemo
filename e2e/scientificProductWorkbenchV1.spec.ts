import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const OFFICIAL_PRODUCT_CASE_ID = "circleheart/official-healthy-periodic";
const RELEASE_SHA256 =
  "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4";
const HEALTHY_SCENARIO_NAME = "Healthy periodic baseline";
const ADDED_HEALTHY_SCENARIO_NAME = "Healthy periodic baseline 2";
const COMPARISON_SCENARIO_NAME = "Comparison scenario";
const LA_PV_TITLE = "Left atrium pressure-volume loop";
const FOUR_VALVE_FLOW_TITLE = "Four-valve flow";

test.describe.serial("scientific runtime in the product Workbench shell", () => {
  test("keeps the original pane UX and renders full-pane animated scientific charts", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      await acknowledgeModelLimitations(page);
      const { host, evidence } = await openReadyProductWorkbench(page);

      await expect(host).toHaveAttribute(
        "data-product-case-id",
        OFFICIAL_PRODUCT_CASE_ID,
      );
      await expect(host).toHaveAttribute(
        "data-release-id",
        "circleheart/adult-five-wall-noncoronary",
      );
      await expect(host).toHaveAttribute("data-release-version", "0.2.0");
      await expect(host).toHaveAttribute("data-release-sha256", RELEASE_SHA256);
      await expect(host).toHaveAttribute("data-scenario-count", "1");
      await expect(evidence).toHaveAttribute("data-scientific-frame-count", "501");

      // Product routing preserves the established free-form Workbench shell;
      // it does not reuse the vertically stacked research page.
      await expect(host.locator(".workbench-header")).toHaveCount(1);
      await expect(host.locator(".workbench-dockview")).toHaveCount(1);
      await expect(page.getByTestId("scientific-workbench-page-v1"))
        .toHaveCount(0);
      await expect(page.getByTestId("product-workbench-page-v1"))
        .toHaveCount(0);
      await expect(page.getByRole("button", { name: "ケースを保存" }))
        .toBeDisabled();
      await page.getByRole("button", {
        name: "ワークベンチパネルを開く",
      }).click();
      await page.getByRole("button", { name: "ファイル", exact: true }).click();
      await expect(page.getByText("旧ケースファイルを暗黙に変換しません", {
        exact: false,
      })).toBeVisible();
      await expect(page.getByRole("button", { name: "書き出し" }))
        .toBeDisabled();
      await expect(page.getByRole("button", { name: "読み込み" }))
        .toBeDisabled();
      await page.getByRole("button", { name: "パネルを閉じる" }).click();

      await assertWaveformSweepAndFullPaneSizing(page);
      await assertPvCapAndHeaderPause(page);
      await exerciseAddAndDelete(page);
      await exerciseSplitDuplicateAndDelete(page);
      await assertDerivedMetrics(page);
      await assertNoteAuthoredViewEmbeds(page);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });

  test("links independent scenarios to overlays, pane membership, inspector, and transitions", async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      await acknowledgeModelLimitations(page);
      const { host, evidence } = await openReadyProductWorkbench(page);
      const rail = page.getByRole("region", { name: "シナリオレール" });
      await expect(rail).toBeVisible();

      const originalScenarioId = requiredAttribute(
        await evidence.getAttribute("data-scenario-id"),
        "initial scenario id",
      );
      const originalRevision = numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      );

      // Add from the release-bound scientific preset catalog, not from the
      // legacy baseline catalog, and give the independent session a clear name.
      await page.getByRole("button", { name: "シナリオを追加" }).click();
      const presetMenu = page.locator(".workbench-popover-menu");
      await expect(presetMenu).toBeVisible();
      await presetMenu.getByRole("button")
        .filter({ hasText: HEALTHY_SCENARIO_NAME })
        .click();
      await expect(host).toHaveAttribute("data-scenario-count", "2");

      const addedHealthyRow = scenarioRow(rail, ADDED_HEALTHY_SCENARIO_NAME);
      await expect(addedHealthyRow).toBeVisible();
      await addedHealthyRow.dblclick();
      const scenarioNameInput = rail.getByPlaceholder("シナリオ名");
      await expect(scenarioNameInput).toBeVisible();
      await scenarioNameInput.fill(COMPARISON_SCENARIO_NAME);
      await scenarioNameInput.press("Enter");
      const comparisonRow = scenarioRow(rail, COMPARISON_SCENARIO_NAME);
      await expect(comparisonRow).toBeVisible();

      const comparisonScenarioId = requiredAttribute(
        await evidence.getAttribute("data-scenario-id"),
        "comparison scenario id",
      );
      expect(comparisonScenarioId).not.toBe(originalScenarioId);

      // The active controller inspector follows the active scenario and waits
      // for that scenario's own Worker/control owner to become ready.
      const controller = page.getByTestId("scientific-transition-controller-v1");
      await expect(controller).toHaveAttribute(
        "data-controller-scenario-id",
        comparisonScenarioId,
        { timeout: 120_000 },
      );
      await expect(controller).toHaveAttribute("data-owner-connected", "true");

      await dockTab(page, LA_PV_TITLE).click();
      const laLegend = visibleChartLegend(page);
      await expect(laLegend).toContainText(
        `${COMPARISON_SCENARIO_NAME} (Left atrium)`,
        { timeout: 120_000 },
      );
      await expect(laLegend).toContainText(
        `${HEALTHY_SCENARIO_NAME} (Left atrium)`,
      );

      // Global visibility gates the scenario across graphs.
      await exactButton(page, `${COMPARISON_SCENARIO_NAME}をグラフで非表示`)
        .click();
      await expect(laLegend).not.toContainText(COMPARISON_SCENARIO_NAME);
      await exactButton(page, `${COMPARISON_SCENARIO_NAME}をグラフに表示`)
        .click();
      await expect(laLegend).toContainText(COMPARISON_SCENARIO_NAME);

      // Pane membership is local to the authored graph: excluding the
      // comparison from LA PV must not hide it from Four-valve flow.
      await page.getByRole("button", {
        name: `${LA_PV_TITLE}のペインメニュー`,
      }).click();
      await page.getByRole("menuitem", { name: "ペイン設定" }).click();
      const membership = page.getByRole("checkbox", {
        name: `${COMPARISON_SCENARIO_NAME}をこのペインに含める`,
      });
      await expect(membership).toBeChecked();
      await membership.uncheck();
      await page.getByRole("button", { name: "ペイン設定を閉じる" }).click();
      await expect(laLegend).not.toContainText(COMPARISON_SCENARIO_NAME);

      await dockTab(page, FOUR_VALVE_FLOW_TITLE).click();
      await expect(visibleChartLegend(page)).toContainText(
        `${COMPARISON_SCENARIO_NAME} (MV flow)`,
      );

      // Duplicate and delete own independent lifecycle handles. Deleting a
      // loading duplicate is also required to terminate its Worker cleanly.
      await exactButton(page, `${COMPARISON_SCENARIO_NAME}の操作`).click();
      await page.getByRole("button", { name: "複製", exact: true }).click();
      await expect(host).toHaveAttribute("data-scenario-count", "3");
      const copyName = `${COMPARISON_SCENARIO_NAME} copy`;
      await expect(scenarioRow(rail, copyName)).toBeVisible();
      await exactButton(page, `${copyName}の操作`).click();
      await page.getByRole("button", { name: "削除", exact: true }).click();
      await expect(host).toHaveAttribute("data-scenario-count", "2");
      await expect(scenarioRow(rail, copyName)).toHaveCount(0);

      // A steady promotion and a live transient only mutate the selected
      // comparison session. The original scenario retains its revision.
      await comparisonRow.click();
      await expect(evidence).toHaveAttribute(
        "data-scenario-id",
        comparisonScenarioId,
      );
      const comparisonRevision = numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      );
      await selectControllerScale(
        controller,
        "Systemic vascular resistance",
        "1.33×",
      );
      await controller.getByRole("button", { name: "Next steady state" }).click();
      await controller.getByRole("button", { name: "Apply", exact: true }).click();
      await expect(controller).toHaveAttribute(
        "data-displayed-evidence",
        "target-period1-and-following-cycle-validated",
        { timeout: 120_000 },
      );
      await expect(controller).toHaveAttribute("data-phase", "idle");
      await expect.poll(async () => numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      )).toBeGreaterThan(comparisonRevision);
      const steadyRevision = numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      );

      await scenarioRow(rail, HEALTHY_SCENARIO_NAME).click();
      await expect(evidence).toHaveAttribute("data-scenario-id", originalScenarioId);
      await expect(evidence).toHaveAttribute(
        "data-scientific-final-revision",
        String(originalRevision),
      );
      await expect(controller).toHaveAttribute(
        "data-controller-scenario-id",
        originalScenarioId,
      );

      await comparisonRow.click();
      await expect(controller).toHaveAttribute(
        "data-controller-scenario-id",
        comparisonScenarioId,
      );
      await selectControllerScale(
        controller,
        "Pulmonary vascular resistance",
        "0.75×",
      );
      await controller.getByRole("button", { name: "Live transition" }).click();
      await controller.getByRole("button", { name: "Apply", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "live-running", {
        timeout: 30_000,
      });
      await expect.poll(async () => numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      )).toBeGreaterThan(steadyRevision);
      await controller.getByRole("button", { name: "Pause", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await expect(controller).toHaveAttribute(
        "data-displayed-evidence",
        "open-transient-no-periodic-claim",
      );
      await controller.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "idle");

      await scenarioRow(rail, HEALTHY_SCENARIO_NAME).click();
      await expect(evidence).toHaveAttribute(
        "data-scientific-final-revision",
        String(originalRevision),
      );

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });

  test("authors, edits, selects, and deletes a compact controller subset", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      await acknowledgeModelLimitations(page);
      await openReadyProductWorkbench(page);
      const rail = page.getByRole("region", { name: "シナリオレール" });
      const controller = page.getByTestId("scientific-transition-controller-v1");
      await expect(controller).toContainText("Systemic vascular resistance");
      await expect(controller).toContainText("Pulmonary vascular resistance");

      const initialViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "Circulation controls",
      );
      await initialViewMenu.getByRole("button", {
        name: "新規コントローラー",
      }).click();
      const createDialog = page.getByRole("dialog", {
        name: "コントローラービュー",
      });
      await expect(createDialog).toBeVisible();
      const selectedControlRemovers = createDialog.getByRole("button", {
        name: "コントロールを削除",
      });
      await expect(selectedControlRemovers).toHaveCount(2);
      await selectedControlRemovers.last().click();
      await expect(selectedControlRemovers).toHaveCount(1);
      await createDialog.getByLabel("名前").fill("SVR only");
      await createDialog.getByRole("button", { name: "完了" }).click();

      await expect(controllerViewSelector(rail, "SVR only")).toBeVisible();
      await expect(controller).toContainText("Systemic vascular resistance");
      await expect(controller).not.toContainText("Pulmonary vascular resistance");

      // Editing preserves the subset and changes the document-level view name.
      const editViewMenu = await ensureControllerViewMenuOpen(rail, "SVR only");
      const svrOnlyEntry = editViewMenu.getByRole("button", {
        name: "SVR only",
        exact: true,
      });
      await svrOnlyEntry.locator("..").locator('button[aria-label="編集"]')
        .click();
      const editDialog = page.getByRole("dialog", {
        name: "コントローラービュー",
      });
      await editDialog.getByLabel("名前").fill("SVR focused");
      await editDialog.getByRole("button", { name: "完了" }).click();
      await expect(controllerViewSelector(rail, "SVR focused")).toBeVisible();
      await expect(controller).not.toContainText("Pulmonary vascular resistance");

      // Deleting the authored subset returns the inspector to the remaining
      // standard view rather than leaving a dangling controller reference.
      const deleteViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "SVR focused",
      );
      const focusedEntry = deleteViewMenu.getByRole("button", {
        name: "SVR focused",
        exact: true,
      });
      await focusedEntry.locator("..").locator('button[aria-label="削除"]')
        .click();
      const deleteDialog = page.getByRole("dialog", { name: "ビューを削除" });
      await expect(deleteDialog).toBeVisible();
      await deleteDialog.getByRole("button", { name: "削除", exact: true }).click();
      await expect(controllerViewSelector(rail, "Circulation controls"))
        .toBeVisible();
      await expect(controller).toContainText("Pulmonary vascular resistance");

      // An intentionally empty authored view stays empty. The runtime must not
      // reinterpret an empty item list as a request for the standard controls.
      const emptyViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "Circulation controls",
      );
      await emptyViewMenu.getByRole("button", {
        name: "新規コントローラー",
      }).click();
      const emptyDialog = page.getByRole("dialog", {
        name: "コントローラービュー",
      });
      const emptyViewRemovers = emptyDialog.getByRole("button", {
        name: "コントロールを削除",
      });
      await expect(emptyViewRemovers).toHaveCount(2);
      await emptyViewRemovers.last().click();
      await expect(emptyViewRemovers).toHaveCount(1);
      await emptyViewRemovers.last().click();
      await expect(emptyViewRemovers).toHaveCount(0);
      await emptyDialog.getByLabel("名前").fill("Empty controller");
      await emptyDialog.getByRole("button", { name: "完了" }).click();

      await expect(controllerViewSelector(rail, "Empty controller"))
        .toBeVisible();
      await expect(page.getByText("No controller items", { exact: true }))
        .toBeVisible();
      await expect(controller).toHaveCount(0);
      await expect(page.getByText("Systemic vascular resistance", {
        exact: true,
      })).toHaveCount(0);
      await expect(page.getByText("Pulmonary vascular resistance", {
        exact: true,
      })).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });

  test("keeps the research workbench as a separate development surface", async ({
    page,
  }, testInfo) => {
    const browserErrors = captureBrowserErrors(page);

    try {
      await page.goto("/ja/scientific-workbench", {
        waitUntil: "domcontentloaded",
      });

      const researchPage = page.getByTestId("scientific-workbench-page-v1");
      await expect(researchPage).toBeVisible();
      await expect(researchPage).toContainText(
        "Scientific runtime · document-bound preview",
      );
      await expect(page.getByTestId("scientific-workbench-case-selector-v1"))
        .toBeVisible();
      await expect(page.getByTestId("scientific-product-workbench-host-v1"))
        .toHaveCount(0);
      await expect(page.locator(".workbench-root")).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });

  test("fails closed for a case outside the release-bound catalog", async ({
    page,
  }, testInfo) => {
    const browserErrors = captureBrowserErrors(page);

    try {
      await page.goto("/ja/workbench/not-a-release-bound-case", {
        waitUntil: "domcontentloaded",
      });

      const unsupported = page.getByTestId(
        "product-workbench-unsupported-case-v1",
      );
      await expect(unsupported).toBeVisible();
      await expect(unsupported).toContainText("Unsupported scientific case");
      await expect(unsupported).toContainText(
        "Legacy parameters are not translated silently",
      );
      await expect(page.getByTestId("scientific-product-workbench-host-v1"))
        .toHaveCount(0);
      await expect(page.locator(".workbench-root")).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });
});

async function openReadyProductWorkbench(page: Page): Promise<{
  host: Locator;
  evidence: Locator;
}> {
  await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });
  const host = page.getByTestId("scientific-product-workbench-host-v1");
  const evidence = page.getByTestId("scientific-product-frame-evidence-v1");
  await expect(host).toBeVisible({ timeout: 120_000 });
  await expect(host).toHaveClass(/workbench-root/);
  await expect(evidence).toHaveAttribute("data-scientific-frame-count", "501");
  return { host, evidence };
}

async function assertWaveformSweepAndFullPaneSizing(page: Page): Promise<void> {
  await dockTab(page, FOUR_VALVE_FLOW_TITLE).click();
  const pane = page.getByTestId("scientific-workbench-pane-four-valve-flow");
  const wrapper = pane.getByTestId("scientific-workbench-waveform-canvas-v1");
  const canvas = wrapper.locator('canvas[data-chart-kind="waveform"]');
  await expect(wrapper).toBeVisible();
  await expect(canvas).toHaveAttribute("data-cursor", /\d/);
  await expect(canvas).toHaveAttribute("data-cap-x", /\d/);
  await assertCanvasFillsPane(canvas, wrapper, pane);

  const legend = wrapper.getByTestId("scientific-workbench-chart-legend-v1");
  await expect(legend).toBeVisible();
  await expect(legend).toContainText(
    `${HEALTHY_SCENARIO_NAME} (MV flow)`,
  );
  const legendLabels = await legend.locator(":scope > span").allTextContents();
  expect(legendLabels.length).toBeGreaterThan(0);
  expect(legendLabels.every((label) =>
    /^Healthy periodic baseline \([^)]+\)$/.test(label.trim())))
    .toBe(true);
  await expect(legend).not.toContainText(/authoritative-state|accepted-derived|\d+\/\d+/i);

  const playing = await canvasEvidence(canvas);
  await expect.poll(async () => {
    const current = await canvasEvidence(canvas);
    return canvasEvidenceDistance(current, playing);
  }).toBeGreaterThan(0.5);
}

async function assertPvCapAndHeaderPause(page: Page): Promise<void> {
  // Pause the shared presentation clock while a waveform is mounted.
  await page.getByRole("button", { name: "一時停止" }).click();
  await expect(page.getByRole("button", { name: "再生" })).toBeVisible();

  const waveform = page.locator('canvas[data-chart-kind="waveform"]:visible');
  await expect(waveform).toHaveAttribute("data-cursor", /\d/);
  await assertCanvasEvidenceFreezes(waveform);

  // The PV loop uses the same clock and moving cap contract.
  await dockTab(page, LA_PV_TITLE).click();
  const pane = page.getByTestId("scientific-workbench-pane-la-pv");
  const wrapper = pane.getByTestId("scientific-workbench-pv-canvas-v1");
  const canvas = wrapper.locator('canvas[data-chart-kind="pvloop"]');
  await expect(wrapper).toBeVisible();
  await expect(canvas).toHaveAttribute("data-cap-x", /\d/);
  await assertCanvasFillsPane(canvas, wrapper, pane);
  await expect(wrapper.getByTestId("scientific-workbench-chart-legend-v1"))
    .toContainText(`${HEALTHY_SCENARIO_NAME} (Left atrium)`);
  await assertCanvasEvidenceFreezes(canvas);

  await page.getByRole("button", { name: "再生" }).click();
  await expect(page.getByRole("button", { name: "一時停止" })).toBeVisible();
  const resumed = await canvasEvidence(canvas);
  await expect.poll(async () => {
    const current = await canvasEvidence(canvas);
    return canvasEvidenceDistance(current, resumed);
  }).toBeGreaterThan(0.5);
}

async function assertCanvasFillsPane(
  canvas: Locator,
  wrapper: Locator,
  pane: Locator,
): Promise<void> {
  const boxes = await Promise.all([
    canvas.boundingBox(),
    wrapper.boundingBox(),
    pane.boundingBox(),
  ]);
  const [canvasBox, wrapperBox, paneBox] = boxes;
  expect(canvasBox).not.toBeNull();
  expect(wrapperBox).not.toBeNull();
  expect(paneBox).not.toBeNull();
  expect(canvasBox!.width).toBeGreaterThan(240);
  expect(canvasBox!.height).toBeGreaterThan(100);
  expect(Math.abs(canvasBox!.width - wrapperBox!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(canvasBox!.height - wrapperBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(wrapperBox!.width - paneBox!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(wrapperBox!.height - paneBox!.height)).toBeLessThanOrEqual(1);
  await expect(canvas).toHaveAttribute(
    "data-css-width",
    String(Math.floor(canvasBox!.width)),
  );
  await expect(canvas).toHaveAttribute(
    "data-css-height",
    String(Math.floor(canvasBox!.height)),
  );
}

async function assertCanvasEvidenceFreezes(canvas: Locator): Promise<void> {
  await pageDelay(canvas.page(), 80);
  const before = await canvasEvidence(canvas);
  await pageDelay(canvas.page(), 220);
  expect(await canvasEvidence(canvas)).toEqual(before);
}

async function exerciseAddAndDelete(page: Page): Promise<void> {
  const tabs = page.locator(".workbench-dock-tab");
  const initialTabCount = await tabs.count();

  await page.getByRole("button", { name: "メインペインを追加" }).first().click();
  await page.getByRole("button", { name: "波形", exact: true }).click();

  await expect.poll(() => tabs.count()).toBe(initialTabCount + 1);
  await expect(dockTab(page, "Waveforms")).toHaveCount(1);
  const addedPane = page.locator(
    '[data-testid^="scientific-workbench-pane-"][data-panel-kind="time-series"]:visible',
  );
  await expect(addedPane).toBeVisible();
  await expect(addedPane.getByTestId("scientific-workbench-waveform-canvas-v1"))
    .toBeVisible();

  await page.getByRole("button", { name: "Waveformsを閉じる" }).click();
  await expect.poll(() => tabs.count()).toBe(initialTabCount);
  await expect(dockTab(page, "Waveforms")).toHaveCount(0);
}

async function exerciseSplitDuplicateAndDelete(page: Page): Promise<void> {
  await dockTab(page, LA_PV_TITLE).click();
  const visibleScientificPanes = page.locator(
    '[data-testid^="scientific-workbench-pane-"]:visible',
  );
  const initialVisiblePaneCount = await visibleScientificPanes.count();
  const mainDockview = page.locator(".workbench-dockview").first();
  const initialGroupCount = await mainDockview.locator(".dv-groupview").count();

  await page.getByRole("button", {
    name: `${LA_PV_TITLE}のペインメニュー`,
  }).click();
  await page.getByRole("menuitem", { name: "右に分割" }).click();

  const duplicatedPane = page.locator(
    '[data-testid^="scientific-workbench-pane-la-pv-"]',
  );
  await expect(duplicatedPane).toBeVisible();
  await expect(duplicatedPane.getByTestId("scientific-workbench-pv-canvas-v1"))
    .toBeVisible();
  await expect.poll(() => visibleScientificPanes.count())
    .toBe(initialVisiblePaneCount + 1);
  await expect.poll(() => mainDockview.locator(".dv-groupview").count())
    .toBeGreaterThan(initialGroupCount);

  const duplicatedGroup = duplicatedPane.locator(
    "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' dv-groupview ')][1]",
  );
  await duplicatedGroup.getByRole("button", {
    name: `${LA_PV_TITLE}を閉じる`,
  }).click();
  await expect(duplicatedPane).toHaveCount(0);
  await expect.poll(() => visibleScientificPanes.count())
    .toBe(initialVisiblePaneCount);
}

async function assertDerivedMetrics(page: Page): Promise<void> {
  const metricsHost = page.getByRole("region", { name: "指標ホスト" });
  if (!(await metricsHost.isVisible())) {
    await page.getByRole("button", {
      name: "指標ホストの表示を切り替え",
    }).click();
  }
  await expect(metricsHost).toBeVisible();

  const metrics = page.getByTestId("scientific-workbench-metrics-v1");
  await expect(metrics).toBeVisible();
  const cards = metrics.locator("article[data-metric-id]");
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  expect(await cards.evaluateAll((nodes) => nodes.map((node) => ({
    metricId: node.getAttribute("data-metric-id"),
    availability: node.getAttribute("data-availability"),
    text: node.textContent ?? "",
  })))).toEqual(expect.arrayContaining([
    expect.objectContaining({ availability: "available" }),
  ]));
  expect(await cards.evaluateAll((nodes) => nodes.every(
    (node) => node.getAttribute("data-availability") === "available"
      && !(node.textContent ?? "").includes("—"),
  ))).toBe(true);
}

async function assertNoteAuthoredViewEmbeds(page: Page): Promise<void> {
  const authoredViews = [
    {
      id: "la-pv",
      kind: "graph",
      title: LA_PV_TITLE,
      bodyTestId: "scientific-workbench-pv-canvas-v1",
    },
    {
      id: "scientific-controller-standard-v1",
      kind: "controller",
      title: "Circulation controls",
      bodyTestId: "scientific-transition-controller-v1",
    },
    {
      id: "scientific-metrics-pressure-v1",
      kind: "metrics",
      title: "Pressures",
      bodyTestId: "scientific-workbench-metrics-v1",
    },
  ] as const;

  for (const [index, view] of authoredViews.entries()) {
    // Each fresh document starts with one empty BlockNote paragraph. Keeping
    // the three authored-view insertions independent avoids relying on editor
    // cursor behavior after a non-editable custom block is inserted.
    if (index > 0) await openReadyProductWorkbench(page);
    await insertAuthoredViewReferenceIntoNote(page, view);
  }
}

async function insertAuthoredViewReferenceIntoNote(
  page: Page,
  view: Readonly<{
    id: string;
    kind: "graph" | "controller" | "metrics";
    title: string;
    bodyTestId: string;
  }>,
): Promise<void> {
  await page.getByRole("button", {
    name: "ノートドロワーの表示を切り替え",
  }).click();
  const noteDrawer = page.getByRole("region", { name: "ノートドロワー" });
  await expect(noteDrawer).toBeVisible();
  await expect(noteDrawer.getByRole("button", {
    name: "プレビューに切り替え",
  })).toBeVisible();

  const editor = noteDrawer.locator('.bn-editor[contenteditable="true"]');
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.type("/");

  const authoredViewOption = page.getByRole("option").filter({
    hasText: view.title,
  });
  await expect(authoredViewOption).toBeVisible();
  await authoredViewOption.click();

  const embeddedView = noteDrawer.locator(
    `figure[data-authored-view-id="${view.id}"][data-authored-view-kind="${view.kind}"]`,
  );
  await expect(embeddedView).toBeVisible();
  await expect(embeddedView).toContainText(view.title);
  await expect(embeddedView.getByTestId(view.bodyTestId)).toBeVisible();
}

async function selectControllerScale(
  controller: Locator,
  controlName: string,
  optionName: string,
): Promise<void> {
  const group = controller.getByRole("group", { name: controlName });
  await expect(group).toBeVisible();
  const option = group.getByRole("button", { name: optionName, exact: true });
  await option.click();
  await expect(option).toHaveAttribute("aria-pressed", "true");
}

function controllerViewSelector(rail: Locator, title: string): Locator {
  return rail.locator('button[aria-expanded="true"], button[aria-expanded="false"]')
    .filter({ hasText: title });
}

function controllerViewMenu(rail: Locator): Locator {
  return rail.locator("div.absolute.left-2.right-2.top-10.z-40");
}

async function ensureControllerViewMenuOpen(
  rail: Locator,
  selectedTitle: string,
): Promise<Locator> {
  const menu = controllerViewMenu(rail);
  if (!(await menu.isVisible())) {
    await controllerViewSelector(rail, selectedTitle).click();
  }
  await expect(menu).toBeVisible();
  return menu;
}

function visibleChartLegend(page: Page): Locator {
  return page.getByTestId("scientific-workbench-chart-legend-v1").filter({
    visible: true,
  });
}

function exactButton(page: Page, ariaLabel: string): Locator {
  return page.locator(`button[aria-label="${ariaLabel}"]`);
}

function scenarioRow(rail: Locator, name: string): Locator {
  return rail.locator('div[role="button"]').filter({
    hasText: new RegExp(`^\\s*${escapeRegExp(name)}(?:\\s*非表示)?\\s*$`),
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dockTab(page: Page, title: string): Locator {
  return page.locator(".workbench-dock-tab").filter({ hasText: title });
}

type CanvasEvidence = Readonly<{
  cursor: number;
  capX: number;
  capY: number;
}>;

async function canvasEvidence(canvas: Locator): Promise<CanvasEvidence> {
  return canvas.evaluate((node) => {
    const cursor = Number(node.dataset.cursor);
    const capX = Number(node.dataset.capX);
    const capY = Number(node.dataset.capY);
    if (![cursor, capX, capY].every(Number.isFinite)) {
      throw new Error(
        `expected finite canvas evidence, received ${node.dataset.cursor}/${node.dataset.capX}/${node.dataset.capY}`,
      );
    }
    return { cursor, capX, capY };
  });
}

function canvasEvidenceDistance(
  left: CanvasEvidence,
  right: CanvasEvidence,
): number {
  return Math.hypot(left.capX - right.capX, left.capY - right.capY)
    + Math.abs(left.cursor - right.cursor);
}

async function pageDelay(page: Page, durationMs: number): Promise<void> {
  await page.evaluate((duration) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  }), durationMs);
}

function requiredAttribute(value: string | null, label: string): string {
  if (value === null || value.trim() === "") {
    throw new Error(`expected ${label} attribute`);
  }
  return value;
}

function numericAttribute(value: string | null): number {
  const numeric = Number(value);
  if (value === null || value.trim() === "" || !Number.isFinite(numeric)) {
    throw new Error(`expected finite numeric attribute, received ${String(value)}`);
  }
  return numeric;
}

async function acknowledgeModelLimitations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
}

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (
      message.type() === "error"
      && message.text() !== "Please check your Firebase configuration."
    ) {
      errors.push(`console.error: ${message.text()}`);
    }
  });
  return errors;
}

async function attachBrowserErrors(
  testInfo: TestInfo,
  browserErrors: readonly string[],
): Promise<void> {
  await testInfo.attach("browser-errors.txt", {
    body: Buffer.from(browserErrors.join("\n") || "none"),
    contentType: "text/plain",
  });
}
