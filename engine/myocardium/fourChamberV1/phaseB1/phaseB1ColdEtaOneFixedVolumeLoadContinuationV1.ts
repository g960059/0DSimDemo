import {
  solveScaledDensePartialPivotLuV1,
  type ScaledDenseLuDiagnosticsV1,
  type ScaledDenseLuFailureReasonV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  type PhaseB1ColdEtaOneFixedVolumeNodeResultV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  type BloodCompartmentId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID =
  "phase-b1-cold-eta-one-fixed-volume-load-continuation-v1" as const;

export const PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-cold-eta-one-fixed-volume-load-continuation-policy-v1",
    eta: 1 as const,
    loadParameterInterval: Object.freeze([0, 1] as const),
    refinementFactors: Object.freeze([2, 4, 8] as const),
    coarseLoadDerivativeStep: 2 ** -10,
    fineLoadDerivativeStep: 2 ** -12,
    maximumCoarseFineScaledTangentDisagreement: 1e-5,
    maximumAcceptedNodeStepScaledInfinityNorm: 0.25,
    maximumPredictorCorrectionScaledInfinityNorm: 0.25,
    maximumScaledColdResidualInfinityNorm:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm,
    maximumScaledColdUpdateInfinityNorm:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdUpdateInfinityNorm,
    maximumLocalMaterialResidualInfinityNorm:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumLocalMaterialResidualInfinityNorm,
    restoringBranchOnly: true as const,
    previousNodeUsedAs: "tangent-predictor-base-only" as const,
    hiddenSubdivisionAllowed: false as const,
    pseudoArclengthAllowed: false as const,
    projectionAllowed: false as const,
    clippingAllowed: false as const,
    rootRankingAllowed: false as const,
  } as const);

export type PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1 =
  | "forward"
  | "reverse";

export type PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1 = 2 | 4 | 8;

export type PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1 = Readonly<{
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1;
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  sourceBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  destinationBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  direction: PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1;
  refinementFactor: PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1;
}>;

export type PhaseB1ColdEtaOneFixedVolumeLoadNodeV1 = Readonly<{
  s: number;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
}>;

export type PhaseB1ColdEtaOneFixedVolumeLoadDerivativeStencilV1 =
  | "centered-five-point"
  | "forward-five-point"
  | "backward-five-point";

export type PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditSuccessV1 = Readonly<{
  success: true;
  coarseStep: number;
  fineStep: number;
  coarseStencil: PhaseB1ColdEtaOneFixedVolumeLoadDerivativeStencilV1;
  fineStencil: PhaseB1ColdEtaOneFixedVolumeLoadDerivativeStencilV1;
  coarseScaledResidualDerivativeByS: readonly number[];
  fineScaledResidualDerivativeByS: readonly number[];
  coarseScaledUnknownTangentByS: readonly number[];
  fineScaledUnknownTangentByS: readonly number[];
  coarseLinearSolveDiagnostics: ScaledDenseLuDiagnosticsV1;
  fineLinearSolveDiagnostics: ScaledDenseLuDiagnosticsV1;
  coarseFineScaledTangentDisagreement: number;
  tangentDisagreementPass: boolean;
}>;

export type PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditFailureV1 = Readonly<{
  success: false;
  reason:
    | "load-derivative-evaluation-failed"
    | "coarse-tangent-linear-solve-failed"
    | "fine-tangent-linear-solve-failed";
  message: string;
  linearSolveFailureReason: ScaledDenseLuFailureReasonV1 | null;
  linearSolveDiagnostics: ScaledDenseLuDiagnosticsV1 | null;
}>;

export type PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1 =
  | PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditSuccessV1
  | PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditFailureV1;

export type PhaseB1ColdEtaOneFixedVolumeLoadEdgeAuditV1 = Readonly<{
  edgeIndex: number;
  fromS: number;
  toS: number;
  fromBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  toBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  tangentAudit: PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditSuccessV1;
  predictorUnknowns: readonly number[];
  acceptedUnknowns: readonly number[];
  acceptedNodeStepScaledInfinityNorm: number;
  predictorCorrectionScaledInfinityNorm: number;
  acceptedNode: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1;
  edgePass: true;
}>;

