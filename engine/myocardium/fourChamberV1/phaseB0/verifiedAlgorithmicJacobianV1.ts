import {
  SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID,
  auditScaledFivePointAlgorithmicJacobianDirectionV1,
  evaluateScaledFivePointAlgorithmicJacobianV1,
  type ScaledFivePointAlgorithmicJacobianV1,
  type ScaledFivePointJacobianDirectionalAuditV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";

/**
 * Frozen compatibility surface for the original Phase B0 test reference.
 * The neutral implementation has additional affine-domain diagnostics, but
 * those fields and its new identifier must not leak into the frozen API.
 */
export const PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID =
  "phase-b0-scaled-five-point-algorithmic-jacobian-v1" as const;

export type PhaseB0ResidualEvaluatorV1 = (
  unknowns: readonly number[],
) => readonly number[];

export type PhaseB0AlgorithmicJacobianOptionsV1 = Readonly<{
  unknownScales: readonly number[];
  residualScales: readonly number[];
  lowerBounds: readonly (number | null)[];
  scaledStep: number;
}>;

export type PhaseB0AlgorithmicJacobianV1 = Readonly<{
  algorithmId: typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID;
  rawJacobian: readonly (readonly number[])[];
  scaledJacobian: readonly (readonly number[])[];
  stencilByColumn: readonly (
    | "centered-five-point"
    | "forward-five-point"
  )[];
  scaledStep: number;
}>;

export type PhaseB0JacobianDirectionalAuditV1 = Omit<
  ScaledFivePointJacobianDirectionalAuditV1,
  "algorithmId"
> & Readonly<{
  algorithmId: typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID;
}>;

export function evaluatePhaseB0AlgorithmicJacobianV1(
  evaluateResidual: PhaseB0ResidualEvaluatorV1,
  unknowns: readonly number[],
  options: PhaseB0AlgorithmicJacobianOptionsV1,
): PhaseB0AlgorithmicJacobianV1 {
  const shared = evaluateScaledFivePointAlgorithmicJacobianV1(
    evaluateResidual,
    unknowns,
    options,
  );
  if (shared.stencilByColumn.includes("backward-five-point")) {
    throw new Error("Phase B0 Jacobian admits only centered or forward stencils");
  }
  return Object.freeze({
    algorithmId: PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
    rawJacobian: shared.rawJacobian,
    scaledJacobian: shared.scaledJacobian,
    stencilByColumn: shared.stencilByColumn as readonly (
      | "centered-five-point"
      | "forward-five-point"
    )[],
    scaledStep: shared.scaledStep,
  });
}

export function auditPhaseB0AlgorithmicJacobianDirectionV1(
  evaluateResidual: PhaseB0ResidualEvaluatorV1,
  unknowns: readonly number[],
  scaledDirection: readonly number[],
  jacobian: PhaseB0AlgorithmicJacobianV1,
  options: PhaseB0AlgorithmicJacobianOptionsV1,
  independentScaledStep: number,
): PhaseB0JacobianDirectionalAuditV1 {
  if (
    jacobian.algorithmId
      !== PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
  ) {
    throw new Error("jacobian must be produced by the Phase B0 algorithmic Jacobian");
  }
  const sharedJacobian: ScaledFivePointAlgorithmicJacobianV1 = Object.freeze({
    algorithmId: SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID,
    rawJacobian: jacobian.rawJacobian,
    scaledJacobian: jacobian.scaledJacobian,
    stencilByColumn: jacobian.stencilByColumn,
    scaledStep: jacobian.scaledStep,
    scaledStepByColumn: Object.freeze(
      jacobian.stencilByColumn.map(() => jacobian.scaledStep),
    ),
  });
  const shared = auditScaledFivePointAlgorithmicJacobianDirectionV1(
    evaluateResidual,
    unknowns,
    scaledDirection,
    sharedJacobian,
    options,
    independentScaledStep,
  );
  return Object.freeze({
    algorithmId: PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
    scaledDirectionalDerivativeFromJacobian:
      shared.scaledDirectionalDerivativeFromJacobian,
    scaledDirectionalDerivativeFromIndependentStencil:
      shared.scaledDirectionalDerivativeFromIndependentStencil,
    maximumAbsoluteDifference: shared.maximumAbsoluteDifference,
    maximumRelativeDifference: shared.maximumRelativeDifference,
    differenceTwoNorm: shared.differenceTwoNorm,
    referenceTwoNorm: shared.referenceTwoNorm,
    relativeTwoNormDifference: shared.relativeTwoNormDifference,
    independentScaledStep: shared.independentScaledStep,
  });
}
