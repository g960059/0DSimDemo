import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaMvAssembledResidualAttributionBenchV1,
  type LaMvAssembledResidualAttributionReportV1,
} from "@/engine/mechanics2/benches/LaMvAssembledResidualAttributionBench";
import attributionReport
  from "@/data/mechanics2/reports/la-mv-assembled-residual-attribution-report-v1.json";

describe("LaMvAssembledResidualAttributionBench V1", () => {
  let report: LaMvAssembledResidualAttributionReportV1;

  beforeAll(() => {
    report = runLaMvAssembledResidualAttributionBenchV1();
  }, 600_000);

  it("classifies the assembled residual as atrial geometry lobe quality before AV-plane enablement", () => {
    expect(report.decision.residualOwner)
      .toBe("atrial-geometry-lobe-quality-before-av-plane-enable");
    expect(report.summary).toMatchObject({
      totalRows: 28,
      laPvLobeFailRows: 27,
      laPvLobePassRows: 1,
      rowsWithCleanFlowVolumeAndMassButLobeFail: 14,
      rowsWithBoundedResidualButLobeFail: 14,
      rowsWithMvfFailure: 16,
      rowsWithTransactionResidualWide: 14,
      complianceResidualImprovedWithoutLobeGain: true,
    });
  });

  it("keeps AV-plane and runtime claims blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-readback",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimeReadback).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed residual attribution artifact aligned", () => {
    expectMechanics2ReportArtifactParity(attributionReport, report);
  });
});
