import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runDualLobeChamberValveGeneratorBenchV1,
  type DualLobeChamberValveGeneratorReportV1,
} from "@/engine/mechanics2/benches/DualLobeChamberValveGeneratorBench";
import dualLobeReport
  from "@/data/mechanics2/reports/dual-lobe-chamber-valve-generator-report-v1.json";

describe("DualLobeChamberValveGeneratorBench V1", () => {
  let report: DualLobeChamberValveGeneratorReportV1;

  beforeAll(() => {
    report = runDualLobeChamberValveGeneratorBenchV1();
  }, 600_000);

  it("records a mixed dual-lobe chamber/valve signal without lobe promotion", () => {
    expect(report.decision.dualLobeChamberValveGeneratorStatus)
      .toBe("dual-lobe-chamber-valve-generator-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "geometry-pressure-hybrid-r12-b0-p1",
      bestSourceSurfacePass: 5,
      bestContractPass: 2,
      bestLaPvLobeQualityPass: 2,
      bestMvfCleanCount: 5,
      bestOpposedLobeCount: 2,
      maxSourceSurfacePass: 5,
      maxSourceSurfaceVariantId: "geometry-pressure-hybrid-r12-b0-p1",
      maxLobeQualityPass: 2,
      maxLobeQualityVariantId: "geometry-pressure-hybrid-r12-b0-p1",
    });
  });

  it("shows reservoir capacity state plus small pressure hybrid improves source surface before solving lobe quality", () => {
    const stronger = report.variantSummaries.find((variant) =>
      variant.variantId === "geometry-pressure-hybrid-r12-b0-p1"
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
      minReservoirPressureMmHg: -0.8527,
      maxReservoirGeometryDeltaMl: 10.232395,
      maxBoosterPressureMmHg: 0.750203,
      maxBoosterGeometryDeltaMl: 0,
    });
  });

  it("keeps geometry/a-prime readbacks clean without hidden blood volume", () => {
    const geometry = report.variantSummaries.find((variant) =>
      variant.variantId === "geometry-r12-b6"
    );
    expect(geometry).toMatchObject({
      sourceSurfacePass: 3,
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

  it("keeps the committed dual-lobe chamber valve artifact aligned", () => {
    expectMechanics2ReportArtifactParity(dualLobeReport, report);
  });
});
