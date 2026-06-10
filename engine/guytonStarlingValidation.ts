import { DEFAULT_PARAMS } from "@/constants";
import type {
  GuytonBaseMapResponse,
  GuytonStarlingBrowserTiming,
  GuytonMismatchDiagnostic,
  GuytonSide,
  StarlingSweepCurve,
  StarlingSweepProgressMessage,
  StarlingSweepRequest,
  StarlingSweepAuditMessage,
  StarlingSweepExplorationReason,
  StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import type { StarlingSweepInterpretation } from "@/engine/guytonStarling";
import { classifyStarlingSweepPoint, isStarlingSweepFitSourcePoint, starlingSweepSignature } from "@/engine/guytonStarling";
import type {
  GuytonChainWorkerMessage,
  GuytonChainWorkerRequest,
  GuytonChainId,
  GuytonWorkerSettledRun,
} from "@/engine/guytonStarlingChainProtocol";
import { postGuytonChainWorkerMessages } from "@/engine/guytonStarlingChainWorkerCore";
import {
  buildGuytonBaseMapResponse,
  buildParallelStarlingSweepAuditMessage,
  buildParallelStarlingSweepResponse,
  buildWorkerBaseline,
  type GuytonChainWorkerLike,
} from "@/engine/guytonStarlingWorkerCore";
import { createLatestOnlyRequestQueue } from "@/engine/guytonStarlingWorkerQueue";
import type { CoreRuntimeParams, SimMetrics, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";

export type GuytonStarlingValidationScenario = {
  id: string;
  label: string;
  targetVolumeMl: number;
  params: CoreRuntimeParams;
};

export type GuytonStarlingSideValidation = {
  residualPumpLMin: number;
  residualPumpFraction: number;
  residualReturnLMin: number;
  residualReturnFraction: number;
  residualPumpExceedsThreshold: boolean;
  residualReturnExceedsThreshold: boolean;
  pressureMmHg: number;
  flowLMin: number;
  returnFlowLMin: number;
  sweep: SweepQualityReport;
  interpretation?: StarlingSweepInterpretation;
};

export type SweepQualityReport = {
  pointCount: number;
  settledPointCount: number;
  warningCount: number;
  fitSourcePointCount: number;
  fitPointCount: number;
  extrapolatedLeftCount: number;
  extrapolatedRightCount: number;
  reliablePointCount: number;
  stressPointCount: number;
  invalidPointCount: number;
};

export type ProgressTimingReport = {
  firstProgressMs: number | null;
  firstFitProgressMs: number | null;
  finalSweepMs: number | null;
  progressEvents: Array<{
    elapsedMs: number;
    completedPoints: number;
    totalPoints: number;
    rightHasFit: boolean;
    leftHasFit: boolean;
  }>;
};

export type WarningBreakdownKey =
  | "baseSettle"
  | "sweepSettleCap"
  | "sweepSettleOther"
  | "health"
  | "retargetFallback"
  | "parallelFallback"
  | "cycleMeanFallback";

export type WarningBreakdown = Record<WarningBreakdownKey, number>;

export type TimingMetricBreakdown = {
  maxMs: number;
  medianMs: number;
};

export type TimingBreakdownSummary = {
  baselineMs: TimingMetricBreakdown;
  baseMapMs: TimingMetricBreakdown;
  sweepOnlyMs: TimingMetricBreakdown;
  finalFromStartMs: TimingMetricBreakdown;
  auditOnlyMs: TimingMetricBreakdown;
  auditFromStartMs: TimingMetricBreakdown;
};

export type ScenarioTimingBreakdown = {
  baselineMs: number;
  baseMapMs: number;
  sweepOnlyMs: number;
  finalFromStartMs: number;
  auditOnlyMs: number | null;
  auditFromStartMs: number | null;
};

export type BaselineDiagnostics = {
  targetVolumeMl: number;
  wallMs: number;
  source: string;
  settle: SettleStatus;
  health: SimulationHealth;
};

export type SweepPointDiagnostics = {
  deltaVolumeMl: number;
  targetVolumeMl: number;
  chain: "baseline" | "adaptive" | GuytonChainId;
  arrivalOrder: number;
  wallMs: number;
  source: string;
  retarget: GuytonWorkerSettledRun["retarget"];
  retargetFallback: boolean;
  settle: SettleStatus;
  health: SimulationHealth;
  displayReliable: boolean;
  seedReliable: boolean;
  explorationReason?: StarlingSweepExplorationReason;
  candidateRank?: number;
  seededFromDeltaMl?: number;
  seedAccepted: boolean;
  seedRejectReason?: string;
};

export type WarningDetail = {
  category: WarningBreakdownKey;
  scope: "base-map" | "sweep-point" | "parallel" | "cycle-mean";
  message: string;
  deltaVolumeMl?: number;
  targetVolumeMl?: number;
  settle?: SettleStatus;
  healthStatus?: SimulationHealth["status"];
  healthMessages?: string[];
};

export type GuytonStarlingValidationResult = {
  scenarioId: string;
  label: string;
  targetVolumeMl: number;
  measurementMode: "in-process-inline-chain";
  baseline: {
    source: string;
    wallMs: number;
    settle: SettleStatus;
    health: SimulationHealth;
    metrics: Pick<SimMetrics, "RAPMean" | "LAPMean" | "CO_R" | "CO_L" | "systemicVenousReturnLMin" | "pulmonaryVenousReturnLMin">;
  };
  baseMapTiming: GuytonBaseMapResponse["timing"];
  sweepTiming: StarlingSweepWorkerMessage["timing"];
  full7SweepTiming: StarlingSweepWorkerMessage["timing"];
  auditTiming?: StarlingSweepAuditMessage["timing"];
  auditCompletionMs: number | null;
  auditAddedPointCount: number;
  auditReusedPointCount: number;
  seedRejectionCount: number;
  progressTiming: ProgressTimingReport;
  browserTiming?: GuytonStarlingBrowserTiming;
  timingBreakdown: ScenarioTimingBreakdown;
  baselineDiagnostics: BaselineDiagnostics;
  sweepPointDiagnostics: SweepPointDiagnostics[];
  warningDetails: WarningDetail[];
  warningBreakdown: WarningBreakdown;
  calibrationComparison: CalibrationComparisonReport;
  right: GuytonStarlingSideValidation;
  left: GuytonStarlingSideValidation;
  warnings: string[];
  errors: string[];
};

export type CalibrationComparisonReport = {
  calibratedPointCount: number;
  full7PointCount: number;
  calibratedFinalMs: number | null;
  full7FinalMs: number | null;
  latencyDeltaMs: number | null;
  rightHoldoutMaxFlowErrorLMin: number | null;
  leftHoldoutMaxFlowErrorLMin: number | null;
  maxHoldoutFlowErrorLMin: number | null;
  fallbackReasons: string[];
};

export type GuytonStarlingValidationReport = {
  schemaVersion: 5;
  generatedAt: string;
  summary: {
    scenarioCount: number;
    warningCount: number;
    errorCount: number;
    maxAbsPumpResidualLMin: number;
    maxAbsReturnResidualLMin: number;
    maxFinalSweepMs: number;
    measurementMode: "in-process-inline-chain";
    warningBreakdown: WarningBreakdown;
    timingBreakdown: TimingBreakdownSummary;
    calibratedVsFull7: CalibrationSummaryReport;
    queueCancellation: QueueCancellationReport;
  };
  scenarios: GuytonStarlingValidationResult[];
};

export type CalibrationSummaryReport = {
  medianCalibratedFinalMs: number;
  medianFull7FinalMs: number;
  medianLatencyDeltaMs: number;
  maxHoldoutFlowErrorLMin: number;
  fallbackScenarioCount: number;
};

export type QueueCancellationReport = {
  requestCount: number;
  droppedQueuedRequests: number;
  cancelledActiveRequests: number;
  postedFinalResponses: number;
  latestSignature: string;
};

export function guytonStarlingValidationScenarios(): GuytonStarlingValidationScenario[] {
  return [
    scenario("default", "Default", 5600),
    scenario("hypovolemia", "Hypovolemia", 4600),
    scenario("hypervolemia", "Hypervolemia", 7000),
    scenario("lv-failure", "LV failure", 5600, { lvTmaxScale: 0.45 }),
    scenario("rv-failure", "RV failure", 5600, { rvTmaxScale: 0.45 }),
    scenario("high-svr", "High SVR", 5600, { systemicResistance: 1.8 }),
    scenario("peep", "PEEP 10", 5600, { PEEP: 10 }),
  ];
}

export async function runGuytonStarlingValidation(
  scenarios: readonly GuytonStarlingValidationScenario[] = guytonStarlingValidationScenarios(),
): Promise<GuytonStarlingValidationReport> {
  const results: GuytonStarlingValidationResult[] = [];
  for (const item of scenarios) {
    results.push(await runGuytonStarlingValidationScenario(item));
  }
  const warningCount = results.reduce((sum, result) => sum + result.warnings.length, 0);
  const errorCount = results.reduce((sum, result) => sum + result.errors.length, 0);
  return {
    schemaVersion: 5,
    generatedAt: new Date().toISOString(),
    summary: {
      scenarioCount: results.length,
      warningCount,
      errorCount,
      maxAbsPumpResidualLMin: maxAbs(results.flatMap((result) => [
        result.right.residualPumpLMin,
        result.left.residualPumpLMin,
      ])),
      maxAbsReturnResidualLMin: maxAbs(results.flatMap((result) => [
        result.right.residualReturnLMin,
        result.left.residualReturnLMin,
      ])),
      maxFinalSweepMs: Math.max(0, ...results.map((result) => result.progressTiming.finalSweepMs ?? 0)),
      measurementMode: "in-process-inline-chain",
      warningBreakdown: warningBreakdownFromDetails(results.flatMap((result) => result.warningDetails)),
      timingBreakdown: buildTimingBreakdownSummary(results.map((result) => result.timingBreakdown)),
      calibratedVsFull7: buildCalibrationSummary(results.map((result) => result.calibrationComparison)),
      queueCancellation: runQueueCancellationValidation(),
    },
    scenarios: results,
  };
}

export async function runGuytonStarlingValidationScenario(
  item: GuytonStarlingValidationScenario,
): Promise<GuytonStarlingValidationResult> {
  const req = requestForScenario(item);
  const started = performanceNow();
  const baseline = buildWorkerBaseline(req);
  const baseMap = buildGuytonBaseMapResponse(req, baseline);
  const progressEvents: ProgressTimingReport["progressEvents"] = [];
  const capturedRuns: CapturedSweepRun[] = [{
    chain: "baseline",
    arrivalOrder: 0,
    deltaVolumeMl: 0,
    run: baseline,
  }];
  let nextArrivalOrder = 1;
  const sweep = await buildParallelStarlingSweepResponse(req, baseline, {
    createChainWorker: () => new InlineValidationChainWorker((message) => {
      capturedRuns.push({
        chain: message.chainId,
        arrivalOrder: nextArrivalOrder++,
        deltaVolumeMl: message.result.deltaVolumeMl,
        run: message.result.run,
      });
    }),
    onProgress: (message) => {
      progressEvents.push(progressTimingEvent(message, performanceNow() - started));
    },
    onRun: (result) => {
      capturedRuns.push({
        chain: result.chain,
        arrivalOrder: nextArrivalOrder++,
        deltaVolumeMl: result.deltaVolumeMl,
        run: result.run,
      });
    },
  });
  const calibratedFinalFromStartMs = performanceNow() - started;
  const auditStarted = performanceNow();
  const audit = await buildParallelStarlingSweepAuditMessage(req, baseline, sweep, {
    createChainWorker: () => new InlineValidationChainWorker((message) => {
      capturedRuns.push({
        chain: message.chainId,
        arrivalOrder: nextArrivalOrder++,
        deltaVolumeMl: message.result.deltaVolumeMl,
        run: message.result.run,
      });
    }),
  });
  const auditElapsed = performanceNow() - auditStarted;
  const auditFromStartMs = audit ? performanceNow() - started : null;
  const full7Sweep = auditToFull7Sweep(sweep, audit, auditElapsed);
  const timingBreakdown = scenarioTimingBreakdown(
    baseMap,
    sweep,
    calibratedFinalFromStartMs,
    audit ? auditElapsed : null,
    auditFromStartMs,
  );
  const explorationByDeltaMap = buildExplorationByDelta(sweep, audit);
  const uniqueCapturedRuns = uniqueCapturedSweepRuns(capturedRuns);
  const sweepPointDiagnostics = uniqueCapturedRuns
    .map((run) => sweepPointDiagnosticsFromRun(run, explorationByDeltaMap.get(run.deltaVolumeMl)))
    .sort((a, b) => a.arrivalOrder - b.arrivalOrder);
  const baselineDiagnostics = baselineDiagnosticsFromRun(baseline);
  const warningDetails = validationWarningDetails(baseMap, sweep, baselineDiagnostics, sweepPointDiagnostics);
  const calibrationComparison = calibrationComparisonReport(sweep, full7Sweep, auditElapsed);

  return {
    scenarioId: item.id,
    label: item.label,
    targetVolumeMl: item.targetVolumeMl,
    measurementMode: "in-process-inline-chain",
    baseline: {
      source: baseline.source,
      wallMs: baseline.wallMs,
      settle: baseline.settle,
      health: baseline.health,
      metrics: {
        RAPMean: baseline.metrics.RAPMean,
        LAPMean: baseline.metrics.LAPMean,
        CO_R: baseline.metrics.CO_R,
        CO_L: baseline.metrics.CO_L,
        systemicVenousReturnLMin: baseline.metrics.systemicVenousReturnLMin,
        pulmonaryVenousReturnLMin: baseline.metrics.pulmonaryVenousReturnLMin,
      },
    },
    baseMapTiming: baseMap.timing,
    sweepTiming: sweep.timing,
    full7SweepTiming: full7Sweep.timing,
    auditTiming: audit?.timing,
    auditCompletionMs: audit ? auditElapsed : null,
    auditAddedPointCount: audit?.right?.audit?.addedDeltasMl.length ?? audit?.left?.audit?.addedDeltasMl.length ?? 0,
    auditReusedPointCount: audit?.right?.audit?.reusedDeltasMl.length ?? audit?.left?.audit?.reusedDeltasMl.length ?? 0,
    seedRejectionCount: sweepPointDiagnostics.filter((point) => !point.seedAccepted).length,
    progressTiming: buildProgressTimingReport(progressEvents, calibratedFinalFromStartMs),
    timingBreakdown,
    baselineDiagnostics,
    sweepPointDiagnostics,
    warningDetails,
    warningBreakdown: warningBreakdownFromDetails(warningDetails),
    calibrationComparison,
    right: sideValidation("right", baseMap, sweep),
    left: sideValidation("left", baseMap, sweep),
    warnings: uniqueStrings([
      ...baseMap.warnings,
      ...sweep.warnings,
      ...(baseMap.right?.warnings ?? []),
      ...(baseMap.left?.warnings ?? []),
      ...(sweep.right?.warnings ?? []),
      ...(sweep.left?.warnings ?? []),
    ]),
    errors: uniqueStrings([baseMap.error, sweep.error].filter(Boolean) as string[]),
  };
}

function uniqueCapturedSweepRuns(runs: CapturedSweepRun[]): CapturedSweepRun[] {
  const seen = new Set<number>();
  const unique: CapturedSweepRun[] = [];
  for (const run of runs.sort((a, b) => a.arrivalOrder - b.arrivalOrder)) {
    if (seen.has(run.deltaVolumeMl)) continue;
    seen.add(run.deltaVolumeMl);
    unique.push(run);
  }
  return unique;
}

export function guytonStarlingValidationReportToMarkdown(report: GuytonStarlingValidationReport): string {
  const lines: string[] = [
    "# Guyton/Starling Validation",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Measurement mode: in-process inline chain worker. Chain work executes synchronously in this Node process, so browser Worker spawn/module-load overhead and true browser parallel wall-time are not included.",
    "",
    "## Summary",
    "",
    `- Scenarios: ${report.summary.scenarioCount}`,
    `- Warnings: ${report.summary.warningCount}`,
    `- Errors: ${report.summary.errorCount}`,
    `- Max pump residual: ${fmt(report.summary.maxAbsPumpResidualLMin)} L/min`,
    `- Max return residual: ${fmt(report.summary.maxAbsReturnResidualLMin)} L/min`,
    `- Max final sweep latency: ${fmt(report.summary.maxFinalSweepMs)} ms`,
    `- Adaptive final median: ${fmt(report.summary.calibratedVsFull7.medianCalibratedFinalMs)} ms`,
    `- Final exploration median: ${fmt(report.summary.calibratedVsFull7.medianFull7FinalMs)} ms`,
    `- Median exploration latency delta: ${fmt(report.summary.calibratedVsFull7.medianLatencyDeltaMs)} ms`,
    `- Max adaptive interpolation error: ${fmt(report.summary.calibratedVsFull7.maxHoldoutFlowErrorLMin)} L/min`,
    "",
    "## Warning Breakdown",
    "",
    "| Category | Count |",
    "|---|---:|",
    ...WARNING_BREAKDOWN_KEYS.map((key) => `| ${key} | ${report.summary.warningBreakdown[key]} |`),
    "",
    "## Timing Breakdown",
    "",
    "| Scenario | baselineMs | baseMapMs | sweepOnlyMs | finalFromStartMs | auditOnlyMs | auditFromStartMs |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...report.scenarios.map((result) => [
      `| ${result.scenarioId}`,
      fmt(result.timingBreakdown.baselineMs),
      fmt(result.timingBreakdown.baseMapMs),
      fmt(result.timingBreakdown.sweepOnlyMs),
      fmt(result.timingBreakdown.finalFromStartMs),
      fmtNullable(result.timingBreakdown.auditOnlyMs),
      `${fmtNullable(result.timingBreakdown.auditFromStartMs)} |`,
    ].join(" | ")),
    "",
    `Timing summary: baseline median ${fmt(report.summary.timingBreakdown.baselineMs.medianMs)} ms / max ${fmt(report.summary.timingBreakdown.baselineMs.maxMs)} ms; `
      + `sweepOnlyMs median ${fmt(report.summary.timingBreakdown.sweepOnlyMs.medianMs)} ms / max ${fmt(report.summary.timingBreakdown.sweepOnlyMs.maxMs)} ms; `
      + `auditOnlyMs median ${fmt(report.summary.timingBreakdown.auditOnlyMs.medianMs)} ms / max ${fmt(report.summary.timingBreakdown.auditOnlyMs.maxMs)} ms.`,
    "",
    "## Adaptive Exploration",
    "",
    "| Scenario | Points | Added | Reused | Final pts | Adaptive final | Exploration final | Delta | R interp err | L interp err | Seed rejects | Fallback |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",
  ];

  for (const result of report.scenarios) {
    const cmp = result.calibrationComparison;
    lines.push([
      `| ${result.scenarioId}`,
      cmp.calibratedPointCount,
      result.auditAddedPointCount,
      result.auditReusedPointCount,
      cmp.full7PointCount,
      fmtNullable(cmp.calibratedFinalMs),
      fmtNullable(cmp.full7FinalMs),
      fmtNullable(cmp.latencyDeltaMs),
      fmtNullable(cmp.rightHoldoutMaxFlowErrorLMin),
      fmtNullable(cmp.leftHoldoutMaxFlowErrorLMin),
      result.seedRejectionCount,
      `${cmp.fallbackReasons.length ? cmp.fallbackReasons.join("; ").replace(/\|/g, "/") : "none"} |`,
    ].join(" | "));
  }

  lines.push(
    "",
    "## Scenario Metrics",
    "",
    "| Scenario | TBV | RAP | LAP | CO_R | CO_L | R pump residual | L pump residual | First point | First fit | Final |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );

  for (const result of report.scenarios) {
    lines.push([
      `| ${result.scenarioId}`,
      fmt(result.targetVolumeMl, 0),
      fmt(result.baseline.metrics.RAPMean),
      fmt(result.baseline.metrics.LAPMean),
      fmt(result.baseline.metrics.CO_R),
      fmt(result.baseline.metrics.CO_L),
      fmt(result.right.residualPumpLMin),
      fmt(result.left.residualPumpLMin),
      fmtNullable(result.progressTiming.firstProgressMs),
      fmtNullable(result.progressTiming.firstFitProgressMs),
      `${fmtNullable(result.progressTiming.finalSweepMs)} |`,
    ].join(" | "));
  }

  lines.push(
    "",
    "## Sweep Quality",
    "",
    "| Scenario | Side | Points | Settled | Reliable | Stress | Invalid | Warnings | Fit anchors | Fit pts | Extrap left | Extrap right |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );

  for (const result of report.scenarios) {
    for (const side of ["right", "left"] as const) {
      const quality = result[side].sweep;
      lines.push([
        `| ${result.scenarioId}`,
        side,
        quality.pointCount,
        quality.settledPointCount,
        quality.reliablePointCount,
        quality.stressPointCount,
        quality.invalidPointCount,
        quality.warningCount,
        quality.fitSourcePointCount,
        quality.fitPointCount,
        quality.extrapolatedLeftCount,
        `${quality.extrapolatedRightCount} |`,
      ].join(" | "));
    }
  }

  lines.push(
    "",
    "## Sweep Interpretation",
    "",
    "| Scenario | Side | x/y | Sweep | Basis | Anchors | Measured range | Extrapolation | zeroFlowConstrained |",
    "|---|---|---|---|---|---|---|---|---|",
  );

  for (const result of report.scenarios) {
    for (const side of ["right", "left"] as const) {
      const interpretation = result[side].interpretation;
      lines.push([
        `| ${result.scenarioId}`,
        side,
        interpretation ? `${interpretation.xAxis}/${interpretation.yAxis}` : "-",
        interpretation?.sweepVariable ?? "-",
        interpretation?.fitBasis ?? "-",
        interpretation ? interpretation.anchorDeltasMl.map(formatSignedMl).join(", ") : "-",
        interpretation?.measuredRangeMmHg ? `${fmt(interpretation.measuredRangeMmHg.min)}-${fmt(interpretation.measuredRangeMmHg.max)} mmHg` : "-",
        interpretation?.extrapolation ?? "-",
        `${interpretation?.zeroFlowConstrained === false ? "false" : "-"} |`,
      ].join(" | "));
    }
  }

  lines.push(
    "",
    "## Queue / Cancellation Timing",
    "",
    "| Burst requests | Dropped queued | Cancelled active | Posted finals | Latest signature |",
    "|---:|---:|---:|---:|---|",
    [
      `| ${report.summary.queueCancellation.requestCount}`,
      report.summary.queueCancellation.droppedQueuedRequests,
      report.summary.queueCancellation.cancelledActiveRequests,
      report.summary.queueCancellation.postedFinalResponses,
      `${report.summary.queueCancellation.latestSignature} |`,
    ].join(" | "),
  );

  const browserTimed = report.scenarios.filter((result) => result.browserTiming);
  if (browserTimed.length > 0) {
    lines.push(
      "",
      "## Browser Worker Timing",
      "",
      "| Scenario | workerCreateMs | baseMapMs | firstProgressMs | firstFitMs | finalSweepMs | totalMs |",
      "|---|---:|---:|---:|---:|---:|---:|",
    );
    for (const result of browserTimed) {
      const timing = result.browserTiming;
      lines.push([
        `| ${result.scenarioId}`,
        fmtOptional(timing?.workerCreateMs),
        fmtOptional(timing?.baseMapMs),
        fmtOptional(timing?.firstProgressMs),
        fmtOptional(timing?.firstFitMs),
        fmtOptional(timing?.finalSweepMs),
        `${fmtOptional(timing?.totalMs)} |`,
      ].join(" | "));
    }
  }

  lines.push(
    "",
    "## Unsettled / Health Points",
    "",
    "| Scenario | Scope | Delta | Target TBV | Reason | actualSeconds | worstSignal | worstDelta | Health | Message |",
    "|---|---|---:|---:|---|---:|---|---:|---|---|",
  );

  const warningRows = report.scenarios.flatMap((result) => (
    result.warningDetails.map((detail) => ({ result, detail }))
  ));
  if (warningRows.length === 0) {
    lines.push("| none | - | - | - | - | - | - | - | - | - |");
  } else {
    for (const { result, detail } of warningRows) {
      lines.push([
        `| ${result.scenarioId}`,
        detail.scope,
        fmtOptional(detail.deltaVolumeMl, 0),
        fmtOptional(detail.targetVolumeMl, 0),
        detail.settle?.reason ?? "-",
        fmtOptional(detail.settle?.actualSeconds),
        detail.settle?.worstSignal ?? "-",
        fmtOptional(detail.settle?.worstDelta, 4),
        detail.healthStatus ?? "-",
        `${detail.message.replace(/\|/g, "/")} |`,
      ].join(" | "));
    }
  }

  lines.push(
    "",
    "## Seed Diagnostics",
    "",
    "| Scenario | Delta | Chain | wallMs | actualSeconds | Display reliable | Seed reliable | Seeded from | Seed accepted | Reject reason | Exploration |",
    "|---|---:|---|---:|---:|---|---|---:|---|---|---|",
  );
  for (const result of report.scenarios) {
    for (const point of result.sweepPointDiagnostics.filter((item) => item.chain !== "baseline")) {
      lines.push([
        `| ${result.scenarioId}`,
        fmt(point.deltaVolumeMl, 0),
        point.chain,
        fmt(point.wallMs),
        fmtOptional(point.settle.actualSeconds),
        point.displayReliable ? "yes" : "no",
        point.seedReliable ? "yes" : "no",
        fmtOptional(point.seededFromDeltaMl, 0),
        point.seedAccepted ? "yes" : "no",
        point.seedRejectReason?.replace(/\|/g, "/") ?? "-",
        `${point.explorationReason ?? "-"} |`,
      ].join(" | "));
    }
  }

  lines.push("", "## Warnings / Fallbacks", "");
  for (const result of report.scenarios) {
    const fallback = result.sweepTiming?.parallelFallback ? `; parallel fallback: ${result.sweepTiming.parallelFallback}` : "";
    const warningText = result.warnings.length ? result.warnings.join("; ") : "none";
    const errorText = result.errors.length ? `; errors: ${result.errors.join("; ")}` : "";
    lines.push(`- ${result.scenarioId}: ${warningText}${fallback}${errorText}`);
  }

  return `${lines.join("\n")}\n`;
}

const WARNING_BREAKDOWN_KEYS: WarningBreakdownKey[] = [
  "baseSettle",
  "sweepSettleCap",
  "sweepSettleOther",
  "health",
  "retargetFallback",
  "parallelFallback",
  "cycleMeanFallback",
];

type CapturedSweepRun = {
  chain: SweepPointDiagnostics["chain"];
  arrivalOrder: number;
  deltaVolumeMl: number;
  run: GuytonWorkerSettledRun;
};

function scenario(
  id: string,
  label: string,
  targetVolumeMl: number,
  overrides: Partial<CoreRuntimeParams> = {},
): GuytonStarlingValidationScenario {
  return {
    id,
    label,
    targetVolumeMl,
    params: { ...DEFAULT_PARAMS, ...overrides },
  };
}

function requestForScenario(item: GuytonStarlingValidationScenario): StarlingSweepRequest {
  return {
    requestId: `validation-${item.id}`,
    signature: starlingSweepSignature("right", item.id, item.params, item.targetVolumeMl),
    instanceId: item.id,
    params: item.params,
    targetVolumeMl: item.targetVolumeMl,
  };
}

export function runQueueCancellationValidation(): QueueCancellationReport {
  const queue = createLatestOnlyRequestQueue();
  const requests = [0, 1, 2, 3, 4].map((index) => ({
    requestId: `burst-${index}`,
    signature: `burst-signature-${index}`,
    instanceId: "burst-instance",
    params: DEFAULT_PARAMS,
    targetVolumeMl: 5600 + index * 50,
  }));
  queue.enqueue(requests[0]);
  const active = queue.shift();
  let droppedQueuedRequests = 0;
  for (const request of requests.slice(1)) {
    droppedQueuedRequests += queue.enqueue(request).length;
  }
  const cancelledActiveRequests = active && !queue.isLatest(active) ? 1 : 0;
  const latest = queue.shift();
  const postedFinalResponses = latest && queue.isLatest(latest) ? 1 : 0;
  return {
    requestCount: requests.length,
    droppedQueuedRequests,
    cancelledActiveRequests,
    postedFinalResponses,
    latestSignature: latest?.signature ?? "",
  };
}

function sideValidation(
  side: GuytonSide,
  baseMap: GuytonBaseMapResponse,
  sweep: StarlingSweepWorkerMessage,
): GuytonStarlingSideValidation {
  const pane = side === "right" ? baseMap.right : baseMap.left;
  const curve = side === "right" ? sweep.right : sweep.left;
  const pump = pane?.guytonDiagnostics.pump ?? emptyDiagnostic();
  const ret = pane?.guytonDiagnostics.return ?? emptyDiagnostic();
  return {
    residualPumpLMin: pump.mismatchLMin,
    residualPumpFraction: pump.mismatchFraction,
    residualReturnLMin: ret.mismatchLMin,
    residualReturnFraction: ret.mismatchFraction,
    residualPumpExceedsThreshold: pump.exceedsThreshold,
    residualReturnExceedsThreshold: ret.exceedsThreshold,
    pressureMmHg: pane?.operatingPoint.pressure ?? NaN,
    flowLMin: pane?.operatingPoint.flow ?? NaN,
    returnFlowLMin: pane?.returnOperatingPoint.flow ?? NaN,
    sweep: sweepQuality(curve),
    interpretation: curve?.interpretation,
  };
}

function sweepQuality(curve: StarlingSweepCurve | undefined): SweepQualityReport {
  const points = curve?.points ?? [];
  const fit = curve?.fit;
  return {
    pointCount: points.length,
    settledPointCount: points.filter((point) => point.settled !== false).length,
    warningCount: curve?.warnings.length ?? 0,
    fitSourcePointCount: fit?.sourcePointCount ?? 0,
    fitPointCount: fit?.points.length ?? 0,
    extrapolatedLeftCount: fit?.extrapolatedLeft?.length ?? 0,
    extrapolatedRightCount: fit?.extrapolatedRight?.length ?? 0,
    reliablePointCount: points.filter(isStarlingSweepFitSourcePoint).length,
    stressPointCount: points.filter((point) => classifyStarlingSweepPoint(point) === "stress").length,
    invalidPointCount: points.filter((point) => classifyStarlingSweepPoint(point) === "invalid").length,
  };
}

function calibrationComparisonReport(
  calibrated: StarlingSweepWorkerMessage,
  full7: StarlingSweepWorkerMessage,
  full7ElapsedMs: number,
): CalibrationComparisonReport {
  const rightError = holdoutMaxFlowError(calibrated.right, full7.right);
  const leftError = holdoutMaxFlowError(calibrated.left, full7.left);
  const calibratedFinalMs = calibrated.timing?.totalMs ?? null;
  const full7FinalMs = full7.timing?.totalMs ?? full7ElapsedMs;
  return {
    calibratedPointCount: calibrated.right?.points.length ?? calibrated.left?.points.length ?? 0,
    full7PointCount: full7.right?.points.length ?? full7.left?.points.length ?? 0,
    calibratedFinalMs,
    full7FinalMs,
    latencyDeltaMs: calibratedFinalMs === null ? null : calibratedFinalMs - full7FinalMs,
    rightHoldoutMaxFlowErrorLMin: rightError,
    leftHoldoutMaxFlowErrorLMin: leftError,
    maxHoldoutFlowErrorLMin: maxNullable([rightError, leftError]),
    fallbackReasons: uniqueStrings([
      ...(calibrated.timing?.fallbackReasons ?? []),
      ...(calibrated.right?.calibration?.fallbackReasons ?? []),
      ...(calibrated.left?.calibration?.fallbackReasons ?? []),
    ]),
  };
}

function auditToFull7Sweep(
  calibrated: StarlingSweepWorkerMessage,
  audit: StarlingSweepAuditMessage | undefined,
  auditElapsedMs: number,
): StarlingSweepWorkerMessage {
  if (!audit) return calibrated;
  return {
    type: "starling-sweep",
    requestId: calibrated.requestId,
    signature: calibrated.signature,
    instanceId: calibrated.instanceId,
    right: audit.right
      ? { ...audit.right, points: audit.right.audit?.points ?? audit.right.points }
      : undefined,
    left: audit.left
      ? { ...audit.left, points: audit.left.audit?.points ?? audit.left.points }
      : undefined,
    warnings: audit.warnings,
    timing: {
      positiveChainMs: audit.timing?.positiveChainMs ?? 0,
      negativeChainMs: audit.timing?.negativeChainMs ?? 0,
      assembleMs: audit.timing?.assembleMs ?? 0,
      totalMs: auditElapsedMs,
      retargetFallbackCount: audit.timing?.retargetFallbackCount ?? 0,
      mode: "adaptive-audit",
      plannedPointCount: audit.timing?.plannedPointCount,
      anchorCount: audit.timing?.anchorCount,
      parallel: audit.timing?.parallel,
      chainWallMs: audit.timing?.chainWallMs,
      parallelFallback: audit.timing?.parallelFallback,
    },
  };
}

function holdoutMaxFlowError(
  calibrated: StarlingSweepCurve | undefined,
  full7: StarlingSweepCurve | undefined,
): number | null {
  if (!calibrated?.fit?.points.length || !full7?.points.length) return null;
  const anchorDeltas = new Set(calibrated.points.map((point) => point.deltaVolumeMl).filter((delta): delta is number => typeof delta === "number"));
  const holdouts = full7.points.filter((point) => {
    if (typeof point.deltaVolumeMl === "number" && anchorDeltas.has(point.deltaVolumeMl)) return false;
    return Number.isFinite(point.x) && Number.isFinite(point.y) && point.status !== "failed";
  });
  if (holdouts.length === 0) return 0;
  return Math.max(...holdouts.map((point) => Math.abs(point.y - interpolateFitY(calibrated.fit!.points, point.x))));
}

function interpolateFitY(points: readonly { x: number; y: number }[], x: number): number {
  if (points.length === 0) return NaN;
  if (x <= points[0].x) return points[0].y;
  for (let i = 0; i < points.length - 1; i++) {
    const left = points[i];
    const right = points[i + 1];
    if (x > right.x) continue;
    const span = right.x - left.x;
    if (!(span > 0)) return left.y;
    const t = (x - left.x) / span;
    return left.y + (right.y - left.y) * t;
  }
  return points[points.length - 1].y;
}

function buildCalibrationSummary(results: CalibrationComparisonReport[]): CalibrationSummaryReport {
  return {
    medianCalibratedFinalMs: medianFinite(results.map((result) => result.calibratedFinalMs)),
    medianFull7FinalMs: medianFinite(results.map((result) => result.full7FinalMs)),
    medianLatencyDeltaMs: medianFinite(results.map((result) => result.latencyDeltaMs)),
    maxHoldoutFlowErrorLMin: Math.max(0, ...results.map((result) => result.maxHoldoutFlowErrorLMin ?? 0)),
    fallbackScenarioCount: results.filter((result) => result.fallbackReasons.length > 0).length,
  };
}

function maxNullable(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return finite.length ? Math.max(...finite) : null;
}

function baselineDiagnosticsFromRun(run: GuytonWorkerSettledRun): BaselineDiagnostics {
  return {
    targetVolumeMl: run.targetVolumeMl,
    wallMs: run.wallMs,
    source: run.source,
    settle: run.settle,
    health: run.health,
  };
}

function buildExplorationByDelta(
  sweep: StarlingSweepWorkerMessage,
  audit: StarlingSweepAuditMessage | undefined,
): Map<number, {
  explorationReason: StarlingSweepExplorationReason;
  candidateRank: number;
}> {
  const map = new Map<number, { explorationReason: StarlingSweepExplorationReason; candidateRank: number }>();
  for (const point of [...(sweep.right?.points ?? []), ...(sweep.left?.points ?? [])]) {
    if (typeof point.deltaVolumeMl !== "number" || !point.explorationReason || point.candidateRank === undefined) continue;
    map.set(point.deltaVolumeMl, {
      explorationReason: point.explorationReason,
      candidateRank: point.candidateRank,
    });
  }
  for (const candidate of audit?.right?.audit?.exploration ?? audit?.left?.audit?.exploration ?? []) {
    map.set(candidate.deltaVolumeMl, {
      explorationReason: candidate.explorationReason,
      candidateRank: candidate.candidateRank,
    });
  }
  return map;
}

function sweepPointDiagnosticsFromRun(
  captured: CapturedSweepRun,
  exploration?: { explorationReason: StarlingSweepExplorationReason; candidateRank: number },
): SweepPointDiagnostics {
  return {
    deltaVolumeMl: captured.deltaVolumeMl,
    targetVolumeMl: captured.run.targetVolumeMl,
    chain: captured.chain,
    arrivalOrder: captured.arrivalOrder,
    wallMs: captured.run.wallMs,
    source: captured.run.source,
    retarget: captured.run.retarget,
    retargetFallback: captured.run.retargetFallback,
    settle: captured.run.settle,
    health: captured.run.health,
    displayReliable: captured.run.reliability.displayReliable,
    seedReliable: captured.run.reliability.seedReliable,
    explorationReason: exploration?.explorationReason,
    candidateRank: exploration?.candidateRank,
    seededFromDeltaMl: captured.run.seededFromDeltaMl,
    seedAccepted: captured.run.seedAccepted,
    seedRejectReason: captured.run.seedRejectReason,
  };
}

function validationWarningDetails(
  baseMap: GuytonBaseMapResponse,
  sweep: StarlingSweepWorkerMessage,
  baseline: BaselineDiagnostics,
  points: SweepPointDiagnostics[],
): WarningDetail[] {
  const details: WarningDetail[] = [];
  if (!baseline.settle.settled) {
    details.push({
      category: "baseSettle",
      scope: "base-map",
      message: "base map: did not fully settle",
      targetVolumeMl: baseline.targetVolumeMl,
      settle: baseline.settle,
      healthStatus: baseline.health.status,
      healthMessages: baseline.health.messages,
    });
  }
  if (baseline.health.status !== "ok") {
    details.push({
      category: "health",
      scope: "base-map",
      message: `base map: health ${baseline.health.status}`,
      targetVolumeMl: baseline.targetVolumeMl,
      settle: baseline.settle,
      healthStatus: baseline.health.status,
      healthMessages: baseline.health.messages,
    });
  }
  for (const warning of baseMap.warnings) {
    if (warning.includes("cycle-mean snapshot fallback")) {
      details.push({
        category: "cycleMeanFallback",
        scope: "cycle-mean",
        message: warning,
      });
    }
  }

  for (const point of points) {
    const label = `${point.deltaVolumeMl >= 0 ? "+" : ""}${Math.round(point.deltaVolumeMl)} mL`;
    if (!point.settle.settled) {
      details.push({
        category: point.settle.reason === "cap" ? "sweepSettleCap" : "sweepSettleOther",
        scope: "sweep-point",
        message: `${label}: sweep point did not fully settle`,
        deltaVolumeMl: point.deltaVolumeMl,
        targetVolumeMl: point.targetVolumeMl,
        settle: point.settle,
        healthStatus: point.health.status,
        healthMessages: point.health.messages,
      });
    }
    if (point.health.status !== "ok") {
      details.push({
        category: "health",
        scope: "sweep-point",
        message: `${label}: health ${point.health.status}`,
        deltaVolumeMl: point.deltaVolumeMl,
        targetVolumeMl: point.targetVolumeMl,
        settle: point.settle,
        healthStatus: point.health.status,
        healthMessages: point.health.messages,
      });
    }
    if (point.retargetFallback) {
      details.push({
        category: "retargetFallback",
        scope: "sweep-point",
        message: `${label}: warm retarget fallback`,
        deltaVolumeMl: point.deltaVolumeMl,
        targetVolumeMl: point.targetVolumeMl,
        settle: point.settle,
        healthStatus: point.health.status,
        healthMessages: point.health.messages,
      });
    }
  }

  if (sweep.timing?.parallelFallback) {
    details.push({
      category: "parallelFallback",
      scope: "parallel",
      message: `parallel chain fallback: ${sweep.timing.parallelFallback}`,
    });
  }
  return details;
}

export function warningBreakdownFromDetails(details: readonly WarningDetail[]): WarningBreakdown {
  const breakdown = emptyWarningBreakdown();
  for (const detail of details) breakdown[detail.category]++;
  return breakdown;
}

function emptyWarningBreakdown(): WarningBreakdown {
  return {
    baseSettle: 0,
    sweepSettleCap: 0,
    sweepSettleOther: 0,
    health: 0,
    retargetFallback: 0,
    parallelFallback: 0,
    cycleMeanFallback: 0,
  };
}

function scenarioTimingBreakdown(
  baseMap: GuytonBaseMapResponse,
  sweep: StarlingSweepWorkerMessage,
  finalFromStartMs: number,
  auditOnlyMs: number | null = null,
  auditFromStartMs: number | null = null,
): ScenarioTimingBreakdown {
  return {
    baselineMs: baseMap.timing?.baselineMs ?? 0,
    baseMapMs: baseMap.timing?.baseMapMs ?? 0,
    sweepOnlyMs: sweep.timing?.totalMs ?? 0,
    finalFromStartMs,
    auditOnlyMs,
    auditFromStartMs,
  };
}

function buildTimingBreakdownSummary(items: readonly ScenarioTimingBreakdown[]): TimingBreakdownSummary {
  return {
    baselineMs: timingMetric(items.map((item) => item.baselineMs)),
    baseMapMs: timingMetric(items.map((item) => item.baseMapMs)),
    sweepOnlyMs: timingMetric(items.map((item) => item.sweepOnlyMs)),
    finalFromStartMs: timingMetric(items.map((item) => item.finalFromStartMs)),
    auditOnlyMs: timingMetricNullable(items.map((item) => item.auditOnlyMs)),
    auditFromStartMs: timingMetricNullable(items.map((item) => item.auditFromStartMs)),
  };
}

function timingMetric(values: readonly number[]): TimingMetricBreakdown {
  return {
    maxMs: maxFinite(values),
    medianMs: medianFinite(values),
  };
}

function timingMetricNullable(values: ReadonlyArray<number | null>): TimingMetricBreakdown {
  return timingMetric(values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)));
}

