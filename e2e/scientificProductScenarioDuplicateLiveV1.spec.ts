import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * A duplicated scenario has to actually simulate.
 *
 * No test in the repository exercised `duplicateStable`, and the registry tests
 * mock the controller and the coordinator away, so they confirm that the object
 * was created rather than that it streams.
 *
 * Getting this assertion right took two attempts. A frame-count increase is not
 * evidence: the evidence element reports 0 while a presentation is absent, and
 * runtime readiness then supplies a one-point seed, so 0 -> 1 satisfies "the
 * count went up" without a single live sample. `Number(null)` is also 0, so
 * reading a missing attribute through Number() cannot detect absence either.
 *
 * So this test pins the observable that only a running live lane can move: the
 * revision of the newest presentation frame, read after the duplicate is the
 * active scenario and its live playback reports running.
 */
test.describe.serial("Workbench scenario duplication", () => {
  test("keeps the duplicated scenario streaming live frames", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    page.setDefaultTimeout(30_000);
    const browserErrors = captureBrowserErrorsV1(page);

    await acknowledgeModelLimitationsV1(page);
    await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });

    const host = page.getByTestId("scientific-product-workbench-host-v1");
    const evidence = page.getByTestId("scientific-product-frame-evidence-v1");
    await expect(host).toBeVisible({ timeout: 120_000 });
    await expect(host).toHaveAttribute("data-scenario-count", "1");
    await expect(evidence).toHaveAttribute("data-studio-runtime", "true");

    // The source must be streaming first, or a stalled duplicate proves nothing.
    const sourceScenarioId = await requiredAttributeV1(
      evidence,
      "data-scenario-id",
    );
    await expectStreamingV1(evidence, "source scenario");

    // Duplicate up to the registry's four-scenario cap rather than once, so the
    // probe also covers the load a reporter running several scenarios had.
    for (let index = 0; index < 3; index += 1) {
      const previousScenarioId = await requiredAttributeV1(
        evidence,
        "data-scenario-id",
      );

      // The scenario row is itself a role="button" carrying the same accessible
      // name, so match the actions control by tag and label, not by role.
      await page.locator(
        'button[aria-label="Healthy periodic baselineの操作"]',
      ).first().click();
      await page.getByRole("button", { name: "複製", exact: true }).click();
      await expect(host).toHaveAttribute(
        "data-scenario-count",
        String(index + 2),
      );

      // Duplication activates the copy, so the evidence element must switch to
      // reporting a different scenario before its numbers mean anything.
      await expect
        .poll(async () => await evidence.getAttribute("data-scenario-id"), {
          timeout: 60_000,
        })
        .not.toBe(previousScenarioId);

      await expectStreamingV1(evidence, `duplicate ${index + 1}`);
    }

    expect(await requiredAttributeV1(evidence, "data-scenario-id"))
      .not.toBe(sourceScenarioId);
    expect(browserErrors, browserErrors.join("\n")).toEqual([]);
  });
});

/**
 * Asserts the active scenario has a live lane that is actually advancing.
 *
 * Three conditions, in order: playback reports running, a presentation exists
 * at all, and the newest frame's revision strictly increases. The revision is
 * the discriminating observable — a seed frame gives a frame count but cannot
 * make the revision move.
 */
async function expectStreamingV1(
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
