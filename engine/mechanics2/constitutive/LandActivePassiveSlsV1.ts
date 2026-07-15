import {
  commitLand2017ActiveOnlyTrialV1,
  initialLand2017ActiveOnlyStateV1,
  trialLand2017ActiveOnlyV1,
  type Land2017ActiveOnlyParamsV1,
  type Land2017ActiveOnlyStateV1,
  type Land2017ActiveOnlyTrialV1,
} from "@/engine/mechanics2/activation/Land2017ActiveOnlyV1";
import { assertValidLiteratureLand2017ActiveOnlyParamsV1 } from
  "@/engine/mechanics2/activation/LiteratureLand2017ActiveOnlyParamsV1";
import {
  commitEquilibriumPassiveSlsParallelTrialV1,
  initialEquilibriumPassiveSlsParallelStateV1,
  prepareEquilibriumPassiveSlsParallelParamsV1,
  trialEquilibriumPassiveSlsParallelV1,
  validateEquilibriumPassiveSlsParallelParamsV1,
  type EquilibriumPassiveSlsParallelParamsV1,
  type EquilibriumPassiveSlsParallelStateV1,
  type EquilibriumPassiveSlsParallelTrialV1,
} from "@/engine/mechanics2/constitutive/EquilibriumPassiveSlsParallelV1";
export const LAND_ACTIVE_PASSIVE_SLS_V1_ID =
  "land-active-equilibrium-passive-sls-v1" as const;

export const LAND_ACTIVE_PASSIVE_SLS_CLAIM_V1 = Object.freeze({
  topology:
    "Land2017-active-only-plus-equilibrium-passive-plus-optional-parallel-one-state-SLS" as const,
  activeExternalSeriesElasticElementAdded: false as const,
  activePostHocForceVelocityMultiplierAdded: false as const,
  sourceLandTrefOrKineticsModifiedByComposite: false as const,
  activeHomogenizationScale:
    "explicit-positive-dimensionless-composite-parameter-default-one" as const,
  activeHomogenizationScaleAppliedTo:
    "effective-transmitted-active-stress-and-all-composite-active-work-readbacks" as const,
  passiveMemoryOwnsActiveStress: false as const,
  strainMeasure: "natural-log-strain" as const,
  stressMeasure: "one-dimensional-Kirchhoff-stress" as const,
  pureTrialExplicitCommit: true as const,
});

export type LandActivePassiveSlsParamsInputV1 = {
  readonly materialId: string;
  readonly active: Land2017ActiveOnlyParamsV1;
  readonly passiveSls: EquilibriumPassiveSlsParallelParamsV1;
  /**
   * Tissue/cell homogenization factor applied after the source-faithful Land
   * nominal-to-Kirchhoff map.  It changes neither source Land parameters nor
   * Tref.  Omission at preparation means exactly one.
   */
  readonly activeHomogenizationScale?: number;
};

export type LandActivePassiveSlsParamsV1 = {
  readonly materialId: string;
  readonly active: Land2017ActiveOnlyParamsV1;
  readonly passiveSls: EquilibriumPassiveSlsParallelParamsV1;
  readonly activeHomogenizationScale: number;
};

declare const PREPARED_LAND_ACTIVE_PASSIVE_SLS_PARAMS_V1: unique symbol;

export type PreparedLandActivePassiveSlsParamsV1 =
  LandActivePassiveSlsParamsV1 & {
    readonly [PREPARED_LAND_ACTIVE_PASSIVE_SLS_PARAMS_V1]: true;
  };

const PREPARED_PARAM_OBJECTS = new WeakSet<object>();

export type LandActivePassiveSlsStateV1 = {
  readonly kind: typeof LAND_ACTIVE_PASSIVE_SLS_V1_ID;
  readonly active: Land2017ActiveOnlyStateV1;
  readonly passiveSls: EquilibriumPassiveSlsParallelStateV1;
  /** Exact effective material identity; a mismatch requires cold state. */
  readonly materialIdentityCanonicalJson: string;
};

