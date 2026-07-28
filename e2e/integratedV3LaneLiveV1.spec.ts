import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Step 9 landing verification for the experimental integrated V3 lane.
 *
 * Unit tests cannot establish any of this. Earlier in this programme one change
 * passed 1,005 unit tests and killed the live lane in a real browser, silently,
 * about one physiological second in, with pacing still reporting `realtime-1x`.
 * So the lane is driven here through the production build, the real Worker and
 * a real canvas.
 *
 * Two traps this file is written around. A frame count proves nothing: it reads
 * 0 with no presentation, and readiness then supplies a one-point seed, so
 * 0 -> 1 looks like progress without a single live sample. And `Number(null)`
 * is 0, so a missing attribute cannot be told apart from a stalled lane through
 * `Number()`. Every reading below therefore goes through `requiredAttributeV1`,
 * which fails when the attribute is absent, and advancement is judged by a
 * strictly increasing accepted revision across wall-clock time.
 */

const LANE_CASE_ID_V1 = "integrated-coronary-sinus-hmii-9000-experimental-v1";

const EXPECTED_LIMITATIONS_V1 = [
  "Experimental lane. Development lifecycle, unverified evidence. This is not a release.",
  "Fixed input. Regular sinus at a 1.000 s cycle, normal-adult coronary priors, and a HeartMate II LVAD at 9,000 rpm. Nothing on this lane can be adjusted.",
  "Regular sinus only. Atrial fibrillation, other non-sinus rhythms, and IABP are not available on this lane.",
  "The LVAD circuit inertance profile is production-owned and explicitly not release-approved.",
  "Not clinically validated, not patient-specific, and not fitted to any patient or waveform.",
  "Cold, transient exploration. Periodic steady state is not established, and long-term physiological behaviour is not established.",
  "This lane runs below realtime. It reports the rate it actually achieves. Running slower than realtime is expected here, not a fault.",
  "Live view only. There is no exact 0.002 s export, no saved snapshot, and no steady-state candidate on this lane.",
] as const;

