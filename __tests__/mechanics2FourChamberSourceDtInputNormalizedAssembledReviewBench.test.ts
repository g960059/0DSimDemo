import { describe, expect, it } from "vitest";
import {
  runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1,
  type FourChamberSourceDtInputNormalizedAssembledReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceDtInputNormalizedAssembledReviewBench";
import sourceDtInputNormalizedAssembledReport
  from "@/data/mechanics2/reports/four-chamber-source-dt-input-normalized-assembled-review-report-v1.json";

describe("FourChamberSourceDtInputNormalizedAssembledReviewBench V1", () => {
  let report: FourChamberSourceDtInputNormalizedAssembledReviewReportV1;

  it("restores assembled dt-half reservoir parity without claiming raw source success", () => {
    report = runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1();
    expect(report.decision.sourceDtInputNormalizedAssembledStatus)
      .toBe("source-dt-input-normalized-assembled-review-signal");
    expect(report.summary.effectiveEnvelopePassCount).toBe(21);
    expect(report.summary.dtHalfReservoirParityPassCount).toBe(7);
    expect(report.summary.dtHalfReservoirParityFailedProfiles).toEqual([]);
    expect(report.summary.rawDtHalfFailureProfiles).toEqual([
      "preload-low",
      "afterload-high",
      "contractility-low",
    ]);
    expect(report.summary.effectiveDtHalfFailureProfiles).toEqual([]);
    expect(report.summary.normalizedLedgerStatusesCleanCount).toBe(7);
    expect(report.summary.hardLimiterFree).toBe(true);
  });

  it("computes effective status from the normalized run instead of reusing the old point", () => {
    report ??= runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1();
    const dtHalfFailures = report.profileParity.filter((profile) => profile.dtHalfRawStatus !== "pass");
    expect(dtHalfFailures.map((profile) => profile.profileId)).toEqual([
      "preload-low",
      "afterload-high",
      "contractility-low",
    ]);
    expect(dtHalfFailures.every((profile) => profile.dtHalfEffectiveStatus === "pass")).toBe(true);
    expect(dtHalfFailures.every((profile) => profile.dtHalfEffectiveFailureReasons.length === 0)).toBe(true);
    expect(dtHalfFailures.every((profile) => profile.dtHalfRemovedFailureReasons.length > 0)).toBe(true);
  });

  it("keeps the committed assembled artifact aligned with the rerun summary", () => {
    report ??= runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1();
    expect(sourceDtInputNormalizedAssembledReport.reportId).toBe(report.reportId);
    expect(sourceDtInputNormalizedAssembledReport.summary).toEqual(report.summary);
    expect(sourceDtInputNormalizedAssembledReport.decision).toEqual(report.decision);
  });
});
