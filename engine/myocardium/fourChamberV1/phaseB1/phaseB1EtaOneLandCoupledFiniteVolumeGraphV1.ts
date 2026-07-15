import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
  runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ColdEtaOneFixedVolumeLoadContinuationV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  type PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID =
  "phase-b1-eta-one-land-coupled-finite-volume-graph-v1" as const;

const phaseB1EtaOneLandCoupledFiniteVolumeGraphResultRegistryV1 =
  new WeakSet<object>();

export type PhaseB1EtaOneFiniteVolumeGraphNodeIdV1 =
  | "C" | "SW" | "W" | "NW" | "N" | "NE" | "E" | "SE" | "S";

export type PhaseB1EtaOneFiniteVolumeGraphNodeV1 = Readonly<{
  nodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  leftVentricularVolumeMultiplier: 0.99 | 1 | 1.01;
  rightVentricularVolumeMultiplier: 0.99 | 1 | 1.01;
}>;

export type PhaseB1EtaOneFiniteVolumeGraphEdgeV1 = Readonly<{
  edgeId: string;
  edgeClass: "center-spoke" | "perimeter";
  fromNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  toNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
}>;

const graphNode = (
  nodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
  leftVentricularVolumeMultiplier: 0.99 | 1 | 1.01,
  rightVentricularVolumeMultiplier: 0.99 | 1 | 1.01,
): PhaseB1EtaOneFiniteVolumeGraphNodeV1 => Object.freeze({
  nodeId,
  leftVentricularVolumeMultiplier,
  rightVentricularVolumeMultiplier,
});

export const PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1 =
  Object.freeze([
    graphNode("C", 1, 1),
    graphNode("SW", 0.99, 0.99),
    graphNode("W", 0.99, 1),
    graphNode("NW", 0.99, 1.01),
    graphNode("N", 1, 1.01),
    graphNode("NE", 1.01, 1.01),
    graphNode("E", 1.01, 1),
    graphNode("SE", 1.01, 0.99),
    graphNode("S", 1, 0.99),
  ] as const);

const PERIMETER_NODE_IDS = Object.freeze([
  "SW", "W", "NW", "N", "NE", "E", "SE", "S",
] as const);

export const PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1 =
  Object.freeze([
    ...PERIMETER_NODE_IDS.map((nodeId) => Object.freeze({
      edgeId: `spoke-C-${nodeId}`,
      edgeClass: "center-spoke" as const,
      fromNodeId: "C" as const,
      toNodeId: nodeId,
    })),
    ...PERIMETER_NODE_IDS.map((fromNodeId, index) => {
      const toNodeId = PERIMETER_NODE_IDS[(index + 1) % PERIMETER_NODE_IDS.length];
      return Object.freeze({
        edgeId: `perimeter-${fromNodeId}-${toNodeId}`,
        edgeClass: "perimeter" as const,
        fromNodeId,
        toNodeId,
      });
    }),
  ] as const satisfies readonly PhaseB1EtaOneFiniteVolumeGraphEdgeV1[]);

export const PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1 =
  Object.freeze({
    policyId: "phase-b1-eta-one-land-coupled-finite-volume-graph-policy-v1",
    eta: 1 as const,
    timeSec: 0 as const,
    slsModes: Object.freeze(["on", "off"] as const),
    volumeAxes: Object.freeze({
      leftVentricle: Object.freeze({
        multipliers: Object.freeze([0.99, 1, 1.01] as const),
        closedLedgerComplement: "PV" as const,
      }),
      rightVentricle: Object.freeze({
        multipliers: Object.freeze([0.99, 1, 1.01] as const),
        closedLedgerComplement: "SV" as const,
      }),
      unchangedCompartments: Object.freeze(["LA", "RA", "SA", "PA"] as const),
      interpretation:
        "static-closed-ledger-fixed-hemodynamic-state-not-a-filling-path" as const,
    }),
    continuation: Object.freeze({
      refinementFactors: Object.freeze([2, 4, 8] as const),
      selectionRule: "first-hard-pass-with-50pct-guard" as const,
      everyAttemptStartsFromExactCanonicalSource: true as const,
      factorEndpointsSharedAsSeeds: false as const,
      allAttemptsRecorded: true as const,
      hiddenSubdivisionAllowed: false as const,
      pseudoArclengthRescueAllowed: false as const,
      maximumPathEntryCorrectionScaledInfinityNorm: 1e-8,
      maximumCoarseFineScaledTangentDisagreement:
        PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1
          .maximumCoarseFineScaledTangentDisagreement,
      maximumAcceptedNodeStepScaledInfinityNorm: 0.25,
      maximumPredictorCorrectionScaledInfinityNorm: 0.25,
    }),
    gates: Object.freeze({
      totalBloodVolumeRelativeTolerance: 4096 * Number.EPSILON,
      maximumScaledResidualInfinityNorm: 1e-8,
      maximumScaledUpdateInfinityNorm: 1e-8,
      maximumLocalMaterialResidualInfinityNorm: 1e-10,
      minimumLandSimplexMargin: 1e-8,
      minimumEffectiveTriSegSigma: 1e-3,
      maximumEffectiveTriSegConditionNumber2: 1e3,
      minimumStaticRestoringMargin: 1e-3,
      maximumSchurToReequilibratedDifferenceTwoNorm: 1e-5,
      maximumAssembledToRawLandActiveDifferencePa: 1e-9,
      endpointAgreementScaledInfinityTolerance: 1e-6,
      reverseClosureScaledInfinityTolerance: 1e-6,
      rootClusteringScaledInfinityTolerance: 1e-8,
    }),
    fiftyPercentGuard: Object.freeze({
      upperThresholdMultiplier: 0.5,
      lowerThresholdMultiplier: 2,
      reportedSeparatelyFromHardGates: true as const,
    }),
    rootCensus: Object.freeze({
      seedOrders: Object.freeze(["declared", "reverse"] as const),
      censusSelectsTrackedBranch: false as const,
      globalExhaustivenessClaimed: false as const,
    }),
    prohibitedOperations: Object.freeze({
      projectionApplied: false as const,
      clippingApplied: false as const,
      fallbackApplied: false as const,
      hiddenSubdivisionApplied: false as const,
      pseudoArclengthApplied: false as const,
      etaHomotopyRescueApplied: false as const,
      nearestRootSelectionApplied: false as const,
      minimumResidualRootSelectionApplied: false as const,
      maximumJunctionRadiusRootSelectionApplied: false as const,
      forcedPreviousSeptumApplied: false as const,
      censusSelectionApplied: false as const,
    }),
    routeScope: Object.freeze({
      triangleAndPerimeterChainedRouteRerunsIncluded: false as const,
      exclusionReason:
        "v1-claims-only-nine-finite-nodes-and-thirty-two-canonical-source-directed-edges" as const,
      perEdgeForwardReverseClosureAuditedSeparately: true as const,
    }),
    claimBoundary: Object.freeze({
      finiteVolumeGraph: true as const,
      volumeEnvelope: false as const,
      continuousVolumeRegularity: false as const,
      globalRootUniqueness: false as const,
      globalRootExhaustiveness: false as const,
      energeticStability: false as const,
      physiologicalInitialization: false as const,
      closedLoopStationarity: false as const,
      acceptedPhaseB1ReferenceBranch: false as const,
      fullBeatAcceptance: false as const,
      physiologicalValidation: false as const,
      releaseRuntimeReachability: false as const,
    }),
  } as const);

