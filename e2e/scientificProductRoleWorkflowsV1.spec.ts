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
      await expect(author).toHaveAttribute(
        "data-draft-revision",
        /^[1-9]\d*$/,
      );
      const authoredRevision = await numericAttributeV1(
        author,
        "data-draft-revision",
      );
      await author.getByRole("button").first().click();

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
          && observation.startedFromOnePoint === "true")
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
      await author.locator(
        `a[href="${new URL(previewUrl).pathname}"]`,
      ).click();
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

  test("Clinician role — enters from Cases, explores a parameter, pauses and resumes, and sees the V&V boundary", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
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
