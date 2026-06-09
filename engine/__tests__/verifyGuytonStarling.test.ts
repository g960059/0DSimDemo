import { beforeAll, describe, expect, it } from "vitest";
import {
  guytonStarlingValidationReportToMarkdown,
  guytonStarlingValidationScenarios,
  runQueueCancellationValidation,
  runGuytonStarlingValidation,
  warningBreakdownFromDetails,
  type GuytonStarlingValidationReport,
  type WarningDetail,
} from "@/engine/guytonStarlingValidation";
import type { SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";

describe("Guyton / Starling validation report", () => {
  let defaultReport: GuytonStarlingValidationReport;

  beforeAll(async () => {
    defaultReport = await runGuytonStarlingValidation([guytonStarlingValidationScenarios()[0]]);
  }, 45_000);

  it("defines the validation scenario matrix", () => {
    expect(guytonStarlingValidationScenarios().map((scenario) => scenario.id)).toEqual([
      "default",
      "hypovolemia",
      "hypervolemia",
      "lv-failure",
      "rv-failure",
      "high-svr",
      "peep",
    ]);
  });

  it("returns finite diagnostics and timing for the default scenario", () => {
    const result = defaultReport.scenarios[0];
    expect(defaultReport.schemaVersion).toBe(4);
    expect(result.scenarioId).toBe("default");
    expect(result.measurementMode).toBe("in-process-inline-chain");
    expect(Number.isFinite(result.baseline.metrics.RAPMean)).toBe(true);
    expect(Number.isFinite(result.baseline.metrics.LAPMean)).toBe(true);
    expect(Number.isFinite(result.baseline.metrics.CO_R)).toBe(true);
    expect(Number.isFinite(result.baseline.metrics.CO_L)).toBe(true);
    expect(typeof result.baseline.settle.reason).toBe("string");
    expectFiniteNonNegative(result.baseMapTiming?.baselineMs);
    expectFiniteNonNegative(result.baseMapTiming?.baseMapMs);
    expectFiniteNonNegative(result.sweepTiming?.totalMs);
    expectFiniteNonNegative(result.sweepTiming?.chainWallMs);
    expect(result.progressTiming.firstProgressMs).not.toBeNull();
    expect(result.progressTiming.firstFitProgressMs).not.toBeNull();
    expect(result.progressTiming.finalSweepMs).not.toBeNull();
    expectFiniteNonNegative(result.timingBreakdown.baselineMs);
    expectFiniteNonNegative(result.timingBreakdown.baseMapMs);
    expectFiniteNonNegative(result.timingBreakdown.sweepOnlyMs);
    expectFiniteNonNegative(result.timingBreakdown.finalFromStartMs);
    expect(result.baselineDiagnostics.targetVolumeMl).toBe(5600);
    expect(result.sweepPointDiagnostics.length).toBe(4);
    expect(result.sweepPointDiagnostics.map((point) => point.deltaVolumeMl).sort((a, b) => a - b)).toEqual([
      -900,
      0,
      300,
      900,
    ]);
    expect(result.progressTiming.firstFitProgressMs ?? 0).toBeGreaterThanOrEqual(result.progressTiming.firstProgressMs ?? Infinity);
    expect(result.progressTiming.finalSweepMs ?? 0).toBeGreaterThanOrEqual(result.progressTiming.firstFitProgressMs ?? Infinity);
    expect(result.right.sweep.pointCount).toBe(4);
    expect(result.left.sweep.pointCount).toBe(4);
    expect(result.right.sweep.fitSourcePointCount).toBeGreaterThanOrEqual(3);
    expect(result.left.sweep.fitSourcePointCount).toBeGreaterThanOrEqual(3);
    expect(result.calibrationComparison.calibratedPointCount).toBe(4);
    expect(result.calibrationComparison.full7PointCount).toBe(7);
    expectFiniteNonNegative(result.full7SweepTiming?.totalMs);
    expectFiniteNonNegative(result.calibrationComparison.maxHoldoutFlowErrorLMin ?? undefined);
    expect(Number.isFinite(result.right.residualPumpLMin)).toBe(true);
    expect(Number.isFinite(result.left.residualPumpLMin)).toBe(true);
    expect(Number.isFinite(result.right.residualReturnLMin)).toBe(true);
    expect(Number.isFinite(result.left.residualReturnLMin)).toBe(true);
    expect(defaultReport.summary.queueCancellation.droppedQueuedRequests).toBeGreaterThan(0);
  });

  it("keeps the report schema stable", () => {
    expect(Object.keys(defaultReport).sort()).toEqual([
      "generatedAt",
      "scenarios",
      "schemaVersion",
      "summary",
    ]);
    expect(Object.keys(defaultReport.summary).sort()).toEqual([
      "calibratedVsFull7",
      "errorCount",
      "maxAbsPumpResidualLMin",
      "maxAbsReturnResidualLMin",
      "maxFinalSweepMs",
      "measurementMode",
      "queueCancellation",
      "scenarioCount",
      "timingBreakdown",
      "warningBreakdown",
      "warningCount",
    ]);
    expect(Object.keys(defaultReport.summary.warningBreakdown).sort()).toEqual([
      "baseSettle",
      "cycleMeanFallback",
      "health",
      "parallelFallback",
      "retargetFallback",
      "sweepSettleCap",
      "sweepSettleOther",
    ]);
  });

  it("renders markdown with scenario names, residuals, and progress timing", () => {
    const markdown = guytonStarlingValidationReportToMarkdown(defaultReport);
    expect(markdown).toContain("# Guyton/Starling Validation");
    expect(markdown).toContain("default");
    expect(markdown).toContain("R pump residual");
    expect(markdown).toContain("First point");
    expect(markdown).toContain("First fit");
    expect(markdown).toContain("Final");
    expect(markdown).toContain("Warning Breakdown");
    expect(markdown).toContain("Timing Breakdown");
    expect(markdown).toContain("Calibrated vs Full7");
    expect(markdown).toContain("R holdout err");
    expect(markdown).toContain("sweepOnlyMs");
    expect(markdown).toContain("Queue / Cancellation Timing");
    expect(markdown).toContain("Dropped queued");
    expect(markdown).toContain("Unsettled / Health Points");
    expect(markdown).toContain("worstSignal");
    expect(markdown).toContain("worstDelta");
    expect(markdown).toContain("actualSeconds");
  });

  it("reports latest-only queue cancellation behavior", () => {
    expect(runQueueCancellationValidation()).toMatchObject({
      requestCount: 5,
      droppedQueuedRequests: 3,
      cancelledActiveRequests: 1,
      postedFinalResponses: 1,
      latestSignature: "burst-signature-4",
    });
  });

  it("classifies structured warning details by category", () => {
    const capSettle: SettleStatus = { settled: false, reason: "cap", beats: 12, worstSignal: "lvEdp", worstDelta: 0.03, actualSeconds: 45 };
    const details: WarningDetail[] = [
      { category: "sweepSettleCap", scope: "sweep-point", message: "-900 mL: sweep point did not fully settle", settle: capSettle },
      { category: "baseSettle", scope: "base-map", message: "base map: did not fully settle", settle: capSettle },
      { category: "health", scope: "sweep-point", message: "-900 mL: health warning", healthStatus: "warning" },
      { category: "retargetFallback", scope: "sweep-point", message: "+300 mL: warm retarget fallback" },
    ];
    expect(warningBreakdownFromDetails(details)).toMatchObject({
      baseSettle: 1,
      sweepSettleCap: 1,
      sweepSettleOther: 0,
      health: 1,
      retargetFallback: 1,
    });
  });

  it("renders synthetic warning, fallback, and error details", () => {
    const synthetic = syntheticReport();
    const markdown = guytonStarlingValidationReportToMarkdown(synthetic);
    expect(markdown).toContain("warning alpha");
    expect(markdown).toContain("parallel fallback: child unavailable");
    expect(markdown).toContain("errors: sweep failed");
    expect(markdown).toContain("lvEdp");
    expect(markdown).toContain("45.0");
    expect(markdown).toContain("Browser Worker Timing");
    expect(markdown).toContain("workerCreateMs");
  });
});

function expectFiniteNonNegative(value: number | undefined): void {
  expect(typeof value).toBe("number");
  expect(Number.isFinite(value)).toBe(true);
  expect(value ?? -1).toBeGreaterThanOrEqual(0);
}

function syntheticReport(): GuytonStarlingValidationReport {
  const okSettle: SettleStatus = { settled: true, reason: "converged", beats: 8, worstSignal: null, worstDelta: 0, actualSeconds: 6 };
  const capSettle: SettleStatus = { settled: false, reason: "cap", beats: 56, worstSignal: "lvEdp", worstDelta: 0.031, actualSeconds: 45 };
  const okHealth = syntheticHealth("ok");
  const warningHealth = syntheticHealth("warning", ["CO mismatch"]);
  const warningDetails: WarningDetail[] = [
    {
      category: "sweepSettleCap",
      scope: "sweep-point",
      message: "-900 mL: sweep point did not fully settle",
      deltaVolumeMl: -900,
      targetVolumeMl: 4700,
      settle: capSettle,
      healthStatus: "warning",
      healthMessages: ["CO mismatch"],
    },
    {
      category: "health",
      scope: "sweep-point",
      message: "-900 mL: health warning",
      deltaVolumeMl: -900,
      targetVolumeMl: 4700,
      settle: capSettle,
      healthStatus: "warning",
      healthMessages: ["CO mismatch"],
    },
    {
      category: "parallelFallback",
      scope: "parallel",
      message: "parallel chain fallback: child unavailable",
    },
  ];
  return {
    schemaVersion: 4,
    generatedAt: "2026-06-09T00:00:00.000Z",
    summary: {
      scenarioCount: 1,
      warningCount: 1,
      errorCount: 1,
      maxAbsPumpResidualLMin: 0.7,
      maxAbsReturnResidualLMin: 0.2,
      maxFinalSweepMs: 1200,
      measurementMode: "in-process-inline-chain",
      warningBreakdown: warningBreakdownFromDetails(warningDetails),
      calibratedVsFull7: {
        medianCalibratedFinalMs: 900,
        medianFull7FinalMs: 1600,
        medianLatencyDeltaMs: -700,
        maxHoldoutFlowErrorLMin: 0.2,
        fallbackScenarioCount: 0,
      },
      queueCancellation: {
        requestCount: 5,
        droppedQueuedRequests: 3,
        cancelledActiveRequests: 1,
        postedFinalResponses: 1,
        latestSignature: "burst-signature-4",
      },
      timingBreakdown: {
        baselineMs: { maxMs: 10, medianMs: 10 },
        baseMapMs: { maxMs: 2, medianMs: 2 },
        sweepOnlyMs: { maxMs: 900, medianMs: 900 },
        finalFromStartMs: { maxMs: 1200, medianMs: 1200 },
      },
    },
    scenarios: [{
      scenarioId: "synthetic",
      label: "Synthetic",
      targetVolumeMl: 5600,
      measurementMode: "in-process-inline-chain",
      baseline: {
        source: "cold",
        wallMs: 10,
        settle: okSettle,
        health: okHealth,
        metrics: {
          RAPMean: 3,
          LAPMean: 6,
          CO_R: 5.1,
          CO_L: 5.2,
          systemicVenousReturnLMin: 5.1,
          pulmonaryVenousReturnLMin: 5.2,
        },
      },
      baseMapTiming: { baselineMs: 10, baseMapMs: 2, totalMs: 12, baselineSource: "cold" },
      sweepTiming: {
        positiveChainMs: 400,
        negativeChainMs: 450,
        assembleMs: 1,
        totalMs: 900,
        retargetFallbackCount: 0,
        parallel: false,
        parallelFallback: "child unavailable",
        chainWallMs: 0,
        plannedPointCount: 7,
        mode: "calibrated",
        anchorCount: 4,
      },
      full7SweepTiming: {
        positiveChainMs: 800,
        negativeChainMs: 850,
        assembleMs: 1,
        totalMs: 1600,
        retargetFallbackCount: 0,
        parallel: false,
        chainWallMs: 0,
        plannedPointCount: 7,
        mode: "full7",
        anchorCount: 7,
      },
      progressTiming: {
        firstProgressMs: 12,
        firstFitProgressMs: 300,
        finalSweepMs: 900,
        progressEvents: [],
      },
      browserTiming: {
        workerCreateMs: 3,
        baseMapMs: 20,
        firstProgressMs: 30,
        firstFitMs: 70,
        finalSweepMs: 1100,
        totalMs: 1101,
      },
      timingBreakdown: {
        baselineMs: 10,
        baseMapMs: 2,
        sweepOnlyMs: 900,
        finalFromStartMs: 1200,
      },
      baselineDiagnostics: {
        targetVolumeMl: 5600,
        wallMs: 10,
        source: "cold",
        settle: okSettle,
        health: okHealth,
      },
      sweepPointDiagnostics: [{
        deltaVolumeMl: -900,
        targetVolumeMl: 4700,
        chain: "negative",
        arrivalOrder: 1,
        wallMs: 200,
        source: "warm-retarget",
        retarget: undefined,
        retargetFallback: false,
        settle: capSettle,
        health: warningHealth,
      }],
      warningDetails,
      warningBreakdown: warningBreakdownFromDetails(warningDetails),
      calibrationComparison: {
        calibratedPointCount: 4,
        full7PointCount: 7,
        calibratedFinalMs: 900,
        full7FinalMs: 1600,
        latencyDeltaMs: -700,
        rightHoldoutMaxFlowErrorLMin: 0.2,
        leftHoldoutMaxFlowErrorLMin: 0.1,
        maxHoldoutFlowErrorLMin: 0.2,
        fallbackReasons: [],
      },
      right: syntheticSide(),
      left: syntheticSide(),
      warnings: ["warning alpha"],
      errors: ["sweep failed"],
    }],
  } as GuytonStarlingValidationReport;
}

function syntheticHealth(status: SimulationHealth["status"], messages: string[] = []): SimulationHealth {
  return {
    status,
    tbvDriftMl: 0,
    tbvDriftPercent: 0,
    leftRightFlowMismatchLMin: 0,
    cycleMetricDelta: 0,
    clampHitCount: 0,
    numericalStability: "ok",
    massConservation: "ok",
    flowBalance: status,
    physiologicalRange: "ok",
    messages,
  };
}

function syntheticSide() {
  return {
    residualPumpLMin: 0.7,
    residualPumpFraction: 0.13,
    residualReturnLMin: 0.2,
    residualReturnFraction: 0.04,
    residualPumpExceedsThreshold: true,
    residualReturnExceedsThreshold: false,
    pressureMmHg: 5,
    flowLMin: 5.1,
    returnFlowLMin: 5,
    sweep: {
      pointCount: 7,
      settledPointCount: 7,
      warningCount: 1,
      fitSourcePointCount: 7,
      fitPointCount: 96,
      extrapolatedLeftCount: 48,
      extrapolatedRightCount: 48,
      reliablePointCount: 7,
      stressPointCount: 0,
      invalidPointCount: 0,
    },
  };
}
