import type { CanonicalSha256HexProvider } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
  type ScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  solveScaledDampedNewtonV1,
  solveScaledDensePartialPivotLuV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDenseLuDiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import type { StrictAffineConstraintV1 } from
  "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";
import type {
  PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeResultV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  type PhaseB1ColdEtaOneReferenceConfigurationV1,
  type PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1,
  type PhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  ALGEBRAIC_FLOW_IDS,
  INERTIAL_FLOW_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID =
  "phase-b1-project-synthetic-quiescent-pressure-reference-inverse-v1" as const;

const phaseB1QuiescentPressureReferenceInverseResultRegistryV1 =
  new WeakSet<object>();

const PRESSURE_ORDER = Object.freeze(["LA", "LV", "RA", "RV"] as const);
const VASCULAR_TARGET_ORDER = Object.freeze(["PV", "SA", "SV", "PA"] as const);
const LOG_UNKNOWN_LABELS = Object.freeze([
  "log_LA_reference_cavity_multiplier",
  "log_RA_reference_cavity_multiplier",
  "log_freewall_even_reference_area_multiplier",
  "log_freewall_odd_reference_area_multiplier",
] as const);
const REFINEMENT_FACTORS = Object.freeze([2, 4, 8] as const);

export const PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-project-synthetic-quiescent-pressure-reference-inverse-policy-v1",
    eta: 1 as const,
    loadParameter: "rho" as const,
    loadParameterInterval: Object.freeze([0, 1] as const),
    pressureOrder: PRESSURE_ORDER,
    vascularTargetOrder: VASCULAR_TARGET_ORDER,
    targetPressureSchedule:
      "positive-geometric-source-to-common-vascular-pressure" as const,
    targetPressureFormula:
      "P_i(rho)=P_i(0)^(1-rho)*P_common^rho" as const,
    biologicalPathClaimed: false as const,
    logUnknownLabels: LOG_UNKNOWN_LABELS,
    logBounds: Object.freeze({
      LAReferenceCavity: Object.freeze({
        lower: -2.1439300263,
        upper: 1.6006927553,
      }),
      RAReferenceCavity: Object.freeze({
        lower: -2.0137187285,
        upper: 1.5858462906,
      }),
      freewallEven: Object.freeze({ lower: -2.5, upper: 2.5 }),
      freewallOdd: Object.freeze({ lower: -2.5, upper: 2.5 }),
      LVFWActual: Object.freeze({ lower: -0.899495, upper: 0.900505 }),
      RVFWActual: Object.freeze({ lower: -0.899495, upper: 0.900505 }),
    }),
    logUnknownScale: 0.1,
    strictMaximumAbsoluteFiberLogStrain: 0.5,
    freewallReferenceAreaMap: Object.freeze({
      LVFW: "A0*exp(ell_even+ell_odd)" as const,
      SEP: "A0" as const,
      RVFW: "A0*exp(ell_even-ell_odd)" as const,
    }),
    refinementFactors: REFINEMENT_FACTORS,
    fullJacobianScaledStep: 2 ** -19,
    independentSchurJacobianScaledStep: 2 ** -17,
    effectiveJacobianStencilGate: Object.freeze({
      everyPrimaryEffectiveStepPositiveAtMostConfigured: true as const,
      everyIndependentEffectiveStepPositiveAtMostConfigured: true as const,
      everyCorrespondingEffectiveStepDiffers: true as const,
      everyIndependentEffectiveStepExceedsPrimary: true as const,
      completeDenseColumnInventoryRequired: true as const,
    }),
    maximumIndependentScaledSchurAbsoluteDifference: 1e-7,
    pressureResidualScalePa: 13_332.2387415,
    newton: Object.freeze({
      maximumIterations: 28,
      scaledResidualInfinityTolerance: 1e-8,
      scaledUpdateInfinityTolerance: 1e-8,
    }),
    correctorBoundary: Object.freeze({
      method:
        "block-eliminated-restoring-manifold-damped-newton" as const,
      nonlinearColdBlockElimination: true as const,
      directFullAugmentedFivePointJacobianSuppliesSchur: true as const,
      nestedFiniteDifferenceApplied: false as const,
      reducedTrialColdSeed:
        "edge-entry-accepted-cold-node" as const,
      fallbackReseedApplied: false as const,
      monolithicFullNewtonClaimed: false as const,
    }),
    gates: Object.freeze({
      minimumColdBlockRelativePivot: 1e-8,
      minimumSchurSingularValue: 1e-6,
      minimumRelativeSchurSingularValue: 1e-3,
      maximumSchurConditionNumber2: 1e3,
      maximumScaledResidualInfinityNorm: 1e-8,
      maximumAcceptedNodeStepScaledInfinityNorm: 10,
      maximumPredictorCorrectionScaledInfinityNorm: 2,
      maximumAbsoluteDestinationPressureDifferencePa: 1e-5,
      maximumAbsoluteDestinationFlowAccelerationM3PerSec2: 1e-8,
      maximumFactorEightReverseClosureScaledInfinityNorm: 1e-6,
      maximumForwardEndpointAgreementScaledInfinityNorm: 1e-6,
    }),
    // Predeclared from the source rank probe and the approximate endpoint
    // displacement [-1.58,-1.53,-0.68,0] at log scale 0.1. A hard edge norm
    // of 10 means at most one log-unit per declared edge; the exact 50% guard
    // of 5 means at most half a log-unit. These predeclared meanings reject
    // factors 2 and 4 at the guard while leaving factor 8 headroom.
    fiftyPercentGuard: Object.freeze({
      minimumColdBlockRelativePivot: 2e-8,
      minimumSchurSingularValue: 2e-6,
      minimumRelativeSchurSingularValue: 2e-3,
      maximumSchurConditionNumber2: 500,
      maximumScaledResidualInfinityNorm: 5e-9,
      maximumAcceptedNodeStepScaledInfinityNorm: 5,
      maximumPredictorCorrectionScaledInfinityNorm: 1,
      maximumAbsoluteFiberLogStrain: 0.45,
      maximumAbsoluteDestinationPressureDifferencePa: 5e-6,
      maximumAbsoluteDestinationFlowAccelerationM3PerSec2: 5e-9,
    }),
    regularizationApplied: false as const,
    priorApplied: false as const,
    projectionApplied: false as const,
    clippingApplied: false as const,
    hiddenSubdivisionApplied: false as const,
    pseudoArclengthApplied: false as const,
    rootRankingApplied: false as const,
  } as const);

type PressureRecord = Readonly<Record<(typeof PRESSURE_ORDER)[number], number>>;
type LogVector = readonly [number, number, number, number];
type RefinementFactor = (typeof REFINEMENT_FACTORS)[number];

export type PhaseB1QuiescentPressureReferenceSchurAuditV1 = Readonly<{
  pressureRows: typeof PRESSURE_ORDER;
  logColumns: typeof LOG_UNKNOWN_LABELS;
  coldBlockDimension: number;
  rawPressurePerLogSchurPa: readonly (readonly number[])[];
  scaledSchur: readonly (readonly number[])[];
  independentScaledStep: number;
  primaryScaledStepByColumn: readonly number[];
  independentScaledStepByColumn: readonly number[];
  primaryStencilByColumn:
    ScaledFivePointAlgorithmicJacobianV1["stencilByColumn"];
  independentStencilByColumn:
    ScaledFivePointAlgorithmicJacobianV1["stencilByColumn"];
  effectiveJacobianStencilGatePass: boolean;
  independentScaledSchur: readonly (readonly number[])[];
  singularValuesDescending: readonly [number, number, number, number];
  independentSingularValuesDescending:
    readonly [number, number, number, number];
  rank: number;
  independentRank: number;
  relativeMinimumSingularValue: number;
  independentRelativeMinimumSingularValue: number;
  conditionNumber2: number;
  independentConditionNumber2: number;
  maximumIndependentScaledSchurAbsoluteDifference: number;
  maximumIndependentScaledSchurAbsoluteDifferenceGate: number;
  coldBlockLuDiagnosticsByLog:
    readonly ScaledDenseLuDiagnosticsV1[];
  independentColdBlockLuDiagnosticsByLog:
    readonly ScaledDenseLuDiagnosticsV1[];
  minimumColdBlockRelativePivot: number;
  independentMinimumColdBlockRelativePivot: number;
  minimumColdBlockRelativePivotGate: number;
  jacobiSvdAudit: Readonly<{
    sweeps: number;
    finalMaximumOffDiagonal: number;
    convergenceTolerance: number;
    converged: boolean;
  }>;
  independentJacobiSvdAudit: Readonly<{
    sweeps: number;
    finalMaximumOffDiagonal: number;
    convergenceTolerance: number;
    converged: boolean;
  }>;
  independentAgreementPass: boolean;
  minimumSingularValueGate: number;
  minimumRelativeSingularValueGate: number;
  maximumConditionNumber2Gate: number;
  fullRankPass: boolean;
  fiftyPercentGuardPass: boolean;
}>;

export type PhaseB1QuiescentPressureReferenceNodeV1 = Readonly<{
  rho: number;
  sourceGraphCanonicalNode:
    PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  sourceGraphCanonicalNodeObjectIdentity: boolean;
  fullUnknowns: readonly number[];
  coldUnknowns: readonly number[];
  logReferenceMultipliers: LogVector;
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1;
  targetChamberPressurePa: PressureRecord;
  evaluation: PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1;
  fullResidual: readonly number[];
  scaledResidualInfinityNorm: number;
  fullJacobian: ScaledFivePointAlgorithmicJacobianV1;
  schurAudit: PhaseB1QuiescentPressureReferenceSchurAuditV1;
  maximumAbsoluteChamberTargetPressureDifferencePa: number;
  maximumAbsoluteInertialFlowAccelerationM3PerSec2: number;
  maximumAbsoluteFiberLogStrain: number;
  strictFiberLogStrainDomainPass: true;
  coldRestoringAudit: Readonly<{
    restoringNode: PhaseB1ColdEtaOneFixedVolumeNodeResultV1;
    sourceGraphNodeObjectReused: boolean;
    converged: boolean;
    coldUnknownsExact: boolean;
    minimumLandSimplexMargin: number | null;
    maximumLocalMaterialResidualInfinityNorm: number | null;
    effectiveTriSegAccepted: boolean;
    withinPublishedTaylorTwoPercentTensionErrorDomain: boolean;
    pass: boolean;
  }>;
  allFlowsExactlyZero: boolean;
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
}>;

