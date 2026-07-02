import { describe, expect, it } from "vitest";
import {
  runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1,
  type FourChamberSmoothReservoirAssembledNumericsReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirAssembledNumericsReviewBench";

describe("FourChamberSmoothReservoirAssembledNumericsReviewBench V1", () => {
  let report: FourChamberSmoothReservoirAssembledNumericsReviewReportV1;

  it("keeps the selected smooth scaffold mixed on assembled reservoir numerics", () => {
    report = runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1();
    expect(report.decision.assembledNumericsStatus).toBe("assembled-source-reservoir-numerics-mixed");
    expect(report.summary.dynamicsReviewPass).toBe(true);
    expect(report.summary.effectiveEnvelopePass).toBe(true);
    expect(report.summary.hardLimiterFree).toBe(true);
    expect(report.summary.feedbackDissipative).toBe(true);
  });

  it("localizes dt-half reservoir magnitude non-parity to preload-low", () => {
    report ??= runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1();
    expect(report.summary.dtHalfReservoirParityPassCount).toBe(6);
    expect(report.summary.dtHalfReservoirParityFailedProfiles).toEqual(["preload-low"]);
    const preloadLow = report.profileParity.find((profile) => profile.profileId === "preload-low");
    expect(preloadLow?.dtHalfReservoirParityOk).toBe(false);
    expect(preloadLow?.dtHalfMaxReservoirDeltaMl).toBeGreaterThan(15);
  });

  it("keeps raw source-owned residuals separated from reservoir numerics claims", () => {
    report ??= runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1();
    expect(report.summary.sourceOwnedRawResidualProfiles).toEqual([
      "preload-low",
      "afterload-high",
      "contractility-low",
    ]);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });
});
