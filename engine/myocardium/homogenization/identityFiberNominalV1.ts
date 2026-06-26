import type {
  HomogenizationInput,
  HomogenizedActiveOutput,
  MyocardiumHomogenizationAdapter,
} from "@/engine/myocardium/homogenization/contracts";

export const IDENTITY_FIBER_NOMINAL_V1_ID = "identity-fiber-nominal-v1";

export type IdentityFiberNominalV1Params = {
  readonly activeTissueFraction: 1;
  readonly orientationRuleId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
  readonly allowFreeGain: false;
  readonly fitToPVLoop: false;
};

export const IDENTITY_FIBER_NOMINAL_V1_PARAMS: IdentityFiberNominalV1Params = Object.freeze({
  activeTissueFraction: 1,
  orientationRuleId: IDENTITY_FIBER_NOMINAL_V1_ID,
  allowFreeGain: false,
  fitToPVLoop: false,
});

export const IdentityFiberNominalV1:
  MyocardiumHomogenizationAdapter<IdentityFiberNominalV1Params> = Object.freeze({
    id: IDENTITY_FIBER_NOMINAL_V1_ID,
    evaluate: evaluateIdentityFiberNominalV1,
  });

export function evaluateIdentityFiberNominalV1(
  input: HomogenizationInput,
  params: IdentityFiberNominalV1Params = IDENTITY_FIBER_NOMINAL_V1_PARAMS,
): HomogenizedActiveOutput {
  assertIdentityFiberNominalV1Params(params);
  assertValidHomogenizationInput(input);

  return {
    wallActiveNominalStressPa: input.source.sourceActiveFiberStressPa,
    wallStabilizationStiffnessPa: input.source.stabilizationStiffnessPa,
    ...(input.source.algorithmicTangentPa === undefined
      ? {}
      : { wallAlgorithmicTangentPa: input.source.algorithmicTangentPa }),
    homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
    activeTissueFraction: 1,
    orientationRuleId: IDENTITY_FIBER_NOMINAL_V1_ID,
  };
}

export function assertIdentityFiberNominalV1Params(params: IdentityFiberNominalV1Params): void {
  if (params.activeTissueFraction !== 1) {
    throw new Error("identity-fiber-nominal-v1 requires activeTissueFraction=1");
  }
  if (params.orientationRuleId !== IDENTITY_FIBER_NOMINAL_V1_ID) {
    throw new Error("identity-fiber-nominal-v1 requires its fixed orientationRuleId");
  }
  if (params.allowFreeGain !== false || params.fitToPVLoop !== false) {
    throw new Error("identity-fiber-nominal-v1 forbids free gain and PV-loop fitting");
  }
}

function assertValidHomogenizationInput(input: HomogenizationInput): void {
  requirePositiveFinite(input.wallReferenceVolumeM3, "HomogenizationInput.wallReferenceVolumeM3");
  if (input.source.sourceStressConvention !== "land2017-Ta") {
    throw new Error("identity-fiber-nominal-v1 only accepts sourceStressConvention land2017-Ta");
  }
  requireFinite(input.source.sourceActiveFiberStressPa, "source.sourceActiveFiberStressPa");
  requireFinite(input.source.stabilizationStiffnessPa, "source.stabilizationStiffnessPa");
  requireFinite(input.source.sourceActivePowerDensityWPerM3, "source.sourceActivePowerDensityWPerM3");
  if (input.source.algorithmicTangentPa !== undefined) {
    requireFinite(input.source.algorithmicTangentPa, "source.algorithmicTangentPa");
  }
  if (!input.source.health.finite) {
    throw new Error("identity-fiber-nominal-v1 requires finite source health");
  }
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}
