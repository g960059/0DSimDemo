import type { CanonicalSha256HexProvider } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  createPhaseB0HydromechanicsInitialStateV1,
  evaluatePhaseB0HydromechanicsStateV1,
  PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID,
  type PhaseB0HydromechanicsStateV1,
  type PhaseB0SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  auditPhaseB0PublishedTriSegMultiStartV1,
  PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
  solvePhaseB0PublishedTriSegRootV1,
  type PhaseB0PublishedTriSegRootInputV1,
  type PhaseB0PublishedTriSegRootResultV1,
  type PhaseB0PublishedTriSegRootSuccessV1,
  type PhaseB0TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
  PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID,
  type PhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  auditPhaseB0TriSegNaturalParameterContinuationV1,
  buildPhaseB0TriSegLinearLoadPathV1,
  PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
  scaledPhaseB0TriSegCoordinateDistanceV1,
  type PhaseB0TriSegNaturalParameterContinuationAuditV1,
  type PhaseB0TriSegNaturalParameterContinuationPolicyV1,
  type PhaseB0TriSegNaturalParameterPathRootInputV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";
import {
  auditPhaseB0TriSegStaticRestoringRootV1,
  PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
  type PhaseB0TriSegStaticRestoringAuditV1,
  type PhaseB0TriSegStaticRestoringClassV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import {
  buildPhaseB0TriSegStaticRestoringGateManifestV1,
  PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import {
  PHASE_B0_VALVE_FLOW_IDS_V1,
  PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID,
  buildPhaseB0ValveNumericalPolicyCandidateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/valveNumericalPolicyV1";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  BLOOD_COMPARTMENT_IDS,
  type BloodCompartmentId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import type { PublishedTriSegGeometryV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";

export const PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID =
  "phase-b0-published-taylor-triseg-finite-supported-envelope-v1" as const;

export type PhaseB0TriSegEnvelopeNodeIdV1 =
  | "C" | "SW" | "W" | "NW" | "N" | "NE" | "E" | "SE" | "S";

export type PhaseB0TriSegEnvelopeNodeV1 = Readonly<{
  nodeId: PhaseB0TriSegEnvelopeNodeIdV1;
  leftVentricularVolumeMultiplier: 0.99 | 1 | 1.01;
  rightVentricularVolumeMultiplier: 0.99 | 1 | 1.01;
}>;

export type PhaseB0TriSegEnvelopeEdgeV1 = Readonly<{
  edgeId: string;
  edgeClass: "center-spoke" | "perimeter";
  fromNodeId: PhaseB0TriSegEnvelopeNodeIdV1;
  toNodeId: PhaseB0TriSegEnvelopeNodeIdV1;
}>;

const node = (
  nodeId: PhaseB0TriSegEnvelopeNodeIdV1,
  leftVentricularVolumeMultiplier: 0.99 | 1 | 1.01,
  rightVentricularVolumeMultiplier: 0.99 | 1 | 1.01,
): PhaseB0TriSegEnvelopeNodeV1 => Object.freeze({
  nodeId,
  leftVentricularVolumeMultiplier,
  rightVentricularVolumeMultiplier,
});

export const PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1 = Object.freeze([
  node("C", 1, 1),
  node("SW", 0.99, 0.99),
  node("W", 0.99, 1),
  node("NW", 0.99, 1.01),
  node("N", 1, 1.01),
  node("NE", 1.01, 1.01),
  node("E", 1.01, 1),
  node("SE", 1.01, 0.99),
  node("S", 1, 0.99),
] as const);

const PERIMETER_NODE_IDS = Object.freeze([
  "SW", "W", "NW", "N", "NE", "E", "SE", "S",
] as const);

export const PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1 = Object.freeze([
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
] as const satisfies readonly PhaseB0TriSegEnvelopeEdgeV1[]);

export const PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1 = Object.freeze({
  timeSec: 0 as const,
  slsModes: Object.freeze(["on", "off"] as const),
  volumeAxes: Object.freeze({
    leftVentricle: Object.freeze({
      definition: "u_LV=V_LV/V_LV_anchor" as const,
      multipliers: Object.freeze([0.99, 1, 1.01] as const),
      closedLedgerComplement: "PV" as const,
    }),
    rightVentricle: Object.freeze({
      definition: "u_RV=V_RV/V_RV_anchor" as const,
      multipliers: Object.freeze([0.99, 1, 1.01] as const),
      closedLedgerComplement: "SV" as const,
    }),
    unchangedCompartments: Object.freeze(["LA", "RA", "SA", "PA"] as const),
    interpretation:
      "static-closed-ledger-load-bookkeeping-not-a-dynamic-filling-path" as const,
  }),
  adaptiveRefinement: Object.freeze({
    refinementFactors: Object.freeze([2, 4, 8, 16, 32] as const),
    selectionRule: "first-hard-pass-with-50pct-guard" as const,
    refineOnlyOn: "hard-failure-or-guard-not-met" as const,
    upperThresholdGuardMultiplier: 0.5 as const,
    lowerThresholdGuardMultiplier: 2 as const,
    allAttemptsRecorded: true as const,
    unrecordedSubdivisionAllowed: false as const,
    pseudoArclengthRescueAllowed: false as const,
  }),
  rootEnumeration: Object.freeze({
    seeds: Object.freeze([
      Object.freeze({ septalMidwallCapVolumeM3: -2e-6, junctionRadiusM: 0.028 }),
      Object.freeze({ septalMidwallCapVolumeM3: 0, junctionRadiusM: 0.03 }),
      Object.freeze({ septalMidwallCapVolumeM3: 2e-6, junctionRadiusM: 0.032 }),
    ] as const),
    scaledClusteringTolerance: 1e-8 as const,
    everySeedMustConverge: true as const,
    everyDiscoveredClusterReported: true as const,
    globalExhaustivenessClaimed: false as const,
  }),
  gates: Object.freeze({
    maximumScaledRootResidualInfinityNorm: 1e-8 as const,
    maximumScaledRootUpdateInfinityNorm: 1e-8 as const,
    minimumRootJacobianSigmaMinimum: 1e-3 as const,
    maximumRootJacobianConditionNumber2: 1e3 as const,
    minimumRobustRestoringMargin: 1e-3 as const,
    maximumGeneralizedForceTransformAuditDifference2: 1e-6 as const,
    endpointAgreementScaledInfinityTolerance: 1e-6 as const,
    reverseClosureScaledInfinityTolerance: 1e-6 as const,
    totalBloodVolumeRelativeTolerance: 4096 * Number.EPSILON,
    publishedTaylorDomain: "within_2pct_tension_error_domain" as const,
  }),
  algorithmicJacobianSensitivity: Object.freeze({
    constructionScaledStep: 2 ** -19,
    independentComparisonScaledStep: 2 ** -21,
    endpointAgreementScaledInfinityTolerance: 1e-6,
  }),
  valveSmoothingSensitivity: Object.freeze({
    pressureGateWidthsPa: Object.freeze([10, 20, 40] as const),
    flowSmoothingM3PerSec: Object.freeze([0.5e-9, 1e-9, 2e-9] as const),
    claim: "static-structural-independence-only" as const,
    biologicalEnvelopeAxis: false as const,
  }),
  prohibitedOperations: Object.freeze({
    projectionApplied: false as const,
    clippingApplied: false as const,
    nearestRootSelectionApplied: false as const,
    minimumResidualRootSelectionApplied: false as const,
    maximumJunctionRadiusRootSelectionApplied: false as const,
    forcedPreviousSeptumApplied: false as const,
    pseudoArclengthRescueApplied: false as const,
    hiddenSubdivisionApplied: false as const,
  }),
  claimBoundary: Object.freeze({
    continuousRectangleInteriorEstablished: false as const,
    globalRootUniquenessEstablished: false as const,
    energeticOrThermodynamicStabilityEstablished: false as const,
    phaseB0OverallAcceptanceEstablished: false as const,
    phaseB1LandCoupledVolumeEnvelopeEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    fullBeatEstablished: false as const,
    releaseRuntimeReachable: false as const,
  }),
} as const);

export type PhaseB0TriSegEnvelopeLedgerV1 = Readonly<{
  nodeId: string;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  anchorTotalBloodVolumeM3: number;
  nodeTotalBloodVolumeM3: number;
  totalBloodVolumeDifferenceM3: number;
  relativeTotalBloodVolumeDifference: number;
  allVolumesPositive: boolean;
  unchangedCompartmentsExact: boolean;
  accepted: boolean;
}>;

export type PhaseB0TriSegEnvelopeNodeAuditV1 = Readonly<{
  nodeId: string;
  coordinates: PhaseB0TriSegCoordinatesV1;
  root: PhaseB0PublishedTriSegRootSuccessV1;
  staticAudit: PhaseB0TriSegStaticRestoringAuditV1;
  independentJacobianStepAudit: Readonly<{
    scaledStep: number;
    initialCoordinates: PhaseB0TriSegCoordinatesV1;
    root: PhaseB0PublishedTriSegRootResultV1;
    coordinateAgreementScaledInfinityNorm: number | null;
    classification: PhaseB0TriSegStaticRestoringClassV1 | null;
    classificationMatches: boolean;
    pass: boolean;
  }>;
  ledger: PhaseB0TriSegEnvelopeLedgerV1;
  taylorDomainPass: boolean;
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
}>;

export type PhaseB0TriSegEnvelopePathAttemptV1 = Readonly<{
  refinementFactor: 2 | 4 | 8 | 16 | 32;
  continuation: PhaseB0TriSegNaturalParameterContinuationAuditV1;
  nodeAudits: readonly PhaseB0TriSegEnvelopeNodeAuditV1[];
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
  refinementTrigger: "none" | "hard-failure" | "fifty-percent-guard-not-met";
}>;

export type PhaseB0TriSegEnvelopeDirectedEdgeAuditV1 = Readonly<{
  edgeId: string;
  edgeClass: "center-spoke" | "perimeter";
  direction: "forward" | "reverse";
  sourceNodeId: PhaseB0TriSegEnvelopeNodeIdV1;
  destinationNodeId: PhaseB0TriSegEnvelopeNodeIdV1;
  attempts: readonly PhaseB0TriSegEnvelopePathAttemptV1[];
  selectedAttemptIndex: number | null;
  selectedRefinementFactor: 2 | 4 | 8 | 16 | 32 | null;
  firstGuardPassingFactor: 2 | 4 | 8 | 16 | 32 | null;
  selectionRuleAuditPass: boolean;
  destinationAgreementScaledInfinityNorm: number | null;
  accepted: boolean;
  rollbackCoordinatesOnFailure: PhaseB0TriSegCoordinatesV1;
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  rootRankingApplied: false;
}>;

export type PhaseB0TriSegEnvelopeRootCensusV1 = Readonly<{
  nodeId: PhaseB0TriSegEnvelopeNodeIdV1;
  seedCount: 3;
  results: readonly PhaseB0PublishedTriSegRootResultV1[];
  reverseSeedOrderResults: readonly PhaseB0PublishedTriSegRootResultV1[];
  allSeedsAttempted: boolean;
  allSeedsConverged: boolean;
  clusters: readonly Readonly<{
    representativeResultIndex: number;
    memberResultIndices: readonly number[];
    classification: PhaseB0TriSegStaticRestoringClassV1;
    coordinates: PhaseB0TriSegCoordinatesV1;
  }>[];
  acceptedBranchClusterIndex: number | null;
  seedOrderInvariant: boolean;
  allDiscoveredClustersReported: true;
  globalExhaustivenessClaimed: false;
  pass: boolean;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1 = Readonly<{
  protocolId: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID;
  runtimeComponentIds: Readonly<{
    runner: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID;
    rootSolver: typeof PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID;
    sameTimeLevelHydromechanicsEvaluation:
      typeof PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID;
    syntheticCase: typeof PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID;
    staticGateManifest:
      typeof PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID;
    algorithmicJacobian:
      typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID;
    valveNumericalPolicy: typeof PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID;
    publishedTaylorOracle:
      typeof PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID;
    equationAssembly: "published-Taylor-2009";
    localStaticClassifier:
      typeof PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID;
    naturalParameterContinuation:
      typeof PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID;
  }>;
  runtimeComponentIdentityPass: boolean;
  slsMode: PhaseB0SlsModeV1;
  anchorVolumesM3: Readonly<{ LV: number; RV: number }>;
  anchorTotalBloodVolumeM3: number;
  canonicalNodes: readonly PhaseB0TriSegEnvelopeNodeAuditV1[];
  directedEdges: readonly PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[];
  routeClosureAudits: Readonly<{
    centerTriangles: readonly Readonly<{
      triangleId: string;
      clockwiseTraversedEdges:
        readonly PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[];
      counterclockwiseTraversedEdges:
        readonly PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[];
      clockwiseClosureScaledInfinityNorm: number | null;
      counterclockwiseClosureScaledInfinityNorm: number | null;
      pass: boolean;
    }>[];
    perimeterCycles: readonly Readonly<{
      direction: "clockwise" | "counterclockwise";
      traversedEdges: readonly PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[];
      closureScaledInfinityNorm: number | null;
      pass: boolean;
    }>[];
    pass: boolean;
  }>;
  rootCensus: readonly PhaseB0TriSegEnvelopeRootCensusV1[];
  maximumDestinationAgreementScaledInfinityNorm: number | null;
  maximumReverseClosureScaledInfinityNorm: number | null;
  staticValveSmoothingStructuralIndependenceAudit: Readonly<{
    claim: "static-structural-independence-only";
    cases: readonly Readonly<{
      pressureGateWidthPa: 10 | 20 | 40;
      flowSmoothingM3PerSec: 5e-10 | 1e-9 | 2e-9;
      maximumWallStressAbsoluteDifferencePa: number;
      maximumTriSegResidualAbsoluteDifferenceNPerM: number;
      pass: boolean;
    }>[];
    pass: boolean;
  }>;
  finiteDeclaredGraphEnvelopePass: boolean;
  continuousRectangleInteriorPass: false;
  globalRootUniquenessPass: false;
  energeticStabilityPass: false;
  phaseB0OverallAcceptancePass: false;
  phaseB1LandCoupledVolumeEnvelopePass: false;
  physiologicalValidationPass: false;
  releaseRuntimePass: false;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1 = Readonly<{
  probeId: "phase-b0-triseg-finite-envelope-structured-exhaustion-probe-v1";
  slsMode: PhaseB0SlsModeV1;
  direction: "forward" | "reverse";
  edgeId: "spoke-C-NW";
  injectedMaximumRefinementFactor: 2;
  pathEntryCoordinates: PhaseB0TriSegCoordinatesV1;
  attempts: readonly PhaseB0TriSegEnvelopePathAttemptV1[];
  selectedAttemptIndex: null;
  accepted: false;
  rollbackCoordinates: PhaseB0TriSegCoordinatesV1;
  rollbackMatchesDirectionSpecificEntry: boolean;
  rejectedAttemptEndpointCoordinates: PhaseB0TriSegCoordinatesV1;
  rollbackDiffersFromRejectedAttemptEndpoint: boolean;
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  rootRankingApplied: false;
}>;

type RootInputWithoutInitial = Omit<
  PhaseB0PublishedTriSegRootInputV1,
  "initialCoordinates"
>;

type EnvelopeContext = Readonly<{
  fixture: PhaseB0SyntheticHydromechanicsCaseV1;
  baseState: PhaseB0HydromechanicsStateV1;
  anchorTotalBloodVolumeM3: number;
  anchorLoadScales: Readonly<{
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
  }>;
  pathRootInput: PhaseB0TriSegNaturalParameterPathRootInputV1;
  continuationPolicy: PhaseB0TriSegNaturalParameterContinuationPolicyV1;
  staticPolicy: ReturnType<
    typeof buildPhaseB0TriSegStaticRestoringGateManifestV1
  >["workConjugateStaticRestoringClassifier"]["policy"];
  runtimeObjectComponentIds: Readonly<{
    sameTimeLevelHydromechanicsEvaluation:
      typeof PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID;
    syntheticCase: typeof PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID;
    staticGateManifest:
      typeof PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID;
    valveNumericalPolicy: typeof PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID;
    publishedTaylorOracle:
      typeof PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID;
  }>;
}>;

type RawDirectedEdge = Readonly<{
  edge: PhaseB0TriSegEnvelopeEdgeV1;
  direction: "forward" | "reverse";
  sourceNode: PhaseB0TriSegEnvelopeNodeV1;
  destinationNode: PhaseB0TriSegEnvelopeNodeV1;
  sourceCoordinates: PhaseB0TriSegCoordinatesV1;
  attempts: readonly PhaseB0TriSegEnvelopePathAttemptV1[];
  selectedAttemptIndex: number | null;
  rollbackCoordinatesOnExhaustion: PhaseB0TriSegCoordinatesV1;
  lastAttemptEndpointCoordinates: PhaseB0TriSegCoordinatesV1 | null;
}>;

export function runPhaseB0TriSegFiniteSupportedEnvelopeV1(
  slsMode: PhaseB0SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1 {
  const context = buildContext(slsMode, sha256Hex);
  const nodeById = new Map(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1.map(
    (entry) => [entry.nodeId, entry] as const,
  ));
  const centerNode = requireNode(nodeById, "C");
  const centerPoint = absoluteLoadPoint(context, centerNode);
  const centerInitialCoordinates = Object.freeze({
    septalMidwallCapVolumeM3:
      context.fixture.initialState.triSegCoordinates.V_m_S,
    junctionRadiusM: context.fixture.initialState.triSegCoordinates.y_m,
  });
  const centerRootResult = solvePhaseB0PublishedTriSegRootV1({
    ...rootInputAt(context, centerPoint),
    initialCoordinates: centerInitialCoordinates,
  });
  const centerRoot = requireConvergedRoot(centerRootResult, "center anchor");
  const canonicalRootByNode = new Map<
    PhaseB0TriSegEnvelopeNodeIdV1,
    PhaseB0PublishedTriSegRootSuccessV1
  >([["C", centerRoot]]);
  const canonicalIndependentSeedByNode = new Map<
    PhaseB0TriSegEnvelopeNodeIdV1,
    PhaseB0TriSegCoordinatesV1
  >([["C", centerInitialCoordinates]]);
  const preliminarySpokes = new Map<string, RawDirectedEdge>();

  for (const edge of PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1) {
    if (edge.edgeClass !== "center-spoke") continue;
    const destinationNode = requireNode(nodeById, edge.toNodeId);
    const run = runAdaptiveDirectedEdge(
      context,
      edge,
      "forward",
      centerNode,
      destinationNode,
      centerRoot.coordinates,
    );
    preliminarySpokes.set(edge.edgeId, run);
    const endpoint = selectedEndpointRoot(run);
    if (endpoint === null) {
      throw new Error(
        `finite TriSeg envelope could not establish canonical spoke ${edge.edgeId}`,
      );
    }
    canonicalRootByNode.set(destinationNode.nodeId, endpoint);
    const endpointSeed = selectedEndpointPreCorrectionSeed(run);
    if (endpointSeed === null) {
      throw new Error(`missing endpoint predictor for ${edge.edgeId}`);
    }
    canonicalIndependentSeedByNode.set(destinationNode.nodeId, endpointSeed);
  }

  const canonicalNodes = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1.map(
    (entry) => {
      const root = canonicalRootByNode.get(entry.nodeId);
      if (root === undefined) {
        throw new Error(`missing canonical finite-envelope root for ${entry.nodeId}`);
      }
      return auditRootAt(
        context,
        entry.nodeId,
        absoluteLoadPoint(context, entry),
        root,
        requireCanonicalSeed(canonicalIndependentSeedByNode, entry.nodeId),
      );
    },
  );

  const directedEdges: PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[] = [];
  let maximumReverseClosureScaledInfinityNorm = 0;
  for (const edge of PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1) {
    const fromNode = requireNode(nodeById, edge.fromNodeId);
    const toNode = requireNode(nodeById, edge.toNodeId);
    const fromRoot = requireCanonicalRoot(canonicalRootByNode, fromNode.nodeId);
    const toRoot = requireCanonicalRoot(canonicalRootByNode, toNode.nodeId);
    const rawForward = edge.edgeClass === "center-spoke"
      ? requireRawEdge(preliminarySpokes, edge.edgeId)
      : runAdaptiveDirectedEdge(
        context,
        edge,
        "forward",
        fromNode,
        toNode,
        fromRoot.coordinates,
      );
    const forwardEndpoint = selectedEndpointRoot(rawForward);
    const rawReverse = runAdaptiveDirectedEdge(
      context,
      edge,
      "reverse",
      toNode,
      fromNode,
      forwardEndpoint?.coordinates ?? toRoot.coordinates,
    );
    const forward = finalizeDirectedEdge(
      context,
      rawForward,
      toRoot.coordinates,
    );
    const reverse = finalizeDirectedEdge(
      context,
      rawReverse,
      fromRoot.coordinates,
    );
    directedEdges.push(forward, reverse);
    maximumReverseClosureScaledInfinityNorm = Math.max(
      maximumReverseClosureScaledInfinityNorm,
      reverse.destinationAgreementScaledInfinityNorm ?? Number.POSITIVE_INFINITY,
    );
  }
  const routeClosureAudits = buildRouteClosureAudits(
    context,
    nodeById,
    canonicalRootByNode,
  );

  const rootCensus = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1.map(
    (entry) => enumerateNodeRoots(
      context,
      entry,
      requireCanonicalRoot(canonicalRootByNode, entry.nodeId).coordinates,
    ),
  );
  const staticValveSmoothingStructuralIndependenceAudit =
    auditStaticValveSmoothingStructuralIndependence(
      context,
      canonicalNodes,
      sha256Hex,
    );
  const destinationDistances = directedEdges.map(
    (edge) => edge.destinationAgreementScaledInfinityNorm,
  );
  const maximumDestinationAgreementScaledInfinityNorm = destinationDistances.every(
    (value): value is number => value !== null,
  ) ? Math.max(...destinationDistances) : null;
  const firstRuntimeAttempt = directedEdges[0]?.attempts[0];
  const firstCanonicalAudit = canonicalNodes[0];
  if (firstRuntimeAttempt === undefined || firstCanonicalAudit === undefined) {
    throw new Error("finite-envelope runtime component trace is empty");
  }
  const runtimeComponentIds = Object.freeze({
    runner: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
    rootSolver: centerRoot.rootId,
    sameTimeLevelHydromechanicsEvaluation:
      context.runtimeObjectComponentIds.sameTimeLevelHydromechanicsEvaluation,
    syntheticCase: context.runtimeObjectComponentIds.syntheticCase,
    staticGateManifest: context.runtimeObjectComponentIds.staticGateManifest,
    algorithmicJacobian: centerRoot.algorithmicJacobianId,
    valveNumericalPolicy:
      context.runtimeObjectComponentIds.valveNumericalPolicy,
    publishedTaylorOracle: centerRoot.oracle.oracleId,
    equationAssembly: "published-Taylor-2009" as const,
    localStaticClassifier: firstCanonicalAudit.staticAudit.auditId,
    naturalParameterContinuation: firstRuntimeAttempt.continuation.auditId,
  });
  const runtimeComponentIdentityPass =
    runtimeComponentIds.runner
      === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
    && runtimeComponentIds.rootSolver
      === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    && runtimeComponentIds.sameTimeLevelHydromechanicsEvaluation
      === PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID
    && runtimeComponentIds.syntheticCase
      === PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID
    && runtimeComponentIds.staticGateManifest
      === PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID
    && runtimeComponentIds.algorithmicJacobian
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    && runtimeComponentIds.valveNumericalPolicy
      === PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID
    && runtimeComponentIds.publishedTaylorOracle
      === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID
    && runtimeComponentIds.equationAssembly === "published-Taylor-2009"
    && runtimeComponentIds.localStaticClassifier
      === PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID
    && runtimeComponentIds.naturalParameterContinuation
      === PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID;
  const finiteDeclaredGraphEnvelopePass = canonicalNodes.length === 9
    && canonicalNodes.every((entry) => entry.hardGatePass)
    && directedEdges.length === 32
    && directedEdges.every((entry) => entry.accepted)
    && maximumDestinationAgreementScaledInfinityNorm !== null
    && maximumDestinationAgreementScaledInfinityNorm
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
        .endpointAgreementScaledInfinityTolerance
    && maximumReverseClosureScaledInfinityNorm
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
        .reverseClosureScaledInfinityTolerance
    && routeClosureAudits.pass
    && rootCensus.length === 9
    && rootCensus.every((entry) => entry.pass)
    && staticValveSmoothingStructuralIndependenceAudit.pass
    && runtimeComponentIdentityPass;

  return Object.freeze({
    protocolId: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
    runtimeComponentIds,
    runtimeComponentIdentityPass,
    slsMode,
    anchorVolumesM3: Object.freeze({
      LV: context.anchorLoadScales.leftVentricularCavityVolumeM3,
      RV: context.anchorLoadScales.rightVentricularCavityVolumeM3,
    }),
    anchorTotalBloodVolumeM3: context.anchorTotalBloodVolumeM3,
    canonicalNodes: Object.freeze(canonicalNodes),
    directedEdges: Object.freeze(directedEdges),
    routeClosureAudits,
    rootCensus: Object.freeze(rootCensus),
    maximumDestinationAgreementScaledInfinityNorm,
    maximumReverseClosureScaledInfinityNorm,
    staticValveSmoothingStructuralIndependenceAudit,
    finiteDeclaredGraphEnvelopePass,
    continuousRectangleInteriorPass: false,
    globalRootUniquenessPass: false,
    energeticStabilityPass: false,
    phaseB0OverallAcceptancePass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
  });
}

export function runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1(
  slsMode: PhaseB0SlsModeV1,
  direction: "forward" | "reverse",
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1 {
  const context = buildContext(slsMode, sha256Hex);
  const nodes = new Map(PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1.map(
    (entry) => [entry.nodeId, entry] as const,
  ));
  const center = requireNode(nodes, "C");
  const northWest = requireNode(nodes, "NW");
  const edge = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
    (candidate) => candidate.edgeId === "spoke-C-NW",
  );
  if (edge === undefined) throw new Error("missing structured-failure probe edge");
  const centerPoint = absoluteLoadPoint(context, center);
  const centerRoot = requireConvergedRoot(solvePhaseB0PublishedTriSegRootV1({
    ...rootInputAt(context, centerPoint),
    initialCoordinates: Object.freeze({
      septalMidwallCapVolumeM3:
        context.fixture.initialState.triSegCoordinates.V_m_S,
      junctionRadiusM: context.fixture.initialState.triSegCoordinates.y_m,
    }),
  }), "failure-probe center");
  let sourceNode = center;
  let destinationNode = northWest;
  let pathEntryCoordinates = centerRoot.coordinates;
  if (direction === "reverse") {
    const established = runAdaptiveDirectedEdge(
      context,
      edge,
      "forward",
      center,
      northWest,
      centerRoot.coordinates,
    );
    const northWestRoot = selectedEndpointRoot(established);
    if (northWestRoot === null) {
      throw new Error("failure probe could not establish reverse path entry");
    }
    sourceNode = northWest;
    destinationNode = center;
    pathEntryCoordinates = northWestRoot.coordinates;
  }
  const raw = runAdaptiveDirectedEdge(
    context,
    edge,
    direction,
    sourceNode,
    destinationNode,
    pathEntryCoordinates,
    Object.freeze([2] as const),
  );
  if (raw.selectedAttemptIndex !== null) {
    throw new Error("structured exhaustion probe unexpectedly accepted factor 2");
  }
  const rollbackCoordinates = raw.rollbackCoordinatesOnExhaustion;
  const rejectedAttemptEndpointCoordinates = raw.lastAttemptEndpointCoordinates;
  if (rejectedAttemptEndpointCoordinates === null) {
    throw new Error("structured exhaustion probe did not expose its rejected endpoint");
  }
  const rollbackMatchesDirectionSpecificEntry =
    scaledPhaseB0TriSegCoordinateDistanceV1(
      rollbackCoordinates,
      pathEntryCoordinates,
      context.pathRootInput.unknownScales,
    ) === 0;
  const rollbackDiffersFromRejectedAttemptEndpoint =
    scaledPhaseB0TriSegCoordinateDistanceV1(
      rollbackCoordinates,
      rejectedAttemptEndpointCoordinates,
      context.pathRootInput.unknownScales,
    ) > 0;
  return Object.freeze({
    probeId: "phase-b0-triseg-finite-envelope-structured-exhaustion-probe-v1",
    slsMode,
    direction,
    edgeId: "spoke-C-NW",
    injectedMaximumRefinementFactor: 2,
    pathEntryCoordinates: Object.freeze({ ...pathEntryCoordinates }),
    attempts: raw.attempts,
    selectedAttemptIndex: null,
    accepted: false,
    rollbackCoordinates,
    rollbackMatchesDirectionSpecificEntry,
    rejectedAttemptEndpointCoordinates,
    rollbackDiffersFromRejectedAttemptEndpoint,
    hiddenSubdivisionApplied: false,
    pseudoArclengthApplied: false,
    rootRankingApplied: false,
  });
}

function buildContext(
  slsMode: PhaseB0SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): EnvelopeContext {
  const fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256Hex);
  const baseState = createPhaseB0HydromechanicsInitialStateV1(fixture, slsMode);
  const staticManifest = buildPhaseB0TriSegStaticRestoringGateManifestV1(
    fixture,
    sha256Hex,
  );
  const anchorEvaluation = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    baseState,
  );
  const runtimeObjectComponentIds = Object.freeze({
    sameTimeLevelHydromechanicsEvaluation: anchorEvaluation.evaluationId,
    syntheticCase: fixture.caseId,
    staticGateManifest: staticManifest.manifestId,
    valveNumericalPolicy: fixture.valveNumericalPolicy.policyId,
    publishedTaylorOracle: anchorEvaluation.triSegOracle.oracleId,
  });
  const anchorTotalBloodVolumeM3 = totalBloodVolume(baseState.bloodVolumesM3);
  const anchorLoadScales = Object.freeze({
    leftVentricularCavityVolumeM3: baseState.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: baseState.bloodVolumesM3.RV,
  });
  const evaluateWallStress = (geometry: PublishedTriSegGeometryV1) => {
    const ledger = buildLedgerAtVolumes(
      baseState,
      anchorTotalBloodVolumeM3,
      "continuation-sample",
      geometry.leftVentricularCavityVolumeM3,
      geometry.rightVentricularCavityVolumeM3,
    );
    if (!ledger.accepted) {
      throw new Error("finite-envelope wall evaluation violated its blood ledger");
    }
    const evaluation = evaluatePhaseB0HydromechanicsStateV1(
      fixture,
      stateAtGeometry(baseState, ledger.bloodVolumesM3, geometry),
    );
    if (
      evaluation.evaluationId
        !== runtimeObjectComponentIds.sameTimeLevelHydromechanicsEvaluation
      || evaluation.triSegOracle.oracleId
        !== runtimeObjectComponentIds.publishedTaylorOracle
    ) {
      throw new Error("finite-envelope hydromechanics component identity drifted");
    }
    return Object.freeze({
      fiberKirchhoffStressPa: Object.freeze({
        LVFW: evaluation.wallMechanics.LVFW.totalKirchhoffStressPa,
        SEP: evaluation.wallMechanics.SEP.totalKirchhoffStressPa,
        RVFW: evaluation.wallMechanics.RVFW.totalKirchhoffStressPa,
      }),
    });
  };
  const pathRootInput: PhaseB0TriSegNaturalParameterPathRootInputV1 = Object.freeze({
    walls: fixture.triSegReference.walls,
    evaluateWallStress,
    unknownScales: Object.freeze({
      septalMidwallCapVolumeM3:
        fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
      junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
    }),
    equilibriumResidualScaleNPerM:
      fixture.newtonScaleRegistry.residualScales.publishedTriSegEquilibriumNPerM,
    junctionRadiusLowerBoundM: fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
    algorithmicJacobianScaledStep:
      PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .algorithmicJacobianSensitivity.constructionScaledStep,
  });
  const local = staticManifest.localPredictorCorrectorRegression;
  const continuationPolicy: PhaseB0TriSegNaturalParameterContinuationPolicyV1 =
    Object.freeze({
      parameterDerivativeScaledStep: local.parameterDerivativeScaledStep,
      minimumScaledLoadArclength: local.minimumScaledLoadArclength,
      maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
        local.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
      maximumAnchorCorrectionScaledInfinityNorm:
        local.maximumAnchorCorrectionScaledInfinityNorm,
      maximumPredictorCorrectionScaledInfinityNorm:
        local.maximumPredictorCorrectionScaledInfinityNorm,
      maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
        local.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
      maximumAcceptedScaledCoordinateStep: local.maximumAcceptedScaledCoordinateStep,
      minimumTangentDot: local.minimumTangentDot,
      relativePivotTolerance: local.relativePivotTolerance,
    });
  return Object.freeze({
    fixture,
    baseState,
    anchorTotalBloodVolumeM3,
    anchorLoadScales,
    pathRootInput,
    continuationPolicy,
    staticPolicy: staticManifest.workConjugateStaticRestoringClassifier.policy,
    runtimeObjectComponentIds,
  });
}

function runAdaptiveDirectedEdge(
  context: EnvelopeContext,
  edge: PhaseB0TriSegEnvelopeEdgeV1,
  direction: "forward" | "reverse",
  sourceNode: PhaseB0TriSegEnvelopeNodeV1,
  destinationNode: PhaseB0TriSegEnvelopeNodeV1,
  sourceCoordinates: PhaseB0TriSegCoordinatesV1,
  refinementFactors: readonly (2 | 4 | 8 | 16 | 32)[] =
    PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .adaptiveRefinement.refinementFactors,
): RawDirectedEdge {
  const from = absoluteLoadPoint(context, sourceNode);
  const to = absoluteLoadPoint(context, destinationNode);
  const attempts: PhaseB0TriSegEnvelopePathAttemptV1[] = [];
  let selectedAttemptIndex: number | null = null;
  for (const refinementFactor of refinementFactors) {
    const path = buildPhaseB0TriSegLinearLoadPathV1(from, to, refinementFactor);
    const continuation = auditPhaseB0TriSegNaturalParameterContinuationV1({
      rootInput: context.pathRootInput,
      path,
      loadScales: context.anchorLoadScales,
      anchorCoordinates: sourceCoordinates,
      policy: context.continuationPolicy,
    });
    const nodeAudits: PhaseB0TriSegEnvelopeNodeAuditV1[] = [];
    continuation.roots.forEach((root, index) => {
      if (root.converged === false) return;
      nodeAudits.push(auditRootAt(
        context,
        `${edge.edgeId}:${direction}:${refinementFactor}:${index}`,
        path[index],
        root,
        index === 0
          ? sourceCoordinates
          : continuation.segments[index - 1]?.predictedCoordinates
            ?? sourceCoordinates,
      ));
    });
    const prohibitedOperationsAbsent = !continuation.nearestRootSelectionApplied
      && !continuation.minimumResidualSelectionApplied
      && !continuation.maximumJunctionRadiusSelectionApplied
      && !continuation.forcedPreviousSeptumApplied
      && !continuation.pseudoArclengthApplied
      && !continuation.supportedEnvelopeClaimed;
    const hardGatePass = continuation.numericalPathAccepted
      && continuation.allConverged
      && continuation.roots.length === path.length
      && nodeAudits.length === path.length
      && nodeAudits.every((audit) => audit.hardGatePass)
      && prohibitedOperationsAbsent;
    const fiftyPercentGuardPass = hardGatePass
      && continuationGuardPass(continuation, context.continuationPolicy)
      && nodeAudits.every((audit) => audit.fiftyPercentGuardPass);
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
    direction,
    sourceNode,
    destinationNode,
    sourceCoordinates: Object.freeze({ ...sourceCoordinates }),
    attempts: Object.freeze(attempts),
    selectedAttemptIndex,
    rollbackCoordinatesOnExhaustion: Object.freeze({ ...sourceCoordinates }),
    lastAttemptEndpointCoordinates: attempts.length === 0
      ? null
      : selectedEndpointFromAttempt(attempts[attempts.length - 1])?.coordinates ?? null,
  });
}

function continuationGuardPass(
  continuation: PhaseB0TriSegNaturalParameterContinuationAuditV1,
  policy: PhaseB0TriSegNaturalParameterContinuationPolicyV1,
): boolean {
  const refinementPolicy =
    PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.adaptiveRefinement;
  const maximumGuard = (value: number | null, threshold: number) =>
    value !== null
    && value <= refinementPolicy.upperThresholdGuardMultiplier * threshold;
  const minimumLoadArclengthGuard = continuation.segments.every((segment) =>
    segment.scaledLoadArclength
      >= refinementPolicy.lowerThresholdGuardMultiplier
        * policy.minimumScaledLoadArclength);
  const tangentDotGuard = continuation.minimumTangentDot === null
    || 1 - continuation.minimumTangentDot
      <= refinementPolicy.upperThresholdGuardMultiplier
        * (1 - policy.minimumTangentDot);
  return minimumLoadArclengthGuard && maximumGuard(
    continuation.anchorCorrectionScaledInfinityNorm,
    policy.maximumAnchorCorrectionScaledInfinityNorm,
  ) && maximumGuard(
    continuation.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    policy.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
  ) && maximumGuard(
    continuation.maximumPredictorCorrectionScaledInfinityNorm,
    policy.maximumPredictorCorrectionScaledInfinityNorm,
  ) && maximumGuard(
    continuation.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    policy.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
  ) && maximumGuard(
    continuation.maximumAcceptedScaledCoordinateStep,
    policy.maximumAcceptedScaledCoordinateStep,
  ) && tangentDotGuard;
}

function finalizeDirectedEdge(
  context: EnvelopeContext,
  raw: RawDirectedEdge,
  canonicalDestinationCoordinates: PhaseB0TriSegCoordinatesV1,
): PhaseB0TriSegEnvelopeDirectedEdgeAuditV1 {
  const selected = raw.selectedAttemptIndex === null
    ? null
    : raw.attempts[raw.selectedAttemptIndex];
  const endpoint = selected === null
    ? null
    : selectedEndpointFromAttempt(selected);
  const destinationAgreementScaledInfinityNorm = endpoint === null
    ? null
    : scaledPhaseB0TriSegCoordinateDistanceV1(
      endpoint.coordinates,
      canonicalDestinationCoordinates,
      context.pathRootInput.unknownScales,
    );
  const firstGuardPassingAttemptIndex = raw.attempts.findIndex(
    (attempt) => attempt.fiftyPercentGuardPass,
  );
  const selectedRefinementFactor = selected?.refinementFactor ?? null;
  const firstGuardPassingFactor = firstGuardPassingAttemptIndex < 0
    ? null
    : raw.attempts[firstGuardPassingAttemptIndex].refinementFactor;
  const factors = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .adaptiveRefinement.refinementFactors;
  const prefixMatches = raw.attempts.every(
    (attempt, index) => attempt.refinementFactor === factors[index],
  );
  const selectionRuleAuditPass = prefixMatches
    && raw.selectedAttemptIndex === (
      firstGuardPassingAttemptIndex < 0 ? null : firstGuardPassingAttemptIndex
    )
    && raw.attempts.every((attempt, index) => index >= raw.attempts.length - 1
      || attempt.refinementTrigger !== "none")
    && (selected === null || selected.refinementTrigger === "none");
  const accepted = selected !== null
    && selectionRuleAuditPass
    && destinationAgreementScaledInfinityNorm !== null
    && destinationAgreementScaledInfinityNorm
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
        .endpointAgreementScaledInfinityTolerance;
  return Object.freeze({
    edgeId: raw.edge.edgeId,
    edgeClass: raw.edge.edgeClass,
    direction: raw.direction,
    sourceNodeId: raw.sourceNode.nodeId,
    destinationNodeId: raw.destinationNode.nodeId,
    attempts: raw.attempts,
    selectedAttemptIndex: raw.selectedAttemptIndex,
    selectedRefinementFactor,
    firstGuardPassingFactor,
    selectionRuleAuditPass,
    destinationAgreementScaledInfinityNorm,
    accepted,
    rollbackCoordinatesOnFailure: raw.rollbackCoordinatesOnExhaustion,
    hiddenSubdivisionApplied: false,
    pseudoArclengthApplied: false,
    rootRankingApplied: false,
  });
}

function buildRouteClosureAudits(
  context: EnvelopeContext,
  nodeById: ReadonlyMap<
    PhaseB0TriSegEnvelopeNodeIdV1,
    PhaseB0TriSegEnvelopeNodeV1
  >,
  canonicalRoots: ReadonlyMap<
    PhaseB0TriSegEnvelopeNodeIdV1,
    PhaseB0PublishedTriSegRootSuccessV1
  >,
): PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1["routeClosureAudits"] {
  const perimeterEdges = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1
    .filter((edge) => edge.edgeClass === "perimeter");
  const traverseClosedRoute = (
    steps: readonly Readonly<{
      edge: PhaseB0TriSegEnvelopeEdgeV1;
      direction: "forward" | "reverse";
    }>[],
    startNodeId: PhaseB0TriSegEnvelopeNodeIdV1,
  ) => {
    let currentCoordinates = requireCanonicalRoot(
      canonicalRoots,
      startNodeId,
    ).coordinates;
    const traversedEdges: PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[] = [];
    for (const step of steps) {
      const sourceNodeId = step.direction === "forward"
        ? step.edge.fromNodeId
        : step.edge.toNodeId;
      const destinationNodeId = step.direction === "forward"
        ? step.edge.toNodeId
        : step.edge.fromNodeId;
      const raw = runAdaptiveDirectedEdge(
        context,
        step.edge,
        step.direction,
        requireNode(nodeById, sourceNodeId),
        requireNode(nodeById, destinationNodeId),
        currentCoordinates,
      );
      const finalized = finalizeDirectedEdge(
        context,
        raw,
        requireCanonicalRoot(canonicalRoots, destinationNodeId).coordinates,
      );
      traversedEdges.push(finalized);
      const endpoint = selectedEndpointRoot(raw);
      if (endpoint === null) break;
      currentCoordinates = endpoint.coordinates;
    }
    const closureScaledInfinityNorm = traversedEdges.length === steps.length
      ? scaledPhaseB0TriSegCoordinateDistanceV1(
        currentCoordinates,
        requireCanonicalRoot(canonicalRoots, startNodeId).coordinates,
        context.pathRootInput.unknownScales,
      )
      : null;
    const pass = traversedEdges.length === steps.length
      && traversedEdges.every((entry) => entry.accepted)
      && closureScaledInfinityNorm !== null
      && closureScaledInfinityNorm
        <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
          .reverseClosureScaledInfinityTolerance;
    return Object.freeze({
      traversedEdges: Object.freeze(traversedEdges),
      closureScaledInfinityNorm,
      pass,
    });
  };
  const centerTriangles = perimeterEdges.map((edge) => {
    const fromSpoke = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
      (candidate) => candidate.edgeClass === "center-spoke"
        && candidate.toNodeId === edge.fromNodeId,
    );
    const toSpoke = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1.find(
      (candidate) => candidate.edgeClass === "center-spoke"
        && candidate.toNodeId === edge.toNodeId,
    );
    if (fromSpoke === undefined || toSpoke === undefined) {
      throw new Error(`missing center spoke for triangle ${edge.edgeId}`);
    }
    const clockwise = traverseClosedRoute(Object.freeze([
      Object.freeze({ edge: fromSpoke, direction: "forward" as const }),
      Object.freeze({ edge, direction: "forward" as const }),
      Object.freeze({ edge: toSpoke, direction: "reverse" as const }),
    ]), "C");
    const counterclockwise = traverseClosedRoute(Object.freeze([
      Object.freeze({ edge: toSpoke, direction: "forward" as const }),
      Object.freeze({ edge, direction: "reverse" as const }),
      Object.freeze({ edge: fromSpoke, direction: "reverse" as const }),
    ]), "C");
    return Object.freeze({
      triangleId: `C-${edge.fromNodeId}-${edge.toNodeId}`,
      clockwiseTraversedEdges: clockwise.traversedEdges,
      counterclockwiseTraversedEdges: counterclockwise.traversedEdges,
      clockwiseClosureScaledInfinityNorm: clockwise.closureScaledInfinityNorm,
      counterclockwiseClosureScaledInfinityNorm:
        counterclockwise.closureScaledInfinityNorm,
      pass: clockwise.pass && counterclockwise.pass,
    });
  });
  const perimeterCycles = (["clockwise", "counterclockwise"] as const).map(
    (cycleDirection) => {
      const orderedEdges = cycleDirection === "clockwise"
        ? perimeterEdges
        : [...perimeterEdges].reverse();
      let currentCoordinates = requireCanonicalRoot(
        canonicalRoots,
        "SW",
      ).coordinates;
      const traversedEdges: PhaseB0TriSegEnvelopeDirectedEdgeAuditV1[] = [];
      for (const edge of orderedEdges) {
        const direction = cycleDirection === "clockwise" ? "forward" : "reverse";
        const sourceNodeId = direction === "forward"
          ? edge.fromNodeId
          : edge.toNodeId;
        const destinationNodeId = direction === "forward"
          ? edge.toNodeId
          : edge.fromNodeId;
        const sourceNode = requireNode(nodeById, sourceNodeId);
        const destinationNode = requireNode(nodeById, destinationNodeId);
        const raw = runAdaptiveDirectedEdge(
          context,
          edge,
          direction,
          sourceNode,
          destinationNode,
          currentCoordinates,
        );
        const finalized = finalizeDirectedEdge(
          context,
          raw,
          requireCanonicalRoot(canonicalRoots, destinationNodeId).coordinates,
        );
        traversedEdges.push(finalized);
        const endpoint = selectedEndpointRoot(raw);
        if (endpoint === null) break;
        currentCoordinates = endpoint.coordinates;
      }
      const closureScaledInfinityNorm = traversedEdges.length === 8
        ? scaledPhaseB0TriSegCoordinateDistanceV1(
          currentCoordinates,
          requireCanonicalRoot(canonicalRoots, "SW").coordinates,
          context.pathRootInput.unknownScales,
        )
        : null;
      return Object.freeze({
        direction: cycleDirection,
        traversedEdges: Object.freeze(traversedEdges),
        closureScaledInfinityNorm,
        pass: traversedEdges.length === 8
          && traversedEdges.every((edge) => edge.accepted)
          && closureScaledInfinityNorm !== null
          && closureScaledInfinityNorm
            <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
              .reverseClosureScaledInfinityTolerance,
      });
    },
  );
  return Object.freeze({
    centerTriangles: Object.freeze(centerTriangles),
    perimeterCycles: Object.freeze(perimeterCycles),
    pass: centerTriangles.length === 8
      && centerTriangles.every((entry) => entry.pass)
      && perimeterCycles.every((entry) => entry.pass),
  });
}

function auditRootAt(
  context: EnvelopeContext,
  nodeId: string,
  point: Readonly<{
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
  }>,
  root: PhaseB0PublishedTriSegRootSuccessV1,
  independentInitialCoordinates: PhaseB0TriSegCoordinatesV1,
): PhaseB0TriSegEnvelopeNodeAuditV1 {
  const rootInput = rootInputAt(context, point);
  const staticAudit = auditPhaseB0TriSegStaticRestoringRootV1({
    rootInput,
    root,
    generalizedForceResidualScales: Object.freeze({
      septalMidwallVolumePa:
        context.fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
      junctionRadiusN:
        context.fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
    }),
    policy: context.staticPolicy,
  });
  const independentScaledStep =
    PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .algorithmicJacobianSensitivity.independentComparisonScaledStep;
  const independentRootInput = Object.freeze({
    ...rootInput,
    algorithmicJacobianScaledStep: independentScaledStep,
  });
  const independentRoot = solvePhaseB0PublishedTriSegRootV1({
    ...independentRootInput,
    initialCoordinates: independentInitialCoordinates,
  });
  const independentCoordinateAgreementScaledInfinityNorm =
    independentRoot.converged
      ? scaledPhaseB0TriSegCoordinateDistanceV1(
        root.coordinates,
        independentRoot.coordinates,
        context.pathRootInput.unknownScales,
      )
      : null;
  const independentStaticAudit = independentRoot.converged
    ? auditPhaseB0TriSegStaticRestoringRootV1({
      rootInput: independentRootInput,
      root: independentRoot,
      generalizedForceResidualScales: Object.freeze({
        septalMidwallVolumePa:
          context.fixture.newtonScaleRegistry.residualScales.virtualWorkSeptalVolumePa,
        junctionRadiusN:
          context.fixture.newtonScaleRegistry.residualScales.virtualWorkJunctionRadiusN,
      }),
      policy: context.staticPolicy,
    })
    : null;
  const independentClassification = independentStaticAudit
    ?.scaledRestoringTangent.classification ?? null;
  const independentClassificationMatches = independentClassification
    === staticAudit.scaledRestoringTangent.classification;
  const independentJacobianStepPass = independentRoot.converged
    && independentCoordinateAgreementScaledInfinityNorm !== null
    && independentCoordinateAgreementScaledInfinityNorm
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .algorithmicJacobianSensitivity.endpointAgreementScaledInfinityTolerance
    && independentClassificationMatches;
  const ledger = buildLedgerAtVolumes(
    context.baseState,
    context.anchorTotalBloodVolumeM3,
    nodeId,
    point.leftVentricularCavityVolumeM3,
    point.rightVentricularCavityVolumeM3,
  );
  const taylorDomainPass = root.oracle.taylorTensionErrorDomainEligible
    && root.oracle.domainClassification ===
      PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
        .publishedTaylorDomain;
  const hardGatePass = ledger.accepted
    && taylorDomainPass
    && staticAudit.acceptedUnderLocalStaticRestoringTestReference
    && staticAudit.scaledRestoringTangent.classification === "robust-restoring"
    && independentJacobianStepPass;
  const gates = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates;
  const adaptive = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .adaptiveRefinement;
  const fiftyPercentGuardPass = hardGatePass
    && staticAudit.rootRegularity.sigmaMinimum
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRootJacobianSigmaMinimum
    && staticAudit.rootRegularity.conditionNumber2
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumRootJacobianConditionNumber2
    && staticAudit.rootRegularity.scaledResidualInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootResidualInfinityNorm
    && staticAudit.rootRegularity.scaledUpdateInfinityNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumScaledRootUpdateInfinityNorm
    && staticAudit.scaledRestoringTangent.robustSignedMargin
      >= adaptive.lowerThresholdGuardMultiplier
        * gates.minimumRobustRestoringMargin
    && staticAudit.generalizedForceTransformAudit.differenceTwoNorm
      <= adaptive.upperThresholdGuardMultiplier
        * gates.maximumGeneralizedForceTransformAuditDifference2;
  return Object.freeze({
    nodeId,
    coordinates: root.coordinates,
    root,
    staticAudit,
    independentJacobianStepAudit: Object.freeze({
      scaledStep: independentScaledStep,
      initialCoordinates: Object.freeze({ ...independentInitialCoordinates }),
      root: independentRoot,
      coordinateAgreementScaledInfinityNorm:
        independentCoordinateAgreementScaledInfinityNorm,
      classification: independentClassification,
      classificationMatches: independentClassificationMatches,
      pass: independentJacobianStepPass,
    }),
    ledger,
    taylorDomainPass,
    hardGatePass,
    fiftyPercentGuardPass,
  });
}

function enumerateNodeRoots(
  context: EnvelopeContext,
  node: PhaseB0TriSegEnvelopeNodeV1,
  canonicalCoordinates: PhaseB0TriSegCoordinatesV1,
): PhaseB0TriSegEnvelopeRootCensusV1 {
  const point = absoluteLoadPoint(context, node);
  const seeds = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .rootEnumeration.seeds;
  const multiStart = auditPhaseB0PublishedTriSegMultiStartV1(
    rootInputAt(context, point),
    seeds,
    PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .rootEnumeration.scaledClusteringTolerance,
  );
  const reverseSeeds = Object.freeze([...seeds].reverse());
  const reverseMultiStart = auditPhaseB0PublishedTriSegMultiStartV1(
    rootInputAt(context, point),
    reverseSeeds,
    PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .rootEnumeration.scaledClusteringTolerance,
  );
  const clusters = clusterCensusResults(
    context,
    node.nodeId,
    point,
    multiStart.results,
    seeds,
  );
  const reverseClusters = clusterCensusResults(
    context,
    `${node.nodeId}:reverse-seed-order`,
    point,
    reverseMultiStart.results,
    reverseSeeds,
  );
  const seedOrderInvariant = clusterSetsAgree(
    context,
    clusters,
    reverseClusters,
  );
  const acceptedMatches = clusters.map((cluster, index) => ({
    index,
    distance: scaledPhaseB0TriSegCoordinateDistanceV1(
      cluster.coordinates,
      canonicalCoordinates,
      context.pathRootInput.unknownScales,
    ),
  })).filter(({ distance }) =>
    distance <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .rootEnumeration.scaledClusteringTolerance);
  const acceptedBranchClusterIndex = acceptedMatches.length === 1
    ? acceptedMatches[0].index
    : null;
  const allSeedsAttempted = multiStart.results.length === seeds.length;
  const allSeedsConverged = multiStart.allConverged;
  const frozenClusters = Object.freeze(clusters.map((cluster) => Object.freeze({
    representativeResultIndex: cluster.representativeResultIndex,
    memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
    classification: cluster.classification,
    coordinates: cluster.coordinates,
  })));
  return Object.freeze({
    nodeId: node.nodeId,
    seedCount: 3,
    results: multiStart.results,
    reverseSeedOrderResults: reverseMultiStart.results,
    allSeedsAttempted,
    allSeedsConverged,
    clusters: frozenClusters,
    acceptedBranchClusterIndex,
    seedOrderInvariant,
    allDiscoveredClustersReported: true,
    globalExhaustivenessClaimed: false,
    pass: allSeedsAttempted
      && allSeedsConverged
      && reverseMultiStart.allConverged
      && seedOrderInvariant
      && frozenClusters.length > 0
      && acceptedBranchClusterIndex !== null
      && !multiStart.minimumResidualRootSelectionApplied,
  });
}

type MutableCensusCluster = {
  representativeResultIndex: number;
  memberResultIndices: number[];
  classification: PhaseB0TriSegStaticRestoringClassV1;
  coordinates: PhaseB0TriSegCoordinatesV1;
};

function clusterCensusResults(
  context: EnvelopeContext,
  nodeId: string,
  point: Readonly<{
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
  }>,
  results: readonly PhaseB0PublishedTriSegRootResultV1[],
  initialCoordinatesByResult: readonly PhaseB0TriSegCoordinatesV1[],
): MutableCensusCluster[] {
  const clusters: MutableCensusCluster[] = [];
  results.forEach((result, resultIndex) => {
    if (result.converged === false) return;
    const existing = clusters.find((cluster) =>
      scaledPhaseB0TriSegCoordinateDistanceV1(
        cluster.coordinates,
        result.coordinates,
        context.pathRootInput.unknownScales,
      ) <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
        .rootEnumeration.scaledClusteringTolerance);
    if (existing !== undefined) {
      existing.memberResultIndices.push(resultIndex);
      return;
    }
    const audit = auditRootAt(
      context,
      `${nodeId}:census:${resultIndex}`,
      point,
      result,
      initialCoordinatesByResult[resultIndex],
    );
    clusters.push({
      representativeResultIndex: resultIndex,
      memberResultIndices: [resultIndex],
      classification: audit.staticAudit.scaledRestoringTangent.classification,
      coordinates: result.coordinates,
    });
  });
  return clusters;
}

function clusterSetsAgree(
  context: EnvelopeContext,
  left: readonly MutableCensusCluster[],
  right: readonly MutableCensusCluster[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((leftCluster) => right.filter((rightCluster) =>
    leftCluster.classification === rightCluster.classification
    && scaledPhaseB0TriSegCoordinateDistanceV1(
      leftCluster.coordinates,
      rightCluster.coordinates,
      context.pathRootInput.unknownScales,
    ) <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
      .rootEnumeration.scaledClusteringTolerance).length === 1);
}

function auditStaticValveSmoothingStructuralIndependence(
  context: EnvelopeContext,
  canonicalNodes: readonly PhaseB0TriSegEnvelopeNodeAuditV1[],
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1[
  "staticValveSmoothingStructuralIndependenceAudit"
] {
  const policy = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1
    .valveSmoothingSensitivity;
  const cases = policy.pressureGateWidthsPa.flatMap((pressureGateWidthPa) =>
    policy.flowSmoothingM3PerSec.map((flowSmoothingM3PerSec) => {
      const valvePolicy = buildPhaseB0ValveNumericalPolicyCandidateV1({
        nominalSetId:
          `phase-b0-static-triseg-independence-p${pressureGateWidthPa}-q${flowSmoothingM3PerSec}`,
        evidenceClass: "project-synthetic-test-only-nominal",
        numericalReverseAreaRatio:
          context.fixture.valveNumericalPolicy.candidateRatioUnderEvaluation,
        baselineOpenAreaM2ByValve: context.fixture.valveNumericalPolicy
          .baselineOpenAreaM2ByValve,
        pressureGateWidthPaByValve: Object.freeze(Object.fromEntries(
          PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) =>
            [valveId, pressureGateWidthPa]),
        )) as Readonly<Record<(typeof PHASE_B0_VALVE_FLOW_IDS_V1)[number], number>>,
        flowSmoothingM3PerSecByValve: Object.freeze(Object.fromEntries(
          PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) =>
            [valveId, flowSmoothingM3PerSec]),
        )) as Readonly<Record<(typeof PHASE_B0_VALVE_FLOW_IDS_V1)[number], number>>,
      }, sha256Hex);
      const valveLossParametersByFlow = Object.freeze(Object.fromEntries(
        PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) => [valveId, Object.freeze({
          ...context.fixture.valveLossParametersByFlow[valveId],
          openAreaM2: valvePolicy.baselineOpenAreaM2ByValve[valveId],
          numericalReverseAreaM2:
            valvePolicy.absoluteNumericalReverseAreaM2ByValve[valveId],
          pressureGateWidthPa: valvePolicy.pressureGateWidthPaByValve[valveId],
          flowSmoothingM3PerSec:
            valvePolicy.flowSmoothingM3PerSecByValve[valveId],
        })]),
      )) as PhaseB0SyntheticHydromechanicsCaseV1["valveLossParametersByFlow"];
      const fixture = Object.freeze({
        ...context.fixture,
        valveNumericalPolicy: valvePolicy,
        valveLossParametersByFlow,
      });
      let maximumWallStressAbsoluteDifferencePa = 0;
      let maximumTriSegResidualAbsoluteDifferenceNPerM = 0;
      for (const nodeAudit of canonicalNodes) {
        const geometry = nodeAudit.root.geometry;
        const ledger = buildLedgerAtVolumes(
          context.baseState,
          context.anchorTotalBloodVolumeM3,
          `${nodeAudit.nodeId}:valve-independence`,
          geometry.leftVentricularCavityVolumeM3,
          geometry.rightVentricularCavityVolumeM3,
        );
        const evaluation = evaluatePhaseB0HydromechanicsStateV1(
          fixture,
          stateAtGeometry(context.baseState, ledger.bloodVolumesM3, geometry),
        );
        maximumWallStressAbsoluteDifferencePa = Math.max(
          maximumWallStressAbsoluteDifferencePa,
          Math.abs(
            evaluation.wallMechanics.LVFW.totalKirchhoffStressPa
              - nodeAudit.root.wallStress.fiberKirchhoffStressPa.LVFW,
          ),
          Math.abs(
            evaluation.wallMechanics.SEP.totalKirchhoffStressPa
              - nodeAudit.root.wallStress.fiberKirchhoffStressPa.SEP,
          ),
          Math.abs(
            evaluation.wallMechanics.RVFW.totalKirchhoffStressPa
              - nodeAudit.root.wallStress.fiberKirchhoffStressPa.RVFW,
          ),
        );
        maximumTriSegResidualAbsoluteDifferenceNPerM = Math.max(
          maximumTriSegResidualAbsoluteDifferenceNPerM,
          Math.abs(
            evaluation.triSegOracle.equilibriumResidual.axialNPerM
              - nodeAudit.root.oracle.equilibriumResidual.axialNPerM,
          ),
          Math.abs(
            evaluation.triSegOracle.equilibriumResidual.radialNPerM
              - nodeAudit.root.oracle.equilibriumResidual.radialNPerM,
          ),
        );
      }
      return Object.freeze({
        pressureGateWidthPa,
        flowSmoothingM3PerSec,
        maximumWallStressAbsoluteDifferencePa,
        maximumTriSegResidualAbsoluteDifferenceNPerM,
        pass: maximumWallStressAbsoluteDifferencePa === 0
          && maximumTriSegResidualAbsoluteDifferenceNPerM === 0,
      });
    }));
  return Object.freeze({
    claim: "static-structural-independence-only",
    cases: Object.freeze(cases),
    pass: cases.length === 9 && cases.every((entry) => entry.pass),
  });
}

