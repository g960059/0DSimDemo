import { beforeAll, describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_METRIC_IDS_V1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 matched-alpha timing-policy bridge comparison V1", () => {
  let inputs: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1[];
  let comparison: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1;

  beforeAll(() => {
    inputs = Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
        (arm) => {
          const run =
            runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
              { dtSec: arm.dtSec, maximumBeatCount: 1 },
              arm.calciumProfileId,
            );
          return Object.freeze({
            arm,
            calciumProfile: run.matchedAlphaTimingPolicyBridgeProfile,
            calciumDriveParams: run.calciumDriveParams,
            periodicResult: run.periodicResult,
          });
        },
      ),
    );
    comparison =
      compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1(inputs);
  }, 120_000);

  it("audits the exact four identities and exact pressure stations", () => {
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.metricContrasts).toHaveLength(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_METRIC_IDS_V1.length,
    );
    expect(comparison.allExactReadbacksAvailable).toBe(true);
    expect(comparison.allExactReadbackStationEquationsWithinTolerance).toBe(
      true,
    );
    expect(comparison.allArmsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(comparison.arms.map((measured) => measured.arm.armId)).toEqual(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
        (arm) => arm.armId,
      ),
    );
    expect(
      new Set(comparison.arms.map((arm) => arm.protocolIdentityHash)).size,
    ).toBe(4);

    for (const measured of comparison.arms) {
      expect(measured.selectedBeatSampleCount).toBe(2_000);
      expect(measured.completedBeatCount).toBe(1);
      expect(measured.completedPhysicalTimeSec).toBeCloseTo(
        measured.arm.cycleLengthSec,
        12,
      );
      expect(measured.exactReadbackAudit.allSelectedBeatSamplesAvailable).toBe(
        true,
      );
      expect(measured.exactReadbackAudit.availableSelectedBeatSampleCount).toBe(
        measured.exactReadbackAudit.requiredSelectedBeatSampleCount,
      );
      expect(measured.exactReadbackAudit.stationEquationsWithinTolerance).toBe(
        true,
      );
      expect(measured.singleDistinctAorticFlowPeakPassed).toBe(true);
      expect(
        measured.exactReadbackAudit
          .maximumAbsoluteStationAdditivityResidualMmHg,
      ).toBeLessThanOrEqual(1e-9);
      expect(
        measured.exactPressureStations
          .rawLvMinusAorticComplianceNodeGradientMmHg.timeMean,
      ).toBeCloseTo(
        measured.exactPressureStations
          .exactLvMinusProximalConstitutivePortGradientMmHg.timeMean +
          measured.exactPressureStations.characteristicImpedancePressureMmHg
            .timeMean,
        10,
      );
      expect(
        measured.onePercentFlowEjectionTime.interpolatedEjectionTimeSec,
      ).toBeGreaterThan(0);
      expect(
        measured.onePercentFlowEjectionTime.interpolatedEjectionTimeSec,
      ).toBeLessThan(measured.arm.cycleLengthSec);
    }

    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1([
        ...inputs.slice(0, -1),
        inputs[0]!,
      ]),
    ).toThrow(/duplicate V10 matched-alpha bridge arm/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1(
        inputs.slice(0, -1),
      ),
    ).toThrow(/missing V10 matched-alpha bridge arm/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1(
        Object.freeze([
          Object.freeze({
            ...inputs[0]!,
            calciumProfile: inputs[1]!.calciumProfile,
          }),
          ...inputs.slice(1),
        ]),
      ),
    ).toThrow(/calcium profile identity mismatch/);
  });

  it("reports the Copenhagen formulas without claiming measurement equivalence", () => {
    expect(comparison.copenhagenReference).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1,
    );
    expect(
      comparison.analysisClaim
        .copenhagenCorrectionAppliedToDirectValveEventAnaloguesOnly,
    ).toBe(true);
    expect(comparison.analysisClaim.clinicalMeasurementEquivalenceClaimed).toBe(
      false,
    );

    for (const measured of comparison.arms) {
      const heartRateBpm = measured.arm.heartRateBpm;
      const readout = measured.copenhagenTimingReadout;
      const expected = [
        [readout.leftVentricularEjectionTime, 1.4, [347, 415]],
        [readout.isovolumicContractionTime, 0.15, [30, 68]],
        [readout.isovolumicRelaxationTime, 0.27, [76, 151]],
      ] as const;
      expect(readout.heartRateBpm).toBe(heartRateBpm);
      expect(readout.correctedTeiIndexConstructed).toBe(false);
      expect(readout.clinicalMeasurementEquivalenceClaimed).toBe(false);
      for (const [timing, coefficient, interval] of expected) {
        expect(timing.rawMs).not.toBeNull();
        expect(timing.correctionCoefficientMsPerBpm).toBe(coefficient);
        expect(timing.correctionAddedMs).toBeCloseTo(
          coefficient * heartRateBpm,
          14,
        );
        expect(timing.correctedMs).toBeCloseTo(
          timing.rawMs! + coefficient * heartRateBpm,
          12,
        );
        expect(timing.correctedPredictionInterval95Ms).toEqual(interval);
        expect(timing.withinCorrectedPredictionInterval95).toBe(
          timing.correctedMs! >= interval[0] &&
            timing.correctedMs! <= interval[1],
        );
      }
    }
  });

  it("owns raw HR effects and the rr-scaled-tau minus fixed DoD", () => {
    const strokeVolume = comparison.metricContrasts.find(
      (contrast) => contrast.metricId === "stroke-volume-ml",
    )!;
    expect(strokeVolume.fixedAbsoluteTimeHr90Minus50).toBeCloseTo(
      strokeVolume.fixedAbsoluteTimeHr90! - strokeVolume.fixedAbsoluteTimeHr50!,
      12,
    );
    expect(strokeVolume.rrScaledTauHr90Minus50).toBeCloseTo(
      strokeVolume.rrScaledTauHr90! - strokeVolume.rrScaledTauHr50!,
      12,
    );
    expect(strokeVolume.differenceOfDifferences).toBeCloseTo(
      strokeVolume.rrScaledTauHr90! -
        strokeVolume.rrScaledTauHr50! -
        (strokeVolume.fixedAbsoluteTimeHr90! -
          strokeVolume.fixedAbsoluteTimeHr50!),
      12,
    );

    for (const contrast of comparison.metricContrasts) {
      if (
        contrast.fixedAbsoluteTimeHr90Minus50 !== null &&
        contrast.rrScaledTauHr90Minus50 !== null
      ) {
        expect(contrast.differenceOfDifferences).toBeCloseTo(
          contrast.rrScaledTauHr90Minus50 -
            contrast.fixedAbsoluteTimeHr90Minus50,
          12,
        );
      } else {
        expect(contrast.differenceOfDifferences).toBeNull();
      }
    }
  });

  it("keeps one-beat transients outside the interpretation gate", () => {
    expect(comparison.allArmsPeriod1AndIntegrationPassed).toBe(false);
    expect(comparison.allArmsInterpretationEligible).toBe(false);
    for (const measured of comparison.arms) {
      expect(measured.periodicSteadyStateClaimed).toBe(false);
      expect(measured.integrationCompletedWithoutFailure).toBe(true);
      expect(measured.period1AndIntegrationPassed).toBe(false);
      expect(measured.interpretationEligible).toBe(false);
    }
  });
});
