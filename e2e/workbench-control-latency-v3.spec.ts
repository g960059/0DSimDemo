import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type ControlAuditEvent = {
  worker: number;
  at: number;
  direction: "send" | "receive";
  kind: string;
  requestId: number;
  epoch?: number;
  revision?: number;
  time?: number;
  capturedBoundaryBeforeControl?: boolean;
};
type AuditWindow = Window & {
  controlAudit: ControlAuditEvent[];
};

test("@desktop @webkit @control-latency returns accepted settings without a post-edit capture before live resume", async ({ page }, testInfo) => {
  await page.route("**/rest/v1/rpc/save_experiment_v1", route => route.abort("blockedbyclient"));
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const target = window as unknown as AuditWindow;
    target.controlAudit = [];
    const NativeWorker = window.Worker;
    let sequence = 0;
    window.Worker = class extends NativeWorker {
      readonly auditId = ++sequence;
      capturedBoundary = false;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", ({ data }) => {
          if (data.kind === "scenarios-captured") this.capturedBoundary = true;
          const frame = data.frame;
          target.controlAudit.push({ worker: this.auditId, at: performance.now(), direction: "receive",
            kind: data.kind, requestId: data.requestId, epoch: frame?.inputEpoch,
            revision: frame?.acceptedRevision, time: frame?.acceptedTimeSec });
        });
      }
      postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions): void {
        const data = message as { kind: string; requestId: number };
        target.controlAudit.push({ worker: this.auditId, at: performance.now(), direction: "send",
          kind: data.kind, requestId: data.requestId,
          ...(data.kind === "apply-control" ? { capturedBoundaryBeforeControl: this.capturedBoundary } : {}) });
        if (["apply-control", "advance", "advance-presentation"].includes(data.kind)) this.capturedBoundary = false;
        if (Array.isArray(options)) super.postMessage(message, options);
        else super.postMessage(message, options);
      }
    };
  });
  await page.goto("/ja/experiments/new?workbenchPerf=1");
  const root = page.getByTestId("v3-dockview-workbench");
  const pv = root.locator('[data-chart-kind="pressure-volume-loop-v3"]');
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "1");
  await expect(pv).toHaveAttribute("data-pva-analysis-pending", "false");

  const timings: { control: string; controlMs: number; resumeMs: number }[] = [];
  for (const control of ["総血液量", "総血液量", "HR", "SVR"]) {
    await expect(page.getByRole("slider", { name: control, exact: true })).toBeEnabled();
    const oldEpoch = Number(await root.getAttribute("data-input-epoch"));
    await page.evaluate(() => { (window as unknown as AuditWindow).controlAudit = []; });
    await page.getByRole("slider", { name: control, exact: true }).press("ArrowRight");
    await expect(root).toHaveAttribute("data-input-epoch", String(oldEpoch + 1));
    await expect.poll(() => page.evaluate(() => {
      const events = (window as unknown as AuditWindow).controlAudit;
      const applied = events.find(event => event.kind === "control-applied");
      return applied !== undefined && events.some(event => event.worker === applied.worker
        && event.kind === "presentation-advanced" && event.at > applied.at);
    })).toBe(true);
    const audit = await page.evaluate(() => (window as unknown as AuditWindow).controlAudit);
    const applied = audit.find(event => event.kind === "control-applied")!;
    const requested = audit.find(event => event.kind === "apply-control")!;
    const resumed = audit.find(event => event.worker === applied.worker
      && event.kind === "presentation-advanced" && event.at > applied.at)!;
    // Event order, not sub-millisecond timestamps: WebKit can timestamp a
    // capture reply and the next request identically. Permit exact cache reuse.
    const capturesBeforeResume = audit.slice(audit.indexOf(requested) + 1, audit.indexOf(resumed)).filter(event => event.worker === applied.worker
      && event.direction === "send" && event.kind === "read-scenarios"
    );
    expect(capturesBeforeResume).toHaveLength(0);
    expect(requested.capturedBoundaryBeforeControl).toBe(true);
    expect(applied.epoch).toBe(oldEpoch + 1);
    await expect.poll(async () => Number(await root.getAttribute("data-model-time-sec")))
      .toBeGreaterThan(applied.time!);
    await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "1");
    timings.push({ control, controlMs: applied.at - requested.at, resumeMs: resumed.at - requested.at });
  }
  expect(errors).toEqual([]);
  const path = testInfo.outputPath("control-latency.json");
  await writeFile(path, JSON.stringify(timings, null, 2));
  await testInfo.attach("control-latency.json", { path, contentType: "application/json" });
});
