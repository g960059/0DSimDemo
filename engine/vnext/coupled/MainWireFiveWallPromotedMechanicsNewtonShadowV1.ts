import type {
  MainWireFiveWallPromotedMechanicsResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  FLAT_COUPLED_NEWTON_V1_ID,
  createFlatCoupledNewtonWorkspaceV1,
  solveFlatCoupledSystemV1,
  type FlatCoupledNewtonResultV1,
  type FlatCoupledNewtonWorkspaceV1,
  type FlatCoupledSystemV1,
} from "@/engine/vnext/coupled/FlatCoupledNewtonV1";
import {
  FLAT_COUPLED_SCALED_POWELL_DOGLEG_V1_ID,
  createFlatCoupledDoglegWorkspaceV1,
  solveFlatCoupledSystemWithDoglegV1,
  type FlatCoupledDoglegWorkspaceV1,
} from "@/engine/vnext/coupled/FlatCoupledDoglegV1";

export const MAIN_WIRE_FIVE_WALL_PROMOTED_MECHANICS_NEWTON_SHADOW_V1_ID =
  "main-wire-five-wall-promoted-mechanics-newton-shadow-v1" as const;

export type MainWireFiveWallPromotedMechanicsNewtonShadowOptionsV1 = Readonly<{
  initialGuess?: Float64Array;
  maximumIterations?: number;
  maximumLineSearchBacktracks?: number;
  finiteDifferenceRelativeStep?: number;
  updateInfinityTolerance?: number;
  jacobianMode?: "central-difference" | "analytic";
  globalization?: "armijo-newton" | "scaled-powell-dogleg";
  initialTrustRegionRadius?: number;
}>;

export type MainWireFiveWallPromotedMechanicsNewtonShadowResultV1 = Readonly<{
  solverId:
    typeof MAIN_WIRE_FIVE_WALL_PROMOTED_MECHANICS_NEWTON_SHADOW_V1_ID;
  jacobianResidualEvaluationCount: number;
  analyticJacobianAssemblyCount: number;
  dependentSvContinuityResidualMl: number | null;
  globalizationId:
    | typeof FLAT_COUPLED_NEWTON_V1_ID
    | typeof FLAT_COUPLED_SCALED_POWELL_DOGLEG_V1_ID;
  rejectedTrustRegionTrialCount: number;
  trustRegionContractionCount: number;
  trustRegionExpansionCount: number;
  result: FlatCoupledNewtonResultV1;
}>;

export type MainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1 =
  Readonly<{
    schemaId:
      "circleheart-main-wire-promoted-mechanics-newton-shadow-workspace-v1";
    dimension: 32;
  }>;

type PromotedMechanicsWorkspaceStorageV1 = {
  readonly plus: Float64Array;
  readonly minus: Float64Array;
  readonly plusResidual: Float64Array;
  readonly minusResidual: Float64Array;
  readonly unknownScales: Float64Array;
  readonly residualScales: Float64Array;
  readonly newton: FlatCoupledNewtonWorkspaceV1;
  readonly dogleg: FlatCoupledDoglegWorkspaceV1;
  inUse: boolean;
};

const PROMOTED_MECHANICS_WORKSPACE_STORAGE_V1 = new WeakMap<
  MainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1,
  PromotedMechanicsWorkspaceStorageV1
>();

/** Session-owned construction scratch. It is never accepted or checkpointed. */
export function createMainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1():
MainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1 {
  const dimension = 32 as const;
  const workspace = Object.freeze({
    schemaId:
      "circleheart-main-wire-promoted-mechanics-newton-shadow-workspace-v1" as const,
    dimension,
  });
  PROMOTED_MECHANICS_WORKSPACE_STORAGE_V1.set(workspace, {
    plus: new Float64Array(dimension),
    minus: new Float64Array(dimension),
    plusResidual: new Float64Array(dimension),
    minusResidual: new Float64Array(dimension),
    unknownScales: new Float64Array(dimension),
    residualScales: new Float64Array(dimension),
    newton: createFlatCoupledNewtonWorkspaceV1(dimension),
    dogleg: createFlatCoupledDoglegWorkspaceV1(dimension),
    inUse: false,
  });
  return workspace;
}

/**
 * Construction solve for the real 32-row system.
 *
 * The default path assembles all 32 columns from component-owned derivatives.
 * The all-central-difference mode remains an independent oracle; neither path
 * can materialize or accept a candidate.
 */
