import { describe, expect, it } from "vitest";

import { resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";

describe("main-wire V10 matched-alpha timing-policy bridge V1", () => {
  it("owns a balanced fixed four-arm design", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1,
    ).toHaveLength(4);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
        (arm) => arm.armId,
      ),
    ).toEqual([
      "matched-alpha-fixed-absolute-time-hr-50",
      "matched-alpha-fixed-absolute-time-hr-90",
      "matched-alpha-rr-scaled-tau-hr-50",
      "matched-alpha-rr-scaled-tau-hr-90",
    ]);
    expect(
      new Set(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
          (arm) => arm.timingPolicy,
        ),
      ),
    ).toEqual(new Set(["fixed-absolute-time", "rr-scaled-tau"]));
    expect(
      new Set(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
          (arm) => arm.heartRateBpm,
        ),
      ),
    ).toEqual(new Set([50, 90]));
  });

  it("uses 2000 exact steps per RR and one common 48-second ceiling", () => {
    for (const arm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1) {
      expect(arm.stepsPerCycle).toBe(2_000);
      expect(arm.dtSec * arm.stepsPerCycle).toBeCloseTo(arm.cycleLengthSec, 15);
      expect(arm.maximumBeatCount * arm.cycleLengthSec).toBe(48);
      expect(arm.maximumPhysicalHorizonSec).toBe(48);
      expect(arm.initializationPolicy).toBe("independent-canonical-cold-start");
      expect(arm.periodicTerminationPolicy).toBe(
        "stop-at-first-accepted-classification",
      );
      expect(
        resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
          arm.calciumProfileId,
        ).heartRateBpm,
      ).toBe(arm.heartRateBpm);
    }
  });

  it("reuses the V10-reference non-calcium assembly without claiming full V10 identity", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    ).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    );
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
    ).toMatchObject({
      referenceAssemblyIsFullV10CandidateIdentity: false,
      fullDesignArmCount: 4,
      stopAtFirstAcceptedPeriodicClassification: true,
      fixedPhysicalHorizonContinuationClaimed: false,
      onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy: true,
      systemicOrBloodVolumeRecalibrationApplied: false,
      parameterSearchOrFitting: false,
      clinicalValidationClaimed: false,
    });
  });

  it("rejects arms outside the fixed bridge", () => {
    expect(() =>
      resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1(
        "matched-alpha-rr-scaled-tau-hr-75" as never,
      ),
    ).toThrow(/unsupported V10 matched-alpha timing-policy bridge arm/);
  });
});
