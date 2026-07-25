import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const OFFICIAL_PRODUCT_CASE_ID =
  "circleheart/official-healthy-periodic";

test.describe.serial("Product workflows by role", () => {
  test("Author role — edits an experiment article, checks Reader Preview, and keeps every preview session-local", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrorsV1(page);

    try {
      await acknowledgeModelLimitationsV1(page);
      await captureReaderFirstPaintsV1(page);
      await page.goto("/ja/", {
        waitUntil: "domcontentloaded",
      });
      await page.getByRole("link", {
        name: "記事を書いてReader Previewで確認",
        exact: true,
      }).click();
      await expect(page).toHaveURL(/\/ja\/studio\/author$/);

      const surface = page.getByTestId("studio-document-route-v1");
      await expect(surface).toBeVisible();
      await expect(surface).toHaveAttribute("data-studio-capability", "compose");
      const article = page.getByTestId("studio-document-reader-v1");
      const authoredTitle =
        "E2E: 全身血管抵抗を上げたときの圧波形";
      const authoredIntroduction =
        "Author E2Eで編集した導入文です。左室圧と大動脈圧を同じ時間軸で観察します。";

      // The surface is written on directly: title and prose are the rendered
      // article, not form fields beside a preview.
      const titleLine = article.locator("h1[contenteditable='true']");
      await titleLine.click();
      await titleLine.fill(authoredTitle);
      const firstParagraph = article
        .locator("p[contenteditable='true']")
        .first();
      await firstParagraph.click();
      await firstParagraph.fill(authoredIntroduction);
      await titleLine.click();
      await expect(surface).toHaveAttribute(
        "data-draft-revision",
        /^[1-9]\d*$/,
      );

      // Structure is edited through the block gutter rather than a block form.
      const placementBlock = article.locator(
        '[data-document-block-kind="experiment-placement"]',
      );
      await placementBlock.hover();
      await placementBlock.getByRole("button", {
        name: "下に段落を挿入",
        exact: true,
      }).click();
      const orderedBlockKinds = await article.getByTestId(
        "studio-document-block-v1",
      ).evaluateAll((blocks) =>
        blocks.map((block) =>
          block.getAttribute("data-document-block-kind")));
      const placementIndex = orderedBlockKinds.indexOf(
        "experiment-placement",
      );
      expect(placementIndex).toBeGreaterThan(0);
      expect(orderedBlockKinds[placementIndex + 1]).toBe("paragraph");

      // The placement carries its own per-article presentation decision.
      const placementOptions = page.getByTestId(
        "studio-placement-options-v1",
      );
      await expect(placementOptions).toHaveAttribute(
        "data-placement-inline-mode",
        "live",
      );
      await page.getByTestId("studio-placement-mode-compact-v1").click();
      await expect(placementOptions).toHaveAttribute(
        "data-placement-inline-mode",
        "compact",
      );
      await page.getByTestId("studio-placement-mode-live-v1").click();

      // Composing never integrates: the author sees the canonical point only.
      const experimentCell = page.getByTestId(
        "studio-reader-experiment-cell-v1",
      );
      await expect(experimentCell).toHaveAttribute(
        "data-reader-activated",
        "false",
      );

      await page.getByTestId("studio-capability-read-v1").click();
      await expect(surface).toHaveAttribute("data-studio-capability", "read");
      await expect(article.locator("[contenteditable='true']")).toHaveCount(0);

      const reader = page.getByTestId("studio-document-reader-v1");
      await expect(reader.getByRole("heading", {
        name: authoredTitle,
        exact: true,
      })).toBeVisible();
      await expect(reader).toContainText(authoredIntroduction);

      const sharedGraphPanes = reader.getByTestId(
        "studio-reader-shared-graph-panes-v1",
      );
      // In-flow carries the primary graph only; the rest of the brief opens
      // in focus, so the article stays readable.
      await expect(
        sharedGraphPanes.locator("[data-studio-reader-pane-kind]"),
      ).toHaveCount(1);
      const readerWaveformPane = sharedGraphPanes.locator(
        '[data-studio-reader-pane-kind="waveform"]',
      );
      await expect(readerWaveformPane).toHaveAttribute(
        "data-studio-reader-time-window-ms",
        "5000",
      );
      await expect(readerWaveformPane).toHaveAttribute(
        "data-studio-reader-legend-position",
        "0.68,0.06",
      );
      const readerWaveform = readerWaveformPane.getByTestId(
        "scientific-workbench-waveform-canvas-v1",
      );
      await expect(readerWaveform).toBeVisible();

      const focusView = page.getByTestId("studio-reader-focus-v1");
      await page.getByTestId("studio-reader-open-focus-v1").click();
      await expect(focusView).toBeVisible();
      await expect(
        focusView.locator("[data-studio-reader-pane-kind]"),
      ).toHaveCount(3);
      const readerPv = focusView.getByTestId(
        "scientific-workbench-pv-canvas-v1",
      );
      await expect(readerPv).toBeVisible();
      await expect(focusView.getByTestId(
        "scientific-left-cardiac-output-filling-pressure-pane-v1",
      )).toHaveAttribute(
        "data-protocol-status",
        /running|partial|complete/,
      );
      await focusView.getByRole("button", { name: "閉じる" }).first().click();
      await expect(focusView).toHaveCount(0);

      const experiment = page.getByTestId(
        "studio-reader-experiment-cell-v1",
      );
      await expect(experiment).toHaveAttribute(
        "data-studio-runtime",
        "true",
      );
      await expect(experiment).toHaveAttribute(
        "data-reader-time-scale",
        "1",
      );
      await expect(experiment).toHaveAttribute(
        "data-reader-started-from-one-point",
        "true",
      );
      await expect(experiment).toHaveAttribute(
        "data-reader-canonical-seed-point-count",
        "1",
      );
      await expect.poll(async () =>
        (await readerFirstPaintsV1(page)).some((observation) =>
          observation.phase === "seed"
          && observation.frameCount === "1"
          && observation.canonicalSeedPointCount === "1"
          && observation.startedFromOnePoint === "true"
          && observation.waveformFrameCount === "1")
      ).toBe(true);
      await expect.poll(async () =>
        numericAttributeV1(experiment, "data-reader-frame-count")
      ).toBeGreaterThan(1);

      const systemicResistance = experiment.getByRole("slider", {
        name: "全身血管抵抗倍率",
        exact: true,
      });
      const systemicControl = systemicResistance.locator("..");
      await expect(systemicControl.locator("output")).toHaveText("1");
      const initialGeneration = await numericAttributeV1(
        experiment,
        "data-reader-target-generation",
      );
      await systemicResistance.focus();
      await systemicResistance.press("ArrowRight");
      await expect(systemicControl.locator("output")).toHaveText("1.5");
      await expect(experiment).toHaveAttribute(
        "data-reader-target-generation",
        String(initialGeneration + 1),
      );
      // Reader uses the same chart components as Workbench. The previous
      // parameter generation must remain present while the new live transition
      // begins, so neither graph disappears into a fresh autoscale.
      await expect.poll(async () => numericAttributeV1(
        readerWaveform,
        "data-waveform-parameter-history-series-count",
      )).toBeGreaterThan(0);
      // The PV loop lives in focus now, and focus shares the same Session, so
      // the parameter-generation history must already be there when it opens.
      await page.getByTestId("studio-reader-open-focus-v1").click();
      await expect(focusView).toBeVisible();
      await expect.poll(async () => numericAttributeV1(
        focusView.getByTestId("scientific-workbench-pv-canvas-v1"),
        "data-pv-parameter-history-count",
      )).toBeGreaterThan(0);
      await focusView.getByRole("button", { name: "閉じる" }).first().click();
      await expect(focusView).toHaveCount(0);

      // Reset is an exact source restoration, not a reverse parameter patch:
      // the current runtime is disposed and the same manifest opens as a new
      // one-point session before its trace begins growing again.
      const beforeResetObservationCount =
        (await readerFirstPaintsV1(page)).length;
      await experiment.getByTestId("studio-reader-reset-v1").click();
      const resetExperiment = page.getByTestId(
        "studio-reader-experiment-cell-v1",
      );
      await expect(resetExperiment).toBeVisible({ timeout: 120_000 });
      const resetSystemic = resetExperiment.getByRole("slider", {
        name: "全身血管抵抗倍率",
        exact: true,
      });
      await expect(resetSystemic.locator("..").locator("output"))
        .toHaveText("1");
      await expect(resetExperiment).toHaveAttribute(
        "data-reader-target-generation",
        "0",
      );
      await expect.poll(async () =>
        (await readerFirstPaintsV1(page))
          .slice(beforeResetObservationCount)
          .some((observation) =>
            observation.phase === "seed"
            && observation.frameCount === "1"
            && observation.waveformFrameCount === "1")
      ).toBe(true);

      // Composing and reading are one surface: returning to compose keeps the
      // committed content and the reader-only parameter choice stays out of it.
      await page.getByTestId("studio-capability-compose-v1").click();
      await expect(surface).toHaveAttribute(
        "data-studio-capability",
        "compose",
      );
      await expect(article.locator("h1[contenteditable='true']"))
        .toHaveText(authoredTitle);
      await expect(article).toContainText(authoredIntroduction);

      // The draft is session-only: a hard reload starts from the seeded
      // article again rather than restoring an author's unsaved work.
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(surface).toBeVisible({ timeout: 120_000 });
      await expect(article.locator("h1")).not.toHaveText(authoredTitle);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrorsV1(testInfo, browserErrors);
    }
  });

  test("Resident role transition boundary — reads and adjusts in the legacy Reader, then enters the Studio Workbench", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrorsV1(page);

    try {
      await acknowledgeModelLimitationsV1(page);
      await page.goto("/ja/", { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", {
        name: "正常循環リファレンス",
        exact: true,
      })).toBeVisible();
      await page.getByRole("link", {
        name: "レッスンを始める",
        exact: true,
      }).first().click();
      await expect(page).toHaveURL(/\/ja\/lesson\/normal-reference$/);

      const article = page.getByRole("article");
      await expect(article.getByRole("heading", {
        name: "Normal Physiology Reference",
        exact: true,
      })).toBeVisible();
      await expect(article).toContainText(
        "このコンテンツは現在英語 (EN)のみ利用できます。",
      );
      await expect(article).toContainText("インタラクティブ");

      const inlineModelToggle = article.getByRole("button", {
        name: "コントロールを隠す",
        exact: true,
      });
      await inlineModelToggle.click();
      const adjustModel = article.getByRole("button", {
        name: "モデルを調整",
        exact: true,
      });
      await expect(adjustModel).toHaveAttribute("aria-expanded", "false");
      await adjustModel.click();
      await expect(article.getByRole("button", {
        name: "コントロールを隠す",
        exact: true,
      })).toHaveAttribute("aria-expanded", "true");

      // Lesson interaction still uses its own reading preview runtime. The
      // Studio-owned runtime begins only after entering the product Workbench.
      await expect(page.getByTestId(
        "scientific-product-workbench-host-v1",
      )).toHaveCount(0);
      await expect(page.locator('[data-studio-runtime="true"]'))
        .toHaveCount(0);

      await page.getByRole("link", {
        name: "ホームに戻る",
        exact: true,
      }).click();
      await expect(page).toHaveURL(/\/ja\/?$/);
      await page.getByRole("link", {
        name: "自由シミュレーションを開く",
        exact: true,
      }).click();

      const { evidence } = await readyStudioWorkbenchV1(page);
      await expect(page).toHaveURL(/\/ja\/workbench$/);
      await expect(evidence).toHaveAttribute("data-studio-runtime", "true");
      await expect(evidence).toHaveAttribute(
        "data-displayed-evidence",
        "open-transient-no-periodic-claim",
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-strict-phase",
        "source-settled",
      );

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrorsV1(testInfo, browserErrors);
    }
  });

  test("Clinician Workbench-only — configures graph history and compares a parameter transition without entering authoring", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrorsV1(page);

    try {
      const { host, evidence, controller } =
        await openReadyStudioWorkbenchV1(page);
      await expect(page).toHaveURL(/\/ja\/workbench$/);
      await expect(page.getByTestId(
        "scientific-workbench-open-briefing-v1",
      )).toBeVisible();
      await expect(page.getByTestId(
        "scientific-workbench-briefing-compose-v1",
      )).toHaveCount(0);

      const waveform = page.getByTestId(
        "scientific-workbench-pane-product-left-pressure-v1",
      ).getByTestId("scientific-workbench-waveform-canvas-v1");
      const pvPane = page.getByTestId("scientific-workbench-pane-lv-pv");
      const pvCanvas = pvPane.getByTestId(
        "scientific-workbench-pv-canvas-v1",
      );
      await expect(waveform).toBeVisible();
      await expect(pvCanvas).toBeVisible();

      await pvPane.getByTestId(
        "scientific-workbench-chart-legend-v1",
      ).click();
      const paneSettings = page.getByRole("dialog", {
        name: "ペイン設定",
      });
      const parameterHistorySettings = paneSettings.getByTestId(
        "pv-parameter-history-settings",
      );
      const retainFiveGenerations = parameterHistorySettings.getByRole(
        "button",
        { name: "5", exact: true },
      );
      await retainFiveGenerations.click();
      await expect(retainFiveGenerations).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.getByRole("button", {
        name: "ペイン設定を閉じる",
      }).click();

      await expect.poll(async () => numericAttributeV1(
        evidence,
        "data-scientific-frame-count",
      )).toBeGreaterThan(1);
      const systemic = controller.getByRole("slider", {
        name: "Systemic resistance scale",
        exact: true,
      });
      const generation = await numericAttributeV1(
        evidence,
        "data-studio-target-generation",
      );
      await systemic.focus();
      await systemic.press("ArrowRight");
      await expect(evidence).toHaveAttribute(
        "data-studio-target-generation",
        String(generation + 1),
      );
      await expect.poll(async () => numericAttributeV1(
        waveform,
        "data-waveform-parameter-history-series-count",
      )).toBeGreaterThan(0);
      await expect.poll(async () => numericAttributeV1(
        pvCanvas,
        "data-pv-parameter-history-count",
      )).toBeGreaterThan(0);

      const leftGuyton = page.getByTestId(
        "scientific-left-cardiac-output-filling-pressure-pane-v1",
      );
      const rightGuyton = page.getByTestId(
        "scientific-right-cardiac-output-filling-pressure-pane-v1",
      );
      await expect(leftGuyton).toBeVisible();
      await expect(rightGuyton).toBeVisible();
      await expect(leftGuyton).toHaveAttribute(
        "data-protocol-status",
        /running|partial|complete/,
      );
      await expect(rightGuyton).toHaveAttribute(
        "data-protocol-status",
        /running|partial|complete/,
      );

      await expect(page).toHaveURL(/\/ja\/workbench$/);
      await expect(host).toBeVisible();
      await expect(page.getByTestId("studio-document-author-v1"))
        .toHaveCount(0);
      await expect(page.getByTestId("studio-reader-preview-v1"))
        .toHaveCount(0);
      await expect(page.getByTestId("studio-document-reader-v1"))
        .toHaveCount(0);
      await expect(page.getByTestId(
        "scientific-workbench-briefing-compose-v1",
      )).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrorsV1(testInfo, browserErrors);
    }
  });

  test("Clinician role — configures graphs, captures a Briefing, and checks the same panes in Reader", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrorsV1(page);

    try {
      await acknowledgeModelLimitationsV1(page);
      await page.goto("/ja/cases", { waitUntil: "domcontentloaded" });

      const officialCase = page.getByTestId(
        "scientific-product-cases-grid-v1",
      ).locator(`article[data-case-id="${OFFICIAL_PRODUCT_CASE_ID}"]`);
      await expect(officialCase).toBeVisible();
      await officialCase.getByRole("link", {
        name: "ケースを開く",
        exact: true,
      }).click();

      const { evidence, controller } =
        await readyStudioWorkbenchV1(page);
      await expect(page).toHaveURL(/\/ja\/workbench\/.+\?from=cases$/);

      const pressurePane = page.getByTestId(
        "scientific-workbench-pane-product-left-pressure-v1",
      );
      const pressureWaveform = pressurePane.getByTestId(
        "scientific-workbench-waveform-canvas-v1",
      );
      const pvCanvas = page.getByTestId(
        "scientific-workbench-pv-canvas-v1",
      );
      await expect(pressureWaveform).toBeVisible();
      await expect(pvCanvas).toBeVisible();

      const pressureLegend = pressurePane.getByTestId(
        "scientific-workbench-chart-legend-v1",
      );
      const legendBox = await pressureLegend.boundingBox();
      if (legendBox === null) {
        throw new Error("expected the pressure legend to have a layout box");
      }
      await page.mouse.move(
        legendBox.x + legendBox.width / 2,
        legendBox.y + legendBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        Math.max(16, legendBox.x - 110),
        legendBox.y + 100,
        { steps: 8 },
      );
      await page.mouse.up();
      await expect(pressureLegend).toHaveAttribute("style", /left:.*top:/);

      await pressureLegend.click();
      const paneSettings = page.getByRole("dialog", {
        name: "ペイン設定",
      });
      const timeWindow = paneSettings.locator('input[type="range"]');
      await expect(timeWindow).toHaveValue("5000");
      await timeWindow.focus();
      await timeWindow.press("ArrowRight");
      await timeWindow.press("ArrowRight");
      await expect(timeWindow).toHaveValue("7000");
      const scenarioDisplayName = paneSettings.locator(
        'input[aria-label$="graph display name"]',
      );
      await scenarioDisplayName.fill("E2E captured physiology");
      await setColorInputV1(
        paneSettings.locator('input[type="color"][aria-label$="base color"]'),
        "#16a34a",
      );
      await page.getByRole("button", {
        name: "ペイン設定を閉じる",
      }).click();
      const workbenchLegendEntry = pressureLegend.locator(
        '[aria-label^="E2E captured physiology,"]',
      ).first();
      await expect(workbenchLegendEntry).toBeVisible();
      const capturedSeriesStyle = await workbenchLegendEntry
        .locator("span")
        .first()
        .getAttribute("style");
      expect(capturedSeriesStyle).not.toBeNull();

      const systemic = controller.getByRole("slider", {
        name: "Systemic resistance scale",
        exact: true,
      });
      const generation = await numericAttributeV1(
        evidence,
        "data-studio-target-generation",
      );
      await systemic.focus();
      await systemic.press("ArrowRight");
      await expect(evidence).toHaveAttribute(
        "data-studio-target-generation",
        String(generation + 1),
      );
      await expect.poll(async () => numericAttributeV1(
        pressureWaveform,
        "data-waveform-parameter-history-series-count",
      )).toBeGreaterThan(0);
      await expect.poll(async () => numericAttributeV1(
        pvCanvas,
        "data-pv-parameter-history-count",
      )).toBeGreaterThan(0);

      await page.getByRole("button", {
        name: "ライブ波形を一時停止",
        exact: true,
      }).click();
      await expect(controller).toHaveAttribute(
        "data-phase",
        "live-paused",
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-live-playback",
        "suspended",
      );

      await page.getByRole("button", {
        name: "ライブ波形を再開",
        exact: true,
      }).click();
      await expect(controller).toHaveAttribute(
        "data-phase",
        /live-running|live-retargeting/,
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-live-playback",
        "running",
      );

      await page.getByRole("button", {
        name: /^根拠とチェック:/,
      }).click();
      const evidenceDialog = page.getByRole("dialog", {
        name: "根拠とチェック",
      });
      await expect(evidenceDialog).toContainText(
        "Studio V&V reports are not connected to this product surface yet.",
      );
      await expect(evidenceDialog).toContainText(
        "Live simulation and strict numerical settlement remain active.",
      );
      await page.getByRole("button", {
        name: "根拠とチェックを閉じる",
      }).click();

      const briefingTrigger = page.getByTestId(
        "scientific-workbench-open-briefing-v1",
      );
      await briefingTrigger.click();
      const composer = page.getByTestId(
        "scientific-workbench-briefing-compose-v1",
      );
      await expect(composer).toBeVisible();
      await expect(composer.getByRole("dialog")).toHaveAttribute(
        "aria-modal",
        "false",
      );
      // Compose is non-modal and reserves width instead of covering the
      // Workbench, so a source pane stays reachable while composing.
      await expect(page.getByTestId(
        "scientific-product-workbench-host-v1",
      )).toHaveAttribute("data-briefing-compose-open", "true");
      const pressureCapture = composer.locator(
        '[data-briefing-source-panel-id="product-left-pressure-v1"]',
      );
      await expect(pressureCapture).toContainText("7s");
      // A brief stays referentially closed: the seeded waveform backs the
      // reader readbacks, so removing it is refused before the command runs.
      const seededWaveformRemove = composer
        .locator('[data-briefing-pane-id="afterload-pressure-waveform"]')
        .first()
        .getByRole("button", { name: /参照元です/ });
      await expect(seededWaveformRemove).toBeDisabled();
      // Compose turns the Workbench itself into the palette: a graph and a
      // control are picked where they are, not from a parallel list.
      const pressurePick = page.locator(
        '[data-briefing-pick-kind="graph"]'
        + '[data-briefing-pick-key="product-left-pressure-v1"]',
      );
      await expect(pressurePick).toHaveAttribute(
        "data-briefing-picked",
        "false",
      );
      await pressurePick.click();
      await expect(pressurePick).toHaveAttribute(
        "data-briefing-picked",
        "true",
      );
      const venousPick = page.locator(
        '[data-briefing-pick-kind="control"]'
        + '[data-briefing-pick-key="circulation.venous-tone"]',
      );
      await venousPick.click();
      await expect(venousPick).toHaveAttribute(
        "data-briefing-picked",
        "true",
      );
      await venousPick.click();
      await expect(venousPick).toHaveAttribute(
        "data-briefing-picked",
        "false",
      );
      await pressurePick.click();
      await expect(pressurePick).toHaveAttribute(
        "data-briefing-picked",
        "false",
      );

      const paletteRows = composer.locator("[data-briefing-source-panel-id]");
      await expect(paletteRows).toHaveCount(5);
      for (let index = 0; index < 5; index += 1) {
        await paletteRows.nth(index).getByRole("button", {
          name: "追加",
          exact: true,
        }).click();
      }
      await expect(
        composer.locator('[data-briefing-pinned="true"]'),
      ).toHaveCount(5);
      // In-flow renders only the primary graph; everything else is reported as
      // overflow with an in-place resolution rather than a bare warning.
      const preview = composer.getByTestId("scientific-briefing-preview-v1");
      await expect(preview).toHaveAttribute(
        "data-briefing-preview-graph-count",
        "1",
      );
      const overflow = composer.getByTestId("scientific-briefing-overflow-v1");
      await expect(overflow).toHaveAttribute("role", "alert");
      // The peek extent holds more of the same brief without re-authoring it.
      await composer.getByTestId("scientific-briefing-extent-peek-v1").click();
      await expect(preview).toHaveAttribute(
        "data-briefing-preview-graph-count",
        "4",
      );
      // A pane pinned from this session matches its live source; the seeded
      // sample pane has no live source at all and says so instead of failing.
      await expect(composer.locator(
        'section[data-briefing-pane-drift="current"]',
      ).first()).toBeVisible();
      await expect(composer.locator(
        'section[data-briefing-pane-id="afterload-pressure-waveform"]',
      )).toHaveAttribute("data-briefing-pane-drift", "uncapturable");
      await composer.getByTestId("scientific-briefing-extent-inflow-v1")
        .click();
      await expect(preview).toHaveAttribute(
        "data-briefing-preview-graph-count",
        "1",
      );
      // Pinning appends to the seeded brief rather than replacing it.
      await expect(composer).toContainText(
        "graph 8枚をReader Briefに保存中",
      );
      // Promote the pane configured in this test so the article's primary
      // graph is deterministic, then hand off to the document.
      const primaryPaneId = () =>
        composer.getByTestId("scientific-briefing-preview-pane-v1")
          .first()
          .getAttribute("data-briefing-pane-id");
      for (let attempt = 0; attempt < 12; attempt += 1) {
        if (await primaryPaneId() === "product-left-pressure-v1") break;
        await composer
          .locator('[data-briefing-pane-id="product-left-pressure-v1"]')
          .getByRole("button", { name: "前へ", exact: true })
          .first()
          .click();
      }
      expect(await primaryPaneId()).toBe("product-left-pressure-v1");

      await composer.getByRole("button", {
        name: "記事を編集",
        exact: true,
      }).click();
      await expect(page).toHaveURL(/\/ja\/studio\/author$/);
      const surface = page.getByTestId("studio-document-route-v1");
      await expect(surface).toBeVisible();
      await expect(surface).toHaveAttribute(
        "data-draft-revision",
        /^[1-9]\d*$/,
      );
      await page.getByTestId("studio-capability-read-v1").click();

      const reader = page.getByTestId("studio-document-reader-v1");
      await expect(reader).toBeVisible({ timeout: 120_000 });
      const capturedPanes = reader.getByTestId(
        "studio-reader-shared-graph-panes-v1",
      );
      // The captured presentation reaches the article unchanged: the reader
      // renders the pinned copy, not the current Workbench pane.
      const capturedPressurePane = capturedPanes.locator(
        '[data-studio-reader-pane-kind="waveform"]',
      );
      await expect(capturedPressurePane).toHaveCount(1);
      await expect(capturedPressurePane).toHaveAttribute(
        "data-studio-reader-time-window-ms",
        "7000",
      );
      await expect(capturedPressurePane).toHaveAttribute(
        "data-studio-reader-legend-position",
        /^(?!default$).+/,
      );
      const capturedLegend = capturedPressurePane.getByTestId(
        "scientific-workbench-chart-legend-v1",
      );
      const capturedLegendEntry = capturedLegend.locator(
        '[aria-label^="E2E captured physiology,"]',
      ).first();
      await expect(capturedLegendEntry).toBeVisible();
      await expect(
        capturedLegendEntry.locator("span").first(),
      ).toHaveAttribute("style", capturedSeriesStyle!);

      // The rest of the brief opens in focus rather than lengthening the
      // article, and focus never drops a pane the author pinned.
      const focusView = page.getByTestId("studio-reader-focus-v1");
      await page.getByTestId("studio-reader-open-focus-v1").click();
      await expect(focusView).toBeVisible();
      await expect(
        focusView.locator("[data-studio-reader-pane-kind]"),
      ).toHaveCount(8);
      await expect(
        focusView.locator('[data-studio-reader-pane-kind="pv-loop"]'),
      ).toHaveCount(2);
      await focusView.getByRole("button", { name: "閉じる" }).first().click();
      await expect(focusView).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrorsV1(testInfo, browserErrors);
    }
  });
});

