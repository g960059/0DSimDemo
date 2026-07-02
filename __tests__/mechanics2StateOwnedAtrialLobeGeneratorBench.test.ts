import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runStateOwnedAtrialLobeGeneratorBenchV1,
  type StateOwnedAtrialLobeGeneratorReportV1,
} from "@/engine/mechanics2/benches/StateOwnedAtrialLobeGeneratorBench";
import stateOwnedReport
  from "@/data/mechanics2/reports/state-owned-atrial-lobe-generator-report-v1.json";

describe("StateOwnedAtrialLobeGeneratorBench V1", () => {
  let report: StateOwnedAtrialLobeGeneratorReportV1;

  beforeAll(() => {
    report = runStateOwnedAtrialLobeGeneratorBenchV1();
  }, 600_000);

  it("records a mixed source-surface signal without lobe-quality promotion", () => {
    expect(report.decision.stateOwnedAtrialLobeGeneratorStatus)
      .toBe("state-owned-atrial-lobe-generator-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "fiber-pressure-reservoir-suction-p1",
      bestSourceSurfacePass: 3,
      bestContractPass: 2,
      bestLaPvLobeQualityPass: 2,
      bestMvfCleanCount: 3,
      bestOpposedLobeCount: 2,
      maxSourceSurfacePass: 5,
      maxSourceSurfaceVariantId: "fiber-pressure-reservoir-suction-p3",
    });
  });

  it("shows stronger suction improves MVF/source-surface before it solves lobe quality", () => {
    const stronger = report.variantSummaries.find((variant) =>
      variant.variantId === "fiber-pressure-reservoir-suction-p3"
    );
    expect(stronger).toMatchObject({
      sourceSurfacePass: 5,
      contractPass: 1,
      laPvLobeQualityPass: 1,
      mvfCleanCount: 5,
      mvForwardVolumeParityCount: 7,
      aovOutputParityCount: 7,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 2,
      minSuctionPressureMmHg: -2.558099,
    });
  });

  it("keeps runtime, morphology, AV-plane physiology, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed state-owned atrial lobe generator artifact aligned", () => {
    expectMechanics2ReportArtifactParity(stateOwnedReport, report);
  });
});