export type PhaseB1EtaOneFiniteVolumeLedgerV1 = Readonly<{
  nodeId: string;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  deltaLeftVentricularVolumeM3: number;
  deltaRightVentricularVolumeM3: number;
  anchorTotalBloodVolumeM3: number;
  nodeTotalBloodVolumeM3: number;
  totalBloodVolumeDifferenceM3: number;
  relativeTotalBloodVolumeDifference: number;
  allVolumesPositive: boolean;
  unchangedCompartmentsExact: boolean;
  complementLedgerExact: boolean;
  accepted: boolean;
}>;

export type PhaseB1EtaOneLandIdentityAuditV1 = Readonly<{
  wallByWall: Readonly<Record<FourChamberWallId, Readonly<{
    rawLandActiveStressPa: number;
    assembledActiveStressPa: number;
    absoluteDifferencePa: number;
  }>>>;
  maximumAssembledToRawLandActiveDifferencePa: number;
  pass: boolean;
}>;

export type PhaseB1EtaOneFiniteVolumeNodeAuditV1 = Readonly<{
  nodeId: string;
  ledger: PhaseB1EtaOneFiniteVolumeLedgerV1;
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  etaOneExact: boolean;
  fixedStateExact: boolean;
  effectiveTriSegRestoringPass: boolean;
  landIdentityAudit: PhaseB1EtaOneLandIdentityAuditV1;
  thresholdMetricsFinite: boolean;
  thresholdNormMetricsNonnegative: boolean;
  prohibitedOperationsAbsent: boolean;
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
}>;

export type PhaseB1EtaOneFiniteVolumeCenterReplayAuditV1 = Readonly<{
  centerNodePreservedByObjectIdentity: boolean;
  replayedResidual: readonly number[];
  maximumAbsoluteResidualReplayDifference: number;
  pass: boolean;
}>;

export type PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1 = Readonly<{
  nodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  declared: PhaseB1ColdEtaOneFixedVolumeRootCensusV1;
  reverse: PhaseB1ColdEtaOneFixedVolumeRootCensusV1;
  clusterSetsBijective: boolean;
  declaredInventoryPass: boolean;
  reverseInventoryPass: boolean;
  declaredTrackedRestoringClusterCount: number;
  reverseTrackedRestoringClusterCount: number;
  trackedCanonicalMatchesExactlyOneRestoringCluster: boolean;
  pass: boolean;
}>;

export type PhaseB1EtaOneFiniteVolumePathAttemptV1 = Readonly<{
  refinementFactor: PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1;
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1;
  nodeAudits: readonly PhaseB1EtaOneFiniteVolumeNodeAuditV1[];
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
  refinementTrigger:
    | "none"
    | "hard-failure"
    | "fifty-percent-guard-not-met";
}>;

export type PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1 = Readonly<{
  edgeId: string;
  edgeClass: "center-spoke" | "perimeter";
  pathRole: "canonical-source-directed" | "forward-endpoint-roundtrip";
  direction: PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1;
  sourceNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  destinationNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  attempts: readonly PhaseB1EtaOneFiniteVolumePathAttemptV1[];
  selectedAttemptIndex: number | null;
  selectedRefinementFactor:
    PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1 | null;
  firstGuardPassingFactor:
    PhaseB1ColdEtaOneFixedVolumeLoadRefinementFactorV1 | null;
  selectionRuleAuditPass: boolean;
  destinationAgreementScaledInfinityNorm: number | null;
  accepted: boolean;
  declaredRollbackUnknownsOnFailure: readonly number[];
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  etaHomotopyRescueApplied: false;
  rootRankingApplied: false;
}>;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1 = Readonly<{
  graphId: typeof PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID;
  slsMode: "on" | "off";
  componentIds: Readonly<{
    parentStitch:
      typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID;
    fixedVolumeSolver: typeof PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID;
    loadContinuation:
      typeof PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID;
  }>;
  centerReplayAudit: PhaseB1EtaOneFiniteVolumeCenterReplayAuditV1;
  canonicalNodes: readonly PhaseB1EtaOneFiniteVolumeNodeAuditV1[];
  directedEdges: readonly PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1[];
  roundTripAudits: readonly PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1[];
  rootCensus: readonly PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1[];
  maximumDestinationAgreementScaledInfinityNorm: number | null;
  maximumRoundTripClosureScaledInfinityNorm: number | null;
  allCanonicalNodesFiftyPercentGuardPass: boolean;
  routeScope: typeof PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.routeScope;
  phaseB1LandCoupledFiniteVolumeGraphPass: boolean;
  phaseB1LandCoupledVolumeEnvelopePass: false;
  continuousVolumeIntervalRegularityPass: false;
  globalRootUniquenessPass: false;
  globalRootExhaustivenessPass: false;
  energeticStabilityPass: false;
  physiologicalInitializationPass: false;
  closedLoopStationarityPass: false;
  acceptedPhaseB1ReferenceBranchPass: false;
  fullBeatAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  supportedEnvelopePass: false;
  releaseRuntimePass: false;
  parentStitchObjectConsumed: true;
  pureCoreParentEvidenceAuthenticationClaimed: false;
  testOnly: true;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
}>;

export function assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(
  value: unknown,
): asserts value is PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1 {
  if (
    value === null
    || typeof value !== "object"
    || !phaseB1EtaOneLandCoupledFiniteVolumeGraphResultRegistryV1.has(value)
  ) {
    throw new Error(
      "finite-volume graph must be the live canonical result produced by "
      + "runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1",
    );
  }
}

type GraphContext = Readonly<{
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1;
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1;
  anchorBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  anchorTotalBloodVolumeM3: number;
}>;

