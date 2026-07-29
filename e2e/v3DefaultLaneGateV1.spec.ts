import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The PR gate's guard on the product default.
 *
 * Every other V3 spec in this branch is tagged `@full-e2e`, and the required
 * browser job runs `--grep-invert @full-e2e`. So when the V3 lane became the
 * default, the required gate went green ten times over without once loading the
 * surface a first-time visitor now lands on — and four existing specs broke in
 * the job that does not gate. A green tick meant "every required test avoided
 * the new default".
 *
 * This spec is deliberately cheap and deliberately untagged. It does not measure
 * a rate, throttle a CPU, or open three lanes; `v3MultiLaneRateV1` and
 * `v3HeadroomV1` keep that work and keep their `@full-e2e` tag. All this asks is
 * the question the gate could not previously answer: does the default route come
 * up, advance, and say what it is?
 */

// Written as literals rather than imported on purpose. These two strings are a
// URL contract the moment anyone shares a link, so a rename that silently
// changes what `?lane=` accepts should fail here rather than pass by following
// the constant.
const NONCORONARY_LANE_KIND_V1 = "noncoronary-v1";
const INTEGRATED_V3_LANE_KIND_V1 = "integrated-v3-experimental";

test.describe("Product default lane gate", () => {
  test("the bare workbench lands on the V3 lane and advances", async ({ page }) => {
    test.setTimeout(180_000);
    const browserErrors = captureBrowserErrorsV1(page);
    await acknowledgeModelLimitationsV1(page);

    await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });

    const surface = page.getByTestId("integrated-v3-product-surface-v1");
    await expect(surface).toBeVisible({ timeout: 120_000 });

    // The selected lane is published by the route wrapper that owns the choice,
    // not by the lane surface it renders. Asserted on an ancestor of the surface
    // so this cannot pass by finding some other element on the page that happens
    // to carry the attribute.
    await expect(
      page.locator(
        `[data-selected-lane-kind='${INTEGRATED_V3_LANE_KIND_V1}']`,
      ).filter({ has: surface }),
    ).toHaveCount(1);

    // Rendering once is not running. The accepted revision is monotonic and is
    // not seeded by readiness, so a strict increase is the honest evidence that
    // the solver is live on the route a first visit lands on. No rate is
    // asserted — that is `v3HeadroomV1`'s job, and this must not fail on slow
    // CI hardware.
    const first = Number(await requiredAttributeV1(surface, "data-accepted-revision"));
    await expect
      .poll(
        async () =>
          Number(await requiredAttributeV1(surface, "data-accepted-revision")),
        { timeout: 90_000, intervals: [250] },
      )
      .toBeGreaterThan(first);

    expect(browserErrors, browserErrors.join("\n")).toEqual([]);
  });

  test("the lane query parameter reaches the non-coronary lane", async ({ page }) => {
    test.setTimeout(180_000);
    await acknowledgeModelLimitationsV1(page);

    // The counterpart to the test above: the default is V3, and the older lane
    // must stay reachable by URL rather than only by a stored preference. Four
    // existing specs depend on this being true, and a stored preference cannot
    // express "what a fresh visitor with this link gets".
    await page.goto(`/ja/workbench?lane=${NONCORONARY_LANE_KIND_V1}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("scientific-product-workbench-host-v1"))
      .toBeVisible({ timeout: 120_000 });
  });

  test("an unrecognised lane falls back to the default without failing", async ({ page }) => {
    test.setTimeout(180_000);
    await acknowledgeModelLimitationsV1(page);

    // A malformed lane in a shared or hand-edited link must not produce an error
    // page. It falls back to the default, which is the V3 surface.
    await page.goto("/ja/workbench?lane=not-a-real-lane", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("integrated-v3-product-surface-v1"))
      .toBeVisible({ timeout: 120_000 });
  });
});

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
