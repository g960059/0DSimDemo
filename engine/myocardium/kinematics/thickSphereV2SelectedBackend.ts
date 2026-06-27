import type {
  GeneralizedCoordinateState,
  MyocardialKinematicsInput,
  MyocardialKinematicsModel,
  MyocardialKinematicsOutput,
} from "@/engine/myocardium/kinematics/contracts";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  thickSphereDEngineeringStrainDVolume,
  thickSphereGeometryAtVolume,
} from "@/engine/myocardium/kinematics/thickSphereSpikeV1";

export const THICK_SPHERE_V2_SELECTED_BACKEND_ID = "thick-sphere-v2";
export const THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID =
  "thick-sphere-v2-explicit-external-septal-coupling";
export const KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID =
  "kinematics-lv-thick-sphere-v2-calibration-candidate-v1";
export const KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID =
  "kinematics-rv-thick-sphere-v2-calibration-candidate-v1";
export const THICK_SPHERE_V2_LV_CAVITY_VOLUME_COORDINATE_ID = "lv-cavity-volume";
export const THICK_SPHERE_V2_RV_CAVITY_VOLUME_COORDINATE_ID = "rv-cavity-volume";

export type ThickSphereV2SelectedVentricle = "LV" | "RV";

export type ThickSphereV2SelectedParams = {
  readonly wallReferenceVolumeM3: number;
  readonly anchorCavityVolumeM3: number;
  readonly slackSarcomereLengthM: number;
  readonly anchorSarcomereLengthM: number;
  readonly sweepCavityVolumeMinM3: number;
  readonly sweepCavityVolumeMaxM3: number;
};

export type ThickSphereV2SelectedExternalSeptalCouplingBoundary = {
  readonly interfaceStatus: "interface-and-provenance-only";
  readonly implementationStatus: "not-implemented";
  readonly validationStatus: "not-claimed";
  readonly septalCoordinateStatus: "not-implemented";
  readonly biventricularCouplingStatus: "not-implemented";
  readonly rvPressureOverloadStatus: "not-claimed";
  readonly septalBowingStatus: "not-claimed";
  readonly ventricularInterdependenceStatus: "not-claimed";
  readonly rightHeartFailureStatus: "not-claimed";
};

export type ThickSphereV2SelectedParameterSet = ThickSphereV2SelectedParams & {
  readonly parameterSetId:
    | typeof KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID
    | typeof KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID;
  readonly backendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
  readonly selectedCandidateId: typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
  readonly ventricle: ThickSphereV2SelectedVentricle;
  readonly coordinateId:
    | typeof THICK_SPHERE_V2_LV_CAVITY_VOLUME_COORDINATE_ID
    | typeof THICK_SPHERE_V2_RV_CAVITY_VOLUME_COORDINATE_ID;
  readonly status: "calibration-candidate";
  readonly evidenceStatus: "selected-mechanics-calibration-readiness-only";
  readonly productionMechanics: "not-production-mechanics";
  readonly runtimeWiring: "not-runtime-wired";
  readonly parameterSetStableHash: string;
  readonly externalSeptalCoupling: ThickSphereV2SelectedExternalSeptalCouplingBoundary;
  readonly provenance: {
    readonly provenanceId:
      | "kinematics-lv-thick-sphere-v2-calibration-candidate-provenance-v1"
      | "kinematics-rv-thick-sphere-v2-calibration-candidate-provenance-v1";
    readonly calibrationCandidateOnly: true;
    readonly fitToPVLoop: false;
    readonly sourceDocumentRefs: readonly string[];
    readonly geometryFamily: "analytic-thick-sphere-formula-reuse";
    readonly strainMeasure: "finite-engineering-strain-from-midwall-radius";
    readonly couplingBoundary: "external-septal-interface-provenance-only";
  };
};

export type ThickSphereV2SelectedCalibrationCandidate = {
  readonly backendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
  readonly selectedCandidateId: typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
  readonly status: "calibration-readiness-candidate";
  readonly claim: "selected-mechanics-calibration-readiness-only";
  readonly executableStatus: "selected-thick-sphere-v2-calibration-candidate-executable";
  readonly productionCompletionStatus: "not-claimed";
  readonly runtimeWiringStatus: "not-runtime-wired";
  readonly phase3SpikeAliasStatus: "not-an-alias";
  readonly externalSeptalCoupling: ThickSphereV2SelectedExternalSeptalCouplingBoundary;
  readonly parameterSets: readonly [
    ThickSphereV2SelectedParameterSet,
    ThickSphereV2SelectedParameterSet,
  ];
  readonly candidateStableHash: string;
};

