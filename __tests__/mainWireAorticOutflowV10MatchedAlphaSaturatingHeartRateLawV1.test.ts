import { describe, expect, it } from "vitest";

import { resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_BASELINE_LOAD_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";

describe("main-wire V10 matched-alpha saturating heart-rate law V1", () => {
  it("keeps the four-arm main experiment distinct from four endpoint sensitivity arms", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARM_IDS_V1,
    ).toEqual([
      "matched-alpha-saturating-hr-law-a040-hr-50",
      "matched-alpha-saturating-hr-law-a040-hr-60",
      "matched-alpha-saturating-hr-law-a040-hr-75",
      "matched-alpha-saturating-hr-law-a040-hr-90",
    ]);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARM_IDS_V1,
    ).toEqual([
      "matched-alpha-saturating-hr-law-a025-hr-50",
      "matched-alpha-saturating-hr-law-a025-hr-90",
      "matched-alpha-saturating-hr-law-a066-hr-50",
      "matched-alpha-saturating-hr-law-a066-hr-90",
    ]);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1.map(
        (arm) => [
          arm.designRole,
          arm.dimensionlessRateCoefficient,
          arm.heartRateBpm,
        ],
      ),
    ).toEqual([
      ["main-four-heart-rate-design", 0.4, 50],
      ["main-four-heart-rate-design", 0.4, 60],
      ["main-four-heart-rate-design", 0.4, 75],
      ["main-four-heart-rate-design", 0.4, 90],
    ]);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARMS_V1.map(
        (arm) => [
          arm.designRole,
          arm.dimensionlessRateCoefficient,
          arm.heartRateBpm,
        ],
      ),
    ).toEqual([
      ["endpoint-prior-sensitivity", 0.25, 50],
      ["endpoint-prior-sensitivity", 0.25, 90],
      ["endpoint-prior-sensitivity", 0.66, 50],
      ["endpoint-prior-sensitivity", 0.66, 90],
    ]);
    const priorSensitivityIds = new Set<string>(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARM_IDS_V1,
    );
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARM_IDS_V1.filter(
        (armId) => priorSensitivityIds.has(armId),
      ),
    ).toEqual([]);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1,
    ).toHaveLength(8);
  });

  it("uses 2000 exact steps per R-R interval, a 48-second ceiling, and independent cold starts", () => {
    const expectedMaximumBeatCount = new Map([
      [50, 40],
      [60, 48],
      [75, 60],
      [90, 72],
    ] as const);
    for (const arm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
          arm.calciumProfileId,
        );
      expect(arm.armId).toBe(arm.calciumProfileId);
      expect(arm.heartRateBpm).toBe(profile.heartRateBpm);
      expect(arm.dimensionlessRateCoefficient).toBe(
        profile.dimensionlessRateCoefficient,
      );
      expect(arm.cycleLengthSec).toBe(60 / arm.heartRateBpm);
      expect(arm.stepsPerCycle).toBe(2_000);
      expect(arm.dtSec * arm.stepsPerCycle).toBeCloseTo(arm.cycleLengthSec, 15);
      expect(arm.maximumPhysicalHorizonSec).toBe(48);
      expect(arm.maximumBeatCount).toBe(
        expectedMaximumBeatCount.get(arm.heartRateBpm),
      );
      expect(arm.maximumBeatCount * arm.cycleLengthSec).toBeCloseTo(48, 14);
      expect(arm.initializationPolicy).toBe("independent-canonical-cold-start");
      expect(arm.periodicTerminationPolicy).toBe(
        "stop-at-first-accepted-classification",
      );
      expect(
        resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1(
          arm.armId,
        ),
      ).toBe(arm);
      expect(Object.isFrozen(arm)).toBe(true);
    }
  });

  it("reuses the exact V10-reference non-calcium assembly and baseline load", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    ).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    );
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_BASELINE_LOAD_V1,
    ).toBe(MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1);
    expect(
      Object.prototype.hasOwnProperty.call(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
        "calciumProfileId",
      ),
    ).toBe(false);
    for (const arm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1) {
      expect(arm.circulatoryLoadPointId).toBe("baseline");
      expect(arm.stressedVenousVolumePointId).toBe("baseline");
    }
  });

  it("states the fixed design, exclusions, and non-adoption boundary", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
    ).toMatchObject({
      referenceAssemblyIsFullV10CandidateIdentity: false,
      mainDesign: {
        role: "primary-fixed-heart-rate-trend-test",
        rateCoefficient: 0.4,
        heartRatesBpm: [50, 60, 75, 90],
        armCount: 4,
      },
      priorSensitivityDesign: {
        role: "fixed-prior-endpoint-sensitivity-not-an-optimizer",
        rateCoefficients: [0.25, 0.66],
        heartRatesBpm: [50, 90],
        armCount: 4,
      },
      mainAndPriorSensitivityDesignsRemainDistinct: true,
      fullCatalogArmCount: 8,
      stepsPerCycle: 2_000,
      commonMaximumPhysicalHorizonSec: 48,
      independentCanonicalColdStartPerArm: true,
      warmStartApplied: false,
      sameV10ReferenceNonCalciumAssemblyForEveryArm: true,
      systemicOrBloodVolumeRecalibrationApplied: false,
      arbitraryNumericHeartRateOrCoefficientInputExposed: false,
      parameterSearchOrFitting: false,
      hemodynamicOutcomeUsedToDeriveArms: false,
      newContinuousStateAdded: false,
      clinicalValidationClaimed: false,
      canonicalAdoptionEstablished: false,
    });
  });

  it("rejects every arm identifier outside the fixed catalog", () => {
    expect(() =>
      resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1(
        "matched-alpha-saturating-hr-law-a040-hr-55" as MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmIdV1,
      ),
    ).toThrow(/unsupported V10 matched-alpha saturating heart-rate law arm/);
  });
});
