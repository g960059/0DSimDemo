import type {
  ScientificWorkbenchOfficialCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1";
import type {
  MainWireScientificBrowserPerformanceProbeSnapshotV0,
} from "@/engine/scientificBrowser/performance/MainWireScientificBrowserPerformanceProbeV0";

export const SCIENTIFIC_BROWSER_PERFORMANCE_APP_ENTRY_MARK_V0 =
  "circleheart-scientific-performance-app-entry-v0" as const;

export const SCIENTIFIC_BROWSER_RAW_TRACE_V0_ID =
  "circleheart-scientific-browser-raw-trace-v0" as const;

export type ScientificBrowserPerformanceMutableUiProbeV0 = {
  harnessFirstCommitAtHostMs: number | null;
  measurementStartedAtHostMs: number | null;
  bundleVerificationStartedAtHostMs: number | null;
  bundleVerificationSettledAtHostMs: number | null;
  loaderSettledAtHostMs: number | null;
  readyStateDispatchedAtHostMs: number | null;
  readySurfaceCommittedAtHostMs: number | null;
  firstAnimationFrameAtHostMs: number | null;
  secondAnimationFrameAtHostMs: number | null;
  postAnimationFrameTaskAtHostMs: number | null;
  pageCommitCountBeforeDiagnostics: number;
  readySurfaceCommitCount: number;
  animationFrameCallbackCount: number;
  animationFrameGapsMs: number[];
  longTaskSupport: "supported" | "unsupported";
  longTasks: Array<Readonly<{
    startTimeMs: number;
    durationMs: number;
  }>>;
};

export type ScientificBrowserRawTraceV0 = Readonly<{
  traceId: typeof SCIENTIFIC_BROWSER_RAW_TRACE_V0_ID;
  status: "raw-measurement-only";
  protocolVersion: "draft-v0";
  stageIntervals: Readonly<{
    navigationStartToAppEntryMs: number | null;
    navigationStartToHarnessFirstCommitMs: number | null;
    workerConstructionToProtocolReadyMs: number | null;
    bundledDocumentInMemoryVerificationMs: number | null;
    officialV3RestoreRoundTripMs: number | null;
    restoreAcceptedToP1ConfirmationMs: number | null;
    terminalCycleCaptureOuterMs: number | null;
    readyDispatchToCommitMs: number | null;
    readyCommitToFirstAnimationFrameMs: number | null;
    readyCommitToPostAnimationFrameTaskMs: number | null;
    navigationStartToReadyPostAnimationFrameTaskMs: number | null;
  }>;
  scientific: Readonly<{
    observableSampleCount: number;
    acceptedStepSampleCount: number;
    captureWorkerCommandCount: number;
    allOfficialWorkerRequestCount: number;
    releaseRef: ScientificWorkbenchOfficialCycleV1["terminalCycle"]["releaseRef"];
    checkpointSha256: string;
    sessionInputSha256: string;
    caseSha256: string;
    workspaceSha256: string;
    firstRevision: number;
    finalRevision: number;
    durationSec: number;
    period1Confirmed: true;
    responseTimingFieldsAllowed: false;
  }>;
  workerProbe: MainWireScientificBrowserPerformanceProbeSnapshotV0;
  presentation: Readonly<{
    pageCommitCountBeforeDiagnostics: number;
    readySurfaceCommitCount: number;
    animationFrameCallbackCount: number;
    readyPaintObservation:
      "post-two-animation-frames-and-task-fence-not-direct-paint-count";
    arbitraryReadyPaintCountAvailable: false;
    initialPaintTimingEntries: readonly Readonly<{
      name: string;
      startTimeMs: number;
    }>[];
    longTaskSupport: "supported" | "unsupported";
    longTasks: readonly Readonly<{
      startTimeMs: number;
      durationMs: number;
    }>[];
    maximumAnimationFrameGapMs: number | null;
  }>;
  environmentObservation: Readonly<{
    productionBuild: boolean;
    visibilityState: DocumentVisibilityState;
    crossOriginIsolated: boolean;
    navigationType: string | null;
    userAgent: string;
    viewportCssPx: Readonly<{ width: number; height: number }>;
    devicePixelRatio: number;
    resourceEntries: readonly Readonly<{
      initiatorType: string;
      name: string;
      durationMs: number;
      transferSize: number | null;
      encodedBodySize: number | null;
      decodedBodySize: number | null;
    }>[];
    cacheModeDeclaredByHarness: "not-controlled";
    cacheHitInferredFromTransferSize: false;
    devToolsStateAvailableToPage: false;
    extensionStateAvailableToPage: false;
  }>;
  pause: Readonly<{
    includedInThisTrial: false;
    officialBoundary: "between-four-step-capture-commands";
    researchBoundary: "between-whole-500-step-settle-calls";
    destructiveWorkerTerminationCalledPause: false;
  }>;
  claims: Readonly<{
    performanceAcceptanceApplied: false;
    productionCutoverClaimed: false;
    supportedHardwareCertified: false;
    clinicalValidationClaimed: false;
    scientificResponseMutatedForTiming: false;
  }>;
  telemetryJoin: Readonly<{
    outcome: "complete" | "incomplete";
    message: string | null;
  }>;
  limitations: readonly string[];
}>;

export function createScientificBrowserPerformanceMutableUiProbeV0():
ScientificBrowserPerformanceMutableUiProbeV0 {
  return {
    harnessFirstCommitAtHostMs: null,
    measurementStartedAtHostMs: null,
    bundleVerificationStartedAtHostMs: null,
    bundleVerificationSettledAtHostMs: null,
    loaderSettledAtHostMs: null,
    readyStateDispatchedAtHostMs: null,
    readySurfaceCommittedAtHostMs: null,
    firstAnimationFrameAtHostMs: null,
    secondAnimationFrameAtHostMs: null,
    postAnimationFrameTaskAtHostMs: null,
    pageCommitCountBeforeDiagnostics: 0,
    readySurfaceCommitCount: 0,
    animationFrameCallbackCount: 0,
    animationFrameGapsMs: [],
    longTaskSupport: "unsupported",
    longTasks: [],
  };
}

export function buildScientificBrowserRawTraceV0(input: Readonly<{
  result: ScientificWorkbenchOfficialCycleV1;
  workerProbe: MainWireScientificBrowserPerformanceProbeSnapshotV0;
  ui: ScientificBrowserPerformanceMutableUiProbeV0;
}>): ScientificBrowserRawTraceV0 {
  const { result, workerProbe, ui } = input;
  const create = workerProbe.requests.find(({ commandKind }) =>
    commandKind === "createOfficialDocumentCaseSession") ?? null;
  const settle = workerProbe.requests.find(({ commandKind }) =>
    commandKind === "settlePeriodic") ?? null;
  const capture = workerProbe.requests.filter(({ commandKind }) =>
    commandKind === "runTransient");
  const firstCapture = capture[0] ?? null;
  const navigationEntry = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  const appEntry = performance.getEntriesByName(
    SCIENTIFIC_BROWSER_PERFORMANCE_APP_ENTRY_MARK_V0,
  )[0];
  const paintEntries = performance.getEntriesByType("paint").map((entry) =>
    Object.freeze({ name: entry.name, startTimeMs: entry.startTime }));
  const resources = performance.getEntriesByType("resource")
    .map((entry) => entry as PerformanceResourceTiming)
    .map((entry) => Object.freeze({
      initiatorType: entry.initiatorType,
      name: redactResourceName(entry.name),
      durationMs: entry.duration,
      transferSize: finiteOrNull(entry.transferSize),
      encodedBodySize: finiteOrNull(entry.encodedBodySize),
      decodedBodySize: finiteOrNull(entry.decodedBodySize),
    }));

  return Object.freeze({
    traceId: SCIENTIFIC_BROWSER_RAW_TRACE_V0_ID,
    status: "raw-measurement-only" as const,
    protocolVersion: "draft-v0" as const,
    stageIntervals: Object.freeze({
      navigationStartToAppEntryMs: appEntry?.startTime ?? null,
      navigationStartToHarnessFirstCommitMs:
        ui.harnessFirstCommitAtHostMs,
      workerConstructionToProtocolReadyMs:
        workerProbe.workerConstructionToProtocolReadyHostMs,
      bundledDocumentInMemoryVerificationMs: difference(
        ui.bundleVerificationStartedAtHostMs,
        ui.bundleVerificationSettledAtHostMs,
      ),
      officialV3RestoreRoundTripMs: create?.roundTripMs ?? null,
      restoreAcceptedToP1ConfirmationMs: difference(
        create?.promiseSettledAtHostMs ?? null,
        settle?.promiseSettledAtHostMs ?? null,
      ),
      terminalCycleCaptureOuterMs: difference(
        firstCapture?.requestStartedAtHostMs ?? null,
        ui.loaderSettledAtHostMs,
      ),
      readyDispatchToCommitMs: difference(
        ui.readyStateDispatchedAtHostMs,
        ui.readySurfaceCommittedAtHostMs,
      ),
      readyCommitToFirstAnimationFrameMs: difference(
        ui.readySurfaceCommittedAtHostMs,
        ui.firstAnimationFrameAtHostMs,
      ),
      readyCommitToPostAnimationFrameTaskMs: difference(
        ui.readySurfaceCommittedAtHostMs,
        ui.postAnimationFrameTaskAtHostMs,
      ),
      navigationStartToReadyPostAnimationFrameTaskMs:
        ui.postAnimationFrameTaskAtHostMs,
    }),
    scientific: Object.freeze({
      observableSampleCount: result.terminalCycle.frames.length,
      acceptedStepSampleCount:
        workerProbe.counts.captureAcceptedStepFrameCount,
      captureWorkerCommandCount: workerProbe.counts.captureRequestCount,
      allOfficialWorkerRequestCount: workerProbe.counts.totalRequestCount,
      releaseRef: result.terminalCycle.releaseRef,
      checkpointSha256: result.sessionOrigin.checkpointSha256,
      sessionInputSha256: result.sessionOrigin.sessionInputSha256,
      caseSha256: result.sessionOrigin.caseRef.sha256,
      workspaceSha256: result.workspaceDocument.ref.sha256,
      firstRevision: result.terminalCycle.firstRevision,
      finalRevision: result.terminalCycle.finalRevision,
      durationSec: result.terminalCycle.durationSec,
      period1Confirmed: true as const,
      responseTimingFieldsAllowed: false as const,
    }),
    workerProbe,
    presentation: Object.freeze({
      pageCommitCountBeforeDiagnostics: ui.pageCommitCountBeforeDiagnostics,
      readySurfaceCommitCount: ui.readySurfaceCommitCount,
      animationFrameCallbackCount: ui.animationFrameCallbackCount,
      readyPaintObservation:
        "post-two-animation-frames-and-task-fence-not-direct-paint-count" as const,
      arbitraryReadyPaintCountAvailable: false as const,
      initialPaintTimingEntries: Object.freeze(paintEntries),
      longTaskSupport: ui.longTaskSupport,
      longTasks: Object.freeze([...ui.longTasks]),
      maximumAnimationFrameGapMs: ui.animationFrameGapsMs.length === 0
        ? null
        : Math.max(...ui.animationFrameGapsMs),
    }),
    environmentObservation: Object.freeze({
      productionBuild: import.meta.env.PROD,
      visibilityState: document.visibilityState,
      crossOriginIsolated: globalThis.crossOriginIsolated,
      navigationType: navigationEntry?.type ?? null,
      userAgent: navigator.userAgent,
      viewportCssPx: Object.freeze({
        width: window.innerWidth,
        height: window.innerHeight,
      }),
      devicePixelRatio: window.devicePixelRatio,
      resourceEntries: Object.freeze(resources),
      cacheModeDeclaredByHarness: "not-controlled" as const,
      cacheHitInferredFromTransferSize: false as const,
      devToolsStateAvailableToPage: false as const,
      extensionStateAvailableToPage: false as const,
    }),
    pause: Object.freeze({
      includedInThisTrial: false as const,
      officialBoundary: "between-four-step-capture-commands" as const,
      researchBoundary: "between-whole-500-step-settle-calls" as const,
      destructiveWorkerTerminationCalledPause: false as const,
    }),
    claims: Object.freeze({
      performanceAcceptanceApplied: false as const,
      productionCutoverClaimed: false as const,
      supportedHardwareCertified: false as const,
      clinicalValidationClaimed: false as const,
      scientificResponseMutatedForTiming: false as const,
    }),
    telemetryJoin: Object.freeze({
      outcome: workerProbe.counts.joinedWorkerTimingRequestCount
          === workerProbe.counts.totalRequestCount
        ? "complete" as const
        : "incomplete" as const,
      message: workerProbe.counts.joinedWorkerTimingRequestCount
          === workerProbe.counts.totalRequestCount
        ? null
        : `${workerProbe.counts.joinedWorkerTimingRequestCount}/${workerProbe.counts.totalRequestCount} request timings joined`,
    }),
    limitations: Object.freeze([
      "This is one raw diagnostic trace, not a canonical performance artifact.",
      "Two requestAnimationFrame callbacks plus a task fence are not a direct count of arbitrary paints.",
      "Cache, DevTools, extensions, power state, and foreground discipline require an external runner declaration.",
      "The opt-in sideband adds observational overhead; object identity is unit-tested, while full probe-on/off numerical parity and timing transparency remain unresolved.",
      "Pause behaviour must be measured in separate fresh-Worker trials and is not implemented in this official-ready span.",
    ]),
  });
}

function redactResourceName(value: string): string {
  try {
    const url = new URL(value, window.location.href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "unparseable-resource-name";
  }
}

function difference(
  start: number | null,
  end: number | null,
): number | null {
  return start === null || end === null ? null : end - start;
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}