function progressTimingEvent(
  message: StarlingSweepProgressMessage,
  elapsedMs: number,
): ProgressTimingReport["progressEvents"][number] {
  return {
    elapsedMs,
    completedPoints: message.completedPoints,
    totalPoints: message.totalPoints,
    rightHasFit: Boolean(message.right?.fit),
    leftHasFit: Boolean(message.left?.fit),
  };
}

function buildProgressTimingReport(
  progressEvents: ProgressTimingReport["progressEvents"],
  finalSweepMs: number,
): ProgressTimingReport {
  const firstProgress = progressEvents[0];
  const firstFit = progressEvents.find((event) => (
    event.completedPoints >= 3 && (event.rightHasFit || event.leftHasFit)
  ));
  return {
    firstProgressMs: firstProgress?.elapsedMs ?? null,
    firstFitProgressMs: firstFit?.elapsedMs ?? null,
    finalSweepMs,
    progressEvents,
  };
}

function emptyDiagnostic(): GuytonMismatchDiagnostic {
  return {
    pressure: NaN,
    observedFlow: NaN,
    guytonFlow: NaN,
    mismatchLMin: NaN,
    mismatchFraction: NaN,
    exceedsThreshold: false,
  };
}

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter((item) => item.trim().length > 0)));
}

function maxAbs(values: number[]): number {
  const finite = values.filter(Number.isFinite).map(Math.abs);
  return finite.length ? Math.max(...finite) : NaN;
}

