import { describe, expect, it } from "vitest";

import { measurePeriodicBiexponentialCalciumPulseShapeV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";

describe("main-wire ventricular calcium matched-alpha timing-policy bridge V1", () => {
  it("owns only the matched 2x2 fixed profiles", () => {
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1,
    ).toEqual([
      "matched-alpha-fixed-absolute-time-hr-50",
      "matched-alpha-fixed-absolute-time-hr-90",
      "matched-alpha-rr-scaled-tau-hr-50",
      "matched-alpha-rr-scaled-tau-hr-90",
    ]);
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
    ).toMatchObject({
      waveformFamilyHeldExactly: true,
      ventricularCalciumExtremaHeldExactly: true,
      ventricularElectricalToCalciumDelayHeldAtSec: 0.012,
      atrioventricularDelayHeldAtSec: 0.12,
      arbitraryNumericHeartRateOrTimeConstantInputExposed: false,
      parameterSearchOrFitting: false,
      hemodynamicOutcomeUsedToDeriveProfiles: false,
    });
  });

  it("reuses the existing fixed-alpha endpoint controls exactly", () => {
    expect(
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-fixed-absolute-time-hr-50",
      ),
    ).toBe(
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "absolute-time-alpha-fit-hr-50",
      ),
    );
    expect(
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-fixed-absolute-time-hr-90",
      ),
    ).toBe(
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "absolute-time-alpha-fit-hr-90",
      ),
    );
  });

  it("changes only the ventricular alpha time constants within each HR pair", () => {
    for (const heartRate of [50, 90] as const) {
      const fixed =
        resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
          `matched-alpha-fixed-absolute-time-hr-${heartRate}`,
        );
      const scaled =
        resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
          `matched-alpha-rr-scaled-tau-hr-${heartRate}`,
        );
      expect(scaled.cycleLengthSec).toBe(fixed.cycleLengthSec);
      expect(scaled.atrioventricularDelaySec).toBe(0.12);
      expect(scaled.atrial).toBe(fixed.atrial);
      expect(scaled.ventricular.diastolicCalciumUM).toBe(
        fixed.ventricular.diastolicCalciumUM,
      );
      expect(scaled.ventricular.peakAmplitudeUM).toBe(
        fixed.ventricular.peakAmplitudeUM,
      );
      expect(scaled.ventricular.electricalToCalciumDelaySec).toBe(0.012);
      const {
        riseTimeConstantSec: _fixedRise,
        decayTimeConstantSec: _fixedDecay,
        ...fixedInvariant
      } = fixed.ventricular;
      const {
        riseTimeConstantSec: _scaledRise,
        decayTimeConstantSec: _scaledDecay,
        ...scaledInvariant
      } = scaled.ventricular;
      expect(scaledInvariant).toEqual(fixedInvariant);
      expect(scaled.ventricularSampledTrace).toBeUndefined();
    }
  });

  it("holds fixed tau in seconds or scales both alpha tau values with RR", () => {
    const fixed50 =
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-fixed-absolute-time-hr-50",
      );
    const fixed90 =
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-fixed-absolute-time-hr-90",
      );
    const scaled50 =
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-rr-scaled-tau-hr-50",
      );
    const scaled90 =
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-rr-scaled-tau-hr-90",
      );
    expect(fixed50.ventricular.riseTimeConstantSec).toBe(
      fixed90.ventricular.riseTimeConstantSec,
    );
    expect(fixed50.ventricular.decayTimeConstantSec).toBe(
      fixed90.ventricular.decayTimeConstantSec,
    );
    expect(scaled50.ventricular.riseTimeConstantSec).toBeCloseTo(
      fixed50.ventricular.riseTimeConstantSec * 1.2,
      15,
    );
    expect(scaled90.ventricular.riseTimeConstantSec).toBeCloseTo(
      fixed90.ventricular.riseTimeConstantSec * (2 / 3),
      15,
    );
    expect(scaled50.ventricular.decayTimeConstantSec).toBe(
      scaled50.ventricular.riseTimeConstantSec,
    );
    expect(scaled90.ventricular.decayTimeConstantSec).toBe(
      scaled90.ventricular.riseTimeConstantSec,
    );
  });

  it("keeps RR-scaled alpha shape moments invariant in phase", () => {
    const profiles = [
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
        "matched-alpha-rr-scaled-tau-hr-50",
      ),
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
        "matched-alpha-rr-scaled-tau-hr-90",
      ),
    ];
    expect(profiles[0]!.ventricularPulsePeakPhase01).toBeCloseTo(
      profiles[1]!.ventricularPulsePeakPhase01,
      14,
    );
    expect(
      profiles[0]!.ventricularNormalizedPulseCycleIntegralSec /
        profiles[0]!.cycleLengthSec,
    ).toBeCloseTo(
      profiles[1]!.ventricularNormalizedPulseCycleIntegralSec /
        profiles[1]!.cycleLengthSec,
      14,
    );
    for (const profile of profiles) {
      const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
        profile.cycleLengthSec,
        profile.ventricularRiseTimeConstantSec,
        profile.ventricularDecayTimeConstantSec,
      );
      expect(shape.shapeRegime).toBe("alpha-limit");
      expect(
        profile.onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy,
      ).toBe(true);
    }
  });

  it("rejects profiles outside the fixed bridge", () => {
    expect(() =>
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
        "matched-alpha-rr-scaled-tau-hr-75" as never,
      ),
    ).toThrow(/unsupported matched-alpha timing-policy bridge profile/);
    expect(() =>
      resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
        "matched-alpha-rr-scaled-tau-hr-75" as never,
      ),
    ).toThrow(/unsupported matched-alpha timing-policy bridge profile/);
  });
});