const EXTERNAL_SEPTAL_COUPLING_BOUNDARY =
  Object.freeze({
    interfaceStatus: "interface-and-provenance-only",
    implementationStatus: "not-implemented",
    validationStatus: "not-claimed",
    septalCoordinateStatus: "not-implemented",
    biventricularCouplingStatus: "not-implemented",
    rvPressureOverloadStatus: "not-claimed",
    septalBowingStatus: "not-claimed",
    ventricularInterdependenceStatus: "not-claimed",
    rightHeartFailureStatus: "not-claimed",
  } satisfies ThickSphereV2SelectedExternalSeptalCouplingBoundary);

const LV_PARAMETER_SET_BODY =
  Object.freeze({
    parameterSetId: KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    backendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    ventricle: "LV",
    coordinateId: THICK_SPHERE_V2_LV_CAVITY_VOLUME_COORDINATE_ID,
    status: "calibration-candidate",
    evidenceStatus: "selected-mechanics-calibration-readiness-only",
    productionMechanics: "not-production-mechanics",
    runtimeWiring: "not-runtime-wired",
    wallReferenceVolumeM3: 1.25e-4,
    anchorCavityVolumeM3: 1.1e-4,
    slackSarcomereLengthM: 1.9e-6,
    anchorSarcomereLengthM: 2.16e-6,
    sweepCavityVolumeMinM3: 5.0e-5,
    sweepCavityVolumeMaxM3: 1.7e-4,
    externalSeptalCoupling: EXTERNAL_SEPTAL_COUPLING_BOUNDARY,
    provenance: {
      provenanceId: "kinematics-lv-thick-sphere-v2-calibration-candidate-provenance-v1",
      calibrationCandidateOnly: true,
      fitToPVLoop: false,
      sourceDocumentRefs: [
        "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json",
        "data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json",
        "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md#phase-4d",
      ],
      geometryFamily: "analytic-thick-sphere-formula-reuse",
      strainMeasure: "finite-engineering-strain-from-midwall-radius",
      couplingBoundary: "external-septal-interface-provenance-only",
    },
  } satisfies Omit<ThickSphereV2SelectedParameterSet, "parameterSetStableHash">);

const RV_PARAMETER_SET_BODY =
  Object.freeze({
    parameterSetId: KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    backendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    ventricle: "RV",
    coordinateId: THICK_SPHERE_V2_RV_CAVITY_VOLUME_COORDINATE_ID,
    status: "calibration-candidate",
    evidenceStatus: "selected-mechanics-calibration-readiness-only",
    productionMechanics: "not-production-mechanics",
    runtimeWiring: "not-runtime-wired",
    wallReferenceVolumeM3: 5.5e-5,
    anchorCavityVolumeM3: 8.5e-5,
    slackSarcomereLengthM: 1.9e-6,
    anchorSarcomereLengthM: 2.08e-6,
    sweepCavityVolumeMinM3: 3.0e-5,
    sweepCavityVolumeMaxM3: 1.45e-4,
    externalSeptalCoupling: EXTERNAL_SEPTAL_COUPLING_BOUNDARY,
    provenance: {
      provenanceId: "kinematics-rv-thick-sphere-v2-calibration-candidate-provenance-v1",
      calibrationCandidateOnly: true,
      fitToPVLoop: false,
      sourceDocumentRefs: [
        "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json",
        "data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json",
        "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md#phase-4d",
      ],
      geometryFamily: "analytic-thick-sphere-formula-reuse",
      strainMeasure: "finite-engineering-strain-from-midwall-radius",
      couplingBoundary: "external-septal-interface-provenance-only",
    },
  } satisfies Omit<ThickSphereV2SelectedParameterSet, "parameterSetStableHash">);

export const THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET:
  ThickSphereV2SelectedParameterSet = Object.freeze({
    ...LV_PARAMETER_SET_BODY,
    parameterSetStableHash: stableHash(sanitizeForStableHash(LV_PARAMETER_SET_BODY)),
  });

export const THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET:
  ThickSphereV2SelectedParameterSet = Object.freeze({
    ...RV_PARAMETER_SET_BODY,
    parameterSetStableHash: stableHash(sanitizeForStableHash(RV_PARAMETER_SET_BODY)),
  });

export const THICK_SPHERE_V2_SELECTED_PARAMETER_SETS = Object.freeze([
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
] as const);

