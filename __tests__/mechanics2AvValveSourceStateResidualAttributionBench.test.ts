import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAvValveSourceStateResidualAttributionBenchV1,
  type AvValveSourceStateResidualAttributionReportV1,
} from "@/engine/mechanics2/benches/AvValveSourceStateResidualAttributionBench";
import attributionReport
  from "@/data/mechanics2/reports/av-valve-source-state-residual-attribution-report-v1.json";

describe("AvValveSourceStateResidualAttributionBench V1", () => {
  let report: AvValveSourceStateResidualAttributionReportV1;

  beforeAll(() => {
    report = runAvValveSourceStateResidualAttributionBenchV1();
  }, 600_000);

  it("attributes fixed source-state replay residuals to baseline valve replay ownership", () => {
    expect(report.upstreamSourceStateShadow).toMatchObject({
      observedStatus: "av-valve-source-state-contract-shadow-mixed",
      bestFixedVariantId: "source-open-memory",
      bestFixedPass: 1,
      bestFixedCleanShapeCount: 6,
    });
    expect(report.decision.avValveSourceStateResidualAttributionStatus)
      .toBe("av-valve-source-state-residual-attribution-complete");
    expect(report.summary).toMatchObject({
      total: 14,
      sourceStateRescuedCount: 1,
      baselineValveReplayResidualCount: 13,
      sourceStateNewRegressionCount: 0,
      sourceStatePartialImprovementCount: 0,
      mvAdverseGradientForwardFlowCount: 4,
      mvForwardVolumeOrPeakResidualCount: 2,
      tvC1ForwardVolumeUnderfillCount: 7,
    });
  });

  it("records the single rescued row and keeps TV residuals as replay-contract failures", () => {
    const rescued = report.rows.filter((row) => row.residualOwner === "source-state-rescued");
    expect(rescued).toHaveLength(1);
    expect(rescued[0]).toMatchObject({
      profileId: "preload-low",
      valveSide: "MV",
      residualClass: "source-state-rescued",
    });
    const tvRows = report.rows.filter((row) => row.valveSide === "TV");
    expect(tvRows).toHaveLength(7);
    expect(tvRows.every((row) =>
      row.residualOwner === "baseline-valve-replay-residual"
      && row.residualClass === "tv-c1-forward-volume-underfill"
    )).toBe(true);
  });

  it("blocks more fixed source-state sweeps and all promotion claims", () => {
    expect(report.decision.blockedClaims).toContain("more-fixed-source-state-variant-sweep");
    expect(report.claimBoundary.moreFixedSourceStateVariantSweep).toBe(false);
    expect(report.claimBoundary.sourcePressureCommit).toBe(false);
    expect(report.claimBoundary.sourceGradientCommit).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed source-state residual attribution artifact aligned", () => {
    expectMechanics2ReportArtifactParity(attributionReport, report);
  });
});
