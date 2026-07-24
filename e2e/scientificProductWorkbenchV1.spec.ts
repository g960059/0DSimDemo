import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const OFFICIAL_PRODUCT_CASE_ID =
  "circleheart/official-healthy-periodic";
const RELEASE_SHA256 =
  "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4";
const LV_PV_TITLE = "LV pressure–volume loop";

test.describe.serial("Studio runtime in the product Workbench", () => {
  test("boots a one-point Studio source in the preserved shell with fixed 1x playback", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      await acknowledgeModelLimitations(page);
      await captureStudioWorkbenchFirstPointsV1(page);
      await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });

      const { host, evidence } = await readyStudioWorkbenchV1(page);
      await expect.poll(async () =>
        (await studioWorkbenchFirstPointsV1(page)).some((observation) =>
          observation.frameCount === "1"
          && observation.targetGeneration === "0"
          && observation.displayedEvidence
            === "settled-snapshot-one-point")
      ).toBe(true);
      await expect(host).toHaveAttribute(
        "data-product-case-id",
        OFFICIAL_PRODUCT_CASE_ID,
      );
      await expect(host).toHaveAttribute(
        "data-release-id",
        "circleheart/adult-five-wall-noncoronary",
      );
      await expect(host).toHaveAttribute("data-release-version", "0.2.0");
      await expect(host).toHaveAttribute(
        "data-release-sha256",
        RELEASE_SHA256,
      );
      await expect(host).toHaveAttribute("data-scenario-count", "1");

      await expect(evidence).toHaveAttribute("data-studio-runtime", "true");
      await expect(evidence).toHaveAttribute(
        "data-studio-target-generation",
        "0",
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-strict-candidate",
        "false",
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-live-playback",
        "running",
      );
      await expect(evidence).toHaveAttribute(
        "data-displayed-evidence",
        "open-transient-no-periodic-claim",
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-strict-phase",
        "source-settled",
      );
      expect(await numericAttributeV1(
        evidence,
        "data-scientific-frame-count",
      )).toBeGreaterThanOrEqual(1);

      await expect(host.locator(".workbench-header")).toHaveCount(1);
      await expect(host.locator(".workbench-dockview")).toHaveCount(2);
      await expect(host.locator(".workbench-dockview-main")).toHaveCount(1);
      await expect(host.locator(".workbench-dockview-metrics")).toHaveCount(1);
      await expect(
        host.locator('[data-workbench-surface-preserved="true"]'),
      ).toHaveCount(1);
      await expect(page.getByTestId("scientific-workbench-page-v1"))
        .toHaveCount(0);

      // Studio playback is deliberately fixed at real-time presentation.
      // The former speed selector and every alternate speed action are absent.
      const header = host.locator(".workbench-header");
      await expect(header.getByRole("button", {
        name: /^(?:0\.5|1|2|5)x$/,
      })).toHaveCount(0);

      const settings = await openStudioSettingsV1(page);
      await expect(settings).toHaveAttribute("data-studio-runtime", "true");
      await expect(settings).toContainText(
        "パラメータを確定するたび、ライブ遷移と独立した厳密収束を自動で開始します。",
      );
      await expect(settings.getByRole("button", {
        name: "ライブ遷移",
        exact: true,
      })).toHaveCount(0);
      await expect(settings.getByRole("button", {
        name: "次の定常状態",
        exact: true,
      })).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });

  test("shows persistent Guyton/Starling sweeps while keeping unavailable V&V and PV analysis explicit", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      await acknowledgeModelLimitations(page);
      await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });
      await readyStudioWorkbenchV1(page);

      const evidenceTrigger = page.getByRole("button", {
        name: /^根拠とチェック:/,
      });
      await evidenceTrigger.click();
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

      await dockTabV1(page, LV_PV_TITLE).click();
      const pvPane = page.getByTestId("scientific-workbench-pane-lv-pv");
      await expect(pvPane).toHaveAttribute(
        "data-pv-analysis-available",
        "false",
      );
      const pvLegend = pvPane.getByTestId(
        "scientific-workbench-chart-legend-v1",
      );
      await pvLegend.click();
      const paneSettings = page.getByRole("dialog", {
        name: "ペイン設定",
      });
      const pvRelationSettings = paneSettings.getByTestId(
        "pv-relation-settings",
      );
      await pvRelationSettings.getByText("研究解析", { exact: true }).click();
      await pvRelationSettings.getByRole("button", {
        name: /負荷系列解析/,
      }).click();
      await page.getByRole("button", {
        name: "ペイン設定を閉じる",
      }).click();

      const pvUnavailable = pvPane.getByTestId(
        "scientific-studio-pv-analysis-unavailable-v1",
      );
      await expect(pvUnavailable).toBeVisible();
      await expect(pvUnavailable).toContainText(
        "Studio load-series analysis is not connected yet.",
      );
      await expect(pvUnavailable).toContainText(
        "The live PV loop remains available.",
      );

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
      await expect(leftGuyton).toHaveAttribute(
        "data-qc-level",
        /pending|pass|warning/,
      );
      await expect(rightGuyton).toHaveAttribute(
        "data-qc-level",
        /pending|pass|warning/,
      );
      await expect(leftGuyton.getByRole("img")).toHaveAccessibleName(
        /^Left filling pressure–cardiac output\b/,
      );
      await expect(rightGuyton.getByRole("img")).toHaveAccessibleName(
        /^Right filling pressure–cardiac output\b/,
      );

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });

  test("fails closed for a route outside the release-bound case catalog", async ({
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
        "This case is not available for the current model release.",
      );
      await expect(unsupported).toContainText(
        "Legacy parameters are not translated silently",
      );
      await expect(unsupported.getByRole("link", {
        name: "Open case catalog",
      })).toHaveAttribute("href", "/ja/cases");
      await expect(page.getByTestId(
        "scientific-product-workbench-host-v1",
      )).toHaveCount(0);
      await expect(page.getByTestId(
        "scientific-product-workbench-loading-v1",
      )).toHaveCount(0);
      await expect(page.locator(".workbench-root")).toHaveCount(0);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
  });
});

