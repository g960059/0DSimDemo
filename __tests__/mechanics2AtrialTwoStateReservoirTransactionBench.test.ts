import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialTwoStateReservoirTransactionBenchV1,
  type AtrialTwoStateReservoirTransactionReportV1,
} from "@/engine/mechanics2/benches/AtrialTwoStateReservoirTransactionBench";
import atrialTwoStateReservoirTransactionReport
  from "@/data/mechanics2/reports/atrial-two-state-reservoir-transaction-report-v1.json";

describe("AtrialTwoStateReservoirTransactionBench V1", () => {
  let report: AtrialTwoStateReservoirTransactionReportV1;

  beforeAll(() => {
    report = runAtrialTwoStateReservoirTransactionBenchV1();
  }, 600_000);

  it("records a mixed atrial reservoir two-state closed-loop transfer", () => {
    expect(report.decision.atrialTwoStateReservoirTransactionStatus)
      .toBe("atrial-two-state-reservoir-transaction-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "compliance-node-no-avplane",
      bestSourceSurfacePass: 4,
      bestContractPass: 0,
      bestLaPvLobeQualityPass: 0,
      bestDtHalfContractPass: 0,
      bestMvfCleanCount: 4,
      bestOpposedLobeCount: 0,
      baselineSourceSurfacePass: 4,
      sourceSurfaceImprovementOverBaseline: 0,
      maxSourceSurfacePass: 4,
      maxSourceSurfaceVariantId: "compliance-node-no-avplane",
      maxLobeQualityPass: 0,
      maxLobeQualityVariantId: "compliance-node-no-avplane",
      maxDtHalfContractPass: 0,
      maxDtHalfContractVariantId: "compliance-node-no-avplane",
      baselineMaxVLoopArea: 72.784803,
      maxVLoopArea: 177.515023,
      maxVLoopAreaVariantId: "two-state-cap24-suction4-recoil24",
      maxSourcePreservingVLoopArea: 107.925198,
      maxSourcePreservingVLoopAreaVariantId: "two-state-cap32-suction3-recoil5",
      sourcePreservingVLoopAreaImprovementOverBaseline: 35.140395,
      dominantLobeFailureCounts: {
        pass: 0,
        "missing-self-intersection": 73,
        "same-signed-lobes": 32,
        "small-a-loop": 0,
        "small-v-loop": 0,
        "volume-order-fail": 0,
      },
    });
  });

  it("keeps the best two-state result hidden-volume clean but still lobe-quality failed", () => {
    expect(report.bestVariant).toMatchObject({
      variantId: "compliance-node-no-avplane",
      sourceSurfacePass: 4,
      contractPass: 0,
      laPvLobeQualityPass: 0,
      dtHalfSourceSurfacePass: 4,
      dtHalfContractPass: 0,
      dtHalfLobeQualityPass: 0,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 0,
      opposedLobeCount: 0,
      dtHalfOpposedLobeCount: 0,
      maxAVPlaneKinematicFlowMlPerSec: 0,
      maxAVPlaneKinematicForwardVolumeMl: 0,
      maxAVPlaneReservoirTractionPressureMmHg: 0,
      maxGeometryDeltaMl: 0,
      maxReferenceVolumeShiftMl: 0,
      maxVisibleLaVolumeDeltaMl: 0,
    });
  });

  it("shows active two-state candidates do not transfer the isolated traction topology signal", () => {
    const activeCandidate = report.variantSummaries.find((summary) =>
      summary.variantId === "two-state-cap32-suction3-recoil5"
    );
    expect(activeCandidate).toMatchObject({
      sourceSurfacePass: 4,
      contractPass: 0,
      laPvLobeQualityPass: 0,
      opposedLobeCount: 0,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      maxAVPlaneKinematicFlowMlPerSec: 0,
      maxAVPlaneKinematicForwardVolumeMl: 0,
    });
    expect(activeCandidate?.maxVLoopArea).toBeGreaterThan(report.bestVariant.maxVLoopArea + 30);
    expect(activeCandidate?.maxReservoirRecoilPressureMmHg).toBeGreaterThan(1.6);
    expect(activeCandidate?.maxAVPlaneReservoirTractionPressureMmHg).toBe(0);
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
    expect(report.claimBoundary.explicitPulmonaryVenousReservoirFlow).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial two-state reservoir transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialTwoStateReservoirTransactionReport, report);
  });
});
