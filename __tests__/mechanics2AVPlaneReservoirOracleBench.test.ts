import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAVPlaneReservoirOracleBenchV1,
  type AVPlaneReservoirOracleReportV1,
} from "@/engine/mechanics2/benches/AVPlaneReservoirOracleBench";
import avPlaneReservoirOracleReport
  from "@/data/mechanics2/reports/av-plane-reservoir-oracle-report-v1.json";

describe("AVPlaneReservoirOracleBench V1", () => {
  let report: AVPlaneReservoirOracleReportV1;

  beforeAll(() => {
    report = runAVPlaneReservoirOracleBenchV1();
  }, 600_000);

  it("records a mixed AV-plane reservoir lobe signal without lobe promotion", () => {
    expect(report.decision.avPlaneReservoirOracleStatus)
      .toBe("av-plane-reservoir-oracle-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "phase-reference-r12-b0-p1",
      bestSourceSurfacePass: 5,
      bestContractPass: 2,
      bestLaPvLobeQualityPass: 2,
      bestMvfCleanCount: 5,
      bestOpposedLobeCount: 2,
      maxSourceSurfacePass: 5,
      maxSourceSurfaceVariantId: "phase-reference-r12-b0-p1",
      maxLobeQualityPass: 2,
      maxLobeQualityVariantId: "phase-reference-r12-b0-p1",
      dominantLobeFailureCounts: {
        pass: 10,
        "missing-self-intersection": 10,
        "same-signed-lobes": 43,
        "small-a-loop": 0,
        "small-v-loop": 0,
        "volume-order-fail": 0,
      },
    });
  });

  it("keeps the phase reference as the best mixed surface", () => {
    const stronger = report.variantSummaries.find((variant) =>
      variant.variantId === "phase-reference-r12-b0-p1"
    );
    expect(stronger).toMatchObject({
      sourceSurfacePass: 5,
      contractPass: 2,
      laPvLobeQualityPass: 2,
      mvfCleanCount: 5,
      mvForwardVolumeParityCount: 7,
      aovOutputParityCount: 7,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 2,
      aPrimeReadbackPresentCount: 7,
      maxAPrimePeakAbsCmPerSec: 2.285599,
      maxSPrimePeakAbsCmPerSec: 7.798918,
      minReservoirPressureMmHg: -0.8527,
      maxReservoirGeometryDeltaMl: 10.232395,
      maxBoosterPressureMmHg: 0.750203,
      maxBoosterGeometryDeltaMl: 0,
    });
  });

  it("shows AV-plane ejection-rate reservoir drive preserves source surface but does not fix lobe direction", () => {
    const oracle = report.variantSummaries.find((variant) =>
      variant.variantId === "avplane-eject60-r12-b0-p1"
    );
    expect(oracle).toMatchObject({
      sourceSurfacePass: 5,
      contractPass: 1,
      laPvLobeQualityPass: 1,
      mvfCleanCount: 5,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      opposedLobeCount: 1,
      maxAPrimePeakAbsCmPerSec: 0.773024,
      maxSPrimePeakAbsCmPerSec: 16.533384,
      maxReservoirGeometryDeltaMl: 8.052262,
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

  it("keeps the committed AV-plane reservoir atrial lobe artifact aligned", () => {
    expectMechanics2ReportArtifactParity(avPlaneReservoirOracleReport, report);
  });
});