type RawAdaptivePath = Readonly<{
  edge: PhaseB1EtaOneFiniteVolumeGraphEdgeV1;
  pathRole: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1["pathRole"];
  direction: PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1;
  sourceNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  destinationNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1;
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  sourceLedger: PhaseB1EtaOneFiniteVolumeLedgerV1;
  destinationLedger: PhaseB1EtaOneFiniteVolumeLedgerV1;
  attempts: readonly PhaseB1EtaOneFiniteVolumePathAttemptV1[];
  selectedAttemptIndex: number | null;
}>;

export function runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1 {
  const context = buildGraphContext(stitch, sha256Hex);
  const ledgerByNodeId = new Map(
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1.map((node) => [
      node.nodeId,
      buildPhaseB1EtaOneFiniteVolumeLedgerV1(context.anchorBloodVolumesM3, node),
    ] as const),
  );
  const centerNode = requireEtaOneNode(stitch.etaOne.node);
  const canonicalNodeById = new Map<
    PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
    PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1
  >([["C", centerNode]]);
  const centerReplayAudit = auditCenterReplay(context, centerNode);
  const preliminarySpokes = new Map<string, RawAdaptivePath>();

  for (const edge of PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1) {
    if (edge.edgeClass !== "center-spoke") continue;
    const raw = runAdaptivePath(
      context,
      edge,
      "canonical-source-directed",
      "forward",
      edge.fromNodeId,
      edge.toNodeId,
      centerNode,
      requireLedger(ledgerByNodeId, edge.fromNodeId),
      requireLedger(ledgerByNodeId, edge.toNodeId),
    );
    preliminarySpokes.set(edge.edgeId, raw);
    const endpoint = selectedEndpoint(raw);
    if (endpoint === null) {
      throw new Error(`finite-volume graph could not establish ${edge.edgeId}`);
    }
    canonicalNodeById.set(edge.toNodeId, endpoint.node);
  }

  const canonicalNodes = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1
    .map((node) => auditNode(
      context,
      node.nodeId,
      requireLedger(ledgerByNodeId, node.nodeId),
      requireCanonicalNode(canonicalNodeById, node.nodeId),
    ));
  const allCanonicalNodesFiftyPercentGuardPass = canonicalNodes.every(
    (audit) => audit.fiftyPercentGuardPass,
  );

  const directedEdges: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1[] = [];
  const roundTripAudits: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1[] = [];
  for (const edge of PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1) {
    const fromLedger = requireLedger(ledgerByNodeId, edge.fromNodeId);
    const toLedger = requireLedger(ledgerByNodeId, edge.toNodeId);
    const fromNode = requireCanonicalNode(canonicalNodeById, edge.fromNodeId);
    const toNode = requireCanonicalNode(canonicalNodeById, edge.toNodeId);
    const rawForward = edge.edgeClass === "center-spoke"
      ? requireRawPath(preliminarySpokes, edge.edgeId)
      : runAdaptivePath(
        context,
        edge,
        "canonical-source-directed",
        "forward",
        edge.fromNodeId,
        edge.toNodeId,
        fromNode,
        fromLedger,
        toLedger,
      );
    const forward = finalizePath(
      context,
      rawForward,
      toNode,
      PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .endpointAgreementScaledInfinityTolerance,
    );
    const rawReverse = runAdaptivePath(
      context,
      edge,
      "canonical-source-directed",
      "reverse",
      edge.toNodeId,
      edge.fromNodeId,
      toNode,
      toLedger,
      fromLedger,
    );
    const reverse = finalizePath(
      context,
      rawReverse,
      fromNode,
      PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .endpointAgreementScaledInfinityTolerance,
    );
    directedEdges.push(forward, reverse);

    const forwardEndpoint = selectedEndpoint(rawForward);
    if (forwardEndpoint === null) {
      throw new Error(`finite-volume graph forward endpoint absent for ${edge.edgeId}`);
    }
    const rawRoundTrip = runAdaptivePath(
      context,
      edge,
      "forward-endpoint-roundtrip",
      "reverse",
      edge.toNodeId,
      edge.fromNodeId,
      forwardEndpoint.node,
      toLedger,
      fromLedger,
    );
    roundTripAudits.push(finalizePath(
      context,
      rawRoundTrip,
      fromNode,
      PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .reverseClosureScaledInfinityTolerance,
    ));
  }

  const rootCensus = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1
    .map((node) => auditNodeCensus(
      context,
      node.nodeId,
      requireLedger(ledgerByNodeId, node.nodeId),
      requireCanonicalNode(canonicalNodeById, node.nodeId),
    ));
  const maximumDestinationAgreementScaledInfinityNorm = maximumNullable(
    directedEdges.map((edge) => edge.destinationAgreementScaledInfinityNorm),
  );
  const maximumRoundTripClosureScaledInfinityNorm = maximumNullable(
    roundTripAudits.map((edge) => edge.destinationAgreementScaledInfinityNorm),
  );
  const policy = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1;
  const phaseB1LandCoupledFiniteVolumeGraphPass = centerReplayAudit.pass
    && canonicalNodes.length === 9
    && canonicalNodes.every((node) => node.hardGatePass)
    && allCanonicalNodesFiftyPercentGuardPass
    && directedEdges.length === 32
    && directedEdges.every((edge) => edge.accepted)
    && roundTripAudits.length === 16
    && roundTripAudits.every((edge) => edge.accepted)
    && maximumDestinationAgreementScaledInfinityNorm !== null
    && maximumDestinationAgreementScaledInfinityNorm
      <= policy.gates.endpointAgreementScaledInfinityTolerance
    && maximumRoundTripClosureScaledInfinityNorm !== null
    && maximumRoundTripClosureScaledInfinityNorm
      <= policy.gates.reverseClosureScaledInfinityTolerance
    && rootCensus.length === 9
    && rootCensus.every((census) => census.pass);
  const result: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1 =
    Object.freeze({
      graphId: PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
      slsMode: stitch.slsMode,
      componentIds: Object.freeze({
        parentStitch:
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
        fixedVolumeSolver: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
        loadContinuation:
          PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
      }),
      centerReplayAudit,
      canonicalNodes: Object.freeze(canonicalNodes),
      directedEdges: Object.freeze(directedEdges),
      roundTripAudits: Object.freeze(roundTripAudits),
      rootCensus: Object.freeze(rootCensus),
      maximumDestinationAgreementScaledInfinityNorm,
      maximumRoundTripClosureScaledInfinityNorm,
      allCanonicalNodesFiftyPercentGuardPass,
      routeScope: policy.routeScope,
      phaseB1LandCoupledFiniteVolumeGraphPass,
      phaseB1LandCoupledVolumeEnvelopePass: false,
      continuousVolumeIntervalRegularityPass: false,
      globalRootUniquenessPass: false,
      globalRootExhaustivenessPass: false,
      energeticStabilityPass: false,
      physiologicalInitializationPass: false,
      closedLoopStationarityPass: false,
      acceptedPhaseB1ReferenceBranchPass: false,
      fullBeatAcceptancePass: false,
      physiologicalValidationPass: false,
      phaseB1AcceptancePass: false,
      supportedEnvelopePass: false,
      releaseRuntimePass: false,
      parentStitchObjectConsumed: true,
      pureCoreParentEvidenceAuthenticationClaimed: false,
      testOnly: true,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
    });
  if (result.phaseB1LandCoupledFiniteVolumeGraphPass) {
    phaseB1EtaOneLandCoupledFiniteVolumeGraphResultRegistryV1.add(result);
  }
  return result;
}

