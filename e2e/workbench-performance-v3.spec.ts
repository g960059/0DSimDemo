import {
  expect,
  test,
  type CDPSession,
  type Page,
  type TestInfo,
} from "@playwright/test";

import type {
  WorkbenchPerformanceSnapshotV3,
} from "../components/workbench/v3/WorkbenchPerformanceDiagnosticsV3";

type PerformanceBudgetV3 = Readonly<{
  minimumRootModelTimeRatio: number;
  minimumGroupRecentComputeRatio: number;
  minimumGroupP05ComputeRatio: number;
  maximumWorkerRoundTripP95Ms: number;
  maximumCanvasDisplayIntervalP95Ms: number;
  maximumCanvasDrawP95Ms: number;
  maximumControlLatencyMs: number;
}>;

type PerformanceProfileV3 = Readonly<{
  cpuThrottle: number;
  hardwareConcurrencyOverride?: number;
  defaultScenarioCount: number;
  budget: PerformanceBudgetV3;
}>;

type ThreadCalibrationV3 = Readonly<{
  mainThreadMs: number;
  dedicatedWorkerMs: number;
}>;

type MeasurementWindowV3 = Readonly<{
  durationMs: number;
  modelTimeDeltaSec: number;
  rootModelTimeRatio: number;
  diagnostics: WorkbenchPerformanceSnapshotV3;
}>;

const PROFILES_V3: Readonly<Record<string, PerformanceProfileV3>> =
  Object.freeze({
    "reference-desktop": Object.freeze({
      cpuThrottle: 1,
      defaultScenarioCount: 4,
      budget: Object.freeze({
        minimumRootModelTimeRatio: 0.95,
        minimumGroupRecentComputeRatio: 0.98,
        minimumGroupP05ComputeRatio: 0.7,
        maximumWorkerRoundTripP95Ms: 50,
        maximumCanvasDisplayIntervalP95Ms: 50,
        maximumCanvasDrawP95Ms: 8,
        maximumControlLatencyMs: 150,
      }),
    }),
    "constrained-desktop-proxy": Object.freeze({
      cpuThrottle: 4,
      hardwareConcurrencyOverride: 4,
      defaultScenarioCount: 2,
      budget: Object.freeze({
        minimumRootModelTimeRatio: 0.85,
        minimumGroupRecentComputeRatio: 0.9,
        minimumGroupP05ComputeRatio: 0.55,
        maximumWorkerRoundTripP95Ms: 100,
        maximumCanvasDisplayIntervalP95Ms: 66,
        maximumCanvasDrawP95Ms: 12,
        maximumControlLatencyMs: 250,
      }),
    }),
    "mobile-main-thread-layout-proxy": Object.freeze({
      cpuThrottle: 4,
      hardwareConcurrencyOverride: 4,
      defaultScenarioCount: 2,
      budget: Object.freeze({
        minimumRootModelTimeRatio: 0.8,
        minimumGroupRecentComputeRatio: 0.85,
        minimumGroupP05ComputeRatio: 0.5,
        maximumWorkerRoundTripP95Ms: 120,
        maximumCanvasDisplayIntervalP95Ms: 80,
        maximumCanvasDrawP95Ms: 12,
        maximumControlLatencyMs: 300,
      }),
    }),
  });

const WARMUP_MS_V3 = boundedEnvironmentIntegerV3(
  "CIRCLEHEART_PERF_WARMUP_MS",
  4_000,
  1_000,
  120_000,
);
const SAMPLE_MS_V3 = boundedEnvironmentIntegerV3(
  "CIRCLEHEART_PERF_SAMPLE_MS",
  8_000,
  2_000,
  300_000,
);
const ENFORCE_BUDGETS_V3 = process.env.CIRCLEHEART_PERF_ENFORCE === "1";

