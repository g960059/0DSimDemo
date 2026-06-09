import { DEFAULT_PARAMS } from "@/constants";
import type {
  GuytonBaseMapResponse,
  GuytonMismatchDiagnostic,
  GuytonSide,
  StarlingSweepCurve,
  StarlingSweepProgressMessage,
  StarlingSweepRequest,
  StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import { starlingSweepSignature } from "@/engine/guytonStarling";
import type {
  GuytonChainWorkerMessage,
  GuytonChainWorkerRequest,
} from "@/engine/guytonStarlingChainProtocol";
import { postGuytonChainWorkerMessages } from "@/engine/guytonStarlingChainWorkerCore";
import {
  buildGuytonBaseMapResponse,
  buildParallelStarlingSweepResponse,
  buildWorkerBaseline,
  type GuytonChainWorkerLike,
} from "@/engine/guytonStarlingWorkerCore";
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
};

export type SweepQualityReport = {
  pointCount: number;
  settledPointCount: number;
  warningCount: number;
  fitSourcePointCount: number;
  fitPointCount: number;
  extrapolatedLeftCount: number;
  extrapolatedRightCount: number;
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
  progressTiming: ProgressTimingReport;
  right: GuytonStarlingSideValidation;
  left: GuytonStarlingSideValidation;
  warnings: string[];
  errors: string[];
};

export type GuytonStarlingValidationReport = {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    scenarioCount: number;
    warningCount: number;
    errorCount: number;
    maxAbsPumpResidualLMin: number;
    maxAbsReturnResidualLMin: number;
    maxFinalSweepMs: number;
    measurementMode: "in-process-inline-chain";
  };
  scenarios: GuytonStarlingValidationResult[];
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
    schemaVersion: 1,
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
  const sweep = await buildParallelStarlingSweepResponse(req, baseline, {
    createChainWorker: () => new InlineValidationChainWorker(),
    onProgress: (message) => {
      progressEvents.push(progressTimingEvent(message, performanceNow() - started));
    },
  });

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
    progressTiming: buildProgressTimingReport(progressEvents, performanceNow() - started),
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

export function guytonStarlingValidationReportToMarkdown(report: GuytonStarlingValidationReport): string {
  const lines: string[] = [
    "# Guyton/Starling Validation",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Measurement mode: in-process inline chain worker. Browser Worker spawn/module-load overhead is not included.",
    "",
    "## Summary",
    "",
    `- Scenarios: ${report.summary.scenarioCount}`,
    `- Warnings: ${report.summary.warningCount}`,
    `- Errors: ${report.summary.errorCount}`,
    `- Max pump residual: ${fmt(report.summary.maxAbsPumpResidualLMin)} L/min`,
    `- Max return residual: ${fmt(report.summary.maxAbsReturnResidualLMin)} L/min`,
    `- Max final sweep latency: ${fmt(report.summary.maxFinalSweepMs)} ms`,
    "",
    "## Scenario Metrics",
    "",
    "| Scenario | TBV | RAP | LAP | CO_R | CO_L | R pump residual | L pump residual | First point | First fit | Final |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];

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
    "| Scenario | Side | Points | Settled | Warnings | Fit anchors | Fit pts | Extrap left | Extrap right |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|",
  );

  for (const result of report.scenarios) {
    for (const side of ["right", "left"] as const) {
      const quality = result[side].sweep;
      lines.push([
        `| ${result.scenarioId}`,
        side,
        quality.pointCount,
        quality.settledPointCount,
        quality.warningCount,
        quality.fitSourcePointCount,
        quality.fitPointCount,
        quality.extrapolatedLeftCount,
        `${quality.extrapolatedRightCount} |`,
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
  };
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

function fmt(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function fmtNullable(value: number | null | undefined): string {
  return value == null ? "n/a" : fmt(value);
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

class InlineValidationChainWorker implements GuytonChainWorkerLike {
  onmessage: ((event: MessageEvent<GuytonChainWorkerMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(request: GuytonChainWorkerRequest): void {
    postGuytonChainWorkerMessages(request, (message) => {
      this.onmessage?.({ data: message } as MessageEvent<GuytonChainWorkerMessage>);
    });
  }

  terminate(): void {
    // The inline validation worker has no external resources.
  }
}
