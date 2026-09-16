import { expect, test, type Page } from "@playwright/test";

type Event = { kind: string; at: number; worker: number; direction: string; epoch?: number; time?: number; session?: string };
type Audit = Window & { admissionEvents: Event[]; failNextLiveBatch: boolean };
async function instrument(page: Page) {
  await page.route("**/rest/v1/rpc/save_experiment_v1", route => route.abort("blockedbyclient"));
  await page.addInitScript(() => {
    const target = window as unknown as Audit;
    target.admissionEvents = []; target.failNextLiveBatch = false;
    const NativeWorker = window.Worker; let sequence = 0;
    window.Worker = class extends NativeWorker {
      readonly auditId = ++sequence;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", ({ data }) => {
          target.admissionEvents.push({ kind: data.kind, at: performance.now(), worker: this.auditId, direction: "receive",
            epoch: data.frame?.inputEpoch, time: data.frame?.acceptedTimeSec, session: data.frame?.runtimeSessionId });
        });
      }
      postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions): void {
        const data = message as { kind: string; requestId: number; protocol: string };
        target.admissionEvents.push({ kind: data.kind, at: performance.now(), worker: this.auditId, direction: "send" });
        if (data.kind === "advance-presentation" && target.failNextLiveBatch) {
          target.failNextLiveBatch = false;
          queueMicrotask(() => this.dispatchEvent(new MessageEvent("message", { data: {
            protocol: data.protocol, requestId: data.requestId, status: "error", fatal: true,
            message: "Injected later numerical failure for recovery verification",
          } })));
          return;
        }
        if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
      }
    };
  });
}
const candidateUrl = "/ja/dev/model-lab?candidate=control-admission&workbenchPerf=1";

test("@desktop @webkit @control-admission candidate loads its own prepared curves and continues after large TBV edits", async ({ page }, testInfo) => {
  await instrument(page);
  const errors: string[] = [], prepared: { modelId: string; artifactRevisionId: string }[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", async response => {
    if (/\/assets\/[a-f0-9]{64}-[^/]+\.json$/.test(response.url()) && response.ok()) {
      const body = await response.json();
      if (body.schemaId === "prepared-model-analysis-v1") prepared.push(body);
    }
  });
  await page.goto(candidateUrl);
  const root = page.getByTestId("v3-dockview-workbench");
  const pv = root.locator('[data-chart-kind="pressure-volume-loop-v3"]');
  const curves = root.locator('[data-chart-kind="guyton-starling-structural-orientation-v3"]');
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "1");
  await expect(curves).toHaveAttribute("data-pending-scenario-count", "0");
  await expect.poll(() => prepared.length).toBe(1);
  expect(prepared[0]!.modelId).toBe(await root.getAttribute("data-model-id"));
  await expect.poll(async () => Number(await curves.getAttribute("data-starling-completed-points"))).toBeGreaterThan(2);
  await page.screenshot({ path: testInfo.outputPath("candidate-prepared-curves.png") });
  for (const tbv of [6000, 4200, 7000]) {
    const field = page.getByRole("textbox", { name: /^総血液量の正確な値/ });
    await expect(field).toBeEnabled();
    const epoch = Number(await root.getAttribute("data-input-epoch"));
    await field.fill(String(tbv)); await field.press("Enter");
    await expect(root).toHaveAttribute("data-input-epoch", String(epoch + 1));
    await expect(page.getByRole("slider", { name: "総血液量", exact: true })).toHaveValue(String(tbv));
    const changedTime = Number(await root.getAttribute("data-model-time-sec"));
    await expect.poll(async () => Number(await root.getAttribute("data-model-time-sec"))).toBeGreaterThan(changedTime + 5);
    await expect(page.getByTestId("workbench-calculation-stopped")).toBeHidden();
    await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "1");
  }
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("candidate-after-large-edits.png") });
});

