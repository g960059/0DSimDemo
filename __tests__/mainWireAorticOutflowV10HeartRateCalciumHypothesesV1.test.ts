import { describe, expect, it } from "vitest";

import {
  resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1,
  resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1,
  resolveMainWireAorticOutflowV10HeartRateCalciumArmV1,
  type MainWireAorticOutflowV10HeartRateCalciumArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";

describe("main-wire V10 heart-rate calcium hypotheses V1", () => {
  it("owns the fixed eight-arm timing design without exposing numeric inputs", () => {
    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARM_IDS_V1)
      .toEqual([
        "phase-scaled-coppini-hr-50",
        "phase-scaled-coppini-hr-60",
        "phase-scaled-coppini-hr-75",
        "phase-scaled-coppini-hr-90",
        "absolute-time-alpha-fit-hr-50",
        "absolute-time-alpha-fit-hr-60",
        "absolute-time-alpha-fit-hr-75",
        "absolute-time-alpha-fit-hr-90",
      ]);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1)
      .toHaveLength(8);
    expect(new Set(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1
        .map((arm) => arm.armId),
    )).toHaveProperty("size", 8);

    const hypothesisHeartRatePairs = new Set(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1.map((arm) =>
        `${arm.calciumHypothesisId}:${arm.heartRateBpm}`),
    );
    expect(hypothesisHeartRatePairs).toHaveProperty("size", 8);
    const expectedTimingByHeartRate = new Map([
      [50, { cycleLengthSec: 1.2, dtSec: 0.0006, maximumBeatCount: 40 }],
      [60, { cycleLengthSec: 1, dtSec: 0.0005, maximumBeatCount: 48 }],
      [75, { cycleLengthSec: 0.8, dtSec: 0.0004, maximumBeatCount: 60 }],
      [90, {
        cycleLengthSec: 2 / 3,
        dtSec: 1 / 3_000,
        maximumBeatCount: 72,
      }],
    ] as const);

    for (const arm of
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1) {
      const profile =
        resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
          arm.calciumProfileId,
        );
      expect(arm.armId).toBe(arm.calciumProfileId);
      expect(arm.calciumHypothesisId).toBe(profile.hypothesisId);
      expect(arm.heartRateBpm).toBe(profile.heartRateBpm);
      expect(arm.cycleLengthSec).toBe(profile.cycleLengthSec);
      const expectedTiming = expectedTimingByHeartRate.get(arm.heartRateBpm)!;
      expect(arm.cycleLengthSec)
        .toBeCloseTo(expectedTiming.cycleLengthSec, 14);
      expect(arm.dtSec).toBeCloseTo(expectedTiming.dtSec, 14);
      expect(arm.maximumBeatCount).toBe(expectedTiming.maximumBeatCount);
      expect(arm.cycleLengthSec * arm.heartRateBpm).toBeCloseTo(60, 14);
      expect(
        arm.dtSec
        * MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1,
      ).toBeCloseTo(arm.cycleLengthSec, 14);
      expect(arm.maximumBeatCount * arm.cycleLengthSec).toBeCloseTo(48, 14);
      expect(arm.initializationPolicy)
        .toBe("independent-canonical-cold-start");
      expect(resolveMainWireAorticOutflowV10HeartRateCalciumArmV1(arm.armId))
        .toBe(arm);
      expect(Object.isFrozen(arm)).toBe(true);
    }
  });

  it("holds the V10-derived non-calcium assembly and baseline load explicitly", () => {
    const assembly =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
    expect(assembly).toMatchObject({
      derivedFromCandidateId:
        MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId,
      pressureRecoveryProfileId:
        MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
          .pressureRecoveryProfileId,
      recoveredRootPortValveProfileId:
        MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
          .recoveredRootPortValveProfileId,
      aorticMaximumForwardEoaCm2: 3.5,
    });
    expect(Object.prototype.hasOwnProperty.call(assembly, "candidateId"))
      .toBe(false);
    expect(Object.prototype.hasOwnProperty.call(assembly, "calciumProfileId"))
      .toBe(false);
    expect(Object.prototype.hasOwnProperty.call(
      assembly,
      "atrioventricularDelayProfileId",
    )).toBe(false);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1)
      .toEqual({
        circulatoryLoadPointId: "baseline",
        stressedVenousVolumePointId: "baseline",
        complianceProfileId:
          MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
            .complianceProfileId,
        trefForceLoadProfileId:
          MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
            .trefForceLoadProfileId,
      });
  });

  it("states the hypothesis asymmetries and the excluded physiology", () => {
    const phaseScaledParams =
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "phase-scaled-coppini-hr-60",
      );
    const absoluteTimeParams =
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "absolute-time-alpha-fit-hr-60",
      );
    expect(phaseScaledParams.atrioventricularDelaySec).toBe(0.12);
    expect(absoluteTimeParams.atrioventricularDelaySec).toBe(0.12);
    expect(phaseScaledParams.ventricular.electricalToCalciumDelaySec).toBe(0);
    expect(absoluteTimeParams.ventricular.electricalToCalciumDelaySec)
      .toBe(0.012);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_CLAIM_V1)
      .toMatchObject({
        fullDesignArmCount: 8,
        stepsPerCycle: 2_000,
        commonMaximumPhysicalHorizonSec: 48,
        maximumBeatCountsByHeartRateBpm: {
          50: 40,
          60: 48,
          75: 60,
          90: 72,
        },
        independentCanonicalColdStartPerArm: true,
        warmStartApplied: false,
        referenceAssemblyIsFullV10CandidateIdentity: false,
        V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false,
        phaseScaledHypothesisVentricularElectricalToCalciumDelaySec: 0,
        absoluteTimeHypothesisVentricularElectricalToCalciumDelaySec: 0.012,
        crossHypothesisVentricularElectricalToCalciumDelayDifferenceSec: 0.012,
        crossHypothesisLevelComparisonIsPrimary: false,
        withinHypothesisHeartRateTrendsArePrimary: true,
        intracellularCalciumCyclingDynamicsModeled: false,
        calciumRestitutionModeled: false,
        forceFrequencyRelationModeled: false,
        rateDependentAtrioventricularConductionModeled: false,
        baroreflexModeled: false,
        clinicalValidationClaimed: false,
        parameterSearchOrFitting: false,
      });
  });

  it("rejects identifiers outside the fixed catalog", () => {
    expect(() => resolveMainWireAorticOutflowV10HeartRateCalciumArmV1(
      "phase-scaled-coppini-hr-55" as
        MainWireAorticOutflowV10HeartRateCalciumArmIdV1,
    )).toThrow(/unsupported V10 heart-rate calcium arm/);
  });
});
