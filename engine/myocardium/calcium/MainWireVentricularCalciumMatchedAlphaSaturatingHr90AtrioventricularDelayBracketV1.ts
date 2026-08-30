import type { FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_V1_ID =
  "main-wire-ventricular-calcium-matched-alpha-saturating-hr90-atrioventricular-delay-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1 =
  Object.freeze([
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms",
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms",
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms",
  ] as const);

export type MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelaySecV1 =
  0.12 | 0.11 | 0.1;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_EVIDENCE_V1 =
  Object.freeze({
    humanRatePrDirection: Object.freeze({
      classification: "data-supported-direction-only" as const,
      scope:
        "surface-ECG PR interval diminished as heart rate increased during exercise and isoprenaline infusion in healthy young adults" as const,
      doi: "10.1111/j.1365-2125.1987.tb03043.x" as const,
      limitation:
        "surface-ECG PR interval is not identical to this model's atrial-to-ventricular electrical-onset delay and does not select 100, 110, or 120 ms" as const,
    }),
    discreteBracket: Object.freeze({
      classification: "fixed-model-hypothesis" as const,
      scope:
        "120 ms control and two shorter 10 ms-spaced electrical-onset delays at HR90" as const,
      parameterSearchOrFitting: false as const,
      hemodynamicOutcomeUsedToDeriveCandidates: false as const,
    }),
  });

export type MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1 =
  Readonly<{
    profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1;
    designRole: "fixed-three-point-hr90-av-electrical-onset-delay-bracket";
    heartRateBpm: 90;
    cycleLengthSec: number;
    dimensionlessRateCoefficient: 0.4;
    atrioventricularDelaySec: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelaySecV1;
    controlAtrioventricularDelaySec: 0.12;
    controlParamsIdentityReusedExactly: boolean;
    baseSaturatingHeartRateLawProfileId: "matched-alpha-saturating-hr-law-a040-hr-90";
    baseSaturatingHeartRateLawParamsIdentityRetainedExceptParameterSetIdAndAtrioventricularDelay: true;
    atrialParamsRetainedByIdentity: true;
    ventricularParamsRetainedByIdentity: true;
    cycleLengthRetainedExactly: true;
    ventricularCalciumTimingShapeAndAmplitudeRetainedExactly: true;
    fixedDiscreteCandidate: true;
    arbitraryNumericResolverExposed: false;
    surfaceEcgPrIntervalEquivalenceClaimed: false;
    parameterSearchOrFitting: false;
    hemodynamicOutcomeUsedToDeriveProfile: false;
    evidence: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_EVIDENCE_V1;
  }>;

const BASE_PROFILE_ID = "matched-alpha-saturating-hr-law-a040-hr-90" as const;
const CONTROL_ATRIOVENTRICULAR_DELAY_SEC = 0.12 as const;
const BASE_PROFILE =
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
    BASE_PROFILE_ID,
  );
const BASE_PARAMS =
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
    BASE_PROFILE_ID,
  );

function params(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
  atrioventricularDelaySec: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelaySecV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (atrioventricularDelaySec === CONTROL_ATRIOVENTRICULAR_DELAY_SEC) {
    return BASE_PARAMS;
  }
  return Object.freeze({
    ...BASE_PARAMS,
    parameterSetId: `${BASE_PARAMS.parameterSetId}-${profileId}-v1`,
    atrioventricularDelaySec,
  });
}

const PARAMS_BY_PROFILE_ID = Object.freeze({
  "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms": params(
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms",
    0.12,
  ),
  "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms": params(
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms",
    0.11,
  ),
  "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms": params(
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms",
    0.1,
  ),
} satisfies Readonly<
  Record<
    MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
    FiveWallNormalCalciumDriveParamsV1
  >
>);