const SELECTED_CANDIDATE_BODY = Object.freeze({
  backendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  status: "calibration-readiness-candidate",
  claim: "selected-mechanics-calibration-readiness-only",
  executableStatus: "selected-thick-sphere-v2-calibration-candidate-executable",
  productionCompletionStatus: "not-claimed",
  runtimeWiringStatus: "not-runtime-wired",
  phase3SpikeAliasStatus: "not-an-alias",
  externalSeptalCoupling: EXTERNAL_SEPTAL_COUPLING_BOUNDARY,
  parameterSets: THICK_SPHERE_V2_SELECTED_PARAMETER_SETS,
} satisfies Omit<ThickSphereV2SelectedCalibrationCandidate, "candidateStableHash">);

export const THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE:
  ThickSphereV2SelectedCalibrationCandidate = Object.freeze({
    ...SELECTED_CANDIDATE_BODY,
    candidateStableHash: stableHash(sanitizeForStableHash(SELECTED_CANDIDATE_BODY)),
  });

export const ThickSphereV2SelectedBackend:
  MyocardialKinematicsModel<ThickSphereV2SelectedParameterSet> = Object.freeze({
    id: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    evaluate: evaluateThickSphereV2SelectedBackend,
  });

export function evaluateThickSphereV2SelectedBackend(
  input: MyocardialKinematicsInput,
  params: ThickSphereV2SelectedParameterSet,
): MyocardialKinematicsOutput {
  assertValidThickSphereV2SelectedParams(params);
  const coordinate = requireCandidateCavityVolumeCoordinate(input.coordinates, params);
  const valueFinite = Number.isFinite(coordinate.valueSI);
  const previousValueFinite = Number.isFinite(coordinate.previousValueSI);
  const rateFinite = Number.isFinite(coordinate.rateSI);
  const domainTolerance =
    Math.max(params.sweepCavityVolumeMinM3, params.sweepCavityVolumeMaxM3, 1) * 1e-12;
  const inCalibrationDomain =
    valueFinite
    && coordinate.valueSI >= params.sweepCavityVolumeMinM3 - domainTolerance
    && coordinate.valueSI <= params.sweepCavityVolumeMaxM3 + domainTolerance;

  if (!valueFinite || coordinate.valueSI <= 0) {
    return invalidOutput(params, inCalibrationDomain);
  }

  const geometry = thickSphereGeometryAtVolume(coordinate.valueSI, params.wallReferenceVolumeM3);
  const anchorGeometry = thickSphereGeometryAtVolume(
    params.anchorCavityVolumeM3,
    params.wallReferenceVolumeM3,
  );
  const sarcomereLengthM =
    params.anchorSarcomereLengthM * geometry.midwallRadiusM / anchorGeometry.midwallRadiusM;
  const fiberStretchRatio = sarcomereLengthM / params.slackSarcomereLengthM;
  const fiberEngineeringStrain = fiberStretchRatio - 1;
  const dStrainDVolume = thickSphereDEngineeringStrainDVolume(
    coordinate.valueSI,
    params,
    anchorGeometry.midwallRadiusM,
  );
  const fiberEngineeringStrainRatePerSec =
    Number.isFinite(dStrainDVolume) && rateFinite
      ? dStrainDVolume * coordinate.rateSI
      : Number.NaN;
  const finite =
    previousValueFinite
    && rateFinite
    && Number.isFinite(sarcomereLengthM)
    && Number.isFinite(fiberStretchRatio)
    && Number.isFinite(fiberEngineeringStrain)
    && Number.isFinite(dStrainDVolume)
    && Number.isFinite(fiberEngineeringStrainRatePerSec);

  return {
    sarcomereLengthM,
    fiberStretchRatio,
    fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec,
    coordinateIds: [params.coordinateId],
    dStrainDCoordinate: Float64Array.of(dStrainDVolume),
    wallReferenceVolumeM3: params.wallReferenceVolumeM3,
    geometryHealth: {
      finite,
      inCalibrationDomain,
    },
  };
}