type StudioWorkbenchFirstPointObservationV1 = Readonly<{
  frameCount: string | null;
  targetGeneration: string | null;
  displayedEvidence: string | null;
}>;

const STUDIO_WORKBENCH_FIRST_POINTS_KEY_V1 =
  "__circleheartStudioWorkbenchFirstPointsV1";

async function captureStudioWorkbenchFirstPointsV1(
  page: Page,
): Promise<void> {
  await page.addInitScript((key) => {
    const observations: StudioWorkbenchFirstPointObservationV1[] = [];
    const recordedElements = new WeakSet<Element>();
    Object.defineProperty(window, key, {
      configurable: true,
      value: observations,
    });
    const record = (): void => {
      const evidence = document.querySelector(
        '[data-testid="scientific-product-frame-evidence-v1"]',
      );
      if (
        evidence === null
        || recordedElements.has(evidence)
        || evidence.getAttribute("data-studio-runtime") !== "true"
        || evidence.getAttribute("data-scientific-frame-count") !== "1"
        || evidence.getAttribute("data-studio-target-generation") !== "0"
      ) return;
      recordedElements.add(evidence);
      observations.push(Object.freeze({
        frameCount: evidence.getAttribute("data-scientific-frame-count"),
        targetGeneration: evidence.getAttribute(
          "data-studio-target-generation",
        ),
        displayedEvidence: evidence.getAttribute(
          "data-displayed-evidence",
        ),
      }));
    };
    const observer = new MutationObserver(record);
    observer.observe(document, {
      attributes: true,
      attributeFilter: [
        "data-studio-runtime",
        "data-scientific-frame-count",
        "data-studio-target-generation",
        "data-displayed-evidence",
      ],
      childList: true,
      subtree: true,
    });
    record();
  }, STUDIO_WORKBENCH_FIRST_POINTS_KEY_V1);
}

async function studioWorkbenchFirstPointsV1(
  page: Page,
): Promise<readonly StudioWorkbenchFirstPointObservationV1[]> {
  return page.evaluate((key) => {
    const value = (
      window as unknown as Readonly<Record<string, unknown>>
    )[key];
    return Array.isArray(value)
      ? value as readonly StudioWorkbenchFirstPointObservationV1[]
      : [];
  }, STUDIO_WORKBENCH_FIRST_POINTS_KEY_V1);
}

async function readyStudioWorkbenchV1(page: Page): Promise<Readonly<{
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
  await expect(host).toHaveClass(/workbench-root/);
  await expect(evidence).toHaveAttribute("data-studio-runtime", "true");
  await expect(evidence).toHaveAttribute(
    "data-scientific-frame-count",
    /^[1-9]\d*$/,
  );
  await expect(controller).toHaveAttribute("data-owner-connected", "true");
  await expect(controller).toHaveAttribute(
    "data-phase",
    /live-running|live-retargeting/,
  );
  return { host, evidence, controller };
}

async function openStudioSettingsV1(page: Page): Promise<Locator> {
  await page.getByRole("button", {
    name: "ワークベンチパネルを開く",
  }).click();
  const drawer = page.getByRole("complementary", {
    name: "ワークベンチ詳細",
  });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", {
    name: "設定",
    exact: true,
  }).click();
  const settings = drawer.getByTestId(
    "scientific-product-transition-mode-v1",
  );
  await expect(settings).toBeVisible();
  return settings;
}

function dockTabV1(page: Page, title: string): Locator {
  return page.locator(".workbench-dock-tab").filter({ hasText: title });
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

async function acknowledgeModelLimitations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
}

function captureBrowserErrors(page: Page): string[] {
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

async function attachBrowserErrors(
  testInfo: TestInfo,
  errors: readonly string[],
): Promise<void> {
  if (errors.length === 0) return;
  await testInfo.attach("browser-errors", {
    body: errors.join("\n"),
    contentType: "text/plain",
  });
}