type ReaderFirstPaintObservationV1 = Readonly<{
  phase: string | null;
  frameCount: string | null;
  canonicalSeedPointCount: string | null;
  startedFromOnePoint: string | null;
  waveformFrameCount: string | null;
  pvFrameCount: string | null;
}>;

const READER_FIRST_PAINTS_KEY_V1 =
  "__circleheartReaderFirstPaintsV1";

async function captureReaderFirstPaintsV1(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    const observations: ReaderFirstPaintObservationV1[] = [];
    const recordedSeedCells = new WeakSet<Element>();
    Object.defineProperty(window, key, {
      configurable: true,
      value: observations,
    });
    const record = (): void => {
      const cell = document.querySelector(
        '[data-testid="studio-reader-experiment-cell-v1"]',
      );
      if (
        cell === null
        || recordedSeedCells.has(cell)
        || cell.getAttribute("data-reader-phase") !== "seed"
        || cell.getAttribute("data-reader-frame-count") !== "1"
      ) return;
      const waveform = cell.querySelector(
        '[data-panel-kind="time-series"]',
      );
      const pv = cell.querySelector(
        '[data-panel-kind="pressure-volume"]',
      );
      if (waveform === null) return;
      recordedSeedCells.add(cell);
      observations.push(Object.freeze({
        phase: cell.getAttribute("data-reader-phase"),
        frameCount: cell.getAttribute("data-reader-frame-count"),
        canonicalSeedPointCount: cell.getAttribute(
          "data-reader-canonical-seed-point-count",
        ),
        startedFromOnePoint: cell.getAttribute(
          "data-reader-started-from-one-point",
        ),
        waveformFrameCount: waveform.getAttribute(
          "data-scientific-frame-count",
        ),
        pvFrameCount: pv === null
          ? null
          : pv.getAttribute("data-scientific-frame-count"),
      }));
    };
    const observer = new MutationObserver(record);
    observer.observe(document, {
      attributes: true,
      attributeFilter: [
        "data-reader-phase",
        "data-reader-frame-count",
        "data-reader-canonical-seed-point-count",
        "data-reader-started-from-one-point",
        "data-scientific-frame-count",
      ],
      childList: true,
      subtree: true,
    });
    record();
  }, READER_FIRST_PAINTS_KEY_V1);
}