function runAdaptivePath(
  context: GraphContext,
  edge: PhaseB1EtaOneFiniteVolumeGraphEdgeV1,
  pathRole: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1["pathRole"],
  direction: PhaseB1ColdEtaOneFixedVolumeLoadDirectionV1,
  sourceNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
  destinationNodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sourceLedger: PhaseB1EtaOneFiniteVolumeLedgerV1,
  destinationLedger: PhaseB1EtaOneFiniteVolumeLedgerV1,
): RawAdaptivePath {
  const policy = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1;
  const attempts: PhaseB1EtaOneFiniteVolumePathAttemptV1[] = [];
  let selectedAttemptIndex: number | null = null;
  for (const refinementFactor of policy.continuation.refinementFactors) {
    const continuation = runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1({
      session: context.session,
      sourceNode,
      sourceBloodVolumesM3: sourceLedger.bloodVolumesM3,
      destinationBloodVolumesM3: destinationLedger.bloodVolumesM3,
      direction,
      refinementFactor,
    });
    const continuationNodes = "nodes" in continuation
      ? continuation.nodes
      : continuation.acceptedNodes;
    const nodeAudits = continuationNodes.map((loadNode, index) => auditNode(
      context,
      `${edge.edgeId}:${pathRole}:${direction}:${refinementFactor}:${index}`,
      buildLedgerAtVolumes(
        context.anchorBloodVolumesM3,
        `${edge.edgeId}:${pathRole}:${direction}:${refinementFactor}:${index}`,
        loadNode.bloodVolumesM3,
      ),
      loadNode.node,
    ));
    const expectedSValues = buildExpectedSGrid(refinementFactor, direction);
    const prohibitedOperationsAbsent =
      !continuation.hiddenSubdivisionApplied
      && !continuation.pseudoArclengthApplied
      && !continuation.projectionApplied
      && !continuation.clippingApplied
      && !continuation.nearestRootSelectionApplied
      && !continuation.minimumResidualRootSelectionApplied
      && !continuation.maximumJunctionRadiusRootSelectionApplied;
    const continuationThresholdMetricsFinite = continuation.completed
      ? Number.isFinite(
        continuation.maximumCoarseFineScaledTangentDisagreement,
      )
        && Number.isFinite(
          continuation.maximumAcceptedNodeStepScaledInfinityNorm,
        )
        && Number.isFinite(
          continuation.maximumPredictorCorrectionScaledInfinityNorm,
        )
      : true;
    const hardGatePass = continuation.completed
      && continuation.continuationId
        === PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID
      && continuation.refinementFactor === refinementFactor
      && arrayExact(continuation.requestedSValues, expectedSValues)
      && arrayExact(continuation.attemptedSValues, expectedSValues)
      && continuation.nodes.length === refinementFactor + 1
      && continuation.edgeAudits.length === refinementFactor
      && Object.is(continuation.nodes[0].node, sourceNode)
      && numericRecordExact(
        continuation.nodes[0].bloodVolumesM3,
        sourceLedger.bloodVolumesM3,
      )
      && numericRecordExact(
        continuation.endpoint.bloodVolumesM3,
        destinationLedger.bloodVolumesM3,
      )
      && nodeAudits.length === continuation.nodes.length
      && nodeAudits.every((audit) => audit.hardGatePass)
      && continuationThresholdMetricsFinite
      && continuation.maximumCoarseFineScaledTangentDisagreement
        <= policy.continuation.maximumCoarseFineScaledTangentDisagreement
      && continuation.maximumAcceptedNodeStepScaledInfinityNorm
        <= policy.continuation.maximumAcceptedNodeStepScaledInfinityNorm
      && continuation.maximumPredictorCorrectionScaledInfinityNorm
        <= policy.continuation.maximumPredictorCorrectionScaledInfinityNorm
      && prohibitedOperationsAbsent;
    const guard = policy.fiftyPercentGuard;
    const fiftyPercentGuardPass = hardGatePass
      && nodeAudits.every((audit) => audit.fiftyPercentGuardPass)
      && continuation.completed
      && continuation.maximumCoarseFineScaledTangentDisagreement
        <= guard.upperThresholdMultiplier
          * policy.continuation.maximumCoarseFineScaledTangentDisagreement
      && continuation.maximumAcceptedNodeStepScaledInfinityNorm
        <= guard.upperThresholdMultiplier
          * policy.continuation.maximumAcceptedNodeStepScaledInfinityNorm
      && continuation.maximumPredictorCorrectionScaledInfinityNorm
        <= guard.upperThresholdMultiplier
          * policy.continuation.maximumPredictorCorrectionScaledInfinityNorm;
    const refinementTrigger = fiftyPercentGuardPass
      ? "none"
      : hardGatePass
        ? "fifty-percent-guard-not-met"
        : "hard-failure";
    attempts.push(Object.freeze({
      refinementFactor,
      continuation,
      nodeAudits: Object.freeze(nodeAudits),
      hardGatePass,
      fiftyPercentGuardPass,
      refinementTrigger,
    }));
    if (fiftyPercentGuardPass) {
      selectedAttemptIndex = attempts.length - 1;
      break;
    }
  }
  return Object.freeze({
    edge,
    pathRole,
    direction,
    sourceNodeId,
    destinationNodeId,
    sourceNode,
    sourceLedger,
    destinationLedger,
    attempts: Object.freeze(attempts),
    selectedAttemptIndex,
  });
}

