import { describe, expect, it } from "vitest";

import { measurePeriodicBiexponentialCalciumPulseShapeV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_EVIDENCE_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILES_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import { MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";

const SOURCE_TAU_SEC =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.ventricularRiseTimeConstantSec;

function fixedControlProfileId(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
):
  | "absolute-time-alpha-fit-hr-50"
  | "absolute-time-alpha-fit-hr-60"
  | "absolute-time-alpha-fit-hr-75"
  | "absolute-time-alpha-fit-hr-90" {
  return `absolute-time-alpha-fit-hr-${heartRateBpm}`;
}

describe("main-wire ventricular calcium matched-alpha saturating heart-rate law V1", () => {
  it("owns one fixed main design and one distinct fixed prior-sensitivity design", () => {
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
    ).toEqual([
      "matched-alpha-saturating-hr-law-a040-hr-50",
      "matched-alpha-saturating-hr-law-a040-hr-60",
      "matched-alpha-saturating-hr-law-a040-hr-75",
      "matched-alpha-saturating-hr-law-a040-hr-90",
    ]);
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1,
    ).toEqual([
      "matched-alpha-saturating-hr-law-a025-hr-50",
      "matched-alpha-saturating-hr-law-a025-hr-90",
      "matched-alpha-saturating-hr-law-a066-hr-50",
      "matched-alpha-saturating-hr-law-a066-hr-90",
    ]);
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1,
    ).toEqual([
      ...MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
      ...MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1,
    ]);
    expect(
      Object.keys(
        MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILES_V1,
      ),
    ).toEqual(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1,
    );
  });

  it("implements the declared bounded formula exactly for every fixed profile", () => {
    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          profileId,
        );
      const coordinate =
        (profile.heartRateBpm - 60) / (profile.heartRateBpm + 60);
      const equivalentCoordinate = Math.tanh(
        0.5 * Math.log(profile.heartRateBpm / 60),
      );
      const scale = Math.exp(
        -profile.dimensionlessRateCoefficient * coordinate,
      );
      expect(profile.heartRateSaturationCoordinate).toBe(coordinate);
      expect(coordinate).toBeGreaterThan(-1);
      expect(coordinate).toBeLessThan(1);
      expect(coordinate).toBeCloseTo(equivalentCoordinate, 15);
      expect(profile.ventricularTimeConstantScaleFromHr60SourceFit).toBe(scale);
      expect(profile.ventricularRiseTimeConstantSec).toBe(
        SOURCE_TAU_SEC * scale,
      );
      expect(profile.ventricularDecayTimeConstantSec).toBe(
        SOURCE_TAU_SEC * scale,
      );
      expect(params.ventricular.riseTimeConstantSec).toBe(
        profile.ventricularRiseTimeConstantSec,
      );
      expect(params.ventricular.decayTimeConstantSec).toBe(
        profile.ventricularDecayTimeConstantSec,
      );
      expect(profile.globalMathematicalTimeConstantScaleLowerExclusive).toBe(
        Math.exp(-profile.dimensionlessRateCoefficient),
      );
      expect(profile.globalMathematicalTimeConstantScaleUpperExclusive).toBe(
        Math.exp(profile.dimensionlessRateCoefficient),
      );
      expect(scale).toBeGreaterThan(
        profile.globalMathematicalTimeConstantScaleLowerExclusive,
      );
      expect(scale).toBeLessThan(
        profile.globalMathematicalTimeConstantScaleUpperExclusive,
      );
      expect(profile.localLogTimeConstantVsLogHeartRateElasticityAtHr60).toBe(
        -0.5 * profile.dimensionlessRateCoefficient,
      );
      const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
        profile.cycleLengthSec,
        profile.ventricularRiseTimeConstantSec,
        profile.ventricularDecayTimeConstantSec,
      );
      expect(shape.shapeRegime).toBe("alpha-limit");
      expect(profile.ventricularPulseTimeToPeakSec).toBe(shape.timeToPeakSec);
      expect(profile.ventricularNormalizedPulseCycleIntegralSec).toBe(
        shape.normalizedPulseCycleIntegralSec,
      );
    }
  });

  it("pins the expected central-law values and remains weaker than R-R scaling", () => {
    const expectedByHeartRate = Object.freeze({
      50: Object.freeze({
        scale: 1.0370328808008222,
        tauSec: 0.1280477283184513,
      }),
      60: Object.freeze({
        scale: 1,
        tauSec: 0.1234750900275888,
      }),
      75: Object.freeze({
        scale: 0.9565287391030293,
        tauSec: 0.11810747217472255,
      }),
      90: Object.freeze({
        scale: 0.9231163463866358,
        tauSec: 0.1139818739760287,
      }),
    });
    const mainProfiles =
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1.map(
        (profileId) =>
          resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
            profileId,
          ),
      );
    for (const profile of mainProfiles) {
      const expected = expectedByHeartRate[profile.heartRateBpm];
      expect(profile.dimensionlessRateCoefficient).toBe(0.4);
      expect(profile.ventricularTimeConstantScaleFromHr60SourceFit).toBe(
        expected.scale,
      );
      expect(profile.ventricularRiseTimeConstantSec).toBe(expected.tauSec);
    }
    expect(
      mainProfiles.map((profile) => profile.ventricularRiseTimeConstantSec),
    ).toEqual(
      [...mainProfiles]
        .map((profile) => profile.ventricularRiseTimeConstantSec)
        .sort((left, right) => right - left),
    );
    expect(
      mainProfiles[0]!.ventricularTimeConstantScaleFromHr60SourceFit,
    ).toBeLessThan(1.2);
    expect(
      mainProfiles[3]!.ventricularTimeConstantScaleFromHr60SourceFit,
    ).toBeGreaterThan(2 / 3);
  });

  it("reuses the existing HR60 fixed absolute-time control by identity and bytes", () => {
    const existing =
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "absolute-time-alpha-fit-hr-60",
      );
    const resolved =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        "matched-alpha-saturating-hr-law-a040-hr-60",
      );
    const profile =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
        "matched-alpha-saturating-hr-law-a040-hr-60",
      );
    expect(resolved).toBe(existing);
    expect(JSON.stringify(resolved)).toBe(JSON.stringify(existing));
    expect(
      profile.hr60FixedAbsoluteTimeControlParamsIdentityReusedExactly,
    ).toBe(true);
    expect(profile.heartRateSaturationCoordinate).toBe(0);
    expect(profile.ventricularTimeConstantScaleFromHr60SourceFit).toBe(1);
    expect(profile.ventricularRiseTimeConstantSec).toBe(SOURCE_TAU_SEC);
    expect(profile.ventricularDecayTimeConstantSec).toBe(SOURCE_TAU_SEC);
  });

  it("changes no fixed-control calcium field other than both ventricular tau values", () => {
    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          profileId,
        );
      const control =
        resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
          fixedControlProfileId(profile.heartRateBpm),
        );
      expect(params.cycleLengthSec).toBe(control.cycleLengthSec);
      expect(params.atrioventricularDelaySec).toBe(0.12);
      expect(params.atrial).toBe(control.atrial);
      expect(params.ventricularSampledTrace).toBeUndefined();
      const {
        riseTimeConstantSec: _candidateRise,
        decayTimeConstantSec: _candidateDecay,
        ...candidateInvariant
      } = params.ventricular;
      const {
        riseTimeConstantSec: _controlRise,
        decayTimeConstantSec: _controlDecay,
        ...controlInvariant
      } = control.ventricular;
      expect(candidateInvariant).toEqual(controlInvariant);
      expect(params.ventricular.diastolicCalciumUM).toBe(
        control.ventricular.diastolicCalciumUM,
      );
      expect(params.ventricular.peakAmplitudeUM).toBe(
        control.ventricular.peakAmplitudeUM,
      );
      expect(params.ventricular.electricalToCalciumDelaySec).toBe(0.012);
      expect(profile.ventricularDiastolicCalciumUM).toBe(
        control.ventricular.diastolicCalciumUM,
      );
      expect(profile.ventricularPeakCalciumUM).toBe(
        control.ventricular.diastolicCalciumUM +
          control.ventricular.peakAmplitudeUM,
      );
      expect(Object.isFrozen(params)).toBe(true);
      expect(Object.isFrozen(profile)).toBe(true);
    }
  });

  it("keeps facts, mechanistic inference, and the fixed hypothesis distinct", () => {
    const evidence =
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_EVIDENCE_V1;
    expect(evidence.sourceFitAnchor).toMatchObject({
      classification: "source-derived-fact",
      doi: "10.1016/j.yjmcc.2017.03.008",
    });
    expect(
      evidence.humanRateTimingDirection.map((entry) => [
        entry.classification,
        entry.doi,
      ]),
    ).toEqual([
      ["data-supported-fact", "10.1152/ajpheart.00163.2019"],
      ["data-supported-fact", "10.1038/s42003-024-05886-3"],
    ]);
    expect(evidence.reducedOrderClosure).toMatchObject({
      classification: "mechanistic-inference",
      supportingDoi: "10.1371/journal.pcbi.1002061",
    });
    expect(evidence.boundedFunctionalFormAndCoefficient).toMatchObject({
      classification: "fixed-model-hypothesis",
      hemodynamicOutcomeUsed: false,
      parameterSearchOrFitting: false,
    });
    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1) {
      expect(
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
          profileId,
        ).evidence,
      ).toBe(evidence);
    }
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
    ).toMatchObject({
      exactHr60FixedAbsoluteTimeControlParamsIdentity: true,
      exactHr60SourceFitVentricularWaveformAndTimeConstantAnchor: true,
      riseAndDecayShareOneTimeConstant: true,
      separateFirstOrderRiseDecayHeartRateSlopesIntroduced: false,
      mathematicallyPositiveAndBoundedForEveryPositiveHeartRate: true,
      arbitraryNumericHeartRateOrCoefficientResolverExposed: false,
      parameterSearchOrFitting: false,
      hemodynamicOutcomeUsedToDeriveProfiles: false,
      newContinuousStateAdded: false,
    });
  });

  it("rejects every identifier outside the closed fixed catalog", () => {
    expect(() =>
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
        "matched-alpha-saturating-hr-law-a040-hr-55" as MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
      ),
    ).toThrow(/unsupported matched-alpha saturating heart-rate law profile/);
    expect(() =>
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        "__proto__" as MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
      ),
    ).toThrow(/unsupported matched-alpha saturating heart-rate law profile/);
  });
});