export type PhaseB1ColdEtaOneFixedVolumeLoadFailedAttemptV1 = Readonly<{
  attemptIndex: number;
  fromS: number;
  toS: number;
  fromBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  toBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  tangentAudit: PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1 | null;
  predictorUnknowns: readonly number[] | null;
  correctorResult: PhaseB1ColdEtaOneFixedVolumeNodeResultV1 | null;
  candidateNodeStepScaledInfinityNorm: number | null;
  candidatePredictorCorrectionScaledInfinityNorm: number | null;
}>;

type PhaseB1ColdEtaOneFixedVolumeLoadContinuationCommonV1 = Readonly<{
  continuationId:
    typeof PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID;
  slsMode: "on" | "off";
  direction: PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1;
  refinementFactor: PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1;
  requestedSValues: readonly number[];
  attemptedSValues: readonly number[];
  sourceBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  destinationBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  previousNodeUsedAs: "tangent-predictor-base-only";
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  projectionApplied: false;
  clippingApplied: false;
  nearestRootSelectionApplied: false;
  minimumResidualRootSelectionApplied: false;
  maximumJunctionRadiusRootSelectionApplied: false;
}>;

export type PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1 =
  PhaseB1ColdEtaOneFixedVolumeLoadContinuationCommonV1 & Readonly<{
    completed: true;
    nodes: readonly PhaseB1ColdEtaOneFixedVolumeLoadNodeV1[];
    edgeAudits: readonly PhaseB1ColdEtaOneFixedVolumeLoadEdgeAuditV1[];
    endpoint: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1;
    maximumCoarseFineScaledTangentDisagreement: number;
    maximumAcceptedNodeStepScaledInfinityNorm: number;
    maximumPredictorCorrectionScaledInfinityNorm: number;
    branchIdentityEstablished: true;
    branchIdentity:
      "restoring-root-tracked-by-full-state-fixed-volume-tangent-predictor-corrector";
  }>;

export type PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureReasonV1 =
  | "load-tangent-evaluation-failed"
  | "tangent-disagreement-gate-failed"
  | "predictor-construction-failed"
  | "injected-structured-failure"
  | "restoring-corrector-failed"
  | "corrected-node-hard-gate-failed"
  | "accepted-node-step-gate-failed"
  | "predictor-correction-gate-failed";

export type PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureV1 =
  PhaseB1ColdEtaOneFixedVolumeLoadContinuationCommonV1 & Readonly<{
    completed: false;
    acceptedNodes: readonly PhaseB1ColdEtaOneFixedVolumeLoadNodeV1[];
    edgeAudits: readonly PhaseB1ColdEtaOneFixedVolumeLoadEdgeAuditV1[];
    failedAttempt: PhaseB1ColdEtaOneFixedVolumeLoadFailedAttemptV1;
    reason: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureReasonV1;
    message: string;
    rollbackNode: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1;
    rollbackUnknowns: readonly number[];
    rollbackBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
    branchIdentityEstablished: false;
    branchIdentity: "not-established";
  }>;

export type PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1 =
  | PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1
  | PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureV1;

export type PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1 =
  Readonly<{
    probeId:
      "phase-b1-cold-eta-one-fixed-volume-load-continuation-failure-probe-v1";
    injectedAttemptIndex: 0 | 1;
    result: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureV1;
  }>;

const COMMON_BOUNDARY = Object.freeze({
  previousNodeUsedAs: "tangent-predictor-base-only" as const,
  hiddenSubdivisionApplied: false as const,
  pseudoArclengthApplied: false as const,
  projectionApplied: false as const,
  clippingApplied: false as const,
  nearestRootSelectionApplied: false as const,
  minimumResidualRootSelectionApplied: false as const,
  maximumJunctionRadiusRootSelectionApplied: false as const,
});

export function runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1(
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
): PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1 {
  return runContinuation(input, null);
}