async function readerFirstPaintsV1(
  page: Page,
): Promise<readonly ReaderFirstPaintObservationV1[]> {
  return page.evaluate((key) => {
    const value = (
      window as unknown as Readonly<Record<string, unknown>>
    )[key];
    return Array.isArray(value)
      ? value as readonly ReaderFirstPaintObservationV1[]
      : [];
  }, READER_FIRST_PAINTS_KEY_V1);
}

async function openReadyStudioWorkbenchV1(
  page: Page,
): Promise<Readonly<{
  host: Locator;
  evidence: Locator;
  controller: Locator;
}>> {
  await acknowledgeModelLimitationsV1(page);
  await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });
  return readyStudioWorkbenchV1(page);
}

async function readyStudioWorkbenchV1(
  page: Page,
): Promise<Readonly<{
  host: Locator;
  evidence: Locator;
  controller: Locator;
}>> {
  const host = page.getByTestId("scientific-product-workbench-host-v1");
  const evidence = page.getByTestId(
    "scientific-product-frame-evidence-v1",
  );
  const controller = page.getByTestId(
    "scientific-transition-controller-v1",
  );
  await expect(host).toBeVisible({ timeout: 120_000 });
  await expect(evidence).toHaveAttribute("data-studio-runtime", "true");
  await expect(evidence).toHaveAttribute(
    "data-scientific-frame-count",
    /^[1-9]\d*$/,
  );
  await expect(evidence).toHaveAttribute(
    "data-studio-live-playback",
    "running",
  );
  await expect(controller).toHaveAttribute(
    "data-owner-connected",
    "true",
  );
  await expect(controller).toHaveAttribute(
    "data-phase",
    /live-running|live-retargeting/,
  );
  return { host, evidence, controller };
}

async function numericAttributeV1(
  locator: Locator,
  attribute: string,
): Promise<number> {
  const value = await locator.getAttribute(attribute);
  const result = Number(value);
  if (value === null || value.trim() === "" || !Number.isFinite(result)) {
    throw new Error(
      `expected finite ${attribute}, received ${String(value)}`,
    );
  }
  return result;
}

async function setColorInputV1(
  locator: Locator,
  value: `#${string}`,
): Promise<void> {
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(locator).toHaveValue(value);
}

async function acknowledgeModelLimitationsV1(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
}

function captureBrowserErrorsV1(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
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

async function attachBrowserErrorsV1(
  testInfo: TestInfo,
  errors: readonly string[],
): Promise<void> {
  if (errors.length === 0) return;
  await testInfo.attach("browser-errors", {
    body: errors.join("\n"),
    contentType: "text/plain",
  });
}
