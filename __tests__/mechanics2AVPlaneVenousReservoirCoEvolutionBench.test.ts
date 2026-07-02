import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAVPlaneVenousReservoirCoEvolutionBenchV1,
  type AVPlaneVenousReservoirCoEvolutionReportV1,
} from "@/engine/mechanics2/benches/AVPlaneVenousReservoirCoEvolutionBench";
import avPlaneVenousReservoirCoEvolutionReport
  from "@/data/mechanics2/reports/av-plane-venous-reservoir-coevolution-report-v1.json";

describe("AVPlaneVenousReservoirCoEvolutionBench V1", () => {
  let report: AVPlaneVenousReservoirCoEvolutionReportV1;

  beforeAll(() => {
    report = runAVPlaneVenousReservoirCoEvolutionBenchV1();
  }, 600_000);

  it("records a mixed explicit venous-reservoir signal without lobe promotion", () => {
    expect(report.decision.avPlaneVenousReservoirCoEvolutionStatus)
      .toBe("av-plane-venous-reservoir-coevolution-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "venous-capacity-gain32-flow060",
      bestSourceSurfacePass: 5,
      bestContractPass: 0,
      bestLaPvLobeQualityPass: 0,
      bestDtHalfContractPass: 0,
      bestMvfCleanCount: 5,
      bestOpposedLobeCount: 0,
      baselineSourceSurfacePass: 4,
      sourceSurfaceImprovementOverBaseline: 1,
      maxSourceSurfacePass: 5,
      maxSourceSurfaceVariantId: "venous-capacity-gain32-flow060",
      maxLobeQualityPass: 0,
      maxLobeQualityVariantId: "venous-capacity-gain32-flow060",
      maxDtHalfContractPass: 0,
      maxDtHalfContractVariantId: "venous-capacity-gain24-flow060",
      dominantLobeFailureCounts: {
        pass: 0,
        "missing-self-intersection": 85,
        "same-signed-lobes": 34,
        "small-a-loop": 0,
        "small-v-loop": 0,
        "volume-order-fail": 0,
      },
    });
  });

  it("keeps the best explicit venous reservoir variant hidden-volume clean but still lobe-quality failed", () => {
    expect(report.bestVariant).toMatchObject({
      variantId: "venous-capacity-gain32-flow060",
      sourceSurfacePass: 5,
      contractPass: 0,
      laPvLobeQualityPass: 0,
      dtHalfSourceSurfacePass: 5,
      dtHalfContractPass: 0,
      dtHalfLobeQualityPass: 0,
      mvfCleanCount: 5,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      opposedLobeCount: 0,
      dtHalfOpposedLobeCount: 0,
      maxAVPlaneKinematicFlowMlPerSec: 260,
      maxAVPlaneKinematicForwardVolumeMl: 14.920589,
      maxGeometryDeltaMl: 25.301407,
      maxVisibleLaVolumeDeltaMl: 25.301407,
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

  it("keeps the committed AV-plane reservoir venous reservoir co-evolution artifact aligned", () => {
    expectMechanics2ReportArtifactParity(avPlaneVenousReservoirCoEvolutionReport, report);
  });
});
