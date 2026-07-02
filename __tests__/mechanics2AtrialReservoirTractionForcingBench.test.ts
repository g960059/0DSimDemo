import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialReservoirTractionForcingBenchV1,
  type AtrialReservoirTractionForcingReportV1,
} from "@/engine/mechanics2/benches/AtrialReservoirTractionForcingBench";
import atrialReservoirTractionForcingReport
  from "@/data/mechanics2/reports/atrial-reservoir-traction-forcing-report-v1.json";

describe("AtrialReservoirTractionForcingBench V1", () => {
  let report: AtrialReservoirTractionForcingReportV1;

  beforeAll(() => {
    report = runAtrialReservoirTractionForcingBenchV1();
  }, 600_000);

  it("detects an isolated rate-gated AV-plane traction topology signal", () => {
    expect(report.decision.atrialReservoirTractionForcingStatus)
      .toBe("rate-gated-traction-topology-signal");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "descent-traction-gain04",
      bestPassCount: 7,
      bestOpposedLobeCount: 7,
      baselinePassCount: 0,
      passImprovementOverBaseline: 7,
    });
    expect(report.bestVariant).toMatchObject({
      variantId: "descent-traction-gain04",
      passCount: 7,
      opposedLobeCount: 7,
      maxTractionPressureAbsMmHg: 3.00268,
      maxZAvDotNormPerSec: 10.236093,
    });
  });

  it("keeps the no-traction baseline failed by small reservoir v-loop area", () => {
    const baselineRows = report.rows.filter((row) => row.variantId === "no-traction");
    expect(baselineRows).toHaveLength(7);
    expect(baselineRows.every((row) => row.status === "fail")).toBe(true);
    expect(baselineRows.every((row) =>
      row.lobeQuality.failureReasons.includes("v-loop-area-too-small")
    )).toBe(true);
  });

  it("keeps closed-loop/runtime claims blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "closed-loop-success",
      "morphology-acceptance",
      "atrial-pressure-substitution",
      "hidden-blood-volume-source",
      "AV-plane-enable",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.closedLoopClaim).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.hiddenBloodVolumeSource).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed rate-gated traction forcing artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialReservoirTractionForcingReport, report);
  });
});