test.describe.serial("Experimental integrated V3 lane", () => {
  test(
    "runs live in a real browser Worker and reports the rate it achieves",
    { tag: "@full-e2e" },
    async ({ page }) => {
      test.setTimeout(300_000);
      page.setDefaultTimeout(60_000);
      const browserErrors = captureBrowserErrorsV1(page);

      await acknowledgeModelLimitationsV1(page);
      await page.goto(`/ja/workbench/${LANE_CASE_ID_V1}`, {
        waitUntil: "domcontentloaded",
      });

      const surface = page.getByTestId("integrated-v3-product-surface-v1");
      await expect(surface).toBeVisible({ timeout: 180_000 });

      // The lane must actually advance, not merely render once.
      const firstRevision = Number(
        await requiredAttributeV1(surface, "data-accepted-revision"),
      );
      const firstTimeSec = Number(
        await requiredAttributeV1(surface, "data-model-time-sec"),
      );
      const startedAtMs = Date.now();

      await expect
        .poll(
          async () =>
            Number(await requiredAttributeV1(surface, "data-accepted-revision")),
          { timeout: 120_000, intervals: [500] },
        )
        .toBeGreaterThan(firstRevision + 1_000);

      const elapsedMs = Date.now() - startedAtMs;
      const lastRevision = Number(
        await requiredAttributeV1(surface, "data-accepted-revision"),
      );
      const lastTimeSec = Number(
        await requiredAttributeV1(surface, "data-model-time-sec"),
      );

      expect(Number.isFinite(firstRevision)).toBe(true);
      expect(lastRevision).toBeGreaterThan(firstRevision);
      expect(lastTimeSec).toBeGreaterThan(firstTimeSec);

      const modelSecondsAdvanced = lastTimeSec - firstTimeSec;
      const measuredRealtimeMultiple =
        modelSecondsAdvanced / (elapsedMs / 1_000);
      const wallClockSecondsPerBeat = 1 / measuredRealtimeMultiple;

      // Reported for the record. The achieved rate is machine dependent, so the
      // assertion is only that the lane is genuinely below realtime and genuinely
      // moving — not a pinned number.
      console.log(
        `[integrated-v3] advanced ${modelSecondsAdvanced.toFixed(3)} model s `
          + `in ${(elapsedMs / 1_000).toFixed(3)} wall s = `
          + `${measuredRealtimeMultiple.toFixed(3)}x realtime, `
          + `${wallClockSecondsPerBeat.toFixed(2)} s per 1.000 s beat`,
      );
      expect(measuredRealtimeMultiple).toBeGreaterThan(0);
      expect(measuredRealtimeMultiple).toBeLessThan(1);

      // The window above starts cold, so it charges the lane for JIT warm-up,
      // Worker startup and the first canvas layout. A second window taken well
      // after start separates one-off cost from steady-state throughput; the
      // node harnesses discard 600 warm-up steps before timing anything, and
      // without this the two numbers are not comparable.
      const warmStartRevision = lastRevision;
      const warmStartTimeSec = lastTimeSec;
      const warmStartedAtMs = Date.now();
      await expect
        .poll(
          async () =>
            Number(await requiredAttributeV1(surface, "data-accepted-revision")),
          { timeout: 120_000, intervals: [500] },
        )
        .toBeGreaterThan(warmStartRevision + 1_000);
      const warmElapsedMs = Date.now() - warmStartedAtMs;
      const warmTimeSec = Number(
        await requiredAttributeV1(surface, "data-model-time-sec"),
      );
      const warmMultiple = (warmTimeSec - warmStartTimeSec)
        / (warmElapsedMs / 1_000);
      console.log(
        `[integrated-v3] warm window: ${warmMultiple.toFixed(3)}x realtime, `
          + `${(1 / warmMultiple).toFixed(2)} s per 1.000 s beat`,
      );
      expect(warmMultiple).toBeGreaterThan(0);

      // T14: this lane must never claim realtime-1x.
      const pacingState = await requiredAttributeV1(surface, "data-pacing-state");
      expect(pacingState).not.toBe("realtime-1x");
      const achievedRate = await requiredAttributeV1(surface, "data-achieved-rate");
      expect(achievedRate).not.toBe("");
      expect(Number(achievedRate)).toBeGreaterThan(0);

      // T5: the presentation stream must not borrow the exact-export coverage.
      const coverage = await requiredAttributeV1(
        surface,
        "data-presentation-coverage",
      );
      expect(coverage).not.toContain("exact");

      // The coronary and LVAD charts must actually draw something.
      for (const title of ["Coronary inlet flow", "LVAD flow", "LV volume"]) {
        await expectCanvasHasDrawnContentV1(page, title);
      }

      // T8: every limitation, verbatim and in order.
      const limitations = page.getByTestId("integrated-v3-limitations-v1")
        .locator("li");
      await expect(limitations).toHaveCount(EXPECTED_LIMITATIONS_V1.length);
      for (const [index, expected] of EXPECTED_LIMITATIONS_V1.entries()) {
        await expect(limitations.nth(index)).toHaveText(expected);
      }

      // T9: every unavailable action is disabled before invocation and carries
      // its explanation.
      const unavailable = page.locator("[data-capability-available='false']");
      const unavailableCount = await unavailable.count();
      expect(unavailableCount).toBeGreaterThan(0);
      for (let index = 0; index < unavailableCount; index += 1) {
        const entry = unavailable.nth(index);
        const key = await requiredAttributeV1(entry, "data-capability-key");
        await expect(entry.locator(`[data-capability-action='${key}']`))
          .toBeDisabled();
        await expect(entry.locator(`[data-capability-explanation='${key}']`))
          .not.toBeEmpty();
      }

      expect(browserErrors, browserErrors.join("\n")).toEqual([]);
    },
  );
});

async function expectCanvasHasDrawnContentV1(
  page: Page,
  title: string,
): Promise<void> {
  const canvas = page
    .locator("section", { hasText: title })
    .locator("canvas")
    .first();
  await expect(canvas).toBeVisible();
  // A blank canvas and a drawn one both exist in the DOM, so presence proves
  // nothing. Read the pixels and require more than one distinct colour.
  const distinctColours = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    const context = canvasElement.getContext("2d");
    if (context === null) return 0;
    const { width, height } = canvasElement;
    if (width === 0 || height === 0) return 0;
    const { data } = context.getImageData(0, 0, width, height);
    const seen = new Set<number>();
    for (let index = 0; index < data.length; index += 4) {
      seen.add(
        (data[index]! << 24) | (data[index + 1]! << 16)
          | (data[index + 2]! << 8) | data[index + 3]!,
      );
      if (seen.size > 4) break;
    }
    return seen.size;
  });
  expect(distinctColours, `${title} canvas is blank`).toBeGreaterThan(1);
}

async function requiredAttributeV1(
  locator: Locator,
  attribute: string,
): Promise<string> {
  const value = await locator.getAttribute(attribute);
  if (value === null) {
    throw new Error(`required attribute ${attribute} is absent`);
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
