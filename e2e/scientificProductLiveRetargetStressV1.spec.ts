import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

test.describe.serial("Studio product bridge lifecycle", () => {
  test("keeps the live trace coherent across a commit and header pause/resume", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrorsV1(page);

    try {
      const { evidence, controller } = await openReadyStudioWorkbenchV1(page);
      const systemic = controller.getByRole("slider", {
        name: "Systemic resistance scale",
        exact: true,
      });
      await expect(systemic).toHaveAttribute("aria-valuetext", "1.0×");

      const generation = await numericAttributeV1(
        evidence,
        "data-studio-target-generation",
      );
      const sourceRevision = await numericAttributeV1(
        evidence,
        "data-scientific-final-revision",
      );

      const pause = page.getByRole("button", {
        name: "ライブ波形を一時停止",
        exact: true,
      });
      await pause.click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await expect(evidence).toHaveAttribute(
        "data-studio-live-playback",
        "suspended",
      );
      const pausedRevision = await numericAttributeV1(
        evidence,
        "data-scientific-final-revision",
      );
      await page.waitForTimeout(350);
      expect(await numericAttributeV1(
        evidence,
        "data-scientific-final-revision",
      )).toBe(pausedRevision);

      const resume = page.getByRole("button", {
        name: "ライブ波形を再開",
        exact: true,
      });
      await resume.click();
      await expect(controller).toHaveAttribute(
        "data-phase",
        /live-retargeting|live-running/,
      );
      await expect(evidence).toHaveAttribute(
        "data-studio-live-playback",
        "running",
      );
      await expect.poll(async () => numericAttributeV1(
        evidence,
        "data-scientific-final-revision",
      )).toBeGreaterThan(pausedRevision);

      await systemic.focus();
      await systemic.press("ArrowRight");
      await expect(evidence).toHaveAttribute(
        "data-studio-target-generation",
        String(generation + 1),
      );
      await expect(controller).toHaveAttribute(
        "data-phase",
        /live-retargeting|live-running/,
      );
      await expect.poll(async () => numericAttributeV1(
        evidence,
        "data-scientific-final-revision",
      )).toBeGreaterThan(sourceRevision);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrorsV1(testInfo, browserErrors);
    }
  });

  test(
    "automatically settles the committed generation, then pins and promotes it",
    { tag: "@full-e2e" },
    async ({ page }, testInfo) => {
      test.setTimeout(360_000);
      page.setDefaultTimeout(30_000);
      const browserErrors = captureBrowserErrorsV1(page);

      try {
        const { evidence, controller } =
          await openReadyStudioWorkbenchV1(page);
        const systemic = controller.getByRole("slider", {
          name: "Systemic resistance scale",
          exact: true,
        });
        const initialGeneration = await numericAttributeV1(
          evidence,
          "data-studio-target-generation",
        );

        await systemic.focus();
        await systemic.press("ArrowRight");
        const committedGeneration = initialGeneration + 1;
        await expect(evidence).toHaveAttribute(
          "data-studio-target-generation",
          String(committedGeneration),
        );

        const settings = await openStudioSettingsV1(page);
        await expect(settings).toContainText(
          /自動計算中|収束候補を利用できます/,
        );
        await expect(evidence).toHaveAttribute(
          "data-studio-strict-candidate",
          "true",
          { timeout: 300_000 },
        );
        await expect(settings).toHaveAttribute(
          "data-strict-candidate-available",
          "true",
        );

        const pin = settings.getByRole("button", {
          name: "Runを固定",
          exact: true,
        });
        await expect(pin).toBeEnabled();
        await pin.click();
        await expect(settings.getByRole("button", {
          name: "固定済み",
          exact: true,
        })).toBeDisabled();
        await expect(settings).toContainText("1件のRunを固定済み");

        const presentationRevision = await numericAttributeV1(
          evidence,
          "data-studio-presentation-revision",
        );
        const useSettled = settings.getByRole("button", {
          name: "収束状態を使う",
          exact: true,
        });
        await expect(useSettled).toBeEnabled();
        await useSettled.click();

        await expect(evidence).toHaveAttribute(
          "data-studio-strict-candidate",
          "false",
        );
        await expect(evidence).toHaveAttribute(
          "data-studio-target-generation",
          String(committedGeneration),
        );
        await expect(evidence).toHaveAttribute(
          "data-displayed-evidence",
          "open-transient-no-periodic-claim",
        );
        await expect(evidence).toHaveAttribute(
          "data-studio-strict-phase",
          "settled-in-use",
        );
        await expect.poll(async () => numericAttributeV1(
          evidence,
          "data-studio-presentation-revision",
        )).toBeGreaterThan(presentationRevision);
        await expect(settings).toContainText("1件のRunを固定済み");
        await expect(settings.getByRole("button", {
          name: "収束状態を使う",
          exact: true,
        })).toBeDisabled();

        expect(browserErrors).toEqual([]);
      } finally {
        await attachBrowserErrorsV1(testInfo, browserErrors);
      }
    },
  );
});

async function openReadyStudioWorkbenchV1(page: Page): Promise<Readonly<{
  evidence: Locator;
  controller: Locator;
}>> {
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
  await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });

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
  await expect(controller).toHaveAttribute("data-owner-connected", "true");
  await expect(controller).toHaveAttribute(
    "data-phase",
    /live-running|live-retargeting/,
  );
  return { evidence, controller };
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
