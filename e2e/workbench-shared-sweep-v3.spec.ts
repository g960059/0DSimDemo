import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type SweepEvent = { kind: string; at: number; worker: number; partition?: string;
  shared?: boolean; prepared?: boolean; points?: number };
type SweepWindow = Window & { sweepEvents: SweepEvent[] };

for (const cores of [4, 3]) test(`@desktop ${cores === 4 ? "@webkit" : ""} shared TBV anchor with ${cores} logical cores`, async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.route("**/rest/v1/rpc/save_experiment_v1", route => route.abort("blockedbyclient"));
  await page.addInitScript(cores => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => cores });
    const audit = window as unknown as SweepWindow;
    audit.sweepEvents = [];
    const Native = window.Worker; let sequence = 0;
    window.Worker = class extends Native {
      readonly auditId = ++sequence;
      partition?: string;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", ({ data }) => {
          if (data.kind === "analysis-progress" || data.kind === "analysis-result") {
            const points = data.analysis?.payload?.left?.starlingLocus?.points ?? [];
            audit.sweepEvents.push({ kind: data.kind, at: performance.now(), worker: this.auditId,
              partition: this.partition, prepared: data.preparation !== undefined,
              points: points.filter((p: { role: string }) => p.role !== "operating-anchor").length });
          }
        });
      }
      postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions): void {
        const data = message as { kind: string; analysisPartition?: string; sharePreparation?: boolean; preparedAnalysis?: unknown };
        if (data.kind === "request-analysis") {
          this.partition = data.analysisPartition;
          audit.sweepEvents.push({ kind: data.kind, at: performance.now(), worker: this.auditId,
            partition: this.partition, shared: data.sharePreparation, prepared: data.preparedAnalysis !== undefined });
        }
        if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
      }
    };
  }, cores);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/ja/experiments/new?workbenchPerf=1");
  const root = page.getByTestId("v3-dockview-workbench");
  await expect(root.locator('[data-chart-kind="guyton-starling-structural-orientation-v3"]'))
    .toHaveAttribute("data-pending-scenario-count", "0");
  const before = Number(await root.getAttribute("data-model-time-sec"));
  const field = page.getByRole("textbox", { name: /^総血液量の正確な値/ });
  await field.fill("4940"); await field.press("Enter");
  await expect.poll(async () => Number(await root.getAttribute("data-model-time-sec"))).toBeGreaterThan(before + 2);
  await page.waitForFunction(() => ["hypovolemic", "hypervolemic"].every(partition =>
    (window as unknown as SweepWindow).sweepEvents.some(e => e.kind === "analysis-progress" && e.partition === partition && (e.points ?? 0) > 0)),
  undefined, { timeout: 150_000 });
  const events = await page.evaluate(() => (window as unknown as SweepWindow).sweepEvents);
  const requests = events.filter(e => e.kind === "request-analysis");
  const preparations = events.filter(e => e.kind === "analysis-progress" && e.prepared);
  expect(requests).toHaveLength(2);
  expect(preparations).toHaveLength(1);
  expect(requests[0]).toMatchObject({ partition: "hypovolemic", shared: true, prepared: false });
  expect(requests[1]).toMatchObject({ partition: "hypervolemic", prepared: true });
  expect(requests[1]!.at).toBeGreaterThanOrEqual(preparations[0]!.at);
  expect(requests[0]!.worker).not.toBe(requests[1]!.worker);
  const lowFinished = events.find(e => e.kind === "analysis-result" && e.partition === "hypovolemic");
  if (cores === 3) { expect(lowFinished).toBeDefined(); expect(requests[1]!.at).toBeGreaterThanOrEqual(lowFinished!.at); }
  else if (lowFinished) expect(requests[1]!.at).toBeLessThan(lowFinished.at);
  expect(errors).toEqual([]);
  await expect(page.getByTestId("workbench-calculation-stopped")).toBeHidden();
  const path = testInfo.outputPath("shared-sweep-events.json");
  await writeFile(path, JSON.stringify(events, null, 2));
  await testInfo.attach("shared-sweep-events.json", { path, contentType: "application/json" });
});
