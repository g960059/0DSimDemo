import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1,
  resolveMainWireVentricularCalciumLandCoppiniSourceTraceParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniSourceTraceV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_BRACKET_V1_ID =
  "main-wire-ventricular-calcium-land-coppini-amplitude-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_PROFILE_IDS_V1 =
  Object.freeze([
    "land-coppini-amplitude-source",
    "land-coppini-amplitude-five-quarters",
    "land-coppini-amplitude-three-halves",
    "land-coppini-amplitude-seven-quarters",
    "land-coppini-amplitude-twofold",
  ] as const);

export type MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumLandCoppiniAmplitudeProfileV1 =
  Readonly<{
    profileId:
      MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1;
    supraminimumAmplitudeScaleFromSource: 1 | 1.25 | 1.5 | 1.75 | 2;
    minimumCalciumUM: 0.164;
    sourceAmplitudeUM: 0.43;
    resolvedAmplitudeUM: number;
    resolvedPeakCalciumUM: number;
    sourceTraceShapeAndPhaseRetainedExactly: true;
    sourceTraceAbsoluteAmplitudeRetained: boolean;
    hemodynamicOutcomeUsedToDeriveProfile: false;
  }>;

function profile(
  profileId: MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1,
  scale: 1 | 1.25 | 1.5 | 1.75 | 2,
): MainWireVentricularCalciumLandCoppiniAmplitudeProfileV1 {
  const minimumCalciumUM = 0.164 as const;
  const sourceAmplitudeUM = 0.43 as const;
  const resolvedAmplitudeUM = sourceAmplitudeUM * scale;
  return Object.freeze({
    profileId,
    supraminimumAmplitudeScaleFromSource: scale,
    minimumCalciumUM,
    sourceAmplitudeUM,
    resolvedAmplitudeUM,
    resolvedPeakCalciumUM: minimumCalciumUM + resolvedAmplitudeUM,
    sourceTraceShapeAndPhaseRetainedExactly: true as const,
    sourceTraceAbsoluteAmplitudeRetained: scale === 1,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

const PROFILES = Object.freeze({
  "land-coppini-amplitude-source": profile(
    "land-coppini-amplitude-source",
    1,
  ),
  "land-coppini-amplitude-five-quarters": profile(
    "land-coppini-amplitude-five-quarters",
    1.25,
  ),
  "land-coppini-amplitude-three-halves": profile(
    "land-coppini-amplitude-three-halves",
    1.5,
  ),
  "land-coppini-amplitude-seven-quarters": profile(
    "land-coppini-amplitude-seven-quarters",
    1.75,
  ),
  "land-coppini-amplitude-twofold": profile(
    "land-coppini-amplitude-twofold",
    2,
  ),
} satisfies Readonly<Record<
  MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1,
  MainWireVentricularCalciumLandCoppiniAmplitudeProfileV1
>>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_BRACKET_CLAIM_V1 =
  Object.freeze({
    role: "source-waveform-shape-amplitude-identifiability-bracket" as const,
    primaryRepositoryTraceOwnsShapeAndPhase: true as const,
    amplitudeTransformation:
      "minimum-plus-fixed-scale-times-source-minus-minimum" as const,
    sourceMinimumHeldExactly: true as const,
    sourceLandEquationParametersChanged: false as const,
    calciumOrMechanicsStateAdded: false as const,
    smoothingApplied: false as const,
    timeWarpApplied: false as const,
    fixedAmplitudeAxisNotContinuousFit: true as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularCalciumLandCoppiniAmplitudeProfileV1(
  profileId: MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1,
): MainWireVentricularCalciumLandCoppiniAmplitudeProfileV1 {
  const resolved = PROFILES[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported Land/Coppini calcium amplitude profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularCalciumLandCoppiniAmplitudeParamsV1(
  profileId: MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  const profile = resolveMainWireVentricularCalciumLandCoppiniAmplitudeProfileV1(
    profileId,
  );
  const source = resolveMainWireVentricularCalciumLandCoppiniSourceTraceParamsV1();
  if (profile.supraminimumAmplitudeScaleFromSource === 1) return source;
  const sourceTrace = source.ventricularSampledTrace!;
  const samplesUM = Object.freeze(sourceTrace.samplesUM.map((calciumUM) =>
    profile.minimumCalciumUM
    + profile.supraminimumAmplitudeScaleFromSource
      * (calciumUM - profile.minimumCalciumUM)));
  return Object.freeze({
    ...source,
    parameterSetId: `${MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1.profileId}-${profile.profileId}`,
    ventricular: Object.freeze({
      ...source.ventricular,
      peakAmplitudeUM: profile.resolvedAmplitudeUM,
    }),
    ventricularSampledTrace: Object.freeze({
      ...sourceTrace,
      traceId: `${sourceTrace.traceId}-${profile.profileId}`,
      samplesUM,
      amplitudeUM: profile.resolvedAmplitudeUM,
    }),
  });
}
