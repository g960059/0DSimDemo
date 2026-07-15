import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_EVIDENCE_MANIFEST_V1_ID,
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_NUMERICAL_EVIDENCE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1";
import {
  FOUR_CHAMBER_PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_STATUS_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchReadinessV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ColdEtaOneFixedVolumeLoadContinuationV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1,
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EVIDENCE_MANIFEST_V1_ID =
  "phase-b1-eta-one-land-coupled-finite-volume-graph-evidence-manifest-v1" as const;

export const PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1 =
  "1d1459076227bfd16f924bb19d8f3fa9e5a59408480fb7d644369858d5ef8edd" as const;
export const PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1 =
  "6759092ba01aa58cda41ef5f529f67bdeb7ebc3ee6cdd7afeba61c519af5adef" as const;
export const PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1 =
  "b9dfa93528f0431659d53b8c5998e490093a6236c636570cb21f4e729b90336a" as const;

const GRAPH_MANIFESTS_V1 = new WeakSet<object>();
const GRAPH_PROTOCOL_DEFINITIONS_V1 = new WeakSet<object>();
const SLS_MODES = Object.freeze(["on", "off"] as const);
const GRAPH_NODE_IDS = Object.freeze(
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1.map(
    (node) => node.nodeId,
  ),
);
const GRAPH_EDGE_IDS = Object.freeze(
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1.map(
    (edge) => edge.edgeId,
  ),
);

const DIRECT_PARENT = Object.freeze({
  stitchId:
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
  manifestId:
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_EVIDENCE_MANIFEST_V1_ID,
  numericalEvidenceId:
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_NUMERICAL_EVIDENCE_V1_ID,
  readinessStatus:
    FOUR_CHAMBER_PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_STATUS_V1,
  manifestSha256:
    PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
  numericalEvidenceSha256:
    PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
  readinessSha256:
    PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
  requiredStitchPass: true as const,
  requiredParentFiniteVolumeGraphPass: false as const,
  pureCoreParentEvidenceAuthenticationClaimed: false as const,
  evidenceLayerDirectParentLineageAuthentication: true as const,
} as const);

const COMPONENT_IDS = Object.freeze({
  graphRunner: PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
  parentStitch:
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
  fixedVolumeSolver: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
  loadContinuation:
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
} as const);

const NODE_GRAPH = Object.freeze({
  nodes: PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
  nodeIds: GRAPH_NODE_IDS,
  centerNodeId: "C" as const,
  canonicalNodeCountPerSlsMode: 9 as const,
  leftVentricularVolumeMultipliers: Object.freeze([0.99, 1, 1.01] as const),
  rightVentricularVolumeMultipliers: Object.freeze([0.99, 1, 1.01] as const),
  exactThreeByThreeCartesianInventory: true as const,
} as const);

const EDGE_GRAPH = Object.freeze({
  edges: PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
  edgeIds: GRAPH_EDGE_IDS,
  undirectedCenterSpokeCount: 8 as const,
  undirectedPerimeterEdgeCount: 8 as const,
  canonicalSourceDirectedEdgeCountPerSlsMode: 32 as const,
  forwardEndpointRoundTripAuditCountPerSlsMode: 16 as const,
  everyUndirectedEdgeTraversedInBothCanonicalSourceDirections: true as const,
} as const);

const FIXED_STATE_LEDGER = Object.freeze({
  eta: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.eta,
  timeSec: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.timeSec,
  bloodCompartmentIds: BLOOD_COMPARTMENT_IDS,
  inertialFlowIds: INERTIAL_FLOW_IDS,
  calciumWallIds: WALL_IDS,
  volumeAxes:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.volumeAxes,
  leftVentricleComplement: "PV" as const,
  rightVentricleComplement: "SV" as const,
  unchangedCompartments: Object.freeze(["LA", "RA", "SA", "PA"] as const),
  inertialFlowsHeldAnchorExact: true as const,
  prescribedCalciumHeldAnchorExact: true as const,
  totalBloodVolumeRelativeTolerance:
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1
      .totalBloodVolumeRelativeTolerance,
  interpretation:
    "static-closed-ledger-fixed-hemodynamic-state-not-a-filling-path" as const,
} as const);

const CONTINUATION = Object.freeze({
  continuationId:
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_V1_ID,
  primitivePolicy:
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
  graphPolicy:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.continuation,
  directions: Object.freeze(["forward", "reverse"] as const),
  refinementFactors:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.continuation
      .refinementFactors,
  selectionRule:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.continuation
      .selectionRule,
  everyAttemptStartsFromExactCanonicalSource: true as const,
  factorEndpointsSharedAsSeeds: false as const,
  firstHardAndFiftyPercentGuardPassSelected: true as const,
  structuredFailureRollbackProbeRequired: true as const,
} as const);

const NODE_GATES =
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates;
const FIFTY_PERCENT_GUARD =
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
    .fiftyPercentGuard;

const ROOT_CENSUS = Object.freeze({
  fixedVolumeSolverId: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
  canonicalNodeIds: GRAPH_NODE_IDS,
  canonicalNodeCountPerSlsMode: 9 as const,
  censusCountAcrossPairedSlsModes: 18 as const,
  seedOrders:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.rootCensus
      .seedOrders,
  declaredSeeds:
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds,
  declaredSeedCountPerCensus: 3 as const,
  everyDeclaredSeedAttemptedAndConverged: true as const,
  everyConvergedResultPartitionedExactlyOnce: true as const,
  declaredAndReverseClusterSetsRequiredBijective: true as const,
  trackedCanonicalMatchesExactlyOneRestoringCluster: true as const,
  censusSelectsTrackedBranch: false as const,
  allDiscoveredFiniteClustersReported: true as const,
  globalExhaustivenessClaimed: false as const,
} as const);

const ROUTE_SCOPE = Object.freeze({
  policy:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.routeScope,
  canonicalNodeCountPerSlsMode: 9 as const,
  canonicalSourceDirectedEdgeCountPerSlsMode: 32 as const,
  forwardEndpointRoundTripAuditCountPerSlsMode: 16 as const,
  triangleAndPerimeterChainedRouteRerunsIncluded: false as const,
  finiteSampledGraphOnly: true as const,
} as const);

const PROHIBITED_OPERATIONS =
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
    .prohibitedOperations;

const CLAIM_BOUNDARY = Object.freeze({
  phaseB0OverallAcceptance: false as const,
  acceptedPhaseB1ReferenceBranch: false as const,
  phaseB1LandCoupledFiniteVolumeGraph: true as const,
  phaseB1LandCoupledVolumeEnvelope: false as const,
  continuousEtaIntervalRegularity: false as const,
  continuousVolumeIntervalRegularity: false as const,
  globalRootUniqueness: false as const,
  globalRootExhaustiveness: false as const,
  energeticStability: false as const,
  physiologicalInitialization: false as const,
  closedLoopStationarity: false as const,
  fullBeatAcceptance: false as const,
  physiologicalValidation: false as const,
  phaseB1Acceptance: false as const,
  supportedEnvelope: false as const,
  releaseRuntimePass: false as const,
  pureCoreParentEvidenceAuthenticationClaimed: false as const,
  modelCoreIntegration: false as const,
  browserRuntimeAdoption: false as const,
  releaseRuntimeReachability: false as const,
} as const);

const IMPLEMENTATION_CLAIMS = Object.freeze({
  pairedPhysicalSlsModes: true as const,
  exactCanonicalDirectParentStitchRequired: true as const,
  exactThreeByThreeLvRvFiniteNodeInventory: true as const,
  exactEightSpokeAndEightPerimeterEdgeInventory: true as const,
  closedEightCompartmentStaticBloodLedgerAtEverySample: true as const,
  canonicalCenterNodeObjectIdentityAndResidualReplayAudited: true as const,
  firstHardPassWithFiftyPercentGuardAdaptiveSelection: true as const,
  everyRefinementAttemptStartsFromExactCanonicalSource: true as const,
  thirtyTwoCanonicalSourceDirectedEdgesAuditedPerMode: true as const,
  sixteenForwardEndpointRoundTripAuditsBoundPerMode: true as const,
  allCanonicalNodesMeetLandTriSegStaticAndSchurGates: true as const,
  etaOneAssembledActiveEqualsRawLandAuditedPerWall: true as const,
  declaredAndReverseFiniteRootCensusAtEveryNode: true as const,
  noProjectionClippingRootRankingPseudoArclengthOrHiddenSubdivision: true as const,
  finiteSampledGraphClaimOnly: true as const,
} as const);

const DEFERRED = Object.freeze({
  phaseB0OverallAcceptance: true as const,
  acceptedPhaseB1ReferenceBranch: true as const,
  phaseB1LandCoupledVolumeEnvelope: true as const,
  continuousEtaAndVolumeIntervalRegularity: true as const,
  globalRootUniquenessOrExhaustiveness: true as const,
  energeticStability: true as const,
  physiologicalInitializationAndStationarity: true as const,
  fullBeatAndPhysiologicalValidation: true as const,
  runtimeIntegration: true as const,
} as const);

export function buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1() {
  const protocolDefinition = Object.freeze({
    graphId: PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
    slsModes: SLS_MODES,
    directParent: DIRECT_PARENT,
    componentIds: COMPONENT_IDS,
    nodeGraph: NODE_GRAPH,
    edgeGraph: EDGE_GRAPH,
    fixedStateLedger: FIXED_STATE_LEDGER,
    continuation: CONTINUATION,
    nodeGates: NODE_GATES,
    fiftyPercentGuard: FIFTY_PERCENT_GUARD,
    rootCensus: ROOT_CENSUS,
    routeScope: ROUTE_SCOPE,
    prohibitedOperations: PROHIBITED_OPERATIONS,
    claimBoundary: CLAIM_BOUNDARY,
  } as const);
  GRAPH_PROTOCOL_DEFINITIONS_V1.add(protocolDefinition);
  return protocolDefinition;
}

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1 =
  ReturnType<
    typeof buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1
  >;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EVIDENCE_MANIFEST_V1_ID;
    status:
      "project-synthetic-phase-b1-eta-one-land-coupled-finite-volume-graph-not-volume-envelope-or-reference-acceptance";
    evidenceClass:
      "project-synthetic-finite-sampled-land-coupled-static-lv-rv-volume-graph-regression";
    lineage: Readonly<{
      directParentStitchManifestSha256:
        typeof PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1;
      directParentStitchNumericalEvidenceSha256:
        typeof PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1;
      directParentStitchReadinessSha256:
        typeof PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1;
      canonicalDirectParentManifestVerifiedLive: true;
      directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence: true;
      evidenceLayerDirectParentLineageAuthentication: true;
      pureCoreParentEvidenceAuthenticationClaimed: false;
    }>;
    bindings: Readonly<{
      protocolDefinitionSha256: string;
      directParentSha256: string;
      componentIdsSha256: string;
      nodeGraphSha256: string;
      edgeGraphSha256: string;
      fixedStateLedgerSha256: string;
      continuationSha256: string;
      nodeGatesSha256: string;
      fiftyPercentGuardSha256: string;
      rootCensusSha256: string;
      routeScopeSha256: string;
      prohibitedOperationsSha256: string;
      claimBoundarySha256: string;
    }>;
    protocolDefinition:
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1;
    implementationClaims: typeof IMPLEMENTATION_CLAIMS;
    deferred: typeof DEFERRED;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1 =
  PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestPayloadV1 &
  Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1 {
  verifyDirectParentManifest(sha256Hex);
  const protocolDefinition =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1();
  const payload:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId:
        PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EVIDENCE_MANIFEST_V1_ID,
      status:
        "project-synthetic-phase-b1-eta-one-land-coupled-finite-volume-graph-not-volume-envelope-or-reference-acceptance",
      evidenceClass:
        "project-synthetic-finite-sampled-land-coupled-static-lv-rv-volume-graph-regression",
      lineage: Object.freeze({
        directParentStitchManifestSha256:
          PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
        directParentStitchNumericalEvidenceSha256:
          PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
        directParentStitchReadinessSha256:
          PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
        canonicalDirectParentManifestVerifiedLive: true,
        directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence:
          true,
        evidenceLayerDirectParentLineageAuthentication: true,
        pureCoreParentEvidenceAuthenticationClaimed: false,
      }),
      bindings: Object.freeze({
        protocolDefinitionSha256: computeCanonicalSha256(
          protocolDefinition,
          sha256Hex,
        ),
        directParentSha256: computeCanonicalSha256(
          protocolDefinition.directParent,
          sha256Hex,
        ),
        componentIdsSha256: computeCanonicalSha256(
          protocolDefinition.componentIds,
          sha256Hex,
        ),
        nodeGraphSha256: computeCanonicalSha256(
          protocolDefinition.nodeGraph,
          sha256Hex,
        ),
        edgeGraphSha256: computeCanonicalSha256(
          protocolDefinition.edgeGraph,
          sha256Hex,
        ),
        fixedStateLedgerSha256: computeCanonicalSha256(
          protocolDefinition.fixedStateLedger,
          sha256Hex,
        ),
        continuationSha256: computeCanonicalSha256(
          protocolDefinition.continuation,
          sha256Hex,
        ),
        nodeGatesSha256: computeCanonicalSha256(
          protocolDefinition.nodeGates,
          sha256Hex,
        ),
        fiftyPercentGuardSha256: computeCanonicalSha256(
          protocolDefinition.fiftyPercentGuard,
          sha256Hex,
        ),
        rootCensusSha256: computeCanonicalSha256(
          protocolDefinition.rootCensus,
          sha256Hex,
        ),
        routeScopeSha256: computeCanonicalSha256(
          protocolDefinition.routeScope,
          sha256Hex,
        ),
        prohibitedOperationsSha256: computeCanonicalSha256(
          protocolDefinition.prohibitedOperations,
          sha256Hex,
        ),
        claimBoundarySha256: computeCanonicalSha256(
          protocolDefinition.claimBoundary,
          sha256Hex,
        ),
      }),
      protocolDefinition,
      implementationClaims: IMPLEMENTATION_CLAIMS,
      deferred: DEFERRED,
      claimBoundary: CLAIM_BOUNDARY,
    });
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  GRAPH_MANIFESTS_V1.add(manifest);
  return validatePhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
  manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !GRAPH_MANIFESTS_V1.has(manifest)
  ) throw new Error(
    "Phase B1 eta-one finite-volume graph manifest must be canonically built in this process",
  );
  return manifest;
}

