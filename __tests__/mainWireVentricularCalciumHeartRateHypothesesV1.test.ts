import { describe, expect, it } from "vitest";

import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireAtrioventricularDelayCalciumParamsV1,
} from "@/engine/myocardium/calcium/MainWireAtrioventricularDelayBracketV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESES_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1,
  resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1,
  resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1,
  type MainWireVentricularCalciumHeartRateBpmV1,
  type MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniSourceTraceV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";

const EXPECTED_PROFILE_IDS = Object.freeze([
  "phase-scaled-coppini-hr-50",
  "phase-scaled-coppini-hr-60",
  "phase-scaled-coppini-hr-75",
  "phase-scaled-coppini-hr-90",
  "absolute-time-alpha-fit-hr-50",
  "absolute-time-alpha-fit-hr-60",
  "absolute-time-alpha-fit-hr-75",
  "absolute-time-alpha-fit-hr-90",
] as const);

const HEART_RATE_BY_PROFILE_ID = Object.freeze({
  "phase-scaled-coppini-hr-50": 50,
  "phase-scaled-coppini-hr-60": 60,
  "phase-scaled-coppini-hr-75": 75,
  "phase-scaled-coppini-hr-90": 90,
  "absolute-time-alpha-fit-hr-50": 50,
  "absolute-time-alpha-fit-hr-60": 60,
  "absolute-time-alpha-fit-hr-75": 75,
  "absolute-time-alpha-fit-hr-90": 90,
} satisfies Readonly<Record<
  MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
  MainWireVentricularCalciumHeartRateBpmV1
>>);

const PHASE_SCALED_IDS = Object.freeze([
  "phase-scaled-coppini-hr-50",
  "phase-scaled-coppini-hr-60",
  "phase-scaled-coppini-hr-75",
  "phase-scaled-coppini-hr-90",
] as const);

const ABSOLUTE_TIME_IDS = Object.freeze([
  "absolute-time-alpha-fit-hr-50",
  "absolute-time-alpha-fit-hr-60",
  "absolute-time-alpha-fit-hr-75",
  "absolute-time-alpha-fit-hr-90",
] as const);