function maxFinite(values: readonly (number | null | undefined)[]): number {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return finite.length ? Math.max(...finite) : NaN;
}

function medianFinite(values: readonly (number | null | undefined)[]): number {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!finite.length) return NaN;
  const mid = Math.floor(finite.length / 2);
  if (finite.length % 2 === 1) return finite[mid];
  return (finite[mid - 1] + finite[mid]) / 2;
}

function fmt(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function fmtNullable(value: number | null | undefined): string {
  return value == null ? "n/a" : fmt(value);
}

function fmtOptional(value: number | null | undefined, digits = 1): string {
  return value == null || !Number.isFinite(value) ? "n/a" : value.toFixed(digits);
}

function formatSignedMl(value: number): string {
  return `${value > 0 ? "+" : ""}${Math.round(value)} mL`;
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

class InlineValidationChainWorker implements GuytonChainWorkerLike {
  onmessage: ((event: MessageEvent<GuytonChainWorkerMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(
    private readonly onChainProgress?: (message: Extract<GuytonChainWorkerMessage, { type: "chain-progress" }>) => void,
  ) {}

  postMessage(request: GuytonChainWorkerRequest): void {
    postGuytonChainWorkerMessages(request, (message) => {
      if (message.type === "chain-progress") this.onChainProgress?.(message);
      this.onmessage?.({ data: message } as MessageEvent<GuytonChainWorkerMessage>);
    });
  }

  terminate(): void {
    // The inline validation worker has no external resources.
  }
}
