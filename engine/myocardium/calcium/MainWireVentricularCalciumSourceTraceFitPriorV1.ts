import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PRIOR_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-prior-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1_ID =
  "land2017-figure6-whole-trace-alpha-fit" as const;

/**
 * Fixed result of the versioned source-only fitting method. The engine owns
 * these exact numerical semantics; the analysis method independently audits
 * that they remain reproducible from the digitized evidence.
 */
export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1 =
  Object.freeze({
    profileId: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1_ID,
    derivationMethodId:
      "main-wire-ventricular-calcium-source-trace-fit-v1" as const,
    sourceTraceId:
      "land2017-figure6-coppini-calcium-trace-v1" as const,
    sourceDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    sourceFigure: "Figure 6 left panel" as const,
    amplitudePolicy: "source-digitized-extrema-locked" as const,
    ventricularDiastolicCalciumUM: 0.164321,
    ventricularPeakCalciumUM: 0.592586,
    ventricularRiseTimeConstantSec: 0.1234750900275888,
    ventricularDecayTimeConstantSec: 0.1234750900275888,
    sourceTraceOnsetOffsetSec: 0.007222906291484831,
    sourceTraceOnsetOffsetChangesElectricalToCalciumDelay: false as const,
    ventricularElectricalToCalciumDelaySec:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
        .electricalToCalciumDelaySec,
    atrialCalciumParamsChanged: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    landTensionOutcomeUsedToDeriveProfile: false as const,
    figureDigitizationUsed: true as const,
    originalNumericSourceTraceUsed: false as const,
  });

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PRIOR_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-whole-trace-low-order-research-prior" as const,
    sourceFitMethodId:
      "main-wire-ventricular-calcium-source-trace-fit-v1" as const,
    waveformFamily:
      "periodic-normalized-biexponential-exact-alpha-limit" as const,
    sourceTraceAmplitudeConstraint:
      "digitized-minimum-and-maximum-locked" as const,
    sourceTraceTimingFit:
      "whole-trace-time-constants-and-source-onset-offset" as const,
    sourceOnsetOffsetIsElectricalDelay: false as const,
    ventricularElectricalToCalciumDelayChanged: false as const,
    atrialCalciumParamsChanged: false as const,
    calciumOrMechanicsStateAdded: false as const,
    hemodynamicOutcomeUsed: false as const,
    landTensionOutcomeUsed: false as const,
    sourceMeasurementCovarianceAvailable: false as const,
    originalNumericSourceTraceUsed: false as const,
    figureDigitizationUsed: true as const,
    clinicalValidationClaimed: false as const,
    canonicalParamsChanged: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitProfileV1 =
  typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;

const PROFILE = MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;
const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1:
  FiveWallNormalCalciumDriveParamsV1 = Object.freeze({
    parameterSetId:
      "five-wall-normal-calcium-land2017-figure6-whole-trace-alpha-fit-v1",
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      diastolicCalciumUM: PROFILE.ventricularDiastolicCalciumUM,
      peakAmplitudeUM:
        PROFILE.ventricularPeakCalciumUM
        - PROFILE.ventricularDiastolicCalciumUM,
      riseTimeConstantSec: PROFILE.ventricularRiseTimeConstantSec,
      decayTimeConstantSec: PROFILE.ventricularDecayTimeConstantSec,
    }),
  });

const SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PROFILE.ventricularRiseTimeConstantSec,
  PROFILE.ventricularDecayTimeConstantSec,
);
if (SHAPE.shapeRegime !== "alpha-limit") {
  throw new Error("source trace fit prior must resolve to the exact alpha limit");
}

export function resolveMainWireVentricularCalciumSourceTraceFitParamsV1():
  FiveWallNormalCalciumDriveParamsV1 {
  return MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1;
}
