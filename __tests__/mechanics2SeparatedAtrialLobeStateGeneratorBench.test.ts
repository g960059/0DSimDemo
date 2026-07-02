import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runSeparatedAtrialLobeStateGeneratorBenchV1,
  type SeparatedAtrialLobeStateGeneratorReportV1,
} from "@/engine/mechanics2/benches/SeparatedAtrialLobeStateGeneratorBench";
import separatedStateReport
  from "@/data/mechanics2/reports/separated-atrial-lobe-state-generator-report-v1.json";

describe("SeparatedAtrialLobeStateGeneratorBench V1", () => {
  let report: SeparatedAtrialLobeStateGeneratorReportV1;

  beforeAll(() => {
    report = runSeparatedAtrialLobeStateGeneratorBenchV1();
  }, 600_000);

  it("records a mixed separated reservoir/booster state signal without lobe promotion", () => {
    expect(report.decision.separatedAtrialLobeStateGeneratorStatus)
      .toBe("separated-atrial-lobe-state-generator-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "reservoir-booster-r1-b1",
      bestSourceSurfacePass: 4,
      bestContractPass: 2,
      bestLaPvLobeQualityPass: 2,
      bestMvfCleanCount: 4,
      bestOpposedLobeCount: 2,
      maxSourceSurfacePass: 5,
      maxSourceSurfaceVariantId: "reservoir-booster-r3-b2",
      maxLobeQualityPass: 2,
      maxLobeQualityVariantId: "reservoir-booster-r1-b1",
    });
  });

  it("shows stronger reservoir/booster states improve source surface before solving lobe quality", () => {
    const stronger = report.variantSummaries.find((variant) =>
      variant.variantId === "reservoir-booster-r3-b2"
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
      minReservoirPressureMmHg: -2.558099,
      maxBoosterPressureMmHg: 1.500405,
    });
  });

  it("keeps geometry/a-prime as a readback-only side path", () => {
    const geometry = report.variantSummaries.find((variant) =>
      variant.variantId === "reservoir-booster-geometry-b2"
    );
    expect(geometry).toMatchObject({
      sourceSurfacePass: 4,
      contractPass: 1,
      laPvLobeQualityPass: 1,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
    });
  });

  it("keeps runtime, pressure substitution, morphology, AV-plane, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "atrial-pressure-substitution",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed separated atrial lobe state artifact aligned", () => {
    expectMechanics2ReportArtifactParity(separatedStateReport, report);
  });
});