export type LandActivePassiveSlsReadbackV1 = {
  readonly freeCalciumUm: number;
  readonly activation01: number;
  readonly fiberLogStrain: number;
  readonly stresses: {
    readonly passiveEquilibriumPa: number;
    /** Cellular Land stress after the source nominal-to-wall Kirchhoff map. */
    readonly mappedCellularLandActivePa: number;
    /** Stress actually transmitted to the macro wall/circulation. */
    readonly effectiveTransmittedActivePa: number;
    readonly slsOverstressPa: number;
    readonly totalTransmittedPa: number;
  };
  readonly activeMapping: {
    readonly activeHomogenizationScale: number;
    readonly sourceNominalActiveStressPa: number;
    readonly mappedCellularWallActiveKirchhoffStressPa: number;
    readonly effectiveTransmittedActiveKirchhoffStressPa: number;
  };
  readonly activeWork: {
    readonly continuousTissueEquivalentSourcePowerDensityWPerM3: number;
    readonly continuousEffectiveWallPowerDensityWPerM3: number;
    readonly continuousPowerResidualWPerM3: number;
    readonly discreteTissueEquivalentSourcePowerDensityWPerM3: number;
    readonly discreteEffectiveWallPowerDensityWPerM3: number;
    readonly discretePowerResidualWPerM3: number;
    readonly tissueEquivalentSourceReportedPowerDensityWPerM3: number;
    readonly sourceReportedPowerResidualWPerM3: number;
    readonly finiteDifferenceEffectiveWorkConjugateStressPa: number;
    readonly finiteDifferenceWorkConjugacyResidualPa: number;
  };
  readonly tangentsPa: {
    readonly passivePlusSlsAlgorithmicPa: number;
    readonly landAlgorithmicTangentAvailable: false;
  };
  readonly energies: {
    readonly passiveEquilibriumStorageJPerM3: number;
    readonly slsStorageJPerM3: number;
  };
  readonly claim: typeof LAND_ACTIVE_PASSIVE_SLS_CLAIM_V1;
};

export type LandActivePassiveSlsTrialV1 = {
  readonly previousState: LandActivePassiveSlsStateV1;
  readonly nextState: LandActivePassiveSlsStateV1 | null;
  readonly activeTrial: Land2017ActiveOnlyTrialV1;
  readonly passiveSlsTrial: EquilibriumPassiveSlsParallelTrialV1;
  readonly readback: LandActivePassiveSlsReadbackV1 | null;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
};

export function prepareLandActivePassiveSlsParamsV1(
  params: LandActivePassiveSlsParamsInputV1,
): PreparedLandActivePassiveSlsParamsV1 {
  if (
    typeof params.materialId !== "string" ||
    params.materialId.trim() === ""
  ) {
    throw new Error("materialId must be a non-empty string");
  }
  assertValidLiteratureLand2017ActiveOnlyParamsV1(params.active);
  const active = Object.freeze({
    ...params.active,
    solveOptions: Object.freeze({ ...params.active.solveOptions }),
  });
  const passiveSls = prepareEquilibriumPassiveSlsParallelParamsV1(
    params.passiveSls,
  );
  const activeHomogenizationScale = params.activeHomogenizationScale ?? 1;
  validateActiveHomogenizationScale(activeHomogenizationScale);
  const prepared = Object.freeze({
    materialId: params.materialId,
    active,
    passiveSls,
    activeHomogenizationScale,
  }) as unknown as PreparedLandActivePassiveSlsParamsV1;
  PREPARED_PARAM_OBJECTS.add(prepared);
  return prepared;
}

export function landActivePassiveSlsMaterialIdentityV1(
  params: LandActivePassiveSlsParamsV1,
): string {
  return stableStringify({
    materialId: params.materialId,
    active: params.active,
    passiveSls: params.passiveSls,
    activeHomogenizationScale: params.activeHomogenizationScale,
  });
}

export function initialLandActivePassiveSlsStateV1(
  fiberLogStrain: number,
  freeCalciumUm: number,
  params: LandActivePassiveSlsParamsV1,
): LandActivePassiveSlsStateV1 {
  validatePreparedOrParams(params);
  return Object.freeze({
    kind: LAND_ACTIVE_PASSIVE_SLS_V1_ID,
    active: initialLand2017ActiveOnlyStateV1(
      fiberLogStrain,
      freeCalciumUm,
      params.active,
    ),
    // A cold material state owns no inherited viscoelastic load.  In the
    // subsystem this strain is evaluated at the selected cold geometry, so the
    // Maxwell/SLS arm starts with q=0 at that geometry.
    passiveSls: initialEquilibriumPassiveSlsParallelStateV1(fiberLogStrain, 0),
    materialIdentityCanonicalJson:
      landActivePassiveSlsMaterialIdentityV1(params),
  });
}

