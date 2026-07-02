import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneTractionReservoirTransactionBenchV1,
  type AtrialAVPlaneTractionReservoirTransactionReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneTractionReservoirTransactionBench";
import atrialAVPlaneTractionReservoirTransactionReport
  from "@/data/mechanics2/reports/atrial-av-plane-traction-reservoir-transaction-report-v1.json";

describe("AtrialAVPlaneTractionReservoirTransactionBench V1", () => {
  let report: AtrialAVPlaneTractionReservoirTransactionReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneTractionReservoirTransactionBenchV1();
  }, 600_000);

  it("promotes AV-plane traction plus accepted venous reservoir flow as the atrial v-loop topology signal", () => {
    expect(report.decision.atrialAVPlaneTractionReservoirTransactionStatus)
      .toBe("atrial-av-plane-traction-vloop-topology-signal");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      baselineSourceSurfacePass: 4,
      baselineTopologyPass: 0,
      bestTopologyVariantId: "traction12-flow10-cap20",
      bestTopologyPass: 7,
      bestDtHalfTopologyPass: 7,
      bestSourceSurfacePass: 4,
      bestSourcePreservingTopologyPass: 4,
      bestOpposedLobeCount: 7,
      bestMvfCleanCount: 4,
      flowOnlyTopologyPass: 0,
      tractionOnlyTopologyPass: 0,
      negativeTractionTopologyPass: 0,
      maxAVPlaneKinematicFlowMlPerSec: 110,
      maxAVPlaneReservoirTractionPressureMmHg: 25.676354,
      maxVLoopArea: 121.175917,
    });
  });

  it("keeps the selected topology candidate hidden-volume clean while preserving only baseline source-surface status", () => {
    expect(report.bestTopologyVariant).toMatchObject({
      variantId: "traction12-flow10-cap20",
      sourceSurfacePass: 4,
      topologyPass: 7,
      dtHalfTopologyPass: 7,
      sourcePreservingTopologyPass: 4,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      opposedLobeCount: 7,
      dtHalfOpposedLobeCount: 7,
      selfIntersectionCount: 7,
      dtHalfSelfIntersectionCount: 7,
      maxAVPlaneKinematicFlowMlPerSec: 90,
      maxAVPlaneKinematicForwardVolumeMl: 7.879477,
      maxAVPlaneReservoirTractionPressureMmHg: 19.283221,
      maxGeometryDeltaMl: 15.801356,
    });
  });

  it("rejects passive flow-only, traction-only, and wrong-sign traction controls as v-loop topology mechanisms", () => {
    const flowOnly = report.variantSummaries.find((summary) =>
      summary.variantId === "flow08-cap16-no-traction"
    );
    const tractionOnly = report.variantSummaries.find((summary) =>
      summary.variantId === "traction08-cap16-no-flow"
    );
    const negativeTraction = report.variantSummaries.find((summary) =>
      summary.variantId === "negative-traction08-flow08-cap16"
    );

    expect(flowOnly).toMatchObject({
      sourceSurfacePass: 4,
      topologyPass: 0,
      opposedLobeCount: 0,
      maxAVPlaneKinematicFlowMlPerSec: 70,
      maxAVPlaneReservoirTractionPressureMmHg: 0,
    });
    expect(tractionOnly).toMatchObject({
      sourceSurfacePass: 3,
      topologyPass: 0,
      opposedLobeCount: 0,
      maxAVPlaneKinematicFlowMlPerSec: 0,
      maxAVPlaneReservoirTractionPressureMmHg: 12.926089,
    });
    expect(negativeTraction).toMatchObject({
      sourceSurfacePass: 3,
      topologyPass: 0,
      opposedLobeCount: 0,
      maxAVPlaneKinematicFlowMlPerSec: 70,
      maxAVPlaneReservoirTractionPressureMmHg: 0,
    });
    expect(negativeTraction?.minAVPlaneReservoirTractionPressureMmHg).toBeLessThan(-12);
  });

  it("keeps runtime, morphology acceptance, AV-plane enablement, pressure substitution, hidden-volume source, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "hidden-blood-volume-source",
      "atrial-pressure-substitution",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.hiddenBloodVolumeSource).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial AV-plane traction reservoir transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneTractionReservoirTransactionReport, report);
  });
});