export function solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(
  context: MainWireFiveWallPromotedMechanicsResidualContextV1,
  options: MainWireFiveWallPromotedMechanicsNewtonShadowOptionsV1 =
    Object.freeze({}),
  workspace: MainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1 =
    createMainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1(),
): MainWireFiveWallPromotedMechanicsNewtonShadowResultV1 {
  const storage = PROMOTED_MECHANICS_WORKSPACE_STORAGE_V1.get(workspace);
  if (storage === undefined || workspace.dimension !== context.dimension) {
    throw new RangeError("promoted mechanics Newton workspace is incompatible");
  }
  if (storage.inUse) {
    throw new Error("promoted mechanics Newton workspace is already in use");
  }
  storage.inUse = true;
  try {
    const dimension = context.dimension;
    const volumeDimension = dimension - 2;
    const finiteDifferenceRelativeStep =
      options.finiteDifferenceRelativeStep ?? 2e-6;
    requirePositiveFinite(
      finiteDifferenceRelativeStep,
      "finiteDifferenceRelativeStep",
    );
    let jacobianResidualEvaluationCount = 0;
    let analyticJacobianAssemblyCount = 0;
    const jacobianMode = options.jacobianMode
      ?? "analytic";
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension,
      assertCandidateAdmissible: (unknowns) => {
        const dependentSvVolumeMl = context.fixedGlobalTotalBloodVolumeMl
          - sumPrefix(unknowns, volumeDimension);
        if (!(dependentSvVolumeMl > context.minimumDependentSvVolumeMl)) {
          throw new RangeError(
            "promoted mechanics candidate leaves no dependent SV volume",
          );
        }
      },
      maximumAdmissibleStepLength: (current, update) => {
        const updateSum = sumPrefix(update, volumeDimension);
        if (updateSum <= 0) return 1;
        const availableVolumeMl = context.fixedGlobalTotalBloodVolumeMl
          - context.minimumDependentSvVolumeMl
          - sumPrefix(current, volumeDimension);
        if (!(availableVolumeMl > 0)) {
          throw new RangeError(
            "promoted mechanics candidate has no dependent SV headroom",
          );
        }
        return availableVolumeMl / updateSum;
      },
      evaluateResidual: context.evaluateResidual,
      isResidualConverged: context.isResidualConverged,
      evaluateJacobian: (unknowns, destination) => {
        if (jacobianMode === "analytic") {
          context.writeAnalyticJacobian(unknowns, destination);
          analyticJacobianAssemblyCount += 1;
          return;
        }
        for (let column = 0; column < dimension; column += 1) {
          storage.plus.set(unknowns);
          storage.minus.set(unknowns);
          const halfStep = finiteDifferenceRelativeStep
            * Math.max(1, Math.abs(unknowns[column]!));
          if (
            unknowns[column]! - halfStep <= context.lowerBounds[column]!
            || unknowns[column]! + halfStep >= context.upperBounds[column]!
          ) {
            throw new RangeError(
              `promoted mechanics finite-difference column ${column} has no centered step`,
            );
          }
          storage.plus[column] += halfStep;
          storage.minus[column] -= halfStep;
          context.evaluateResidual(storage.plus, storage.plusResidual);
          context.evaluateResidual(storage.minus, storage.minusResidual);
          jacobianResidualEvaluationCount += 2;
          const denominator = 2 * halfStep;
          for (let row = 0; row < dimension; row += 1) {
            destination[row * dimension + column] =
              (storage.plusResidual[row]! - storage.minusResidual[row]!)
              / denominator;
          }
        }
      },
    });
    for (let index = 0; index < dimension; index += 1) {
      if (index < volumeDimension) {
        const scale = Math.max(1, Math.abs(context.initialUnknowns[index]!));
        storage.unknownScales[index] = scale;
        storage.residualScales[index] = scale;
      } else {
        storage.unknownScales[index] = Math.max(
          1,
          Math.abs(context.initialUnknowns[index]!),
        );
        storage.residualScales[index] = 1;
      }
    }
    const commonOptions = Object.freeze({
        maximumIterations: options.maximumIterations ?? 12,
        maximumLineSearchBacktracks:
          options.maximumLineSearchBacktracks ?? 24,
        maximumAcceptedStepsPerJacobian: 1,
        residualInfinityTolerance:
          context.mechanicsResidualInfinityToleranceByOneJ,
        updateInfinityTolerance: options.updateInfinityTolerance ?? 1e-12,
        armijoCoefficient: 1e-4,
        minimumAbsolutePivot: 1e-14,
        unknownScaleByUnknown: storage.unknownScales,
        residualScaleByEquation: storage.residualScales,
        lowerBoundByUnknown: context.lowerBounds,
        upperBoundByUnknown: context.upperBounds,
      });
    const globalization = options.globalization ?? "armijo-newton";
    const dogleg = globalization === "scaled-powell-dogleg"
      ? solveFlatCoupledSystemWithDoglegV1(
        system,
        options.initialGuess ?? context.initialUnknowns,
        Object.freeze({
          ...commonOptions,
          maximumIterations: options.maximumIterations ?? 32,
          initialTrustRegionRadius: options.initialTrustRegionRadius ?? 2,
          maximumTrustRegionRadius: 64,
          minimumTrustRegionRadius: 1e-12,
          maximumTrustRegionTrialsPerIteration: 24,
          acceptanceRatio: 1e-4,
        }),
        storage.dogleg,
      )
      : null;
    const result = dogleg?.result ?? solveFlatCoupledSystemV1(
      system,
      options.initialGuess ?? context.initialUnknowns,
      commonOptions,
      storage.newton,
    );
    const dependentSvContinuityResidualMl = result.status === "converged"
      ? context.evaluateDependentSvContinuityResidualMl(result.solution)
      : null;
    return Object.freeze({
      solverId:
        MAIN_WIRE_FIVE_WALL_PROMOTED_MECHANICS_NEWTON_SHADOW_V1_ID,
      jacobianResidualEvaluationCount,
      analyticJacobianAssemblyCount,
      dependentSvContinuityResidualMl,
      globalizationId: dogleg?.solverId ?? FLAT_COUPLED_NEWTON_V1_ID,
      rejectedTrustRegionTrialCount: dogleg?.rejectedTrialCount ?? 0,
      trustRegionContractionCount:
        dogleg?.trustRegionContractionCount ?? 0,
      trustRegionExpansionCount: dogleg?.trustRegionExpansionCount ?? 0,
      result,
    });
  } finally {
    storage.inUse = false;
  }
}

function sumPrefix(values: Float64Array, count: number): number {
  let sum = 0;
  for (let index = 0; index < count; index += 1) {
    sum += values[index]!;
  }
  return sum;
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite`);
  }
}
