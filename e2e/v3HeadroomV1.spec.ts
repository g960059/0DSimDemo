import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * How much CPU headroom does the V3 lane actually have?
 *
 * Every rate in this branch was measured on an Apple M5 Max. That says nothing
 * about a phone or a low-end laptop, and it is the reason the lean/full tier
 * comparison showed no difference — a fast enough machine hides both the cost
 * and the saving. This spec throttles the renderer and the Worker through CDP
 * `Emulation.setCPUThrottlingRate` and reports the achieved rate at each slowdown.
 *
 * Caveat stated here because it bounds the conclusion: CPU throttling scales
 * execution uniformly. It does not reproduce a weaker memory subsystem, a
 * smaller cache, thermal throttling, a different JS engine, or the big/little
 * core scheduling of a real phone. Read a number here as "this much arithmetic
 * headroom", not "it will run on that device".
 */
const LANE = "integrated-coronary-sinus-hmii-9000-experimental-v1";
const RATES = [1, 2, 4, 6, 8, 12] as const;
const WINDOW_MS = 5_000;

async function requiredAttributeV1(l: Locator, a: string): Promise<string> {
  const v = await l.getAttribute(a);
  if (v === null) throw new Error(`required attribute ${a} absent`);
  return v;
}

test("reports achieved rate under CPU throttling", { tag: "@full-e2e" }, async ({ page }) => {
  test.setTimeout(600_000);
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });

  // Throttle the Worker too, not only the renderer: the solver runs there, and
  // throttling only the page would measure the wrong thread.
  const session = await page.context().newCDPSession(page);
  const workerSessions: { send(m: string, p?: unknown): Promise<unknown> }[] = [];
  let workerSessionId: string | null = null;
  let nextId = 1;
  const pending = new Map<number, (v: unknown) => void>();
  session.on("Target.attachedToTarget", (e: { sessionId: string; targetInfo: { type: string } }) => {
    if (e.targetInfo.type === "worker") workerSessionId = e.sessionId;
  });
  session.on("Target.receivedMessageFromTarget", (e: { message: string }) => {
    const p = JSON.parse(e.message) as { id?: number };
    if (p.id !== undefined) pending.get(p.id)?.(p);
  });
  const toWorker = async (method: string, params: unknown) => {
    if (workerSessionId === null) return;
    const id = nextId += 1;
    const done = new Promise((r) => pending.set(id, r));
    await session.send("Target.sendMessageToTarget", {
      sessionId: workerSessionId,
      message: JSON.stringify({ id, method, params }),
    });
    await done;
  };
  await session.send("Target.setAutoAttach", {
    autoAttach: true, waitForDebuggerOnStart: false, flatten: false,
  });

  await page.goto(`/ja/workbench/${LANE}`, { waitUntil: "domcontentloaded" });
  const surface = page.getByTestId("integrated-v3-product-surface-v1");
  await expect(surface).toBeVisible({ timeout: 180_000 });
  for (let i = 0; i < 60 && workerSessionId === null; i += 1) await page.waitForTimeout(250);

  const results: { rate: number; achieved: number }[] = [];
  for (const rate of RATES) {
    await session.send("Emulation.setCPUThrottlingRate", { rate });
    await toWorker("Emulation.setCPUThrottlingRate", { rate });
    await page.waitForTimeout(2_000); // let it settle at the new speed
    const t0 = Number(await requiredAttributeV1(surface, "data-model-time-sec"));
    const w0 = Date.now();
    await page.waitForTimeout(WINDOW_MS);
    const t1 = Number(await requiredAttributeV1(surface, "data-model-time-sec"));
    const achieved = (t1 - t0) / ((Date.now() - w0) / 1_000);
    results.push({ rate, achieved });
    console.log(
      `[v3-headroom] cpu/${rate}  achieved=${achieved.toFixed(3)}x  `
        + `${(1 / achieved).toFixed(2)} s per 1.000 s beat`,
    );
    expect(achieved).toBeGreaterThan(0);
  }
  const breakEven = results.filter((r) => r.achieved >= 1).pop();
  console.log(
    `[v3-headroom] worker throttling attached: ${workerSessionId !== null}; `
      + `slowest machine still at or above 1x: cpu/${breakEven?.rate ?? "none"}`,
  );
  await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  void workerSessions;
});
