import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import type {
  MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import {
  resolveMainWireVentricularLandSourceTwitchRetentionTrefForceLoadWallMaterialV1,
  resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1,
  type MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  type MainWireVentricularLandTrefForceLoadProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_BRACKET_V1_ID =
  "main-wire-ventricular-land-source-velocity-distortion-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1 =
  Object.freeze([
    "source-Aeff-canonical",
    "source-Aeff-five-fourths",
    "source-Aeff-four-thirds",
    "source-Aeff-three-halves",
    "source-Aeff-five-thirds",
    "source-Aeff-twofold",
  ] as const);

export type MainWireVentricularLandSourceVelocityDistortionProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandSourceVelocityDistortionProfileV1 =
  Readonly<{
    profileId: MainWireVentricularLandSourceVelocityDistortionProfileIdV1;
    aeffScaleFromIntactHumanSource: number;
    sourceIdentityClaimed: boolean;
    loadedOrHemodynamicOutcomeUsedToSetProfile: false;
    parameterSearchOrFitting: false;
  }>;

function profile(
  profileId: MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
  aeffScaleFromIntactHumanSource: number,
): MainWireVentricularLandSourceVelocityDistortionProfileV1 {
  return Object.freeze({
    profileId,
    aeffScaleFromIntactHumanSource,
    sourceIdentityClaimed: aeffScaleFromIntactHumanSource === 1,
    loadedOrHemodynamicOutcomeUsedToSetProfile: false as const,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILES_V1 =
  Object.freeze({
    "source-Aeff-canonical": profile("source-Aeff-canonical", 1),
    "source-Aeff-five-fourths": profile("source-Aeff-five-fourths", 1.25),
    "source-Aeff-four-thirds": profile("source-Aeff-four-thirds", 4 / 3),
    "source-Aeff-three-halves": profile("source-Aeff-three-halves", 1.5),
    "source-Aeff-five-thirds": profile("source-Aeff-five-thirds", 5 / 3),
    "source-Aeff-twofold": profile("source-Aeff-twofold", 2),
  } satisfies Readonly<Record<
    MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
    MainWireVentricularLandSourceVelocityDistortionProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-referenced-whole-organ-Aeff-bracket" as const,
    sourceAeff: 25 as const,
    sourceAeffRole:
      "skinned-human-quick-stretch-instantaneous-force-response-fit-carried-unchanged-into-whole-organ-column" as const,
    sourceDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    scaleAxis: Object.freeze([1, 1.25, 4 / 3, 1.5, 5 / 3, 2] as const),
    noncanonicalProfilesAreEffectiveWholeOrganCouplingHypotheses:
      true as const,
    noncanonicalProfilesClaimSourceIdentity: false as const,
    fixedLengthIsometricTrajectoryUnchangedByAeff: true as const,
    sourceParametersExceptAeffUnchangedByThisProfile: true as const,
    passiveOrSlsChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    loadedOrHemodynamicOutcomeUsedToSetProfiles: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularLandSourceVelocityDistortionProfileV1(
  profileId: MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
): MainWireVentricularLandSourceVelocityDistortionProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILES_V1[
      profileId
    ];
  if (resolved === undefined) {
    throw new Error(`unsupported source velocity-distortion profile: ${String(profileId)}`);
  }
  return resolved;
}

export function resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1(
  profileId: MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
  sourceTwitchRetentionCandidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const profileValue =
    resolveMainWireVentricularLandSourceVelocityDistortionProfileV1(profileId);
  const base = trefForceLoadProfileId === "tref-force-load-baseline"
    ? resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
      sourceTwitchRetentionCandidateId,
      sarcomereReferenceProfileId,
      kuwProfileId,
    )
    : resolveMainWireVentricularLandSourceTwitchRetentionTrefForceLoadWallMaterialV1(
      sourceTwitchRetentionCandidateId,
      trefForceLoadProfileId,
      sarcomereReferenceProfileId,
      kuwProfileId,
    );
  if (profileValue.aeffScaleFromIntactHumanSource === 1) return base;
  const source = base.landEquationParameters;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...source.values,
    Aeff: source.values.Aeff * profileValue.aeffScaleFromIntactHumanSource,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}-${profileId}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(source.sourceParameters.map((entry) =>
      entry.parameter === "Aeff"
        ? Object.freeze({
          ...entry,
          location: `${entry.location}; fixed source-referenced whole-organ Aeff bracket ${profileValue.aeffScaleFromIntactHumanSource}`,
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime, value: values.Aeff }),
        })
        : Object.freeze({
          ...entry,
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime }),
        }))),
    derivedParameters: Object.freeze(source.derivedParameters.map((entry) =>
      Object.freeze({ ...entry }))),
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
