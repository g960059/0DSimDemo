import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAvValveSourceStateContractShadowBenchV1,
  type AvValveSourceStateContractShadowReportV1,
} from "@/engine/mechanics2/benches/AvValveSourceStateContractShadowBench";
import sourceStateReport
  from "@/data/mechanics2/reports/av-valve-source-state-contract-shadow-report-v1.json";

describe("AvValveSourceStateContractShadowBench V1", () => {
  let report: AvValveSourceStateContractShadowReportV1;

  beforeAll(() => {
    report = runAvValveSourceStateContractShadowBenchV1();
  }, 600_000);

  it("finds only a mixed fixed-variant signal for source-owned AV valve state", () => {
    expect(report.upstreamAtrialShadow).toMatchObject({
      observedStatus: "atrial-fiber-source-reservoir-shadow-replay-signal",
      referenceMode: "prior-committed-artifact-not-rerun",
      pass: 14,
      finiteBoundedCount: 14,
    });
    expect(report.directGradientReference).toMatchObject({
      observedStatus: "av-valve-atrial-gradient-shadow-blocked",
      referenceMode: "prior-committed-artifact-not-rerun",
      pass: 0,
      cleanShapeCount: 1,
      forwardVolumeParityCount: 4,
    });
    expect(report.decision.avValveSourceStateContractShadowStatus)
      .toBe("av-valve-source-state-contract-shadow-mixed");
    expect(report.summary).toMatchObject({
      total: 14,
      bestFixedVariantId: "source-open-memory",
      bestFixedPass: 1,
      bestFixedFail: 13,
      bestFixedMvPass: 1,
      bestFixedTvPass: 0,
      bestFixedCleanShapeCount: 6,
      bestFixedForwardVolumeParityCount: 5,
      oraclePass: 1,
      directGradientPass: 0,
      directGradientCleanShapeCount: 1,
      directGradientForwardVolumeParityCount: 4,
    });
  });

  it("keeps the mixed signal bounded and exposes the remaining side-specific residuals", () => {
    expect(report.bestFixedVariant).toMatchObject({
      variantId: "source-open-memory",
      pass: 1,
      cleanShapeCount: 6,
      forwardVolumeParityCount: 5,
    });
    expect(report.bestFixedVariant.maxSourceStateDutyFraction).toBeLessThan(0.13);
    expect(report.bestFixedVariant.maxLossScale).toBe(1);
    const bestRows = report.rows.filter((row) => row.variantId === report.summary.bestFixedVariantId);
    expect(bestRows.filter((row) => row.status === "pass").map((row) =>
      `${row.profileId}:${row.valveSide}`
    )).toEqual(["preload-low:MV"]);
    expect(bestRows.filter((row) => row.valveSide === "MV").some((row) =>
      row.failureReasons.includes("shadow-adverse-gradient-during-forward-flow")
    )).toBe(true);
    expect(bestRows.filter((row) => row.valveSide === "TV").every((row) =>
      row.failureReasons.includes("shadow-av-flow-c1-kink")
      || row.failureReasons.includes("shadow-av-forward-volume-ratio-wide")
    )).toBe(true);
  });

  it("keeps pressure/gradient commit, runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("source-pressure-commit");
    expect(report.decision.blockedClaims).toContain("source-gradient-commit");
    expect(report.claimBoundary.sourcePressureCommit).toBe(false);
    expect(report.claimBoundary.sourceGradientCommit).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed AV valve source-state artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(sourceStateReport, report);
  });
});