test("measures exact live Workbench throughput under background contention", async ({
  page,
}, testInfo) => {
  const profile = requiredProfileV3(testInfo);
  const scenarioCount = boundedEnvironmentIntegerV3(
    "CIRCLEHEART_PERF_SCENARIOS",
    profile.defaultScenarioCount,
    1,
    4,
  );
  const cdp = await page.context().newCDPSession(page);
  await page.goto("/ja?workbenchPerf=1");
  const threadCalibrationBefore = await measureThreadCalibrationV3(page);
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: profile.cpuThrottle,
  });
  if (profile.hardwareConcurrencyOverride !== undefined) {
    await cdp.send("Emulation.setHardwareConcurrencyOverride", {
      hardwareConcurrency: profile.hardwareConcurrencyOverride,
    });
  }
  await cdp.send("Performance.enable");
  const threadCalibrationAfter = await measureThreadCalibrationV3(page);
  const threadThrottleProbe = Object.freeze({
    requestedMainThreadThrottle: profile.cpuThrottle,
    before: threadCalibrationBefore,
    after: threadCalibrationAfter,
    mainThreadSlowdown:
      threadCalibrationAfter.mainThreadMs / threadCalibrationBefore.mainThreadMs,
    dedicatedWorkerSlowdown:
      threadCalibrationAfter.dedicatedWorkerMs
      / threadCalibrationBefore.dedicatedWorkerMs,
  });

  await page.goto("/ja/experiments/new?workbenchPerf=1");
  const root = page.getByTestId("v3-dockview-workbench");
  await expect(root).toBeVisible();
  await expect.poll(() => acceptedRevisionV3(page)).toBeGreaterThan(10);
  await ensureScenarioCountV3(page, scenarioCount);
  await expect.poll(() => acceptedRevisionV3(page)).toBeGreaterThan(20);

  const environment = await page.evaluate(() => ({
    hardwareConcurrency: navigator.hardwareConcurrency,
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    viewport: Object.freeze({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  }));
  const runtimeMetricsBefore = await browserPerformanceMetricsV3(cdp);

  await page.waitForTimeout(WARMUP_MS_V3);
  const concurrentStartup = await measureWindowV3(page, SAMPLE_MS_V3);
  const controlLatencyMs = await measureControlLatencyV3(page);
  const postControlContention = await measureWindowV3(page, SAMPLE_MS_V3);
  const runtimeMetricsAfter = await browserPerformanceMetricsV3(cdp);

  const violations = evaluatePerformanceBudgetV3(
    postControlContention,
    controlLatencyMs,
    scenarioCount,
    profile.budget,
  );
  const report = Object.freeze({
    schema: "circleheart.workbench-performance-report.v1",
    project: testInfo.project.name,
    proxy: profile.cpuThrottle === 1
      ? "native-browser-reference"
      : `chromium-main-thread-cpu-throttle-${profile.cpuThrottle}x-`
        + "dedicated-worker-unthrottled",
    threadThrottleProbe,
    scenarioCount,
    environment,
    warmupMs: WARMUP_MS_V3,
    sampleMs: SAMPLE_MS_V3,
    concurrentStartup,
    controlLatencyMs,
    postControlContention,
    browserMetrics: Object.freeze({
      before: runtimeMetricsBefore,
      after: runtimeMetricsAfter,
      jsHeapDeltaBytes:
        (runtimeMetricsAfter.JSHeapUsedSize ?? 0)
        - (runtimeMetricsBefore.JSHeapUsedSize ?? 0),
    }),
    budget: profile.budget,
    violations,
    enforced: ENFORCE_BUDGETS_V3,
  });
  const reportJson = JSON.stringify(report, null, 2);
  await testInfo.attach("workbench-performance-report.json", {
    body: Buffer.from(reportJson),
    contentType: "application/json",
  });
  console.log("\n[CircleHeart performance]", JSON.stringify({
    project: report.project,
    proxy: report.proxy,
    scenarioCount: report.scenarioCount,
    rootModelTimeRatio:
      report.postControlContention.rootModelTimeRatio,
    mainThreadSlowdown: report.threadThrottleProbe.mainThreadSlowdown,
    dedicatedWorkerSlowdown:
      report.threadThrottleProbe.dedicatedWorkerSlowdown,
    controlLatencyMs: report.controlLatencyMs,
    violations: report.violations,
    enforced: report.enforced,
  }, null, 2));

  expect(postControlContention.diagnostics.enabled).toBe(true);
  expect(postControlContention.modelTimeDeltaSec).toBeGreaterThan(0.25);
  expect(groupModelTimeRatioValuesV3(postControlContention.diagnostics))
    .toHaveLength(1);
  if (ENFORCE_BUDGETS_V3) expect(violations).toEqual([]);
});

