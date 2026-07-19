import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1,
  runMainWireValvePresetNumericalRobustnessEnvelopeV1,
} from "@/tools/scientific/mainWireValvePresetNumericalRobustnessEnvelopeV1";

describe("main-wire valve-preset numerical robustness envelope V1", () => {
  it("completes one 2 ms beat for healthy and all eight severe brackets on the analytic path", () => {
    const summary = runMainWireValvePresetNumericalRobustnessEnvelopeV1(0.002);

    expect(summary.cases.map(({ caseId }) => caseId)).toEqual([
      "healthy",
      "AS-severe",
      "AR-severe",
      "MS-severe",
      "MR-severe",
      "TS-severe",
      "TR-severe",
      "PS-severe",
      "PR-severe",
    ]);
    expect(summary).toMatchObject({
      dtSec: 0.002,
      beatCount: 1,
      stepsPerBeat: 500,
      requestedCaseCount: 9,
      completedCaseCount: 9,
      overallPass: true,
    });

    for (const result of summary.cases) {
      expect(result).toMatchObject({
        completed: true,
        requestedStepCount: 500,
        completedStepCount: 500,
        failure: null,
        allNumericReadbacksFinite: true,
        jacobianMode: "analytic-semismooth",
        jacobianModesObserved: ["analytic-semismooth"],
        pressureTangentUnavailableStepCount: 0,
        finiteDifferenceJacobianFallbackCountSum: 0,
        finiteDifferenceJacobianFallbackCountMaximum: 0,
        numericalHealthPass: true,
      });
      expect(result.maximumContinuityResidualMl).not.toBeNull();
      expect(result.maximumContinuityResidualMl!).toBeLessThanOrEqual(
        MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1
          .maximumContinuityResidualMl,
      );
      expect(result.maximumAbsoluteTotalBloodVolumeErrorMl).not.toBeNull();
      expect(result.maximumAbsoluteTotalBloodVolumeErrorMl!).toBeLessThanOrEqual(
        MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1
          .maximumAbsoluteTotalBloodVolumeErrorMl,
      );
      expect(result.maximumMechanicsIterations).not.toBeNull();
      expect(result.maximumMechanicsIterations!).toBeLessThanOrEqual(
        MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1
          .maximumMechanicsIterations,
      );
      expect(result.maximumCirculationIterations).not.toBeNull();
      expect(result.maximumCirculationIterations!).toBeLessThanOrEqual(
        MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1
          .maximumCirculationIterations,
      );

      for (const range of [
        ...Object.values(result.chamberAbsolutePressureMmHg),
        ...Object.values(result.chamberVolumeMl),
      ]) {
        expect(range.minimum).not.toBeNull();
        expect(range.maximum).not.toBeNull();
        expect(Number.isFinite(range.minimum)).toBe(true);
        expect(Number.isFinite(range.maximum)).toBe(true);
        expect(range.minimum!).toBeLessThanOrEqual(range.maximum!);
      }
      for (const integral of Object.values(result.valveIntegratedVolumeMl)) {
        expect(Number.isFinite(integral.forward)).toBe(true);
        expect(Number.isFinite(integral.reverse)).toBe(true);
        expect(integral.forward).toBeGreaterThanOrEqual(0);
        expect(integral.reverse).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