export function assertValidThickSphereV2SelectedParams(
  params: ThickSphereV2SelectedParameterSet,
): void {
  if (params.backendId !== THICK_SPHERE_V2_SELECTED_BACKEND_ID) {
    throw new Error("thick-sphere-v2 selected candidate requires backendId thick-sphere-v2");
  }
  if (params.selectedCandidateId !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID) {
    throw new Error("thick-sphere-v2 selected candidate id mismatch");
  }
  if (params.status !== "calibration-candidate") {
    throw new Error("thick-sphere-v2 selected candidate requires calibration-candidate status");
  }
  if (
    params.productionMechanics !== "not-production-mechanics"
    || params.runtimeWiring !== "not-runtime-wired"
  ) {
    throw new Error("thick-sphere-v2 selected candidate must remain non-production and not runtime-wired");
  }
  const expectedParameterSetId =
    params.ventricle === "LV"
      ? KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID
      : KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID;
  const expectedCoordinateId =
    params.ventricle === "LV"
      ? THICK_SPHERE_V2_LV_CAVITY_VOLUME_COORDINATE_ID
      : THICK_SPHERE_V2_RV_CAVITY_VOLUME_COORDINATE_ID;
  if (params.parameterSetId !== expectedParameterSetId) {
    throw new Error("thick-sphere-v2 selected candidate parameter set id mismatch");
  }
  if (params.coordinateId !== expectedCoordinateId) {
    throw new Error("thick-sphere-v2 selected candidate coordinate id mismatch");
  }
  if (
    params.externalSeptalCoupling.interfaceStatus !== "interface-and-provenance-only"
    || params.externalSeptalCoupling.implementationStatus !== "not-implemented"
    || params.externalSeptalCoupling.validationStatus !== "not-claimed"
    || params.externalSeptalCoupling.septalCoordinateStatus !== "not-implemented"
    || params.externalSeptalCoupling.biventricularCouplingStatus !== "not-implemented"
    || params.externalSeptalCoupling.rvPressureOverloadStatus !== "not-claimed"
    || params.externalSeptalCoupling.septalBowingStatus !== "not-claimed"
    || params.externalSeptalCoupling.ventricularInterdependenceStatus !== "not-claimed"
    || params.externalSeptalCoupling.rightHeartFailureStatus !== "not-claimed"
  ) {
    throw new Error("thick-sphere-v2 selected external septal coupling must remain interface-only");
  }
  requirePositiveFinite(params.wallReferenceVolumeM3, "wallReferenceVolumeM3");
  requirePositiveFinite(params.anchorCavityVolumeM3, "anchorCavityVolumeM3");
  requirePositiveFinite(params.slackSarcomereLengthM, "slackSarcomereLengthM");
  requirePositiveFinite(params.anchorSarcomereLengthM, "anchorSarcomereLengthM");
  requirePositiveFinite(params.sweepCavityVolumeMinM3, "sweepCavityVolumeMinM3");
  requirePositiveFinite(params.sweepCavityVolumeMaxM3, "sweepCavityVolumeMaxM3");
  if (params.sweepCavityVolumeMinM3 >= params.sweepCavityVolumeMaxM3) {
    throw new Error("sweepCavityVolumeMinM3 must be less than sweepCavityVolumeMaxM3");
  }
  if (
    params.anchorCavityVolumeM3 < params.sweepCavityVolumeMinM3
    || params.anchorCavityVolumeM3 > params.sweepCavityVolumeMaxM3
  ) {
    throw new Error("anchorCavityVolumeM3 must be inside the sweep calibration domain");
  }
}

export function computeThickSphereV2SelectedParameterSetStableHash(
  parameterSet: ThickSphereV2SelectedParameterSet,
): string {
  const { parameterSetStableHash: _parameterSetStableHash, ...hashInput } = parameterSet;
  return stableHash(sanitizeForStableHash(hashInput));
}

export function computeThickSphereV2SelectedCandidateStableHash(
  candidate:
    ThickSphereV2SelectedCalibrationCandidate = THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE,
): string {
  const { candidateStableHash: _candidateStableHash, ...hashInput } = candidate;
  return stableHash(sanitizeForStableHash(hashInput));
}

function invalidOutput(
  params: ThickSphereV2SelectedParameterSet,
  inCalibrationDomain: boolean,
): MyocardialKinematicsOutput {
  return {
    sarcomereLengthM: Number.NaN,
    fiberStretchRatio: Number.NaN,
    fiberEngineeringStrain: Number.NaN,
    fiberEngineeringStrainRatePerSec: Number.NaN,
    coordinateIds: [params.coordinateId],
    dStrainDCoordinate: Float64Array.of(Number.NaN),
    wallReferenceVolumeM3: params.wallReferenceVolumeM3,
    geometryHealth: {
      finite: false,
      inCalibrationDomain,
    },
  };
}

function requireCandidateCavityVolumeCoordinate(
  coordinates: readonly GeneralizedCoordinateState[],
  params: ThickSphereV2SelectedParameterSet,
): GeneralizedCoordinateState {
  if (coordinates.length !== 1) {
    throw new Error("thick-sphere-v2 selected candidate requires exactly one cavity-volume coordinate");
  }
  const coordinate = coordinates[0];
  if (coordinate.id !== params.coordinateId) {
    throw new Error(`thick-sphere-v2 selected candidate requires coordinate id ${params.coordinateId}`);
  }
  if (coordinate.unit !== "m3") {
    throw new Error("thick-sphere-v2 selected candidate requires cavity-volume coordinate unit m3");
  }
  return coordinate;
}

function requirePositiveFinite(value: number, field: keyof ThickSphereV2SelectedParams): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}
