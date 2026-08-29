import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_BRACKET_V1_ID =
  "main-wire-ventricular-land-whole-organ-kuw-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILE_IDS_V1 =
  Object.freeze([
    "land-whole-organ-kuw-nu4",
    "land-whole-organ-kuw-nu5",
    "land-whole-organ-kuw-nu6",
    "land-whole-organ-kuw-nu7",
    "land-whole-organ-kuw-nu9",
    "land-whole-organ-kuw-nu12",
  ] as const);

export type MainWireVentricularLandWholeOrganKuwProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandWholeOrganKuwProfileV1 = Readonly<{
  profileId: MainWireVentricularLandWholeOrganKuwProfileIdV1;
  intactToSkinnedUnboundToWeakRateScaleNu: 4 | 5 | 6 | 7 | 9 | 12;
  skinnedKuwPerSec: 26;
  resolvedWholeOrganKuwPerSec: number;
  sourceTwitchIndistinguishableNuIntervalInclusive: readonly [4, 12];
  sourceWholeOrganSelectedNu: 7;
  sourceWholeOrganSelectedKuwPerSec: 182;
  sourcePaperDoi: "10.1016/j.yjmcc.2017.03.008";
  aeffChanged: false;
  trefChanged: false;
  calciumChanged: false;
  stateCountChanged: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
  parameterSearchOrFitting: false;
}>;

const SKINNED_KUW_PER_SEC = 26 as const;
const SOURCE_NU_INTERVAL = Object.freeze([4, 12] as const);

function profile(
  profileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  nu: 4 | 5 | 6 | 7 | 9 | 12,
): MainWireVentricularLandWholeOrganKuwProfileV1 {
  return Object.freeze({
    profileId,
    intactToSkinnedUnboundToWeakRateScaleNu: nu,
    skinnedKuwPerSec: SKINNED_KUW_PER_SEC,
    resolvedWholeOrganKuwPerSec: nu * SKINNED_KUW_PER_SEC,
    sourceTwitchIndistinguishableNuIntervalInclusive: SOURCE_NU_INTERVAL,
    sourceWholeOrganSelectedNu: 7 as const,
    sourceWholeOrganSelectedKuwPerSec: 182 as const,
    sourcePaperDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    aeffChanged: false as const,
    trefChanged: false as const,
    calciumChanged: false as const,
    stateCountChanged: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILES_V1 =
  Object.freeze({
    "land-whole-organ-kuw-nu4": profile("land-whole-organ-kuw-nu4", 4),
    "land-whole-organ-kuw-nu5": profile("land-whole-organ-kuw-nu5", 5),
    "land-whole-organ-kuw-nu6": profile("land-whole-organ-kuw-nu6", 6),
    "land-whole-organ-kuw-nu7": profile("land-whole-organ-kuw-nu7", 7),
    "land-whole-organ-kuw-nu9": profile("land-whole-organ-kuw-nu9", 9),
    "land-whole-organ-kuw-nu12": profile("land-whole-organ-kuw-nu12", 12),
  } satisfies Readonly<Record<
    MainWireVentricularLandWholeOrganKuwProfileIdV1,
    MainWireVentricularLandWholeOrganKuwProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_BRACKET_CLAIM_V1 =
  Object.freeze({
    role: "source-explicit-whole-organ-identifiability-bracket" as const,
    sourcePaperDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    sourceSection: "3.5-and-3.6.1-plus-Appendix-B" as const,
    sourceRationale:
      "nu-four-to-twelve-indistinguishable-by-isometric-twitch-and-nu-seven-selected-by-whole-organ-EF" as const,
    changedPrimitiveParameter: "kuw" as const,
    derivedLandParametersRecomputedFromSourceEquations: true as const,
    sourceFittedAeffHeldExactly: true as const,
    sourceWholeOrganTrefHeldExactly: true as const,
    calciumDriveChanged: false as const,
    passiveOrSlsChanged: false as const,
    stateCountChanged: false as const,
    genericParameterPatchAccepted: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularLandWholeOrganKuwProfileV1(
  profileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): MainWireVentricularLandWholeOrganKuwProfileV1 {
  const resolved = MAIN_WIRE_VENTRICULAR_LAND_WHOLE_ORGAN_KUW_PROFILES_V1[
    profileId
  ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular Land whole-organ kuw profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(
  profileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const resolved = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    profileId,
  );
  const baseline =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  if (resolved.intactToSkinnedUnboundToWeakRateScaleNu === 7) {
    return baseline;
  }
  const source = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...source.values,
    kuw: resolved.resolvedWholeOrganKuwPerSec,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${source.parameterSetId}-${profileId}`,
      sourceId: source.sourceId,
      doi: source.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(source.sourceParameters.map((entry) =>
        entry.parameter === "kuw"
          ? Object.freeze({
            ...entry,
            location:
              "Sections 3.5 and 3.6.1 source nu=4..12 identifiability bracket; Appendix B source-selected nu=7",
            original: Object.freeze({ ...entry.original }),
            runtime: Object.freeze({
              ...entry.runtime,
              value: values.kuw,
            }),
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
    ...baseline,
    parameterSetId: `${baseline.parameterSetId}-${profileId}`,
    landEquationParameters: parameterSet,
  });
}