function finalizePath(
  context: GraphContext,
  raw: RawAdaptivePath,
  canonicalDestination: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  endpointTolerance: number,
): PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1 {
  const selectedAttempt = raw.selectedAttemptIndex === null
    ? null
    : raw.attempts[raw.selectedAttemptIndex];
  const selectedContinuation = selectedAttempt?.continuation.completed === true
    ? selectedAttempt.continuation
    : null;
  const destinationAgreementScaledInfinityNorm = selectedContinuation === null
    ? null
    : scaledInfinityDistance(
      selectedContinuation.endpoint.node.unknowns,
      canonicalDestination.unknowns,
      context.session.layout.unknownScales,
    );
  const firstGuardPassingAttemptIndex = raw.attempts.findIndex(
    (attempt) => attempt.fiftyPercentGuardPass,
  );
  const firstGuardPassingFactor = firstGuardPassingAttemptIndex < 0
    ? null
    : raw.attempts[firstGuardPassingAttemptIndex].refinementFactor;
  const selectedRefinementFactor = selectedAttempt?.refinementFactor ?? null;
  const declaredFactors =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
      .continuation.refinementFactors;
  const prefixMatches = raw.attempts.every(
    (attempt, index) => attempt.refinementFactor === declaredFactors[index],
  );
  const everyAttemptUsesExactSource = raw.attempts.every((attempt) => {
    const continuation = attempt.continuation;
    const first = "nodes" in continuation
      ? continuation.nodes[0]
      : continuation.acceptedNodes[0];
    return first !== undefined
      && Object.is(first.node, raw.sourceNode)
      && numericRecordExact(
        continuation.sourceBloodVolumesM3,
        raw.sourceLedger.bloodVolumesM3,
      )
      && numericRecordExact(
        first.bloodVolumesM3,
        raw.sourceLedger.bloodVolumesM3,
      );
  });
  const stoppingRuleAuditPass = raw.selectedAttemptIndex === null
    ? raw.attempts.length === declaredFactors.length
      && firstGuardPassingAttemptIndex < 0
    : raw.attempts.length === raw.selectedAttemptIndex + 1
      && raw.selectedAttemptIndex === firstGuardPassingAttemptIndex;
  const selectionRuleAuditPass = prefixMatches
    && raw.attempts.length > 0
    && raw.attempts.length <= declaredFactors.length
    && everyAttemptUsesExactSource
    && raw.selectedAttemptIndex === (
      firstGuardPassingAttemptIndex < 0 ? null : firstGuardPassingAttemptIndex
    )
    && raw.attempts.every((attempt, index) =>
      index >= raw.attempts.length - 1 || attempt.refinementTrigger !== "none")
    && (selectedAttempt === null || selectedAttempt.refinementTrigger === "none")
    && stoppingRuleAuditPass;
  const accepted = selectedContinuation !== null
    && selectionRuleAuditPass
    && destinationAgreementScaledInfinityNorm !== null
    && destinationAgreementScaledInfinityNorm <= endpointTolerance;
  return Object.freeze({
    edgeId: raw.edge.edgeId,
    edgeClass: raw.edge.edgeClass,
    pathRole: raw.pathRole,
    direction: raw.direction,
    sourceNodeId: raw.sourceNodeId,
    destinationNodeId: raw.destinationNodeId,
    attempts: raw.attempts,
    selectedAttemptIndex: raw.selectedAttemptIndex,
    selectedRefinementFactor,
    firstGuardPassingFactor,
    selectionRuleAuditPass,
    destinationAgreementScaledInfinityNorm,
    accepted,
    declaredRollbackUnknownsOnFailure: raw.sourceNode.unknowns,
    hiddenSubdivisionApplied: false,
    pseudoArclengthApplied: false,
    etaHomotopyRescueApplied: false,
    rootRankingApplied: false,
  });
}

function selectedEndpoint(
  raw: RawAdaptivePath,
): PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1["endpoint"] | null {
  if (raw.selectedAttemptIndex === null) return null;
  const continuation = raw.attempts[raw.selectedAttemptIndex]?.continuation;
  return continuation?.completed === true ? continuation.endpoint : null;
}