export type PhaseB1QuiescentPressureReferenceTangentAuditV1 = Readonly<{
  scaledResidualDerivativeByRho: readonly number[];
  scaledUnknownTangentByRho: readonly number[];
  linearSolveDiagnostics: ScaledDenseLuDiagnosticsV1;
  linearResidualInfinityNorm: number;
  pass: boolean;
}>;

export type PhaseB1QuiescentPressureReferenceEdgeV1 = Readonly<{
  edgeIndex: number;
  fromRho: number;
  toRho: number;
  tangentAudit: PhaseB1QuiescentPressureReferenceTangentAuditV1;
  predictorUnknowns: readonly number[];
  acceptedUnknowns: readonly number[];
  acceptedNodeStepScaledInfinityNorm: number;
  predictorCorrectionScaledInfinityNorm: number;
  correctorDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  correctorBoundary:
    typeof PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.correctorBoundary;
  acceptedNode: PhaseB1QuiescentPressureReferenceNodeV1;
  pass: boolean;
}>;

type ContinuationBoundary = Readonly<{
  slsMode: "on" | "off";
  direction: "forward" | "reverse";
  refinementFactor: RefinementFactor;
  requestedRhoValues: readonly number[];
  attemptedRhoValues: readonly number[];
  initialization:
    | "exact-graph-C-source-log-zero-independent"
    | "canonical-factor-eight-forward-endpoint";
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  regularizationApplied: false;
  priorApplied: false;
  projectionApplied: false;
  clippingApplied: false;
  rootRankingApplied: false;
}>;

export type PhaseB1QuiescentPressureReferenceContinuationSuccessV1 =
  ContinuationBoundary & Readonly<{
    completed: true;
    nodes: readonly PhaseB1QuiescentPressureReferenceNodeV1[];
    edges: readonly PhaseB1QuiescentPressureReferenceEdgeV1[];
    endpoint: PhaseB1QuiescentPressureReferenceNodeV1;
    maximumAcceptedNodeStepScaledInfinityNorm: number;
    maximumPredictorCorrectionScaledInfinityNorm: number;
    maximumAbsoluteFiberLogStrain: number;
    hardGatePass: boolean;
    fiftyPercentGuardPass: boolean;
  }>;

export type PhaseB1QuiescentPressureReferenceContinuationFailureV1 =
  ContinuationBoundary & Readonly<{
    completed: false;
    reason: "injected-structured-failure" | "tangent-failed" | "corrector-failed";
    message: string;
    failedAttemptIndex: number;
    nodes: readonly PhaseB1QuiescentPressureReferenceNodeV1[];
    edges: readonly PhaseB1QuiescentPressureReferenceEdgeV1[];
    rollbackNode: PhaseB1QuiescentPressureReferenceNodeV1;
    rollbackUnknowns: readonly number[];
    hardGatePass: false;
    fiftyPercentGuardPass: false;
  }>;

export type PhaseB1QuiescentPressureReferenceContinuationResultV1 =
  | PhaseB1QuiescentPressureReferenceContinuationSuccessV1
  | PhaseB1QuiescentPressureReferenceContinuationFailureV1;

export type PhaseB1QuiescentPressureReferenceFailureProbeV1 = Readonly<{
  injectedAttemptIndex: 0 | 1;
  result: PhaseB1QuiescentPressureReferenceContinuationFailureV1;
  rollbackNodeIsSourceObject: boolean;
  rollbackNodeIsAcceptedMidpointObject: boolean;
  rollbackUnknownsObjectIdentity: boolean;
  pass: boolean;
}>;

export type PhaseB1QuiescentPressureReferenceInverseResultV1 = Readonly<{
  inverseId: typeof PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID;
  slsMode: "on" | "off";
  sourceGraph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
  sourceCanonicalNode:
    PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  sourceCanonicalNodeObjectIdentity: true;
  anchorNewtonScaleRegistryContentSha256: string;
  anchorProvenance:
    PhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1["anchorProvenance"];
  commonVascularTargetPressurePa: number;
  sourceChamberPressurePa: PressureRecord;
  sourceIdentityAudit: Readonly<{
    logReferenceMultipliersExactZero: boolean;
    coldUnknownsObjectIdentity: boolean;
    residualExact: boolean;
    residualRoundoff: boolean;
    chamberPressuresExact: boolean;
    fixedBloodVolumesExact: boolean;
    fixedInertialFlowsExact: boolean;
    fixedCalciumExact: boolean;
    pass: boolean;
  }>;
  correctorBoundary:
    typeof PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.correctorBoundary;
  sourceSchurAudit: PhaseB1QuiescentPressureReferenceSchurAuditV1;
  attempts: readonly [
    PhaseB1QuiescentPressureReferenceContinuationResultV1,
    PhaseB1QuiescentPressureReferenceContinuationResultV1,
    PhaseB1QuiescentPressureReferenceContinuationResultV1,
  ];
  selectedAttemptIndex: number | null;
  selectedRefinementFactor: RefinementFactor | null;
  endpoint: PhaseB1QuiescentPressureReferenceNodeV1 | null;
  maximumForwardEndpointAgreementScaledInfinityNorm: number | null;
  forwardEndpointAgreementPass: boolean;
  factorEightReverse:
    PhaseB1QuiescentPressureReferenceContinuationResultV1 | null;
  factorEightReverseClosureScaledInfinityNorm: number | null;
  factorEightReverseClosurePass: boolean;
  failureProbes: readonly [
    PhaseB1QuiescentPressureReferenceFailureProbeV1,
    PhaseB1QuiescentPressureReferenceFailureProbeV1,
  ];
  allAttemptsStartFromExactSourceIndependently: boolean;
  firstHardAndFiftyPercentGuardSelectionPass: boolean;
  projectSyntheticQuiescentReferenceInversePass: boolean;
  instantaneousHydraulicQuiescencePass: boolean;
  eventFreeBackwardEulerIdentityHoldPass: false;
  closedLoopStationarityPass: false;
  biologicalPathClaimed: false;
  physiologicalReferenceAcceptancePass: false;
  supportedReferenceEnvelopePass: false;
  fullBeatAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  pureCoreParentEvidenceAuthenticationClaimed: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

export function assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
  value: unknown,
): asserts value is PhaseB1QuiescentPressureReferenceInverseResultV1 {
  if (
    value === null
    || typeof value !== "object"
    || !phaseB1QuiescentPressureReferenceInverseResultRegistryV1.has(value)
  ) throw new Error(
    "quiescent pressure-reference inverse must be the live passing result "
      + "produced by runPhaseB1QuiescentPressureReferenceInverseV1",
  );
}

type InverseContext = Readonly<{
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
  center: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  session: PhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1;
  sourcePressure: PressureRecord;
  commonTargetPressurePa: number;
  coldDimension: number;
  fullDimension: number;
  unknownScales: readonly number[];
  residualScales: readonly number[];
  lowerBounds: readonly (number | null)[];
  affineConstraints: readonly StrictAffineConstraintV1[];
}>;

