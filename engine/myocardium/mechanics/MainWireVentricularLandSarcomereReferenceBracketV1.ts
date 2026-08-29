import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1,
  type MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";

export const MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_BRACKET_V1_ID =
  "main-wire-ventricular-land-sarcomere-reference-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_PROFILE_IDS_V1 =
  Object.freeze([
    "land-sarcomere-reference-canonical",
    "land-sarcomere-reference-plus-2p5-percent",
    "land-sarcomere-reference-plus-5-percent",
    "land-sarcomere-reference-plus-7p5-percent",
  ] as const);

export type MainWireVentricularLandSarcomereReferenceProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandSarcomereReferenceProfileV1 = Readonly<{
  profileId: MainWireVentricularLandSarcomereReferenceProfileIdV1;
  landSlackStretchScaleFromBaseline: 1 | 1.025 | 1.05 | 1.075;
  loadedReferenceGeometryStretch: 1.1;
  resolvedLoadedReferenceLandStretch: number;
  sourceLandEquationParametersChanged: false;
  equilibriumPassiveMaterialChanged: false;
  slsMaterialChanged: false;
  calciumDriveChanged: false;
  stateCountChanged: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

function profile(
  profileId: MainWireVentricularLandSarcomereReferenceProfileIdV1,
  scale: 1 | 1.025 | 1.05 | 1.075,
): MainWireVentricularLandSarcomereReferenceProfileV1 {
  const loadedReferenceGeometryStretch =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
      .targetFiberStretchAtLoadedReference;
  return Object.freeze({
    profileId,
    landSlackStretchScaleFromBaseline: scale,
    loadedReferenceGeometryStretch,
    resolvedLoadedReferenceLandStretch:
      loadedReferenceGeometryStretch * scale,
    sourceLandEquationParametersChanged: false as const,
    equilibriumPassiveMaterialChanged: false as const,
    slsMaterialChanged: false as const,
    calciumDriveChanged: false as const,
    stateCountChanged: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

const PROFILES = Object.freeze({
  "land-sarcomere-reference-canonical": profile(
    "land-sarcomere-reference-canonical",
    1,
  ),
  "land-sarcomere-reference-plus-2p5-percent": profile(
    "land-sarcomere-reference-plus-2p5-percent",
    1.025,
  ),
  "land-sarcomere-reference-plus-5-percent": profile(
    "land-sarcomere-reference-plus-5-percent",
    1.05,
  ),
  "land-sarcomere-reference-plus-7p5-percent": profile(
    "land-sarcomere-reference-plus-7p5-percent",
    1.075,
  ),
} satisfies Readonly<Record<
  MainWireVentricularLandSarcomereReferenceProfileIdV1,
  MainWireVentricularLandSarcomereReferenceProfileV1
>>);

export const MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_BRACKET_CLAIM_V1 =
  Object.freeze({
    role: "organ-strain-to-sarcomere-reference-coupling-bracket" as const,
    changedPrimitiveParameter: "ventricular-land-slack-stretch" as const,
    canonicalLoadedReferenceGeometryStretch: 1.1 as const,
    canonicalReferenceIdentificationBoundary:
      "construction-prior-not-direct-human-measurement" as const,
    sourceLandEquationParametersHeldExactly: true as const,
    equilibriumPassiveAndSlsHeldExactly: true as const,
    oneCommonScaleForLvfwSeptumAndRvfw: true as const,
    atrialCouplingChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    fixedOneSidedBracketNotContinuousFit: true as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularLandSarcomereReferenceProfileV1(
  profileId: MainWireVentricularLandSarcomereReferenceProfileIdV1,
): MainWireVentricularLandSarcomereReferenceProfileV1 {
  const resolved = PROFILES[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular Land sarcomere reference profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
  profileId: MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const profile = resolveMainWireVentricularLandSarcomereReferenceProfileV1(
    profileId,
  );
  const base = resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(
    kuwProfileId,
  );
  if (profile.landSlackStretchScaleFromBaseline === 1) return base;
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-${profile.profileId}`,
    landSlackStretch:
      base.landSlackStretch * profile.landSlackStretchScaleFromBaseline,
  });
}