function absoluteLoadPoint(
  context: EnvelopeContext,
  node: PhaseB0TriSegEnvelopeNodeV1,
) {
  return Object.freeze({
    leftVentricularCavityVolumeM3:
      context.anchorLoadScales.leftVentricularCavityVolumeM3
      * node.leftVentricularVolumeMultiplier,
    rightVentricularCavityVolumeM3:
      context.anchorLoadScales.rightVentricularCavityVolumeM3
      * node.rightVentricularVolumeMultiplier,
  });
}

function rootInputAt(
  context: EnvelopeContext,
  point: Readonly<{
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
  }>,
): RootInputWithoutInitial {
  return Object.freeze({
    ...context.pathRootInput,
    ...point,
  });
}

function buildLedgerAtVolumes(
  baseState: PhaseB0HydromechanicsStateV1,
  anchorTotalBloodVolumeM3: number,
  nodeId: string,
  leftVentricularCavityVolumeM3: number,
  rightVentricularCavityVolumeM3: number,
): PhaseB0TriSegEnvelopeLedgerV1 {
  const base = baseState.bloodVolumesM3;
  const deltaLV = leftVentricularCavityVolumeM3 - base.LV;
  const deltaRV = rightVentricularCavityVolumeM3 - base.RV;
  const bloodVolumesM3 = Object.freeze({
    ...base,
    LV: leftVentricularCavityVolumeM3,
    RV: rightVentricularCavityVolumeM3,
    PV: base.PV - deltaLV,
    SV: base.SV - deltaRV,
  });
  const nodeTotalBloodVolumeM3 = totalBloodVolume(bloodVolumesM3);
  const totalBloodVolumeDifferenceM3 =
    nodeTotalBloodVolumeM3 - anchorTotalBloodVolumeM3;
  const relativeTotalBloodVolumeDifference = Math.abs(totalBloodVolumeDifferenceM3)
    / anchorTotalBloodVolumeM3;
  const allVolumesPositive = BLOOD_COMPARTMENT_IDS.every(
    (compartment) => bloodVolumesM3[compartment] > 0,
  );
  const unchangedCompartmentsExact = bloodVolumesM3.LA === base.LA
    && bloodVolumesM3.RA === base.RA
    && bloodVolumesM3.SA === base.SA
    && bloodVolumesM3.PA === base.PA;
  const accepted = allVolumesPositive
    && unchangedCompartmentsExact
    && relativeTotalBloodVolumeDifference
      <= PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.gates
        .totalBloodVolumeRelativeTolerance;
  return Object.freeze({
    nodeId,
    bloodVolumesM3,
    anchorTotalBloodVolumeM3,
    nodeTotalBloodVolumeM3,
    totalBloodVolumeDifferenceM3,
    relativeTotalBloodVolumeDifference,
    allVolumesPositive,
    unchangedCompartmentsExact,
    accepted,
  });
}

