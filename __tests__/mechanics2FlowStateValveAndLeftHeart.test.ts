import { describe, expect, it } from "vitest";
import {
  runFlowStateValvePrescribedGradientBenchV1,
} from "@/engine/mechanics2/benches/FlowStateValvePrescribedGradientBench";
import {
  runLeftHeartSubsystemStrategicSmokeV1,
} from "@/engine/mechanics2/benches/LeftHeartSubsystemStrategicSmoke";
import {
  REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1,
  buildPrescribedGradientValveFixturesV1,
  validatePrescribedGradientValveFixtureV1,
} from "@/engine/mechanics2/fixtures/PrescribedGradientValveFixtureV1";
import flowStateValveReport from "@/data/mechanics2/reports/flow-state-valve-prescribed-gradient-report-v1.json";
import leftHeartReport from "@/data/mechanics2/reports/left-heart-subsystem-strategic-smoke-report-v1.json";

describe("MechanicsCore2 FlowStateValve and left-heart strategic smoke", () => {
  it("keeps prescribed-gradient valve fixtures explicit and complete", () => {
    const fixtures = buildPrescribedGradientValveFixturesV1();
    expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual([...REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1]);
    for (const fixture of fixtures) {
      expect(validatePrescribedGradientValveFixtureV1(fixture)).toEqual([]);
      expect(fixture.annotation.morphologyProfileId).toBe("normal_sinus_default");
      expect(fixture.expectedForwardPeakCount).toBe(2);
    }
  });

  it("passes the isolated FlowStateValve prescribed-gradient gate without runtime claims", () => {
    const report = runFlowStateValvePrescribedGradientBenchV1();
    expect(report.summary).toMatchObject({
      total: 4,
      pass: 4,
      fail: 0,
      inconclusive: 0,
      cleanBiphasicCount: 4,
    });
    expect(report.decision.mayProceedToLeftHeartStrategicGate).toBe(true);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.closedLoopMorphologyAcceptance).toBe(false);
    for (const result of report.fixtureResults) {
      expect(result.status).toBe("pass");
      expect(result.forwardPeakCount).toBe(2);
      expect(result.flowShape.c1ContinuityScore).toBeLessThan(0.34);
    }
  });

  it("keeps the committed FlowStateValve artifact aligned with the rerun summary", () => {
    const report = runFlowStateValvePrescribedGradientBenchV1();
    expect(flowStateValveReport.reportId).toBe(report.reportId);
    expect(flowStateValveReport.summary).toEqual(report.summary);
    expect(flowStateValveReport.decision).toEqual(report.decision);
    expect(typeof flowStateValveReport.normalizedSha256).toBe("string");
    expect(flowStateValveReport.normalizedSha256).toHaveLength(64);
  });

  it("records LeftHeartSubsystemV1 as a mixed strategic signal, not an adoption surface", () => {
    const report = runLeftHeartSubsystemStrategicSmokeV1();
    expect(report.summary).toMatchObject({
      total: 7,
      pass: 1,
      fail: 6,
      inconclusive: 0,
      lvPvOkCount: 7,
      mvfOkCount: 2,
      outputOkCount: 4,
    });
    expect(report.decision.strategicSignal).toBe("inconclusive");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.fullMechanicsCore2Investment).toBe(false);

    const normal = report.pointResults.find((point) => point.pointId === "left-heart-normal-hr75")!;
    expect(normal.status).toBe("pass");
    expect(normal.lvPvStatus).toBe("ok");
    expect(normal.mvfStatus).toBe("ok");
    expect(normal.outputStatus).toBe("ok");

    const failed = report.pointResults.filter((point) => point.status === "fail");
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.some((point) => point.failureReasons.includes("mvf-c1-kink"))).toBe(true);
  });

  it("keeps the committed LeftHeartSubsystem artifact aligned with the rerun summary", () => {
    const report = runLeftHeartSubsystemStrategicSmokeV1();
    expect(leftHeartReport.reportId).toBe(report.reportId);
    expect(leftHeartReport.summary).toEqual(report.summary);
    expect(leftHeartReport.decision).toEqual(report.decision);
    expect(typeof leftHeartReport.normalizedSha256).toBe("string");
    expect(leftHeartReport.normalizedSha256).toHaveLength(64);
  });
});
