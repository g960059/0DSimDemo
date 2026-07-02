import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialReservoirTopologyOrientationAttributionBenchV1,
  type AtrialReservoirTopologyOrientationAttributionReportV1,
} from "@/engine/mechanics2/benches/AtrialReservoirTopologyOrientationAttributionBench";
import atrialReservoirTopologyOrientationAttributionReport
  from "@/data/mechanics2/reports/atrial-reservoir-topology-orientation-attribution-report-v1.json";

describe("AtrialReservoirTopologyOrientationAttributionBench V1", () => {
  let report: AtrialReservoirTopologyOrientationAttributionReportV1;

  beforeAll(() => {
    report = runAtrialReservoirTopologyOrientationAttributionBenchV1();
  }, 600_000);

  it("classifies the missing v-loop as a blood-volume topology gap rather than an effective-stretch gap", () => {
    expect(report.decision.atrialReservoirTopologyOrientationStatus)
      .toBe("atrial-reservoir-topology-orientation-axis-signal");
    expect(report.summary).toMatchObject({
      totalRows: 105,
      bloodOpposedCount: 0,
      cavityPlusCapacityOpposedCount: 0,
      effectiveStretchOpposedCount: 45,
      sourcePreservingBloodOpposedCount: 0,
      sourcePreservingEffectiveStretchOpposedCount: 25,
      topologyGapRows: 45,
      bestEffectiveStretchVariantId: "two-state-cap32-suction2-recoil4",
      bestEffectiveStretchOpposedCount: 6,
      bestEffectiveStretchSourcePreservingOpposedCount: 4,
      bestBloodOpposedCount: 0,
      maxBloodVLoopArea: 177.515023,
      maxEffectiveStretchVLoopArea: 120.202445,
    });
  });

  it("keeps blood-volume LA PV acceptance and runtime/AV-plane promotion blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "hidden-blood-volume-source",
      "relax-atrial-pv-gate",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.hiddenBloodVolumeSource).toBe(false);
    expect(report.claimBoundary.relaxAtrialPvGate).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("records the source-preserving effective-stretch signal on the selected two-state variant", () => {
    const selected = report.variantSummaries.find((summary) =>
      summary.variantId === "two-state-cap32-suction2-recoil4"
    );
    expect(selected).toMatchObject({
      sourceSurfacePass: 4,
      hiddenVolumeCleanCount: 7,
      bloodOpposedCount: 0,
      cavityPlusCapacityOpposedCount: 0,
      effectiveStretchOpposedCount: 6,
      sourcePreservingEffectiveStretchOpposedCount: 4,
      bloodSelfIntersectionCount: 1,
      effectiveStretchSelfIntersectionCount: 7,
    });
    expect(selected?.maxGeometryDeltaMl).toBeGreaterThan(25);
  });

  it("keeps the committed topology-orientation attribution artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialReservoirTopologyOrientationAttributionReport, report);
  });
});
