import type {
  MainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  CORONARY_BOUNDARY_LINEARIZATION_COMPONENT_IDS_V2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
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
  jacobianMode?: "central-difference" | "hybrid-coronary-analytic";
}>;

export type MainWireFiveWallCoupledNewtonShadowResultV1 = Readonly<{
  solverId: typeof MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_V1_ID;
  jacobianResidualEvaluationCount: number;
  coronaryAnalyticBlockAssemblyCount: number;
  coronaryBoundaryAnalyticBlockAssemblyCount: number;
  result: FlatCoupledNewtonResultV1;
}>;

/**
 * First advancing proof of the real 30-row equations. The default hybrid
 * keeps the 14 non-coronary columns as an auditable central-difference shadow
 * while component writers own both blocks of the 16 coronary columns. The
 * all-central-difference mode remains a construction oracle only.
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
  const coronaryDimension = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
  const boundaryDimension =
    CORONARY_BOUNDARY_LINEARIZATION_COMPONENT_IDS_V2.length;
  const nonCoronaryDimension =
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
  const localDependentSvColumn = new Float64Array(nonCoronaryDimension);
  const coronaryBoundaryLinearization = new Float64Array(
    boundaryDimension * nonCoronaryDimension,
  );
  const coronaryLinearization = {
    residualMl: new Float64Array(coronaryDimension),
    dResidualDVolume:
      new Float64Array(coronaryDimension * coronaryDimension),
    dResidualDBoundary:
      new Float64Array(coronaryDimension * boundaryDimension),
    dTotalInletFlowDVolume: new Float64Array(coronaryDimension),
    dCommonVenousOutletFlowDVolume: new Float64Array(coronaryDimension),
    dTotalInletFlowDBoundary: new Float64Array(boundaryDimension),
    dCommonVenousOutletFlowDBoundary: new Float64Array(boundaryDimension),
  };
  let jacobianResidualEvaluationCount = 0;
  let coronaryAnalyticBlockAssemblyCount = 0;
  let coronaryBoundaryAnalyticBlockAssemblyCount = 0;
  const jacobianMode = options.jacobianMode
    ?? "hybrid-coronary-analytic";
  const system: FlatCoupledSystemV1 = Object.freeze({
    dimension,
    assertCandidateAdmissible: (unknowns) => {
      const dependentSvVolumeMl = context.fixedGlobalTotalBloodVolumeMl
        - sumVector(unknowns);
      if (!(dependentSvVolumeMl > context.minimumDependentSvVolumeMl)) {
        throw new RangeError(
          "coupled candidate leaves no admissible dependent SV volume",
        );
      }
    },
    maximumAdmissibleStepLength: (current, update) => {
      const updateSum = sumVector(update);
      if (updateSum <= 0) return 1;
      const availableVolumeMl = context.fixedGlobalTotalBloodVolumeMl
        - context.minimumDependentSvVolumeMl - sumVector(current);
      if (!(availableVolumeMl > 0)) {
        throw new RangeError(
          "coupled candidate has no dependent SV volume headroom",
        );
      }
      return availableVolumeMl / updateSum;
    },
    evaluateResidual: context.evaluateResidualMl,
    evaluateJacobian: (unknowns, destination) => {
      const finiteDifferenceColumnCount =
        jacobianMode === "hybrid-coronary-analytic"
          ? nonCoronaryDimension
          : dimension;
      for (
        let column = 0;
        column < finiteDifferenceColumnCount;
        column += 1
      ) {
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
      if (jacobianMode === "hybrid-coronary-analytic") {
        context.writeCoronaryLinearization(
          unknowns,
          coronaryLinearization,
          localDependentSvColumn,
        );
        coronaryAnalyticBlockAssemblyCount += 1;
        const coronaryStart = nonCoronaryDimension;
        const aoResidualRow =
          NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.indexOf("Ao");
        const raResidualRow =
          NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.indexOf("RA");
        if (aoResidualRow < 0 || raResidualRow < 0) {
          throw new Error(
            "coupled coronary block requires independent Ao and RA rows",
          );
        }
        for (let row = 0; row < nonCoronaryDimension; row += 1) {
          for (let column = 0; column < coronaryDimension; column += 1) {
            let derivative = -localDependentSvColumn[row]!;
            if (row === aoResidualRow) {
              derivative += context.stepDtSec
                * coronaryLinearization.dTotalInletFlowDVolume[column]!;
            }
            if (row === raResidualRow) {
              derivative -= context.stepDtSec
                * coronaryLinearization
                  .dCommonVenousOutletFlowDVolume[column]!;
            }
            destination[row * dimension + coronaryStart + column] =
              derivative;
          }
        }
        for (let row = 0; row < coronaryDimension; row += 1) {
          for (let column = 0; column < coronaryDimension; column += 1) {
            destination[
              (coronaryStart + row) * dimension
              + coronaryStart + column
            ] = coronaryLinearization.dResidualDVolume[
              row * coronaryDimension + column
            ]!;
          }
        }
        const boundaryLinearizationAvailable =
          context.writeCoronaryBoundaryLinearization(
            unknowns,
            coronaryBoundaryLinearization,
          );
        if (boundaryLinearizationAvailable) {
          coronaryBoundaryAnalyticBlockAssemblyCount += 1;
          for (let row = 0; row < coronaryDimension; row += 1) {
            for (
              let column = 0;
              column < nonCoronaryDimension;
              column += 1
            ) {
              let derivative = 0;
              for (
                let boundary = 0;
                boundary < boundaryDimension;
                boundary += 1
              ) {
                derivative += coronaryLinearization.dResidualDBoundary[
                  row * boundaryDimension + boundary
                ]! * coronaryBoundaryLinearization[
                  boundary * nonCoronaryDimension + column
                ]!;
              }
              destination[
                (coronaryStart + row) * dimension + column
              ] = derivative;
            }
          }
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
    coronaryAnalyticBlockAssemblyCount,
    coronaryBoundaryAnalyticBlockAssemblyCount,
    result,
  });
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite`);
  }
}

function sumVector(values: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index]!;
  }
  return sum;
}
