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
const COMPARISON_SCENARIO_NAME =
  "Comparison scenario with a deliberately long title that must remain inside the narrow right rail without covering its controller controls";
const LV_PV_TITLE = "LV pressure–volume loop";
const LEFT_PRESSURE_TITLE = "AoP / LVP / LAP";
const MITRAL_FLOW_TITLE = "Mitral valve flow (MVF)";
const FUTURE_SCIENTIFIC_CONTROLS = [
  "Heart rate",
  "Total blood volume",
  "LV contractility",
  "RV contractility",
  "Atrial contractility",
  "Ventricular relaxation",
  "Valve effective orifice area",
] as const;
const WIRED_SCIENTIFIC_CONTROLS = [
  "Systemic resistance scale",
  "Pulmonary resistance scale",
  "Venous tone",
  "Arterial PV stiffness",
  "PEEP boundary",
  "Pericardial occupancy",
] as const;
const SCIENTIFIC_CONTROL_DESCRIPTION_PATTERNS = Object.freeze({
  "Systemic resistance scale": /grouped systemic-circulation resistance edges/,
  "Pulmonary resistance scale": /not PVR in Wood units/,
  "Venous tone": /unstressed volume/,
  "Arterial PV stiffness": /pressure–volume stiffness coefficients/,
  "PEEP boundary": /static positive airway-pressure boundary/,
  "Pericardial occupancy": /fixed pericardial occupancy volume/,
} satisfies Readonly<Record<(typeof WIRED_SCIENTIFIC_CONTROLS)[number], RegExp>>);

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
      await expect(host.locator(".workbench-dockview")).toHaveCount(2);
      await expect(host.locator(".workbench-dockview-main")).toHaveCount(1);
      await expect(host.locator(".workbench-dockview-metrics")).toHaveCount(1);
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

      await assertDefaultScientificLayout(page);
      await assertLegendAndPaneSettingsInteractions(page);
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

  test(
    "links independent scenarios to overlays, pane membership, inspector, and transitions",
    { tag: "@full-e2e" },
    async ({ page }, testInfo) => {
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

      const metricGroups = page.getByTestId("scientific-metrics-scenario-v1");
      await expect(metricGroups).toHaveCount(2);
      await expect(page.getByTestId("scientific-workbench-metrics-v1")
        .getByRole("heading", { name: HEALTHY_SCENARIO_NAME, exact: true }))
        .toHaveCount(1);
      await expect(page.getByTestId("scientific-workbench-metrics-v1")
        .getByRole("heading", { name: COMPARISON_SCENARIO_NAME, exact: true }))
        .toHaveCount(1);

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
      await expect(controller).toHaveAttribute("data-mode", "live");
      await expect(controller.getByRole("button", { name: "Apply", exact: true }))
        .toHaveCount(0);
      await assertLongScenarioTitleFitsRightRail(
        rail,
        comparisonRow,
        COMPARISON_SCENARIO_NAME,
      );

      await dockTab(page, LV_PV_TITLE).click();
      const lvLegend = chartLegend(
        page,
        "scientific-workbench-pane-lv-pv",
      );
      await expect(lvLegend).toContainText(
        `${COMPARISON_SCENARIO_NAME} · Left ventricle`,
        { timeout: 120_000 },
      );
      await expect(lvLegend).toContainText(
        `${HEALTHY_SCENARIO_NAME} · Left ventricle`,
      );

      // Global visibility gates the scenario across graphs.
      await exactButton(page, `${COMPARISON_SCENARIO_NAME}をグラフで非表示`)
        .click();
      await expect(lvLegend).not.toContainText(COMPARISON_SCENARIO_NAME);
      await expect(page.getByTestId("scientific-workbench-metrics-v1")
        .getByRole("heading", { name: COMPARISON_SCENARIO_NAME, exact: true }))
        .toHaveCount(0);
      await exactButton(page, `${COMPARISON_SCENARIO_NAME}をグラフに表示`)
        .click();
      await expect(lvLegend).toContainText(COMPARISON_SCENARIO_NAME);
      await expect(page.getByTestId("scientific-workbench-metrics-v1")
        .getByRole("heading", { name: COMPARISON_SCENARIO_NAME, exact: true }))
        .toHaveCount(1);

      // Pane membership is local to the authored graph: excluding the
      // comparison from LV PV must not hide it from mitral flow.
      await page.getByRole("button", {
        name: `${LV_PV_TITLE}のペインメニュー`,
      }).click();
      await page.getByRole("menuitem", { name: "ペイン設定" }).click();
      const membership = page.getByRole("checkbox", {
        name: `${COMPARISON_SCENARIO_NAME}をこのペインに含める`,
      });
      await expect(membership).toBeChecked();
      await membership.uncheck();
      await page.getByRole("button", { name: "ペイン設定を閉じる" }).click();
      await expect(lvLegend).not.toContainText(COMPARISON_SCENARIO_NAME);

      await dockTab(page, MITRAL_FLOW_TITLE).click();
      await expect(chartLegend(
        page,
        "scientific-workbench-pane-product-mitral-flow-v1",
      )).toContainText(
        `${COMPARISON_SCENARIO_NAME} · MV flow`,
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
      await selectTransitionMode(page, "次の定常状態");
      await selectControllerScale(
        controller,
        "Systemic resistance scale",
        "1.5×",
      );
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
      await selectTransitionMode(page, "ライブ遷移");
      await selectControllerScale(
        controller,
        "Pulmonary resistance scale",
        "0.75×",
      );
      await expect(controller).toHaveAttribute("data-phase", "live-running", {
        timeout: 30_000,
      });
      await expect.poll(async () => numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      )).toBeGreaterThan(steadyRevision);
      await page.getByRole("button", { name: "一時停止", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await expect(controller).toHaveAttribute(
        "data-displayed-evidence",
        "open-transient-no-periodic-claim",
      );
      await expect(controller.getByRole("button", { name: /Resume|Reset/ }))
        .toHaveCount(0);

      await scenarioRow(rail, HEALTHY_SCENARIO_NAME).click();
      await expect(evidence).toHaveAttribute(
        "data-scientific-final-revision",
        String(originalRevision),
      );

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
    },
  );

  test("commits exact-stop sliders on pointer release and keyboard release", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      await acknowledgeModelLimitations(page);
      const { evidence } = await openReadyProductWorkbench(page);
      const controller = page.getByTestId("scientific-transition-controller-v1");
      await expect(controller).toHaveAttribute("data-owner-connected", "true");
      await expect(controller).toHaveAttribute("data-mode", "live");
      await expect(controller.getByTestId("scientific-product-transition-mode-v1"))
        .toHaveCount(0);
      await assertTransitionModeInRightDrawer(page, "ライブ遷移");
      await expect(controller.getByRole("button", { name: "Apply", exact: true }))
        .toHaveCount(0);
      await expect(controller.getByRole("slider")).toHaveCount(4);
      for (const label of FUTURE_SCIENTIFIC_CONTROLS) {
        await expect(controller.getByText(label, { exact: true })).toHaveCount(0);
      }
      const rail = page.getByRole("region", { name: "シナリオレール" });
      const completeViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "Circulation load",
      );
      await completeViewMenu.getByRole("button", {
        name: "All scientific controls",
        exact: true,
      }).click();
      await expect(controller.getByRole("slider")).toHaveCount(6);
      for (const label of WIRED_SCIENTIFIC_CONTROLS) {
        await expect(controller.getByText(label, { exact: true })).toBeVisible();
        await expect(controller.getByRole("slider", { name: label, exact: true }))
          .toHaveAttribute(
            "aria-description",
            SCIENTIFIC_CONTROL_DESCRIPTION_PATTERNS[label],
          );
      }
      await assertControllerStopEndpoints(
        controller,
        "Systemic resistance scale",
        "0.25×",
        "4.0×",
        8,
      );
      await assertControllerStopEndpoints(controller, "PEEP boundary", "0", "25", 8);
      await assertControllerStopEndpoints(
        controller,
        "Pericardial occupancy",
        "0",
        "150",
        6,
      );
      const circulationViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "All scientific controls",
      );
      await circulationViewMenu.getByRole("button", {
        name: "Circulation load",
        exact: true,
      }).click();
      await expect(controller.getByRole("slider")).toHaveCount(4);

      const initialRevision = numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      );
      const initialEpoch = numericAttribute(
        await controller.getAttribute("data-displayed-parameter-epoch"),
      );
      await selectControllerScale(
        controller,
        "Systemic resistance scale",
        "1.5×",
        async (slider) => {
          // Input events update the draft and the slider display immediately,
          // but must not fork/apply the scientific runtime before release.
          await expect(slider).toHaveAttribute("aria-valuetext", "1.5×");
          await expect(controller).toHaveAttribute("data-phase", "idle");
          await expect(controller).toHaveAttribute("data-target-control-sha", "");
          await expect(controller).toHaveAttribute(
            "data-displayed-parameter-epoch",
            String(initialEpoch),
          );
          await expect(evidence).toHaveAttribute(
            "data-scientific-final-revision",
            String(initialRevision),
          );
        },
      );
      await expect(controller).toHaveAttribute("data-phase", "live-running", {
        timeout: 30_000,
      });
      await expect.poll(async () => numericAttribute(
        await evidence.getAttribute("data-scientific-final-revision"),
      )).toBeGreaterThan(initialRevision);
      const liveMetrics = page.locator(
        '[data-testid="scientific-metrics-scenario-v1"]:visible',
      ).first();
      await expect(liveMetrics).toBeVisible();
      await expect(liveMetrics.locator("[data-metric-id]").first()).toBeVisible();
      await expect(liveMetrics).toHaveAttribute(
        "data-metric-evidence",
        /retained-periodic-source|provisional-complete-transient-beat/,
      );
      await expect.poll(async () => liveMetrics.getAttribute(
        "data-metric-evidence",
      ), { timeout: 30_000 }).toBe("provisional-complete-transient-beat");

      const firstTargetSha = await controller.getAttribute("data-target-control-sha");
      const firstEpoch = numericAttribute(
        await controller.getAttribute("data-displayed-parameter-epoch"),
      );
      await selectControllerScale(
        controller,
        "Pulmonary resistance scale",
        "0.75×",
      );
      await expect.poll(async () =>
        controller.getAttribute("data-target-control-sha"),
      ).not.toBe(firstTargetSha);
      await expect.poll(async () => numericAttribute(
        await controller.getAttribute("data-displayed-parameter-epoch"),
      )).toBeGreaterThan(firstEpoch);
      await expect(controller).toHaveAttribute("data-phase", "live-running", {
        timeout: 30_000,
      });
      const pvCanvas = page.getByTestId("scientific-workbench-pv-canvas-v1").first();
      await expect(pvCanvas).toHaveAttribute("data-pv-history-beats", "8");
      await expect(pvCanvas).toHaveAttribute("data-pv-history-mode", "fade");
      await expect(pvCanvas).toHaveAttribute(
        "data-pv-history-source-trajectory-count",
        "1",
      );
      await expect.poll(async () => numericAttribute(
        await pvCanvas.getAttribute("data-pv-history-trajectory-count"),
      ), { timeout: 30_000 }).toBeGreaterThan(1);

      await page.getByRole("button", { name: "一時停止", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await expect(controller.getByRole("button", { name: /Resume|Reset/ }))
        .toHaveCount(0);

      const systemicSlider = controller.getByRole("slider", {
        name: "Systemic resistance scale",
        exact: true,
      });
      await systemicSlider.focus();
      await systemicSlider.press("ArrowRight");
      await expect(systemicSlider).toHaveAttribute("aria-valuetext", "2.0×");
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await page.getByRole("button", { name: "再生", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "live-running", {
        timeout: 30_000,
      });
      await page.getByRole("button", { name: "一時停止", exact: true }).click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
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
      await expect(controller).toContainText("Systemic resistance scale");
      await expect(controller).toContainText("Pulmonary resistance scale");
      await expect(controller).toContainText("Venous tone");
      await expect(controller).toContainText("Arterial PV stiffness");

      const initialViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "Circulation load",
      );
      await initialViewMenu.getByRole("button", {
        name: "新規コントローラー",
      }).click();
      const createDialog = page.getByRole("dialog", {
        name: "コントローラービュー",
      });
      await expect(createDialog).toBeVisible();
      for (const label of FUTURE_SCIENTIFIC_CONTROLS) {
        await expect(createDialog.getByText(label, { exact: true })).toHaveCount(0);
      }
      await createDialog.getByText(
        "Ventilation & pericardial restraint",
        { exact: true },
      ).click();
      await createDialog.getByTitle(
        "PEEP boundary — ventilation.peep-cm-h2o",
        { exact: true },
      ).click();
      await createDialog.getByTitle(
        "Pericardial occupancy — pericardium.prescribed-fluid-volume-ml",
        { exact: true },
      ).click();
      const selectedControlRemovers = createDialog.getByRole("button", {
        name: "コントロールを削除",
      });
      await expect(selectedControlRemovers).toHaveCount(6);
      for (let remaining = 5; remaining >= 1; remaining -= 1) {
        await selectedControlRemovers.last().click();
        await expect(selectedControlRemovers).toHaveCount(remaining);
      }
      await expect(selectedControlRemovers).toHaveCount(1);
      await createDialog.getByLabel("名前").fill("SVR only");
      await createDialog.getByRole("button", { name: "完了" }).click();

      await expect(controllerViewSelector(rail, "SVR only")).toBeVisible();
      await expect(controller).toContainText("Systemic resistance scale");
      await expect(controller).not.toContainText("Pulmonary resistance scale");

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
      await expect(controller).not.toContainText("Pulmonary resistance scale");

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
      await expect(controllerViewSelector(rail, "Circulation load"))
        .toBeVisible();
      await expect(controller).toContainText("Pulmonary resistance scale");

      // An intentionally empty authored view stays empty. The runtime must not
      // reinterpret an empty item list as a request for the standard controls.
      const emptyViewMenu = await ensureControllerViewMenuOpen(
        rail,
        "Circulation load",
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
      await expect(emptyViewRemovers).toHaveCount(4);
      for (let remaining = 3; remaining >= 0; remaining -= 1) {
        await emptyViewRemovers.last().click();
        await expect(emptyViewRemovers).toHaveCount(remaining);
      }
      await expect(emptyViewRemovers).toHaveCount(0);
      await emptyDialog.getByLabel("名前").fill("Empty controller");
      await emptyDialog.getByRole("button", { name: "完了" }).click();

      await expect(controllerViewSelector(rail, "Empty controller"))
        .toBeVisible();
      await expect(page.getByText("No controller items", { exact: true }))
        .toBeVisible();
      await expect(controller).toHaveCount(0);
      await expect(page.getByText("Systemic resistance scale", {
        exact: true,
      })).toHaveCount(0);
      await expect(page.getByText("Pulmonary resistance scale", {
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

async function assertDefaultScientificLayout(page: Page): Promise<void> {
  const metricsHost = page.getByRole("region", { name: "指標ホスト" });
  await expect(metricsHost).toBeVisible();

  const mainDockview = page.locator(".workbench-dockview").first();
  await expect(mainDockview.locator(".dv-groupview")).toHaveCount(3);
  await expect(dockTab(page, LV_PV_TITLE)).toHaveCount(1);
  await expect(dockTab(page, LEFT_PRESSURE_TITLE)).toHaveCount(1);
  await expect(dockTab(page, MITRAL_FLOW_TITLE)).toHaveCount(1);

  const lvPane = page.getByTestId("scientific-workbench-pane-lv-pv");
  const pressurePane = page.getByTestId(
    "scientific-workbench-pane-product-left-pressure-v1",
  );
  const mitralPane = page.getByTestId(
    "scientific-workbench-pane-product-mitral-flow-v1",
  );
  await expect(lvPane).toBeVisible();
  await expect(pressurePane).toBeVisible();
  await expect(mitralPane).toBeVisible();

  const [lvBox, pressureBox, mitralBox] = await Promise.all([
    lvPane.boundingBox(),
    pressurePane.boundingBox(),
    mitralPane.boundingBox(),
  ]);
  expect(lvBox).not.toBeNull();
  expect(pressureBox).not.toBeNull();
  expect(mitralBox).not.toBeNull();
  expect(pressureBox!.x).toBeGreaterThan(lvBox!.x + lvBox!.width - 12);
  expect(Math.abs(pressureBox!.x - mitralBox!.x)).toBeLessThanOrEqual(4);
  expect(Math.abs(pressureBox!.width - mitralBox!.width)).toBeLessThanOrEqual(4);
  expect(pressureBox!.y).toBeLessThan(mitralBox!.y);
  expect(pressureBox!.y + pressureBox!.height)
    .toBeLessThanOrEqual(mitralBox!.y + 12);
}

async function assertLegendAndPaneSettingsInteractions(page: Page): Promise<void> {
  await dockTab(page, LV_PV_TITLE).click();
  const pane = page.getByTestId("scientific-workbench-pane-lv-pv");
  const wrapper = pane.getByTestId("scientific-workbench-pv-canvas-v1");
  const legend = wrapper.getByTestId("scientific-workbench-chart-legend-v1");
  await expect(legend).toHaveAttribute("role", "button");
  await expect(legend).toHaveAttribute("data-legend-placement", "default");

  // A plain click edits the owning pane. The desktop title region can then be
  // dragged without stealing the Done/Close button interactions.
  await legend.click();
  const dialog = page.getByRole("dialog", { name: "ペイン設定" });
  await expect(dialog).toBeVisible();
  const moveHandle = dialog.getByRole("button", { name: "ペイン設定を移動" });
  const historySettings = dialog.getByTestId("pv-history-settings");
  await expect(historySettings.getByRole("button", { name: "8", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await historySettings.getByRole("button", { name: "4", exact: true }).click();
  await historySettings.getByRole("button", { name: "濃さを保持", exact: true }).click();
  await expect(wrapper).toHaveAttribute("data-pv-history-beats", "4");
  await expect(wrapper).toHaveAttribute("data-pv-history-mode", "persistent");
  await historySettings.getByRole("button", { name: "8", exact: true }).click();
  await historySettings.getByRole("button", { name: "徐々に薄く", exact: true }).click();
  const dialogBefore = await requiredBoundingBox(dialog, "pane settings dialog");
  const handleBox = await requiredBoundingBox(moveHandle, "pane settings move handle");
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 56,
    handleBox.y + handleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();
  const dialogAfter = await requiredBoundingBox(dialog, "moved pane settings dialog");
  expect(Math.abs(dialogAfter.x - dialogBefore.x)).toBeGreaterThan(20);
  await expectElementBoundsInside(dialog, page.locator("body"));

  // The mobile dialog remains full-screen and must not advertise a move
  // control that cannot move an oversized surface. Restoring desktop enables
  // the same handle again without reopening the dialog.
  await page.setViewportSize({ width: 600, height: 900 });
  await expect(dialog.getByRole("button", { name: "ペイン設定を移動" }))
    .toHaveCount(0);
  const mobileDialogHeader = dialog.getByRole("heading", { name: "ペイン設定" })
    .locator("..");
  await expect(mobileDialogHeader).not.toHaveAttribute("role", "button");
  await expect(mobileDialogHeader).not.toHaveAttribute("tabindex", "0");
  await page.setViewportSize({ width: 1440, height: 1_000 });
  await expect(moveHandle).toBeVisible();
  await page.getByRole("button", { name: "ペイン設定を閉じる" }).click();
  await expect(dialog).toHaveCount(0);

  // Moving a legend is a drag, never an accidental settings click. Its
  // normalized custom position survives the interaction and remains clickable.
  const defaultLegendBox = await requiredBoundingBox(legend, "default graph legend");
  await page.mouse.move(
    defaultLegendBox.x + defaultLegendBox.width / 2,
    defaultLegendBox.y + defaultLegendBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    defaultLegendBox.x + defaultLegendBox.width / 2 - 120,
    defaultLegendBox.y + defaultLegendBox.height / 2 + 80,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(legend).toHaveAttribute("data-legend-placement", "custom");
  await expect(dialog).toHaveCount(0);

  await legend.click();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "ペイン設定を閉じる" }).click();
  await expect(dialog).toHaveCount(0);

  // Returning to the initial top-right neighbourhood enters the live magnet
  // and clears the custom position back to the canonical default.
  const movedLegendBox = await requiredBoundingBox(legend, "moved graph legend");
  const wrapperBox = await requiredBoundingBox(wrapper, "PV chart wrapper");
  const defaultCenter = {
    x: wrapperBox.x + wrapperBox.width - movedLegendBox.width - 8
      + movedLegendBox.width / 2,
    y: wrapperBox.y + 8 + movedLegendBox.height / 2,
  };
  await page.mouse.move(
    movedLegendBox.x + movedLegendBox.width / 2,
    movedLegendBox.y + movedLegendBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(defaultCenter.x, defaultCenter.y, { steps: 8 });
  await expect(legend).toHaveAttribute("data-legend-magnet", "snapped");
  await page.mouse.up();
  await expect(legend).toHaveAttribute("data-legend-placement", "default");
}

async function assertWaveformSweepAndFullPaneSizing(page: Page): Promise<void> {
  await dockTab(page, MITRAL_FLOW_TITLE).click();
  const pane = page.getByTestId(
    "scientific-workbench-pane-product-mitral-flow-v1",
  );
  const wrapper = pane.getByTestId("scientific-workbench-waveform-canvas-v1");
  const canvas = wrapper.locator('canvas[data-chart-kind="waveform"]');
  await expect(wrapper).toBeVisible();
  await expect(canvas).toHaveAttribute("data-cursor", /\d/);
  await expect(canvas).toHaveAttribute("data-cap-x", /\d/);
  await assertCanvasFillsPane(canvas, wrapper, pane);

  const legend = wrapper.getByTestId("scientific-workbench-chart-legend-v1");
  await expect(legend).toBeVisible();
  await expect(legend).toContainText("MV flow");
  const legendLabels = await legend.locator(":scope > span").allTextContents();
  expect(legendLabels.length).toBeGreaterThan(0);
  expect(legendLabels.every((label) => !label.includes(HEALTHY_SCENARIO_NAME)))
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

  const waveform = page.getByTestId(
    "scientific-workbench-pane-product-mitral-flow-v1",
  ).locator('canvas[data-chart-kind="waveform"]');
  await expect(waveform).toHaveAttribute("data-cursor", /\d/);
  await assertCanvasEvidenceFreezes(waveform);

  // The PV loop uses the same clock and moving cap contract.
  await dockTab(page, LV_PV_TITLE).click();
  const pane = page.getByTestId("scientific-workbench-pane-lv-pv");
  const wrapper = pane.getByTestId("scientific-workbench-pv-canvas-v1");
  const canvas = wrapper.locator('canvas[data-chart-kind="pvloop"]');
  await expect(wrapper).toBeVisible();
  await expect(canvas).toHaveAttribute("data-cap-x", /\d/);
  await assertCanvasFillsPane(canvas, wrapper, pane);
  await expect(wrapper.getByTestId("scientific-workbench-chart-legend-v1"))
    .toContainText("Left ventricle");
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
  const addedTab = dockTab(page, "Waveforms");
  await expect(addedTab).toHaveCount(1);
  const addedPane = addedTab.locator(
    "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' dv-groupview ')][1]",
  ).locator(
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
  await dockTab(page, LV_PV_TITLE).click();
  const visibleScientificPanes = page.locator(
    '[data-testid^="scientific-workbench-pane-"]:visible',
  );
  const initialVisiblePaneCount = await visibleScientificPanes.count();
  const mainDockview = page.locator(".workbench-dockview").first();
  const initialGroupCount = await mainDockview.locator(".dv-groupview").count();

  await page.getByRole("button", {
    name: `${LV_PV_TITLE}のペインメニュー`,
  }).click();
  await page.getByRole("menuitem", { name: "右に分割" }).click();

  const duplicatedPane = page.locator(
    '[data-testid^="scientific-workbench-pane-lv-pv-"]',
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
    name: `${LV_PV_TITLE}を閉じる`,
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
  await dockTab(page, "Hemodynamics").click();

  const metrics = page.getByTestId("scientific-workbench-metrics-v1");
  await expect(metrics).toBeVisible();
  const groups = metrics.getByTestId("scientific-metrics-scenario-v1");
  await expect(groups).toHaveCount(1);
  await expect(groups.getByRole("heading", {
    name: HEALTHY_SCENARIO_NAME,
    exact: true,
  })).toHaveCount(1);
  const items = groups.locator("[data-metric-id]");
  await expect.poll(() => items.count()).toBeGreaterThan(0);
  const renderedMetrics = await items.evaluateAll((nodes) => nodes.map((node) => ({
    metricId: node.getAttribute("data-metric-id"),
    availability: node.getAttribute("data-availability"),
    periodicBoundaryCompletion: node.getAttribute(
      "data-periodic-boundary-completion",
    ),
    text: node.textContent ?? "",
  })));
  expect(renderedMetrics.every((metric) => (
    metric.availability === "available"
    && metric.periodicBoundaryCompletion === "true"
    && !metric.text.includes("—")
  ))).toBe(true);
  await expect(metrics.locator("article[data-metric-id]")).toHaveCount(0);
}

async function assertNoteAuthoredViewEmbeds(page: Page): Promise<void> {
  const authoredViews = [
    {
      id: "lv-pv",
      kind: "graph",
      title: LV_PV_TITLE,
      bodyTestId: "scientific-workbench-pv-canvas-v1",
    },
    {
      id: "scientific-controller-circulation-load-v1",
      kind: "controller",
      title: "Circulation load",
      bodyTestId: "scientific-transition-controller-v1",
    },
    {
      id: "scientific-metrics-pressure-v1",
      kind: "metrics",
      title: "Hemodynamics",
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
  stopLabel:
    | "0.25×"
    | "0.50×"
    | "0.75×"
    | "1.0×"
    | "1.5×"
    | "2.0×"
    | "3.0×"
    | "4.0×",
  beforeRelease?: (slider: Locator) => Promise<void>,
): Promise<void> {
  const stop = {
    "0.25×": { index: 0, valueText: "0.25×" },
    "0.50×": { index: 1, valueText: "0.50×" },
    "0.75×": { index: 2, valueText: "0.75×" },
    "1.0×": { index: 3, valueText: "1.0×" },
    "1.5×": { index: 4, valueText: "1.5×" },
    "2.0×": { index: 5, valueText: "2.0×" },
    "3.0×": { index: 6, valueText: "3.0×" },
    "4.0×": { index: 7, valueText: "4.0×" },
  }[stopLabel];
  const slider = controller.getByRole("slider", {
    name: controlName,
    exact: true,
  });
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute("min", "0");
  await expect(slider).toHaveAttribute("max", "7");
  await expect(slider).toHaveAttribute("step", "1");
  const sliderCard = slider.locator("..");
  const stopLabels = sliderCard.locator('div[aria-hidden="true"]');
  await expect(stopLabels.getByText("0.25×", { exact: true })).toBeVisible();
  await expect(stopLabels.getByText("0.75×", { exact: true })).toBeVisible();
  await expect(stopLabels.getByText("1.0×", { exact: true })).toBeVisible();
  await expect(stopLabels.getByText("4.0×", { exact: true })).toBeVisible();

  const box = await requiredBoundingBox(slider, `${controlName} slider`);
  const y = box.y + box.height / 2;
  const targetX = stop.index === 0
    ? box.x + 2
    : stop.index === 7
      ? box.x + box.width - 2
      : box.x + (box.width * stop.index) / 7;
  await slider.page().mouse.move(box.x + box.width / 2, y);
  await slider.page().mouse.down();
  try {
    await slider.page().mouse.move(targetX, y, { steps: 5 });
    await expect(slider).toHaveValue(String(stop.index));
    await expect(slider).toHaveAttribute("aria-valuetext", stop.valueText);
    await beforeRelease?.(slider);
  } finally {
    await slider.page().mouse.up();
  }
}

async function assertControllerStopEndpoints(
  controller: Locator,
  controlName: string,
  firstLabel: string,
  lastLabel: string,
  stopCount: number,
): Promise<void> {
  const slider = controller.getByRole("slider", {
    name: controlName,
    exact: true,
  });
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute("min", "0");
  await expect(slider).toHaveAttribute("max", String(stopCount - 1));
  await expect(slider).toHaveAttribute("step", "1");
  const labels = slider.locator("..").locator('div[aria-hidden="true"]');
  await expect(labels.getByText(firstLabel, { exact: true })).toBeVisible();
  await expect(labels.getByText(lastLabel, { exact: true })).toBeVisible();
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

function chartLegend(page: Page, paneTestId: string): Locator {
  return page.getByTestId(paneTestId)
    .getByTestId("scientific-workbench-chart-legend-v1");
}

function exactButton(page: Page, ariaLabel: string): Locator {
  return page.locator(`button[aria-label="${ariaLabel}"]`);
}

function scenarioRow(rail: Locator, name: string): Locator {
  return rail.locator('div[role="button"]').filter({
    hasText: new RegExp(`^\\s*${escapeRegExp(name)}(?:\\s*非表示)?\\s*$`),
  });
}

async function assertLongScenarioTitleFitsRightRail(
  rail: Locator,
  row: Locator,
  scenarioName: string,
): Promise<void> {
  const rowTitle = row.getByTitle(scenarioName, { exact: true });
  const controllerSelector = controllerViewSelector(rail, "Circulation load");
  const editBadge = rail.getByTitle("編集", { exact: true }).filter({
    hasText: scenarioName,
  });
  const editBadgeTitle = editBadge.getByTitle(scenarioName, { exact: true });

  await expect(row).toBeVisible();
  await expect(controllerSelector).toBeVisible();
  await expect(editBadge).toBeVisible();
  await expectTextToBeVisuallyTruncated(rowTitle);
  await expectTextToBeVisuallyTruncated(editBadgeTitle);

  for (const element of [row, controllerSelector, editBadge]) {
    await expectElementBoundsInside(element, rail);
  }
}

async function expectTextToBeVisuallyTruncated(text: Locator): Promise<void> {
  await expect(text).toBeVisible();
  await expect.poll(async () => text.evaluate((node) =>
    node.scrollWidth - node.clientWidth,
  )).toBeGreaterThan(1);

  const styles = await text.evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      overflowX: computed.overflowX,
      textOverflow: computed.textOverflow,
      whiteSpace: computed.whiteSpace,
    };
  });
  expect(styles.textOverflow).toBe("ellipsis");
  expect(styles.whiteSpace).toBe("nowrap");
  expect(["hidden", "clip"]).toContain(styles.overflowX);
}

async function expectElementBoundsInside(
  element: Locator,
  container: Locator,
): Promise<void> {
  await expect.poll(async () => {
    const [elementBox, containerBox] = await Promise.all([
      element.boundingBox(),
      container.boundingBox(),
    ]);
    if (elementBox === null || containerBox === null) return Number.POSITIVE_INFINITY;
    return elementBox.x - containerBox.x;
  }).toBeGreaterThanOrEqual(-1);

  await expect.poll(async () => {
    const [elementBox, containerBox] = await Promise.all([
      element.boundingBox(),
      container.boundingBox(),
    ]);
    if (elementBox === null || containerBox === null) return Number.POSITIVE_INFINITY;
    return elementBox.x + elementBox.width - (containerBox.x + containerBox.width);
  }).toBeLessThanOrEqual(1);
}

async function selectTransitionMode(
  page: Page,
  mode: "ライブ遷移" | "次の定常状態",
): Promise<void> {
  await page.getByRole("button", { name: "ワークベンチパネルを開く" }).click();
  await page.getByRole("button", { name: "設定", exact: true }).click();
  const settings = page.getByTestId("scientific-product-transition-mode-v1");
  await settings.getByRole("button", { name: mode, exact: true }).click();
  await expect(settings.getByRole("button", { name: mode, exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "パネルを閉じる" }).click();
}

async function assertTransitionModeInRightDrawer(
  page: Page,
  mode: "ライブ遷移" | "次の定常状態",
): Promise<void> {
  await page.getByRole("button", { name: "ワークベンチパネルを開く" }).click();
  await page.getByRole("button", { name: "設定", exact: true }).click();
  const settings = page.getByTestId("scientific-product-transition-mode-v1");
  await expect(settings).toBeVisible();
  await expect(settings.getByRole("button", { name: mode, exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "パネルを閉じる" }).click();
}

async function requiredBoundingBox(
  locator: Locator,
  label: string,
): Promise<NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>> {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a bounding box`).not.toBeNull();
  return box!;
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
