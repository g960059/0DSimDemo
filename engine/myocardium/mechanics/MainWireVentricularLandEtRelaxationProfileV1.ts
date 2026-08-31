import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  deriveLand2017DerivedParameters,
  LAND2017_STRONG_BRIDGE_DEACTIVATION_EXIT_V1,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID =
  "main-wire-ventricular-land-et-relaxation-profile-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_COLD_MAXIMUM_ITERATIONS_V1 =
  1600 as const;

const CHANGED_PRIMITIVE_PARAMETERS = Object.freeze([
  "kuw",
  "kws",
  "nTm",
  "Tref",
] as const satisfies readonly Land2017SourceParameterName[]);

/**
 * Fixed effective ventricular material selected by the archived aortic-outflow
 * investigation. The Land state topology is retained, but the complete value
 * is deliberately not represented as a Land et al. source parameter set.
 */
export const MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_CLAIM =
  Object.freeze({
    role: "fixed-effective-ejection-relaxation-material" as const,
    pureLand2017SourceParameterSetClaimed: false as const,
    changedPrimitiveParameters: CHANGED_PRIMITIVE_PARAMETERS,
    wholeOrganKuwSelection:
      "published-isometric-nonidentifiability-boundary-nu-four" as const,
    kwsAndNtmSelection:
      "bounded-et-relaxation-balance-after-load-envelope" as const,
    trefSelection:
      "primary-source-calcium-trace-isometric-peak-compensation" as const,
    strongBridgeDeactivationExit:
      "fixed-reduced-order-non-source-extension" as const,
    geometryToLandStretchCouplingChanged: true as const,
    atrialMaterialChanged: false as const,
    ventricularPassiveOrSlsChanged: false as const,
    continuousStateCountChanged: false as const,
    coldInitializationMaximumIterations:
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_COLD_MAXIMUM_ITERATIONS_V1,
    coldInitializationPolicyRole:
      "numerical-initialization-only-not-constitutive-dynamics" as const,
    numericOptimizerApplied: false as const,
    clinicalValidationClaimed: false as const,
  });

const BASE_MATERIAL =
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
const BASE_LAND = BASE_MATERIAL.landEquationParameters;

const VALUES: Land2017RuntimeParameters = Object.freeze({
  ...BASE_LAND.values,
  kuw: 104,
  kws: 4.8,
  nTm: 4,
  Tref: 151_951.88225014097,
});

const PROVENANCE_SUFFIX_BY_PARAMETER: Readonly<
  Partial<Record<Land2017SourceParameterName, string>>
> = Object.freeze({
  kuw:
    "runtime kuw=4*26/s selects the lower boundary of the published " +
    "nu=4..12 isometric-twitch non-identifiability interval after bounded " +
    "load-envelope analysis; it is not the Appendix-B source-selected nu=7 value",
  kws:
    "runtime kws is 0.4 times the source value, selected as a bounded " +
    "ET-relaxation balance after load-envelope evaluation without a numeric " +
    "optimizer; it is not a Land et al. source value",
  nTm:
    "runtime nTm is 0.8 times the source value, selected as a bounded " +
    "ET-relaxation balance after load-envelope evaluation without a numeric " +
    "optimizer; it is not a Land et al. source value",
  Tref:
    "runtime Tref is scaled by 1.2662656854178413 to compensate the fixed " +
    "primary-source calcium-trace isometric peak after the selected kinetic " +
    "changes; it is neither an independently measured force value nor a Land " +
    "et al. source value",
});

const SOURCE_PARAMETERS = Object.freeze(
  BASE_LAND.sourceParameters.map((entry) => {
    const suffix = PROVENANCE_SUFFIX_BY_PARAMETER[entry.parameter];
    return Object.freeze({
      ...entry,
      ...(suffix === undefined
        ? {}
        : { location: `${entry.location}; ${suffix}` }),
      original: Object.freeze({ ...entry.original }),
      runtime: Object.freeze({
        ...entry.runtime,
        value: VALUES[entry.parameter],
      }),
    });
  }),
);

const PARAMETER_HASH_INPUT: Omit<
  Land2017SourceParameterSet,
  "parameterSetStableHash"
> = {
  parameterSetId:
    `${MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID}-land`,
  sourceId: BASE_LAND.sourceId,
  doi: BASE_LAND.doi,
  values: VALUES,
  derived: Object.freeze(deriveLand2017DerivedParameters(VALUES)),
  sourceParameters: SOURCE_PARAMETERS,
  derivedParameters: Object.freeze(
    BASE_LAND.derivedParameters.map((entry) => Object.freeze({ ...entry })),
  ),
  strongBridgeDeactivationExit:
    LAND2017_STRONG_BRIDGE_DEACTIVATION_EXIT_V1,
};

export const MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PARAMETER_SET_V1:
  Land2017SourceParameterSet = Object.freeze({
    ...PARAMETER_HASH_INPUT,
    parameterSetStableHash: stableLandParameterHash(PARAMETER_HASH_INPUT),
  });

export const MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1:
  LandSlsWallMaterialParamsV1 = Object.freeze({
    ...BASE_MATERIAL,
    parameterSetId:
      `${MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID}-wall`,
    landEquationParameters:
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PARAMETER_SET_V1,
    landSlackStretch: 1.05,
  });
