import React from "react";

import {
  getWorkbenchPerformanceSnapshotV3,
  workbenchPerformanceDiagnosticsEnabledV3,
  type WorkbenchPerformanceSnapshotV3,
} from "./WorkbenchPerformanceDiagnosticsV3";

type NavigatorWithDeviceDiagnosticsV3 = Navigator & Readonly<{
  deviceMemory?: number;
  connection?: Readonly<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>;
}>;

export type WorkbenchDevicePerformanceReportV3 = Readonly<{
  schemaId: "circleheart-workbench-device-performance-report-v1";
  capturedAt: string;
  route: string;
  documentVisible: boolean;
  environment: Readonly<{
    userAgent: string;
    hardwareConcurrency: number;
    deviceMemoryGiB: number | null;
    devicePixelRatio: number;
    viewport: Readonly<{ width: number; height: number }>;
    screen: Readonly<{ width: number; height: number }>;
    connection: Readonly<{
      effectiveType: string | null;
      downlinkMbps: number | null;
      rttMs: number | null;
      saveData: boolean | null;
    }>;
  }>;
  diagnostics: WorkbenchPerformanceSnapshotV3;
}>;

/**
 * Builds a clipboard-safe report on the physical device that actually runs
 * the numerical Workers. It intentionally contains timings and coarse device
 * capabilities only—never fixtures, checkpoints, outputs, or article data.
 */
export function createWorkbenchDevicePerformanceReportV3(
  snapshot = getWorkbenchPerformanceSnapshotV3(),
): WorkbenchDevicePerformanceReportV3 {
  const navigatorV3 = navigator as NavigatorWithDeviceDiagnosticsV3;
  const connection = navigatorV3.connection;
  return Object.freeze({
    schemaId: "circleheart-workbench-device-performance-report-v1",
    capturedAt: new Date().toISOString(),
    route: `${location.pathname}${location.search}`,
    documentVisible: document.visibilityState === "visible",
    environment: Object.freeze({
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGiB: finiteNumberOrNullV3(navigatorV3.deviceMemory),
      devicePixelRatio: window.devicePixelRatio,
      viewport: Object.freeze({
        width: window.innerWidth,
        height: window.innerHeight,
      }),
      screen: Object.freeze({
        width: window.screen.width,
        height: window.screen.height,
      }),
      connection: Object.freeze({
        effectiveType: connection?.effectiveType ?? null,
        downlinkMbps: finiteNumberOrNullV3(connection?.downlink),
        rttMs: finiteNumberOrNullV3(connection?.rtt),
        saveData: typeof connection?.saveData === "boolean"
          ? connection.saveData
          : null,
      }),
    }),
    diagnostics: snapshot,
  });
}

