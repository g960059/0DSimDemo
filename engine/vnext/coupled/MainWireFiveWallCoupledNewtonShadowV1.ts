import type {
  MainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  createFlatCoupledNewtonWorkspaceV1,
  solveFlatCoupledSystemV1,
  type FlatCoupledNewtonResultV1,
  type FlatCoupledSystemV1,
} from "@/engine/vnext/coupled/FlatCoupledNewtonV1";

export const MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_V1_ID =
  "main-wire-five-wall-coupled-newton-shadow-v1" as const;

export type MainWireFiveWallCoupledNewtonShadowOptionsV1 = Readonly<{
  maximumIterations?: number;
  maximumLineSearchBacktracks?: number;
  residualInfinityToleranceMl?: number;
  updateInfinityToleranceMl?: number;
  finiteDifferenceRelativeStep?: number;
}>;

export type MainWireFiveWallCoupledNewtonShadowResultV1 = Readonly<{
  solverId: typeof MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_V1_ID;
  jacobianResidualEvaluationCount: number;
  result: FlatCoupledNewtonResultV1;
}>;

/**
 * First advancing proof of the real 30-row equations. Its central-difference
 * Jacobian intentionally favors auditability over performance. Production
 * Phase 2a replaces it with component-owned analytic tangent writers.
 */
export function solveMainWireFiveWallCoupledNewtonShadowV1(
  context: MainWireFiveWallCoupledResidualContextV1,
  options: MainWireFiveWallCoupledNewtonShadowOptionsV1 = Object.freeze({}),
): MainWireFiveWallCoupledNewtonShadowResultV1 {
  const dimension = context.dimension;
  const finiteDifferenceRelativeStep =
    options.finiteDifferenceRelativeStep ?? 2e-6;
  requirePositiveFinite(
    finiteDifferenceRelativeStep,
    "finiteDifferenceRelativeStep",
  );
  const plus = new Float64Array(dimension);
  const minus = new Float64Array(dimension);
  const plusResidual = new Float64Array(dimension);
  const minusResidual = new Float64Array(dimension);
  let jacobianResidualEvaluationCount = 0;
  const system: FlatCoupledSystemV1 = Object.freeze({
    dimension,
    evaluateResidual: context.evaluateResidualMl,
    evaluateJacobian: (unknowns, destination) => {
      for (let column = 0; column < dimension; column += 1) {
        plus.set(unknowns);
        minus.set(unknowns);
        const halfStep = finiteDifferenceRelativeStep
          * Math.max(1, Math.abs(unknowns[column]!));
        if (
          unknowns[column]! - halfStep <= context.lowerBoundsMl[column]!
          || unknowns[column]! + halfStep >= context.upperBoundsMl[column]!
        ) {
          throw new RangeError(
            `coupled finite-difference column ${column} has no centered step`,
          );
        }
        plus[column] += halfStep;
        minus[column] -= halfStep;
        context.evaluateResidualMl(plus, plusResidual);
        context.evaluateResidualMl(minus, minusResidual);
        jacobianResidualEvaluationCount += 2;
        const denominator = 2 * halfStep;
        for (let row = 0; row < dimension; row += 1) {
          destination[row * dimension + column] =
            (plusResidual[row]! - minusResidual[row]!) / denominator;
        }
      }
    },
  });
  const result = solveFlatCoupledSystemV1(
    system,
    context.initialUnknownsMl,
    Object.freeze({
      maximumIterations: options.maximumIterations ?? 12,
      maximumLineSearchBacktracks:
        options.maximumLineSearchBacktracks ?? 24,
      residualInfinityTolerance:
        options.residualInfinityToleranceMl ?? 1e-8,
      updateInfinityTolerance: options.updateInfinityToleranceMl ?? 1e-10,
      armijoCoefficient: 1e-4,
      minimumAbsolutePivot: 1e-14,
      lowerBoundByUnknown: context.lowerBoundsMl,
      upperBoundByUnknown: context.upperBoundsMl,
    }),
    createFlatCoupledNewtonWorkspaceV1(dimension),
  );
  return Object.freeze({
    solverId: MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_V1_ID,
    jacobianResidualEvaluationCount,
    result,
  });
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite`);
  }
}
