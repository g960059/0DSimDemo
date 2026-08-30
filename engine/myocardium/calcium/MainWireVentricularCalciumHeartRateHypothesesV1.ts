import {
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireAtrioventricularDelayCalciumParamsV1,
} from "@/engine/myocardium/calcium/MainWireAtrioventricularDelayBracketV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniSourceTraceV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESES_V1_ID =
  "main-wire-ventricular-calcium-heart-rate-hypotheses-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1 =
  Object.freeze([50, 60, 75, 90] as const);

export type MainWireVentricularCalciumHeartRateBpmV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_IDS_V1 =
  Object.freeze([
    "phase-scaled-coppini",
    "absolute-time-alpha-fit",
  ] as const);

export type MainWireVentricularCalciumHeartRateHypothesisIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1 =
  Object.freeze([
    "phase-scaled-coppini-hr-50",
    "phase-scaled-coppini-hr-60",
    "phase-scaled-coppini-hr-75",
    "phase-scaled-coppini-hr-90",
    "absolute-time-alpha-fit-hr-50",
    "absolute-time-alpha-fit-hr-60",
    "absolute-time-alpha-fit-hr-75",
    "absolute-time-alpha-fit-hr-90",
  ] as const);

export type MainWireVentricularCalciumHeartRateHypothesisProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1)[number];