export function runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1(
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
  injectedAttemptIndex: 0 | 1 = 1,
): PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1 {
  if (injectedAttemptIndex !== 0 && injectedAttemptIndex !== 1) {
    throw new Error("load-continuation injectedAttemptIndex must be zero or one");
  }
  if (injectedAttemptIndex >= input.refinementFactor) {
    throw new Error("load-continuation injectedAttemptIndex exceeds the grid");
  }
  const result = runContinuation(input, injectedAttemptIndex);
  if (result.completed === true) {
    throw new Error("load-continuation failure probe unexpectedly completed");
  }
  return Object.freeze({
    probeId:
      "phase-b1-cold-eta-one-fixed-volume-load-continuation-failure-probe-v1",
    injectedAttemptIndex,
    result,
  });
}

function runContinuation(
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
  injectedAttemptIndex: 0 | 1 | null,
): PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1 {
  validatePublicInput(input);
  const requestedSValues = buildSGrid(input.refinementFactor, input.direction);
  const attemptedSValues: number[] = [requestedSValues[0]];
  const source = Object.freeze({
    s: requestedSValues[0],
    bloodVolumesM3: freezeVolumes(input.sourceBloodVolumesM3),
    node: input.sourceNode,
  });
  const acceptedNodes: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1[] = [source];
  const edgeAudits: PhaseB1ColdEtaOneFixedVolumeLoadEdgeAuditV1[] = [];
  let maximumCoarseFineScaledTangentDisagreement = 0;
  let maximumAcceptedNodeStepScaledInfinityNorm = 0;
  let maximumPredictorCorrectionScaledInfinityNorm = 0;

  for (let attemptIndex = 0; attemptIndex < input.refinementFactor; attemptIndex += 1) {
    const previous = acceptedNodes[acceptedNodes.length - 1];
    const toS = requestedSValues[attemptIndex + 1];
    const toBloodVolumesM3 = volumesAtS(input, toS);
    attemptedSValues.push(toS);
    const tangentAudit = buildTangentAudit(input.session, input, previous);
    if (tangentAudit.success === false) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        null,
        null,
        null,
        null,
        "load-tangent-evaluation-failed",
        tangentAudit.message,
      );
    }
    maximumCoarseFineScaledTangentDisagreement = Math.max(
      maximumCoarseFineScaledTangentDisagreement,
      tangentAudit.coarseFineScaledTangentDisagreement,
    );
    if (!tangentAudit.tangentDisagreementPass) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        null,
        null,
        null,
        null,
        "tangent-disagreement-gate-failed",
        "coarse/fine scaled load tangent disagreement exceeded policy",
      );
    }
    const deltaS = toS - previous.s;
    let predictorUnknowns: readonly number[];
    try {
      predictorUnknowns = Object.freeze(previous.node.unknowns.map(
        (value, index) => requireFinite(
          value
            + deltaS * tangentAudit.fineScaledUnknownTangentByS[index]
              * input.session.layout.unknownScales[index],
          `load predictor[${index}]`,
        ),
      ));
    } catch (error) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        null,
        null,
        null,
        null,
        "predictor-construction-failed",
        `load predictor construction failed: ${errorMessage(error)}`,
      );
    }
    if (injectedAttemptIndex === attemptIndex) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        predictorUnknowns,
        null,
        null,
        null,
        "injected-structured-failure",
        "deterministic fixed-volume load-continuation rollback probe",
      );
    }
    let correctorResult: PhaseB1ColdEtaOneFixedVolumeNodeResultV1;
    try {
      correctorResult = input.session.solveRestoringNodeAtVolumes({
        bloodVolumesM3: toBloodVolumesM3,
        initialUnknowns: predictorUnknowns,
      });
    } catch (error) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        predictorUnknowns,
        null,
        null,
        null,
        "restoring-corrector-failed",
        `restoring corrector threw: ${errorMessage(error)}`,
      );
    }
    if (correctorResult.converged === false) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        predictorUnknowns,
        correctorResult,
        null,
        null,
        "restoring-corrector-failed",
        correctorResult.message,
      );
    }
    const acceptedNodeStepScaledInfinityNorm = scaledInfinityDistance(
      previous.node.unknowns,
      correctorResult.unknowns,
      input.session.layout.unknownScales,
    );
    const predictorCorrectionScaledInfinityNorm = scaledInfinityDistance(
      predictorUnknowns,
      correctorResult.unknowns,
      input.session.layout.unknownScales,
    );
    const candidate = Object.freeze({
      s: toS,
      bloodVolumesM3: toBloodVolumesM3,
      node: correctorResult,
    });
    if (!nodePassesHardGates(input.session, candidate)) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        predictorUnknowns,
        correctorResult,
        acceptedNodeStepScaledInfinityNorm,
        predictorCorrectionScaledInfinityNorm,
        "corrected-node-hard-gate-failed",
        "corrected load node failed a predeclared cold hard gate",
      );
    }
    if (
      acceptedNodeStepScaledInfinityNorm
        > PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1
          .maximumAcceptedNodeStepScaledInfinityNorm
    ) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        predictorUnknowns,
        correctorResult,
        acceptedNodeStepScaledInfinityNorm,
        predictorCorrectionScaledInfinityNorm,
        "accepted-node-step-gate-failed",
        "corrected load node step exceeded policy",
      );
    }
    if (
      predictorCorrectionScaledInfinityNorm
        > PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1
          .maximumPredictorCorrectionScaledInfinityNorm
    ) {
      return continuationFailure(
        input,
        requestedSValues,
        attemptedSValues,
        acceptedNodes,
        edgeAudits,
        attemptIndex,
        toS,
        toBloodVolumesM3,
        tangentAudit,
        predictorUnknowns,
        correctorResult,
        acceptedNodeStepScaledInfinityNorm,
        predictorCorrectionScaledInfinityNorm,
        "predictor-correction-gate-failed",
        "load predictor correction exceeded policy",
      );
    }
    maximumAcceptedNodeStepScaledInfinityNorm = Math.max(
      maximumAcceptedNodeStepScaledInfinityNorm,
      acceptedNodeStepScaledInfinityNorm,
    );
    maximumPredictorCorrectionScaledInfinityNorm = Math.max(
      maximumPredictorCorrectionScaledInfinityNorm,
      predictorCorrectionScaledInfinityNorm,
    );
    const edge = Object.freeze({
      edgeIndex: attemptIndex,
      fromS: previous.s,
      toS,
      fromBloodVolumesM3: previous.bloodVolumesM3,
      toBloodVolumesM3,
      tangentAudit,
      predictorUnknowns,
      acceptedUnknowns: correctorResult.unknowns,
      acceptedNodeStepScaledInfinityNorm,
      predictorCorrectionScaledInfinityNorm,
      acceptedNode: candidate,
      edgePass: true as const,
    });
    edgeAudits.push(edge);
    acceptedNodes.push(candidate);
  }

  const endpoint = acceptedNodes[acceptedNodes.length - 1];
  return Object.freeze({
    continuationId:
      PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
    slsMode: input.session.slsMode,
    direction: input.direction,
    refinementFactor: input.refinementFactor,
    requestedSValues,
    attemptedSValues: Object.freeze([...attemptedSValues]),
    sourceBloodVolumesM3: source.bloodVolumesM3,
    destinationBloodVolumesM3: freezeVolumes(input.destinationBloodVolumesM3),
    completed: true as const,
    nodes: Object.freeze([...acceptedNodes]),
    edgeAudits: Object.freeze([...edgeAudits]),
    endpoint,
    maximumCoarseFineScaledTangentDisagreement,
    maximumAcceptedNodeStepScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm,
    branchIdentityEstablished: true as const,
    branchIdentity:
      "restoring-root-tracked-by-full-state-fixed-volume-tangent-predictor-corrector" as const,
    ...COMMON_BOUNDARY,
  });
}

