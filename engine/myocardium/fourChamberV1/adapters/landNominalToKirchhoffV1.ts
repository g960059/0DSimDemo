import { LAND_LENGTH_REFERENCE_ADAPTER_V1_ID, LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID } from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertLandLengthStateOutputV1,
  assertLandLengthReferenceOutputV1,
  type LandLengthStateOutputV1,
  type LandLengthReferenceOutput,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  assertLandWallAdapterContextV1,
  type LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export type LandNominalToKirchhoffInput = {
  readonly sourceStressConvention: "land2017-Ta";
  readonly landActiveNominalStressPa: number;
  readonly landActiveNominalAlgorithmicTangentPaPerLandStretch?: number;
  readonly length: LandLengthReferenceOutput;
};

export type LandNominalToKirchhoffStateInputV1 = {
  readonly sourceStressConvention: "land2017-Ta";
  readonly landActiveNominalStressPa: number;
  readonly landActiveNominalPartialPaPerLandStretch?: number;
  readonly length: LandLengthStateOutputV1;
};

export type LandNominalToKirchhoffStateOutputV1 = {
  readonly adapterId: typeof LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID;
  readonly sourceStressMeasure: "nominal-conjugate-to-land-stretch";
  readonly wallStressMeasure: "kirchhoff-conjugate-to-fiber-log-strain";
  readonly tissueManifestSha256: string;
  readonly orientationRuleId: LandWallAdapterContextV1["orientationRuleId"];
  readonly chiOrient: 1;
  readonly fViable: number;
  readonly viabilityEvidenceId: string;
  readonly wallActiveKirchhoffStressPa: number;
  readonly wallActivePartialPaPerFiberLogStrain?: number;
};

export type LandNominalToKirchhoffOutput = {
  readonly adapterId: typeof LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID;
  readonly sourceStressMeasure: "nominal-conjugate-to-land-stretch";
  readonly wallStressMeasure: "kirchhoff-conjugate-to-fiber-log-strain";
  readonly tissueManifestSha256: string;
  readonly orientationRuleId: LandWallAdapterContextV1["orientationRuleId"];
  readonly chiOrient: 1;
  readonly fViable: number;
  readonly viabilityEvidenceId: string;
  readonly wallActiveKirchhoffStressPa: number;
  readonly landSourceOnlyActivePowerDensityWPerM3: number;
  readonly homogenizedSourceActivePowerDensityWPerM3: number;
  readonly wallActiveStressPowerDensityWPerM3: number;
  readonly wallActiveMechanicalOutputPowerDensityWPerM3: number;
  readonly adapterWorkClosureResidualWPerM3: number;
  readonly wallAlgorithmicTangentPaPerFiberLogStrain?: number;
};

