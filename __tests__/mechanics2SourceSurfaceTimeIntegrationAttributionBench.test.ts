import { beforeAll, describe, expect, it } from "vitest";
import {
  runSourceSurfaceTimeIntegrationAttributionBenchV1,
  type SourceSurfaceTimeIntegrationAttributionReportV1,
} from "@/engine/mechanics2/benches/SourceSurfaceTimeIntegrationAttributionBench";
import timeIntegrationAttributionReport from "@/data/mechanics2/reports/source-surface-time-integration-attribution-report-v1.json";

describe("MechanicsCore2 source-surface time-integration attribution bench", () => {
  let report: SourceSurfaceTimeIntegrationAttributionReportV1;

  beforeAll(() => {
    report = runSourceSurfaceTimeIntegrationAttributionBenchV1();
  }, 90_000);

  it("classifies the remaining source-surface residuals into separate owners", () => {
    expect(report.decision.attributionStatus).toBe("source-time-integration-attribution-classified");
    expect(report.summary).toEqual({
      residualPointCount: 4,
      passCount: 1,
      failCount: 3,
      shapeDtParityCount: 1,
      outputReserveCount: 1,
      repeatabilityBeforeDtOutputCount: 1,
      cleanPhenotypeCount: 1,
    });

    expect(report.residualPoints.map((point) => `${point.pointId}:${point.attribution}:${point.nextOwner}`)).toEqual([
      "left-heart-preload-low:shape-dt-parity:source-shape-time-integration",
      "left-heart-afterload-high:output-reserve:source-output-reserve-calibration",
      "right-heart-preload-low:repeatability-before-dt-output:source-settling-repeatability",
      "right-heart-contractility-low:clean-phenotype:phenotype-policy",
    ]);

    const leftPreloadLow = report.residualPoints.find((point) => point.pointId === "left-heart-preload-low")!;
    expect(leftPreloadLow.evidence.dtShapeDelta).toBeGreaterThan(0.18);
    expect(leftPreloadLow.evidence.dtOutputDeltaMl).toBeLessThan(2);

    const rightPreloadLow = report.residualPoints.find((point) => point.pointId === "right-heart-preload-low")!;
    expect(rightPreloadLow.failureReasons).toEqual([
      "beat-repeatability-failed",
      "dt-half-output-parity-failed",
    ]);
    expect(rightPreloadLow.evidence.repeatabilityOutputDeltaMl).toBeGreaterThan(16);
    expect(rightPreloadLow.evidence.dtShapeDelta).toBeLessThan(0.05);

    expect(report.claimBoundary.reservoirTuningReopened).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed time-integration attribution artifact aligned with the rerun summary", () => {
    expect(timeIntegrationAttributionReport.reportId).toBe(report.reportId);
    expect(timeIntegrationAttributionReport.summary).toEqual(report.summary);
    expect(timeIntegrationAttributionReport.decision).toEqual(report.decision);
    expect(timeIntegrationAttributionReport.residualPoints.map((point) => point.attribution)).toEqual(
      report.residualPoints.map((point) => point.attribution),
    );
    expect(typeof timeIntegrationAttributionReport.normalizedSha256).toBe("string");
    expect(timeIntegrationAttributionReport.normalizedSha256).toHaveLength(64);
  });
});
