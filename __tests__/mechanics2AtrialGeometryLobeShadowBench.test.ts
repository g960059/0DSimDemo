import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialGeometryLobeShadowBenchV1,
  type AtrialGeometryLobeShadowReportV1,
} from "@/engine/mechanics2/benches/AtrialGeometryLobeShadowBench";
import geometryReport
  from "@/data/mechanics2/reports/atrial-geometry-lobe-shadow-report-v1.json";

describe("AtrialGeometryLobeShadowBench V1", () => {
  let report: AtrialGeometryLobeShadowReportV1;

  beforeAll(() => {
    report = runAtrialGeometryLobeShadowBenchV1();
  }, 600_000);

  it("keeps readback-only geometry blocked as an AV-plane promotion path", () => {
    expect(report.decision.atrialGeometryLobeShadowStatus)
      .toBe("atrial-geometry-lobe-shadow-blocked");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "geometry-gain00",
      bestLobeQualityPass: 2,
      bestAPrimeReadbackPresentCount: 7,
      bestHiddenVolumeCleanCount: 7,
      baselineLobeQualityPass: 2,
    });
  });

  it("shows geometry readbacks are hidden-volume clean but not lobe-quality sufficient", () => {
    const highGain = report.variantSummaries.find((variant) =>
      variant.variantId === "geometry-gain18"
    );
    expect(highGain).toMatchObject({
      lobeQualityPass: 2,
      aPrimeReadbackPresentCount: 7,
      hiddenVolumeCleanCount: 7,
      meanMaxAtrialGeometryDeltaMl: 7.351013,
      maxAPrimePeakAbsCmPerSec: 3.942059,
    });
  });

  it("keeps runtime, AV-plane enablement, a-prime physiology, and LandAtrial claims blocked", () => {
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

  it("keeps the committed geometry shadow artifact aligned", () => {
    expectMechanics2ReportArtifactParity(geometryReport, report);
  });
});