function buildExpectedSGrid(
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

export function buildPhaseB1EtaOneFiniteVolumeLedgerV1(
  anchorBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  node: PhaseB1EtaOneFiniteVolumeGraphNodeV1,
): PhaseB1EtaOneFiniteVolumeLedgerV1 {
  const leftVentricularVolumeM3 = anchorBloodVolumesM3.LV
    * node.leftVentricularVolumeMultiplier;
  const rightVentricularVolumeM3 = anchorBloodVolumesM3.RV
    * node.rightVentricularVolumeMultiplier;
  const deltaLeftVentricularVolumeM3 =
    leftVentricularVolumeM3 - anchorBloodVolumesM3.LV;
  const deltaRightVentricularVolumeM3 =
    rightVentricularVolumeM3 - anchorBloodVolumesM3.RV;
  const bloodVolumesM3 = Object.freeze({
    ...anchorBloodVolumesM3,
    LV: leftVentricularVolumeM3,
    RV: rightVentricularVolumeM3,
    PV: anchorBloodVolumesM3.PV - deltaLeftVentricularVolumeM3,
    SV: anchorBloodVolumesM3.SV - deltaRightVentricularVolumeM3,
  });
  return buildLedgerAtVolumes(
    anchorBloodVolumesM3,
    node.nodeId,
    bloodVolumesM3,
  );
}

function buildLedgerAtVolumes(
  anchorBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  nodeId: string,
  bloodVolumesM3Input: Readonly<Record<BloodCompartmentId, number>>,
): PhaseB1EtaOneFiniteVolumeLedgerV1 {
  const bloodVolumesM3 = Object.freeze({ ...bloodVolumesM3Input });
  const deltaLeftVentricularVolumeM3 =
    bloodVolumesM3.LV - anchorBloodVolumesM3.LV;
  const deltaRightVentricularVolumeM3 =
    bloodVolumesM3.RV - anchorBloodVolumesM3.RV;
  const anchorTotalBloodVolumeM3 = totalBloodVolume(anchorBloodVolumesM3);
  const nodeTotalBloodVolumeM3 = totalBloodVolume(bloodVolumesM3);
  const totalBloodVolumeDifferenceM3 =
    nodeTotalBloodVolumeM3 - anchorTotalBloodVolumeM3;
  const relativeTotalBloodVolumeDifference = Math.abs(
    totalBloodVolumeDifferenceM3,
  ) / anchorTotalBloodVolumeM3;
  const allVolumesPositive = BLOOD_COMPARTMENT_IDS.every(
    (compartmentId) => bloodVolumesM3[compartmentId] > 0,
  );
  const unchangedCompartmentsExact = bloodVolumesM3.LA === anchorBloodVolumesM3.LA
    && bloodVolumesM3.RA === anchorBloodVolumesM3.RA
    && bloodVolumesM3.SA === anchorBloodVolumesM3.SA
    && bloodVolumesM3.PA === anchorBloodVolumesM3.PA;
  const complementLedgerExact = bloodVolumesM3.PV
      === anchorBloodVolumesM3.PV - deltaLeftVentricularVolumeM3
    && bloodVolumesM3.SV
      === anchorBloodVolumesM3.SV - deltaRightVentricularVolumeM3;
  const accepted = allVolumesPositive
    && unchangedCompartmentsExact
    && complementLedgerExact
    && relativeTotalBloodVolumeDifference
      <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .totalBloodVolumeRelativeTolerance;
  return Object.freeze({
    nodeId,
    bloodVolumesM3,
    deltaLeftVentricularVolumeM3,
    deltaRightVentricularVolumeM3,
    anchorTotalBloodVolumeM3,
    nodeTotalBloodVolumeM3,
    totalBloodVolumeDifferenceM3,
    relativeTotalBloodVolumeDifference,
    allVolumesPositive,
    unchangedCompartmentsExact,
    complementLedgerExact,
    accepted,
  });
}

function buildGraphContext(
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): GraphContext {
  if (
    stitch.stitchId
      !== PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID
    || !stitch.phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass
    || stitch.phaseB1LandCoupledFiniteVolumeGraphPass
  ) throw new Error("finite-volume graph requires the exact unpromoted eta-one stitch");
  const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(
    stitch.slsMode,
    sha256Hex,
  );
  if (
    session.solverId !== PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID
    || session.slsMode !== stitch.slsMode
  ) throw new Error("finite-volume graph fixed-volume solver identity drifted");
  const center = stitch.etaOne.node;
  if (
    center.eta !== 1
    || center.endpoint.timeSec !== 0
    || !numericRecordExact(
      center.endpoint.differentialState.bloodVolumesM3,
      session.anchorFixedInputs.bloodVolumesM3,
    )
    || !numericRecordExact(
      center.endpoint.differentialState.inertialFlowsM3PerSec,
      session.anchorFixedInputs.inertialFlowsM3PerSec,
    )
    || !deepExact(
      center.endpoint.differentialState.calciumByWall,
      session.anchorFixedInputs.calciumByWall,
    )
  ) throw new Error("finite-volume graph center fixed state drifted");
  return Object.freeze({
    stitch,
    session,
    anchorBloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
    anchorTotalBloodVolumeM3: session.anchorFixedInputs.totalBloodVolumeM3,
  });
}

function auditNode(
  context: GraphContext,
  nodeId: string,
  ledger: PhaseB1EtaOneFiniteVolumeLedgerV1,
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
): PhaseB1EtaOneFiniteVolumeNodeAuditV1 {
  const policy = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1;
  const state = node.endpoint.differentialState;
  const etaOneExact = node.eta === policy.eta
    && node.residualEvaluation.eta === policy.eta;
  const fixedStateExact = node.endpoint.timeSec === policy.timeSec
    && state.slsMode === context.session.slsMode
    && numericRecordExact(state.bloodVolumesM3, ledger.bloodVolumesM3)
    && numericRecordExact(
      state.inertialFlowsM3PerSec,
      context.session.anchorFixedInputs.inertialFlowsM3PerSec,
    )
    && deepExact(
      state.calciumByWall,
      context.session.anchorFixedInputs.calciumByWall,
    );
  const landIdentityAudit = auditLandIdentity(node);
  const triSeg = node.effectiveTriSegAudit;
  const effectiveTriSegRestoringPass = triSeg.accepted
    && triSeg.classification === "robust-restoring"
    && triSeg.sigmaMinimum >= policy.gates.minimumEffectiveTriSegSigma
    && triSeg.conditionNumber2 <= policy.gates.maximumEffectiveTriSegConditionNumber2
    && triSeg.robustSignedMargin >= policy.gates.minimumStaticRestoringMargin
    && triSeg.schurToReequilibratedDifferenceTwoNorm
      <= policy.gates.maximumSchurToReequilibratedDifferenceTwoNorm
    && triSeg.withinPublishedTaylorTwoPercentTensionErrorDomain;
  const thresholdMetricsFinite = Number.isFinite(
    node.scaledResidualInfinityNorm,
  )
    && Number.isFinite(node.scaledUpdateInfinityNorm)
    && Number.isFinite(node.maximumLocalMaterialResidualInfinityNorm)
    && Number.isFinite(node.minimumLandSimplexMargin)
    && Number.isFinite(triSeg.sigmaMinimum)
    && Number.isFinite(triSeg.conditionNumber2)
    && Number.isFinite(triSeg.robustSignedMargin)
    && Number.isFinite(triSeg.schurToReequilibratedDifferenceTwoNorm)
    && node.unknowns.every(Number.isFinite)
    && node.residualEvaluation.residual.every(Number.isFinite);
  const thresholdNormMetricsNonnegative = node.scaledResidualInfinityNorm >= 0
    && node.scaledUpdateInfinityNorm >= 0
    && node.maximumLocalMaterialResidualInfinityNorm >= 0
    && triSeg.sigmaMinimum >= 0
    && triSeg.conditionNumber2 >= 0
    && triSeg.schurToReequilibratedDifferenceTwoNorm >= 0;
  const prohibitedOperationsAbsent = !node.projectionApplied
    && !node.clippingApplied
    && !node.fallbackApplied
    && !node.residualEvaluation.projectionApplied
    && !node.residualEvaluation.clippingApplied;
  const hardGatePass = ledger.accepted
    && etaOneExact
    && fixedStateExact
    && thresholdMetricsFinite
    && thresholdNormMetricsNonnegative
    && node.scaledResidualInfinityNorm
      <= policy.gates.maximumScaledResidualInfinityNorm
    && node.scaledUpdateInfinityNorm
      <= policy.gates.maximumScaledUpdateInfinityNorm
    && node.maximumLocalMaterialResidualInfinityNorm
      <= policy.gates.maximumLocalMaterialResidualInfinityNorm
    && node.minimumLandSimplexMargin >= policy.gates.minimumLandSimplexMargin
    && effectiveTriSegRestoringPass
    && landIdentityAudit.pass
    && prohibitedOperationsAbsent;
  const guard = policy.fiftyPercentGuard;
  const fiftyPercentGuardPass = hardGatePass
    && node.scaledResidualInfinityNorm
      <= guard.upperThresholdMultiplier * policy.gates.maximumScaledResidualInfinityNorm
    && node.scaledUpdateInfinityNorm
      <= guard.upperThresholdMultiplier * policy.gates.maximumScaledUpdateInfinityNorm
    && node.maximumLocalMaterialResidualInfinityNorm
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumLocalMaterialResidualInfinityNorm
    && node.minimumLandSimplexMargin
      >= guard.lowerThresholdMultiplier * policy.gates.minimumLandSimplexMargin
    && triSeg.sigmaMinimum
      >= guard.lowerThresholdMultiplier * policy.gates.minimumEffectiveTriSegSigma
    && triSeg.conditionNumber2
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumEffectiveTriSegConditionNumber2
    && triSeg.robustSignedMargin
      >= guard.lowerThresholdMultiplier * policy.gates.minimumStaticRestoringMargin
    && triSeg.schurToReequilibratedDifferenceTwoNorm
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumSchurToReequilibratedDifferenceTwoNorm
    && landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumAssembledToRawLandActiveDifferencePa;
  return Object.freeze({
    nodeId,
    ledger,
    node,
    etaOneExact,
    fixedStateExact,
    effectiveTriSegRestoringPass,
    landIdentityAudit,
    thresholdMetricsFinite,
    thresholdNormMetricsNonnegative,
    prohibitedOperationsAbsent,
    hardGatePass,
    fiftyPercentGuardPass,
  });
}

function auditLandIdentity(
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
): PhaseB1EtaOneLandIdentityAuditV1 {
  const wallByWall = Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => {
    const wall = node.residualEvaluation.closedLoop.wallMechanics[wallId];
    const assembledActiveStressPa = wall.totalKirchhoffStressPa
      - wall.equilibriumPassive.equilibriumKirchhoffStressPa
      - wall.slsOverstressPa;
    const rawLandActiveStressPa = wall.activeKirchhoffStressPa;
    return [wallId, Object.freeze({
      rawLandActiveStressPa,
      assembledActiveStressPa,
      absoluteDifferencePa: Math.abs(
        assembledActiveStressPa - rawLandActiveStressPa,
      ),
    })];
  }))) as Readonly<Record<FourChamberWallId, Readonly<{
    rawLandActiveStressPa: number;
    assembledActiveStressPa: number;
    absoluteDifferencePa: number;
  }>>>;
  const maximumAssembledToRawLandActiveDifferencePa = Math.max(
    ...WALL_IDS.map((wallId) => wallByWall[wallId].absoluteDifferencePa),
  );
  return Object.freeze({
    wallByWall,
    maximumAssembledToRawLandActiveDifferencePa,
    pass: Number.isFinite(maximumAssembledToRawLandActiveDifferencePa)
      && maximumAssembledToRawLandActiveDifferencePa >= 0
      && WALL_IDS.every((wallId) => {
        const wall = wallByWall[wallId];
        return Number.isFinite(wall.rawLandActiveStressPa)
          && Number.isFinite(wall.assembledActiveStressPa)
          && Number.isFinite(wall.absoluteDifferencePa)
          && wall.absoluteDifferencePa >= 0;
      })
      && maximumAssembledToRawLandActiveDifferencePa
        <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
          .maximumAssembledToRawLandActiveDifferencePa,
  });
}

