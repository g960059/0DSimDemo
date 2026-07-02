import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialReservoirStrainReferenceTransactionBenchV1,
  type AtrialReservoirStrainReferenceTransactionReportV1,
} from "@/engine/mechanics2/benches/AtrialReservoirStrainReferenceTransactionBench";
import atrialReservoirStrainReferenceTransactionReport
  from "@/data/mechanics2/reports/atrial-reservoir-strain-reference-transaction-report-v1.json";

describe("AtrialReservoirStrainReferenceTransactionBench V1", () => {
  let report: AtrialReservoirStrainReferenceTransactionReportV1;

  beforeAll(() => {
    report = runAtrialReservoirStrainReferenceTransactionBenchV1();
  }, 600_000);

  it("records a mixed atrial reservoir strain-reference signal without lobe promotion", () => {
    expect(report.decision.atrialReservoirStrainReferenceTransactionStatus)
      .toBe("atrial-reservoir-strain-reference-transaction-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "reference-capacity-gain64-flow060",
      bestSourceSurfacePass: 6,
      bestContractPass: 0,
      bestLaPvLobeQualityPass: 0,
      bestDtHalfContractPass: 0,
      bestMvfCleanCount: 6,
      bestOpposedLobeCount: 0,
      baselineSourceSurfacePass: 4,
      sourceSurfaceImprovementOverBaseline: 2,
      maxSourceSurfacePass: 6,
      maxSourceSurfaceVariantId: "reference-capacity-gain64-flow060",
      maxLobeQualityPass: 0,
      maxLobeQualityVariantId: "reference-capacity-gain64-flow060",
      maxDtHalfContractPass: 0,
      maxDtHalfContractVariantId: "reference-capacity-gain24-flow060",
      dominantLobeFailureCounts: {
        pass: 0,
        "missing-self-intersection": 95,
        "same-signed-lobes": 45,
        "small-a-loop": 0,
        "small-v-loop": 0,
        "volume-order-fail": 0,
      },
    });
  });

  it("keeps the best strain-reference variant hidden-volume clean but still lobe-quality failed", () => {
    expect(report.bestVariant).toMatchObject({
      variantId: "reference-capacity-gain64-flow060",
      sourceSurfacePass: 6,
      contractPass: 0,
      laPvLobeQualityPass: 0,
      dtHalfSourceSurfacePass: 5,
      dtHalfContractPass: 0,
      dtHalfLobeQualityPass: 0,
      mvfCleanCount: 6,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      opposedLobeCount: 0,
      dtHalfOpposedLobeCount: 0,
      maxAVPlaneKinematicFlowMlPerSec: 340,
      maxAVPlaneKinematicForwardVolumeMl: 24.85043,
      maxGeometryDeltaMl: 50.569594,
      maxReferenceVolumeShiftMl: 50.569594,
      maxVisibleLaVolumeDeltaMl: 0,
    });
  });

  it("keeps runtime, pressure substitution, morphology, AV-plane, hidden-volume source, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "atrial-pressure-substitution",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "hidden-blood-volume-source",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.hiddenBloodVolumeSource).toBe(false);
    expect(report.claimBoundary.explicitPulmonaryVenousReservoirFlow).toBe(true);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial reservoir strain-reference transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialReservoirStrainReferenceTransactionReport, report);
  });
});
