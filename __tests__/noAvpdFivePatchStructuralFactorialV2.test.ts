import { describe, expect, it } from "vitest";
import {
  runNoAvpdFivePatchStructuralArmV2,
  runNoAvpdFivePatchStructuralFactorialV2,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchStructuralFactorialV2";

describe("NoAvpdFivePatchStructuralFactorialV2", () => {
  it("keeps the fully coupled structural arm solvable beyond two cycles", () => {
    const arm = runNoAvpdFivePatchStructuralArmV2(
      "body-laa-parallel__common-pericardium",
      {
        candidateIndex: 0,
        scenarioId: "hr60-reference",
        beats: 3,
        dtSec: 0.005,
        calciumRamp: "off-full-amplitude",
      },
    );
    expect(
      arm.status,
      `${arm.stepsAccepted}/${arm.stepsAttempted}: ${arm.failureReasons.join(",")}` +
        ` ${JSON.stringify(arm.failureDiagnostics)}`,
    ).toBe("run-complete");
  }, 120_000);

  it("runs the fixed 2x2 from independent cold starts without selecting a winner", () => {
    const result = runNoAvpdFivePatchStructuralFactorialV2({
      candidateIndex: 0,
      scenarioId: "hr60-reference",
      beats: 1,
      dtSec: 0.005,
      calciumRamp: "off-full-amplitude",
    });
    expect(result.arms).toHaveLength(4);
    expect(result.policy).toEqual({
      structuralFactorsFixedBeforeOutcomes: true,
      crossArmWarmStart: false,
      localOptimization: false,
      scalarWinnerScore: false,
      vLoopStatus: "report-only",
    });
    for (const arm of result.arms) {
      expect(
        arm.status,
        `${arm.armId} after ${arm.stepsAccepted}/${arm.stepsAttempted}: ` +
          arm.failureReasons.join(",") +
          ` last=${JSON.stringify(arm.finalCycleSamples.at(-1)?.leftAtrialPartition)}`,
      )
        .toBe("run-complete");
      expect(arm.stepsAccepted).toBe(200);
      expect(arm.finalCycleSamples).toHaveLength(200);
      expect(arm.maximumAbsoluteBloodVolumeResidualMl).toBeLessThan(1e-6);
      expect(
        arm.maximumAbsoluteBodyAppendagePressureMismatchMmHg,
      ).toBeLessThanOrEqual(1e-6);
    }
  }, 120_000);
});
