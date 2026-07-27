import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * A live lane under sustained multi-scenario load has to keep streaming.
 *
 * The retired behaviour threw once cumulative pacing lag crossed one canonical
 * cycle, and that throw became a permanent lane failure. It was reported from a
 * real browser as `live 1x pacing lag 1020.100 ms exceeded the declared 1000 ms
 * maximum`, reached by duplicating a scenario: each scenario runs its own worker
 * loop, so per-scenario throughput falls below 1x.
 *
 * The earlier duplication test could not catch it. It asserted that a duplicate
 * streams at all, which is satisfied within a second or two — long before 1,000
 * ms of lag can accumulate. This test therefore holds every scenario live under
 * full load for long enough to cross the retired cap several times over, and
 * asserts the lane is still advancing at the end rather than merely at the
 * start.
 *
 * The observable is the newest presentation frame's revision, read only after
 * playback reports running. A frame count proves nothing: the evidence element
 * reports 0 with no presentation and readiness then supplies a one-point seed,
 * so 0 -> 1 looks like progress without a single live sample. `Number(null)` is
 * also 0, so a missing attribute cannot be detected through Number().
 */
test.describe.serial("Workbench live pacing under sustained load", () => {
  test(
    "keeps every scenario streaming past the retired 1x lag cap",
    { tag: "@full-e2e" },
    async ({ page }) => {
      test.setTimeout(420_000);
      page.setDefaultTimeout(60_000);
      const browserErrors = captureBrowserErrorsV1(page);

      await acknowledgeModelLimitationsV1(page);
      await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });

      const host = page.getByTestId("scientific-product-workbench-host-v1");
      const evidence = page.getByTestId("scientific-product-frame-evidence-v1");
      await expect(host).toBeVisible({ timeout: 120_000 });
      await expect(evidence).toHaveAttribute("data-studio-runtime", "true");
      await expectRunningV1(evidence, "source scenario");

      // Duplicate to the registry's four-scenario cap. This is the load that
      // pushes per-scenario throughput below 1x in the first place.
      for (let index = 0; index < 3; index += 1) {
        const previousScenarioId = await requiredAttributeV1(
          evidence,
          "data-scenario-id",
        );
        await page.locator(
          'button[aria-label="Healthy periodic baselineの操作"]',
        ).first().click();
        await page.getByRole("button", { name: "複製", exact: true }).click();
        await expect(host).toHaveAttribute(
          "data-scenario-count",
          String(index + 2),
        );
        await expect
          .poll(async () => await evidence.getAttribute("data-scenario-id"), {
            timeout: 60_000,
          })
          .not.toBe(previousScenarioId);
        await expectRunningV1(evidence, `duplicate ${index + 1}`);
      }

      // Hold the load. The retired cap fired at 1,000 ms of accumulated lag;
      // this window is long enough to reach it many times over even if each
      // scenario is only slightly slower than realtime.
      const beforeRevision = await revisionV1(evidence, "sustained load");
      const beforeDeficit = await pacingNumberV1(
        evidence,
        "data-studio-live-pacing-rebased-deficit-ms",
      );
      await page.waitForTimeout(120_000);

      // The reported symptom was a dead lane, so the assertion is that the
      // active scenario is still advancing after the load window, not that it
      // once advanced before it.
      await expect(
        evidence,
        "live playback stopped running under sustained load",
      ).toHaveAttribute("data-studio-live-playback", "running");
      expect(
        await revisionV1(evidence, "sustained load"),
        "presentation stopped advancing under sustained load",
      ).toBeGreaterThan(beforeRevision);

      // Degrading is allowed and expected; failing is not. Pacing must report a
      // mode either way, and any deficit it accumulated must be reported rather
      // than hidden.
      const mode = await requiredAttributeV1(
        evidence,
        "data-studio-live-pacing-mode",
      );
      expect(["realtime-1x", "degraded"]).toContain(mode);
      if (mode === "degraded") {
        expect(
          await pacingNumberV1(
            evidence,
            "data-studio-live-pacing-rebased-deficit-ms",
          ),
          "degraded pacing reported no re-anchored deficit",
        ).toBeGreaterThanOrEqual(beforeDeficit);
        // The rate has to be a number here. A lane this slow re-anchors before
        // it can ever assemble a clean cycle, so a rate scoped to the recovery
        // window would stay null forever and the panel would promise a
        // measurement that never arrives.
        expect(
          await pacingNumberV1(
            evidence,
            "data-studio-live-pacing-achieved-rate",
          ),
          "degraded pacing reported no achieved rate",
        ).toBeGreaterThan(0);
      }

      // The exact failure the owner saw must not be on screen.
      const alerts = await page.getByRole("alert").allTextContents();
      expect(
        alerts.join("\n"),
        "the retired pacing failure is still reachable",
      ).not.toContain("live 1x pacing lag");
      expect(browserErrors, browserErrors.join("\n")).toEqual([]);
    },
  );
});

async function expectRunningV1(
  evidence: Locator,
  label: string,
): Promise<void> {
  await expect(evidence, `${label}: live playback never reached running`)
    .toHaveAttribute("data-studio-live-playback", "running", {
      timeout: 60_000,
    });
  await expect
    .poll(
      async () => await evidence.getAttribute("data-displayed-evidence"),
      { timeout: 60_000 },
    )
    .not.toBe("unavailable");

  const first = await revisionV1(evidence, label);
  await expect
    .poll(async () => await revisionV1(evidence, label), {
      timeout: 60_000,
      intervals: [500],
      message: `${label}: presentation revision stopped advancing`,
    })
    .toBeGreaterThan(first);
}

async function revisionV1(evidence: Locator, label: string): Promise<number> {
  const raw = await evidence.getAttribute("data-scientific-final-revision");
  // An absent or empty attribute is a failure, never a number. Coercing it
  // would silently read as 0 and let the next real value look like progress.
  if (raw === null || raw.trim() === "") {
    throw new Error(`${label}: no presentation frame revision was published`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${label}: non-numeric frame revision ${raw}`);
  }
  return value;
}

async function pacingNumberV1(
  evidence: Locator,
  attribute: string,
): Promise<number> {
  const raw = await requiredAttributeV1(evidence, attribute);
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`non-numeric ${attribute}: ${raw}`);
  }
  return value;
}

async function requiredAttributeV1(
  locator: Locator,
  attribute: string,
): Promise<string> {
  const value = await locator.getAttribute(attribute);
  if (value === null || value.trim() === "") {
    throw new Error(`expected ${attribute} to be present`);
  }
  return value;
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
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}
