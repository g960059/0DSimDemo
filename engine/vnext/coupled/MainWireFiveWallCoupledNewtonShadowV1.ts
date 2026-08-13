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
  type FlatCoupledNewtonWorkspaceV1,
  type FlatCoupledSystemV1,
} from "@/engine/vnext/coupled/FlatCoupledNewtonV1";

export const MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_V1_ID =
  "main-wire-five-wall-coupled-newton-shadow-v1" as const;

export type MainWireFiveWallCoupledNewtonShadowOptionsV1 = Readonly<{
  maximumIterations?: number;
  maximumLineSearchBacktracks?: number;
  maximumAcceptedStepsPerJacobian?: number;
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
  nonCoronaryAnalyticBlockAssemblyCount: number;
  dependentSvContinuityResidualMl: number | null;
  result: FlatCoupledNewtonResultV1;
}>;

export type MainWireFiveWallCoupledNewtonShadowWorkspaceV1 = Readonly<{
  schemaId:
    "circleheart-main-wire-five-wall-coupled-newton-shadow-workspace-v1";
  dimension: number;
}>;

type CoupledCoronaryLinearizationStorageV1 = {
  readonly residualMl: Float64Array;
  readonly dResidualDVolume: Float64Array;
  readonly dResidualDBoundary: Float64Array;
  readonly dTotalInletFlowDVolume: Float64Array;
  readonly dCommonVenousOutletFlowDVolume: Float64Array;
  readonly dTotalInletFlowDBoundary: Float64Array;
  readonly dCommonVenousOutletFlowDBoundary: Float64Array;
};

type MainWireFiveWallCoupledNewtonShadowWorkspaceStorageV1 = {
  readonly plus: Float64Array;
  readonly minus: Float64Array;
  readonly plusResidual: Float64Array;
  readonly minusResidual: Float64Array;
  readonly localDependentSvColumn: Float64Array;
  readonly coronaryBoundaryLinearization: Float64Array;
  readonly localNonCoronaryLinearization: Float64Array;
  readonly coronaryLinearization: CoupledCoronaryLinearizationStorageV1;
  readonly unknownScales: Float64Array;
  readonly residualScales: Float64Array;
  readonly newton: FlatCoupledNewtonWorkspaceV1;
  inUse: boolean;
};

const MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_WORKSPACE_STORAGE_V1 =
  new WeakMap<
    MainWireFiveWallCoupledNewtonShadowWorkspaceV1,
    MainWireFiveWallCoupledNewtonShadowWorkspaceStorageV1
  >();

/**
 * Session-owned mutable scratch for the migration solver. It is not accepted
 * model state, is never checkpointed, and may only be borrowed by one solve.
 */
export function createMainWireFiveWallCoupledNewtonShadowWorkspaceV1():
MainWireFiveWallCoupledNewtonShadowWorkspaceV1 {
  const nonCoronaryDimension =
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
  const coronaryDimension = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
  const boundaryDimension =
    CORONARY_BOUNDARY_LINEARIZATION_COMPONENT_IDS_V2.length;
  const dimension = nonCoronaryDimension + coronaryDimension;
  const workspace = Object.freeze({
    schemaId:
      "circleheart-main-wire-five-wall-coupled-newton-shadow-workspace-v1" as const,
    dimension,
  });
  MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_WORKSPACE_STORAGE_V1.set(
    workspace,
    {
      plus: new Float64Array(dimension),
      minus: new Float64Array(dimension),
      plusResidual: new Float64Array(dimension),
      minusResidual: new Float64Array(dimension),
      localDependentSvColumn: new Float64Array(nonCoronaryDimension),
      coronaryBoundaryLinearization: new Float64Array(
        boundaryDimension * nonCoronaryDimension,
      ),
      localNonCoronaryLinearization: new Float64Array(
        nonCoronaryDimension * nonCoronaryDimension,
      ),
      coronaryLinearization: {
        residualMl: new Float64Array(coronaryDimension),
        dResidualDVolume:
          new Float64Array(coronaryDimension * coronaryDimension),
        dResidualDBoundary:
          new Float64Array(coronaryDimension * boundaryDimension),
        dTotalInletFlowDVolume: new Float64Array(coronaryDimension),
        dCommonVenousOutletFlowDVolume:
          new Float64Array(coronaryDimension),
        dTotalInletFlowDBoundary: new Float64Array(boundaryDimension),
        dCommonVenousOutletFlowDBoundary:
          new Float64Array(boundaryDimension),
      },
      unknownScales: new Float64Array(dimension),
      residualScales: new Float64Array(dimension),
      newton: createFlatCoupledNewtonWorkspaceV1(dimension),
      inUse: false,
    },
  );
  return workspace;
}

function borrowMainWireFiveWallCoupledNewtonShadowWorkspaceV1(
  workspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  dimension: number,
): MainWireFiveWallCoupledNewtonShadowWorkspaceStorageV1 {
  const storage =
    MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_WORKSPACE_STORAGE_V1.get(
      workspace,
    );
  if (storage === undefined || workspace.dimension !== dimension) {
    throw new RangeError("coupled Newton shadow workspace is incompatible");
  }
  if (storage.inUse) {
    throw new Error("coupled Newton shadow workspace is already in use");
  }
  storage.inUse = true;
  return storage;
}

/**
 * First advancing proof of the real 30-row equations. The production
 * mechanics provider gives the default hybrid a complete component-owned
 * analytic Jacobian. Providers without the required physical tangents retain
 * a 14-column finite-difference construction fallback. The all-central-
 * difference mode remains an independent oracle only.
 */