function buildTangentAudit(
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
  source: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1,
): PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1 {
  const policy =
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1;
  try {
    const coarseDerivative = loadDerivative(
      session,
      input,
      source.s,
      source.node.unknowns,
      policy.coarseLoadDerivativeStep,
    );
    const fineDerivative = loadDerivative(
      session,
      input,
      source.s,
      source.node.unknowns,
      policy.fineLoadDerivativeStep,
    );
    const matrix = flattenScaledJacobian(
      source.node,
      session.layout.unknownCount,
    );
    const coarseSolve = solveScaledDensePartialPivotLuV1(
      matrix,
      coarseDerivative.scaledResidualDerivativeByS.map((value) => -value),
    );
    if (coarseSolve.success === false) {
      return Object.freeze({
        success: false as const,
        reason: "coarse-tangent-linear-solve-failed" as const,
        message: coarseSolve.message,
        linearSolveFailureReason: coarseSolve.reason,
        linearSolveDiagnostics: coarseSolve.diagnostics,
      });
    }
    const fineSolve = solveScaledDensePartialPivotLuV1(
      matrix,
      fineDerivative.scaledResidualDerivativeByS.map((value) => -value),
    );
    if (fineSolve.success === false) {
      return Object.freeze({
        success: false as const,
        reason: "fine-tangent-linear-solve-failed" as const,
        message: fineSolve.message,
        linearSolveFailureReason: fineSolve.reason,
        linearSolveDiagnostics: fineSolve.diagnostics,
      });
    }
    const disagreement = scaledInfinityDifference(
      coarseSolve.solution,
      fineSolve.solution,
    );
    return Object.freeze({
      success: true as const,
      coarseStep: policy.coarseLoadDerivativeStep,
      fineStep: policy.fineLoadDerivativeStep,
      coarseStencil: coarseDerivative.stencil,
      fineStencil: fineDerivative.stencil,
      coarseScaledResidualDerivativeByS:
        coarseDerivative.scaledResidualDerivativeByS,
      fineScaledResidualDerivativeByS:
        fineDerivative.scaledResidualDerivativeByS,
      coarseScaledUnknownTangentByS: coarseSolve.solution,
      fineScaledUnknownTangentByS: fineSolve.solution,
      coarseLinearSolveDiagnostics: coarseSolve.diagnostics,
      fineLinearSolveDiagnostics: fineSolve.diagnostics,
      coarseFineScaledTangentDisagreement: disagreement,
      tangentDisagreementPass:
        disagreement <= policy.maximumCoarseFineScaledTangentDisagreement,
    });
  } catch (error) {
    return Object.freeze({
      success: false as const,
      reason: "load-derivative-evaluation-failed" as const,
      message: `load tangent evaluation failed: ${errorMessage(error)}`,
      linearSolveFailureReason: null,
      linearSolveDiagnostics: null,
    });
  }
}

