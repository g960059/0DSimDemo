import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaMvAssembledTransactionSurfaceBenchV1,
  type LaMvAssembledTransactionSurfaceReportV1,
} from "@/engine/mechanics2/benches/LaMvAssembledTransactionSurfaceBench";
import assembledReport
  from "@/data/mechanics2/reports/la-mv-assembled-transaction-surface-report-v1.json";

describe("LaMvAssembledTransactionSurfaceBench V1", () => {
  let report: LaMvAssembledTransactionSurfaceReportV1;

  beforeAll(() => {
    report = runLaMvAssembledTransactionSurfaceBenchV1();
  }, 600_000);

  it("records the assembled LA/MV transaction surface as mixed but not promotable", () => {
    expect(report.decision.laMvAssembledTransactionSurfaceStatus)
      .toBe("la-mv-assembled-transaction-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "fiber-total-fixed-pressure-fp2-reference",
      bestSourceSurfacePass: 0,
      bestContractPass: 0,
      bestLaPvLobeQualityPass: 1,
      bestMvfCleanCount: 3,
      bestTransactionConvergenceCount: 0,
    });
  });

  it("shows fixed-point pulmonary compliance lowers residuals without solving morphology", () => {
    const fixedPressure = report.variantSummaries.find((variant) =>
      variant.variantId === "fiber-total-fixed-pressure-fp2-reference"
    );
    const highIterationCompliance = report.variantSummaries.find((variant) =>
      variant.variantId === "fiber-total-pv-compliance-fp10-relax025"
    );
    expect(fixedPressure?.maxTransactionResidualNormMl).toBe(1.032004);
    expect(highIterationCompliance?.maxTransactionResidualNormMl).toBe(0.14344);
    expect(highIterationCompliance?.contractPass).toBe(0);
    expect(highIterationCompliance?.laPvLobeQualityPass).toBe(0);
    expect(highIterationCompliance?.mvfCleanCount).toBe(3);
  });

  it("keeps runtime, AV-plane, a-prime, and LandAtrial claims blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-geometry",
      "a-prime-readback",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.aPrimeReadback).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed assembled transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(assembledReport, report);
  });
});
