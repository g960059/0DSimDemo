import type {
  Land2017ActiveOnlyParamsV1,
} from "@/engine/mechanics2/activation/Land2017ActiveOnlyV1";
import { LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1 } from
  "@/engine/myocardium/atrialLandNiederer2018";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  land2017ParameterSetHashInput,
  stableHash,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import type { Land2017SubstepSolveOptions } from
  "@/engine/myocardium/myofilament/land2017/solver";

export const LITERATURE_LAND2017_ACTIVE_ONLY_PARAMS_REGISTRY_ID_V1 =
  "five-patch-literature-land2017-active-only-params-registry-v1" as const;

export type LiteratureLand2017ActiveOnlyFactoryOverridesV1 = {
  readonly lambdaLandSlack?: number;
  /** Numerical controls only; accepted-state history owns the omitted fields. */
  readonly solveOptions?: Readonly<
    Pick<
      Land2017SubstepSolveOptions,
      | "maxIterations"
      | "residualTolerance"
      | "lineSearchMinStep"
      | "lineSearchReduction"
      | "substeps"
    >
  >;
};

const DEFAULT_ACTIVE_ONLY_SOLVE_OPTIONS_V1 = Object.freeze({
  maxIterations: 20,
  residualTolerance: 1e-10,
  lineSearchMinStep: 1 / 4096,
  lineSearchReduction: 0.5,
  substeps: 4,
});

/**
 * Closed five-patch registry. This lives outside the accepted-history Land
 * adapter so the new model can add a ventricular literature family without
 * changing the implementation hash of any prior V2 artifact.
 */
const RECOGNIZED_LAND2017_ACTIVE_PARAMETER_PACKS_V1 = Object.freeze([
  Object.freeze({
    parameterPackId:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.parameterPackId,
    parameterPackStableHash:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.parameterPackStableHash,
    equationParameterSetStableHash:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
        .effectiveEquationParameters.parameterSetStableHash,
  }),
  Object.freeze({
    parameterPackId:
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetId,
    parameterPackStableHash:
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetStableHash,
    equationParameterSetStableHash:
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetStableHash,
  }),
]);

export function createLand2017AtrialActiveOnlyParamsV1(
  overrides: LiteratureLand2017ActiveOnlyFactoryOverridesV1 = {},
): Land2017ActiveOnlyParamsV1 {
  const pack = LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1;
  return makeLiteraturePackParams(
    pack.effectiveEquationParameters,
    pack.parameterPackId,
    pack.parameterPackStableHash,
    overrides,
  );
}

export function createLand2017VentricularActiveOnlyParamsV1(
  overrides: LiteratureLand2017ActiveOnlyFactoryOverridesV1 = {},
): Land2017ActiveOnlyParamsV1 {
  const pack = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  return makeLiteraturePackParams(
    pack,
    pack.parameterSetId,
    pack.parameterSetStableHash,
    overrides,
  );
}

export const DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1 =
  createLand2017AtrialActiveOnlyParamsV1();

export const DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1 =
  createLand2017VentricularActiveOnlyParamsV1();

export function assertValidLiteratureLand2017ActiveOnlyParamsV1(
  params: Land2017ActiveOnlyParamsV1,
): void {
  if (
    !(params.lambdaLandSlack > 0) ||
    !Number.isFinite(params.lambdaLandSlack)
  ) {
    throw new Error("lambdaLandSlack must be positive and finite");
  }
  if (
    typeof params.parameterPackId !== "string" ||
    params.parameterPackId.trim().length === 0
  ) {
    throw new Error("parameterPackId must be non-empty");
  }
  if (
    typeof params.parameterPackStableHash !== "string" ||
    params.parameterPackStableHash.trim().length === 0
  ) {
    throw new Error("parameterPackStableHash must be non-empty");
  }
  const equationParameterHash = stableHash(
    land2017ParameterSetHashInput(params.parameterSet),
  );
  if (equationParameterHash !== params.parameterSet.parameterSetStableHash) {
    throw new Error("Land equation parameter-set provenance hash is stale");
  }
  const recognized = RECOGNIZED_LAND2017_ACTIVE_PARAMETER_PACKS_V1.find(
    (entry) => entry.parameterPackId === params.parameterPackId,
  );
  if (recognized == null) {
    throw new Error(
      `unrecognized Land active parameter pack: ${params.parameterPackId}`,
    );
  }
  if (params.parameterPackStableHash !== recognized.parameterPackStableHash) {
    throw new Error(
      "Land active parameter-pack provenance hash does not match the recognized registry",
    );
  }
  if (
    params.parameterSet.parameterSetStableHash !==
      recognized.equationParameterSetStableHash
  ) {
    throw new Error(
      "Land active nested equation parameter-set hash does not match its recognized pack",
    );
  }
  validateSolveOptions(params.solveOptions);
}

function makeLiteraturePackParams(
  parameterSet: Land2017ActiveOnlyParamsV1["parameterSet"],
  parameterPackId: string,
  parameterPackStableHash: string,
  overrides: LiteratureLand2017ActiveOnlyFactoryOverridesV1,
): Land2017ActiveOnlyParamsV1 {
  const allowedSolveOptionKeys = new Set([
    "maxIterations",
    "residualTolerance",
    "lineSearchMinStep",
    "lineSearchReduction",
    "substeps",
  ]);
  for (const key of Object.keys(overrides.solveOptions ?? {})) {
    if (!allowedSolveOptionKeys.has(key)) {
      throw new Error(
        `Land literature-pack factory does not accept state/history option: ${key}`,
      );
    }
  }
  const params: Land2017ActiveOnlyParamsV1 = Object.freeze({
    parameterSet,
    parameterPackId,
    parameterPackStableHash,
    lambdaLandSlack: overrides.lambdaLandSlack ?? 1,
    solveOptions: Object.freeze({
      ...DEFAULT_ACTIVE_ONLY_SOLVE_OPTIONS_V1,
      ...overrides.solveOptions,
    }),
  });
  assertValidLiteratureLand2017ActiveOnlyParamsV1(params);
  return params;
}

function validateSolveOptions(
  solveOptions: Land2017SubstepSolveOptions,
): void {
  if (
    solveOptions.maxIterations != null &&
    (!Number.isInteger(solveOptions.maxIterations) ||
      solveOptions.maxIterations < 1)
  ) {
    throw new Error("Land maxIterations must be a positive integer");
  }
  if (
    solveOptions.residualTolerance != null &&
    (!(solveOptions.residualTolerance > 0) ||
      !Number.isFinite(solveOptions.residualTolerance))
  ) {
    throw new Error("Land residualTolerance must be positive and finite");
  }
  if (
    solveOptions.lineSearchMinStep != null &&
    (!(solveOptions.lineSearchMinStep > 0) ||
      solveOptions.lineSearchMinStep > 1 ||
      !Number.isFinite(solveOptions.lineSearchMinStep))
  ) {
    throw new Error("Land lineSearchMinStep must be in (0, 1]");
  }
  if (
    solveOptions.lineSearchReduction != null &&
    (!(solveOptions.lineSearchReduction > 0) ||
      solveOptions.lineSearchReduction >= 1 ||
      !Number.isFinite(solveOptions.lineSearchReduction))
  ) {
    throw new Error("Land lineSearchReduction must be in (0, 1)");
  }
  if (
    solveOptions.substeps != null &&
    (!Number.isInteger(solveOptions.substeps) || solveOptions.substeps < 1)
  ) {
    throw new Error("Land substeps must be a positive integer");
  }
}
