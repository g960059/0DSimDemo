import { describe, expect, it } from "vitest";
import {
  runPreloadLowSourceDtInputNormalizationBenchV1,
  type PreloadLowSourceDtInputNormalizationReportV1,
} from "@/engine/mechanics2/benches/PreloadLowSourceDtInputNormalizationBench";
import preloadLowSourceDtInputNormalizationReport
  from "@/data/mechanics2/reports/preload-low-source-dt-input-normalization-report-v1.json";

describe("PreloadLowSourceDtInputNormalizationBench V1", () => {
  let report: PreloadLowSourceDtInputNormalizationReportV1;

  it("classifies source-ledger input normalization as the localized preload-low dt signal", () => {
    report = runPreloadLowSourceDtInputNormalizationBenchV1();
    expect(report.decision.sourceDtInputNormalizationStatus).toBe("source-dt-input-normalization-signal");
    expect(report.summary.rawDtHalfDeltaMl).toBeGreaterThan(15);
    expect(report.summary.normalizedDtHalfDeltaMl).toBe(0);
    expect(report.summary.normalizedLedgerStatusesClean).toBe(true);
    expect(report.summary.statusRateFailuresPreserved).toBe(true);
  });

  it("does not rely on reservoir feedback or hard limiter on the compared preload-low points", () => {
    report ??= runPreloadLowSourceDtInputNormalizationBenchV1();
    expect(report.summary.rawDtHalfFeedbackDutyFraction).toBe(0);
    expect(report.summary.normalizedDtHalfFeedbackDutyFraction).toBe(0);
    expect(report.summary.rawDtHalfHardLimiterDutyFraction).toBe(0);
    expect(report.summary.normalizedDtHalfHardLimiterDutyFraction).toBe(0);
  });

  it("keeps the committed artifact aligned with the rerun summary", () => {
    report ??= runPreloadLowSourceDtInputNormalizationBenchV1();
    expect(preloadLowSourceDtInputNormalizationReport.reportId).toBe(report.reportId);
    expect(preloadLowSourceDtInputNormalizationReport.summary).toEqual(report.summary);
    expect(preloadLowSourceDtInputNormalizationReport.decision).toEqual(report.decision);
  });
});
