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
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_ABLATION_V1_ID =
  "main-wire-ventricular-land-kinetic-timing-ablation-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "land-ktrpn-three-quarters",
    "land-ktrpn-four-thirds",
    "land-ku-three-quarters",
    "land-ku-four-thirds",
    "land-kuw-three-quarters",
    "land-kuw-four-thirds",
    "land-kws-three-quarters",
    "land-kws-four-thirds",
    "land-rs-three-quarters",
    "land-rs-four-thirds",
    "land-rw-three-quarters",
    "land-rw-six-fifths",
    "land-ntm-four-fifths",
    "land-ntm-six-fifths",
    "land-trpn50-four-fifths",
    "land-trpn50-six-fifths",
  ] as const);

export type MainWireVentricularLandKineticTimingProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILE_IDS_V1)[number];

type KineticParameter = Extract<
  Land2017SourceParameterName,
  "kTRPN" | "ku" | "kuw" | "kws" | "rs" | "rw" | "nTm" | "TRPN50"
>;

export type MainWireVentricularLandKineticTimingProfileV1 = Readonly<{
  profileId: MainWireVentricularLandKineticTimingProfileIdV1;
  changedParameter: "none" | KineticParameter;
  scaleFromBaseline: number;
  resolvedValue: number | null;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

export const MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-one-parameter-at-a-time-local-kinetic-sensitivity" as const,
    parameters: Object.freeze([
      "kTRPN",
      "ku",
      "kuw",
      "kws",
      "rs",
      "rw",
      "nTm",
      "TRPN50",
    ] as const),
    primaryStage: "isometric-twitch-screen-before-closed-loop" as const,
    eachNoncanonicalProfileChangesExactlyOneSourceParameter: true as const,
    derivedLandParametersRecomputedFromSourceEquations: true as const,
    ventricularTrefChanged: false as const,
    calciumDriveChanged: false as const,
    passiveOrSlsChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

const BASELINE =
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand.values;

function profile(
  profileId: MainWireVentricularLandKineticTimingProfileIdV1,
  changedParameter: "none" | KineticParameter,
  scaleFromBaseline: number,
): MainWireVentricularLandKineticTimingProfileV1 {
  return Object.freeze({
    profileId,
    changedParameter,
    scaleFromBaseline,
    resolvedValue: changedParameter === "none"
      ? null
      : BASELINE[changedParameter] * scaleFromBaseline,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILES_V1 =
  Object.freeze({
    canonical: profile("canonical", "none", 1),
    "land-ktrpn-three-quarters": profile(
      "land-ktrpn-three-quarters", "kTRPN", 0.75,
    ),
    "land-ktrpn-four-thirds": profile(
      "land-ktrpn-four-thirds", "kTRPN", 4 / 3,
    ),
    "land-ku-three-quarters": profile(
      "land-ku-three-quarters", "ku", 0.75,
    ),
    "land-ku-four-thirds": profile(
      "land-ku-four-thirds", "ku", 4 / 3,
    ),
    "land-kuw-three-quarters": profile(
      "land-kuw-three-quarters", "kuw", 0.75,
    ),
    "land-kuw-four-thirds": profile(
      "land-kuw-four-thirds", "kuw", 4 / 3,
    ),
    "land-kws-three-quarters": profile(
      "land-kws-three-quarters", "kws", 0.75,
    ),
    "land-kws-four-thirds": profile(
      "land-kws-four-thirds", "kws", 4 / 3,
    ),
    "land-rs-three-quarters": profile(
      "land-rs-three-quarters", "rs", 0.75,
    ),
    "land-rs-four-thirds": profile(
      "land-rs-four-thirds", "rs", 4 / 3,
    ),
    "land-rw-three-quarters": profile(
      "land-rw-three-quarters", "rw", 0.75,
    ),
    "land-rw-six-fifths": profile(
      "land-rw-six-fifths", "rw", 1.2,
    ),
    "land-ntm-four-fifths": profile(
      "land-ntm-four-fifths", "nTm", 0.8,
    ),
    "land-ntm-six-fifths": profile(
      "land-ntm-six-fifths", "nTm", 1.2,
    ),
    "land-trpn50-four-fifths": profile(
      "land-trpn50-four-fifths", "TRPN50", 0.8,
    ),
    "land-trpn50-six-fifths": profile(
      "land-trpn50-six-fifths", "TRPN50", 1.2,
    ),
  } satisfies Readonly<Record<
    MainWireVentricularLandKineticTimingProfileIdV1,
    MainWireVentricularLandKineticTimingProfileV1
  >>);

export function resolveMainWireVentricularLandKineticTimingProfileV1(
  profileId: MainWireVentricularLandKineticTimingProfileIdV1,
): MainWireVentricularLandKineticTimingProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular Land kinetic timing profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandKineticTimingWallMaterialV1(
  profileId: MainWireVentricularLandKineticTimingProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const profile = resolveMainWireVentricularLandKineticTimingProfileV1(
    profileId,
  );
  const baseline =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  if (profile.changedParameter === "none") return baseline;
  return Object.freeze({
    ...baseline,
    parameterSetId: `${baseline.parameterSetId}-${profile.profileId}`,
    landEquationParameters: scaledLandParameterSet(profile),
  });
}

function scaledLandParameterSet(
  profile: MainWireVentricularLandKineticTimingProfileV1,
): Land2017SourceParameterSet {
  if (profile.changedParameter === "none" || profile.resolvedValue === null) {
    return NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand;
  }
  const baseline = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand;
  const changedParameter = profile.changedParameter;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...baseline.values,
    [changedParameter]: profile.resolvedValue,
  });
  const provenanceLabel =
    `fixed kinetic-timing research scale ${profile.scaleFromBaseline}`;
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${baseline.parameterSetId}-${profile.profileId}`,
      sourceId: baseline.sourceId,
      doi: baseline.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(
        baseline.sourceParameters.map((entry) =>
          entry.parameter === changedParameter
            ? Object.freeze({
                ...entry,
                location: `${entry.location}; ${provenanceLabel}`,
                original: Object.freeze({ ...entry.original }),
                runtime: Object.freeze({
                  ...entry.runtime,
                  value: profile.resolvedValue!,
                }),
              })
            : Object.freeze({
                ...entry,
                original: Object.freeze({ ...entry.original }),
                runtime: Object.freeze({ ...entry.runtime }),
              }),
        ),
      ),
      derivedParameters: Object.freeze(
        baseline.derivedParameters.map((entry) => Object.freeze({ ...entry })),
      ),
    };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
}
