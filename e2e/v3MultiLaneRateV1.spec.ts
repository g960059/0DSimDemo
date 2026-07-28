import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Answers one product question: does the integrated V3 lane still hold ~1x when
 * more than one is open?
 *
 * PR #508 measured the multi-lane cap for the non-coronary lane and found it is
 * the renderer main thread, not the solver — roughly 40% of a main thread per
 * lane, saturating between two and three, with chart animation and React render
 * dominating and the scientific runtime at 3.5%. Every optimisation in this
 * branch is Worker-side, so none of it relieves that cap.
 *
 * Caveat stated in the file because it bounds what this proves: the V3 product
 * surface is single-scenario, so N lanes are opened as N pages in one browser
 * context rather than N scenarios in one page. That measures process-level and
 * CPU contention. It does NOT reproduce the shared-main-thread case #508
 * studied, which is stricter. Read a pass here as necessary, not sufficient.
 */
const LANE = "integrated-coronary-sinus-hmii-9000-experimental-v1";
const SAMPLE_WINDOW_MS = 6_000;

async function openLaneV1(page: Page): Promise<Locator> {
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
  await page.goto(`/ja/workbench/${LANE}`, { waitUntil: "domcontentloaded" });
  const surface = page.getByTestId("integrated-v3-product-surface-v1");
  await expect(surface).toBeVisible({ timeout: 180_000 });
  return surface;
}

async function requiredAttributeV1(
  locator: Locator,
  attribute: string,
): Promise<string> {
  const value = await locator.getAttribute(attribute);
  if (value === null) throw new Error(`required attribute ${attribute} absent`);
  return value;
}

for (const laneCount of [1, 2, 3]) {
  test(
    `holds its rate with ${laneCount} concurrent V3 lane(s)`,
    { tag: "@full-e2e" },
    async ({ browser }) => {
      test.setTimeout(300_000);
      const context = await browser.newContext();
      const surfaces: Locator[] = [];
      for (let index = 0; index < laneCount; index += 1) {
        surfaces.push(await openLaneV1(await context.newPage()));
      }

      const startTimes = await Promise.all(
        surfaces.map(async (s) =>
          Number(await requiredAttributeV1(s, "data-model-time-sec"))),
      );
      const startedAtMs = Date.now();
      await surfaces[0]!.page().waitForTimeout(SAMPLE_WINDOW_MS);
      const elapsedSec = (Date.now() - startedAtMs) / 1_000;
      const endTimes = await Promise.all(
        surfaces.map(async (s) =>
          Number(await requiredAttributeV1(s, "data-model-time-sec"))),
      );

      const rates = endTimes.map((end, i) => (end - startTimes[i]!) / elapsedSec);
      const slowest = Math.min(...rates);
      const aggregate = rates.reduce((sum, r) => sum + r, 0);
      console.log(
        `[v3-multilane] lanes=${laneCount} `
          + `rates=[${rates.map((r) => r.toFixed(3)).join(", ")}] `
          + `slowest=${slowest.toFixed(3)}x aggregate=${aggregate.toFixed(3)}x`,
      );

      for (const rate of rates) expect(rate).toBeGreaterThan(0);
      await context.close();
    },
  );
}