export function trialLandActivePassiveSlsV1(
  previous: LandActivePassiveSlsStateV1,
  input: {
    readonly dtSec: number;
    readonly fiberLogStrain: number;
    readonly freeCalciumUm: number;
  },
  params: LandActivePassiveSlsParamsV1,
): LandActivePassiveSlsTrialV1 {
  try {
    validatePreparedOrParams(params);
    validateAcceptedStateOwnership(previous, params);
  } catch (error) {
    return failedBeforeSubtrials(
      previous,
      input,
      params,
      error instanceof Error ? error.message : "material validation failed",
    );
  }
  const activeTrial = trialLand2017ActiveOnlyV1(
    previous.active,
    {
      dtSec: input.dtSec,
      fiberLogStrain: input.fiberLogStrain,
      freeCalciumUm: input.freeCalciumUm,
    },
    params.active,
  );
  const passiveSlsTrial = trialEquilibriumPassiveSlsParallelV1(
    previous.passiveSls,
    { dtSec: input.dtSec, totalStrain: input.fiberLogStrain },
    params.passiveSls,
  );
  const issues = [
    ...activeTrial.issues.map((issue) => `active:${issue}`),
    ...passiveSlsTrial.issues.map((issue) => `passive-sls:${issue}`),
  ];
  if (
    !activeTrial.valid ||
    !activeTrial.finite ||
    activeTrial.nextState == null ||
    activeTrial.readback == null ||
    !passiveSlsTrial.valid ||
    !passiveSlsTrial.finite ||
    passiveSlsTrial.nextState == null ||
    passiveSlsTrial.readback == null
  ) {
    return Object.freeze({
      previousState: previous,
      nextState: null,
      activeTrial,
      passiveSlsTrial,
      readback: null,
      valid: false,
      finite: activeTrial.finite && passiveSlsTrial.finite,
      issues: Object.freeze(issues),
    });
  }
  const passive = passiveSlsTrial.readback;
  const active = activeTrial.readback;
  const activeScale = params.activeHomogenizationScale;
  const mappedCellularActiveStressPa = active.wallActiveKirchhoffStressPa;
  const effectiveActiveStressPa = activeScale * mappedCellularActiveStressPa;
  const readback: LandActivePassiveSlsReadbackV1 = Object.freeze({
    freeCalciumUm: input.freeCalciumUm,
    activation01: activeTrial.readback.state.CaTRPN,
    fiberLogStrain: input.fiberLogStrain,
    stresses: Object.freeze({
      passiveEquilibriumPa: passive.passiveEquilibriumStressPa,
      mappedCellularLandActivePa: mappedCellularActiveStressPa,
      effectiveTransmittedActivePa: effectiveActiveStressPa,
      slsOverstressPa: passive.slsOverstressPa,
      totalTransmittedPa:
        passive.passiveEquilibriumStressPa +
        effectiveActiveStressPa +
        passive.slsOverstressPa,
    }),
    activeMapping: Object.freeze({
      activeHomogenizationScale: activeScale,
      sourceNominalActiveStressPa: active.sourceNominalActiveStressPa,
      mappedCellularWallActiveKirchhoffStressPa: mappedCellularActiveStressPa,
      effectiveTransmittedActiveKirchhoffStressPa: effectiveActiveStressPa,
    }),
    activeWork: Object.freeze({
      continuousTissueEquivalentSourcePowerDensityWPerM3:
        activeScale * active.continuousSourcePowerDensityWPerM3,
      continuousEffectiveWallPowerDensityWPerM3:
        activeScale * active.continuousWallPowerDensityWPerM3,
      continuousPowerResidualWPerM3:
        activeScale * active.continuousPowerResidualWPerM3,
      discreteTissueEquivalentSourcePowerDensityWPerM3:
        activeScale * active.discreteSourcePowerDensityWPerM3,
      discreteEffectiveWallPowerDensityWPerM3:
        activeScale * active.discreteWallPowerDensityWPerM3,
      discretePowerResidualWPerM3:
        activeScale * active.discretePowerResidualWPerM3,
      tissueEquivalentSourceReportedPowerDensityWPerM3:
        activeScale * active.sourceReportedPowerDensityWPerM3,
      sourceReportedPowerResidualWPerM3:
        activeScale * active.sourceReportedPowerResidualWPerM3,
      finiteDifferenceEffectiveWorkConjugateStressPa:
        activeScale * active.finiteDifferenceWorkConjugateKirchhoffStressPa,
      finiteDifferenceWorkConjugacyResidualPa:
        activeScale * active.finiteDifferenceWorkConjugacyResidualPa,
    }),
    tangentsPa: Object.freeze({
      passivePlusSlsAlgorithmicPa: passive.passivePlusSlsAlgorithmicTangentPa,
      landAlgorithmicTangentAvailable: false,
    }),
    energies: Object.freeze({
      passiveEquilibriumStorageJPerM3: passive.passiveEquilibriumStorageJPerM3,
      slsStorageJPerM3: passive.slsStorageJPerM3,
    }),
    claim: LAND_ACTIVE_PASSIVE_SLS_CLAIM_V1,
  });
  if (!numericLeaves(readback).every(Number.isFinite)) {
    return Object.freeze({
      previousState: previous,
      nextState: null,
      activeTrial,
      passiveSlsTrial,
      readback: null,
      valid: false,
      finite: false,
      issues: Object.freeze([
        "composite: effective stress, work, or energy readback is non-finite",
      ]),
    });
  }
  const nextState: LandActivePassiveSlsStateV1 = Object.freeze({
    kind: LAND_ACTIVE_PASSIVE_SLS_V1_ID,
    active: activeTrial.nextState,
    passiveSls: passiveSlsTrial.nextState,
    materialIdentityCanonicalJson: previous.materialIdentityCanonicalJson,
  });
  return Object.freeze({
    previousState: previous,
    nextState,
    activeTrial,
    passiveSlsTrial,
    readback,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
  });
}