function loadDerivative(
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
  s: number,
  unknowns: readonly number[],
  step: number,
) {
  const stencil: PhaseB1ColdEtaOneFixedVolumeLoadDerivativeStencilV1 =
    s - 2 * step < 0
      ? "forward-five-point"
      : s + 2 * step > 1
        ? "backward-five-point"
        : "centered-five-point";
  const offsets = stencil === "centered-five-point"
    ? [-2, -1, 1, 2]
    : stencil === "forward-five-point"
      ? [0, 1, 2, 3, 4]
      : [0, -1, -2, -3, -4];
  const scaledResiduals = offsets.map((offset) => {
    const sampleS = s + offset * step;
    if (sampleS < 0 || sampleS > 1) {
      throw new Error(`load derivative sample s=${sampleS} left [0,1]`);
    }
    const residual = session.evaluateResidualVectorAtVolumes({
      bloodVolumesM3: volumesAtS(input, sampleS),
      unknowns,
    });
    if (residual.length !== session.layout.unknownCount) {
      throw new Error("load derivative residual dimension drifted");
    }
    return Object.freeze(residual.map((value, index) => requireFinite(
      value / session.layout.residualScales[index],
      `scaled load residual[${index}]`,
    )));
  });
  const derivative = Array.from(
    { length: session.layout.unknownCount },
    (_, row) => {
      const value = stencil === "centered-five-point"
        ? (
          scaledResiduals[0][row]
          - 8 * scaledResiduals[1][row]
          + 8 * scaledResiduals[2][row]
          - scaledResiduals[3][row]
        ) / (12 * step)
        : stencil === "forward-five-point"
          ? (
            -25 * scaledResiduals[0][row]
            + 48 * scaledResiduals[1][row]
            - 36 * scaledResiduals[2][row]
            + 16 * scaledResiduals[3][row]
            - 3 * scaledResiduals[4][row]
          ) / (12 * step)
          : (
            25 * scaledResiduals[0][row]
            - 48 * scaledResiduals[1][row]
            + 36 * scaledResiduals[2][row]
            - 16 * scaledResiduals[3][row]
            + 3 * scaledResiduals[4][row]
          ) / (12 * step);
      return requireFinite(value, `scaled load derivative[${row}]`);
    },
  );
  return Object.freeze({
    stencil,
    scaledResidualDerivativeByS: Object.freeze(derivative),
  });
}