test("@desktop @webkit @control-admission candidate keeps exact live samples and measures edit response", async ({ page }, testInfo) => {
  await instrument(page);
  const measurements: { variant: string; workerMs: number; resumeMs: number }[] = [];
  for (const [variant, url] of [["admitted", "/ja/experiments/new"], ["candidate", candidateUrl]]) {
    await page.goto(url!);
    const root = page.getByTestId("v3-dockview-workbench");
    const pv = root.locator('[data-chart-kind="pressure-volume-loop-v3"]');
    await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "1");
    if (variant === "candidate") await expect(root).toHaveAttribute("data-model-id", /control-admission-candidate-v1$/);
    for (let edit = 0; edit < 3; edit++) {
      const slider = page.getByRole("slider", { name: "総血液量", exact: true });
      await expect(slider).toBeEnabled();
      const epoch = Number(await root.getAttribute("data-input-epoch"));
      await page.evaluate(() => { (window as unknown as Audit).admissionEvents = []; });
      await slider.press("ArrowRight");
      await expect(root).toHaveAttribute("data-input-epoch", String(epoch + 1));
      await expect.poll(() => page.evaluate(() => {
        const events = (window as unknown as Audit).admissionEvents;
        const applied = events.find(e => e.kind === "control-applied");
        return applied && events.some(e => e.worker === applied.worker && e.kind === "presentation-advanced" && e.at > applied.at);
      })).toBeTruthy();
      const events = await page.evaluate(() => (window as unknown as Audit).admissionEvents);
      const request = events.find(e => e.kind === "apply-control")!, applied = events.find(e => e.kind === "control-applied")!;
      const resumed = events.find(e => e.worker === applied.worker && e.kind === "presentation-advanced" && e.at > applied.at)!;
      expect(events.filter(e => e.kind === "control-applied")).toHaveLength(1);
      measurements.push({ variant: variant!, workerMs: applied.at - request.at, resumeMs: resumed.at - request.at });
    }
    await expect(page.getByTestId("workbench-calculation-stopped")).toBeHidden();
  }
  await testInfo.attach("control-admission-timings.json", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
});

test("@desktop @webkit @control-admission a later failure retains panes and explicitly restores the pre-edit group", async ({ page }, testInfo) => {
  await instrument(page);
  await page.goto(candidateUrl);
  const root = page.getByTestId("v3-dockview-workbench");
  const pv = root.locator('[data-chart-kind="pressure-volume-loop-v3"]');
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "1");
  await page.getByRole("button", { name: "Scenarioメニュー: baseline", exact: true }).click();
  await page.getByRole("menuitem", { name: "複製", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Scenarios (2)", exact: true })).toBeVisible();
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "2");
  const slider = page.getByRole("slider", { name: "総血液量", exact: true });
  await expect(slider).toBeEnabled();
  const originalTbv = await slider.inputValue();
  const originalSession = await page.evaluate(() => (window as unknown as Audit).admissionEvents.find(e => e.kind === "initialized")!.session);
  await slider.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => (window as unknown as Audit).admissionEvents.some(e => e.kind === "control-applied" && e.epoch === 1))).toBe(true);
  await expect(slider).toBeEnabled();
  await page.getByRole("button", { name: "Pane設定: PV loop", exact: true }).click();
  const picker = page.getByTestId("workbench-pane-picker-v3");
  await picker.getByRole("tab", { name: "表示", exact: true }).click();
  const title = picker.getByRole("textbox", { name: "Pane名", exact: true });
  await title.fill("Retained PV"); await title.press("Enter");
  await picker.getByRole("button", { name: "適用", exact: true }).click();
  const stopped = page.getByTestId("workbench-calculation-stopped");
  const editedTime = await page.evaluate(() => (window as unknown as Audit).admissionEvents.find(e => e.kind === "control-applied")!.time!);
  // Let a genuinely later group frame reach the UI, not just the edit frame.
  await expect.poll(async () => Number(await root.getAttribute("data-model-time-sec"))).toBeGreaterThan(editedTime + .1);
  await page.evaluate(() => { (window as unknown as Audit).failNextLiveBatch = true; });
  await expect(stopped).toBeVisible();
  await expect(root.locator('[data-simulation-update="true"]:visible')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pane設定: Retained PV", exact: true })).toBeVisible();
  await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "2");
  await expect(slider).toBeDisabled();
  const stoppedTime = await root.getAttribute("data-model-time-sec");
  await page.screenshot({ path: testInfo.outputPath("retained-after-failure.png") });
  await stopped.getByRole("button", { name: /変更前の状態に戻す/ }).click();
  await expect(stopped).toBeHidden();
  await expect(slider).toBeEnabled();
  await expect(slider).toHaveValue(originalTbv);
  await expect(page.getByRole("heading", { name: "Scenarios (2)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pane設定: Retained PV", exact: true })).toBeVisible();
  await expect(page.getByTestId("v3-playback-toggle")).toHaveAttribute("aria-label", "再生");
  const restored = await page.evaluate(() => (window as unknown as Audit).admissionEvents.filter(e => e.kind === "initialized").at(-1)!);
  expect(restored.session).not.toBe(originalSession);
  expect(restored.time!).toBeLessThan(Number(stoppedTime));
  await page.getByTestId("v3-playback-toggle").click();
  await expect.poll(async () => Number(await root.getAttribute("data-model-time-sec"))).toBeGreaterThan(restored.time!);
  await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "2");
});