/** Stress-only transform used by rate-free monolithic state assembly. */
export function evaluateLandNominalToKirchhoffAtStateV1(
  context: LandWallAdapterContextV1,
  input: LandNominalToKirchhoffStateInputV1,
): LandNominalToKirchhoffStateOutputV1 {
  assertLandWallAdapterContextV1(context);
  assertExactPlainRecordV1(
    input,
    hasOwn(input, "landActiveNominalPartialPaPerLandStretch")
      ? [
        "sourceStressConvention",
        "landActiveNominalStressPa",
        "landActiveNominalPartialPaPerLandStretch",
        "length",
      ]
      : ["sourceStressConvention", "landActiveNominalStressPa", "length"],
    "landNominalToKirchhoffStateInput",
  );
  assertLandLengthStateOutputV1(input.length);
  if (input.sourceStressConvention !== "land2017-Ta") {
    throw new Error(
      "Land nominal-to-Kirchhoff v1 only accepts sourceStressConvention land2017-Ta",
    );
  }
  if (input.length.adapterId !== LAND_LENGTH_REFERENCE_ADAPTER_V1_ID) {
    throw new Error(
      "Land nominal-to-Kirchhoff v1 requires the v1 length-reference adapter",
    );
  }
  if (input.length.tissueManifestSha256 !== context.tissueManifestSha256) {
    throw new Error(
      "Land length output and wall adapter context must use the same tissue manifest hash",
    );
  }
  const fiberLogStrain = requireFinite(
    input.length.passiveAndSlsLogStrain,
    "length.passiveAndSlsLogStrain",
  );
  const geometryStretch = requirePositiveFinite(
    input.length.geometryStretch,
    "length.geometryStretch",
  );
  const landStretch = requirePositiveFinite(
    input.length.landStretch,
    "length.landStretch",
  );
  requireFinite(input.length.landEngineeringStrain, "length.landEngineeringStrain");
  requireFinite(
    input.length.landStretchDerivativeByLogStrain,
    "length.landStretchDerivativeByLogStrain",
  );
  requireNear(
    input.length.landEngineeringStrain,
    landStretch - 1,
    "length.landEngineeringStrain",
  );
  requireNear(
    input.length.landStretchDerivativeByLogStrain,
    landStretch,
    "length.landStretchDerivativeByLogStrain",
  );
  requireNear(geometryStretch, Math.exp(fiberLogStrain), "length.geometryStretch");
  requireNear(
    landStretch,
    context.lambdaLandSlack * geometryStretch,
    "length.landStretch",
  );
  const sourceStress = requireFinite(
    input.landActiveNominalStressPa,
    "landActiveNominalStressPa",
  );
  const sourcePartial = input.landActiveNominalPartialPaPerLandStretch;
  if (sourcePartial !== undefined) {
    requireFinite(sourcePartial, "landActiveNominalPartialPaPerLandStretch");
  }
  const wallActiveKirchhoffStressPa =
    landStretch * context.chiOrient * context.fViable * sourceStress;
  const wallActivePartialPaPerFiberLogStrain = sourcePartial === undefined
    ? undefined
    : context.chiOrient * context.fViable * (
      landStretch * sourceStress + landStretch * landStretch * sourcePartial
    );
  requireDerivedFinite(
    wallActiveKirchhoffStressPa,
    "wallActiveKirchhoffStressPa",
  );
  if (wallActivePartialPaPerFiberLogStrain !== undefined) {
    requireDerivedFinite(
      wallActivePartialPaPerFiberLogStrain,
      "wallActivePartialPaPerFiberLogStrain",
    );
  }
  return Object.freeze({
    adapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
    sourceStressMeasure: "nominal-conjugate-to-land-stretch",
    wallStressMeasure: "kirchhoff-conjugate-to-fiber-log-strain",
    tissueManifestSha256: context.tissueManifestSha256,
    orientationRuleId: context.orientationRuleId,
    chiOrient: context.chiOrient,
    fViable: context.fViable,
    viabilityEvidenceId: context.viabilityEvidenceId,
    wallActiveKirchhoffStressPa,
    ...(wallActivePartialPaPerFiberLogStrain === undefined
      ? {}
      : { wallActivePartialPaPerFiberLogStrain }),
  });
}

