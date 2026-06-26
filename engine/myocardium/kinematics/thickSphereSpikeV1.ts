import type {
  GeneralizedCoordinateState,
  MyocardialKinematicsInput,
  MyocardialKinematicsModel,
  MyocardialKinematicsOutput,
} from "@/engine/myocardium/kinematics/contracts";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";

export const THICK_SPHERE_SPIKE_V1_ID = "thick-sphere-spike-v1";
export const THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID = "cavity-volume";
export const THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID =
  "thick-sphere-spike-phase3a-candidate-v1";

export type ThickSphereSpikeV1Params = {
  readonly wallReferenceVolumeM3: number;
  readonly anchorCavityVolumeM3: number;
  readonly slackSarcomereLengthM: number;
  readonly anchorSarcomereLengthM: number;
  readonly sweepCavityVolumeMinM3: number;
  readonly sweepCavityVolumeMaxM3: number;
};

export type ThickSphereSpikeV1ParameterSet = ThickSphereSpikeV1Params & {
  readonly parameterSetId: typeof THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID;
  readonly modelId: typeof THICK_SPHERE_SPIKE_V1_ID;
  readonly status: "candidate";
  readonly evidenceStatus: "synthetic-geometry-closure-only";
  readonly productionMechanics: "not-production-mechanics";
  readonly parameterSetStableHash: string;
  readonly provenance: {
    readonly provenanceId: "thick-sphere-phase3a-candidate-provenance-v1";
    readonly candidateOnly: true;
    readonly fitToPVLoop: false;
    readonly sourceDocumentRefs: readonly string[];
    readonly rationale: string;
    readonly midwallConvention: "arithmetic-mean-midwall-phase3a-only";
  };
};

const THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_BODY =
  Object.freeze({
    parameterSetId: THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
    modelId: THICK_SPHERE_SPIKE_V1_ID,
    status: "candidate",
    evidenceStatus: "synthetic-geometry-closure-only",
    productionMechanics: "not-production-mechanics",
    wallReferenceVolumeM3: 1.2e-4,
    anchorCavityVolumeM3: 1.2e-4,
    slackSarcomereLengthM: 1.9e-6,
    anchorSarcomereLengthM: 2.2e-6,
    sweepCavityVolumeMinM3: 5e-5,
    sweepCavityVolumeMaxM3: 1.6e-4,
    provenance: {
      provenanceId: "thick-sphere-phase3a-candidate-provenance-v1",
      candidateOnly: true,
      fitToPVLoop: false,
      sourceDocumentRefs: [
        "docs/myocardium/model-spec/myocardium-land-v1.md#7.9",
        "docs/myocardium/model-spec/myocardium-land-v1.md#10.2",
        "docs/myocardium/verification/myocardium-v1-verification.md",
        "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md#phase-3",
      ],
      rationale:
        "Phase 3A fixed synthetic geometry closure candidate; not fit to PV-loop or downstream loaded behavior.",
      midwallConvention: "arithmetic-mean-midwall-phase3a-only",
    },
  } satisfies Omit<ThickSphereSpikeV1ParameterSet, "parameterSetStableHash">);

export const THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET:
  ThickSphereSpikeV1ParameterSet = Object.freeze({
    ...THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_BODY,
    parameterSetStableHash: stableHash(
      sanitizeForStableHash(THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_BODY),
    ),
  });

export const ThickSphereSpikeV1: MyocardialKinematicsModel<ThickSphereSpikeV1Params> = Object.freeze({
  id: THICK_SPHERE_SPIKE_V1_ID,
  evaluate: evaluateThickSphereSpikeV1,
});

export function evaluateThickSphereSpikeV1(
  input: MyocardialKinematicsInput,
  params: ThickSphereSpikeV1Params,
): MyocardialKinematicsOutput {
  assertValidThickSphereSpikeV1Params(params);
  const coordinate = requireCavityVolumeCoordinate(input.coordinates);
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
    coordinateIds: [THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID],
    dStrainDCoordinate: Float64Array.of(dStrainDVolume),
    wallReferenceVolumeM3: params.wallReferenceVolumeM3,
    geometryHealth: {
      finite,
      inCalibrationDomain,
    },
  };
}

export function assertValidThickSphereSpikeV1Params(params: ThickSphereSpikeV1Params): void {
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

export function computeThickSphereSpikeParameterSetStableHash(
  parameterSet: ThickSphereSpikeV1ParameterSet = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
): string {
  const { parameterSetStableHash: _parameterSetStableHash, ...hashInput } = parameterSet;
  return stableHash(sanitizeForStableHash(hashInput));
}

export function thickSphereGeometryAtVolume(
  cavityVolumeM3: number,
  wallReferenceVolumeM3: number,
): {
  readonly innerRadiusM: number;
  readonly outerRadiusM: number;
  readonly midwallRadiusM: number;
} {
  const innerRadiusM = Math.cbrt((3 * cavityVolumeM3) / (4 * Math.PI));
  const outerRadiusM = Math.cbrt((3 * (cavityVolumeM3 + wallReferenceVolumeM3)) / (4 * Math.PI));
  return {
    innerRadiusM,
    outerRadiusM,
    midwallRadiusM: (innerRadiusM + outerRadiusM) / 2,
  };
}

export function thickSphereDEngineeringStrainDVolume(
  cavityVolumeM3: number,
  params: ThickSphereSpikeV1Params,
  anchorMidwallRadiusM = thickSphereGeometryAtVolume(
    params.anchorCavityVolumeM3,
    params.wallReferenceVolumeM3,
  ).midwallRadiusM,
): number {
  const geometry = thickSphereGeometryAtVolume(cavityVolumeM3, params.wallReferenceVolumeM3);
  return (
    (params.anchorSarcomereLengthM / (params.slackSarcomereLengthM * anchorMidwallRadiusM))
    * 0.5
    * (
      1 / (4 * Math.PI * geometry.innerRadiusM ** 2)
      + 1 / (4 * Math.PI * geometry.outerRadiusM ** 2)
    )
  );
}

function invalidOutput(
  params: ThickSphereSpikeV1Params,
  inCalibrationDomain: boolean,
): MyocardialKinematicsOutput {
  return {
    sarcomereLengthM: Number.NaN,
    fiberStretchRatio: Number.NaN,
    fiberEngineeringStrain: Number.NaN,
    fiberEngineeringStrainRatePerSec: Number.NaN,
    coordinateIds: [THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID],
    dStrainDCoordinate: Float64Array.of(Number.NaN),
    wallReferenceVolumeM3: params.wallReferenceVolumeM3,
    geometryHealth: {
      finite: false,
      inCalibrationDomain,
    },
  };
}

function requireCavityVolumeCoordinate(
  coordinates: readonly GeneralizedCoordinateState[],
): GeneralizedCoordinateState {
  if (coordinates.length !== 1) {
    throw new Error("thick-sphere-spike-v1 requires exactly one generalized coordinate");
  }
  const coordinate = coordinates[0];
  if (coordinate.id !== THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID) {
    throw new Error("thick-sphere-spike-v1 requires coordinate id cavity-volume");
  }
  if (coordinate.unit !== "m3") {
    throw new Error("thick-sphere-spike-v1 requires cavity-volume coordinate unit m3");
  }
  return coordinate;
}

function requirePositiveFinite(value: number, field: keyof ThickSphereSpikeV1Params): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}