function profile(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
  atrioventricularDelaySec: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelaySecV1,
): MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1 {
  const resolvedParams = PARAMS_BY_PROFILE_ID[profileId];
  if (
    BASE_PROFILE.heartRateBpm !== 90 ||
    BASE_PROFILE.dimensionlessRateCoefficient !== 0.4 ||
    BASE_PROFILE.atrioventricularDelaySec !==
      CONTROL_ATRIOVENTRICULAR_DELAY_SEC ||
    BASE_PARAMS.atrioventricularDelaySec !==
      CONTROL_ATRIOVENTRICULAR_DELAY_SEC ||
    resolvedParams.cycleLengthSec !== BASE_PARAMS.cycleLengthSec ||
    resolvedParams.atrioventricularDelaySec !== atrioventricularDelaySec ||
    resolvedParams.atrial !== BASE_PARAMS.atrial ||
    resolvedParams.ventricular !== BASE_PARAMS.ventricular
  ) {
    throw new Error(
      "matched-alpha saturating HR90 atrioventricular-delay factor matching failed",
    );
  }
  return Object.freeze({
    profileId,
    designRole:
      "fixed-three-point-hr90-av-electrical-onset-delay-bracket" as const,
    heartRateBpm: 90 as const,
    cycleLengthSec: BASE_PARAMS.cycleLengthSec,
    dimensionlessRateCoefficient: 0.4 as const,
    atrioventricularDelaySec,
    controlAtrioventricularDelaySec: CONTROL_ATRIOVENTRICULAR_DELAY_SEC,
    controlParamsIdentityReusedExactly:
      atrioventricularDelaySec === CONTROL_ATRIOVENTRICULAR_DELAY_SEC &&
      resolvedParams === BASE_PARAMS,
    baseSaturatingHeartRateLawProfileId: BASE_PROFILE_ID,
    baseSaturatingHeartRateLawParamsIdentityRetainedExceptParameterSetIdAndAtrioventricularDelay:
      true as const,
    atrialParamsRetainedByIdentity: true as const,
    ventricularParamsRetainedByIdentity: true as const,
    cycleLengthRetainedExactly: true as const,
    ventricularCalciumTimingShapeAndAmplitudeRetainedExactly: true as const,
    fixedDiscreteCandidate: true as const,
    arbitraryNumericResolverExposed: false as const,
    surfaceEcgPrIntervalEquivalenceClaimed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    evidence:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_EVIDENCE_V1,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILES_V1 =
  Object.freeze({
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms": profile(
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms",
      0.12,
    ),
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms": profile(
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms",
      0.11,
    ),
    "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms": profile(
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms",
      0.1,
    ),
  } satisfies Readonly<
    Record<
      MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
      MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1
    >
  >);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1 =
  Object.freeze({
    role: "fixed-three-point-hr90-av-electrical-onset-delay-bracket" as const,
    baseSaturatingHeartRateLawProfileId: BASE_PROFILE_ID,
    heartRateHeldAtBpm: 90 as const,
    rateCoefficientHeldAt: 0.4 as const,
    atrioventricularDelayCandidatesSec: Object.freeze([
      0.12, 0.11, 0.1,
    ] as const),
    controlParamsIdentityReusedExactly: true as const,
    onlyParameterSetIdAndAtrioventricularDelayEligibleToDifferFromControl:
      true as const,
    atrialParamsHeldByIdentity: true as const,
    ventricularParamsHeldByIdentity: true as const,
    cycleLengthHeldExactly: true as const,
    fixedDiscreteCandidatesOnly: true as const,
    arbitraryNumericResolverExposed: false as const,
    surfaceEcgPrIntervalEquivalenceClaimed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveCandidates: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
    evidence:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_EVIDENCE_V1,
  });

export function resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
): MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1 {
  if (
    !Object.prototype.hasOwnProperty.call(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILES_V1,
      profileId,
    )
  ) {
    throw new Error(
      `unsupported matched-alpha saturating HR90 atrioventricular-delay profile: ${String(profileId)}`,
    );
  }
  return MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILES_V1[
    profileId
  ];
}

export function resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (!Object.prototype.hasOwnProperty.call(PARAMS_BY_PROFILE_ID, profileId)) {
    throw new Error(
      `unsupported matched-alpha saturating HR90 atrioventricular-delay profile: ${String(profileId)}`,
    );
  }
  return PARAMS_BY_PROFILE_ID[profileId];
}