/** Small opt-in overlay used to collect reports from Safari and real phones. */
export function WorkbenchPerformanceReportV3() {
  const enabled = workbenchPerformanceDiagnosticsEnabledV3();
  const [open, setOpen] = React.useState(false);
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [snapshot, setSnapshot] = React.useState<WorkbenchPerformanceSnapshotV3>(
    () => getWorkbenchPerformanceSnapshotV3(),
  );

  React.useEffect(() => {
    if (!enabled || !open) return undefined;
    setSnapshot(getWorkbenchPerformanceSnapshotV3());
    const timer = window.setInterval(() => {
      setSnapshot(getWorkbenchPerformanceSnapshotV3());
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [enabled, open]);

  if (!enabled) return null;
  const groupLaneCount = snapshot.values[
    "scheduler.group.live-lane-count"
  ]?.latest ?? null;
  const groupCapacityRatio = snapshot.values[
    "scheduler.group.model-time-ratio"
  ]?.recentMean ?? null;
  const groupEffectiveRate = snapshot.values[
    "scheduler.group.effective-playback-rate"
  ]?.latest ?? null;
  const groupSafeRate = snapshot.values[
    "scheduler.group.safe-playback-rate"
  ]?.latest ?? null;
  const acceptedCapacitySamples = snapshot.counters[
    "scheduler.group.capacity-samples-accepted"
  ] ?? 0;
  const rejectedCapacitySamples = snapshot.counters[
    "scheduler.group.capacity-samples-rejected"
  ] ?? 0;
  const backgroundActiveWorkers = snapshot.values[
    "background.pool.active-workers"
  ]?.latest ?? null;
  const artifactFetchP95Ms = snapshot.metrics[
    "worker.initialization-artifact-fetch"
  ]?.p95Ms ?? null;
  const executionPlanBindP95Ms = snapshot.metrics[
    "worker.initialization-execution-plan-bind"
  ]?.p95Ms ?? null;
  const workerRoundTrips = Object.entries(snapshot.metrics).filter(([metric]) =>
    metric.endsWith(".worker-round-trip")
  );
  const worstWorkerRoundTripP95Ms = workerRoundTrips.length === 0
    ? null
    : Math.max(...workerRoundTrips.map(([, value]) => value.p95Ms));

  const copyReport = async () => {
    const report = createWorkbenchDevicePerformanceReportV3(
      getWorkbenchPerformanceSnapshotV3(),
    );
    try {
      await copyTextV3(JSON.stringify(report, null, 2));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <aside
      className="fixed bottom-3 right-3 z-[250] max-w-[calc(100vw-1.5rem)] text-wb-text"
      data-testid="workbench-performance-report-v3"
    >
      {open && (
        <div className="mb-2 w-[min(23rem,calc(100vw-1.5rem))] rounded-xl border border-wb-border bg-wb-panel/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold">Physical-device performance</p>
              <p className="mt-0.5 text-[10px] leading-4 text-wb-subtle">
                Timings only. No model or article data is included.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-wb-muted hover:bg-wb-hover"
              aria-label="Close performance report"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            <div>
              <dt className="text-wb-subtle">Live Scenarios</dt>
              <dd className="font-mono">{groupLaneCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Playback / safe</dt>
              <dd className="font-mono">
                {groupEffectiveRate === null || groupSafeRate === null
                  ? "—"
                  : `${groupEffectiveRate.toFixed(2)}× / ${groupSafeRate.toFixed(2)}×`}
              </dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Group compute / wall</dt>
              <dd className="font-mono">
                {groupCapacityRatio === null
                  ? "—"
                  : `${groupCapacityRatio.toFixed(3)}×`}
              </dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Group Worker RTT p95</dt>
              <dd className="font-mono">
                {worstWorkerRoundTripP95Ms === null
                  ? "—"
                  : `${worstWorkerRoundTripP95Ms.toFixed(1)} ms`}
              </dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Calibration evidence</dt>
              <dd className="font-mono">
                {acceptedCapacitySamples} accepted / {rejectedCapacitySamples} skipped
              </dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Background Workers</dt>
              <dd className="font-mono">{backgroundActiveWorkers ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Artifact fetch p95</dt>
              <dd className="font-mono">
                {artifactFetchP95Ms === null
                  ? "—"
                  : `${artifactFetchP95Ms.toFixed(1)} ms`}
              </dd>
            </div>
            <div>
              <dt className="text-wb-subtle">Plan bind p95</dt>
              <dd className="font-mono">
                {executionPlanBindP95Ms === null
                  ? "—"
                  : `${executionPlanBindP95Ms.toFixed(1)} ms`}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-wb-subtle">Logical cores</dt>
              <dd className="font-mono">{navigator.hardwareConcurrency}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => void copyReport()}
            className="mt-3 w-full rounded-lg bg-wb-active px-3 py-2 text-xs font-semibold text-wb-text hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            {copyState === "copied"
              ? "Report copied"
              : copyState === "failed"
                ? "Copy failed—try again"
                : "Copy JSON report"}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setCopyState("idle");
          setOpen((current) => !current);
        }}
        className="ml-auto block rounded-full border border-wb-border bg-wb-panel/95 px-3 py-2 text-[11px] font-semibold shadow-lg backdrop-blur hover:border-wb-accent hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        aria-expanded={open}
      >
        Perf
      </button>
    </aside>
  );
}

function finiteNumberOrNullV3(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function copyTextV3(text: string): Promise<void> {
  if (navigator.clipboard !== undefined) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy is unavailable");
}
