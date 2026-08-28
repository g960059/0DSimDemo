import land2017Figure6Trace from
  "@/data/myocardium/source-traces/land2017-figure6-coppini-calcium-trace-v1.json";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_V1_ID =
  "main-wire-ventricular-calcium-source-constrained-prior-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "land2017-figure6-source-constrained-biexponential",
  ] as const);

export type MainWireVentricularCalciumSourceConstrainedProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumSourceConstrainedProfileV1 = Readonly<{
  profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1;
  derivation:
    | "canonical-control"
    | "source-extrema-and-time-to-peak-with-prior-shape-ratio-held";
  ventricularDiastolicCalciumUM: number;
  ventricularPeakCalciumUM: number;
  ventricularPulseTimeToPeakSec: number;
  ventricularCommonTimeConstantScaleFromPrior: number;
  ventricularRiseToDecayTimeConstantRatioHeld: boolean;
  atrialCalciumParamsChanged: false;
  ventricularElectricalToCalciumDelayChanged: false;
  originalNumericSourceTraceUsed: false;
  figureDigitizationUsed: boolean;
  wholeTraceCurveFittingUsed: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const SOURCE_READBACK = land2017Figure6Trace.extractionReadback;
const SOURCE_TIME_SCALE = solveCommonTimeScaleForPulsePeak(
  SOURCE_READBACK.maximumSampleTimeSec,
);

const PROFILES = Object.freeze({
  canonical: createProfile(
    "canonical",
    "canonical-control",
    PRIOR.ventricular.diastolicCalciumUM,
    PRIOR.ventricular.diastolicCalciumUM
      + PRIOR.ventricular.peakAmplitudeUM,
    1,
    false,
  ),
  "land2017-figure6-source-constrained-biexponential": createProfile(
    "land2017-figure6-source-constrained-biexponential",
    "source-extrema-and-time-to-peak-with-prior-shape-ratio-held",
    SOURCE_READBACK.minimumCalciumUM,
    SOURCE_READBACK.maximumCalciumUM,
    SOURCE_TIME_SCALE,
    true,
  ),
} satisfies Readonly<Record<
  MainWireVentricularCalciumSourceConstrainedProfileIdV1,
  MainWireVentricularCalciumSourceConstrainedProfileV1
>>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-constrained-low-order-research-prior" as const,
    sourceTraceId: land2017Figure6Trace.traceId,
    sourceDoi: land2017Figure6Trace.source.doi,
    sourceFigure: land2017Figure6Trace.source.figure,
    matchedSourceScalars: Object.freeze([
      "minimum-calcium",
      "maximum-calcium",
      "time-to-maximum-calcium",
    ] as const),
    priorShapeConstraint:
      "canonical-rise-to-decay-time-constant-ratio-held" as const,
    sourceMetricMatchingUsesHemodynamics: false as const,
    wholeTraceLeastSquaresFitApplied: false as const,
    sourceMeasurementUncertaintyAvailable: false as const,
    originalNumericSourceTraceUsed: false as const,
    figureDigitizationUsed: true as const,
    calciumOrMechanicsStateAdded: false as const,
    atrialCalciumParamsChanged: false as const,
    ventricularElectricalToCalciumDelayChanged: false as const,
    canonicalParamsChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularCalciumSourceConstrainedProfileV1(
  profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1,
): MainWireVentricularCalciumSourceConstrainedProfileV1 {
  const profile = PROFILES[profileId];
  if (profile === undefined) {
    throw new Error(
      `unsupported source-constrained ventricular calcium profile: ${String(profileId)}`,
    );
  }
  return profile;
}

export function resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
  profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (profileId === "canonical") return PRIOR;
  const profile = resolveMainWireVentricularCalciumSourceConstrainedProfileV1(
    profileId,
  );
  return Object.freeze({
    parameterSetId:
      "five-wall-normal-calcium-land2017-figure6-source-constrained-biexponential-v1",
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      diastolicCalciumUM: profile.ventricularDiastolicCalciumUM,
      peakAmplitudeUM:
        profile.ventricularPeakCalciumUM
        - profile.ventricularDiastolicCalciumUM,
      riseTimeConstantSec:
        PRIOR.ventricular.riseTimeConstantSec
        * profile.ventricularCommonTimeConstantScaleFromPrior,
      decayTimeConstantSec:
        PRIOR.ventricular.decayTimeConstantSec
        * profile.ventricularCommonTimeConstantScaleFromPrior,
    }),
  });
}

function createProfile(
  profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1,
  derivation: MainWireVentricularCalciumSourceConstrainedProfileV1["derivation"],
  ventricularDiastolicCalciumUM: number,
  ventricularPeakCalciumUM: number,
  ventricularCommonTimeConstantScaleFromPrior: number,
  figureDigitizationUsed: boolean,
): MainWireVentricularCalciumSourceConstrainedProfileV1 {
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec
      * ventricularCommonTimeConstantScaleFromPrior,
    PRIOR.ventricular.decayTimeConstantSec
      * ventricularCommonTimeConstantScaleFromPrior,
  );
  return Object.freeze({
    profileId,
    derivation,
    ventricularDiastolicCalciumUM,
    ventricularPeakCalciumUM,
    ventricularPulseTimeToPeakSec: shape.timeToPeakSec,
    ventricularCommonTimeConstantScaleFromPrior,
    ventricularRiseToDecayTimeConstantRatioHeld: true,
    atrialCalciumParamsChanged: false as const,
    ventricularElectricalToCalciumDelayChanged: false as const,
    originalNumericSourceTraceUsed: false as const,
    figureDigitizationUsed,
    wholeTraceCurveFittingUsed: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

function solveCommonTimeScaleForPulsePeak(targetTimeToPeakSec: number): number {
  if (!(targetTimeToPeakSec > 0 && targetTimeToPeakSec < 0.5)) {
    throw new Error("source calcium time to peak must be within (0, 0.5) s");
  }
  const timeToPeak = (scale: number): number =>
    measurePeriodicBiexponentialCalciumPulseShapeV1(
      PRIOR.cycleLengthSec,
      PRIOR.ventricular.riseTimeConstantSec * scale,
      PRIOR.ventricular.decayTimeConstantSec * scale,
    ).timeToPeakSec;
  let lower = 0.25;
  let upper = 3;
  if (!(timeToPeak(lower) < targetTimeToPeakSec
    && timeToPeak(upper) > targetTimeToPeakSec)) {
    throw new Error("source calcium time to peak is outside the fixed scale bracket");
  }
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (timeToPeak(midpoint) < targetTimeToPeakSec) lower = midpoint;
    else upper = midpoint;
  }
  return (lower + upper) / 2;
}