function auditCenterReplay(
  context: GraphContext,
  canonicalCenter: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
): PhaseB1EtaOneFiniteVolumeCenterReplayAuditV1 {
  const center = context.stitch.etaOne.node;
  const replayedResidual = context.session.evaluateResidualVectorAtVolumes({
    bloodVolumesM3: context.anchorBloodVolumesM3,
    unknowns: center.unknowns,
  });
  const expected = center.residualEvaluation.residual;
  if (replayedResidual.length !== expected.length) {
    throw new Error("finite-volume graph center residual dimension drifted");
  }
  const maximumAbsoluteResidualReplayDifference = Math.max(
    ...replayedResidual.map((value, index) => Math.abs(value - expected[index])),
  );
  const centerNodePreservedByObjectIdentity = Object.is(canonicalCenter, center);
  return Object.freeze({
    centerNodePreservedByObjectIdentity,
    replayedResidual: Object.freeze([...replayedResidual]),
    maximumAbsoluteResidualReplayDifference,
    pass: centerNodePreservedByObjectIdentity
      && maximumAbsoluteResidualReplayDifference === 0,
  });
}

function auditNodeCensus(
  context: GraphContext,
  nodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
  ledger: PhaseB1EtaOneFiniteVolumeLedgerV1,
  trackedNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
): PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1 {
  const declared = context.session.runDeclaredRootCensusAtVolumes({
    bloodVolumesM3: ledger.bloodVolumesM3,
    seedOrder: "declared",
  });
  const reverse = context.session.runDeclaredRootCensusAtVolumes({
    bloodVolumesM3: ledger.bloodVolumesM3,
    seedOrder: "reverse",
  });
  const clusterSetsBijective = censusClusterSetsBijective(
    declared,
    reverse,
    context.session.layout.unknownScales,
  );
  const declaredInventoryPass = censusInventoryPass(
    declared,
    "declared",
    ledger,
    context,
  );
  const reverseInventoryPass = censusInventoryPass(
    reverse,
    "reverse",
    ledger,
    context,
  );
  const declaredTrackedRestoringClusterCount = matchingRestoringClusterCount(
    declared,
    trackedNode.unknowns,
    context.session.layout.unknownScales,
  );
  const reverseTrackedRestoringClusterCount = matchingRestoringClusterCount(
    reverse,
    trackedNode.unknowns,
    context.session.layout.unknownScales,
  );
  const trackedCanonicalMatchesExactlyOneRestoringCluster =
    declaredTrackedRestoringClusterCount === 1
    && reverseTrackedRestoringClusterCount === 1;
  const censusBasePass = (census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1) =>
    census.eta === 1
    && census.enumerationCompleted
    && census.allSeedsAttempted
    && census.allSeedsConverged
    && census.convergedResultsPartitionedExactlyOnce
    && census.allClusterMembersWithinFullVectorTolerance
    && census.allClusterMemberClassificationsMatch
    && census.allDiscoveredRootsReported
    && !census.selectionInputToAcceptedPath
    && !census.globalExhaustivenessClaimed;
  return Object.freeze({
    nodeId,
    declared,
    reverse,
    clusterSetsBijective,
    declaredInventoryPass,
    reverseInventoryPass,
    declaredTrackedRestoringClusterCount,
    reverseTrackedRestoringClusterCount,
    trackedCanonicalMatchesExactlyOneRestoringCluster,
    pass: censusBasePass(declared)
      && censusBasePass(reverse)
      && declaredInventoryPass
      && reverseInventoryPass
      && clusterSetsBijective
      && trackedCanonicalMatchesExactlyOneRestoringCluster,
  });
}

