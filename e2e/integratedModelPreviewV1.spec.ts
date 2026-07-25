import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const RELEASE_SHA256 =
  "32d4f2c936eabd6b19fcb18386ba540174de6627110b1c2febb0140938f0fa5d";

test("runs the exact integrated release and exports an exact run record", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) =>
    browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (
      message.type() === "error"
      && message.text() !== "Please check your Firebase configuration."
    ) browserErrors.push(`console.error: ${message.text()}`);
  });

  try {
    await page.goto("/ja/integrated-preview", {
      waitUntil: "domcontentloaded",
    });
    const limitationAcknowledge = page.getByRole("button", {
      name: "理解しました",
    });
    const pageHost = page.getByTestId("integrated-model-preview-page-v1");
    await expect(limitationAcknowledge).toBeVisible();
    await expect(page.getByText(
      "the pulmonary PA-PArt waveform mechanism remains an open structural blocker",
      { exact: true },
    )).toBeVisible();
    await expect(pageHost).toHaveAttribute("data-runtime-phase", "loading");
    await limitationAcknowledge.click();
    await expect(pageHost).toHaveAttribute("data-runtime-phase", "ready", {
      timeout: 30_000,
    });
    await expect(pageHost).toHaveAttribute("data-mcs-preset-id", "all-off");
    await expect(page.getByText(RELEASE_SHA256, { exact: true })).toBeVisible();
    await expect(page.getByTestId("integrated-model-preview-run-v1"))
      .toContainText("Numerical P1 seed");
    await expect(page.getByText("58.3%", { exact: true })).toBeVisible();
    await expect(page.getByText("5.44 L/min", { exact: true })).toBeVisible();
    await expect(page.getByText("37.8 mmHg", { exact: true })).toBeVisible();
    await expect(page.locator("figure")).toHaveCount(6);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", {
      name: "Download exact run record",
    }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename())
      .toMatch(/^circleheart-integrated-run-record-[0-9a-f]{12}\.json$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const exported = JSON.parse(
      await readFile(downloadPath!, "utf8"),
    ) as Record<string, any>;
    expect(exported).toMatchObject({
      artifactId: "circleheart-main-wire-integrated-preview-run-record-v2",
      schemaVersion: 2,
      releaseRef: { sha256: RELEASE_SHA256 },
      simulationInputSpec: {
        mechanicalSupport: { presetId: "all-off" },
      },
      sourceSeed: { numericalPeriod1Established: true },
      run: {
        kind: "bundled-p1-seed",
        numericalPeriod1Established: true,
      },
      startModelState: {
        schemaVersion: 3,
        acceptedTimeSec: 69,
      },
      terminalModelState: {
        schemaVersion: 3,
        acceptedTimeSec: 70,
      },
      replayCompleteness: {
        stateTransitionInputIdentitiesIncluded: true,
        exactStartCheckpointIncluded: true,
        exactTerminalCheckpointIncluded: true,
        executableBuildProvenanceAttached: false,
        standaloneReplayCompleteArtifactClaimed: false,
        promotionEligibility: "eligible-with-current-runtime-exact-replay",
        upgradePath:
          "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1",
      },
    });
    expect(exported.run.trace).toHaveLength(504);
    expect(exported.recordSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(exported).not.toHaveProperty("buildArtifactRef");

    await page.getByRole("button", {
      name: "HeartMate II · 9,000 rpm",
    }).click();
    await expect(pageHost).toHaveAttribute(
      "data-mcs-preset-id",
      "lvad-hmii-9000-one-beat-transient",
    );
    await expect(pageHost).toHaveAttribute("data-runtime-phase", "ready", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("integrated-model-preview-run-v1"))
      .toContainText("Open transient");
    await expect(page.getByText("2.46 L/min", { exact: true })).toBeVisible();
    const checkpointBefore = await checkpointSha(page);
    await page.getByRole("button", { name: "Run next beat" }).click();
    await expect(pageHost).toHaveAttribute("data-runtime-phase", "loading");
    await expect(pageHost).toHaveAttribute("data-runtime-phase", "ready", {
      timeout: 30_000,
    });
    expect(await checkpointSha(page)).not.toBe(checkpointBefore);
    expect(browserErrors).toEqual([]);
  } finally {
    await testInfo.attach("browser-errors.txt", {
      body: Buffer.from(browserErrors.join("\n") || "none"),
      contentType: "text/plain",
    });
  }
});

test("keeps the Worker closed until explicit acknowledgement when storage fails", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const acknowledgementKey =
      "circleheart.modelLimitations.circleheart-adult-five-wall-integrated-preview.0.1.0";
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function getItem(key: string): string | null {
      if (key === acknowledgementKey) {
        throw new DOMException("storage read unavailable", "SecurityError");
      }
      return originalGetItem.call(this, key);
    };
    Storage.prototype.setItem = function setItem(
      key: string,
      value: string,
    ): void {
      if (key === acknowledgementKey) {
        throw new DOMException("storage write unavailable", "SecurityError");
      }
      originalSetItem.call(this, key, value);
    };
    const NativeWorker = window.Worker;
    (window as typeof window & {
      __integratedPreviewWorkerConstructionCount: number;
    }).__integratedPreviewWorkerConstructionCount = 0;
    window.Worker = class CountingWorker extends NativeWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        (window as typeof window & {
          __integratedPreviewWorkerConstructionCount: number;
        }).__integratedPreviewWorkerConstructionCount += 1;
        super(scriptURL, options);
      }
    };
  });

  await page.goto("/ja/integrated-preview", {
    waitUntil: "domcontentloaded",
  });
  const pageHost = page.getByTestId("integrated-model-preview-page-v1");
  const acknowledge = page.getByRole("button", { name: "理解しました" });
  await expect(acknowledge).toBeVisible();
  await expect(pageHost).toContainText(
    "Review and acknowledge this release's model limitations to continue.",
  );
  expect(await workerConstructionCount(page)).toBe(0);

  await page.keyboard.press("Escape");
  await expect(acknowledge).toBeVisible();
  expect(await workerConstructionCount(page)).toBe(0);

  await acknowledge.click();
  await expect(pageHost).toHaveAttribute("data-runtime-phase", "ready", {
    timeout: 30_000,
  });
  expect(await workerConstructionCount(page)).toBe(1);
});

async function checkpointSha(page: import("@playwright/test").Page) {
  const checkpointLabel = page.getByText("Terminal checkpoint SHA-256", {
    exact: true,
  });
  const value = await checkpointLabel.locator("..").locator("dd").textContent();
  expect(value).toMatch(/^[0-9a-f]{64}$/);
  return value;
}

async function workerConstructionCount(
  page: import("@playwright/test").Page,
): Promise<number> {
  return page.evaluate(
    () => (window as typeof window & {
      __integratedPreviewWorkerConstructionCount: number;
    }).__integratedPreviewWorkerConstructionCount,
  );
}