describe("fixed ventricular calcium heart-rate hypotheses v1", () => {
  it("exposes only the fixed two-by-four catalog and rejects unknown ids", () => {
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1)
      .toEqual(EXPECTED_PROFILE_IDS);
    expect(Object.keys(
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1,
    )).toEqual(EXPECTED_PROFILE_IDS);
    expect(Object.isFrozen(
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1,
    )).toBe(true);
    expect(Object.isFrozen(
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1,
    )).toBe(true);
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESES_CLAIM_V1
        .genericHeartRateOrCalciumInputExposed,
    ).toBe(false);
    expect(() =>
      resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
        "unknown" as MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
      )).toThrow(/unsupported ventricular calcium heart-rate hypothesis/);
    expect(() =>
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "__proto__" as MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
      )).toThrow(/unsupported ventricular calcium heart-rate hypothesis/);
  });

  it("holds R-R timing, AV delay, and atrial calcium invariants exactly", () => {
    const coppiniAv120 =
      resolveMainWireAtrioventricularDelayCalciumParamsV1(
        "coppini-source-atrioventricular-delay-120ms",
      );
    for (const profileId of EXPECTED_PROFILE_IDS) {
      const profile =
        resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
          profileId,
        );
      const heartRateBpm = HEART_RATE_BY_PROFILE_ID[profileId];
      expect(profile.profileId).toBe(profileId);
      expect(profile.heartRateBpm).toBe(heartRateBpm);
      expect(profile.cycleLengthSec).toBe(60 / heartRateBpm);
      expect(params.cycleLengthSec).toBe(60 / heartRateBpm);
      expect(profile.atrioventricularDelaySec).toBe(0.12);
      expect(params.atrioventricularDelaySec).toBe(0.12);
      expect(params.atrial).toEqual(coppiniAv120.atrial);
      expect(profile.atrialAmplitudeAndPhysicalTimeConstantsRetainedExactly)
        .toBe(true);
      expect(profile.hemodynamicOutcomeUsedToDeriveProfile).toBe(false);
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(params)).toBe(true);

      const atStart = evaluateFiveWallNormalCalciumDriveV1(0, params);
      const atPeriodicEndpoint = evaluateFiveWallNormalCalciumDriveV1(
        params.cycleLengthSec,
        params,
      );
      for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
        expect(atPeriodicEndpoint.freeCalciumUMByWall[wall]).toBeCloseTo(
          atStart.freeCalciumUMByWall[wall],
          14,
        );
      }
    }
  });

  it("maps the exact Coppini values over phase without truncation", () => {
    const sourceMinimum = Math.min(
      ...MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1,
    );
    const sourceMaximum = Math.max(
      ...MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1,
    );
    const firstPeakIndex =
      MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1.findIndex(
        (calciumUM) => calciumUM === sourceMaximum,
      );
    expect(firstPeakIndex).toBe(129);

    for (const profileId of PHASE_SCALED_IDS) {
      const profile =
        resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
          profileId,
        );
      const trace = params.ventricularSampledTrace;
      expect(profile.hypothesisId).toBe("phase-scaled-coppini");
      if (profile.hypothesisId !== "phase-scaled-coppini") {
        throw new Error("expected the phase-scaled hypothesis");
      }
      expect(trace).toBeDefined();
      if (trace === undefined) throw new Error("sampled trace is required");
      expect(trace.samplesUM).toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1,
      );
      expect(trace.samplesUM).toHaveLength(1001);
      expect(trace.samplesUM[0]).toBe(0.166);
      expect(trace.samplesUM.at(-1)).toBe(0.166);
      expect(Math.min(...trace.samplesUM)).toBe(0.164);
      expect(Math.max(...trace.samplesUM)).toBe(0.594);
      expect(trace.minimumCalciumUM).toBe(sourceMinimum);
      expect(trace.amplitudeUM).toBeCloseTo(
        sourceMaximum - sourceMinimum,
        15,
      );
      expect(trace.sampleIntervalSec).toBe(
        params.cycleLengthSec / 1000,
      );
      expect(trace.sampleIntervalSec * (trace.samplesUM.length - 1)).toBe(
        params.cycleLengthSec,
      );
      expect(profile.sampleIntervalSec).toBe(trace.sampleIntervalSec);
      expect(profile.ventricularPulseTimeToPeakSec).toBe(
        firstPeakIndex * trace.sampleIntervalSec,
      );

      const atFirstPeak = evaluateFiveWallNormalCalciumDriveV1(
        firstPeakIndex * trace.sampleIntervalSec,
        params,
      );
      expect(atFirstPeak.freeCalciumUMByWall.LVFW).toBeCloseTo(0.594, 14);
      expect(atFirstPeak.freeCalciumUMByWall.SEP).toBeCloseTo(0.594, 14);
      expect(atFirstPeak.freeCalciumUMByWall.RVFW).toBeCloseTo(0.594, 14);
    }
  });

  it("keeps the HR60 phase-scaled arm at the existing Coppini AV120 identity", () => {
    const existingAv120 =
      resolveMainWireAtrioventricularDelayCalciumParamsV1(
        "coppini-source-atrioventricular-delay-120ms",
      );
    const resolved =
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "phase-scaled-coppini-hr-60",
      );
    expect(resolved).toEqual(existingAv120);
    expect(resolved.parameterSetId).toBe(existingAv120.parameterSetId);
    expect(resolved.ventricularSampledTrace?.traceId).toBe(
      existingAv120.ventricularSampledTrace?.traceId,
    );
    expect(resolved.cycleLengthSec).toBe(1);
    expect(resolved.atrioventricularDelaySec).toBe(0.12);
    expect(
      resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
        "phase-scaled-coppini-hr-60",
      ),
    ).toBe(resolved);
  });

  it("holds the alpha-fit calcium in absolute seconds without a sampled trace", () => {
    for (const profileId of ABSOLUTE_TIME_IDS) {
      const profile =
        resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
          profileId,
        );
      expect(profile.hypothesisId).toBe("absolute-time-alpha-fit");
      if (profile.hypothesisId !== "absolute-time-alpha-fit") {
        throw new Error("expected the absolute-time hypothesis");
      }
      expect(params.ventricularSampledTrace).toBeUndefined();
      expect(params.atrial).toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1.atrial,
      );
      expect(params.ventricular).toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1.ventricular,
      );
      expect(params.ventricular.riseTimeConstantSec).toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
          .ventricularRiseTimeConstantSec,
      );
      expect(params.ventricular.decayTimeConstantSec).toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
          .ventricularDecayTimeConstantSec,
      );
      expect(params.ventricular.diastolicCalciumUM).toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
          .ventricularDiastolicCalciumUM,
      );
      expect(
        params.ventricular.diastolicCalciumUM
        + params.ventricular.peakAmplitudeUM,
      ).toBeCloseTo(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
          .ventricularPeakCalciumUM,
        15,
      );
      expect(profile.ventricularShapeRegime).toBe("alpha-limit");
      expect(profile.sourceFitPhysicalTimeConstantsRetainedExactly).toBe(true);
      expect(profile.periodicCarryRecomputedForCycleLength).toBe(true);
    }
  });

  it("retains fixed phase-scaled time-to-peak and integral anchors", () => {
    const expected = Object.freeze({
      "phase-scaled-coppini-hr-50": Object.freeze({
        timeToPeakSec: 0.1548,
        normalizedIntegralSec: 0.3944818604651155,
      }),
      "phase-scaled-coppini-hr-60": Object.freeze({
        timeToPeakSec: 0.129,
        normalizedIntegralSec: 0.32873488372092957,
      }),
      "phase-scaled-coppini-hr-75": Object.freeze({
        timeToPeakSec: 0.1032,
        normalizedIntegralSec: 0.26298790697674365,
      }),
      "phase-scaled-coppini-hr-90": Object.freeze({
        timeToPeakSec: 0.086,
        normalizedIntegralSec: 0.21915658914728638,
      }),
    });
    for (const profileId of PHASE_SCALED_IDS) {
      const profile =
        resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
          profileId,
        );
      const anchor = expected[profileId];
      expect(profile.ventricularPulseTimeToPeakSec).toBeCloseTo(
        anchor.timeToPeakSec,
        14,
      );
      expect(profile.ventricularNormalizedPulseCycleIntegralSec).toBeCloseTo(
        anchor.normalizedIntegralSec,
        14,
      );
      expect(
        profile.ventricularPulseTimeToPeakSec / profile.cycleLengthSec,
      ).toBeCloseTo(0.129, 14);
      expect(
        profile.ventricularNormalizedPulseCycleIntegralSec
        / profile.cycleLengthSec,
      ).toBeCloseTo(0.32873488372092957, 14);
    }
  });

  it("retains fixed absolute-time alpha-limit shape anchors", () => {
    const expected = Object.freeze({
      "absolute-time-alpha-fit-hr-50": Object.freeze({
        timeToPeakSec: 0.12340289776688516,
        normalizedIntegralSec: 0.3340482804762895,
      }),
      "absolute-time-alpha-fit-hr-60": Object.freeze({
        timeToPeakSec: 0.12317109389284538,
        normalizedIntegralSec: 0.33024172945133784,
      }),
      "absolute-time-alpha-fit-hr-75": Object.freeze({
        timeToPeakSec: 0.12224497390336185,
        normalizedIntegralSec: 0.31890337470708874,
      }),
      "absolute-time-alpha-fit-hr-90": Object.freeze({
        timeToPeakSec: 0.12044794199129558,
        normalizedIntegralSec: 0.30233956007948404,
      }),
    });
    for (const profileId of ABSOLUTE_TIME_IDS) {
      const profile =
        resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
          profileId,
        );
      const anchor = expected[profileId];
      expect(profile.ventricularPulseTimeToPeakSec).toBeCloseTo(
        anchor.timeToPeakSec,
        14,
      );
      expect(profile.ventricularNormalizedPulseCycleIntegralSec).toBeCloseTo(
        anchor.normalizedIntegralSec,
        14,
      );
    }
  });
});
