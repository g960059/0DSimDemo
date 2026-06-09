import { beforeAll, describe, expect, it } from "vitest";
import {
  guytonStarlingValidationReportToMarkdown,
  guytonStarlingValidationScenarios,
  runGuytonStarlingValidation,
  type GuytonStarlingValidationReport,
} from "@/engine/guytonStarlingValidation";

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
    expect(defaultReport.schemaVersion).toBe(1);
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
    expect(result.progressTiming.firstFitProgressMs ?? 0).toBeGreaterThanOrEqual(result.progressTiming.firstProgressMs ?? Infinity);
    expect(result.progressTiming.finalSweepMs ?? 0).toBeGreaterThanOrEqual(result.progressTiming.firstFitProgressMs ?? Infinity);
    expect(result.right.sweep.pointCount).toBe(7);
    expect(result.left.sweep.pointCount).toBe(7);
    expect(result.right.sweep.fitSourcePointCount).toBeGreaterThanOrEqual(3);
    expect(result.left.sweep.fitSourcePointCount).toBeGreaterThanOrEqual(3);
    expect(Number.isFinite(result.right.residualPumpLMin)).toBe(true);
    expect(Number.isFinite(result.left.residualPumpLMin)).toBe(true);
    expect(Number.isFinite(result.right.residualReturnLMin)).toBe(true);
    expect(Number.isFinite(result.left.residualReturnLMin)).toBe(true);
  });

  it("keeps the report schema stable", () => {
    expect(Object.keys(defaultReport).sort()).toEqual([
      "generatedAt",
      "scenarios",
      "schemaVersion",
      "summary",
    ]);
    expect(Object.keys(defaultReport.summary).sort()).toEqual([
      "errorCount",
      "maxAbsPumpResidualLMin",
      "maxAbsReturnResidualLMin",
      "maxFinalSweepMs",
      "measurementMode",
      "scenarioCount",
      "warningCount",
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
  });

  it("renders synthetic warning, fallback, and error details", () => {
    const synthetic = syntheticReport();
    const markdown = guytonStarlingValidationReportToMarkdown(synthetic);
    expect(markdown).toContain("warning alpha");
    expect(markdown).toContain("parallel fallback: child unavailable");
    expect(markdown).toContain("errors: sweep failed");
  });
});

function expectFiniteNonNegative(value: number | undefined): void {
  expect(typeof value).toBe("number");
  expect(Number.isFinite(value)).toBe(true);
  expect(value ?? -1).toBeGreaterThanOrEqual(0);
}

function syntheticReport(): GuytonStarlingValidationReport {
  return {
    schemaVersion: 1,
    generatedAt: "2026-06-09T00:00:00.000Z",
    summary: {
      scenarioCount: 1,
      warningCount: 1,
      errorCount: 1,
      maxAbsPumpResidualLMin: 0.7,
      maxAbsReturnResidualLMin: 0.2,
      maxFinalSweepMs: 1200,
      measurementMode: "in-process-inline-chain",
    },
    scenarios: [{
      scenarioId: "synthetic",
      label: "Synthetic",
      targetVolumeMl: 5600,
      measurementMode: "in-process-inline-chain",
      baseline: {
        source: "cold",
        wallMs: 10,
        settle: { settled: true, reason: "converged", beats: 8, worstSignal: null, worstDelta: 0 },
        health: {
          status: "ok",
          tbvDriftMl: 0,
          tbvDriftPercent: 0,
          leftRightFlowMismatchLMin: 0,
          cycleMetricDelta: 0,
          clampHitCount: 0,
          numericalStability: "ok",
          massConservation: "ok",
          flowBalance: "ok",
          physiologicalRange: "ok",
          messages: [],
        },
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
      },
      progressTiming: {
        firstProgressMs: 12,
        firstFitProgressMs: 300,
        finalSweepMs: 900,
        progressEvents: [],
      },
      right: syntheticSide(),
      left: syntheticSide(),
      warnings: ["warning alpha"],
      errors: ["sweep failed"],
    }],
  } as GuytonStarlingValidationReport;
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
    },
  };
}