function continuationFailure(
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
  requestedSValues: readonly number[],
  attemptedSValues: readonly number[],
  acceptedNodes: readonly PhaseB1ColdEtaOneFixedVolumeLoadNodeV1[],
  edgeAudits: readonly PhaseB1ColdEtaOneFixedVolumeLoadEdgeAuditV1[],
  attemptIndex: number,
  toS: number,
  toBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  tangentAudit: PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1 | null,
  predictorUnknowns: readonly number[] | null,
  correctorResult: PhaseB1ColdEtaOneFixedVolumeNodeResultV1 | null,
  candidateNodeStepScaledInfinityNorm: number | null,
  candidatePredictorCorrectionScaledInfinityNorm: number | null,
  reason: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureReasonV1,
  message: string,
): PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureV1 {
  const rollbackNode = acceptedNodes[acceptedNodes.length - 1];
  const failedAttempt = Object.freeze({
    attemptIndex,
    fromS: rollbackNode.s,
    toS,
    fromBloodVolumesM3: rollbackNode.bloodVolumesM3,
    toBloodVolumesM3,
    tangentAudit,
    predictorUnknowns,
    correctorResult,
    candidateNodeStepScaledInfinityNorm,
    candidatePredictorCorrectionScaledInfinityNorm,
  });
  return Object.freeze({
    continuationId:
      PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
    slsMode: input.session.slsMode,
    direction: input.direction,
    refinementFactor: input.refinementFactor,
    requestedSValues,
    attemptedSValues: Object.freeze([...attemptedSValues]),
    sourceBloodVolumesM3: freezeVolumes(input.sourceBloodVolumesM3),
    destinationBloodVolumesM3: freezeVolumes(input.destinationBloodVolumesM3),
    completed: false as const,
    acceptedNodes: Object.freeze([...acceptedNodes]),
    edgeAudits: Object.freeze([...edgeAudits]),
    failedAttempt,
    reason,
    message,
    rollbackNode,
    rollbackUnknowns: rollbackNode.node.unknowns,
    rollbackBloodVolumesM3: rollbackNode.bloodVolumesM3,
    branchIdentityEstablished: false as const,
    branchIdentity: "not-established" as const,
    ...COMMON_BOUNDARY,
  });
}