function censusInventoryPass(
  census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  expectedSeedOrder: "declared" | "reverse",
  ledger: PhaseB1EtaOneFiniteVolumeLedgerV1,
  context: GraphContext,
): boolean {
  const declaredSeeds =
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds;
  const expectedSeeds = expectedSeedOrder === "declared"
    ? declaredSeeds
    : [...declaredSeeds].reverse();
  const convergedResultIndices = census.results.flatMap((result, index) =>
    result.converged ? [index] : []);
  const clusteredResultIndices = census.clusters.flatMap(
    (cluster) => cluster.memberResultIndices,
  );
  const clusteredResultIndexSet = new Set(clusteredResultIndices);
  const clusterInventoryPass = census.clusters.length > 0
    && census.clusters.every((cluster) => {
      const representative = census.results[cluster.representativeResultIndex];
      return Number.isInteger(cluster.representativeResultIndex)
        && representative?.converged === true
        && cluster.memberResultIndices.length > 0
        && cluster.memberResultIndices.includes(cluster.representativeResultIndex)
        && cluster.memberResultIndices.every((resultIndex) =>
          Number.isInteger(resultIndex)
          && resultIndex >= 0
          && resultIndex < census.results.length
          && census.results[resultIndex]?.converged === true)
        && representative.effectiveTriSegAudit.classification
          === cluster.classification
        && deepExact(
          representative.endpoint.triSegCoordinates,
          cluster.coordinates,
        )
        && Number.isFinite(cluster.maximumMemberScaledInfinityDistance)
        && cluster.maximumMemberScaledInfinityDistance >= 0;
    });
  const resultInventoryPass = census.results.length === census.seeds.length
    && census.convergedRootCount === convergedResultIndices.length
    && census.results.every((result) => result.eta === 1
      && (!result.converged || (
        result.endpoint.differentialState.slsMode === context.session.slsMode
        && numericRecordExact(
          result.endpoint.differentialState.bloodVolumesM3,
          ledger.bloodVolumesM3,
        )
      )));
  const partitionInventoryPass = clusteredResultIndices.length
      === convergedResultIndices.length
    && clusteredResultIndexSet.size === clusteredResultIndices.length
    && convergedResultIndices.every((index) => clusteredResultIndexSet.has(index));
  return census.seedOrder === expectedSeedOrder
    && census.seeds.length === declaredSeeds.length
    && deepExact(census.seeds, expectedSeeds)
    && resultInventoryPass
    && clusterInventoryPass
    && partitionInventoryPass;
}

function censusClusterSetsBijective(
  declared: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  reverse: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  scales: readonly number[],
): boolean {
  if (declared.clusters.length !== reverse.clusters.length) return false;
  const consumed = new Set<number>();
  for (const cluster of declared.clusters) {
    const representative = declared.results[cluster.representativeResultIndex];
    if (representative?.converged !== true) return false;
    const matches = reverse.clusters.flatMap((candidate, candidateIndex) => {
      const candidateRepresentative = reverse.results[candidate.representativeResultIndex];
      return candidateRepresentative?.converged === true
        && candidate.classification === cluster.classification
        && scaledInfinityDistance(
          representative.unknowns,
          candidateRepresentative.unknowns,
          scales,
        ) <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
          .rootClusteringScaledInfinityTolerance
        ? [candidateIndex]
        : [];
    });
    if (matches.length !== 1 || consumed.has(matches[0])) return false;
    consumed.add(matches[0]);
  }
  return consumed.size === reverse.clusters.length;
}

function matchingRestoringClusterCount(
  census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  trackedUnknowns: readonly number[],
  scales: readonly number[],
): number {
  return census.clusters.filter((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    return representative?.converged === true
      && cluster.classification === "robust-restoring"
      && scaledInfinityDistance(
        representative.unknowns,
        trackedUnknowns,
        scales,
      ) <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .rootClusteringScaledInfinityTolerance;
  }).length;
}

function requireEtaOneNode(
  node: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1["etaOne"]["node"],
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  if (node.converged !== true || node.eta !== 1) {
    throw new Error("finite-volume graph center is not a converged eta-one node");
  }
  return node as PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
}

function requireLedger(
  ledgerByNodeId: ReadonlyMap<
    PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
    PhaseB1EtaOneFiniteVolumeLedgerV1
  >,
  nodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
): PhaseB1EtaOneFiniteVolumeLedgerV1 {
  const ledger = ledgerByNodeId.get(nodeId);
  if (ledger === undefined) {
    throw new Error(`finite-volume graph ledger absent for ${nodeId}`);
  }
  return ledger;
}

function requireCanonicalNode(
  nodeById: ReadonlyMap<
    PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
    PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1
  >,
  nodeId: PhaseB1EtaOneFiniteVolumeGraphNodeIdV1,
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  const node = nodeById.get(nodeId);
  if (node === undefined) {
    throw new Error(`finite-volume graph canonical node absent for ${nodeId}`);
  }
  return node;
}

function requireRawPath(
  pathByEdgeId: ReadonlyMap<string, RawAdaptivePath>,
  edgeId: string,
): RawAdaptivePath {
  const path = pathByEdgeId.get(edgeId);
  if (path === undefined) {
    throw new Error(`finite-volume graph preliminary path absent for ${edgeId}`);
  }
  return path;
}

function maximumNullable(values: readonly (number | null)[]): number | null {
  if (
    values.length === 0
    || values.some((value) => value === null || !Number.isFinite(value))
  ) return null;
  return Math.max(...values as readonly number[]);
}

function arrayExact(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function totalBloodVolume(
  volumes: Readonly<Record<BloodCompartmentId, number>>,
): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartmentId) => sum + volumes[compartmentId],
    0,
  );
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("finite-volume graph scaled distance dimension mismatch");
  }
  if (
    left.some((value) => !Number.isFinite(value))
    || right.some((value) => !Number.isFinite(value))
    || scales.some((scale) => !Number.isFinite(scale) || scale <= 0)
  ) return Number.POSITIVE_INFINITY;
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function numericRecordExact(left: object, right: object): boolean {
  const leftRecord = left as Readonly<Record<string, number>>;
  const rightRecord = right as Readonly<Record<string, number>>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(rightRecord, key)
      && leftRecord[key] === rightRecord[key]);
}

function deepExact(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || left === null
    || typeof right !== "object" || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => deepExact(value, right[index]));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(rightRecord, key)
      && deepExact(leftRecord[key], rightRecord[key]));
}