export function solveMainWireFiveWallCoupledNewtonShadowV1(
  context: MainWireFiveWallCoupledResidualContextV1,
  options: MainWireFiveWallCoupledNewtonShadowOptionsV1 = Object.freeze({}),
  workspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1 =
    createMainWireFiveWallCoupledNewtonShadowWorkspaceV1(),
): MainWireFiveWallCoupledNewtonShadowResultV1 {
  const dimension = context.dimension;
  const storage = borrowMainWireFiveWallCoupledNewtonShadowWorkspaceV1(
    workspace,
    dimension,
  );
  try {
  const finiteDifferenceRelativeStep =
    options.finiteDifferenceRelativeStep ?? 2e-6;
  requirePositiveFinite(
    finiteDifferenceRelativeStep,
    "finiteDifferenceRelativeStep",
  );
  const { plus, minus, plusResidual, minusResidual } = storage;
  const coronaryDimension = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
  const boundaryDimension =
    CORONARY_BOUNDARY_LINEARIZATION_COMPONENT_IDS_V2.length;
  const nonCoronaryDimension =
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
  const {
    localDependentSvColumn,
    coronaryBoundaryLinearization,
    localNonCoronaryLinearization,
    coronaryLinearization,
  } = storage;
  let jacobianResidualEvaluationCount = 0;
  let coronaryAnalyticBlockAssemblyCount = 0;
  let coronaryBoundaryAnalyticBlockAssemblyCount = 0;
  let nonCoronaryAnalyticBlockAssemblyCount = 0;
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
      let completeAnalyticAssemblyAvailable = false;
      if (jacobianMode === "hybrid-coronary-analytic") {
        completeAnalyticAssemblyAvailable =
          context.writeCoupledLinearizations(
            unknowns,
            coronaryLinearization,
            localDependentSvColumn,
            localNonCoronaryLinearization,
            coronaryBoundaryLinearization,
          );
        coronaryAnalyticBlockAssemblyCount += 1;
      }
      const finiteDifferenceColumnCount =
        jacobianMode === "hybrid-coronary-analytic"
          ? completeAnalyticAssemblyAvailable
            ? 0
            : nonCoronaryDimension
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
        if (completeAnalyticAssemblyAvailable) {
          coronaryBoundaryAnalyticBlockAssemblyCount += 1;
          nonCoronaryAnalyticBlockAssemblyCount += 1;
          for (let row = 0; row < nonCoronaryDimension; row += 1) {
            for (
              let column = 0;
              column < nonCoronaryDimension;
              column += 1
            ) {
              destination[row * dimension + column] =
                localNonCoronaryLinearization[
                  row * nonCoronaryDimension + column
                ]!;
            }
          }
          for (
            let column = 0;
            column < nonCoronaryDimension;
            column += 1
          ) {
            let inletDerivative = 0;
            let outletDerivative = 0;
            for (
              let boundary = 0;
              boundary < boundaryDimension;
              boundary += 1
            ) {
              const boundaryDerivative = coronaryBoundaryLinearization[
                boundary * nonCoronaryDimension + column
              ]!;
              inletDerivative +=
                coronaryLinearization.dTotalInletFlowDBoundary[boundary]!
                  * boundaryDerivative;
              outletDerivative +=
                coronaryLinearization
                  .dCommonVenousOutletFlowDBoundary[boundary]!
                  * boundaryDerivative;
            }
            destination[aoResidualRow * dimension + column] +=
              context.stepDtSec * inletDerivative;
            destination[raResidualRow * dimension + column] -=
              context.stepDtSec * outletDerivative;
          }
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
  for (let index = 0; index < dimension; index += 1) {
    const scale = Math.max(1, Math.abs(context.initialUnknownsMl[index]!));
    storage.unknownScales[index] = scale;
    storage.residualScales[index] = scale;
  }
  const result = solveFlatCoupledSystemV1(
    system,
    context.initialUnknownsMl,
    Object.freeze({
      maximumIterations: options.maximumIterations ?? 12,
      maximumLineSearchBacktracks:
        options.maximumLineSearchBacktracks ?? 24,
      maximumAcceptedStepsPerJacobian:
        options.maximumAcceptedStepsPerJacobian ?? 1,
      residualInfinityTolerance:
        options.residualInfinityToleranceMl ?? 1e-8,
      updateInfinityTolerance: options.updateInfinityToleranceMl ?? 1e-10,
      armijoCoefficient: 1e-4,
      minimumAbsolutePivot: 1e-14,
      unknownScaleByUnknown: storage.unknownScales,
      residualScaleByEquation: storage.residualScales,
      lowerBoundByUnknown: context.lowerBoundsMl,
      upperBoundByUnknown: context.upperBoundsMl,
    }),
    storage.newton,
  );
  const dependentSvContinuityResidualMl = result.status === "converged"
    ? context.evaluateDependentSvContinuityResidualMl(result.solution)
    : null;
  return Object.freeze({
    solverId: MAIN_WIRE_FIVE_WALL_COUPLED_NEWTON_SHADOW_V1_ID,
    jacobianResidualEvaluationCount,
    coronaryAnalyticBlockAssemblyCount,
    coronaryBoundaryAnalyticBlockAssemblyCount,
    nonCoronaryAnalyticBlockAssemblyCount,
    dependentSvContinuityResidualMl,
    result,
  });
  } finally {
    storage.inUse = false;
  }
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
