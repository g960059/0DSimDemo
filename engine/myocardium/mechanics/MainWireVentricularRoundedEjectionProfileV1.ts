import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  deriveLand2017DerivedParameters,
  createLand2017StrongBridgeDeactivationExitV2,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID =
  "main-wire-ventricular-rounded-ejection-profile-v1" as const;

export const MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 =
  1600 as const;

const CHANGED_PRIMITIVE_PARAMETERS = Object.freeze([
  "kuw",
  "kws",
] as const satisfies readonly Land2017SourceParameterName[]);

/**
 * Fixed ventricular material for the rounded-ejection construction. It keeps
 * the two Standard66 cross-bridge deactivation choices that survived the
 * factorized timing/morphology screen, while restoring the source Land nTm and
 * Tref values. No additional material state or valve state is introduced.
 */
export const MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_CLAIM =
  Object.freeze({
    role: "fixed-rounded-ejection-material" as const,
    pureLand2017SourceParameterSetClaimed: false as const,
    changedPrimitiveParameters: CHANGED_PRIMITIVE_PARAMETERS,
    retainedCrossBridgeKinetics:
      "standard66-kuw-kws-bounded-et-relaxation-selection" as const,
    troponinCooperativitySelection:
      "source-intact-human-nTm-5-restored" as const,
    trefSelection:
      "source-intact-human-Tref-120-kPa-restored" as const,
    calciumAndMaterialJointlyIdentifiableClaimed: false as const,
    strongBridgeDeactivationExit:
      "fixed-reduced-order-non-source-v2-rate-60-per-sec-gate-power-12" as const,
    strongBridgeDeactivationSelection:
      "factorized-ET-IVRT-Tei-and-pressure-morphology-screen" as const,
    geometryToLandStretchCouplingChanged: true as const,
    atrialMaterialChanged: false as const,
    ventricularPassiveOrSlsChanged: false as const,
    continuousStateCountChanged: false as const,
    coldInitializationMaximumIterations:
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
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
});

const PROVENANCE_SUFFIX_BY_PARAMETER: Readonly<
  Partial<Record<Land2017SourceParameterName, string>>
> = Object.freeze({
  kuw:
    "runtime kuw=4*26/s retains the lower boundary of the published " +
    "nu=4..12 isometric-twitch non-identifiability interval after bounded " +
    "load-envelope analysis; it is not the Appendix-B source-selected nu=7 value",
  kws:
    "runtime kws is 0.4 times the source value and retains the bounded " +
    "ejection-relaxation kinetic selection; it is not a Land et al. source value",
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
    `${MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID}-land`,
  sourceId: BASE_LAND.sourceId,
  doi: BASE_LAND.doi,
  values: VALUES,
  derived: Object.freeze(deriveLand2017DerivedParameters(VALUES)),
  sourceParameters: SOURCE_PARAMETERS,
  derivedParameters: Object.freeze(
    BASE_LAND.derivedParameters.map((entry) => Object.freeze({ ...entry })),
  ),
  strongBridgeDeactivationExit:
    createLand2017StrongBridgeDeactivationExitV2(60, 12),
};

export const MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1:
  Land2017SourceParameterSet = Object.freeze({
    ...PARAMETER_HASH_INPUT,
    parameterSetStableHash: stableLandParameterHash(PARAMETER_HASH_INPUT),
  });

export const MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1:
  LandSlsWallMaterialParamsV1 = Object.freeze({
    ...BASE_MATERIAL,
    parameterSetId:
      `${MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID}-wall`,
    landEquationParameters:
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1,
    landSlackStretch: 1.05,
  });