export function assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1(
  protocolDefinition:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1 {
  if (
    protocolDefinition === null
    || typeof protocolDefinition !== "object"
    || !GRAPH_PROTOCOL_DEFINITIONS_V1.has(protocolDefinition)
  ) throw new Error(
    "Phase B1 eta-one finite-volume graph protocol must be canonically built in this process",
  );
  return protocolDefinition;
}

export function validatePhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
  manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1 {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
    manifest,
  );
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1(
    manifest.protocolDefinition,
  );
  assertClosedManifestInventories(manifest);
  if (
    manifest.manifestId
      !== PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B1 eta-one finite-volume graph manifest identity drifted");
  assertCanonicalSha256(
    phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  verifyDirectParentManifest(sha256Hex);

  const protocol = manifest.protocolDefinition;
  const expected =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphProtocolDefinitionV1();
  const identityChecks = [
    protocol.slsModes === SLS_MODES,
    protocol.directParent === DIRECT_PARENT,
    protocol.componentIds === COMPONENT_IDS,
    protocol.nodeGraph === NODE_GRAPH,
    protocol.nodeGraph.nodes
      === PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
    protocol.nodeGraph.nodeIds === GRAPH_NODE_IDS,
    protocol.edgeGraph === EDGE_GRAPH,
    protocol.edgeGraph.edges
      === PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
    protocol.edgeGraph.edgeIds === GRAPH_EDGE_IDS,
    protocol.fixedStateLedger === FIXED_STATE_LEDGER,
    protocol.continuation === CONTINUATION,
    protocol.nodeGates === NODE_GATES,
    protocol.fiftyPercentGuard === FIFTY_PERCENT_GUARD,
    protocol.rootCensus === ROOT_CENSUS,
    protocol.routeScope === ROUTE_SCOPE,
    protocol.prohibitedOperations === PROHIBITED_OPERATIONS,
    protocol.claimBoundary === CLAIM_BOUNDARY,
    manifest.implementationClaims === IMPLEMENTATION_CLAIMS,
    manifest.deferred === DEFERRED,
    manifest.claimBoundary === CLAIM_BOUNDARY,
  ];
  const bindingChecks = [
    canonicalizeJson(protocol) === canonicalizeJson(expected),
    manifest.bindings.protocolDefinitionSha256
      === computeCanonicalSha256(protocol, sha256Hex),
    manifest.bindings.directParentSha256
      === computeCanonicalSha256(protocol.directParent, sha256Hex),
    manifest.bindings.componentIdsSha256
      === computeCanonicalSha256(protocol.componentIds, sha256Hex),
    manifest.bindings.nodeGraphSha256
      === computeCanonicalSha256(protocol.nodeGraph, sha256Hex),
    manifest.bindings.edgeGraphSha256
      === computeCanonicalSha256(protocol.edgeGraph, sha256Hex),
    manifest.bindings.fixedStateLedgerSha256
      === computeCanonicalSha256(protocol.fixedStateLedger, sha256Hex),
    manifest.bindings.continuationSha256
      === computeCanonicalSha256(protocol.continuation, sha256Hex),
    manifest.bindings.nodeGatesSha256
      === computeCanonicalSha256(protocol.nodeGates, sha256Hex),
    manifest.bindings.fiftyPercentGuardSha256
      === computeCanonicalSha256(protocol.fiftyPercentGuard, sha256Hex),
    manifest.bindings.rootCensusSha256
      === computeCanonicalSha256(protocol.rootCensus, sha256Hex),
    manifest.bindings.routeScopeSha256
      === computeCanonicalSha256(protocol.routeScope, sha256Hex),
    manifest.bindings.prohibitedOperationsSha256
      === computeCanonicalSha256(protocol.prohibitedOperations, sha256Hex),
    manifest.bindings.claimBoundarySha256
      === computeCanonicalSha256(protocol.claimBoundary, sha256Hex),
  ];
  if (
    identityChecks.some((value) => !value)
    || bindingChecks.some((value) => !value)
  ) throw new Error("Phase B1 eta-one finite-volume graph manifest binding drifted");

  const nodes = protocol.nodeGraph.nodes;
  const edges = protocol.edgeGraph.edges;
  const finiteGraphClaimEntries = Object.entries(protocol.claimBoundary)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
  if (
    nodes.length !== 9
    || protocol.nodeGraph.nodeIds.join(",") !== "C,SW,W,NW,N,NE,E,SE,S"
    || new Set(protocol.nodeGraph.nodeIds).size !== 9
    || edges.length !== 16
    || new Set(protocol.edgeGraph.edgeIds).size !== 16
    || edges.filter((edge) => edge.edgeClass === "center-spoke").length !== 8
    || edges.filter((edge) => edge.edgeClass === "perimeter").length !== 8
    || protocol.edgeGraph.canonicalSourceDirectedEdgeCountPerSlsMode !== 32
    || protocol.edgeGraph.forwardEndpointRoundTripAuditCountPerSlsMode !== 16
    || protocol.slsModes.join(",") !== "on,off"
    || protocol.fixedStateLedger.bloodCompartmentIds.join(",")
      !== "LA,LV,SA,SV,RA,RV,PA,PV"
    || protocol.fixedStateLedger.inertialFlowIds.join(",")
      !== "Q_MV,Q_AoV,Q_TV,Q_PuV,Q_VC,Q_PV"
    || protocol.fixedStateLedger.calciumWallIds.join(",")
      !== "LA,RA,LVFW,SEP,RVFW"
    || protocol.continuation.refinementFactors.join(",") !== "2,4,8"
    || protocol.rootCensus.seedOrders.join(",") !== "declared,reverse"
    || protocol.rootCensus.declaredSeeds.length !== 3
    || Object.values(protocol.prohibitedOperations)
      .some((value) => value !== false)
    || finiteGraphClaimEntries.length !== 1
    || finiteGraphClaimEntries[0] !== "phaseB1LandCoupledFiniteVolumeGraph"
    || protocol.claimBoundary.pureCoreParentEvidenceAuthenticationClaimed
      !== false
    || !manifest.lineage.evidenceLayerDirectParentLineageAuthentication
    || manifest.lineage.pureCoreParentEvidenceAuthenticationClaimed !== false
    || Object.values(manifest.implementationClaims)
      .some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
  ) throw new Error("Phase B1 eta-one finite-volume graph inventory drifted");
  return manifest;
}

export function phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1(
  manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function assertClosedManifestInventories(
  manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
): void {
  assertExactPlainRecordV1(manifest, [
    "manifestId",
    "status",
    "evidenceClass",
    "lineage",
    "bindings",
    "protocolDefinition",
    "implementationClaims",
    "deferred",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "phaseB1EtaOneFiniteVolumeGraphManifest");
  assertExactPlainRecordV1(manifest.lineage, [
    "directParentStitchManifestSha256",
    "directParentStitchNumericalEvidenceSha256",
    "directParentStitchReadinessSha256",
    "canonicalDirectParentManifestVerifiedLive",
    "directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence",
    "evidenceLayerDirectParentLineageAuthentication",
    "pureCoreParentEvidenceAuthenticationClaimed",
  ], "phaseB1EtaOneFiniteVolumeGraphManifest.lineage");
  assertExactPlainRecordV1(manifest.bindings, [
    "protocolDefinitionSha256",
    "directParentSha256",
    "componentIdsSha256",
    "nodeGraphSha256",
    "edgeGraphSha256",
    "fixedStateLedgerSha256",
    "continuationSha256",
    "nodeGatesSha256",
    "fiftyPercentGuardSha256",
    "rootCensusSha256",
    "routeScopeSha256",
    "prohibitedOperationsSha256",
    "claimBoundarySha256",
  ], "phaseB1EtaOneFiniteVolumeGraphManifest.bindings");
  assertExactPlainRecordV1(manifest.protocolDefinition, [
    "graphId",
    "slsModes",
    "directParent",
    "componentIds",
    "nodeGraph",
    "edgeGraph",
    "fixedStateLedger",
    "continuation",
    "nodeGates",
    "fiftyPercentGuard",
    "rootCensus",
    "routeScope",
    "prohibitedOperations",
    "claimBoundary",
  ], "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition");
  assertDensePlainArrayV1(
    manifest.protocolDefinition.slsModes,
    2,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.slsModes",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.nodeGraph.nodes,
    9,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.nodeGraph.nodes",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.nodeGraph.nodeIds,
    9,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.nodeGraph.nodeIds",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.edgeGraph.edges,
    16,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.edgeGraph.edges",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.edgeGraph.edgeIds,
    16,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.edgeGraph.edgeIds",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.continuation.refinementFactors,
    3,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.continuation.refinementFactors",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.rootCensus.seedOrders,
    2,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.rootCensus.seedOrders",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.rootCensus.declaredSeeds,
    3,
    "phaseB1EtaOneFiniteVolumeGraphManifest.protocolDefinition.rootCensus.declaredSeeds",
  );
}

function verifyDirectParentManifest(
  sha256Hex: CanonicalSha256HexProvider,
): void {
  const parent =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
      sha256Hex,
    );
  if (
    parent.contentSha256
      !== PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1
  ) throw new Error(
    "Phase B1 eta-one finite-volume graph direct-parent manifest drifted",
  );
}