export function runPhaseB1QuiescentPressureReferenceInverseV1(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentPressureReferenceInverseResultV1 {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(graph);
  assertGraphInput(graph);
  if (typeof sha256Hex !== "function") {
    throw new Error("quiescent reference inverse requires a sha256 provider");
  }
  const centerMatches = graph.canonicalNodes.filter((audit) =>
    audit.nodeId === "C");
  if (centerMatches.length !== 1) {
    throw new Error("finite-volume graph must contain exactly one canonical C node");
  }
  const center = centerMatches[0].node;
  const session = createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1(
    graph.slsMode,
    sha256Hex,
  );
  const anchorEvaluation = session.evaluateColdResidualAtReferenceConfiguration({
    referenceConfiguration: session.anchorReferenceConfiguration,
    unknowns: center.unknowns,
  });
  const sourcePressure = chamberPressureRecord(anchorEvaluation);
  const vascularPressures = VASCULAR_TARGET_ORDER.map((vascularId) =>
    anchorEvaluation.closedLoop.vascular[vascularId].absolutePressurePa);
  if (
    vascularPressures.some((pressure) => !Number.isFinite(pressure) || pressure <= 0)
    || !vascularPressures.every((pressure) =>
      Object.is(pressure, vascularPressures[0]))
  ) throw new Error(
    "source SA/SV/PA/PV vascular pressures must be one exact positive common target",
  );
  const commonTargetPressurePa = vascularPressures[0];
  const coldDimension = session.layout.unknownCount;
  const fullDimension = coldDimension + LOG_UNKNOWN_LABELS.length;
  const unknownScales = Object.freeze([
    ...session.layout.unknownScales,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.logUnknownScale,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.logUnknownScale,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.logUnknownScale,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.logUnknownScale,
  ]);
  const residualScales = Object.freeze([
    ...session.layout.residualScales,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .pressureResidualScalePa,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .pressureResidualScalePa,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .pressureResidualScalePa,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .pressureResidualScalePa,
  ]);
  const lowerBounds = Object.freeze([
    ...session.layout.strictLowerBounds,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .logBounds.LAReferenceCavity.lower,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .logBounds.RAReferenceCavity.lower,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .logBounds.freewallEven.lower,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .logBounds.freewallOdd.lower,
  ]);
  const affineConstraints = extendAffineConstraints(
    session.layout.strictAffineConstraints,
    coldDimension,
    fullDimension,
  );
  const context: InverseContext = Object.freeze({
    graph,
    center,
    session,
    sourcePressure,
    commonTargetPressurePa,
    coldDimension,
    fullDimension,
    unknownScales,
    residualScales,
    lowerBounds,
    affineConstraints,
  });
  const sourceFullUnknowns = Object.freeze([...center.unknowns, 0, 0, 0, 0]);
  const sourceNode = buildInverseNode(
    context,
    0,
    sourceFullUnknowns,
    center.unknowns,
  );
  const sourceIdentityAudit = buildSourceIdentityAudit(
    context,
    sourceNode,
    anchorEvaluation,
  );
  if (!sourceIdentityAudit.pass || !sourceNode.schurAudit.fullRankPass) {
    throw new Error(
      "quiescent reference inverse source identity or 4x4 Schur rank gate failed",
    );
  }
  const attempts = Object.freeze(REFINEMENT_FACTORS.map((factor) =>
    runContinuation(
      context,
      factor,
      "forward",
      sourceNode,
      null,
    ))) as readonly [
      PhaseB1QuiescentPressureReferenceContinuationResultV1,
      PhaseB1QuiescentPressureReferenceContinuationResultV1,
      PhaseB1QuiescentPressureReferenceContinuationResultV1,
    ];
  const selectedAttemptIndex = attempts.findIndex((attempt) =>
    attempt.completed
    && attempt.hardGatePass
    && attempt.fiftyPercentGuardPass);
  const closedSelectedAttemptIndex = selectedAttemptIndex < 0
    ? null
    : selectedAttemptIndex;
  const selectedAttempt = closedSelectedAttemptIndex === null
    ? null
    : attempts[closedSelectedAttemptIndex];
  const endpoint = selectedAttempt?.completed === true
    ? selectedAttempt.endpoint
    : null;
  const successfulForwardAttempts = attempts.filter((attempt) =>
    attempt.completed === true);
  const maximumForwardEndpointAgreementScaledInfinityNorm =
    successfulForwardAttempts.length === attempts.length
      ? maximumPairwiseScaledInfinityDistance(
        successfulForwardAttempts.map((attempt) => attempt.endpoint.fullUnknowns),
        context.unknownScales,
      )
      : null;
  const forwardEndpointAgreementPass =
    maximumForwardEndpointAgreementScaledInfinityNorm !== null
    && maximumForwardEndpointAgreementScaledInfinityNorm
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumForwardEndpointAgreementScaledInfinityNorm;
  const factorEightForward = attempts[2];
  const factorEightReverse = factorEightForward.completed
    ? runContinuation(
      context,
      8,
      "reverse",
      factorEightForward.endpoint,
      null,
    )
    : null;
  const factorEightReverseClosureScaledInfinityNorm =
    factorEightReverse?.completed === true
      ? scaledInfinityDistance(
        factorEightReverse.endpoint.fullUnknowns,
        sourceNode.fullUnknowns,
        context.unknownScales,
      )
      : null;
  const factorEightReverseClosurePass =
    factorEightReverseClosureScaledInfinityNorm !== null
    && factorEightReverseClosureScaledInfinityNorm
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumFactorEightReverseClosureScaledInfinityNorm;
  const failureProbes = Object.freeze(([0, 1] as const).map((index) =>
    buildFailureProbe(context, sourceNode, index))) as readonly [
      PhaseB1QuiescentPressureReferenceFailureProbeV1,
      PhaseB1QuiescentPressureReferenceFailureProbeV1,
    ];
  const allAttemptsStartFromExactSourceIndependently = attempts.every(
    (attempt) =>
      attempt.nodes.length > 0
      && Object.is(attempt.nodes[0], sourceNode)
      && Object.is(attempt.nodes[0].coldUnknowns, center.unknowns)
      && exactNumberArray(
        attempt.nodes[0].logReferenceMultipliers,
        [0, 0, 0, 0],
      )
      && attempt.initialization
        === "exact-graph-C-source-log-zero-independent",
  );
  const firstHardAndFiftyPercentGuardSelectionPass =
    closedSelectedAttemptIndex !== null
    && attempts.slice(0, closedSelectedAttemptIndex).every((attempt) =>
      !attempt.completed
      || !attempt.hardGatePass
      || !attempt.fiftyPercentGuardPass)
    && selectedAttempt?.completed === true
    && selectedAttempt.hardGatePass
    && selectedAttempt.fiftyPercentGuardPass;
  const instantaneousHydraulicQuiescencePass = endpoint !== null
    && Object.is(endpoint.rho, 1)
    && endpoint.allFlowsExactlyZero
    && endpoint.maximumAbsoluteChamberTargetPressureDifferencePa
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumAbsoluteDestinationPressureDifferencePa
    && endpoint.maximumAbsoluteInertialFlowAccelerationM3PerSec2
      <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumAbsoluteDestinationFlowAccelerationM3PerSec2;
  const projectSyntheticQuiescentReferenceInversePass =
    graph.phaseB1LandCoupledFiniteVolumeGraphPass
    && sourceIdentityAudit.pass
    && sourceNode.schurAudit.fullRankPass
    && attempts.length === 3
    && attempts.every((attempt) => attempt.completed)
    && forwardEndpointAgreementPass
    && allAttemptsStartFromExactSourceIndependently
    && firstHardAndFiftyPercentGuardSelectionPass
    && instantaneousHydraulicQuiescencePass
    && endpoint !== null
    && endpoint.hardGatePass
    && factorEightReverse?.completed === true
    && factorEightReverse.hardGatePass
    && factorEightReverse.fiftyPercentGuardPass
    && factorEightReverseClosurePass
    && failureProbes.every((probe) => probe.pass);
  const result: PhaseB1QuiescentPressureReferenceInverseResultV1 = deepFreeze({
    inverseId: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
    slsMode: graph.slsMode,
    sourceGraph: graph,
    sourceCanonicalNode: center,
    sourceCanonicalNodeObjectIdentity: true as const,
    anchorNewtonScaleRegistryContentSha256:
      session.anchorNewtonScaleRegistryContentSha256,
    anchorProvenance: session.anchorProvenance,
    commonVascularTargetPressurePa: commonTargetPressurePa,
    sourceChamberPressurePa: sourcePressure,
    sourceIdentityAudit,
    correctorBoundary:
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.correctorBoundary,
    sourceSchurAudit: sourceNode.schurAudit,
    attempts,
    selectedAttemptIndex: closedSelectedAttemptIndex,
    selectedRefinementFactor: selectedAttempt?.refinementFactor ?? null,
    endpoint,
    maximumForwardEndpointAgreementScaledInfinityNorm,
    forwardEndpointAgreementPass,
    factorEightReverse,
    factorEightReverseClosureScaledInfinityNorm,
    factorEightReverseClosurePass,
    failureProbes,
    allAttemptsStartFromExactSourceIndependently,
    firstHardAndFiftyPercentGuardSelectionPass,
    projectSyntheticQuiescentReferenceInversePass,
    instantaneousHydraulicQuiescencePass,
    eventFreeBackwardEulerIdentityHoldPass: false as const,
    closedLoopStationarityPass: false as const,
    biologicalPathClaimed: false as const,
    physiologicalReferenceAcceptancePass: false as const,
    supportedReferenceEnvelopePass: false as const,
    fullBeatAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    pureCoreParentEvidenceAuthenticationClaimed: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
  });
  if (result.projectSyntheticQuiescentReferenceInversePass) {
    phaseB1QuiescentPressureReferenceInverseResultRegistryV1.add(result);
  }
  return result;
}

type AugmentedEvaluation = Readonly<{
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1;
  targetChamberPressurePa: PressureRecord;
  evaluation: PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1;
  residual: readonly number[];
}>;

const GRAPH_INPUT_KEYS = Object.freeze([
  "graphId",
  "slsMode",
  "componentIds",
  "centerReplayAudit",
  "canonicalNodes",
  "directedEdges",
  "roundTripAudits",
  "rootCensus",
  "maximumDestinationAgreementScaledInfinityNorm",
  "maximumRoundTripClosureScaledInfinityNorm",
  "allCanonicalNodesFiftyPercentGuardPass",
  "routeScope",
  "phaseB1LandCoupledFiniteVolumeGraphPass",
  "phaseB1LandCoupledVolumeEnvelopePass",
  "continuousVolumeIntervalRegularityPass",
  "globalRootUniquenessPass",
  "globalRootExhaustivenessPass",
  "energeticStabilityPass",
  "physiologicalInitializationPass",
  "closedLoopStationarityPass",
  "acceptedPhaseB1ReferenceBranchPass",
  "fullBeatAcceptancePass",
  "physiologicalValidationPass",
  "phaseB1AcceptancePass",
  "supportedEnvelopePass",
  "releaseRuntimePass",
  "parentStitchObjectConsumed",
  "pureCoreParentEvidenceAuthenticationClaimed",
  "testOnly",
  "modelCoreIntegration",
  "browserRuntimeAdopted",
  "releaseRuntimeReachable",
] as const);

function assertGraphInput(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
): void {
  assertExactPlainRecord(graph, GRAPH_INPUT_KEYS, "finite-volume graph input");
  assertRecursivelyFrozenAndClosed(
    graph,
    "finite-volume graph input",
    new WeakSet<object>(),
  );
  if (
    graph.graphId !== "phase-b1-eta-one-land-coupled-finite-volume-graph-v1"
    || (graph.slsMode !== "on" && graph.slsMode !== "off")
    || graph.phaseB1LandCoupledFiniteVolumeGraphPass !== true
    || graph.parentStitchObjectConsumed !== true
    || graph.testOnly !== true
  ) throw new Error(
    "quiescent reference inverse requires a passing project-synthetic finite-volume graph",
  );
  const prohibitedClaims = [
    graph.phaseB1LandCoupledVolumeEnvelopePass,
    graph.continuousVolumeIntervalRegularityPass,
    graph.globalRootUniquenessPass,
    graph.globalRootExhaustivenessPass,
    graph.energeticStabilityPass,
    graph.physiologicalInitializationPass,
    graph.closedLoopStationarityPass,
    graph.acceptedPhaseB1ReferenceBranchPass,
    graph.fullBeatAcceptancePass,
    graph.physiologicalValidationPass,
    graph.phaseB1AcceptancePass,
    graph.supportedEnvelopePass,
    graph.releaseRuntimePass,
    graph.pureCoreParentEvidenceAuthenticationClaimed,
    graph.modelCoreIntegration,
    graph.browserRuntimeAdopted,
    graph.releaseRuntimeReachable,
  ];
  if (prohibitedClaims.some((value) => value !== false)) {
    throw new Error(
      "finite-volume graph input exceeds the inverse claim boundary",
    );
  }
}

function chamberPressureRecord(
  evaluation: PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1,
): PressureRecord {
  const pressure = evaluation.closedLoop.chamberAbsolutePressurePa;
  return Object.freeze({
    // Corrector trials may cross a finite negative absolute pressure before
    // Armijo damping returns to the declared positive geometric target. Only
    // accepted nodes are gated against that positive target.
    LA: requireFinite(pressure.LA, "chamber pressure LA"),
    LV: requireFinite(pressure.LV, "chamber pressure LV"),
    RA: requireFinite(pressure.RA, "chamber pressure RA"),
    RV: requireFinite(pressure.RV, "chamber pressure RV"),
  });
}

function extendAffineConstraints(
  coldConstraints: readonly StrictAffineConstraintV1[],
  coldDimension: number,
  fullDimension: number,
): readonly StrictAffineConstraintV1[] {
  if (fullDimension !== coldDimension + 4) {
    throw new Error("quiescent reference inverse dimension drifted");
  }
  const padded = coldConstraints.map((constraint) => Object.freeze({
    constraintId: constraint.constraintId,
    coefficients: Object.freeze([
      ...constraint.coefficients,
      0,
      0,
      0,
      0,
    ]),
    lowerBound: constraint.lowerBound,
  }));
  const bounds = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .logBounds;
  const constraint = (
    constraintId: string,
    logCoefficients: LogVector,
    lowerBound: number,
  ): StrictAffineConstraintV1 => Object.freeze({
    constraintId,
    coefficients: Object.freeze([
      ...Array<number>(coldDimension).fill(0),
      ...logCoefficients,
    ]),
    lowerBound,
  });
  const individualUpperBounds = [
    bounds.LAReferenceCavity.upper,
    bounds.RAReferenceCavity.upper,
    bounds.freewallEven.upper,
    bounds.freewallOdd.upper,
  ] as const;
  const upperConstraints = LOG_UNKNOWN_LABELS.map((label, index) => {
    const coefficients = [0, 0, 0, 0] as number[];
    coefficients[index] = -1;
    return constraint(
      `quiescent-reference-${label}-upper`,
      coefficients as unknown as LogVector,
      -individualUpperBounds[index],
    );
  });
  const areaCombinationConstraints = [
    constraint(
      "quiescent-reference-LVFW-log-lower",
      [0, 0, 1, 1],
      bounds.LVFWActual.lower,
    ),
    constraint(
      "quiescent-reference-LVFW-log-upper",
      [0, 0, -1, -1],
      -bounds.LVFWActual.upper,
    ),
    constraint(
      "quiescent-reference-RVFW-log-lower",
      [0, 0, 1, -1],
      bounds.RVFWActual.lower,
    ),
    constraint(
      "quiescent-reference-RVFW-log-upper",
      [0, 0, -1, 1],
      -bounds.RVFWActual.upper,
    ),
  ];
  return Object.freeze([
    ...padded,
    ...upperConstraints,
    ...areaCombinationConstraints,
  ]);
}

function targetPressureAtRho(
  context: InverseContext,
  rho: number,
): PressureRecord {
  requireUnitInterval(rho, "rho");
  if (Object.is(rho, 0)) return context.sourcePressure;
  if (Object.is(rho, 1)) return Object.freeze({
    LA: context.commonTargetPressurePa,
    LV: context.commonTargetPressurePa,
    RA: context.commonTargetPressurePa,
    RV: context.commonTargetPressurePa,
  });
  return Object.freeze(Object.fromEntries(PRESSURE_ORDER.map((chamberId) => {
    const source = context.sourcePressure[chamberId];
    const target = Math.exp(
      (1 - rho) * Math.log(source)
      + rho * Math.log(context.commonTargetPressurePa),
    );
    return [chamberId, requirePositiveFinite(
      target,
      `target chamber pressure ${chamberId}`,
    )];
  }))) as PressureRecord;
}

function targetPressureDerivativeByRho(
  context: InverseContext,
  rho: number,
): PressureRecord {
  const target = targetPressureAtRho(context, rho);
  return Object.freeze(Object.fromEntries(PRESSURE_ORDER.map((chamberId) => [
    chamberId,
    requireFinite(
      target[chamberId] * (
        Math.log(context.commonTargetPressurePa)
        - Math.log(context.sourcePressure[chamberId])
      ),
      `target chamber pressure derivative ${chamberId}`,
    ),
  ]))) as PressureRecord;
}

function referenceConfigurationFromLogs(
  context: InverseContext,
  logs: LogVector,
): PhaseB1ColdEtaOneReferenceConfigurationV1 {
  const anchor = context.session.anchorReferenceConfiguration;
  const [logLA, logRA, even, odd] = logs;
  return Object.freeze({
    atrialReferenceCavityVolumeM3ByChamber: Object.freeze({
      LA: anchor.atrialReferenceCavityVolumeM3ByChamber.LA * Math.exp(logLA),
      RA: anchor.atrialReferenceCavityVolumeM3ByChamber.RA * Math.exp(logRA),
    }),
    triSegReferenceMidwallAreaM2ByWall: Object.freeze({
      LVFW: anchor.triSegReferenceMidwallAreaM2ByWall.LVFW
        * Math.exp(even + odd),
      SEP: anchor.triSegReferenceMidwallAreaM2ByWall.SEP,
      RVFW: anchor.triSegReferenceMidwallAreaM2ByWall.RVFW
        * Math.exp(even - odd),
    }),
  });
}

function evaluateAugmentedResidual(
  context: InverseContext,
  rho: number,
  fullUnknowns: readonly number[],
): AugmentedEvaluation {
  assertFiniteVector(fullUnknowns, context.fullDimension, "fullUnknowns");
  const coldUnknowns = fullUnknowns.slice(0, context.coldDimension);
  const logs = Object.freeze(fullUnknowns.slice(
    context.coldDimension,
  )) as LogVector;
  const referenceConfiguration = referenceConfigurationFromLogs(context, logs);
  const evaluation = context.session
    .evaluateColdResidualAtReferenceConfiguration({
      referenceConfiguration,
      unknowns: coldUnknowns,
    });
  const maximumAbsoluteFiberLogStrain = maximumFiberLogStrain(evaluation);
  if (
    !(maximumAbsoluteFiberLogStrain
      < PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .strictMaximumAbsoluteFiberLogStrain)
  ) throw new Error(
    "reference inverse evaluation left the strict |fiberLogStrain| < 0.5 domain",
  );
  if (evaluation.residual.length !== context.coldDimension) {
    throw new Error("reference-configured cold residual dimension drifted");
  }
  const targetChamberPressurePa = targetPressureAtRho(context, rho);
  const chamberPressure = chamberPressureRecord(evaluation);
  const residual = Object.freeze([
    ...evaluation.residual,
    ...PRESSURE_ORDER.map((chamberId) => requireFinite(
      chamberPressure[chamberId] - targetChamberPressurePa[chamberId],
      `pressure residual ${chamberId}`,
    )),
  ]);
  return Object.freeze({
    referenceConfiguration,
    targetChamberPressurePa,
    evaluation,
    residual,
  });
}

function buildFullJacobian(
  context: InverseContext,
  rho: number,
  fullUnknowns: readonly number[],
  scaledStep = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .fullJacobianScaledStep,
): ScaledFivePointAlgorithmicJacobianV1 {
  return evaluateScaledFivePointAlgorithmicJacobianV1(
    (trialUnknowns) => evaluateAugmentedResidual(
      context,
      rho,
      trialUnknowns,
    ).residual,
    fullUnknowns,
    {
      unknownScales: context.unknownScales,
      residualScales: context.residualScales,
      lowerBounds: context.lowerBounds,
      strictAffineConstraints: context.affineConstraints,
      scaledStep,
    },
  );
}

function buildSchurAudit(
  context: InverseContext,
  fullJacobian: ScaledFivePointAlgorithmicJacobianV1,
  independentFullJacobian: ScaledFivePointAlgorithmicJacobianV1,
): PhaseB1QuiescentPressureReferenceSchurAuditV1 {
  const primary = computeSchurCore(context, fullJacobian);
  const independent = computeSchurCore(context, independentFullJacobian);
  const policy = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1;
  const maximumIndependentScaledSchurAbsoluteDifference = maximum(
    primary.scaledSchur.flatMap((row, rowIndex) => row.map(
      (value, columnIndex) => Math.abs(
        value - independent.scaledSchur[rowIndex][columnIndex],
      ),
    )),
  );
  const primaryScaledStepByColumn = fullJacobian.scaledStepByColumn;
  const independentScaledStepByColumn =
    independentFullJacobian.scaledStepByColumn;
  const primaryStencilByColumn = fullJacobian.stencilByColumn;
  const independentStencilByColumn = independentFullJacobian.stencilByColumn;
  const completeColumnIndices = Array.from(
    { length: context.fullDimension },
    (_, column) => column,
  );
  const effectiveJacobianStencilGatePass =
    primaryScaledStepByColumn.length === context.fullDimension
    && independentScaledStepByColumn.length === context.fullDimension
    && primaryStencilByColumn.length === context.fullDimension
    && independentStencilByColumn.length === context.fullDimension
    && [
      primaryScaledStepByColumn,
      independentScaledStepByColumn,
      primaryStencilByColumn,
      independentStencilByColumn,
    ].every((inventory) => completeColumnIndices.every((column) =>
      Object.hasOwn(inventory, column)))
    && primaryScaledStepByColumn.every((step) =>
      step > 0
      && step <= policy.fullJacobianScaledStep)
    && independentScaledStepByColumn.every((step) =>
      step > 0
      && step <= policy.independentSchurJacobianScaledStep)
    && primaryStencilByColumn.every((stencil) =>
      (
        stencil === "centered-five-point"
        || stencil === "forward-five-point"
        || stencil === "backward-five-point"
      ))
    && independentStencilByColumn.every((stencil) =>
      (
        stencil === "centered-five-point"
        || stencil === "forward-five-point"
        || stencil === "backward-five-point"
      ))
    && primaryScaledStepByColumn.every((step, column) =>
      !Object.is(step, independentScaledStepByColumn[column])
      && independentScaledStepByColumn[column] > step);
  const minimumColdBlockRelativePivot = Math.min(
    ...primary.coldBlockLuDiagnosticsByLog.map((audit) =>
      audit.relativeMinimumPivot),
  );
  const independentMinimumColdBlockRelativePivot = Math.min(
    ...independent.coldBlockLuDiagnosticsByLog.map((audit) =>
      audit.relativeMinimumPivot),
  );
  const independentAgreementPass =
    fullJacobian.scaledStep !== independentFullJacobian.scaledStep
    && maximumIndependentScaledSchurAbsoluteDifference
      <= policy.maximumIndependentScaledSchurAbsoluteDifference
    && effectiveJacobianStencilGatePass
    && primary.svd.converged
    && independent.svd.converged;
  const fullRankPass = primary.rank === 4
    && independent.rank === 4
    && minimumColdBlockRelativePivot
      >= policy.gates.minimumColdBlockRelativePivot
    && independentMinimumColdBlockRelativePivot
      >= policy.gates.minimumColdBlockRelativePivot
    && primary.sigmaMinimum >= policy.gates.minimumSchurSingularValue
    && independent.sigmaMinimum >= policy.gates.minimumSchurSingularValue
    && primary.relativeMinimumSingularValue
      >= policy.gates.minimumRelativeSchurSingularValue
    && independent.relativeMinimumSingularValue
      >= policy.gates.minimumRelativeSchurSingularValue
    && primary.conditionNumber2 <= policy.gates.maximumSchurConditionNumber2
    && independent.conditionNumber2
      <= policy.gates.maximumSchurConditionNumber2
    && independentAgreementPass;
  const fiftyPercentGuardPass = fullRankPass
    && minimumColdBlockRelativePivot
      >= policy.fiftyPercentGuard.minimumColdBlockRelativePivot
    && independentMinimumColdBlockRelativePivot
      >= policy.fiftyPercentGuard.minimumColdBlockRelativePivot
    && primary.sigmaMinimum
      >= policy.fiftyPercentGuard.minimumSchurSingularValue
    && independent.sigmaMinimum
      >= policy.fiftyPercentGuard.minimumSchurSingularValue
    && primary.relativeMinimumSingularValue
      >= policy.fiftyPercentGuard.minimumRelativeSchurSingularValue
    && independent.relativeMinimumSingularValue
      >= policy.fiftyPercentGuard.minimumRelativeSchurSingularValue
    && primary.conditionNumber2
      <= policy.fiftyPercentGuard.maximumSchurConditionNumber2
    && independent.conditionNumber2
      <= policy.fiftyPercentGuard.maximumSchurConditionNumber2;
  return Object.freeze({
    pressureRows: PRESSURE_ORDER,
    logColumns: LOG_UNKNOWN_LABELS,
    coldBlockDimension: context.coldDimension,
    rawPressurePerLogSchurPa: primary.rawPressurePerLogSchurPa,
    scaledSchur: primary.scaledSchur,
    independentScaledStep: independentFullJacobian.scaledStep,
    primaryScaledStepByColumn,
    independentScaledStepByColumn,
    primaryStencilByColumn,
    independentStencilByColumn,
    effectiveJacobianStencilGatePass,
    independentScaledSchur: independent.scaledSchur,
    singularValuesDescending: primary.svd.singularValuesDescending,
    independentSingularValuesDescending:
      independent.svd.singularValuesDescending,
    rank: primary.rank,
    independentRank: independent.rank,
    relativeMinimumSingularValue: primary.relativeMinimumSingularValue,
    independentRelativeMinimumSingularValue:
      independent.relativeMinimumSingularValue,
    conditionNumber2: primary.conditionNumber2,
    independentConditionNumber2: independent.conditionNumber2,
    maximumIndependentScaledSchurAbsoluteDifference,
    maximumIndependentScaledSchurAbsoluteDifferenceGate:
      policy.maximumIndependentScaledSchurAbsoluteDifference,
    coldBlockLuDiagnosticsByLog: primary.coldBlockLuDiagnosticsByLog,
    independentColdBlockLuDiagnosticsByLog:
      independent.coldBlockLuDiagnosticsByLog,
    minimumColdBlockRelativePivot,
    independentMinimumColdBlockRelativePivot,
    minimumColdBlockRelativePivotGate:
      policy.gates.minimumColdBlockRelativePivot,
    jacobiSvdAudit: Object.freeze({
      sweeps: primary.svd.sweeps,
      finalMaximumOffDiagonal: primary.svd.finalMaximumOffDiagonal,
      convergenceTolerance: primary.svd.convergenceTolerance,
      converged: primary.svd.converged,
    }),
    independentJacobiSvdAudit: Object.freeze({
      sweeps: independent.svd.sweeps,
      finalMaximumOffDiagonal: independent.svd.finalMaximumOffDiagonal,
      convergenceTolerance: independent.svd.convergenceTolerance,
      converged: independent.svd.converged,
    }),
    independentAgreementPass,
    minimumSingularValueGate: policy.gates.minimumSchurSingularValue,
    minimumRelativeSingularValueGate:
      policy.gates.minimumRelativeSchurSingularValue,
    maximumConditionNumber2Gate:
      policy.gates.maximumSchurConditionNumber2,
    fullRankPass,
    fiftyPercentGuardPass,
  });
}

function computeSchurCore(
  context: InverseContext,
  fullJacobian: ScaledFivePointAlgorithmicJacobianV1,
) {
  const n = context.coldDimension;
  const scaled = fullJacobian.scaledJacobian;
  if (
    scaled.length !== context.fullDimension
    || scaled.some((row) => row.length !== context.fullDimension)
  ) throw new Error("full scaled Jacobian dimension drifted");
  const coldBlockRowMajor = Array.from(
    { length: n },
    (_, row) => scaled[row].slice(0, n),
  ).flat();
  const eliminatedColdByLog: number[][] = [];
  const coldBlockLuDiagnosticsByLog: ScaledDenseLuDiagnosticsV1[] = [];
  for (let logColumn = 0; logColumn < 4; logColumn += 1) {
    const solve = solveScaledDensePartialPivotLuV1(
      coldBlockRowMajor,
      Array.from({ length: n }, (_, row) => scaled[row][n + logColumn]),
    );
    if (solve.success === false) {
      throw new Error(`cold-block Schur elimination failed: ${solve.message}`);
    }
    eliminatedColdByLog.push([...solve.solution]);
    coldBlockLuDiagnosticsByLog.push(solve.diagnostics);
  }
  const scaledSchur = Array.from({ length: 4 }, (_, pressureRow) =>
    Array.from({ length: 4 }, (_, logColumn) => {
      const fullRow = n + pressureRow;
      let value = scaled[fullRow][n + logColumn];
      for (let coldColumn = 0; coldColumn < n; coldColumn += 1) {
        value -= scaled[fullRow][coldColumn]
          * eliminatedColdByLog[logColumn][coldColumn];
      }
      return requireFinite(
        value,
        `scaled pressure-reference Schur[${pressureRow}][${logColumn}]`,
      );
    }));
  const rawPressurePerLogSchurPa = scaledSchur.map((row, pressureRow) =>
    row.map((value, logColumn) => requireFinite(
      value * context.residualScales[n + pressureRow]
        / context.unknownScales[n + logColumn],
      `raw pressure/log Schur[${pressureRow}][${logColumn}]`,
    )));
  const svd = singularValues4x4(scaledSchur);
  const sigmaMaximum = svd.singularValuesDescending[0];
  const sigmaMinimum = svd.singularValuesDescending[3];
  const numericalRankTolerance = sigmaMaximum * 4 * 64 * Number.EPSILON;
  const rank = svd.singularValuesDescending.filter((value) =>
    value > numericalRankTolerance).length;
  return Object.freeze({
    rawPressurePerLogSchurPa: freezeMatrix(rawPressurePerLogSchurPa),
    scaledSchur: freezeMatrix(scaledSchur),
    coldBlockLuDiagnosticsByLog:
      Object.freeze(coldBlockLuDiagnosticsByLog),
    svd,
    sigmaMinimum,
    rank,
    relativeMinimumSingularValue: sigmaMaximum > 0
      ? sigmaMinimum / sigmaMaximum
      : 0,
    conditionNumber2: sigmaMinimum > 0
      ? sigmaMaximum / sigmaMinimum
      : Number.POSITIVE_INFINITY,
  });
}

function buildInverseNode(
  context: InverseContext,
  rho: number,
  inputFullUnknowns: readonly number[],
  sourceColdUnknowns: readonly number[] | null = null,
): PhaseB1QuiescentPressureReferenceNodeV1 {
  requireUnitInterval(rho, "node rho");
  assertFiniteVector(
    inputFullUnknowns,
    context.fullDimension,
    "inverse node fullUnknowns",
  );
  const fullUnknowns = Object.isFrozen(inputFullUnknowns)
    ? inputFullUnknowns
    : Object.freeze([...inputFullUnknowns]);
  const coldPrefix = fullUnknowns.slice(0, context.coldDimension);
  if (
    sourceColdUnknowns !== null
    && !exactNumberArray(coldPrefix, sourceColdUnknowns)
  ) throw new Error("source cold unknown prefix drifted from graph C");
  const coldUnknowns = sourceColdUnknowns === null
    ? Object.freeze(coldPrefix)
    : sourceColdUnknowns;
  const logReferenceMultipliers = Object.freeze(fullUnknowns.slice(
    context.coldDimension,
  )) as LogVector;
  assertLogDomain(logReferenceMultipliers);
  const augmented = evaluateAugmentedResidual(context, rho, fullUnknowns);
  const coldRestoringAudit = buildColdRestoringAudit(
    context,
    augmented.referenceConfiguration,
    coldUnknowns,
    sourceColdUnknowns !== null,
  );
  const fullJacobian = buildFullJacobian(context, rho, fullUnknowns);
  const independentFullJacobian = buildFullJacobian(
    context,
    rho,
    fullUnknowns,
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .independentSchurJacobianScaledStep,
  );
  const schurAudit = buildSchurAudit(
    context,
    fullJacobian,
    independentFullJacobian,
  );
  const scaledResidualInfinityNorm = maximum(augmented.residual.map(
    (value, index) => Math.abs(value / context.residualScales[index]),
  ));
  const chamberPressure = chamberPressureRecord(augmented.evaluation);
  const maximumAbsoluteChamberTargetPressureDifferencePa = maximum(
    PRESSURE_ORDER.map((chamberId) => Math.abs(
      chamberPressure[chamberId]
      - augmented.targetChamberPressurePa[chamberId],
    )),
  );
  const maximumAbsoluteInertialFlowAccelerationM3PerSec2 = maximum(
    INERTIAL_FLOW_IDS.map((flowId) => Math.abs(
      augmented.evaluation.closedLoop.inertialMomentum[flowId]
        .flowAccelerationM3PerSec2,
    )),
  );
  const maximumAbsoluteFiberLogStrain = maximumFiberLogStrain(
    augmented.evaluation,
  );
  const allFlowsExactlyZero = [
    ...INERTIAL_FLOW_IDS,
    ...ALGEBRAIC_FLOW_IDS,
  ].every((flowId) =>
    augmented.evaluation.closedLoop.allFlowsM3PerSec[flowId] === 0);
  const policy = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1;
  const isCommonPressureDestination = Object.is(rho, 1);
  const prohibitedOperationsAbsent =
    !augmented.evaluation.projectionApplied
    && !augmented.evaluation.clippingApplied
    && !augmented.evaluation.closedLoop.projectionApplied
    && !augmented.evaluation.closedLoop.flowClampApplied
    && !augmented.evaluation.closedLoop.fallbackApplied;
  const hardGatePass = prohibitedOperationsAbsent
    && allFlowsExactlyZero
    && coldRestoringAudit.pass
    && maximumAbsoluteFiberLogStrain
      < policy.strictMaximumAbsoluteFiberLogStrain
    && scaledResidualInfinityNorm
      <= policy.gates.maximumScaledResidualInfinityNorm
    && schurAudit.fullRankPass
    && maximumAbsoluteChamberTargetPressureDifferencePa
      <= policy.gates.maximumAbsoluteDestinationPressureDifferencePa
    && (
      !isCommonPressureDestination
      || maximumAbsoluteInertialFlowAccelerationM3PerSec2
        <= policy.gates.maximumAbsoluteDestinationFlowAccelerationM3PerSec2
    );
  const fiftyPercentGuardPass = hardGatePass
    && schurAudit.fiftyPercentGuardPass
    && maximumAbsoluteFiberLogStrain
      <= policy.fiftyPercentGuard.maximumAbsoluteFiberLogStrain
    && scaledResidualInfinityNorm
      <= policy.fiftyPercentGuard.maximumScaledResidualInfinityNorm
    && maximumAbsoluteChamberTargetPressureDifferencePa
      <= policy.fiftyPercentGuard
        .maximumAbsoluteDestinationPressureDifferencePa
    && (
      !isCommonPressureDestination
      || maximumAbsoluteInertialFlowAccelerationM3PerSec2
        <= policy.fiftyPercentGuard
          .maximumAbsoluteDestinationFlowAccelerationM3PerSec2
    );
  return Object.freeze({
    rho,
    sourceGraphCanonicalNode: context.center,
    sourceGraphCanonicalNodeObjectIdentity: Object.is(
      context.center,
      context.graph.canonicalNodes.find((audit) => audit.nodeId === "C")?.node,
    ),
    fullUnknowns,
    coldUnknowns,
    logReferenceMultipliers,
    referenceConfiguration: augmented.referenceConfiguration,
    targetChamberPressurePa: augmented.targetChamberPressurePa,
    evaluation: augmented.evaluation,
    fullResidual: augmented.residual,
    scaledResidualInfinityNorm,
    fullJacobian,
    schurAudit,
    maximumAbsoluteChamberTargetPressureDifferencePa,
    maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    maximumAbsoluteFiberLogStrain,
    strictFiberLogStrainDomainPass: true as const,
    coldRestoringAudit,
    allFlowsExactlyZero,
    hardGatePass,
    fiftyPercentGuardPass,
  });
}

function buildSourceIdentityAudit(
  context: InverseContext,
  sourceNode: PhaseB1QuiescentPressureReferenceNodeV1,
  anchorEvaluation: PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1,
): PhaseB1QuiescentPressureReferenceInverseResultV1["sourceIdentityAudit"] {
  const centerEvaluation = context.center.residualEvaluation;
  const logReferenceMultipliersExactZero = exactNumberArray(
    sourceNode.logReferenceMultipliers,
    [0, 0, 0, 0],
  );
  const coldUnknownsObjectIdentity = Object.is(
    sourceNode.coldUnknowns,
    context.center.unknowns,
  );
  const residualExact = exactNumberArray(
    sourceNode.evaluation.residual,
    centerEvaluation.residual,
  ) && exactNumberArray(
    sourceNode.evaluation.residual,
    anchorEvaluation.residual,
  );
  const residualRoundoff = sourceNode.scaledResidualInfinityNorm
    <= PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
      .maximumScaledResidualInfinityNorm;
  const chamberPressuresExact = PRESSURE_ORDER.every((chamberId) =>
    Object.is(
      sourceNode.evaluation.closedLoop.chamberAbsolutePressurePa[chamberId],
      anchorEvaluation.closedLoop.chamberAbsolutePressurePa[chamberId],
    )
    && Object.is(
      sourceNode.targetChamberPressurePa[chamberId],
      context.sourcePressure[chamberId],
    ));
  const sourceState = sourceNode.evaluation.endpoint.differentialState;
  const fixedBloodVolumesExact = numericRecordExact(
    sourceState.bloodVolumesM3,
    context.session.anchorFixedInputs.bloodVolumesM3,
  );
  const fixedInertialFlowsExact = numericRecordExact(
    sourceState.inertialFlowsM3PerSec,
    context.session.anchorFixedInputs.inertialFlowsM3PerSec,
  );
  const fixedCalciumExact = deepExactEqual(
    sourceState.calciumByWall,
    context.session.anchorFixedInputs.calciumByWall,
  );
  const pass = logReferenceMultipliersExactZero
    && coldUnknownsObjectIdentity
    && residualExact
    && residualRoundoff
    && chamberPressuresExact
    && fixedBloodVolumesExact
    && fixedInertialFlowsExact
    && fixedCalciumExact;
  return Object.freeze({
    logReferenceMultipliersExactZero,
    coldUnknownsObjectIdentity,
    residualExact,
    residualRoundoff,
    chamberPressuresExact,
    fixedBloodVolumesExact,
    fixedInertialFlowsExact,
    fixedCalciumExact,
    pass,
  });
}

function buildColdRestoringAudit(
  context: InverseContext,
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1,
  coldUnknowns: readonly number[],
  reuseSourceGraphNode: boolean,
): PhaseB1QuiescentPressureReferenceNodeV1["coldRestoringAudit"] {
  const restoringNode: PhaseB1ColdEtaOneFixedVolumeNodeResultV1 =
    reuseSourceGraphNode
      ? context.center
      : context.session.solveRestoringNodeAtReferenceConfiguration({
        referenceConfiguration,
        initialUnknowns: coldUnknowns,
      });
  const converged = restoringNode.converged === true;
  const coldUnknownsExact = converged
    && exactNumberArray(restoringNode.unknowns, coldUnknowns);
  const minimumLandSimplexMargin = converged
    ? restoringNode.minimumLandSimplexMargin
    : null;
  const maximumLocalMaterialResidualInfinityNorm = converged
    ? restoringNode.maximumLocalMaterialResidualInfinityNorm
    : null;
  const effectiveTriSegAccepted = converged
    && restoringNode.effectiveTriSegAudit.accepted;
  const withinPublishedTaylorTwoPercentTensionErrorDomain = converged
    && restoringNode.effectiveTriSegAudit
      .withinPublishedTaylorTwoPercentTensionErrorDomain;
  const pass = converged
    && coldUnknownsExact
    && minimumLandSimplexMargin !== null
    && minimumLandSimplexMargin >= 1e-8
    && maximumLocalMaterialResidualInfinityNorm !== null
    && maximumLocalMaterialResidualInfinityNorm <= 1e-10
    && effectiveTriSegAccepted
    && withinPublishedTaylorTwoPercentTensionErrorDomain
    && (!reuseSourceGraphNode || Object.is(restoringNode, context.center));
  return Object.freeze({
    restoringNode,
    sourceGraphNodeObjectReused: reuseSourceGraphNode
      && Object.is(restoringNode, context.center),
    converged,
    coldUnknownsExact,
    minimumLandSimplexMargin,
    maximumLocalMaterialResidualInfinityNorm,
    effectiveTriSegAccepted,
    withinPublishedTaylorTwoPercentTensionErrorDomain,
    pass,
  });
}

function runContinuation(
  context: InverseContext,
  refinementFactor: RefinementFactor,
  direction: "forward" | "reverse",
  startNode: PhaseB1QuiescentPressureReferenceNodeV1,
  injectedFailureIndex: 0 | 1 | null,
): PhaseB1QuiescentPressureReferenceContinuationResultV1 {
  const requestedRhoValues = buildRhoGrid(refinementFactor, direction);
  if (!Object.is(startNode.rho, requestedRhoValues[0])) {
    throw new Error("continuation start node does not match its declared grid");
  }
  const boundary = Object.freeze({
    slsMode: context.graph.slsMode,
    direction,
    refinementFactor,
    requestedRhoValues,
    initialization: direction === "forward"
      ? "exact-graph-C-source-log-zero-independent" as const
      : "canonical-factor-eight-forward-endpoint" as const,
    hiddenSubdivisionApplied: false as const,
    pseudoArclengthApplied: false as const,
    regularizationApplied: false as const,
    priorApplied: false as const,
    projectionApplied: false as const,
    clippingApplied: false as const,
    rootRankingApplied: false as const,
  });
  const nodes: PhaseB1QuiescentPressureReferenceNodeV1[] = [startNode];
  const edges: PhaseB1QuiescentPressureReferenceEdgeV1[] = [];
  const attemptedRhoValues: number[] = [startNode.rho];
  const policy = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1;

  const failure = (
    reason: PhaseB1QuiescentPressureReferenceContinuationFailureV1["reason"],
    message: string,
    failedAttemptIndex: number,
  ): PhaseB1QuiescentPressureReferenceContinuationFailureV1 => {
    const rollbackNode = nodes[nodes.length - 1];
    return Object.freeze({
      ...boundary,
      attemptedRhoValues: Object.freeze([...attemptedRhoValues]),
      completed: false as const,
      reason,
      message,
      failedAttemptIndex,
      nodes: Object.freeze([...nodes]),
      edges: Object.freeze([...edges]),
      rollbackNode,
      rollbackUnknowns: rollbackNode.fullUnknowns,
      hardGatePass: false as const,
      fiftyPercentGuardPass: false as const,
    });
  };

  for (let edgeIndex = 0; edgeIndex < refinementFactor; edgeIndex += 1) {
    const previous = nodes[nodes.length - 1];
    const toRho = requestedRhoValues[edgeIndex + 1];
    attemptedRhoValues.push(toRho);
    if (injectedFailureIndex === edgeIndex) {
      return failure(
        "injected-structured-failure",
        `structured failure injected before continuation edge ${edgeIndex}`,
        edgeIndex,
      );
    }

    let tangentAudit: PhaseB1QuiescentPressureReferenceTangentAuditV1;
    try {
      tangentAudit = buildTangentAudit(context, previous);
    } catch (error) {
      return failure(
        "tangent-failed",
        `pressure-reference tangent failed: ${errorMessage(error)}`,
        edgeIndex,
      );
    }
    if (!tangentAudit.pass) {
      return failure(
        "tangent-failed",
        "pressure-reference tangent linear residual exceeded tolerance",
        edgeIndex,
      );
    }
    const deltaRho = toRho - previous.rho;
    const predictorUnknowns = Object.freeze(previous.fullUnknowns.map(
      (value, index) => requireFinite(
        value
          + deltaRho
            * tangentAudit.scaledUnknownTangentByRho[index]
            * context.unknownScales[index],
        `pressure-reference predictor[${index}]`,
      ),
    ));
    const corrector = solvePressureReferenceCorrector(
      context,
      toRho,
      previous,
      predictorUnknowns,
    );
    if (corrector.converged === false) {
      const diagnostics = corrector.diagnostics;
      return failure(
        "corrector-failed",
        `pressure-reference corrector failed: ${corrector.reason}: ${corrector.message}; `
          + `finalScaledResidual=${diagnostics.finalResidualInfinityNorm}; `
          + `finalScaledUpdate=${diagnostics.finalUpdateInfinityNorm}; `
          + `acceptedSteps=${diagnostics.acceptedStepCount}; `
          + `backtracks=${diagnostics.totalBacktrackCount}`,
        edgeIndex,
      );
    }
    let acceptedNode: PhaseB1QuiescentPressureReferenceNodeV1;
    try {
      acceptedNode = buildInverseNode(
        context,
        toRho,
        corrector.unknowns,
      );
    } catch (error) {
      return failure(
        "corrector-failed",
        `corrected node audit failed: ${errorMessage(error)}`,
        edgeIndex,
      );
    }
    const acceptedNodeStepScaledInfinityNorm = scaledInfinityDistance(
      acceptedNode.fullUnknowns,
      previous.fullUnknowns,
      context.unknownScales,
    );
    const predictorCorrectionScaledInfinityNorm = scaledInfinityDistance(
      acceptedNode.fullUnknowns,
      predictorUnknowns,
      context.unknownScales,
    );
    const edgePass = tangentAudit.pass
      && acceptedNode.hardGatePass
      && acceptedNodeStepScaledInfinityNorm
        <= policy.gates.maximumAcceptedNodeStepScaledInfinityNorm
      && predictorCorrectionScaledInfinityNorm
        <= policy.gates.maximumPredictorCorrectionScaledInfinityNorm;
    const edge = Object.freeze({
      edgeIndex,
      fromRho: previous.rho,
      toRho,
      tangentAudit,
      predictorUnknowns,
      acceptedUnknowns: acceptedNode.fullUnknowns,
      acceptedNodeStepScaledInfinityNorm,
      predictorCorrectionScaledInfinityNorm,
      correctorDiagnostics: corrector.diagnostics,
      correctorBoundary: policy.correctorBoundary,
      acceptedNode,
      pass: edgePass,
    });
    edges.push(edge);
    nodes.push(acceptedNode);
  }

  const maximumAcceptedNodeStepScaledInfinityNorm = maximum(edges.map(
    (edge) => edge.acceptedNodeStepScaledInfinityNorm,
  ));
  const maximumPredictorCorrectionScaledInfinityNorm = maximum(edges.map(
    (edge) => edge.predictorCorrectionScaledInfinityNorm,
  ));
  const maximumAbsoluteFiberLogStrain = maximum(nodes.map((node) =>
    node.maximumAbsoluteFiberLogStrain));
  const hardGatePass = nodes.every((node) => node.hardGatePass)
    && edges.every((edge) => edge.pass)
    && maximumAcceptedNodeStepScaledInfinityNorm
      <= policy.gates.maximumAcceptedNodeStepScaledInfinityNorm
    && maximumPredictorCorrectionScaledInfinityNorm
      <= policy.gates.maximumPredictorCorrectionScaledInfinityNorm;
  const fiftyPercentGuardPass = hardGatePass
    && nodes.every((node) => node.fiftyPercentGuardPass)
    && maximumAcceptedNodeStepScaledInfinityNorm
      <= policy.fiftyPercentGuard.maximumAcceptedNodeStepScaledInfinityNorm
    && maximumPredictorCorrectionScaledInfinityNorm
      <= policy.fiftyPercentGuard.maximumPredictorCorrectionScaledInfinityNorm
    && maximumAbsoluteFiberLogStrain
      <= policy.fiftyPercentGuard.maximumAbsoluteFiberLogStrain;
  return Object.freeze({
    ...boundary,
    attemptedRhoValues: Object.freeze([...attemptedRhoValues]),
    completed: true as const,
    nodes: Object.freeze([...nodes]),
    edges: Object.freeze([...edges]),
    endpoint: nodes[nodes.length - 1],
    maximumAcceptedNodeStepScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm,
    maximumAbsoluteFiberLogStrain,
    hardGatePass,
    fiftyPercentGuardPass,
  });
}

function buildTangentAudit(
  context: InverseContext,
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): PhaseB1QuiescentPressureReferenceTangentAuditV1 {
  const targetDerivative = targetPressureDerivativeByRho(context, node.rho);
  const scaledResidualDerivativeByRho = Object.freeze([
    ...Array<number>(context.coldDimension).fill(0),
    ...PRESSURE_ORDER.map((chamberId, pressureIndex) => requireFinite(
      -targetDerivative[chamberId]
        / context.residualScales[context.coldDimension + pressureIndex],
      `scaled residual derivative by rho ${chamberId}`,
    )),
  ]);
  const matrix = node.fullJacobian.scaledJacobian.flat();
  const linearSolve = solveScaledDensePartialPivotLuV1(
    matrix,
    scaledResidualDerivativeByRho.map((value) => -value),
  );
  if (linearSolve.success === false) {
    throw new Error(`full tangent solve failed: ${linearSolve.message}`);
  }
  const scaledUnknownTangentByRho = Object.freeze([...linearSolve.solution]);
  const linearResidualInfinityNorm = maximum(Array.from(
    { length: context.fullDimension },
    (_, row) => {
      let residual = scaledResidualDerivativeByRho[row];
      for (let column = 0; column < context.fullDimension; column += 1) {
        residual += node.fullJacobian.scaledJacobian[row][column]
          * scaledUnknownTangentByRho[column];
      }
      return Math.abs(requireFinite(
        residual,
        `tangent linear residual[${row}]`,
      ));
    },
  ));
  return Object.freeze({
    scaledResidualDerivativeByRho,
    scaledUnknownTangentByRho,
    linearSolveDiagnostics: linearSolve.diagnostics,
    linearResidualInfinityNorm,
    pass: linearResidualInfinityNorm <= 1e-10,
  });
}

function solvePressureReferenceCorrector(
  context: InverseContext,
  rho: number,
  previousNode: PhaseB1QuiescentPressureReferenceNodeV1,
  predictorUnknowns: readonly number[],
): Readonly<{
  converged: true;
  unknowns: readonly number[];
  diagnostics: ScaledDampedNewtonDiagnosticsV1;
}> | Readonly<{
  converged: false;
  reason: string;
  message: string;
  diagnostics: ScaledDampedNewtonDiagnosticsV1;
}> {
  const predictorLogs = Object.freeze(predictorUnknowns.slice(
    context.coldDimension,
  ));
  const logLowerBounds = Object.freeze(context.lowerBounds.slice(
    context.coldDimension,
  ));
  const logAffineConstraints = Object.freeze(context.affineConstraints
    .filter((constraint) => constraint.coefficients.slice(
      0,
      context.coldDimension,
    ).every((coefficient) => coefficient === 0))
    .map((constraint) => Object.freeze({
      constraintId: constraint.constraintId,
      coefficients: Object.freeze(constraint.coefficients.slice(
        context.coldDimension,
      )),
      lowerBound: constraint.lowerBound,
    })));
  type RestoredTrial = Readonly<{
    logs: readonly number[];
    restoringNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
    fullUnknowns: readonly number[];
    pressureResidual: readonly number[];
    rawPressurePerLogSchurPa: readonly (readonly number[])[];
  }>;
  let cache: RestoredTrial | null = null;
  const restoreTrial = (logs: readonly number[]): RestoredTrial => {
    if (cache !== null && exactNumberArray(cache.logs, logs)) return cache;
    const closedLogs = Object.freeze([...logs]) as LogVector;
    assertLogDomain(closedLogs);
    const referenceConfiguration = referenceConfigurationFromLogs(
      context,
      closedLogs,
    );
    const restoringNode = context.session
      .solveRestoringNodeAtReferenceConfiguration({
        referenceConfiguration,
        initialUnknowns: previousNode.coldUnknowns,
      });
    if (restoringNode.converged === false) {
      throw new Error(
        `cold-manifold restoration failed: ${restoringNode.reason}: ${restoringNode.message}`,
      );
    }
    const fullUnknowns = Object.freeze([
      ...restoringNode.unknowns,
      ...closedLogs,
    ]);
    const augmented = evaluateAugmentedResidual(context, rho, fullUnknowns);
    const fullJacobian = buildFullJacobian(context, rho, fullUnknowns);
    const schur = computeSchurCore(context, fullJacobian);
    const pressureResidual = Object.freeze(augmented.residual.slice(
      context.coldDimension,
    ));
    cache = Object.freeze({
      logs: closedLogs,
      restoringNode,
      fullUnknowns,
      pressureResidual,
      rawPressurePerLogSchurPa: schur.rawPressurePerLogSchurPa,
    });
    return cache;
  };
  const reduced = solveScaledDampedNewtonV1({
    initialUnknowns: predictorLogs,
    unknownScales: Array<number>(4).fill(
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.logUnknownScale,
    ),
    residualScales: Array<number>(4).fill(
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .pressureResidualScalePa,
    ),
    strictLowerBounds: logLowerBounds,
    strictAffineConstraints: logAffineConstraints,
    evaluate: (logs) => {
      try {
        const restored = restoreTrial(logs);
        return {
          status: "ok" as const,
          residual: restored.pressureResidual,
          jacobianRowMajor: restored.rawPressurePerLogSchurPa.flat(),
          diagnostic: Object.freeze({
            coldManifoldRestored: true as const,
            coldUnknownCount: context.coldDimension,
          }),
        };
      } catch (error) {
        return {
          status: "inadmissible" as const,
          reason: errorMessage(error),
        };
      }
    },
    options: {
      maxIterations:
        PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.newton
          .maximumIterations,
      residualInfinityTolerance:
        PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.newton
          .scaledResidualInfinityTolerance,
      updateInfinityTolerance:
        PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.newton
          .scaledUpdateInfinityTolerance,
    },
  });
  if (reduced.converged === false) {
    return Object.freeze({
      converged: false as const,
      reason: reduced.reason,
      message: reduced.message,
      diagnostics: reduced.diagnostics,
    });
  }
  try {
    const restored = restoreTrial(reduced.unknowns);
    return Object.freeze({
      converged: true as const,
      unknowns: restored.fullUnknowns,
      diagnostics: reduced.diagnostics,
    });
  } catch (error) {
    return Object.freeze({
      converged: false as const,
      reason: "final-cold-manifold-restoration-failed",
      message: errorMessage(error),
      diagnostics: reduced.diagnostics,
    });
  }
}

function buildFailureProbe(
  context: InverseContext,
  sourceNode: PhaseB1QuiescentPressureReferenceNodeV1,
  injectedAttemptIndex: 0 | 1,
): PhaseB1QuiescentPressureReferenceFailureProbeV1 {
  const continuation = runContinuation(
    context,
    2,
    "forward",
    sourceNode,
    injectedAttemptIndex,
  );
  if (continuation.completed === true) {
    throw new Error("structured rollback probe unexpectedly completed");
  }
  const failureResult:
    PhaseB1QuiescentPressureReferenceContinuationFailureV1 = continuation;
  const rollbackNodeIsSourceObject = Object.is(
    failureResult.rollbackNode,
    sourceNode,
  );
  const acceptedMidpoint = failureResult.nodes.length > 1
    ? failureResult.nodes[1]
    : null;
  const rollbackNodeIsAcceptedMidpointObject = acceptedMidpoint !== null
    && Object.is(failureResult.rollbackNode, acceptedMidpoint);
  const rollbackUnknownsObjectIdentity = Object.is(
    failureResult.rollbackUnknowns,
    failureResult.rollbackNode.fullUnknowns,
  );
  const expectedRollbackIdentity = injectedAttemptIndex === 0
    ? rollbackNodeIsSourceObject && !rollbackNodeIsAcceptedMidpointObject
    : !rollbackNodeIsSourceObject && rollbackNodeIsAcceptedMidpointObject;
  const pass = failureResult.reason === "injected-structured-failure"
    && failureResult.failedAttemptIndex === injectedAttemptIndex
    && failureResult.attemptedRhoValues.length === injectedAttemptIndex + 2
    && failureResult.nodes.length === injectedAttemptIndex + 1
    && expectedRollbackIdentity
    && rollbackUnknownsObjectIdentity;
  return Object.freeze({
    injectedAttemptIndex,
    result: failureResult,
    rollbackNodeIsSourceObject,
    rollbackNodeIsAcceptedMidpointObject,
    rollbackUnknownsObjectIdentity,
    pass,
  });
}

function buildRhoGrid(
  refinementFactor: RefinementFactor,
  direction: "forward" | "reverse",
): readonly number[] {
  return Object.freeze(Array.from(
    { length: refinementFactor + 1 },
    (_, index) => {
      if (direction === "forward") {
        if (index === 0) return 0;
        if (index === refinementFactor) return 1;
        return index / refinementFactor;
      }
      if (index === 0) return 1;
      if (index === refinementFactor) return 0;
      return 1 - index / refinementFactor;
    },
  ));
}

function singularValues4x4(
  matrix: readonly (readonly number[])[],
) {
  if (matrix.length !== 4 || matrix.some((row) => row.length !== 4)) {
    throw new Error("Schur SVD requires a 4x4 matrix");
  }
  const gram = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, column) => {
      let value = 0;
      for (let index = 0; index < 4; index += 1) {
        value += matrix[index][row] * matrix[index][column];
      }
      return requireFinite(value, `Schur Gram[${row}][${column}]`);
    }));
  let sweeps = 0;
  for (let sweep = 0; sweep < 100; sweep += 1) {
    let p = 0;
    let q = 1;
    let largest = 0;
    let largestDiagonal = 0;
    for (let row = 0; row < 4; row += 1) {
      largestDiagonal = Math.max(largestDiagonal, Math.abs(gram[row][row]));
      for (let column = row + 1; column < 4; column += 1) {
        const candidate = Math.abs(gram[row][column]);
        if (candidate > largest) {
          largest = candidate;
          p = row;
          q = column;
        }
      }
    }
    if (largest <= Number.EPSILON * Math.max(largestDiagonal, 1e-300)) break;
    const app = gram[p][p];
    const aqq = gram[q][q];
    const apq = gram[p][q];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let index = 0; index < 4; index += 1) {
      if (index === p || index === q) continue;
      const aip = gram[index][p];
      const aiq = gram[index][q];
      const rotatedP = cosine * aip - sine * aiq;
      const rotatedQ = sine * aip + cosine * aiq;
      gram[index][p] = rotatedP;
      gram[p][index] = rotatedP;
      gram[index][q] = rotatedQ;
      gram[q][index] = rotatedQ;
    }
    gram[p][p] = cosine * cosine * app
      - 2 * sine * cosine * apq
      + sine * sine * aqq;
    gram[q][q] = sine * sine * app
      + 2 * sine * cosine * apq
      + cosine * cosine * aqq;
    gram[p][q] = 0;
    gram[q][p] = 0;
    sweeps += 1;
  }
  const singularValues = gram.map((row, index) => Math.sqrt(Math.max(
    0,
    requireFinite(row[index], `Schur Gram eigenvalue[${index}]`),
  ))).sort((left, right) => right - left);
  const singularValuesDescending = Object.freeze(singularValues) as unknown as readonly [
    number,
    number,
    number,
    number,
  ];
  let finalMaximumOffDiagonal = 0;
  let finalMaximumDiagonal = 0;
  for (let row = 0; row < 4; row += 1) {
    finalMaximumDiagonal = Math.max(
      finalMaximumDiagonal,
      Math.abs(gram[row][row]),
    );
    for (let column = row + 1; column < 4; column += 1) {
      finalMaximumOffDiagonal = Math.max(
        finalMaximumOffDiagonal,
        Math.abs(gram[row][column]),
      );
    }
  }
  const convergenceTolerance = Number.EPSILON
    * Math.max(finalMaximumDiagonal, 1e-300);
  return Object.freeze({
    singularValuesDescending,
    sweeps,
    finalMaximumOffDiagonal,
    convergenceTolerance,
    converged: finalMaximumOffDiagonal <= convergenceTolerance,
  });
}