async function ensureScenarioCountV3(
  page: Page,
  targetCount: number,
): Promise<void> {
  const region = page.getByRole("region", { name: "Scenarios" });
  const menuButtons = region.getByRole("button", {
    name: /Scenarioメニュー:/,
  });
  await expect(menuButtons).toHaveCount(1);
  while (await menuButtons.count() < targetCount) {
    const before = await menuButtons.count();
    const baseline = region.getByRole("button", {
      name: "Scenarioメニュー: 起動時baseline",
      exact: true,
    });
    await baseline.click();
    await page
      .getByRole("menu", {
        name: "Scenarioメニュー: 起動時baseline",
        exact: true,
      })
      .getByRole("menuitem", { name: "複製" })
      .click();
    await expect(menuButtons).toHaveCount(before + 1);
  }
}

/**
 * CDP CPU throttling applies to the renderer main thread, not reliably to a
 * dedicated numerical Worker. Recording both prevents a layout proxy from
 * being misreported as physical-phone compute qualification.
 */
async function measureThreadCalibrationV3(
  page: Page,
): Promise<ThreadCalibrationV3> {
  return await page.evaluate(async () => {
    const iterations = 4_000_000;
    const runMain = () => {
      const startedAt = performance.now();
      let checksum = 0;
      for (let index = 0; index < iterations; index += 1) {
        checksum = Math.imul(checksum ^ index, 1_664_525) + 1_013_904_223;
      }
      if (!Number.isFinite(checksum)) throw new Error("invalid checksum");
      return performance.now() - startedAt;
    };
    const mainSamples = [runMain(), runMain(), runMain()]
      .sort((left, right) => left - right);
    const source = `self.onmessage = (event) => {
      const iterations = event.data;
      const startedAt = performance.now();
      let checksum = 0;
      for (let index = 0; index < iterations; index += 1) {
        checksum = Math.imul(checksum ^ index, 1664525) + 1013904223;
      }
      self.postMessage({ durationMs: performance.now() - startedAt, checksum });
    };`;
    const sourceUrl = URL.createObjectURL(new Blob([source], {
      type: "text/javascript",
    }));
    const worker = new Worker(sourceUrl);
    try {
      const workerSamples: number[] = [];
      for (let sample = 0; sample < 3; sample += 1) {
        workerSamples.push(await new Promise<number>((resolve, reject) => {
          const onMessage = (event: MessageEvent<Readonly<{
            durationMs: number;
          }>>) => {
            cleanup();
            resolve(event.data.durationMs);
          };
          const onError = (event: ErrorEvent) => {
            cleanup();
            reject(new Error(event.message));
          };
          const cleanup = () => {
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
          };
          worker.addEventListener("message", onMessage);
          worker.addEventListener("error", onError);
          worker.postMessage(iterations);
        }));
      }
      workerSamples.sort((left, right) => left - right);
      return Object.freeze({
        mainThreadMs: mainSamples[1]!,
        dedicatedWorkerMs: workerSamples[1]!,
      });
    } finally {
      worker.terminate();
      URL.revokeObjectURL(sourceUrl);
    }
  });
}

