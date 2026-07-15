import { LAND_LENGTH_REFERENCE_ADAPTER_V1_ID } from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertLandWallAdapterContextV1,
  type LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

const LAND_LENGTH_REFERENCE_OUTPUTS_V1 = new WeakSet<object>();
const LAND_LENGTH_STATE_OUTPUTS_V1 = new WeakSet<object>();

export type LandLengthStateInputV1 = {
  readonly fiberLogStrain: number;
};

export type LandLengthStateOutputV1 = {
  readonly adapterId: typeof LAND_LENGTH_REFERENCE_ADAPTER_V1_ID;
  readonly tissueManifestSha256: string;
  readonly passiveAndSlsLogStrain: number;
  readonly geometryStretch: number;
  readonly landStretch: number;
  readonly landEngineeringStrain: number;
  readonly landStretchDerivativeByLogStrain: number;
};

export type LandLengthReferenceInput = {
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
};

export type LandLengthReferenceOutput = LandLengthStateOutputV1 & {
  readonly passiveAndSlsLogStrainRatePerSec: number;
  readonly landStretchRatePerSec: number;
};

/** Pure geometry-to-Land-length mapping for state residual and stress assembly. */
export function evaluateLandLengthStateV1(
  context: LandWallAdapterContextV1,
  input: LandLengthStateInputV1,
): LandLengthStateOutputV1 {
  assertLandWallAdapterContextV1(context);
  assertExactPlainRecordV1(
    input,
    ["fiberLogStrain"],
    "landLengthStateInput",
  );
  const fiberLogStrain = requireFinite(input.fiberLogStrain, "fiberLogStrain");
  const geometryStretch = Math.exp(fiberLogStrain);
  const landStretch = context.lambdaLandSlack * geometryStretch;
  if (!Number.isFinite(geometryStretch) || geometryStretch <= 0) {
    throw new Error("exp(fiberLogStrain) must be positive and finite");
  }
  if (!Number.isFinite(landStretch) || landStretch <= 0) {
    throw new Error(
      "lambdaLandSlack * exp(fiberLogStrain) must be positive and finite",
    );
  }
  const output: LandLengthStateOutputV1 = Object.freeze({
    adapterId: LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
    tissueManifestSha256: context.tissueManifestSha256,
    passiveAndSlsLogStrain: fiberLogStrain,
    geometryStretch,
    landStretch,
    landEngineeringStrain: landStretch - 1,
    landStretchDerivativeByLogStrain: landStretch,
  });
  LAND_LENGTH_STATE_OUTPUTS_V1.add(output);
  return output;
}

export function evaluateLandLengthReferenceV1(
  context: LandWallAdapterContextV1,
  input: LandLengthReferenceInput,
): LandLengthReferenceOutput {
  assertLandWallAdapterContextV1(context);
  assertExactPlainRecordV1(
    input,
    ["fiberLogStrain", "fiberLogStrainRatePerSec"],
    "landLengthReferenceInput",
  );
  const lengthState = evaluateLandLengthStateV1(context, {
    fiberLogStrain: input.fiberLogStrain,
  });
  const fiberLogStrainRatePerSec = requireFinite(
    input.fiberLogStrainRatePerSec,
    "fiberLogStrainRatePerSec",
  );
  const { landStretch } = lengthState;
  const landStretchRatePerSec = landStretch * fiberLogStrainRatePerSec;
  if (!Number.isFinite(landStretchRatePerSec)) {
    throw new Error("landStretch * fiberLogStrainRatePerSec became non-finite");
  }

  const output: LandLengthReferenceOutput = Object.freeze({
    ...lengthState,
    passiveAndSlsLogStrainRatePerSec: fiberLogStrainRatePerSec,
    landStretchRatePerSec,
  });
  LAND_LENGTH_STATE_OUTPUTS_V1.add(output);
  LAND_LENGTH_REFERENCE_OUTPUTS_V1.add(output);
  return output;
}

export function assertLandLengthStateOutputV1(
  output: LandLengthStateOutputV1,
): LandLengthStateOutputV1 {
  if (!LAND_LENGTH_STATE_OUTPUTS_V1.has(output)) {
    throw new Error(
      "Land length state must be produced by wall-log-strain-to-land-length-v1",
    );
  }
  return output;
}

export function assertLandLengthReferenceOutputV1(
  output: LandLengthReferenceOutput,
): LandLengthReferenceOutput {
  if (!LAND_LENGTH_REFERENCE_OUTPUTS_V1.has(output)) {
    throw new Error("Land length output must be produced by wall-log-strain-to-land-length-v1");
  }
  return output;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}