function stateAtGeometry(
  baseState: PhaseB0HydromechanicsStateV1,
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  geometry: PublishedTriSegGeometryV1,
): PhaseB0HydromechanicsStateV1 {
  const shared = {
    timeSec: 0,
    bloodVolumesM3,
    inertialFlowsM3PerSec: baseState.inertialFlowsM3PerSec,
    triSegCoordinates: Object.freeze({
      V_m_S: geometry.septalMidwallCapVolumeM3,
      y_m: geometry.junctionRadiusM,
    }),
  } as const;
  return baseState.slsMode === "on"
    ? Object.freeze({
      ...shared,
      slsMode: "on" as const,
      slsAlphaVByWall: baseState.slsAlphaVByWall,
    })
    : Object.freeze({ ...shared, slsMode: "off" as const });
}

function selectedEndpointRoot(
  edge: RawDirectedEdge,
): PhaseB0PublishedTriSegRootSuccessV1 | null {
  if (edge.selectedAttemptIndex === null) return null;
  return selectedEndpointFromAttempt(edge.attempts[edge.selectedAttemptIndex]);
}

function selectedEndpointPreCorrectionSeed(
  edge: RawDirectedEdge,
): PhaseB0TriSegCoordinatesV1 | null {
  if (edge.selectedAttemptIndex === null) return null;
  const attempt = edge.attempts[edge.selectedAttemptIndex];
  const segment = attempt.continuation.segments[
    attempt.continuation.segments.length - 1
  ];
  return segment?.predictedCoordinates ?? null;
}