export function commitLandActivePassiveSlsTrialV1(
  trial: LandActivePassiveSlsTrialV1,
): LandActivePassiveSlsStateV1 {
  if (!trial.valid || !trial.finite || trial.nextState == null) {
    throw new Error("cannot commit an invalid Land/passive/SLS trial");
  }
  return Object.freeze({
    kind: LAND_ACTIVE_PASSIVE_SLS_V1_ID,
    active: commitLand2017ActiveOnlyTrialV1(trial.activeTrial),
    passiveSls: commitEquilibriumPassiveSlsParallelTrialV1(
      trial.passiveSlsTrial,
    ),
    materialIdentityCanonicalJson:
      trial.nextState.materialIdentityCanonicalJson,
  });
}

function validatePreparedOrParams(params: LandActivePassiveSlsParamsV1): void {
  if (PREPARED_PARAM_OBJECTS.has(params)) return;
  if (
    typeof params.materialId !== "string" ||
    params.materialId.trim() === ""
  ) {
    throw new Error("materialId must be a non-empty string");
  }
  assertValidLiteratureLand2017ActiveOnlyParamsV1(params.active);
  validateActiveHomogenizationScale(params.activeHomogenizationScale);
  const passiveIssues = validateEquilibriumPassiveSlsParallelParamsV1(
    params.passiveSls,
  );
  if (passiveIssues.length > 0) throw new Error(passiveIssues.join("; "));
}

function validateActiveHomogenizationScale(value: number): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error("activeHomogenizationScale must be positive and finite");
  }
}

function validateAcceptedStateOwnership(
  state: LandActivePassiveSlsStateV1,
  params: LandActivePassiveSlsParamsV1,
): void {
  if (state.kind !== LAND_ACTIVE_PASSIVE_SLS_V1_ID) {
    throw new Error("unsupported constitutive state kind");
  }
  if (
    state.materialIdentityCanonicalJson !==
    landActivePassiveSlsMaterialIdentityV1(params)
  ) {
    throw new Error(
      "effective material identity changed; cold initialization is required",
    );
  }
  if (
    Math.abs(
      state.active.previousFiberLogStrain - state.passiveSls.totalStrain,
    ) > 1e-12
  ) {
    throw new Error("accepted Land and passive/SLS strain histories diverged");
  }
}

function failedBeforeSubtrials(
  previous: LandActivePassiveSlsStateV1,
  input: {
    readonly dtSec: number;
    readonly fiberLogStrain: number;
    readonly freeCalciumUm: number;
  },
  params: LandActivePassiveSlsParamsV1,
  issue: string,
): LandActivePassiveSlsTrialV1 {
  const activeTrial = trialLand2017ActiveOnlyV1(
    previous.active,
    {
      dtSec: input.dtSec,
      fiberLogStrain: input.fiberLogStrain,
      freeCalciumUm: input.freeCalciumUm,
    },
    params.active,
  );
  const passiveSlsTrial = trialEquilibriumPassiveSlsParallelV1(
    previous.passiveSls,
    { dtSec: input.dtSec, totalStrain: input.fiberLogStrain },
    params.passiveSls,
  );
  return Object.freeze({
    previousState: previous,
    nextState: null,
    activeTrial,
    passiveSlsTrial,
    readback: null,
    valid: false,
    finite: activeTrial.finite && passiveSlsTrial.finite,
    issues: Object.freeze([issue]),
  });
}

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("stableStringify cannot encode non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`stableStringify cannot encode ${typeof value}`);
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value == null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numericLeaves);
}