async function measureWindowV3(
  page: Page,
  durationMs: number,
): Promise<MeasurementWindowV3> {
  await resetDiagnosticsV3(page);
  const startedAtMs = Date.now();
  const startModelTimeSec = await modelTimeV3(page);
  await page.waitForTimeout(durationMs);
  const endModelTimeSec = await modelTimeV3(page);
  const endedAtMs = Date.now();
  const elapsedMs = Math.max(1, endedAtMs - startedAtMs);
  const modelTimeDeltaSec = endModelTimeSec - startModelTimeSec;
  return Object.freeze({
    durationMs: elapsedMs,
    modelTimeDeltaSec,
    rootModelTimeRatio: modelTimeDeltaSec / (elapsedMs / 1_000),
    diagnostics: await performanceSnapshotV3(page),
  });
}

async function measureControlLatencyV3(page: Page): Promise<number> {
  const root = page.getByTestId("v3-dockview-workbench");
  const slider = page.getByRole("slider", { name: "Heart rate" }).first();
  await slider.scrollIntoViewIfNeeded();
  const initialEpoch = Number(await root.getAttribute("data-input-epoch"));
  const initialModelTimeSec = await modelTimeV3(page);
  const startedAtMs = Date.now();
  await slider.press("ArrowRight");
  await expect.poll(async () =>
    Number(await root.getAttribute("data-input-epoch")))
    .toBeGreaterThan(initialEpoch);
  await expect.poll(() => modelTimeV3(page))
    .toBeGreaterThan(initialModelTimeSec);
  return Date.now() - startedAtMs;
}

function evaluatePerformanceBudgetV3(
  measurement: MeasurementWindowV3,
  controlLatencyMs: number,
  scenarioCount: number,
  budget: PerformanceBudgetV3,
): readonly string[] {
  const diagnostics = measurement.diagnostics;
  const violations: string[] = [];
  if (measurement.rootModelTimeRatio < budget.minimumRootModelTimeRatio) {
    violations.push(
      `root model-time ratio ${measurement.rootModelTimeRatio.toFixed(3)}`
      + ` < ${budget.minimumRootModelTimeRatio}`,
    );
  }
  const groupRatios = groupModelTimeRatioValuesV3(diagnostics);
  if (groupRatios.length !== 1) {
    violations.push(
      `observed ${groupRatios.length}/1 group compute-ratio metrics`,
    );
  }
  for (const [metric, value] of groupRatios) {
    if (value.recentMean < budget.minimumGroupRecentComputeRatio) {
      violations.push(
        `${metric} recent mean ${value.recentMean.toFixed(3)}`
        + ` < ${budget.minimumGroupRecentComputeRatio}`,
      );
    }
    if (value.p05 < budget.minimumGroupP05ComputeRatio) {
      violations.push(
        `${metric} p05 ${value.p05.toFixed(3)}`
        + ` < ${budget.minimumGroupP05ComputeRatio}`,
      );
    }
  }
  const observedLaneCount = diagnostics.values[
    "scheduler.group.live-lane-count"
  ]?.latest;
  if (observedLaneCount !== scenarioCount) {
    violations.push(
      `observed group lane count ${observedLaneCount ?? "missing"}`
        + ` != ${scenarioCount}`,
    );
  }
  const effectiveRate = diagnostics.values[
    "scheduler.group.effective-playback-rate"
  ]?.latest;
  const safeRate = diagnostics.values[
    "scheduler.group.safe-playback-rate"
  ]?.latest;
  if (
    effectiveRate === undefined
    || safeRate === undefined
    || effectiveRate > safeRate + 1e-9
  ) {
    violations.push("effective group rate exceeds or lacks its safe limit");
  }
  requireMetricMaximumV3(
    diagnostics.metrics,
    (metric) => metric.endsWith(".worker-round-trip"),
    "lane Worker RTT p95",
    budget.maximumWorkerRoundTripP95Ms,
    violations,
  );
  requireMetricMaximumV3(
    diagnostics.metrics,
    (metric) => metric.startsWith("canvas.")
      && metric.endsWith(".display-interval"),
    "Canvas meaningful display interval p95",
    budget.maximumCanvasDisplayIntervalP95Ms,
    violations,
  );
  requireMetricMaximumV3(
    diagnostics.metrics,
    (metric) => metric.startsWith("canvas.") && metric.endsWith(".draw"),
    "Canvas draw p95",
    budget.maximumCanvasDrawP95Ms,
    violations,
  );
  const overloadReanchors = Object.entries(diagnostics.counters)
    .filter(([metric]) => metric.endsWith(".overload-reanchors"))
    .reduce((sum, [, count]) => sum + count, 0);
  if (overloadReanchors > 0) {
    violations.push(`active playback overload re-anchors = ${overloadReanchors}`);
  }
  if (controlLatencyMs > budget.maximumControlLatencyMs) {
    violations.push(
      `control latency ${controlLatencyMs} ms`
      + ` > ${budget.maximumControlLatencyMs} ms`,
    );
  }
  return Object.freeze(violations);
}

