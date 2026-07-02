import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAVPlaneReservoirCapacityTransactionBenchV1,
  type AVPlaneReservoirCapacityTransactionReportV1,
} from "@/engine/mechanics2/benches/AVPlaneReservoirCapacityTransactionBench";
import avPlaneReservoirCapacityTransactionReport
  from "@/data/mechanics2/reports/av-plane-reservoir-capacity-transaction-report-v1.json";

describe("AVPlaneReservoirCapacityTransactionBench V1", () => {
  let report: AVPlaneReservoirCapacityTransactionReportV1;

  beforeAll(() => {
    report = runAVPlaneReservoirCapacityTransactionBenchV1();
  }, 600_000);

  it("records a mixed AV-plane reservoir geometry/work signal without lobe promotion", () => {
    expect(report.decision.avPlaneReservoirCapacityTransactionStatus)
      .toBe("av-plane-reservoir-capacity-transaction-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "stretch-gain16-boost04-work2-eject60-fast-release",
      bestSourceSurfacePass: 4,
      bestContractPass: 1,
      bestLaPvLobeQualityPass: 1,
      bestDtHalfContractPass: 1,
      bestMvfCleanCount: 4,
      bestOpposedLobeCount: 1,
      baselineSourceSurfacePass: 3,
      sourceSurfaceImprovementOverBaseline: 1,
      maxSourceSurfacePass: 4,
      maxSourceSurfaceVariantId: "stretch-gain16-boost04-work2-eject60-fast-release",
      maxLobeQualityPass: 1,
      maxLobeQualityVariantId: "stretch-gain16-boost04-work2-eject60-fast-release",
      maxDtHalfContractPass: 1,
      maxDtHalfContractVariantId: "fiber-pressure-no-capacity-state",
      dominantLobeFailureCounts: {
        pass: 5,
        "missing-self-intersection": 19,
        "same-signed-lobes": 135,
        "small-a-loop": 0,
        "small-v-loop": 2,
        "volume-order-fail": 0,
      },
    });
  });

  it("keeps the best wall-work variant bounded but still lobe-quality failed", () => {
    expect(report.bestVariant).toMatchObject({
      variantId: "stretch-gain16-boost04-work2-eject60-fast-release",
      sourceSurfacePass: 4,
      contractPass: 1,
      laPvLobeQualityPass: 1,
      dtHalfSourceSurfacePass: 4,
      dtHalfContractPass: 1,
      dtHalfLobeQualityPass: 1,
      mvfCleanCount: 4,
      mvForwardVolumeParityCount: 7,
      aovOutputParityCount: 7,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      opposedLobeCount: 1,
      dtHalfOpposedLobeCount: 1,
      maxAPrimePeakAbsCmPerSec: 6.73391,
      maxSPrimePeakAbsCmPerSec: 31.182741,
      maxCapacityGeometryDeltaMl: 12.715568,
      maxVisibleLaVolumeDeltaMl: 12.55978,
    });
  });

  it("keeps runtime, pressure substitution, morphology, AV-plane, blood-ledger, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "atrial-pressure-substitution",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "blood-ledger-mutation",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.bloodLedgerMutation).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed AV-plane reservoir capacity transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(avPlaneReservoirCapacityTransactionReport, report);
  });
});