function validatePublicInput(
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
): void {
  assertExactPlainRecord(
    input,
    [
      "session",
      "sourceNode",
      "sourceBloodVolumesM3",
      "destinationBloodVolumesM3",
      "direction",
      "refinementFactor",
    ],
    "fixed-volume load-continuation input",
  );
  if (
    input.session.solverId !== PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID
    || input.session.layout.slsMode !== input.session.slsMode
  ) throw new Error("fixed-volume load-continuation session identity drifted");
  if (input.direction !== "forward" && input.direction !== "reverse") {
    throw new Error("fixed-volume load-continuation direction must be forward or reverse");
  }
  if (![2, 4, 8].includes(input.refinementFactor)) {
    throw new Error("fixed-volume load-continuation refinementFactor must be 2, 4, or 8");
  }
  assertExactPlainRecord(
    input.sourceBloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
    "fixed-volume load-continuation sourceBloodVolumesM3",
  );
  assertExactPlainRecord(
    input.destinationBloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
    "fixed-volume load-continuation destinationBloodVolumesM3",
  );
  const ledgerAnchor = input.session.anchorFixedInputs.bloodVolumesM3;
  if (
    !closedLedgerVolumesExact(input.sourceBloodVolumesM3, ledgerAnchor)
    || !closedLedgerVolumesExact(
      input.destinationBloodVolumesM3,
      ledgerAnchor,
    )
  ) {
    throw new Error(
      "fixed-volume load-continuation endpoints must lie on the session's exact closed LV/PV and RV/SV ledger",
    );
  }
  input.session.evaluateResidualVectorAtVolumes({
    bloodVolumesM3: input.sourceBloodVolumesM3,
    unknowns: input.sourceNode.unknowns,
  });
  input.session.evaluateResidualVectorAtVolumes({
    bloodVolumesM3: input.destinationBloodVolumesM3,
    unknowns: input.sourceNode.unknowns,
  });
  const source = Object.freeze({
    s: input.direction === "forward" ? 0 : 1,
    bloodVolumesM3: freezeVolumes(input.sourceBloodVolumesM3),
    node: input.sourceNode,
  });
  if (!nodePassesHardGates(input.session, source)) {
    throw new Error("fixed-volume load-continuation source node failed hard gates");
  }
}

function nodePassesHardGates(
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  node: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1,
): boolean {
  const policy =
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1;
  const state = node.node.endpoint.differentialState;
  return node.node.eta === policy.eta
    && state.slsMode === session.slsMode
    && deepExactEqual(state.bloodVolumesM3, node.bloodVolumesM3)
    && node.node.endpoint.timeSec === session.anchorFixedInputs.timeSec
    && deepExactEqual(
      state.inertialFlowsM3PerSec,
      session.anchorFixedInputs.inertialFlowsM3PerSec,
    )
    && deepExactEqual(
      state.calciumByWall,
      session.anchorFixedInputs.calciumByWall,
    )
    && Number.isFinite(node.node.scaledResidualInfinityNorm)
    && node.node.scaledResidualInfinityNorm
      <= policy.maximumScaledColdResidualInfinityNorm
    && Number.isFinite(node.node.scaledUpdateInfinityNorm)
    && node.node.scaledUpdateInfinityNorm
      <= policy.maximumScaledColdUpdateInfinityNorm
    && Number.isFinite(node.node.minimumLandSimplexMargin)
    && node.node.minimumLandSimplexMargin > 0
    && Number.isFinite(node.node.maximumLocalMaterialResidualInfinityNorm)
    && node.node.maximumLocalMaterialResidualInfinityNorm
      <= policy.maximumLocalMaterialResidualInfinityNorm
    && node.node.effectiveTriSegAudit.accepted
    && node.node.effectiveTriSegAudit.classification === "robust-restoring"
    && !node.node.projectionApplied
    && !node.node.clippingApplied
    && !node.node.fallbackApplied
    && !node.node.residualEvaluation.projectionApplied
    && !node.node.residualEvaluation.clippingApplied;
}

function buildSGrid(
  refinementFactor: PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1,
  direction: PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1,
): readonly number[] {
  return Object.freeze(Array.from(
    { length: refinementFactor + 1 },
    (_, index) => direction === "forward"
      ? index / refinementFactor
      : 1 - index / refinementFactor,
  ));
}