function maximumFiberLogStrain(
  evaluation: PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1,
): number {
  return maximum([
    Math.abs(evaluation.closedLoop.atria.LA.geometry.fiberLogStrain),
    Math.abs(evaluation.closedLoop.atria.RA.geometry.fiberLogStrain),
    Math.abs(evaluation.closedLoop.triSegGeometry.walls.LVFW.fiberLogStrain),
    Math.abs(evaluation.closedLoop.triSegGeometry.walls.SEP.fiberLogStrain),
    Math.abs(evaluation.closedLoop.triSegGeometry.walls.RVFW.fiberLogStrain),
  ]);
}

function assertLogDomain(logs: LogVector): void {
  const bounds = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .logBounds;
  const individual = [
    bounds.LAReferenceCavity,
    bounds.RAReferenceCavity,
    bounds.freewallEven,
    bounds.freewallOdd,
  ] as const;
  logs.forEach((value, index) => {
    if (!(value > individual[index].lower && value < individual[index].upper)) {
      throw new Error(`log reference unknown ${index} left its strict domain`);
    }
  });
  const lvfw = logs[2] + logs[3];
  const rvfw = logs[2] - logs[3];
  if (!(lvfw > bounds.LVFWActual.lower && lvfw < bounds.LVFWActual.upper)) {
    throw new Error("LVFW actual log reference multiplier left its strict domain");
  }
  if (!(rvfw > bounds.RVFWActual.lower && rvfw < bounds.RVFWActual.upper)) {
    throw new Error("RVFW actual log reference multiplier left its strict domain");
  }
}