type CommonHeartRateProfileV1 = Readonly<{
  profileId:
    MainWireVentricularCalciumHeartRateHypothesisProfileIdV1;
  hypothesisId: MainWireVentricularCalciumHeartRateHypothesisIdV1;
  heartRateBpm: MainWireVentricularCalciumHeartRateBpmV1;
  cycleLengthSec: number;
  atrioventricularDelaySec: 0.12;
  atrialAmplitudeAndPhysicalTimeConstantsRetainedExactly: true;
  ventricularPulseTimeToPeakSec: number;
  ventricularNormalizedPulseCycleIntegralSec: number;
  fixedDiscreteCandidate: true;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

export type MainWireVentricularCalciumPhaseScaledCoppiniHeartRateProfileV1 =
  CommonHeartRateProfileV1 & Readonly<{
    hypothesisId: "phase-scaled-coppini";
    waveformTimePolicy:
      "exact-source-samples-uniformly-mapped-over-one-r-r-interval";
    sourceTraceId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1.profileId;
    ventricularNumericSourceTraceUsed: true;
    sourceSamplesRetainedExactly: true;
    sourceSampleCountIncludingPeriodicEndpoint: 1001;
    sourceFirstAndPeriodicEndpointCalciumUM: 0.166;
    sourceMinimumCalciumUM: 0.164;
    sourceMaximumCalciumUM: 0.594;
    sourceAmplitudeUM: 0.43;
    sampleIntervalSec: number;
    sourcePhysicalTimingRetainedExactly: boolean;
    physiologicalRateAdaptationClaimed: false;
  }>;

export type MainWireVentricularCalciumAbsoluteTimeAlphaFitHeartRateProfileV1 =
  CommonHeartRateProfileV1 & Readonly<{
    hypothesisId: "absolute-time-alpha-fit";
    waveformTimePolicy:
      "fixed-absolute-time-constants-with-periodic-carry-at-each-r-r-interval";
    sourceFitProfileId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.profileId;
    ventricularNumericSourceTraceUsed: false;
    ventricularShapeRegime: "alpha-limit";
    ventricularRiseTimeConstantSec: number;
    ventricularDecayTimeConstantSec: number;
    sourceFitPhysicalTimeConstantsRetainedExactly: true;
    periodicCarryRecomputedForCycleLength: true;
    physiologicalRateAdaptationClaimed: false;
  }>;

export type MainWireVentricularCalciumHeartRateHypothesisProfileV1 =
  | MainWireVentricularCalciumPhaseScaledCoppiniHeartRateProfileV1
  | MainWireVentricularCalciumAbsoluteTimeAlphaFitHeartRateProfileV1;

const FIXED_ATRIOVENTRICULAR_DELAY_SEC = 0.12 as const;
const SOURCE_TRACE =
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_V1;
const SOURCE_TRACE_MINIMUM_UM =
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1
    .sourceMinimumCalciumUM;
const SOURCE_TRACE_AMPLITUDE_UM =
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1
    .sourceMaximumCalciumUM - SOURCE_TRACE_MINIMUM_UM;
const SOURCE_TRACE_FIRST_PEAK_INDEX = SOURCE_TRACE.indexOf(
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1
    .sourceMaximumCalciumUM,
);

if (SOURCE_TRACE_FIRST_PEAK_INDEX < 0) {
  throw new Error("Coppini source trace must contain its declared maximum");
}

function sourceTraceNormalizedIntegralAtIntervalSec(
  sampleIntervalSec: number,
): number {
  let trapezoidSum = 0;
  for (let index = 0; index < SOURCE_TRACE.length - 1; index += 1) {
    const lower = (
      SOURCE_TRACE[index]! - SOURCE_TRACE_MINIMUM_UM
    ) / SOURCE_TRACE_AMPLITUDE_UM;
    const upper = (
      SOURCE_TRACE[index + 1]! - SOURCE_TRACE_MINIMUM_UM
    ) / SOURCE_TRACE_AMPLITUDE_UM;
    trapezoidSum += 0.5 * (lower + upper);
  }
  return sampleIntervalSec * trapezoidSum;
}

function cycleLengthSec(
  heartRateBpm: MainWireVentricularCalciumHeartRateBpmV1,
): number {
  return 60 / heartRateBpm;
}

function phaseScaledProfile(
  profileId:
    MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
  heartRateBpm: MainWireVentricularCalciumHeartRateBpmV1,
): MainWireVentricularCalciumPhaseScaledCoppiniHeartRateProfileV1 {
  const cycle = cycleLengthSec(heartRateBpm);
  const sampleIntervalSec = cycle / (SOURCE_TRACE.length - 1);
  return Object.freeze({
    profileId,
    hypothesisId: "phase-scaled-coppini" as const,
    heartRateBpm,
    cycleLengthSec: cycle,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrialAmplitudeAndPhysicalTimeConstantsRetainedExactly: true as const,
    waveformTimePolicy:
      "exact-source-samples-uniformly-mapped-over-one-r-r-interval" as const,
    sourceTraceId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1
        .profileId,
    ventricularNumericSourceTraceUsed: true as const,
    sourceSamplesRetainedExactly: true as const,
    sourceSampleCountIncludingPeriodicEndpoint: 1001 as const,
    sourceFirstAndPeriodicEndpointCalciumUM: 0.166 as const,
    sourceMinimumCalciumUM: 0.164 as const,
    sourceMaximumCalciumUM: 0.594 as const,
    sourceAmplitudeUM: 0.43 as const,
    sampleIntervalSec,
    sourcePhysicalTimingRetainedExactly: heartRateBpm === 60,
    ventricularPulseTimeToPeakSec:
      SOURCE_TRACE_FIRST_PEAK_INDEX * sampleIntervalSec,
    ventricularNormalizedPulseCycleIntegralSec:
      sourceTraceNormalizedIntegralAtIntervalSec(sampleIntervalSec),
    physiologicalRateAdaptationClaimed: false as const,
    fixedDiscreteCandidate: true as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

function absoluteTimeAlphaFitProfile(
  profileId:
    MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
  heartRateBpm: MainWireVentricularCalciumHeartRateBpmV1,
): MainWireVentricularCalciumAbsoluteTimeAlphaFitHeartRateProfileV1 {
  const cycle = cycleLengthSec(heartRateBpm);
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    cycle,
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
      .ventricularRiseTimeConstantSec,
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
      .ventricularDecayTimeConstantSec,
  );
  if (shape.shapeRegime !== "alpha-limit") {
    throw new Error("absolute-time calcium hypothesis must use the alpha limit");
  }
  return Object.freeze({
    profileId,
    hypothesisId: "absolute-time-alpha-fit" as const,
    heartRateBpm,
    cycleLengthSec: cycle,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrialAmplitudeAndPhysicalTimeConstantsRetainedExactly: true as const,
    waveformTimePolicy:
      "fixed-absolute-time-constants-with-periodic-carry-at-each-r-r-interval" as const,
    sourceFitProfileId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.profileId,
    ventricularNumericSourceTraceUsed: false as const,
    ventricularShapeRegime: shape.shapeRegime,
    ventricularRiseTimeConstantSec:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
        .ventricularRiseTimeConstantSec,
    ventricularDecayTimeConstantSec:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1
        .ventricularDecayTimeConstantSec,
    sourceFitPhysicalTimeConstantsRetainedExactly: true as const,
    periodicCarryRecomputedForCycleLength: true as const,
    ventricularPulseTimeToPeakSec: shape.timeToPeakSec,
    ventricularNormalizedPulseCycleIntegralSec:
      shape.normalizedPulseCycleIntegralSec,
    physiologicalRateAdaptationClaimed: false as const,
    fixedDiscreteCandidate: true as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1 =
  Object.freeze({
    "phase-scaled-coppini-hr-50": phaseScaledProfile(
      "phase-scaled-coppini-hr-50",
      50,
    ),
    "phase-scaled-coppini-hr-60": phaseScaledProfile(
      "phase-scaled-coppini-hr-60",
      60,
    ),
    "phase-scaled-coppini-hr-75": phaseScaledProfile(
      "phase-scaled-coppini-hr-75",
      75,
    ),
    "phase-scaled-coppini-hr-90": phaseScaledProfile(
      "phase-scaled-coppini-hr-90",
      90,
    ),
    "absolute-time-alpha-fit-hr-50": absoluteTimeAlphaFitProfile(
      "absolute-time-alpha-fit-hr-50",
      50,
    ),
    "absolute-time-alpha-fit-hr-60": absoluteTimeAlphaFitProfile(
      "absolute-time-alpha-fit-hr-60",
      60,
    ),
    "absolute-time-alpha-fit-hr-75": absoluteTimeAlphaFitProfile(
      "absolute-time-alpha-fit-hr-75",
      75,
    ),
    "absolute-time-alpha-fit-hr-90": absoluteTimeAlphaFitProfile(
      "absolute-time-alpha-fit-hr-90",
      90,
    ),
  } satisfies Readonly<Record<
    MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
    MainWireVentricularCalciumHeartRateHypothesisProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESES_CLAIM_V1 =
  Object.freeze({
    role: "fixed-paired-heart-rate-calcium-timing-hypotheses" as const,
    heartRatesBpm:
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrioventricularDelayHeldInAbsoluteSeconds: true as const,
    atrialAmplitudeAndPhysicalTimeConstantsHeldExactly: true as const,
    phaseScaledHypothesis:
      "exact-Coppini-values-preserved-and-uniformly-mapped-over-each-r-r-interval" as const,
    absoluteTimeHypothesis:
      "existing-whole-trace-alpha-fit-time-constants-held-in-absolute-seconds" as const,
    absoluteTimePeriodicCarryRecomputedAtEachHeartRate: true as const,
    comparisonsMustUseWithinHypothesisHeartRateDeltas: true as const,
    physiologicalRateAdaptationClaimed: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericHeartRateOrCalciumInputExposed: false as const,
    fixedDiscreteCandidatesOnly: true as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

const COPPINI_AV120_PARAMS =
  resolveMainWireAtrioventricularDelayCalciumParamsV1(
    "coppini-source-atrioventricular-delay-120ms",
  );

function phaseScaledParams(
  profileId:
    | "phase-scaled-coppini-hr-50"
    | "phase-scaled-coppini-hr-60"
    | "phase-scaled-coppini-hr-75"
    | "phase-scaled-coppini-hr-90",
): FiveWallNormalCalciumDriveParamsV1 {
  if (profileId === "phase-scaled-coppini-hr-60") {
    return COPPINI_AV120_PARAMS;
  }
  const profile = MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1[
    profileId
  ];
  const sourceTrace = COPPINI_AV120_PARAMS.ventricularSampledTrace;
  if (sourceTrace === undefined) {
    throw new Error("Coppini AV120 profile must retain its sampled trace");
  }
  return Object.freeze({
    parameterSetId: `${COPPINI_AV120_PARAMS.parameterSetId}-${profileId}-v1`,
    cycleLengthSec: profile.cycleLengthSec,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrial: COPPINI_AV120_PARAMS.atrial,
    ventricular: COPPINI_AV120_PARAMS.ventricular,
    ventricularSampledTrace: Object.freeze({
      ...sourceTrace,
      traceId: `${sourceTrace.traceId}-${profileId}-v1`,
      sampleIntervalSec: profile.sampleIntervalSec,
      samplesUM: SOURCE_TRACE,
    }),
  });
}

function absoluteTimeAlphaFitParams(
  profileId:
    | "absolute-time-alpha-fit-hr-50"
    | "absolute-time-alpha-fit-hr-60"
    | "absolute-time-alpha-fit-hr-75"
    | "absolute-time-alpha-fit-hr-90",
): FiveWallNormalCalciumDriveParamsV1 {
  const profile = MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1[
    profileId
  ];
  return Object.freeze({
    parameterSetId:
      `${MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1.parameterSetId}`
      + `-atrioventricular-delay-120ms-${profileId}-v1`,
    cycleLengthSec: profile.cycleLengthSec,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrial: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1.atrial,
    ventricular:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PARAMS_V1.ventricular,
  });
}

const PARAMS_BY_PROFILE_ID = Object.freeze({
  "phase-scaled-coppini-hr-50": phaseScaledParams(
    "phase-scaled-coppini-hr-50",
  ),
  "phase-scaled-coppini-hr-60": phaseScaledParams(
    "phase-scaled-coppini-hr-60",
  ),
  "phase-scaled-coppini-hr-75": phaseScaledParams(
    "phase-scaled-coppini-hr-75",
  ),
  "phase-scaled-coppini-hr-90": phaseScaledParams(
    "phase-scaled-coppini-hr-90",
  ),
  "absolute-time-alpha-fit-hr-50": absoluteTimeAlphaFitParams(
    "absolute-time-alpha-fit-hr-50",
  ),
  "absolute-time-alpha-fit-hr-60": absoluteTimeAlphaFitParams(
    "absolute-time-alpha-fit-hr-60",
  ),
  "absolute-time-alpha-fit-hr-75": absoluteTimeAlphaFitParams(
    "absolute-time-alpha-fit-hr-75",
  ),
  "absolute-time-alpha-fit-hr-90": absoluteTimeAlphaFitParams(
    "absolute-time-alpha-fit-hr-90",
  ),
} satisfies Readonly<Record<
  MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
  FiveWallNormalCalciumDriveParamsV1
>>);

export function resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
  profileId: MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
): MainWireVentricularCalciumHeartRateHypothesisProfileV1 {
  if (!Object.prototype.hasOwnProperty.call(
    MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1,
    profileId,
  )) {
    throw new Error(
      `unsupported ventricular calcium heart-rate hypothesis profile: ${String(profileId)}`,
    );
  }
  return MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILES_V1[
    profileId
  ];
}

export function resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
  profileId: MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (!Object.prototype.hasOwnProperty.call(PARAMS_BY_PROFILE_ID, profileId)) {
    throw new Error(
      `unsupported ventricular calcium heart-rate hypothesis profile: ${String(profileId)}`,
    );
  }
  return PARAMS_BY_PROFILE_ID[profileId];
}
