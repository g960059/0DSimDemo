import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const RELEASE_SHA256 =
  "d66b948dc85265cc5d40c23038b1e67682784f068bc54c8daf10bb249e6a8e47";

test("runs the exact integrated release and exports a replay-complete artifact", async ({
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
    if (await limitationAcknowledge.isVisible()) {
      await limitationAcknowledge.click();
    }
    const pageHost = page.getByTestId("integrated-model-preview-page-v1");
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
      name: "Download exact RunArtifact",
    }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename())
      .toMatch(/^circleheart-integrated-run-[0-9a-f]{12}\.json$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const exported = JSON.parse(
      await readFile(downloadPath!, "utf8"),
    ) as Record<string, any>;
    expect(exported).toMatchObject({
      artifactId: "circleheart-main-wire-integrated-preview-run-artifact-v1",
      releaseRef: { sha256: RELEASE_SHA256 },
      simulationInputSpec: {
        mechanicalSupport: { presetId: "all-off" },
      },
      sourceSeed: { numericalPeriod1Established: true },
      run: {
        kind: "bundled-p1-seed",
        numericalPeriod1Established: true,
      },
      modelState: { schemaVersion: 3 },
    });
    expect(exported.run.trace).toHaveLength(504);
    expect(exported.artifactSha256).toMatch(/^[0-9a-f]{64}$/);

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

async function checkpointSha(page: import("@playwright/test").Page) {
  const checkpointLabel = page.getByText("Checkpoint SHA-256", {
    exact: true,
  });
  const value = await checkpointLabel.locator("..").locator("dd").textContent();
  expect(value).toMatch(/^[0-9a-f]{64}$/);
  return value;
}
