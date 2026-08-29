import {
  resolveMainWireVentricularCalciumActivationDistributionProfileV1,
  type MainWireVentricularCalciumActivationDistributionProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumActivationDistributionV1";

export const MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_HOMOGENIZATION_V1_ID =
  "main-wire-ventricular-land-activation-cohort-homogenization-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_PROFILE_IDS_V1 =
  Object.freeze([
    "ventricular-activation-distribution-simpson-60ms",
    "ventricular-activation-distribution-simpson-80ms",
  ] as const);

export type MainWireVentricularLandActivationCohortProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandActivationCohortProfileV1 = Readonly<{
  modelId:
    typeof MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_HOMOGENIZATION_V1_ID;
  profileId: MainWireVentricularLandActivationCohortProfileIdV1;
  supportDurationSec: 0.06 | 0.08;
  delaySec: readonly [0, number, number];
  weight01: readonly [number, number, number];
  cohortCountPerVentricularWall: 3;
  localCalciumWaveformChangedFromCanonical: false;
  localLandParameterSetChanged: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
  parameterSearchOrFitting: false;
}>;

export const MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_CLAIM_V1 =
  Object.freeze({
    role:
      "low-order-parallel-mixture-closure-of-unresolved-normal-ventricular-activation-times" as const,
    sourceDoi: "10.1093/europace/euw346" as const,
    sourceNormalCompleteVentricularActivationDurationSec:
      Object.freeze([0.06, 0.08] as const),
    spatialClosure:
      "three-parallel-material-cohorts-sharing-wall-strain" as const,
    quadrature:
      "three-point-Simpson-exact-uniform-zeroth-first-second-delay-moments" as const,
    homogenizedStress:
      "positive-weighted-sum-of-cohort-Kirchhoff-stresses" as const,
    homogenizedAlgorithmicTangent:
      "same-positive-weighted-sum-of-consistent-cohort-tangents" as const,
    localCalciumWaveformChanged: false as const,
    localLandEquationParametersChanged: false as const,
    passiveOrParallelSlsConstitutiveLawChanged: false as const,
    cohortStatesAreIndependent: true as const,
    ventricularLandStateCountPerWall: 18 as const,
    atrialLandStateCountPerWall: 6 as const,
    circulationOrValveChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    canonicalAdoptionEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularLandActivationCohortProfileV1(
  profileId: MainWireVentricularLandActivationCohortProfileIdV1,
): MainWireVentricularLandActivationCohortProfileV1 {
  if (
    !MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_PROFILE_IDS_V1.includes(
      profileId,
    )
  ) {
    throw new Error(
      `unsupported ventricular activation-cohort profile: ${String(profileId)}`,
    );
  }
  const source =
    resolveMainWireVentricularCalciumActivationDistributionProfileV1(
      profileId as MainWireVentricularCalciumActivationDistributionProfileIdV1,
    );
  if (!source.withinDirectNormalElectricalActivationDurationBracket) {
    throw new Error("activation-cohort profile must stay in the direct source bracket");
  }
  return Object.freeze({
    modelId:
      MAIN_WIRE_VENTRICULAR_LAND_ACTIVATION_COHORT_HOMOGENIZATION_V1_ID,
    profileId,
    supportDurationSec: source.supportDurationSec as 0.06 | 0.08,
    delaySec: source.delaySec,
    weight01: source.weight01,
    cohortCountPerVentricularWall: 3 as const,
    localCalciumWaveformChangedFromCanonical: false as const,
    localLandParameterSetChanged: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    parameterSearchOrFitting: false as const,
  });
}
