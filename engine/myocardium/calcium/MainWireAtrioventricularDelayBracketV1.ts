import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumLandCoppiniSourceTraceParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniSourceTraceV1";

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_V1_ID =
  "main-wire-atrioventricular-delay-bracket-v1" as const;

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1 = Object.freeze([
  "coppini-source-atrioventricular-delay-100ms",
  "coppini-source-atrioventricular-delay-120ms",
  "coppini-source-atrioventricular-delay-140ms",
  "coppini-source-atrioventricular-delay-160ms",
  "coppini-source-atrioventricular-delay-180ms",
  "coppini-source-atrioventricular-delay-200ms",
] as const);

export type MainWireAtrioventricularDelayProfileIdV1 =
  (typeof MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1)[number];

export type MainWireAtrioventricularDelaySecV1 =
  0.1 | 0.12 | 0.14 | 0.16 | 0.18 | 0.2;

export type MainWireAtrioventricularDelayProfileV1 = Readonly<{
  profileId: MainWireAtrioventricularDelayProfileIdV1;
  atrioventricularDelaySec: MainWireAtrioventricularDelaySecV1;
  sourceAtrioventricularDelaySec: 0.16;
  sourceAtrioventricularDelayRetained: boolean;
  ventricularNumericSourceTraceRetainedExactly: true;
  atrialCalciumPulseShapeAndAmplitudeRetainedExactly: true;
  cycleLengthRetainedExactly: true;
  changesOnlyRelativeAtrialVentricularTiming: true;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

function profile(
  profileId: MainWireAtrioventricularDelayProfileIdV1,
  atrioventricularDelaySec: MainWireAtrioventricularDelaySecV1,
): MainWireAtrioventricularDelayProfileV1 {
  return Object.freeze({
    profileId,
    atrioventricularDelaySec,
    sourceAtrioventricularDelaySec: 0.16 as const,
    sourceAtrioventricularDelayRetained: atrioventricularDelaySec === 0.16,
    ventricularNumericSourceTraceRetainedExactly: true as const,
    atrialCalciumPulseShapeAndAmplitudeRetainedExactly: true as const,
    cycleLengthRetainedExactly: true as const,
    changesOnlyRelativeAtrialVentricularTiming: true as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILES_V1 = Object.freeze({
  "coppini-source-atrioventricular-delay-100ms": profile(
    "coppini-source-atrioventricular-delay-100ms",
    0.1,
  ),
  "coppini-source-atrioventricular-delay-120ms": profile(
    "coppini-source-atrioventricular-delay-120ms",
    0.12,
  ),
  "coppini-source-atrioventricular-delay-140ms": profile(
    "coppini-source-atrioventricular-delay-140ms",
    0.14,
  ),
  "coppini-source-atrioventricular-delay-160ms": profile(
    "coppini-source-atrioventricular-delay-160ms",
    0.16,
  ),
  "coppini-source-atrioventricular-delay-180ms": profile(
    "coppini-source-atrioventricular-delay-180ms",
    0.18,
  ),
  "coppini-source-atrioventricular-delay-200ms": profile(
    "coppini-source-atrioventricular-delay-200ms",
    0.2,
  ),
} satisfies Readonly<Record<
  MainWireAtrioventricularDelayProfileIdV1,
  MainWireAtrioventricularDelayProfileV1
>>);

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1 =
  Object.freeze({
    role: "fixed-low-dimensional-atrioventricular-timing-bracket" as const,
    timingDefinition:
      "atrial-electrical-onset-precedes-ventricular-electrical-onset-by-atrioventricular-delay" as const,
    sourceVentricularNumericTraceHeldExactly: true as const,
    atrialCalciumPulseShapeAndAmplitudeHeldExactly: true as const,
    ventricularCalciumTimingAndAmplitudeHeldExactly: true as const,
    heartRateHeldExactly: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    circulationRuntimeChanged: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    fixedDiscreteBracketNotContinuousOptimization: true as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAtrioventricularDelayProfileV1(
  profileId: MainWireAtrioventricularDelayProfileIdV1,
): MainWireAtrioventricularDelayProfileV1 {
  const resolved = MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported atrioventricular delay profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireAtrioventricularDelayCalciumParamsV1(
  profileId: MainWireAtrioventricularDelayProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  const profile = resolveMainWireAtrioventricularDelayProfileV1(profileId);
  const source =
    resolveMainWireVentricularCalciumLandCoppiniSourceTraceParamsV1();
  if (profile.sourceAtrioventricularDelayRetained) return source;
  return Object.freeze({
    ...source,
    parameterSetId:
      `${source.parameterSetId}-${profile.profileId}`,
    atrioventricularDelaySec: profile.atrioventricularDelaySec,
  });
}
