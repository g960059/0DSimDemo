import { describe, expect, it } from "vitest";
import {
  runPreloadLowDtHalfReservoirParityAttributionBenchV1,
  type PreloadLowDtHalfReservoirParityAttributionReportV1,
} from "@/engine/mechanics2/benches/PreloadLowDtHalfReservoirParityAttributionBench";
import preloadLowDtHalfReservoirParityReport
  from "@/data/mechanics2/reports/preload-low-dthalf-reservoir-parity-attribution-report-v1.json";

describe("PreloadLowDtHalfReservoirParityAttributionBench V1", () => {
  let report: PreloadLowDtHalfReservoirParityAttributionReportV1;

  it("classifies the preload-low dt-half reservoir parity residual", () => {
    report = runPreloadLowDtHalfReservoirParityAttributionBenchV1();
    expect(report.decision.attributionStatus).toBe("preload-low-dthalf-reservoir-parity-classified");
    expect(report.attribution.owner).toBe("source-surface-dt-input-not-reservoir-feedback");
    expect(report.preloadLowParity.dtHalfMaxReservoirDeltaMl).toBeGreaterThan(15);
  });

  it("keeps reservoir feedback and limiter inactive on the compared points", () => {
    report ??= runPreloadLowDtHalfReservoirParityAttributionBenchV1();
    expect(report.preloadLowParity.nominalFeedbackDutyFraction).toBe(0);
    expect(report.preloadLowParity.dtHalfFeedbackDutyFraction).toBe(0);
    expect(report.preloadLowParity.nominalHardLimiterDutyFraction).toBe(0);
    expect(report.preloadLowParity.dtHalfHardLimiterDutyFraction).toBe(0);
    expect(report.preloadLowParity.dtHalfSourceOwnedRawResidual).toBe(true);
  });

  it("does not unlock runtime, reservoir retuning, AV-plane, or LandAtrial", () => {
    report ??= runPreloadLowDtHalfReservoirParityAttributionBenchV1();
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.reservoirRetuning).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed attribution artifact aligned with the rerun report", () => {
    report ??= runPreloadLowDtHalfReservoirParityAttributionBenchV1();
    expect(preloadLowDtHalfReservoirParityReport.reportId).toBe(report.reportId);
    expect(preloadLowDtHalfReservoirParityReport.preloadLowParity).toEqual(report.preloadLowParity);
    expect(preloadLowDtHalfReservoirParityReport.attribution).toEqual(report.attribution);
    expect(preloadLowDtHalfReservoirParityReport.decision).toEqual(report.decision);
  });
});
