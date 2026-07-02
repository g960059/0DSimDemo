import { beforeAll, describe, expect, it } from "vitest";
import {
  runSourceSurfaceSamplingParityBenchV1,
  type SourceSurfaceSamplingParityReportV1,
} from "@/engine/mechanics2/benches/SourceSurfaceSamplingParityBench";
import samplingParityReport from "@/data/mechanics2/reports/source-surface-sampling-parity-report-v1.json";

describe("MechanicsCore2 source-surface sampling parity bench", () => {
  let report: SourceSurfaceSamplingParityReportV1;

  beforeAll(() => {
    report = runSourceSurfaceSamplingParityBenchV1();
  }, 90_000);

  it("classifies the left preload-low shape residual as sampling-grid parity", () => {
    expect(report.decision.samplingParityStatus).toBe("sampling-parity-shape-owner-found");
    expect(report.summary).toEqual({
      pointCount: 3,
      samplingGridExplainsShapeResidualCount: 1,
      samplingGridNotOwnerCount: 2,
      remainingOutputReserveCount: 1,
      remainingRepeatabilityCount: 1,
    });

    const leftPreloadLow = report.points.find((point) => point.pointId === "left-heart-preload-low")!;
    expect(leftPreloadLow.samplingAttribution).toBe("sampling-grid-explains-shape-residual");
    expect(leftPreloadLow.rawDtHalfDelta).toBeGreaterThan(0.18);
    expect(leftPreloadLow.alignedDtHalfDelta).toBeLessThan(0.03);
    expect(leftPreloadLow.rawDtHalfPeakCount).toBe(1);
    expect(leftPreloadLow.alignedDtHalfPeakCount).toBe(1);

    const rightPreloadLow = report.points.find((point) => point.pointId === "right-heart-preload-low")!;
    expect(rightPreloadLow.samplingAttribution).toBe("sampling-grid-not-owner");
    expect(rightPreloadLow.forwardEjectionDeltaMl).toBeGreaterThan(10);
    expect(rightPreloadLow.repeatabilityDeltaMl).toBeGreaterThan(16);

    expect(report.claimBoundary.reservoirTuningReopened).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed sampling parity artifact aligned with the rerun summary", () => {
    expect(samplingParityReport.reportId).toBe(report.reportId);
    expect(samplingParityReport.summary).toEqual(report.summary);
    expect(samplingParityReport.decision).toEqual(report.decision);
    expect(samplingParityReport.points.map((point) => point.samplingAttribution)).toEqual(
      report.points.map((point) => point.samplingAttribution),
    );
    expect(typeof samplingParityReport.normalizedSha256).toBe("string");
    expect(samplingParityReport.normalizedSha256).toHaveLength(64);
  });
});
