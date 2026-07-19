import React from "react";

import {
  ScientificWorkbenchReadyV1,
} from "@/components/scientificWorkbench/ScientificWorkbenchPageV1";
import {
  loadScientificWorkbenchOfficialCycleV1,
  type ScientificWorkbenchOfficialCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1";
import {
  loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1,
} from "@/engine/scientificBrowser";
import {
  MainWireScientificBrowserPerformanceProbeV0,
} from "@/engine/scientificBrowser/performance/MainWireScientificBrowserPerformanceProbeV0";

import {
  buildScientificBrowserRawTraceV0,
  createScientificBrowserPerformanceMutableUiProbeV0,
  type ScientificBrowserPerformanceMutableUiProbeV0,
  type ScientificBrowserRawTraceV0,
} from "./scientificBrowserPerformanceTraceV0";

type LabStateV0 =
  | Readonly<{ phase: "running" }>
  | Readonly<{
    phase: "awaiting-paint-fence";
    result: ScientificWorkbenchOfficialCycleV1;
    probe: MainWireScientificBrowserPerformanceProbeV0;
  }>
  | Readonly<{
    phase: "joining-telemetry";
    result: ScientificWorkbenchOfficialCycleV1;
    probe: MainWireScientificBrowserPerformanceProbeV0;
  }>
  | Readonly<{
    phase: "complete";
    result: ScientificWorkbenchOfficialCycleV1;
    trace: ScientificBrowserRawTraceV0;
  }>
  | Readonly<{ phase: "failed"; message: string }>;

/**
 * Unlinked production route for raw browser timing. It is deliberately a
 * diagnostic lab, not a performance artifact creator or cutover gate.
 */
export default function ScientificBrowserPerformanceLabV0() {
  const [state, setState] = React.useState<LabStateV0>({ phase: "running" });
  const uiProbe = React.useRef<ScientificBrowserPerformanceMutableUiProbeV0>(
    createScientificBrowserPerformanceMutableUiProbeV0(),
  );
  const activeProbe = React.useRef<
    MainWireScientificBrowserPerformanceProbeV0 | null
  >(null);
  const monitorStop = React.useRef<(() => void) | null>(null);
  const telemetryJoin = React.useRef<Promise<void> | null>(null);
  const mounted = React.useRef(true);

  React.useLayoutEffect(() => {
    const ui = uiProbe.current;
    ui.pageCommitCountBeforeDiagnostics += 1;
    if (ui.harnessFirstCommitAtHostMs === null) {
      ui.harnessFirstCommitAtHostMs = performance.now();
      monitorStop.current = startBrowserResponsivenessProbeV0(ui);
    }
  });

  React.useEffect(() => {
    let active = true;
    mounted.current = true;
    const ui = uiProbe.current;
    ui.measurementStartedAtHostMs = performance.now();
    const probe = new MainWireScientificBrowserPerformanceProbeV0({
      clientOptions: {
        maximumPendingRequestCount: 1,
        maximumRequestCountPerClientLifetime: 160,
      },
    });
    activeProbe.current = probe;

    telemetryJoin.current = Promise.all([
      withTimeout(probe.protocolReady, 10_000, "Worker protocol-ready"),
      probe.waitForWorkerTimingCount(127, 10_000),
    ]).then(() => undefined).catch(() => undefined);

    // Match the ordinary Workbench: Worker boot and main-thread document
    // verification overlap. The sideband connect envelope was already posted
    // before the first scientific command and may queue naturally.
    void loadScientificWorkbenchOfficialCycleV1(
      probe.client,
      {
        sessionId: "scientific-performance-official-v0",
        bundleLoader: async (identity) => {
          ui.bundleVerificationStartedAtHostMs = performance.now();
          try {
            return await loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1(
              identity,
            );
          } finally {
            ui.bundleVerificationSettledAtHostMs = performance.now();
          }
        },
      },
    )
      .then((result) => {
        ui.loaderSettledAtHostMs = performance.now();
        if (!active) return;
        ui.readyStateDispatchedAtHostMs = performance.now();
        setState({
          phase: "awaiting-paint-fence",
          result,
          probe,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        monitorStop.current?.();
        monitorStop.current = null;
        probe.terminate();
        activeProbe.current = null;
        setState({
          phase: "failed",
          message: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      active = false;
      mounted.current = false;
      monitorStop.current?.();
      monitorStop.current = null;
      activeProbe.current?.terminate();
      activeProbe.current = null;
    };
  }, []);

  const finishMeasurement = React.useCallback(async (
    result: ScientificWorkbenchOfficialCycleV1,
    probe: MainWireScientificBrowserPerformanceProbeV0,
  ) => {
    const ui = uiProbe.current;
    monitorStop.current?.();
    monitorStop.current = null;
    setState({ phase: "joining-telemetry", result, probe });
    await telemetryJoin.current;
    if (!mounted.current) return;
    const trace = buildScientificBrowserRawTraceV0({
      result,
      workerProbe: probe.snapshot(),
      ui,
    });
    probe.terminate();
    activeProbe.current = null;
    setState({ phase: "complete", result, trace });
  }, []);

  const readyResult = state.phase === "awaiting-paint-fence"
    || state.phase === "joining-telemetry"
    || state.phase === "complete"
    ? state.result
    : null;

  return (
    <main
      className="h-full overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8"
      data-state={state.phase}
      data-testid="scientific-browser-performance-lab-v0"
    >
      <header className="mx-auto mb-6 max-w-[1600px] space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-400">
          Scientific browser performance lab · raw trace V0
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Official P1 production-path diagnostic
        </h1>
        <p className="max-w-4xl text-sm leading-6 text-slate-400">
          Hidden measurement route. It records raw intervals and count
          boundaries only; it does not apply a latency threshold, certify
          hardware, claim production cutover, or modify scientific payloads.
        </p>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-5">
        {state.phase === "running" && (
          <StatusPanel title="Running production-path trace">
            Waiting for Worker readiness, verifying the bundled document chain,
            restoring exact V3 P1, and capturing 125 × 4 accepted steps.
          </StatusPanel>
        )}
        {state.phase === "failed" && (
          <section
            className="rounded-xl border border-rose-800 bg-rose-950/40 p-5 text-rose-100"
            role="alert"
          >
            <h2 className="font-semibold">Raw trace failed closed</h2>
            <p className="mt-2 text-sm opacity-80">{state.message}</p>
          </section>
        )}
        {readyResult !== null && (
          <MeasuredReadySurfaceV0
            result={readyResult}
            uiProbe={uiProbe.current}
            onPostAnimationFrameTask={
              state.phase === "awaiting-paint-fence"
                ? () => void finishMeasurement(state.result, state.probe)
                : null
            }
          />
        )}
        {state.phase === "complete" && (
          <>
            <TraceSummaryV0 trace={state.trace} />
            <pre
              className="max-h-[40rem] overflow-auto rounded-xl border border-slate-800 bg-black/40 p-4 text-xs leading-5 text-slate-300"
              data-state="complete"
              data-testid="scientific-browser-raw-trace-v0"
            >
              {JSON.stringify(state.trace, null, 2)}
            </pre>
          </>
        )}
      </div>
    </main>
  );
}

function MeasuredReadySurfaceV0({
  result,
  uiProbe,
  onPostAnimationFrameTask,
}: Readonly<{
  result: ScientificWorkbenchOfficialCycleV1;
  uiProbe: ScientificBrowserPerformanceMutableUiProbeV0;
  onPostAnimationFrameTask: (() => void) | null;
}>) {
  const finishRef = React.useRef(onPostAnimationFrameTask);
  finishRef.current = onPostAnimationFrameTask;

  React.useLayoutEffect(() => {
    uiProbe.readySurfaceCommitCount += 1;
    if (uiProbe.readySurfaceCommittedAtHostMs !== null) return;
    uiProbe.readySurfaceCommittedAtHostMs = performance.now();
    let active = true;
    let firstFrameId = 0;
    let secondFrameId = 0;
    let taskId: ReturnType<typeof setTimeout> | null = null;
    firstFrameId = requestAnimationFrame(() => {
      if (!active) return;
      uiProbe.animationFrameCallbackCount += 1;
      uiProbe.firstAnimationFrameAtHostMs = performance.now();
      secondFrameId = requestAnimationFrame(() => {
        if (!active) return;
        uiProbe.animationFrameCallbackCount += 1;
        uiProbe.secondAnimationFrameAtHostMs = performance.now();
        taskId = setTimeout(() => {
          if (!active) return;
          uiProbe.postAnimationFrameTaskAtHostMs = performance.now();
          finishRef.current?.();
        }, 0);
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(firstFrameId);
      cancelAnimationFrame(secondFrameId);
      if (taskId !== null) clearTimeout(taskId);
    };
  }, [uiProbe]);

  return (
    <section className="space-y-4" data-testid="scientific-performance-ready-surface-v0">
      <ScientificWorkbenchReadyV1
        result={Object.freeze({
          kind: "official" as const,
          result,
        })}
      />
    </section>
  );
}

function TraceSummaryV0({ trace }: Readonly<{ trace: ScientificBrowserRawTraceV0 }>) {
  return (
    <section
      className="grid gap-3 rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="scientific-browser-performance-summary-v0"
    >
      <Evidence
        label="Observable samples"
        value={String(trace.scientific.observableSampleCount)}
      />
      <Evidence
        label="Capture responses"
        value={String(
          trace.workerProbe.counts.captureScientificResponseCount,
        )}
      />
      <Evidence
        label="All responses"
        value={String(trace.workerProbe.counts.scientificResponseCount)}
      />
      <Evidence
        label="Ready task fence"
        value={formatMs(
          trace.stageIntervals.navigationStartToReadyPostAnimationFrameTaskMs,
        )}
      />
    </section>
  );
}

function Evidence({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}

function StatusPanel({
  title,
  children,
}: React.PropsWithChildren<Readonly<{ title: string }>>) {
  return (
    <section
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-slate-200"
      role="status"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm opacity-80">{children}</p>
    </section>
  );
}

function startBrowserResponsivenessProbeV0(
  ui: ScientificBrowserPerformanceMutableUiProbeV0,
): () => void {
  let active = true;
  let animationFrameId = 0;
  let previousFrameAtMs: number | null = null;
  const frame = (nowMs: number): void => {
    if (!active) return;
    if (previousFrameAtMs !== null) {
      ui.animationFrameGapsMs.push(nowMs - previousFrameAtMs);
    }
    previousFrameAtMs = nowMs;
    animationFrameId = requestAnimationFrame(frame);
  };
  animationFrameId = requestAnimationFrame(frame);

  let observer: PerformanceObserver | null = null;
  const supported = typeof PerformanceObserver !== "undefined"
    && (PerformanceObserver.supportedEntryTypes?.includes("longtask") ?? false);
  ui.longTaskSupport = supported ? "supported" : "unsupported";
  if (supported) {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        ui.longTasks.push(Object.freeze({
          startTimeMs: entry.startTime,
          durationMs: entry.duration,
        }));
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  }

  return () => {
    if (!active) return;
    active = false;
    cancelAnimationFrame(animationFrameId);
    observer?.disconnect();
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}

function formatMs(value: number | null): string {
  return value === null ? "unavailable" : `${value.toFixed(1)} ms`;
}