function volumesAtS(
  input: PhaseB1ColdEtaOneFixedVolumeLoadContinuationInputV1,
  s: number,
): Readonly<Record<BloodCompartmentId, number>> {
  if (!Number.isFinite(s) || s < 0 || s > 1) {
    throw new Error("fixed-volume load parameter s must be in [0,1]");
  }
  const lower = input.direction === "forward"
    ? input.sourceBloodVolumesM3
    : input.destinationBloodVolumesM3;
  const upper = input.direction === "forward"
    ? input.destinationBloodVolumesM3
    : input.sourceBloodVolumesM3;
  const ledgerAnchor = input.session.anchorFixedInputs.bloodVolumesM3;
  const leftVentricularVolumeM3 = s === 0
    ? lower.LV
    : s === 1
      ? upper.LV
      : lower.LV + s * (upper.LV - lower.LV);
  const rightVentricularVolumeM3 = s === 0
    ? lower.RV
    : s === 1
      ? upper.RV
      : lower.RV + s * (upper.RV - lower.RV);
  return freezeVolumes({
    LA: ledgerAnchor.LA,
    LV: leftVentricularVolumeM3,
    RA: ledgerAnchor.RA,
    RV: rightVentricularVolumeM3,
    SA: ledgerAnchor.SA,
    SV: ledgerAnchor.SV
      - (rightVentricularVolumeM3 - ledgerAnchor.RV),
    PA: ledgerAnchor.PA,
    PV: ledgerAnchor.PV
      - (leftVentricularVolumeM3 - ledgerAnchor.LV),
  });
}

function closedLedgerVolumesExact(
  volumes: Readonly<Record<BloodCompartmentId, number>>,
  anchor: Readonly<Record<BloodCompartmentId, number>>,
): boolean {
  return volumes.LA === anchor.LA
    && volumes.RA === anchor.RA
    && volumes.SA === anchor.SA
    && volumes.PA === anchor.PA
    && volumes.PV === anchor.PV - (volumes.LV - anchor.LV)
    && volumes.SV === anchor.SV - (volumes.RV - anchor.RV);
}

function flattenScaledJacobian(
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  dimension: number,
): readonly number[] {
  const matrix = node.algorithmicJacobian.scaledJacobian;
  if (matrix.length !== dimension || matrix.some((row) => row.length !== dimension)) {
    throw new Error("fixed-volume load source Jacobian dimension drifted");
  }
  return Object.freeze(matrix.flatMap((row, rowIndex) => row.map(
    (value, columnIndex) => requireFinite(
      value,
      `fixed-volume load Jacobian[${rowIndex}][${columnIndex}]`,
    ),
  )));
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("fixed-volume load vector dimension drifted");
  }
  return Math.max(0, ...left.map((value, index) => requireFinite(
    Math.abs((value - right[index]) / requirePositiveFinite(
      scales[index],
      `fixed-volume load scale[${index}]`,
    )),
    `fixed-volume load scaled distance[${index}]`,
  )));
}

function scaledInfinityDifference(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length) {
    throw new Error("fixed-volume load tangent dimension drifted");
  }
  return Math.max(0, ...left.map((value, index) => requireFinite(
    Math.abs(value - right[index]),
    `fixed-volume load tangent difference[${index}]`,
  )));
}

function freezeVolumes(
  volumes: Readonly<Record<BloodCompartmentId, number>>,
): Readonly<Record<BloodCompartmentId, number>> {
  return Object.freeze(Object.fromEntries(BLOOD_COMPARTMENT_IDS.map((id) => [
    id,
    requirePositiveFinite(volumes[id], `fixed-volume load volumes.${id}`),
  ]))) as Readonly<Record<BloodCompartmentId, number>>;
}

function assertExactPlainRecord(
  value: unknown,
  expectedKeys: readonly (string | symbol)[],
  field: string,
): asserts value is Readonly<Record<PropertyKey, unknown>> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) throw new Error(`${field} must be a plain object`);
  const actualKeys = Reflect.ownKeys(value);
  if (
    actualKeys.length !== expectedKeys.length
    || expectedKeys.some((key) => !actualKeys.includes(key))
  ) throw new Error(`${field} must contain exactly the declared keys`);
  for (const key of actualKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${field}.${String(key)} must be an enumerable data property`);
  }
}

function deepExactEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
  ) return false;
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && deepExactEqual(leftRecord[key], rightRecord[key]));
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