function selectedEndpointFromAttempt(
  attempt: PhaseB0TriSegEnvelopePathAttemptV1,
): PhaseB0PublishedTriSegRootSuccessV1 | null {
  const endpoint = attempt.continuation.roots[
    attempt.continuation.roots.length - 1
  ];
  return endpoint?.converged === true ? endpoint : null;
}

function requireConvergedRoot(
  result: PhaseB0PublishedTriSegRootResultV1,
  field: string,
): PhaseB0PublishedTriSegRootSuccessV1 {
  if (result.converged === false) {
    throw new Error(`${field} failed: ${result.message}`);
  }
  return result;
}

function requireNode(
  nodes: ReadonlyMap<PhaseB0TriSegEnvelopeNodeIdV1, PhaseB0TriSegEnvelopeNodeV1>,
  nodeId: PhaseB0TriSegEnvelopeNodeIdV1,
): PhaseB0TriSegEnvelopeNodeV1 {
  const node = nodes.get(nodeId);
  if (node === undefined) throw new Error(`missing finite-envelope node ${nodeId}`);
  return node;
}

function requireCanonicalRoot(
  roots: ReadonlyMap<
    PhaseB0TriSegEnvelopeNodeIdV1,
    PhaseB0PublishedTriSegRootSuccessV1
  >,
  nodeId: PhaseB0TriSegEnvelopeNodeIdV1,
): PhaseB0PublishedTriSegRootSuccessV1 {
  const root = roots.get(nodeId);
  if (root === undefined) throw new Error(`missing canonical root ${nodeId}`);
  return root;
}

function requireCanonicalSeed(
  seeds: ReadonlyMap<
    PhaseB0TriSegEnvelopeNodeIdV1,
    PhaseB0TriSegCoordinatesV1
  >,
  nodeId: PhaseB0TriSegEnvelopeNodeIdV1,
): PhaseB0TriSegCoordinatesV1 {
  const seed = seeds.get(nodeId);
  if (seed === undefined) throw new Error(`missing canonical predictor seed ${nodeId}`);
  return seed;
}

function requireRawEdge(
  edges: ReadonlyMap<string, RawDirectedEdge>,
  edgeId: string,
): RawDirectedEdge {
  const edge = edges.get(edgeId);
  if (edge === undefined) throw new Error(`missing preliminary edge ${edgeId}`);
  return edge;
}

function totalBloodVolume(
  volumes: Readonly<Record<BloodCompartmentId, number>>,
): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartment) => sum + volumes[compartment],
    0,
  );
}