function groupModelTimeRatioValuesV3(snapshot: WorkbenchPerformanceSnapshotV3) {
  return Object.entries(snapshot.values).filter(([metric]) =>
    metric === "scheduler.group.model-time-ratio");
}

function requireMetricMaximumV3(
  metrics: WorkbenchPerformanceSnapshotV3["metrics"],
  select: (metric: string) => boolean,
  label: string,
  maximumMs: number,
  violations: string[],
): void {
  const selected = Object.entries(metrics).filter(([metric]) => select(metric));
  if (selected.length === 0) {
    violations.push(`${label} is missing`);
    return;
  }
  const observed = Math.max(...selected.map(([, value]) => value.p95Ms));
  if (observed > maximumMs) {
    violations.push(`${label} ${observed.toFixed(1)} ms > ${maximumMs} ms`);
  }
}

async function resetDiagnosticsV3(page: Page): Promise<void> {
  await page.evaluate(() => {
    const api = (globalThis as typeof globalThis & Readonly<{
      __circleHeartWorkbenchPerfV3?: Readonly<{ reset(): void }>;
    }>).__circleHeartWorkbenchPerfV3;
    if (api === undefined) throw new Error("Workbench diagnostics are unavailable");
    api.reset();
  });
}

async function performanceSnapshotV3(
  page: Page,
): Promise<WorkbenchPerformanceSnapshotV3> {
  return await page.evaluate(() => {
    const api = (globalThis as typeof globalThis & Readonly<{
      __circleHeartWorkbenchPerfV3?: Readonly<{ snapshot(): unknown }>;
    }>).__circleHeartWorkbenchPerfV3;
    if (api === undefined) throw new Error("Workbench diagnostics are unavailable");
    return api.snapshot();
  }) as WorkbenchPerformanceSnapshotV3;
}

async function modelTimeV3(page: Page): Promise<number> {
  const raw = await page.getByTestId("v3-dockview-workbench")
    .getAttribute("data-model-time-sec");
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`invalid model time ${raw}`);
  return value;
}

async function acceptedRevisionV3(page: Page): Promise<number> {
  const raw = await page.getByTestId("v3-dockview-workbench")
    .getAttribute("data-accepted-revision");
  return Number(raw ?? -1);
}

async function browserPerformanceMetricsV3(
  cdp: CDPSession,
): Promise<Readonly<Record<string, number>>> {
  const response = await cdp.send("Performance.getMetrics") as Readonly<{
    metrics: readonly Readonly<{ name: string; value: number }>[];
  }>;
  return Object.freeze(Object.fromEntries(response.metrics.map(({ name, value }) =>
    [name, value])));
}

function requiredProfileV3(testInfo: TestInfo): PerformanceProfileV3 {
  const profile = PROFILES_V3[testInfo.project.name];
  if (profile === undefined) {
    throw new Error(`unknown Workbench performance profile ${testInfo.project.name}`);
  }
  return profile;
}

function boundedEnvironmentIntegerV3(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer within [${minimum}, ${maximum}]`);
  }
  return parsed;
}
