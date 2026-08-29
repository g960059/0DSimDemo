import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1,
  type MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_BRACKET_V1_ID =
  "main-wire-ventricular-land-calcium-sensitivity-length-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_PROFILE_IDS_V1 =
  Object.freeze([
    "land-beta1-canonical",
    "land-beta1-three-quarters",
    "land-beta1-half",
    "land-beta1-quarter",
    "land-beta1-exact-off",
  ] as const);

export type MainWireVentricularLandCalciumSensitivityLengthProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandCalciumSensitivityLengthProfileV1 =
  Readonly<{
    profileId:
      MainWireVentricularLandCalciumSensitivityLengthProfileIdV1;
    beta1ScaleFromSource: 1 | 0.75 | 0.5 | 0.25 | 0;
    resolvedBeta1UM: number;
    referenceLengthIsometricLandValuesChanged: false;
    hemodynamicOutcomeUsedToDeriveProfile: false;
  }>;

function profile(
  profileId: MainWireVentricularLandCalciumSensitivityLengthProfileIdV1,
  scale: 1 | 0.75 | 0.5 | 0.25 | 0,
): MainWireVentricularLandCalciumSensitivityLengthProfileV1 {
  return Object.freeze({
    profileId,
    beta1ScaleFromSource: scale,
    resolvedBeta1UM: -2.4 * scale,
    referenceLengthIsometricLandValuesChanged: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

const PROFILES = Object.freeze({
  "land-beta1-canonical": profile("land-beta1-canonical", 1),
  "land-beta1-three-quarters": profile("land-beta1-three-quarters", 0.75),
  "land-beta1-half": profile("land-beta1-half", 0.5),
  "land-beta1-quarter": profile("land-beta1-quarter", 0.25),
  "land-beta1-exact-off": profile("land-beta1-exact-off", 0),
} satisfies Readonly<Record<
  MainWireVentricularLandCalciumSensitivityLengthProfileIdV1,
  MainWireVentricularLandCalciumSensitivityLengthProfileV1
>>);

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SENSITIVITY_LENGTH_BRACKET_CLAIM_V1 =
  Object.freeze({
    role: "split-Land-length-dependence-causal-envelope" as const,
    changedPrimitiveParameter: "Land-beta1-only" as const,
    beta0PeakTensionLengthDependenceHeldExactly: true as const,
    calciumDriveHeldExactly: true as const,
    TrefAndVelocityDistortionHeldExactly: true as const,
    referenceLengthIsometricTwitchInvariantExactly: true as const,
    sourceLengthDependenceCalibrationPreservedOnlyByCanonicalArm: true as const,
    stateCountChanged: false as const,
    fixedEnvelopeNotContinuousFit: true as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularLandCalciumSensitivityLengthProfileV1(
  profileId: MainWireVentricularLandCalciumSensitivityLengthProfileIdV1,
): MainWireVentricularLandCalciumSensitivityLengthProfileV1 {
  const resolved = PROFILES[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular Land beta1 profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandCalciumSensitivityLengthWallMaterialV1(
  profileId: MainWireVentricularLandCalciumSensitivityLengthProfileIdV1,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const profile = resolveMainWireVentricularLandCalciumSensitivityLengthProfileV1(
    profileId,
  );
  const base = resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
    sarcomereReferenceProfileId,
    kuwProfileId,
  );
  if (profile.beta1ScaleFromSource === 1) return base;
  const source = base.landEquationParameters;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...source.values,
    beta1: source.values.beta1 * profile.beta1ScaleFromSource,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}-${profileId}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(source.sourceParameters.map((entry) =>
      entry.parameter === "beta1"
        ? Object.freeze({
          ...entry,
          location: "fixed beta1-only causal envelope; source value not claimed",
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime, value: values.beta1 }),
        })
        : Object.freeze({
          ...entry,
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime }),
        }))),
    derivedParameters: Object.freeze(
      source.derivedParameters.map((entry) => Object.freeze({ ...entry })),
    ),
  };
  const parameterSet: Land2017SourceParameterSet = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-${profileId}`,
    landEquationParameters: parameterSet,
  });
}
