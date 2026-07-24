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

      const author = page.getByTestId("studio-document-author-v1");
      await expect(author).toBeVisible();
      const authoredTitle =
        "E2E: 全身血管抵抗を上げたときの圧波形";
      const authoredIntroduction =
        "Author E2Eで編集した導入文です。左室圧と大動脈圧を同じ時間軸で観察します。";
      await author.locator("input").first().fill(authoredTitle);
      const introduction = author.locator("textarea").first();
      await introduction.fill(authoredIntroduction);
      await introduction.blur();
      const documentEditor = author.getByTestId(
        "studio-document-block-editor-v1",
      );
      await documentEditor.getByRole("button", {
        name: "H2見出しを追加",
        exact: true,
      }).click();
      const addedHeading = documentEditor.getByTestId(
        "studio-document-editor-block-v1",
      ).last();
      await expect(addedHeading).toHaveAttribute(
        "data-document-block-kind",
        "heading",
      );
      const structuralRevision = await numericAttributeV1(
        author,
        "data-draft-revision",
      );
      await page.goBack({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/ja\/$/);
      await page.goForward({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/ja\/studio\/author$/);
      await expect(author).toHaveAttribute(
        "data-draft-revision",
        String(structuralRevision),
      );
      await expect(addedHeading).toHaveAttribute(
        "data-document-block-kind",
        "heading",
      );
      const authoredHeading = "E2Eで追加した観察項目";
      const addedHeadingInput = addedHeading.getByRole("textbox");
      await addedHeadingInput.fill(authoredHeading);
      await addedHeadingInput.blur();
      await expect(author).toHaveAttribute(
        "data-draft-revision",
        /^[1-9]\d*$/,
      );
      await expect(author).toHaveAttribute("data-editor-dirty", "false");
      const authoredRevision = await numericAttributeV1(
        author,
        "data-draft-revision",
      );
      await author.getByRole("button", {
        name: "Readerで確認",
        exact: true,
      }).click();

      await expect(page).toHaveURL(
        /\/ja\/studio\/preview\/[^/?#]+$/,
        { timeout: 120_000 },
      );
      const previewUrl = page.url();
      const preview = page.getByTestId("studio-reader-preview-v1");
      await expect(preview).toBeVisible({ timeout: 120_000 });
      await expect(preview).toHaveAttribute(
        "data-preview-trust",
        "draft-preview-uncertified",
      );
      await expect(preview).toHaveAttribute(
        "data-preview-share-policy",
        "session-only",
      );
      await expect(preview).toHaveAttribute(
        "data-publication-manifest-ref",
        "null",
      );

      const reader = page.getByTestId("studio-document-reader-v1");
      await expect(reader.getByRole("heading", {
        name: authoredTitle,
        exact: true,
      })).toBeVisible();
      await expect(reader).toContainText(authoredIntroduction);
      await expect(reader.getByRole("heading", {
        name: authoredHeading,
        exact: true,
      })).toBeVisible();

      const sharedGraphPanes = reader.getByTestId(
        "studio-reader-shared-graph-panes-v1",
      );
      await expect(
        sharedGraphPanes.locator(
          'section[data-studio-reader-pane-kind="waveform"]',
        ),
      ).toHaveCount(1);
      await expect(
        sharedGraphPanes.locator(
          'section[data-studio-reader-pane-kind="pv-loop"]',
        ),
      ).toHaveCount(1);
      await expect(
        sharedGraphPanes.locator(
          'section[data-studio-reader-pane-kind="guyton-left"]',
        ),
      ).toHaveCount(1);
      const readerWaveformPane = sharedGraphPanes.locator(
        'section[data-studio-reader-pane-kind="waveform"]',
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
      const readerPv = sharedGraphPanes.getByTestId(
        "scientific-workbench-pv-canvas-v1",
      );
      await expect(readerWaveform).toBeVisible();
      await expect(readerPv).toBeVisible();
      await expect(sharedGraphPanes.getByTestId(
        "scientific-left-cardiac-output-filling-pressure-pane-v1",
      )).toHaveAttribute(
        "data-protocol-status",
        /running|partial|complete/,
      );

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
          && observation.waveformFrameCount === "1"
          && observation.pvFrameCount === "1")
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
      await expect.poll(async () => numericAttributeV1(
        readerPv,
        "data-pv-parameter-history-count",
      )).toBeGreaterThan(0);

      // Returning to the same manifest must construct a fresh numerical
      // session. The previous Reader-only parameter choice is not authored
      // content and therefore returns to the brief's initial value.
      const firstVisitObservationCount =
        (await readerFirstPaintsV1(page)).length;
      await preview.locator('a[href="/ja/studio/author"]').click();
      await expect(author).toBeVisible();
      await expect(author).toHaveAttribute(
        "data-draft-revision",
        String(authoredRevision),
      );
      await author.getByRole("button", {
        name: "直前のReader Previewを開く",
        exact: true,
      }).click();
      await expect(page).toHaveURL(previewUrl);
      const reopenedExperiment = page.getByTestId(
        "studio-reader-experiment-cell-v1",
      );
      await expect(reopenedExperiment).toBeVisible({ timeout: 120_000 });
      const reopenedSystemic = reopenedExperiment.getByRole("slider", {
        name: "全身血管抵抗倍率",
        exact: true,
      });
      await expect(reopenedSystemic.locator("..").locator("output"))
        .toHaveText("1");
      await expect(reopenedExperiment).toHaveAttribute(
        "data-reader-target-generation",
        "0",
      );
      await expect.poll(async () =>
        (await readerFirstPaintsV1(page))
          .slice(firstVisitObservationCount)
          .some((observation) =>
            observation.phase === "seed"
            && observation.frameCount === "1")
      ).toBe(true);

      // Preview manifests live only in the current provider instance. A hard
      // reload creates another session and must not resolve the old URL.
      await page.reload({ waitUntil: "domcontentloaded" });
      const expired = page.getByTestId(
        "studio-reader-preview-unavailable-v1",
      );
      await expect(expired).toBeVisible();
      await expect(expired.getByRole("heading", {
        name: "このPreviewは利用できません",
        exact: true,
      })).toBeVisible();
      await expect(expired).toContainText(
        "再読み込み、別タブ、または新しいセッションでは復元できません。",
      );
      await expect(page.getByTestId("studio-reader-preview-v1"))
        .toHaveCount(0);
      await expect(page.getByTestId("studio-reader-experiment-cell-v1"))
        .toHaveCount(0);

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
      const pressureCapture = composer.locator(
        '[data-briefing-source-panel-id="product-left-pressure-v1"]',
      );
      await expect(pressureCapture).toContainText("7s");
      await composer.getByRole("button", {
        name: "すべてcapture",
        exact: true,
      }).click();
      await expect(
        composer.locator('[data-briefing-captured="true"]'),
      ).toHaveCount(5);
      await expect(composer).toContainText(
        "5 paneをReader Briefに保存中",
      );
      await composer.getByRole("button", {
        name: "記事を編集",
        exact: true,
      }).click();
      await expect(page).toHaveURL(/\/ja\/studio\/author$/);
      const author = page.getByTestId("studio-document-author-v1");
      await expect(author).toBeVisible();
      await expect(author).toHaveAttribute(
        "data-draft-revision",
        /^[1-9]\d*$/,
      );
      await author.getByRole("button", {
        name: "Readerで確認",
        exact: true,
      }).click();

      const reader = page.getByTestId("studio-document-reader-v1");
      await expect(reader).toBeVisible({ timeout: 120_000 });
      const capturedPanes = reader.getByTestId(
        "studio-reader-shared-graph-panes-v1",
      );
      await expect(
        capturedPanes.locator(
          "section[data-studio-reader-pane-kind]",
        ),
      ).toHaveCount(5);
      const capturedPressurePane = capturedPanes.locator(
        'section[data-studio-reader-pane-kind="waveform"]',
      ).filter({ hasText: "AoP / LVP / LAP" });
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
      await expect(capturedPanes.locator(
        'section[data-studio-reader-pane-kind="pv-loop"]',
      )).toHaveCount(1);
      await expect(capturedPanes.locator(
        'section[data-studio-reader-pane-kind="guyton-left"]',
      )).toHaveCount(1);
      await expect(capturedPanes.locator(
        'section[data-studio-reader-pane-kind="guyton-right"]',
      )).toHaveCount(1);
      await expect(capturedPanes.locator(
        'section[data-studio-reader-pane-kind="waveform"]',
      )).toHaveCount(2);
      const capturedLeftGuyton = capturedPanes.locator(
        'section[data-studio-reader-pane-kind="guyton-left"]',
      ).filter({ hasText: "Left filling pressure–cardiac output" });
      const capturedRightGuyton = capturedPanes.locator(
        'section[data-studio-reader-pane-kind="guyton-right"]',
      ).filter({ hasText: "Right filling pressure–cardiac output" });
      await expect(capturedLeftGuyton.getByTestId(
        "scientific-left-cardiac-output-filling-pressure-pane-v1",
      )).toHaveAttribute(
        "data-protocol-status",
        /running|partial|complete/,
      );
      await expect(capturedRightGuyton.getByTestId(
        "scientific-right-cardiac-output-filling-pressure-pane-v1",
      )).toHaveAttribute(
        "data-protocol-status",
        /running|partial|complete/,
      );

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
      if (waveform === null || pv === null) return;
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
        pvFrameCount: pv.getAttribute(
          "data-scientific-frame-count",
        ),
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
