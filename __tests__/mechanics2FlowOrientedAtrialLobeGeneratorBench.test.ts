import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runFlowOrientedAtrialLobeGeneratorBenchV1,
  type FlowOrientedAtrialLobeGeneratorReportV1,
} from "@/engine/mechanics2/benches/FlowOrientedAtrialLobeGeneratorBench";
import flowOrientedReport
  from "@/data/mechanics2/reports/flow-oriented-atrial-lobe-generator-report-v1.json";

describe("FlowOrientedAtrialLobeGeneratorBench V1", () => {
  let report: FlowOrientedAtrialLobeGeneratorReportV1;

  beforeAll(() => {
    report = runFlowOrientedAtrialLobeGeneratorBenchV1();
  }, 600_000);

  it("records a mixed flow-oriented lobe signal without lobe promotion", () => {
    expect(report.decision.flowOrientedAtrialLobeGeneratorStatus)
      .toBe("flow-oriented-atrial-lobe-generator-mixed");
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
      minReservoirPressureMmHg: -0.8527,
      maxReservoirGeometryDeltaMl: 10.232395,
      maxBoosterPressureMmHg: 0.750203,
      maxBoosterGeometryDeltaMl: 0,
    });
  });

  it("shows flow-gated reservoir drive preserves source surface but does not fix lobe direction", () => {
    const flow = report.variantSummaries.find((variant) =>
      variant.variantId === "flow-rate70-r12-b0-p1"
    );
    expect(flow).toMatchObject({
      sourceSurfacePass: 5,
      contractPass: 1,
      laPvLobeQualityPass: 1,
      mvfCleanCount: 5,
      hiddenVolumeCleanCount: 7,
      aPrimeReadbackPresentCount: 7,
      opposedLobeCount: 1,
      maxReservoirGeometryDeltaMl: 4.123731,
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

  it("keeps the committed flow-oriented atrial lobe artifact aligned", () => {
    expectMechanics2ReportArtifactParity(flowOrientedReport, report);
  });
});