function assertExactPlainRecord(
  value: unknown,
  expectedKeys: readonly string[],
  field: string,
): asserts value is Readonly<Record<string, unknown>> {
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
    if (typeof key !== "string") throw new Error(`${field} contains a symbol key`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${field}.${key} must be an enumerable data property`);
  }
}

function assertRecursivelyFrozenAndClosed(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): void {
  if (value === null) return;
  if (typeof value === "number") {
    requireFinite(value, path);
    return;
  }
  if (typeof value === "string" || typeof value === "boolean") return;
  if (typeof value !== "object") {
    throw new Error(`${path} contains a non-data value`);
  }
  if (seen.has(value)) return;
  if (!Object.isFrozen(value)) throw new Error(`${path} must be frozen`);
  seen.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) throw new Error(`${path} must be dense`);
      assertRecursivelyFrozenAndClosed(value[index], `${path}[${index}]`, seen);
    }
    return;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${path} must contain only plain objects and arrays`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${path} contains a symbol key`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${path}.${key} must be an enumerable data property`);
    assertRecursivelyFrozenAndClosed(descriptor.value, `${path}.${key}`, seen);
  }
}

function assertFiniteVector(
  values: readonly number[],
  expectedLength: number,
  field: string,
): void {
  if (
    !Array.isArray(values)
    || values.length !== expectedLength
    || values.some((value) => !Number.isFinite(value))
  ) throw new Error(`${field} must be a finite dense vector of the declared length`);
  for (let index = 0; index < values.length; index += 1) {
    if (!(index in values)) throw new Error(`${field} must be dense`);
  }
}

function exactNumberArray(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function numericRecordExact(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index] && Object.is(left[key], right[key]));
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
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length
      && left.every((value, index) => deepExactEqual(value, right[index]));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && deepExactEqual(leftRecord[key], rightRecord[key]));
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("scaled distance dimension drifted");
  }
  return maximum(left.map((value, index) => Math.abs(
    (value - right[index]) / requirePositiveFinite(
      scales[index],
      `scaled distance scale[${index}]`,
    ),
  )));
}

function maximumPairwiseScaledInfinityDistance(
  vectors: readonly (readonly number[])[],
  scales: readonly number[],
): number {
  let result = 0;
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      result = Math.max(
        result,
        scaledInfinityDistance(vectors[left], vectors[right], scales),
      );
    }
  }
  return result;
}

function freezeMatrix(
  matrix: readonly (readonly number[])[],
): readonly (readonly number[])[] {
  return Object.freeze(matrix.map((row) => Object.freeze([...row])));
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values.map((value, index) => requireFinite(
    value,
    `maximum input[${index}]`,
  )));
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

function requireUnitInterval(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must lie in [0,1]`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
}