export function evaluateLandNominalToKirchhoffV1(
  context: LandWallAdapterContextV1,
  input: LandNominalToKirchhoffInput,
): LandNominalToKirchhoffOutput {
  assertLandWallAdapterContextV1(context);
  assertExactPlainRecordV1(
    input,
    hasOwn(input, "landActiveNominalAlgorithmicTangentPaPerLandStretch")
      ? [
        "sourceStressConvention",
        "landActiveNominalStressPa",
        "landActiveNominalAlgorithmicTangentPaPerLandStretch",
        "length",
      ]
      : ["sourceStressConvention", "landActiveNominalStressPa", "length"],
    "landNominalToKirchhoffInput",
  );
  assertLandLengthReferenceOutputV1(input.length);
  const stateTransform = evaluateLandNominalToKirchhoffAtStateV1(context, {
    sourceStressConvention: input.sourceStressConvention,
    landActiveNominalStressPa: input.landActiveNominalStressPa,
    ...(input.landActiveNominalAlgorithmicTangentPaPerLandStretch === undefined
      ? {}
      : {
        landActiveNominalPartialPaPerLandStretch:
          input.landActiveNominalAlgorithmicTangentPaPerLandStretch,
      }),
    length: input.length,
  });
  const fiberLogStrainRatePerSec = requireFinite(
    input.length.passiveAndSlsLogStrainRatePerSec,
    "length.passiveAndSlsLogStrainRatePerSec",
  );
  const landStretch = input.length.landStretch;
  requireFinite(input.length.landStretchRatePerSec, "length.landStretchRatePerSec");
  requireNear(input.length.landStretchRatePerSec, landStretch * fiberLogStrainRatePerSec, "length.landStretchRatePerSec");
  const landActiveNominalStressPa = input.landActiveNominalStressPa;
  const chiOrient = context.chiOrient;
  const fViable = context.fViable;
  const wallActiveKirchhoffStressPa = stateTransform.wallActiveKirchhoffStressPa;
  const wallActiveStressPowerDensityWPerM3 =
    wallActiveKirchhoffStressPa * fiberLogStrainRatePerSec;
  const landSourceOnlyActivePowerDensityWPerM3 =
    landActiveNominalStressPa * input.length.landStretchRatePerSec;
  const homogenizedSourceActivePowerDensityWPerM3 =
    chiOrient * fViable * landSourceOnlyActivePowerDensityWPerM3;
  const wallAlgorithmicTangentPaPerFiberLogStrain =
    stateTransform.wallActivePartialPaPerFiberLogStrain;
  requireDerivedFinite(wallActiveKirchhoffStressPa, "wallActiveKirchhoffStressPa");
  requireDerivedFinite(landSourceOnlyActivePowerDensityWPerM3, "landSourceOnlyActivePowerDensityWPerM3");
  requireDerivedFinite(homogenizedSourceActivePowerDensityWPerM3, "homogenizedSourceActivePowerDensityWPerM3");
  requireDerivedFinite(wallActiveStressPowerDensityWPerM3, "wallActiveStressPowerDensityWPerM3");
  if (wallAlgorithmicTangentPaPerFiberLogStrain !== undefined) {
    requireDerivedFinite(wallAlgorithmicTangentPaPerFiberLogStrain, "wallAlgorithmicTangentPaPerFiberLogStrain");
  }
  const adapterWorkClosureResidualWPerM3 =
    wallActiveStressPowerDensityWPerM3 - homogenizedSourceActivePowerDensityWPerM3;
  requireDerivedFinite(adapterWorkClosureResidualWPerM3, "adapterWorkClosureResidualWPerM3");

  return Object.freeze({
    adapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
    sourceStressMeasure: "nominal-conjugate-to-land-stretch",
    wallStressMeasure: "kirchhoff-conjugate-to-fiber-log-strain",
    tissueManifestSha256: context.tissueManifestSha256,
    orientationRuleId: context.orientationRuleId,
    chiOrient,
    fViable,
    viabilityEvidenceId: context.viabilityEvidenceId,
    wallActiveKirchhoffStressPa,
    landSourceOnlyActivePowerDensityWPerM3,
    homogenizedSourceActivePowerDensityWPerM3,
    wallActiveStressPowerDensityWPerM3,
    wallActiveMechanicalOutputPowerDensityWPerM3: -wallActiveStressPowerDensityWPerM3,
    adapterWorkClosureResidualWPerM3,
    ...(wallAlgorithmicTangentPaPerFiberLogStrain === undefined
      ? {}
      : { wallAlgorithmicTangentPaPerFiberLogStrain }),
  });
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requireNear(value: number, expected: number, field: string): void {
  if (!Number.isFinite(expected)) {
    throw new Error(`${field} expected value became non-finite`);
  }
  const tolerance = 32 * Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(expected));
  if (Math.abs(value - expected) > tolerance) {
    throw new Error(`${field} is inconsistent with the v1 length-reference adapter`);
  }
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireDerivedFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} became non-finite`);
}

function hasOwn(value: unknown, key: string): boolean {
  return value !== null
    && typeof value === "object"
    && Object.prototype.hasOwnProperty.call(value, key);
}
