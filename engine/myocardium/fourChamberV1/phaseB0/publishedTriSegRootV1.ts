import { PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1 } from "@/engine/myocardium/fourChamberV1/phaseB0/numericalPolicyV1";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
  evaluatePhaseB0AlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  createPublishedTriSegRootApiV1,
  type PublishedTriSegContinuationAuditV1,
  type PublishedTriSegContinuationPointV1,
  type PublishedTriSegCoordinatesV1,
  type PublishedTriSegMultiStartAuditV1,
  type PublishedTriSegResidualEvaluationV1,
  type PublishedTriSegResidualInputV1,
  type PublishedTriSegRootFailureV1,
  type PublishedTriSegRootInputV1,
  type PublishedTriSegRootResultV1,
  type PublishedTriSegRootSuccessV1,
  type PublishedTriSegWallStressEvaluationV1,
  type PublishedTriSegWallStressEvaluatorV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";

export const PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID =
  "phase-b0-published-taylor-triseg-scaled-root-v1" as const;
const PHASE_B0_TRISEG_MULTI_START_AUDIT_V1_ID =
  "phase-b0-triseg-multi-start-audit-v1" as const;
const PHASE_B0_TRISEG_CONTINUATION_AUDIT_V1_ID =
  "phase-b0-triseg-continuation-audit-v1" as const;

export type PhaseB0TriSegCoordinatesV1 = PublishedTriSegCoordinatesV1;
export type PhaseB0TriSegWallStressEvaluationV1 =
  PublishedTriSegWallStressEvaluationV1;
export type PhaseB0TriSegWallStressEvaluatorV1 =
  PublishedTriSegWallStressEvaluatorV1;
export type PhaseB0PublishedTriSegRootInputV1 = PublishedTriSegRootInputV1;
type PhaseB0PublishedTriSegRootAlgorithmIdentityV1 = Readonly<{
  algorithmicJacobianId:
    typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID;
}>;
export type PhaseB0PublishedTriSegRootSuccessV1 =
  PublishedTriSegRootSuccessV1<
    typeof PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
  > & PhaseB0PublishedTriSegRootAlgorithmIdentityV1;
export type PhaseB0PublishedTriSegRootFailureV1 =
  PublishedTriSegRootFailureV1<
    typeof PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
  > & PhaseB0PublishedTriSegRootAlgorithmIdentityV1;
export type PhaseB0PublishedTriSegRootResultV1 =
  | PhaseB0PublishedTriSegRootSuccessV1
  | PhaseB0PublishedTriSegRootFailureV1;
export type PhaseB0TriSegMultiStartAuditV1 = Omit<
  PublishedTriSegMultiStartAuditV1<
    typeof PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
    typeof PHASE_B0_TRISEG_MULTI_START_AUDIT_V1_ID
  >,
  "results"
> & Readonly<{ results: readonly PhaseB0PublishedTriSegRootResultV1[] }>;
export type PhaseB0TriSegContinuationPointV1 =
  PublishedTriSegContinuationPointV1;
export type PhaseB0TriSegContinuationAuditV1 =
  Omit<PublishedTriSegContinuationAuditV1<
    typeof PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
    typeof PHASE_B0_TRISEG_CONTINUATION_AUDIT_V1_ID
  >, "results"> & Readonly<{
    results: readonly PhaseB0PublishedTriSegRootResultV1[];
  }>;
export type PhaseB0PublishedTriSegResidualEvaluationV1 =
  PublishedTriSegResidualEvaluationV1;
export type PhaseB0PublishedTriSegResidualInputV1 =
  PublishedTriSegResidualInputV1;

const POLICY = PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1;
const API = createPublishedTriSegRootApiV1({
  rootId: PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
  multiStartAuditId: PHASE_B0_TRISEG_MULTI_START_AUDIT_V1_ID,
  continuationAuditId: PHASE_B0_TRISEG_CONTINUATION_AUDIT_V1_ID,
  algorithmicJacobianId: PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
  evaluateAlgorithmicJacobian: (evaluateResidual, unknowns, options) => {
    const jacobian = evaluatePhaseB0AlgorithmicJacobianV1(
      evaluateResidual,
      unknowns,
      options,
    );
    if (
      jacobian.algorithmId
        !== PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    ) {
      throw new Error("Phase B0 root received an unexpected Jacobian identity");
    }
    return jacobian;
  },
  newtonOptions: Object.freeze({
    maxIterations: POLICY.maxNewtonIterations,
    residualInfinityTolerance: POLICY.rootResidualInfinityTolerance,
    updateInfinityTolerance: POLICY.rootUpdateInfinityTolerance,
    armijoCoefficient: POLICY.armijoCoefficient,
    lineSearchContraction: POLICY.lineSearchContraction,
    maxLineSearchBacktracks: POLICY.maxLineSearchBacktracks,
    minimumStepLength: POLICY.minimumStepLength,
    fractionToBoundarySafety: POLICY.fractionToBoundarySafety,
    relativePivotTolerance: POLICY.relativePivotTolerance,
  }),
});

export const evaluatePhaseB0PublishedTriSegResidualV1: (
  input: PhaseB0PublishedTriSegResidualInputV1,
) => PhaseB0PublishedTriSegResidualEvaluationV1 = API.evaluateResidual;

export const solvePhaseB0PublishedTriSegRootV1: (
  input: PhaseB0PublishedTriSegRootInputV1,
) => PhaseB0PublishedTriSegRootResultV1 = API.solve as (
  input: PhaseB0PublishedTriSegRootInputV1,
) => PhaseB0PublishedTriSegRootResultV1;

export const auditPhaseB0PublishedTriSegMultiStartV1: (
  input: Omit<PhaseB0PublishedTriSegRootInputV1, "initialCoordinates">,
  initialCoordinates: readonly PhaseB0TriSegCoordinatesV1[],
  scaledCoordinateTolerance?: number,
) => PhaseB0TriSegMultiStartAuditV1 = API.auditMultiStart as (
  input: Omit<PhaseB0PublishedTriSegRootInputV1, "initialCoordinates">,
  initialCoordinates: readonly PhaseB0TriSegCoordinatesV1[],
  scaledCoordinateTolerance?: number,
) => PhaseB0TriSegMultiStartAuditV1;

export const auditPhaseB0PublishedTriSegContinuationV1: (
  input: Omit<
    PhaseB0PublishedTriSegRootInputV1,
    | "leftVentricularCavityVolumeM3"
    | "rightVentricularCavityVolumeM3"
    | "initialCoordinates"
  >,
  path: readonly PhaseB0TriSegContinuationPointV1[],
  initialCoordinates: PhaseB0TriSegCoordinatesV1,
  branchContinuityThreshold: number,
) => PhaseB0TriSegContinuationAuditV1 = API.auditContinuation as (
  input: Omit<
    PhaseB0PublishedTriSegRootInputV1,
    | "leftVentricularCavityVolumeM3"
    | "rightVentricularCavityVolumeM3"
    | "initialCoordinates"
  >,
  path: readonly PhaseB0TriSegContinuationPointV1[],
  initialCoordinates: PhaseB0TriSegCoordinatesV1,
  branchContinuityThreshold: number,
) => PhaseB0TriSegContinuationAuditV1;
