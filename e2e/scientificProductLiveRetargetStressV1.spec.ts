import { expect, test, type Page } from "@playwright/test";

test("repeated live retargets keep advancing and visibility auto-pause resumes", async ({
  page,
}) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(30_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (
      message.type() === "error"
      && message.text() !== "Please check your Firebase configuration."
    ) browserErrors.push(`console.error: ${message.text()}`);
  });
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
  await page.goto("/ja/workbench", { waitUntil: "domcontentloaded" });

  const host = page.getByTestId("scientific-product-workbench-host-v1");
  const evidence = page.getByTestId("scientific-product-frame-evidence-v1");
  const controller = page.getByTestId("scientific-transition-controller-v1");
  const systemic = controller.getByRole("slider", {
    name: "Systemic resistance scale",
    exact: true,
  });
  await expect(host).toBeVisible({ timeout: 120_000 });
  await expect(evidence).toHaveAttribute("data-scientific-frame-count", "501");
  await expect(controller).toHaveAttribute("data-owner-connected", "true");
  await expect(systemic).toHaveAttribute("aria-valuetext", "1.0×");

  const initialRevision = finiteAttribute(
    await evidence.getAttribute("data-scientific-final-revision"),
  );
  await systemic.focus();
  await systemic.press("End");
  await expect(controller).toHaveAttribute("data-phase", "live-running");

  let epoch = finiteAttribute(
    await controller.getAttribute("data-displayed-parameter-epoch"),
  );
  for (let index = 0; index < 12; index += 1) {
    await systemic.press(index % 2 === 0 ? "Home" : "End");
    await expect.poll(async () => finiteAttribute(
      await controller.getAttribute("data-displayed-parameter-epoch"),
    )).toBeGreaterThan(epoch);
    epoch = finiteAttribute(
      await controller.getAttribute("data-displayed-parameter-epoch"),
    );
    await expect(controller).toHaveAttribute("data-phase", "live-running");
  }

  await expect.poll(async () => finiteAttribute(
    await evidence.getAttribute("data-scientific-final-revision"),
  )).toBeGreaterThan(initialRevision);

  // Deterministically exercise the visibility lifecycle without depending on
  // headless-browser tab focus heuristics.
  await setDocumentHidden(page, true);
  await expect(controller).toHaveAttribute("data-phase", /live-pause-requested|live-paused/);
  await setDocumentHidden(page, false);
  await expect(controller).toHaveAttribute("data-phase", "live-running");
  const resumedRevision = finiteAttribute(
    await evidence.getAttribute("data-scientific-final-revision"),
  );
  await expect.poll(async () => finiteAttribute(
    await evidence.getAttribute("data-scientific-final-revision"),
  )).toBeGreaterThan(resumedRevision);

  await controller.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(controller).toHaveAttribute("data-phase", "live-paused");
  await controller.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(controller).toHaveAttribute("data-phase", "idle");
  expect(browserErrors).toEqual([]);
});

async function setDocumentHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((nextHidden) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => nextHidden,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

function finiteAttribute(value: string | null): number {
  const result = Number(value);
  if (value === null || value.trim() === "" || !Number.isFinite(result)) {
    throw new Error(`expected a finite numeric attribute, received ${String(value)}`);
  }
  return result;
}
