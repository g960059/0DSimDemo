import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { ScaledDampedNewtonDiagnosticsV1 } from
  "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import type { PhaseB0SlsModeV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1";
import {
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchReadinessV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
  runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ColdEtaOneFixedVolumeLoadContinuationV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
  buildPhaseB1EtaOneFiniteVolumeLedgerV1,
  runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1,
  type PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  type PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  type PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1,
  type PhaseB1EtaOneFiniteVolumePathAttemptV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1";
import type { PhaseB1EndpointStateV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeResultV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID =
  "phase-b1-eta-one-land-coupled-finite-volume-graph-numerical-evidence-v1" as const;

const MODES = Object.freeze(["on", "off"] as const);
const CANONICAL_BUNDLES = new WeakSet<object>();

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphFailureProbeRecordV1 =
  Readonly<Record<
    PhaseB0SlsModeV1,
    readonly [
      PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
      PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
    ]
  >>;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphModeSummaryV1 =
  ReturnType<typeof summarizeMode>;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidencePayloadV1 =
  Readonly<{
    evidenceId:
      typeof PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID;
    manifestSha256: string;
    directParentAuthentication: ReturnType<typeof parentAuthenticationRecord>;
    slsModes: typeof MODES;
    modes: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphModeSummaryV1
    >>;
    allModesPass: boolean;
  }>;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceCertificateV1 =
  PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidencePayloadV1 &
  Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1 =
  Readonly<{
    certificate:
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceCertificateV1;
    stitchEvidence:
      PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1;
    results: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1
    >>;
    failureProbes:
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphFailureProbeRecordV1;
  }>;

export function buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
  manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
    manifest,
  );
  const parentManifest =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
      sha256Hex,
    );
  const stitchEvidence =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
      parentManifest,
      sha256Hex,
    );
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
    stitchEvidence,
    parentManifest,
  );
  const parentReadiness =
    buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1(
      parentManifest,
      stitchEvidence,
    );
  authenticateDirectParent(
    parentManifest.contentSha256,
    stitchEvidence,
    computeCanonicalSha256(parentReadiness, sha256Hex),
    sha256Hex,
  );
  const directParentAuthentication = parentAuthenticationRecord();

  const results = Object.freeze({
    on: runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
      stitchEvidence.results.on,
      sha256Hex,
    ),
    off: runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
      stitchEvidence.results.off,
      sha256Hex,
    ),
  });
  const failureProbes = Object.freeze({
    on: buildFailureProbes("on", stitchEvidence, results.on, sha256Hex),
    off: buildFailureProbes("off", stitchEvidence, results.off, sha256Hex),
  });
  assertRawEvidenceDataShape(results, "phaseB1EtaOneFiniteVolumeGraph.results");
  assertRawEvidenceDataShape(
    failureProbes,
    "phaseB1EtaOneFiniteVolumeGraph.failureProbes",
  );
  const modes = Object.freeze({
    on: summarizeMode(
      stitchEvidence,
      results.on,
      failureProbes.on,
      sha256Hex,
    ),
    off: summarizeMode(
      stitchEvidence,
      results.off,
      failureProbes.off,
      sha256Hex,
    ),
  });
  const payload:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidencePayloadV1 =
    Object.freeze({
      evidenceId:
        PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID,
      manifestSha256: manifest.contentSha256,
      directParentAuthentication,
      slsModes: MODES,
      modes,
      allModesPass:
        directParentAuthentication.allDirectParentArtifactsAuthenticated
        && modes.on.modePass
        && modes.off.modePass,
    });
  canonicalizeJson(payload);
  const certificate = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  const bundle = Object.freeze({
    certificate,
    stitchEvidence,
    results,
    failureProbes,
  });
  assertDeepFrozenPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
    bundle,
  );
  CANONICAL_BUNDLES.add(bundle);
  return bundle;
}

export function assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
  bundle: PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1,
  manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
    manifest,
  );
  if (
    bundle === null
    || typeof bundle !== "object"
    || !CANONICAL_BUNDLES.has(bundle)
    || bundle.certificate.manifestSha256 !== manifest.contentSha256
  ) throw new Error(
    "Phase B1 eta-one finite-volume graph numerical evidence must be canonically built for this manifest",
  );
  assertDeepFrozenPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
    bundle,
  );
  return bundle;
}

export function assertDeepFrozenPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
  bundle: PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1 {
  assertRecursivelyFrozenAndClosed(
    bundle,
    "phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundle",
    new WeakSet<object>(),
  );
  return bundle;
}

export function phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
  certificate:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceCertificateV1,
): PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidencePayloadV1 {
  return Object.freeze({
    evidenceId: certificate.evidenceId,
    manifestSha256: certificate.manifestSha256,
    directParentAuthentication: certificate.directParentAuthentication,
    slsModes: certificate.slsModes,
    modes: certificate.modes,
    allModesPass: certificate.allModesPass,
  });
}

function parentAuthenticationRecord() {
  return Object.freeze({
    stitch: Object.freeze({
      manifestSha256:
        PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
      numericalEvidenceSha256:
        PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
      readinessSha256:
        PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
      manifestRebuiltCanonicalAndPinned: true as const,
      numericalBundleCanonical: true as const,
      numericalCertificateSelfHashedAndPinned: true as const,
      readinessRebuiltAndPinned: true as const,
    }),
    exactSlsModeKeys: true as const,
    evidenceLayerDirectParentLineageAuthentication: true as const,
    pureCoreParentEvidenceAuthenticationClaimed: false as const,
    allDirectParentArtifactsAuthenticated: true as const,
  });
}

function authenticateDirectParent(
  parentManifestSha256: string,
  stitchEvidence:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
  parentReadinessSha256: string,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  const certificate = stitchEvidence.certificate;
  const exactModeKeys = [
    certificate.slsModes,
    Reflect.ownKeys(certificate.modes),
    Reflect.ownKeys(stitchEvidence.results),
  ].every((keys) => canonicalizeJson(keys) === canonicalizeJson(MODES));
  if (
    parentManifestSha256
      !== PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1
    || certificate.manifestSha256 !== parentManifestSha256
    || certificate.contentSha256
      !== PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1
    || certificate.contentSha256 !== computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1(
        certificate,
      ),
      sha256Hex,
    )
    || parentReadinessSha256
      !== PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1
    || !certificate.allModesPass
    || !exactModeKeys
    || MODES.some((mode) => stitchEvidence.results[mode].slsMode !== mode)
  ) throw new Error(
    "Phase B1 eta-one finite-volume graph direct-parent authentication failed",
  );
}

function buildFailureProbes(
  mode: PhaseB0SlsModeV1,
  stitchEvidence:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): readonly [
  PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
] {
  const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(
    mode,
    sha256Hex,
  );
  const sourceNode = requireEtaOneNode(
    stitchEvidence.results[mode].etaOne.node,
  );
  const centerDefinition = requireGraphNodeDefinition("C");
  const eastDefinition = requireGraphNodeDefinition("E");
  const sourceLedger = buildPhaseB1EtaOneFiniteVolumeLedgerV1(
    session.anchorFixedInputs.bloodVolumesM3,
    centerDefinition,
  );
  const destinationLedger = buildPhaseB1EtaOneFiniteVolumeLedgerV1(
    session.anchorFixedInputs.bloodVolumesM3,
    eastDefinition,
  );
  const graphCenter = requireGraphNodeAudit(graph, "C");
  if (
    graph.slsMode !== mode
    || !Object.is(graphCenter.node, sourceNode)
    || !numericRecordExact(
      graphCenter.ledger.bloodVolumesM3,
      sourceLedger.bloodVolumesM3,
    )
  ) throw new Error(
    `Phase B1 finite-volume failure probe source identity drifted for ${mode}`,
  );
  const input = Object.freeze({
    session,
    sourceNode,
    sourceBloodVolumesM3: sourceLedger.bloodVolumesM3,
    destinationBloodVolumesM3: destinationLedger.bloodVolumesM3,
    direction: "forward" as const,
    refinementFactor: 2 as const,
  });
  const atSource =
    runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1(input, 0);
  const atMidpoint =
    runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1(input, 1);
  assertFailureProbeBoundary(atSource, sourceNode, 0);
  assertFailureProbeBoundary(atMidpoint, sourceNode, 1);
  return Object.freeze([atSource, atMidpoint]);
}

function summarizeMode(
  stitchEvidence:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  failureProbes: readonly [
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  ],
  sha256Hex: CanonicalSha256HexProvider,
) {
  const mode = graph.slsMode;
  const stitch = stitchEvidence.results[mode];
  const stitchEtaOneNode = requireEtaOneNode(stitch.etaOne.node);
  const unknownScales = stitchEvidence.coldEvidence.results[mode]
    .layout.unknownScales;
  const canonicalNodeById = new Map(graph.canonicalNodes.map((audit) => [
    audit.nodeId,
    audit.node,
  ] as const));
  const nodeSummaries = Object.freeze(graph.canonicalNodes.map((audit) =>
    nodeSummary(audit, sha256Hex)));
  const directedPaths = Object.freeze(graph.directedEdges.map((path) =>
    pathSummary(
      path,
      requireCanonicalNode(canonicalNodeById, path.sourceNodeId),
      sha256Hex,
    )));
  const roundTrips = Object.freeze(graph.roundTripAudits.map((path) => {
    const forward = requireForwardDirectedPath(graph, path.edgeId);
    const source = selectedContinuationEndpoint(forward);
    if (source === null) {
      throw new Error(`round-trip source endpoint absent for ${path.edgeId}`);
    }
    return pathSummary(path, source, sha256Hex);
  }));
  const rootCensuses = Object.freeze(graph.rootCensus.map((census) =>
    censusSummary(
      census,
      requireCanonicalNode(canonicalNodeById, census.nodeId),
      unknownScales,
      sha256Hex,
    )));
  const failureProbeSummaries = Object.freeze(failureProbes.map((probe) =>
    failureProbeSummary(
      probe,
      stitchEtaOneNode,
      sha256Hex,
    )));
  const centerReplay = Object.freeze({
    centerNodePreservedByObjectIdentity:
      graph.centerReplayAudit.centerNodePreservedByObjectIdentity,
    independentlyConfirmedCenterNodeObjectIdentity: Object.is(
      requireGraphNodeAudit(graph, "C").node,
      stitchEtaOneNode,
    ),
    replayedResidualSha256: vectorSha(
      graph.centerReplayAudit.replayedResidual,
      sha256Hex,
    ),
    sourceResidualSha256: vectorSha(
      stitchEtaOneNode.residualEvaluation.residual,
      sha256Hex,
    ),
    maximumAbsoluteResidualReplayDifference:
      graph.centerReplayAudit.maximumAbsoluteResidualReplayDifference,
    residualReplayExact: arrayExact(
      graph.centerReplayAudit.replayedResidual,
      stitchEtaOneNode.residualEvaluation.residual,
    ),
    pass: graph.centerReplayAudit.pass,
  });
  const aggregateMetrics = aggregateModeMetrics(graph);
  const broadClaims = graphBroadClaims(graph);
  const expectedNodeIds =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1.map(
      (node) => node.nodeId,
    );
  const directedPathIds = graph.directedEdges.map(canonicalPathId);
  const roundTripIds = graph.roundTripAudits.map(canonicalPathId);
  const expectedDirectedPathIds =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1.flatMap(
      (edge) => [
        [
          "canonical-source-directed",
          edge.edgeId,
          "forward",
          edge.fromNodeId,
          edge.toNodeId,
        ].join(":"),
        [
          "canonical-source-directed",
          edge.edgeId,
          "reverse",
          edge.toNodeId,
          edge.fromNodeId,
        ].join(":"),
      ],
    );
  const expectedRoundTripIds =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1.map((edge) => [
      "forward-endpoint-roundtrip",
      edge.edgeId,
      "reverse",
      edge.toNodeId,
      edge.fromNodeId,
    ].join(":"));
  const inventoryPass = graph.graphId
      === PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID
    && nodeSummaries.length === 9
    && arrayExact(
      nodeSummaries.map((summary) => summary.nodeId),
      expectedNodeIds,
    )
    && new Set(nodeSummaries.map((summary) => summary.nodeId)).size === 9
    && directedPaths.length === 32
    && new Set(directedPathIds).size === 32
    && arrayExact(directedPathIds, expectedDirectedPathIds)
    && roundTrips.length === 16
    && new Set(roundTripIds).size === 16
    && arrayExact(roundTripIds, expectedRoundTripIds)
    && rootCensuses.length === 9
    && arrayExact(
      rootCensuses.map((summary) => summary.nodeId),
      expectedNodeIds,
    )
    && failureProbeSummaries.length === 2
    && failureProbeSummaries[0].injectedAttemptIndex === 0
    && failureProbeSummaries[1].injectedAttemptIndex === 1;
  const modePass = inventoryPass
    && graph.phaseB1LandCoupledFiniteVolumeGraphPass
    && centerReplay.pass
    && centerReplay.independentlyConfirmedCenterNodeObjectIdentity
    && centerReplay.residualReplayExact
    && nodeSummaries.every((summary) => summary.hardGatePass)
    && nodeSummaries.every((summary) => summary.fiftyPercentGuardPass)
    && directedPaths.every((summary) => summary.accepted)
    && directedPaths.every((summary) => summary.selectionRuleRecomputedPass)
    && directedPaths.every((summary) => summary.exactSourceObjectIdentity)
    && directedPaths.every((summary) =>
      summary.allRecordedProhibitedOperationsAbsent)
    && roundTrips.every((summary) => summary.accepted)
    && roundTrips.every((summary) => summary.selectionRuleRecomputedPass)
    && roundTrips.every((summary) => summary.exactSourceObjectIdentity)
    && roundTrips.every((summary) =>
      summary.allRecordedProhibitedOperationsAbsent)
    && rootCensuses.every((summary) => summary.censusPass)
    && rootCensuses.every((summary) => summary.partitionAndBijectionRecomputedPass)
    && failureProbeSummaries.every((summary) => summary.probePass)
    && Object.values(aggregateMetrics.selectedRefinementFactorCounts)
      .reduce((sum, count) => sum + count, 0) === 48
    && Object.values(broadClaims).every((value) => value === false);
  return Object.freeze({
    slsMode: mode,
    graphId: graph.graphId,
    componentIdsSha256: digestProjection(
      "component-ids",
      graph.componentIds,
      sha256Hex,
    ),
    parentStitchCenterNodeConsumedByIdentity:
      centerReplay.independentlyConfirmedCenterNodeObjectIdentity,
    centerReplay,
    nodes: nodeSummaries,
    directedPaths,
    roundTrips,
    rootCensuses,
    failureProbes: failureProbeSummaries,
    aggregateMetrics,
    routeScopeSha256: digestProjection(
      "route-scope",
      graph.routeScope,
      sha256Hex,
    ),
    finiteVolumeGraphPass: graph.phaseB1LandCoupledFiniteVolumeGraphPass,
    broadClaims,
    pureCoreParentEvidenceAuthenticationClaimed:
      graph.pureCoreParentEvidenceAuthenticationClaimed,
    evidenceLayerDirectParentLineageAuthentication: true as const,
    testOnly: graph.testOnly,
    inventoryPass,
    modePass,
  });
}

function nodeSummary(
  audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const node = audit.node;
  return Object.freeze({
    nodeId: audit.nodeId,
    digestSha256: digestProjection(
      `canonical-node:${audit.nodeId}`,
      nodeAuditProjection(audit, sha256Hex),
      sha256Hex,
    ),
    scaledResidualInfinityNorm: node.scaledResidualInfinityNorm,
    scaledUpdateInfinityNorm: node.scaledUpdateInfinityNorm,
    maximumLocalMaterialResidualInfinityNorm:
      node.maximumLocalMaterialResidualInfinityNorm,
    minimumLandSimplexMargin: node.minimumLandSimplexMargin,
    effectiveTriSegSigmaMinimum: node.effectiveTriSegAudit.sigmaMinimum,
    effectiveTriSegConditionNumber2:
      node.effectiveTriSegAudit.conditionNumber2,
    staticRestoringMargin: node.effectiveTriSegAudit.robustSignedMargin,
    schurToReequilibratedDifferenceTwoNorm:
      node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
    maximumAssembledToRawLandActiveDifferencePa:
      audit.landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa,
    fixedStateExact: audit.fixedStateExact,
    hardGatePass: audit.hardGatePass,
    fiftyPercentGuardPass: audit.fiftyPercentGuardPass,
  });
}

function pathSummary(
  path: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const firstNodes = path.attempts.map((attempt) =>
    firstContinuationNode(attempt.continuation));
  const exactSourceObjectIdentity = firstNodes.every(
    (node) => node !== null && Object.is(node, expectedSourceNode),
  );
  const declaredFactors =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
      .continuation.refinementFactors;
  const factorPrefixExact = path.attempts.every(
    (attempt, index) => attempt.refinementFactor === declaredFactors[index],
  );
  const firstGuardPassingIndex = path.attempts.findIndex(
    (attempt) => attempt.fiftyPercentGuardPass,
  );
  const recomputedSelectedIndex = firstGuardPassingIndex < 0
    ? null
    : firstGuardPassingIndex;
  const stoppedAtFirstGuardPass = recomputedSelectedIndex === null
    ? path.attempts.length === declaredFactors.length
    : path.attempts.length === recomputedSelectedIndex + 1;
  const selectionRuleRecomputedPass = factorPrefixExact
    && stoppedAtFirstGuardPass
    && path.selectedAttemptIndex === recomputedSelectedIndex
    && path.selectedRefinementFactor === (
      recomputedSelectedIndex === null
        ? null
        : path.attempts[recomputedSelectedIndex].refinementFactor
    )
    && path.firstGuardPassingFactor === (
      recomputedSelectedIndex === null
        ? null
        : path.attempts[recomputedSelectedIndex].refinementFactor
    );
  const attempts = Object.freeze(path.attempts.map((attempt, index) =>
    Object.freeze({
      attemptIndex: index,
      refinementFactor: attempt.refinementFactor,
      digestSha256: digestProjection(
        `path-attempt:${canonicalPathId(path)}:${index}`,
        attemptProjection(attempt, expectedSourceNode, sha256Hex),
        sha256Hex,
      ),
      hardGatePass: attempt.hardGatePass,
      fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
      refinementTrigger: attempt.refinementTrigger,
      sourceNodeObjectIdentity: Object.is(
        firstContinuationNode(attempt.continuation),
        expectedSourceNode,
      ),
    })));
  const allRecordedProhibitedOperationsAbsent =
    !path.hiddenSubdivisionApplied
    && !path.pseudoArclengthApplied
    && !path.etaHomotopyRescueApplied
    && !path.rootRankingApplied
    && path.attempts.every((attempt) =>
      continuationProhibitedAbsent(attempt.continuation)
      && attempt.nodeAudits.every((audit) =>
        audit.prohibitedOperationsAbsent));
  return Object.freeze({
    pathId: canonicalPathId(path),
    edgeId: path.edgeId,
    edgeClass: path.edgeClass,
    pathRole: path.pathRole,
    direction: path.direction,
    sourceNodeId: path.sourceNodeId,
    destinationNodeId: path.destinationNodeId,
    digestSha256: digestProjection(
      `path:${canonicalPathId(path)}`,
      pathProjection(path, expectedSourceNode, sha256Hex),
      sha256Hex,
    ),
    attempts,
    selectedAttemptIndex: closedNullable(path.selectedAttemptIndex),
    selectedRefinementFactor: closedNullable(path.selectedRefinementFactor),
    firstGuardPassingFactor: closedNullable(path.firstGuardPassingFactor),
    destinationAgreementScaledInfinityNorm:
      closedNullable(path.destinationAgreementScaledInfinityNorm),
    factorPrefixExact,
    stoppedAtFirstGuardPass,
    selectionRuleRecomputedPass,
    exactSourceObjectIdentity,
    allRecordedProhibitedOperationsAbsent,
    accepted: path.accepted,
  });
}

function censusSummary(
  census: PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1,
  canonicalNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  unknownScales: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
) {
  const declaredProjection = censusProjection(census.declared, sha256Hex);
  const reverseProjection = censusProjection(census.reverse, sha256Hex);
  const declaredPartition = censusPartitionPass(
    census.declared,
    unknownScales,
  );
  const reversePartition = censusPartitionPass(
    census.reverse,
    unknownScales,
  );
  const expectedDeclaredSeeds =
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds;
  const expectedReverseSeeds = Object.freeze([...expectedDeclaredSeeds].reverse());
  const declaredInventoryRecomputedPass = census.declared.seedOrder
      === "declared"
    && census.declared.seeds.length === expectedDeclaredSeeds.length
    && census.declared.results.length === expectedDeclaredSeeds.length
    && canonicalizeJson(census.declared.seeds)
      === canonicalizeJson(expectedDeclaredSeeds)
    && census.declared.enumerationCompleted
    && census.declared.allSeedsAttempted
    && census.declared.allSeedsConverged
    && census.declared.allDiscoveredRootsReported
    && !census.declared.selectionInputToAcceptedPath
    && !census.declared.globalExhaustivenessClaimed;
  const reverseInventoryRecomputedPass = census.reverse.seedOrder === "reverse"
    && census.reverse.seeds.length === expectedReverseSeeds.length
    && census.reverse.results.length === expectedReverseSeeds.length
    && canonicalizeJson(census.reverse.seeds)
      === canonicalizeJson(expectedReverseSeeds)
    && census.reverse.enumerationCompleted
    && census.reverse.allSeedsAttempted
    && census.reverse.allSeedsConverged
    && census.reverse.allDiscoveredRootsReported
    && !census.reverse.selectionInputToAcceptedPath
    && !census.reverse.globalExhaustivenessClaimed;
  const recomputedBijection = censusClusterSetsBijective(
    census.declared,
    census.reverse,
    unknownScales,
  );
  const declaredTracked = trackedRestoringClusterCount(
    census.declared,
    canonicalNode,
    unknownScales,
  );
  const reverseTracked = trackedRestoringClusterCount(
    census.reverse,
    canonicalNode,
    unknownScales,
  );
  const partitionAndBijectionRecomputedPass = declaredPartition
    && reversePartition
    && declaredInventoryRecomputedPass
    && reverseInventoryRecomputedPass
    && recomputedBijection
    && declaredTracked === 1
    && reverseTracked === 1;
  return Object.freeze({
    nodeId: census.nodeId,
    digestSha256: digestProjection(`node-census:${census.nodeId}`, Object.freeze({
      nodeId: census.nodeId,
      declared: declaredProjection,
      reverse: reverseProjection,
      clusterSetsBijective: census.clusterSetsBijective,
      declaredInventoryPass: census.declaredInventoryPass,
      reverseInventoryPass: census.reverseInventoryPass,
      declaredTrackedRestoringClusterCount:
        census.declaredTrackedRestoringClusterCount,
      reverseTrackedRestoringClusterCount:
        census.reverseTrackedRestoringClusterCount,
      trackedCanonicalMatchesExactlyOneRestoringCluster:
        census.trackedCanonicalMatchesExactlyOneRestoringCluster,
      pass: census.pass,
    }), sha256Hex),
    declaredDigestSha256: digestProjection(
      `node-census:${census.nodeId}:declared`,
      declaredProjection,
      sha256Hex,
    ),
    reverseDigestSha256: digestProjection(
      `node-census:${census.nodeId}:reverse`,
      reverseProjection,
      sha256Hex,
    ),
    declaredSeedCount: census.declared.seeds.length,
    reverseSeedCount: census.reverse.seeds.length,
    declaredResultCount: census.declared.results.length,
    reverseResultCount: census.reverse.results.length,
    declaredClusterCount: census.declared.clusters.length,
    reverseClusterCount: census.reverse.clusters.length,
    declaredPartitionRecomputedPass: declaredPartition,
    reversePartitionRecomputedPass: reversePartition,
    declaredInventoryRecomputedPass,
    reverseInventoryRecomputedPass,
    clusterSetsBijectiveRecomputedPass: recomputedBijection,
    declaredTrackedRestoringClusterCountRecomputed: declaredTracked,
    reverseTrackedRestoringClusterCountRecomputed: reverseTracked,
    partitionAndBijectionRecomputedPass,
    censusPass: census.pass,
  });
}

function failureProbeSummary(
  probe: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const result = probe.result;
  const sourceIdentity = result.acceptedNodes.length > 0
    && Object.is(result.acceptedNodes[0].node, sourceNode);
  const rollbackNodeIsSource = Object.is(result.rollbackNode.node, sourceNode);
  const midpoint = result.acceptedNodes[1] ?? null;
  const rollbackNodeIsAcceptedMidpoint = midpoint !== null
    && Object.is(result.rollbackNode, midpoint);
  const rollbackUnknownsIdentity = Object.is(
    result.rollbackUnknowns,
    result.rollbackNode.node.unknowns,
  );
  const prohibitedRescueBoundaryPass = continuationProhibitedAbsent(result);
  const expectedRollbackIdentity = probe.injectedAttemptIndex === 0
    ? rollbackNodeIsSource && !rollbackNodeIsAcceptedMidpoint
    : !rollbackNodeIsSource && rollbackNodeIsAcceptedMidpoint;
  const probePass = result.reason === "injected-structured-failure"
    && result.failedAttempt.attemptIndex === probe.injectedAttemptIndex
    && sourceIdentity
    && rollbackUnknownsIdentity
    && expectedRollbackIdentity
    && prohibitedRescueBoundaryPass;
  return Object.freeze({
    probeId: `${result.slsMode}:C-to-E:attempt-${probe.injectedAttemptIndex}`,
    injectedAttemptIndex: probe.injectedAttemptIndex,
    digestSha256: digestProjection(
      `failure-probe:${result.slsMode}:C-to-E:${probe.injectedAttemptIndex}`,
      failureProbeProjection(probe, sourceNode, sha256Hex),
      sha256Hex,
    ),
    direction: result.direction,
    refinementFactor: result.refinementFactor,
    acceptedNodeCount: result.acceptedNodes.length,
    attemptedSValues: Object.freeze([...result.attemptedSValues]),
    reason: result.reason,
    sourceNodeObjectIdentity: sourceIdentity,
    rollbackNodeIsSourceObject: rollbackNodeIsSource,
    rollbackNodeIsAcceptedMidpointObject: rollbackNodeIsAcceptedMidpoint,
    rollbackUnknownsObjectIdentity: rollbackUnknownsIdentity,
    prohibitedRescueBoundaryPass,
    probePass,
  });
}

function nodeAuditProjection(
  audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    nodeId: audit.nodeId,
    ledger: Object.freeze({
      nodeId: audit.ledger.nodeId,
      bloodVolumesM3: numericRecordProjection(
        audit.ledger.bloodVolumesM3,
        BLOOD_COMPARTMENT_IDS,
      ),
      deltaLeftVentricularVolumeM3:
        audit.ledger.deltaLeftVentricularVolumeM3,
      deltaRightVentricularVolumeM3:
        audit.ledger.deltaRightVentricularVolumeM3,
      anchorTotalBloodVolumeM3: audit.ledger.anchorTotalBloodVolumeM3,
      nodeTotalBloodVolumeM3: audit.ledger.nodeTotalBloodVolumeM3,
      totalBloodVolumeDifferenceM3:
        audit.ledger.totalBloodVolumeDifferenceM3,
      relativeTotalBloodVolumeDifference:
        audit.ledger.relativeTotalBloodVolumeDifference,
      allVolumesPositive: audit.ledger.allVolumesPositive,
      unchangedCompartmentsExact: audit.ledger.unchangedCompartmentsExact,
      complementLedgerExact: audit.ledger.complementLedgerExact,
      accepted: audit.ledger.accepted,
    }),
    node: nodeProjection(audit.node, sha256Hex),
    etaOneExact: audit.etaOneExact,
    fixedStateExact: audit.fixedStateExact,
    effectiveTriSegRestoringPass: audit.effectiveTriSegRestoringPass,
    landIdentityAudit: landIdentityProjection(audit),
    thresholdMetricsFinite: audit.thresholdMetricsFinite,
    thresholdNormMetricsNonnegative: audit.thresholdNormMetricsNonnegative,
    prohibitedOperationsAbsent: audit.prohibitedOperationsAbsent,
    hardGatePass: audit.hardGatePass,
    fiftyPercentGuardPass: audit.fiftyPercentGuardPass,
  });
}

function nodeProjection(
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    converged: node.converged,
    eta: node.eta,
    endpoint: endpointProjection(node.endpoint),
    unknowns: numberVector(node.unknowns, "node.unknowns"),
    residualEvaluation: Object.freeze({
      eta: node.residualEvaluation.eta,
      residual: numberVector(
        node.residualEvaluation.residual,
        "node.residualEvaluation.residual",
      ),
      endpoint: endpointProjection(node.residualEvaluation.endpoint),
      freeCalciumUMByWall: numericRecordProjection(
        node.residualEvaluation.freeCalciumUMByWall,
        WALL_IDS,
      ),
      maximumAbsolutePopulationRhsPerSec:
        node.residualEvaluation.maximumAbsolutePopulationRhsPerSec,
      maximumAbsoluteDistortionConstraint:
        node.residualEvaluation.maximumAbsoluteDistortionConstraint,
      maximumAbsoluteSlsConstraint:
        node.residualEvaluation.maximumAbsoluteSlsConstraint,
      triSegResidualNPerM: Object.freeze({
        axial: node.residualEvaluation.triSegResidualNPerM.axial,
        radial: node.residualEvaluation.triSegResidualNPerM.radial,
      }),
      orderedWallDigests: Object.freeze(WALL_IDS.map((wallId) =>
        Object.freeze({
          wallId,
          closedLoopMechanicsSha256: digestProjection(
            `node-wall-closed-loop-mechanics:${wallId}`,
            closedLoopWallMechanicsProjection(
              node.residualEvaluation.closedLoop.wallMechanics[wallId],
            ),
            sha256Hex,
          ),
          materialStateSha256: digestProjection(
            `node-wall-material-state:${wallId}`,
            wallMaterialProjection(
              node.residualEvaluation.wallMaterialByWall[wallId],
            ),
            sha256Hex,
          ),
          backwardEulerSha256: digestProjection(
            `node-wall-backward-euler:${wallId}`,
            wallBackwardEulerProjection(
              node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall[
                wallId
              ],
            ),
            sha256Hex,
          ),
        }))),
      projectionApplied: node.residualEvaluation.projectionApplied,
      clippingApplied: node.residualEvaluation.clippingApplied,
    }),
    algorithmicJacobian: Object.freeze({
      algorithmId: node.algorithmicJacobian.algorithmId,
      rawJacobian: numberMatrix(
        node.algorithmicJacobian.rawJacobian,
        "node.algorithmicJacobian.rawJacobian",
      ),
      scaledJacobian: numberMatrix(
        node.algorithmicJacobian.scaledJacobian,
        "node.algorithmicJacobian.scaledJacobian",
      ),
      stencilByColumn: denseCopy(
        node.algorithmicJacobian.stencilByColumn,
        "node.algorithmicJacobian.stencilByColumn",
      ),
      scaledStep: node.algorithmicJacobian.scaledStep,
      scaledStepByColumn: numberVector(
        node.algorithmicJacobian.scaledStepByColumn,
        "node.algorithmicJacobian.scaledStepByColumn",
      ),
    }),
    newtonDiagnostics: newtonDiagnosticsProjection(node.newtonDiagnostics),
    minimumLandSimplexMargin: node.minimumLandSimplexMargin,
    maximumLocalMaterialResidualInfinityNorm:
      node.maximumLocalMaterialResidualInfinityNorm,
    effectiveTriSegAudit: effectiveTriSegProjection(
      node.effectiveTriSegAudit,
    ),
    scaledResidualInfinityNorm: node.scaledResidualInfinityNorm,
    scaledUpdateInfinityNorm: node.scaledUpdateInfinityNorm,
    projectionApplied: node.projectionApplied,
    clippingApplied: node.clippingApplied,
    fallbackApplied: node.fallbackApplied,
  });
}

function closedLoopWallMechanicsProjection(
  wall: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[
    "residualEvaluation"
  ]["closedLoop"]["wallMechanics"][FourChamberWallId],
) {
  return Object.freeze({
    wallId: wall.wallId,
    fiberLogStrain: wall.fiberLogStrain,
    wallReferenceMaterialVolumeM3: wall.wallReferenceMaterialVolumeM3,
    equilibriumPassive: equilibriumPassiveProjection(wall.equilibriumPassive),
    activeKirchhoffStressPa: wall.activeKirchhoffStressPa,
    activeStressTimeDerivativePaPerSec:
      wall.activeStressTimeDerivativePaPerSec,
    slsOverstressPa: wall.slsOverstressPa,
    slsStoredEnergyJ: wall.slsStoredEnergyJ,
    slsPhysicalDissipationW: wall.slsPhysicalDissipationW,
    totalKirchhoffStressPa: wall.totalKirchhoffStressPa,
    totalTangentAtFixedInternalStatePa:
      wall.totalTangentAtFixedInternalStatePa,
  });
}

function wallMaterialProjection(
  material: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[
    "residualEvaluation"
  ]["wallMaterialByWall"][FourChamberWallId],
) {
  const source = material.sourceLandOutput;
  return Object.freeze({
    kernelId: material.kernelId,
    wallId: material.wallId,
    tissueClass: material.tissueClass,
    fiberLogStrain: material.fiberLogStrain,
    length: Object.freeze({
      adapterId: material.length.adapterId,
      tissueManifestSha256: material.length.tissueManifestSha256,
      passiveAndSlsLogStrain: material.length.passiveAndSlsLogStrain,
      geometryStretch: material.length.geometryStretch,
      landStretch: material.length.landStretch,
      landEngineeringStrain: material.length.landEngineeringStrain,
      landStretchDerivativeByLogStrain:
        material.length.landStretchDerivativeByLogStrain,
    }),
    reconstructedSourceLandState: numberVector(
      material.reconstructedSourceLandState,
      `wallMaterial.${material.wallId}.reconstructedSourceLandState`,
    ),
    sourceLandOutput: Object.freeze({
      sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
      sourceStressConvention: source.sourceStressConvention,
      stabilizationStiffnessPa: source.stabilizationStiffnessPa,
      algorithmicTangentPa: closedOwnProperty(source, "algorithmicTangentPa"),
      frozenStateTangentPa: closedOwnProperty(source, "frozenStateTangentPa"),
      sourceActivePowerDensityWPerM3: source.sourceActivePowerDensityWPerM3,
      health: Object.freeze({
        finite: source.health.finite,
        stateConservationResidual: source.health.stateConservationResidual,
        minimumPopulation: source.health.minimumPopulation,
        projectionUsed: source.health.projectionUsed,
      }),
    }),
    sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState:
      material.sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState,
    wallActiveKirchhoffStressPa: material.wallActiveKirchhoffStressPa,
    wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState:
      material.wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState,
    wallActiveStressPartialsPaByLandState: numberVector(
      material.wallActiveStressPartialsPaByLandState,
      `wallMaterial.${material.wallId}.wallActiveStressPartialsPaByLandState`,
    ),
    passive: equilibriumPassiveProjection(material.passive),
    sls: Object.freeze({
      mode: material.sls.mode,
      statePhysicallyPresent: material.sls.statePhysicallyPresent,
      alphaV: closedNullable(material.sls.alphaV),
      overstressPa: material.sls.overstressPa,
      storedEnergyDensityJPerM3: material.sls.storedEnergyDensityJPerM3,
      stressPartialPaPerFiberLogStrainAtFixedAlpha:
        material.sls.stressPartialPaPerFiberLogStrainAtFixedAlpha,
      stressPartialPaPerAlphaV:
        closedNullable(material.sls.stressPartialPaPerAlphaV),
    }),
    totalWallKirchhoffStressPa: material.totalWallKirchhoffStressPa,
    totalStressPartialPaPerFiberLogStrainAtFixedInternalState:
      material.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
    totalStressPartialsPaByLandState: numberVector(
      material.totalStressPartialsPaByLandState,
      `wallMaterial.${material.wallId}.totalStressPartialsPaByLandState`,
    ),
    totalStressPartialPaPerAlphaV:
      closedNullable(material.totalStressPartialPaPerAlphaV),
    stabilizationStiffnessIncludedInStressOrTangent:
      material.stabilizationStiffnessIncludedInStressOrTangent,
    productionStateResidualUsesStrainRate:
      material.productionStateResidualUsesStrainRate,
  });
}

function wallBackwardEulerProjection(
  backwardEuler: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[
    "residualEvaluation"
  ]["wallBackwardEulerAtEqualStatesByWall"][FourChamberWallId],
) {
  return Object.freeze({
    kernelId: backwardEuler.kernelId,
    state: wallMaterialProjection(backwardEuler.state),
    landResidual: numberVector(
      backwardEuler.landResidual,
      "wallBackwardEuler.landResidual",
    ),
    landStateJacobianRowMajor: numberVector(
      backwardEuler.landStateJacobianRowMajor,
      "wallBackwardEuler.landStateJacobianRowMajor",
    ),
    landResidualPartialByNextFiberLogStrain: numberVector(
      backwardEuler.landResidualPartialByNextFiberLogStrain,
      "wallBackwardEuler.landResidualPartialByNextFiberLogStrain",
    ),
    slsResidual: closedNullable(backwardEuler.slsResidual),
    slsResidualPartialByNextFiberLogStrain:
      closedNullable(backwardEuler.slsResidualPartialByNextFiberLogStrain),
    slsResidualPartialByNextAlphaV:
      closedNullable(backwardEuler.slsResidualPartialByNextAlphaV),
    calciumResidualPresent: backwardEuler.calciumResidualPresent,
    calciumIsKnownEndpointForcing:
      backwardEuler.calciumIsKnownEndpointForcing,
    productionStateResidualUsesStrainRate:
      backwardEuler.productionStateResidualUsesStrainRate,
  });
}

function equilibriumPassiveProjection(
  passive: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[
    "residualEvaluation"
  ]["closedLoop"]["wallMechanics"][FourChamberWallId]["equilibriumPassive"],
) {
  return Object.freeze({
    modelId: passive.modelId,
    priorId: passive.priorId,
    fiberLogStrain: passive.fiberLogStrain,
    region: passive.region,
    storedEnergyDensityJPerM3: passive.storedEnergyDensityJPerM3,
    equilibriumKirchhoffStressPa: passive.equilibriumKirchhoffStressPa,
    dStressDFiberLogStrainPa: passive.dStressDFiberLogStrainPa,
    stressSource: passive.stressSource,
    tangentSource: passive.tangentSource,
    stressClipped: passive.stressClipped,
  });
}

function endpointProjection(endpoint: PhaseB1EndpointStateV1) {
  const state = endpoint.differentialState;
  return Object.freeze({
    stateId: endpoint.stateId,
    timeSec: endpoint.timeSec,
    differentialState: Object.freeze({
      slsMode: state.slsMode,
      bloodVolumesM3: numericRecordProjection(
        state.bloodVolumesM3,
        BLOOD_COMPARTMENT_IDS,
      ),
      inertialFlowsM3PerSec: numericRecordProjection(
        state.inertialFlowsM3PerSec,
        INERTIAL_FLOW_IDS,
      ),
      calciumByWall: wallRecord((wallId) => Object.freeze({
        r: state.calciumByWall[wallId].r,
        d: state.calciumByWall[wallId].d,
      })),
      landByWall: wallRecord((wallId) => numberVector(
        state.landByWall[wallId],
        `endpoint.landByWall.${wallId}`,
      )),
      slsAlphaVByWall: closedOwnProperty(
        state,
        "slsAlphaVByWall",
        (value) => numericRecordProjection(
          value as Readonly<Record<FourChamberWallId, number>>,
          WALL_IDS,
        ),
      ),
    }),
    triSegCoordinates: Object.freeze({
      V_m_S: endpoint.triSegCoordinates.V_m_S,
      y_m: endpoint.triSegCoordinates.y_m,
    }),
  });
}

function landIdentityProjection(audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1) {
  return Object.freeze({
    wallByWall: wallRecord((wallId) => Object.freeze({
      rawLandActiveStressPa:
        audit.landIdentityAudit.wallByWall[wallId].rawLandActiveStressPa,
      assembledActiveStressPa:
        audit.landIdentityAudit.wallByWall[wallId].assembledActiveStressPa,
      absoluteDifferencePa:
        audit.landIdentityAudit.wallByWall[wallId].absoluteDifferencePa,
    })),
    maximumAssembledToRawLandActiveDifferencePa:
      audit.landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa,
    pass: audit.landIdentityAudit.pass,
  });
}

function effectiveTriSegProjection(
  audit: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1["effectiveTriSegAudit"],
) {
  return Object.freeze({
    auditId: audit.auditId,
    scaledSchurGeneralizedForceTangent: numberVector(
      audit.scaledSchurGeneralizedForceTangent,
      "effectiveTriSeg.scaledSchurGeneralizedForceTangent",
    ),
    scaledReequilibratedCoarseTangent: numberVector(
      audit.scaledReequilibratedCoarseTangent,
      "effectiveTriSeg.scaledReequilibratedCoarseTangent",
    ),
    scaledReequilibratedFineTangent: numberVector(
      audit.scaledReequilibratedFineTangent,
      "effectiveTriSeg.scaledReequilibratedFineTangent",
    ),
    symmetricFineTangent: numberVector(
      audit.symmetricFineTangent,
      "effectiveTriSeg.symmetricFineTangent",
    ),
    eigenvaluesAscending: numberVector(
      audit.eigenvaluesAscending,
      "effectiveTriSeg.eigenvaluesAscending",
    ),
    derivativeDisagreementTwoNorm: audit.derivativeDisagreementTwoNorm,
    uncertaintyBound: audit.uncertaintyBound,
    robustSignedMargin: audit.robustSignedMargin,
    classification: audit.classification,
    sigmaMinimum: audit.sigmaMinimum,
    conditionNumber2: audit.conditionNumber2,
    schurToReequilibratedDifferenceTwoNorm:
      audit.schurToReequilibratedDifferenceTwoNorm,
    withinPublishedTaylorTwoPercentTensionErrorDomain:
      audit.withinPublishedTaylorTwoPercentTensionErrorDomain,
    accepted: audit.accepted,
    energeticStabilityClaimed: audit.energeticStabilityClaimed,
    globalUniquenessClaimed: audit.globalUniquenessClaimed,
  });
}

function newtonDiagnosticsProjection(
  diagnostics: ScaledDampedNewtonDiagnosticsV1,
) {
  return Object.freeze({
    newtonIterationCount: diagnostics.newtonIterationCount,
    acceptedStepCount: diagnostics.acceptedStepCount,
    modelEvaluationCount: diagnostics.modelEvaluationCount,
    totalBacktrackCount: diagnostics.totalBacktrackCount,
    finalResidualInfinityNorm:
      closedNullable(diagnostics.finalResidualInfinityNorm),
    finalUpdateInfinityNorm: diagnostics.finalUpdateInfinityNorm,
    history: Object.freeze(denseCopy(
      diagnostics.history,
      "newtonDiagnostics.history",
    ).map((iteration, index) => Object.freeze({
      historyIndex: index,
      iteration: iteration.iteration,
      residualInfinityNorm: iteration.residualInfinityNorm,
      residualTwoNorm: iteration.residualTwoNorm,
      merit: iteration.merit,
      previousAcceptedUpdateInfinityNorm:
        iteration.previousAcceptedUpdateInfinityNorm,
      rawNewtonUpdateInfinityNorm:
        closedNullable(iteration.rawNewtonUpdateInfinityNorm),
      fractionToBoundaryMaximumStep:
        closedNullable(iteration.fractionToBoundaryMaximumStep),
      fractionToBoundaryLimitingUnknownIndex:
        closedNullable(iteration.fractionToBoundaryLimitingUnknownIndex),
      fractionToBoundaryLimitingAffineConstraintId:
        closedNullable(iteration.fractionToBoundaryLimitingAffineConstraintId),
      acceptedStepLength: closedNullable(iteration.acceptedStepLength),
      acceptedUpdateInfinityNorm:
        closedNullable(iteration.acceptedUpdateInfinityNorm),
      backtrackCount: iteration.backtrackCount,
      inadmissibleTrialCount: iteration.inadmissibleTrialCount,
      nonFiniteTrialCount: iteration.nonFiniteTrialCount,
      linearSolve: closedNullableMapped(
        iteration.linearSolve,
        denseLuProjection,
      ),
      outcome: iteration.outcome,
      modelDiagnostic: closedOwnProperty(iteration, "modelDiagnostic"),
      acceptedTrialModelDiagnostic: closedOwnProperty(
        iteration,
        "acceptedTrialModelDiagnostic",
      ),
    }))),
  });
}

function denseLuProjection(
  diagnostics: NonNullable<
    ScaledDampedNewtonDiagnosticsV1["history"][number]["linearSolve"]
  >,
) {
  return Object.freeze({
    dimension: diagnostics.dimension,
    matrixInfinityNorm: diagnostics.matrixInfinityNorm,
    maximumAbsoluteOriginalEntry: diagnostics.maximumAbsoluteOriginalEntry,
    maximumAbsoluteFactorEntry: diagnostics.maximumAbsoluteFactorEntry,
    minimumAbsolutePivot: diagnostics.minimumAbsolutePivot,
    maximumAbsolutePivot: diagnostics.maximumAbsolutePivot,
    relativeMinimumPivot: diagnostics.relativeMinimumPivot,
    pivotGrowthFactor: diagnostics.pivotGrowthFactor,
    rowSwapCount: diagnostics.rowSwapCount,
    pivotThreshold: diagnostics.pivotThreshold,
  });
}

function pathProjection(
  path: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    edgeId: path.edgeId,
    edgeClass: path.edgeClass,
    pathRole: path.pathRole,
    direction: path.direction,
    sourceNodeId: path.sourceNodeId,
    destinationNodeId: path.destinationNodeId,
    attempts: Object.freeze(path.attempts.map((attempt, index) => Object.freeze({
      attemptIndex: index,
      projection: attemptProjection(attempt, expectedSourceNode, sha256Hex),
    }))),
    selectedAttemptIndex: closedNullable(path.selectedAttemptIndex),
    selectedRefinementFactor: closedNullable(path.selectedRefinementFactor),
    firstGuardPassingFactor: closedNullable(path.firstGuardPassingFactor),
    selectionRuleAuditPass: path.selectionRuleAuditPass,
    destinationAgreementScaledInfinityNorm:
      closedNullable(path.destinationAgreementScaledInfinityNorm),
    accepted: path.accepted,
    declaredRollbackUnknownsOnFailure: numberVector(
      path.declaredRollbackUnknownsOnFailure,
      "path.declaredRollbackUnknownsOnFailure",
    ),
    hiddenSubdivisionApplied: path.hiddenSubdivisionApplied,
    pseudoArclengthApplied: path.pseudoArclengthApplied,
    etaHomotopyRescueApplied: path.etaHomotopyRescueApplied,
    rootRankingApplied: path.rootRankingApplied,
  });
}

function attemptProjection(
  attempt: PhaseB1EtaOneFiniteVolumePathAttemptV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    refinementFactor: attempt.refinementFactor,
    continuation: continuationProjection(
      attempt.continuation,
      expectedSourceNode,
      sha256Hex,
    ),
    nodeAudits: Object.freeze(attempt.nodeAudits.map((audit, index) =>
      Object.freeze({
        nodeIndex: index,
        nodeId: audit.nodeId,
        nodeAuditDigestSha256: digestProjection(
          `attempt-node:${audit.nodeId}`,
          nodeAuditProjection(audit, sha256Hex),
          sha256Hex,
        ),
      }))),
    hardGatePass: attempt.hardGatePass,
    fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
    refinementTrigger: attempt.refinementTrigger,
  });
}

function continuationProjection(
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const common = Object.freeze({
    continuationId: continuation.continuationId,
    slsMode: continuation.slsMode,
    direction: continuation.direction,
    refinementFactor: continuation.refinementFactor,
    requestedSValues: numberVector(
      continuation.requestedSValues,
      "continuation.requestedSValues",
    ),
    attemptedSValues: numberVector(
      continuation.attemptedSValues,
      "continuation.attemptedSValues",
    ),
    sourceBloodVolumesM3: numericRecordProjection(
      continuation.sourceBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    destinationBloodVolumesM3: numericRecordProjection(
      continuation.destinationBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    previousNodeUsedAs: continuation.previousNodeUsedAs,
    hiddenSubdivisionApplied: continuation.hiddenSubdivisionApplied,
    pseudoArclengthApplied: continuation.pseudoArclengthApplied,
    projectionApplied: continuation.projectionApplied,
    clippingApplied: continuation.clippingApplied,
    nearestRootSelectionApplied: continuation.nearestRootSelectionApplied,
    minimumResidualRootSelectionApplied:
      continuation.minimumResidualRootSelectionApplied,
    maximumJunctionRadiusRootSelectionApplied:
      continuation.maximumJunctionRadiusRootSelectionApplied,
  });
  if (continuation.completed === true) {
    return Object.freeze({
      ...common,
      completed: true as const,
      sourceNodeObjectIdentity: Object.is(
        continuation.nodes[0]?.node,
        expectedSourceNode,
      ),
      nodes: Object.freeze(continuation.nodes.map((loadNode, index) =>
        loadNodeProjection(loadNode, index, sha256Hex))),
      edgeAudits: Object.freeze(continuation.edgeAudits.map((edge, index) =>
        continuationEdgeProjection(edge, index, sha256Hex))),
      endpointNodeObjectIdentity: Object.is(
        continuation.endpoint,
        continuation.nodes[continuation.nodes.length - 1],
      ),
      maximumCoarseFineScaledTangentDisagreement:
        continuation.maximumCoarseFineScaledTangentDisagreement,
      maximumAcceptedNodeStepScaledInfinityNorm:
        continuation.maximumAcceptedNodeStepScaledInfinityNorm,
      maximumPredictorCorrectionScaledInfinityNorm:
        continuation.maximumPredictorCorrectionScaledInfinityNorm,
      branchIdentityEstablished: continuation.branchIdentityEstablished,
      branchIdentity: continuation.branchIdentity,
    });
  }
  return Object.freeze({
    ...common,
    completed: false as const,
    sourceNodeObjectIdentity: Object.is(
      continuation.acceptedNodes[0]?.node,
      expectedSourceNode,
    ),
    acceptedNodes: Object.freeze(continuation.acceptedNodes.map(
      (loadNode, index) => loadNodeProjection(loadNode, index, sha256Hex),
    )),
    edgeAudits: Object.freeze(continuation.edgeAudits.map((edge, index) =>
      continuationEdgeProjection(edge, index, sha256Hex))),
    failedAttempt: failedAttemptProjection(
      continuation.failedAttempt,
      sha256Hex,
    ),
    reason: continuation.reason,
    message: continuation.message,
    rollbackNode: loadNodeProjection(
      continuation.rollbackNode,
      -1,
      sha256Hex,
    ),
    rollbackUnknowns: numberVector(
      continuation.rollbackUnknowns,
      "continuation.rollbackUnknowns",
    ),
    rollbackBloodVolumesM3: numericRecordProjection(
      continuation.rollbackBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    rollbackNodeObjectIdentity: Object.is(
      continuation.rollbackNode,
      continuation.acceptedNodes[continuation.acceptedNodes.length - 1],
    ),
    rollbackUnknownsObjectIdentity: Object.is(
      continuation.rollbackUnknowns,
      continuation.rollbackNode.node.unknowns,
    ),
    branchIdentityEstablished: continuation.branchIdentityEstablished,
    branchIdentity: continuation.branchIdentity,
  });
}

function loadNodeProjection(
  loadNode: Readonly<{
    s: number;
    bloodVolumesM3: Readonly<Record<(typeof BLOOD_COMPARTMENT_IDS)[number], number>>;
    node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  }>,
  nodeIndex: number,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    nodeIndex,
    s: loadNode.s,
    bloodVolumesM3: numericRecordProjection(
      loadNode.bloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    nodeDigestSha256: digestProjection(
      `load-node:${nodeIndex}`,
      nodeProjection(loadNode.node, sha256Hex),
      sha256Hex,
    ),
  });
}

function continuationEdgeProjection(
  edge: Extract<
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
    { completed: true }
  >["edgeAudits"][number],
  edgeIndex: number,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    edgeIndex,
    reportedEdgeIndex: edge.edgeIndex,
    fromS: edge.fromS,
    toS: edge.toS,
    fromBloodVolumesM3: numericRecordProjection(
      edge.fromBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    toBloodVolumesM3: numericRecordProjection(
      edge.toBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    tangentAudit: tangentAuditProjection(edge.tangentAudit),
    predictorUnknowns: numberVector(
      edge.predictorUnknowns,
      "continuation.edge.predictorUnknowns",
    ),
    acceptedUnknowns: numberVector(
      edge.acceptedUnknowns,
      "continuation.edge.acceptedUnknowns",
    ),
    acceptedNodeStepScaledInfinityNorm:
      edge.acceptedNodeStepScaledInfinityNorm,
    predictorCorrectionScaledInfinityNorm:
      edge.predictorCorrectionScaledInfinityNorm,
    acceptedNode: loadNodeProjection(
      edge.acceptedNode,
      edgeIndex + 1,
      sha256Hex,
    ),
    acceptedUnknownsObjectIdentity: Object.is(
      edge.acceptedUnknowns,
      edge.acceptedNode.node.unknowns,
    ),
    edgePass: edge.edgePass,
  });
}

function tangentAuditProjection(
  tangent: PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1,
) {
  if (tangent.success === false) return Object.freeze({
    success: false as const,
    reason: tangent.reason,
    message: tangent.message,
    linearSolveFailureReason:
      closedNullable(tangent.linearSolveFailureReason),
    linearSolveDiagnostics: closedNullableMapped(
      tangent.linearSolveDiagnostics,
      denseLuProjection,
    ),
  });
  return Object.freeze({
    success: true as const,
    coarseStep: tangent.coarseStep,
    fineStep: tangent.fineStep,
    coarseStencil: tangent.coarseStencil,
    fineStencil: tangent.fineStencil,
    coarseScaledResidualDerivativeByS: numberVector(
      tangent.coarseScaledResidualDerivativeByS,
      "tangent.coarseScaledResidualDerivativeByS",
    ),
    fineScaledResidualDerivativeByS: numberVector(
      tangent.fineScaledResidualDerivativeByS,
      "tangent.fineScaledResidualDerivativeByS",
    ),
    coarseScaledUnknownTangentByS: numberVector(
      tangent.coarseScaledUnknownTangentByS,
      "tangent.coarseScaledUnknownTangentByS",
    ),
    fineScaledUnknownTangentByS: numberVector(
      tangent.fineScaledUnknownTangentByS,
      "tangent.fineScaledUnknownTangentByS",
    ),
    coarseLinearSolveDiagnostics:
      denseLuProjection(tangent.coarseLinearSolveDiagnostics),
    fineLinearSolveDiagnostics:
      denseLuProjection(tangent.fineLinearSolveDiagnostics),
    coarseFineScaledTangentDisagreement:
      tangent.coarseFineScaledTangentDisagreement,
    tangentDisagreementPass: tangent.tangentDisagreementPass,
  });
}

function failedAttemptProjection(
  attempt: Extract<
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
    { completed: false }
  >["failedAttempt"],
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    attemptIndex: attempt.attemptIndex,
    fromS: attempt.fromS,
    toS: attempt.toS,
    fromBloodVolumesM3: numericRecordProjection(
      attempt.fromBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    toBloodVolumesM3: numericRecordProjection(
      attempt.toBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    tangentAudit: closedNullableMapped(
      attempt.tangentAudit,
      tangentAuditProjection,
    ),
    predictorUnknowns: closedNullableMapped(
      attempt.predictorUnknowns,
      (value) => numberVector(value, "failedAttempt.predictorUnknowns"),
    ),
    correctorResult: closedNullableMapped(
      attempt.correctorResult,
      (value) => coldNodeResultProjection(value, sha256Hex),
    ),
    candidateNodeStepScaledInfinityNorm:
      closedNullable(attempt.candidateNodeStepScaledInfinityNorm),
    candidatePredictorCorrectionScaledInfinityNorm:
      closedNullable(attempt.candidatePredictorCorrectionScaledInfinityNorm),
  });
}

function coldNodeResultProjection(
  result: PhaseB1ColdEtaOneFixedVolumeNodeResultV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  if (result.converged === true) return Object.freeze({
    converged: true as const,
    node: nodeProjection(result, sha256Hex),
  });
  return Object.freeze({
    converged: false as const,
    eta: result.eta,
    reason: result.reason,
    message: result.message,
    rollbackUnknowns: numberVector(
      result.rollbackUnknowns,
      "coldNodeFailure.rollbackUnknowns",
    ),
    lastAcceptedUnknowns: closedNullableMapped(
      result.lastAcceptedUnknowns,
      (value) => numberVector(value, "coldNodeFailure.lastAcceptedUnknowns"),
    ),
    newtonDiagnostics: closedNullableMapped(
      result.newtonDiagnostics,
      newtonDiagnosticsProjection,
    ),
    projectionApplied: result.projectionApplied,
    clippingApplied: result.clippingApplied,
    fallbackApplied: result.fallbackApplied,
  });
}

function censusProjection(
  census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    eta: census.eta,
    seedOrder: census.seedOrder,
    seeds: Object.freeze(census.seeds.map((seed, seedIndex) => Object.freeze({
      seedIndex,
      V_m_S: seed.V_m_S,
      y_m: seed.y_m,
    }))),
    results: Object.freeze(census.results.map((result, resultIndex) =>
      Object.freeze({
        resultIndex,
        converged: result.converged,
        resultDigestSha256: digestProjection(
          `census-result:${census.seedOrder}:${resultIndex}`,
          coldNodeResultProjection(result, sha256Hex),
          sha256Hex,
        ),
        eta: result.eta,
        classification: result.converged
          ? closedValue(result.effectiveTriSegAudit.classification)
          : closedMissing(),
      }))),
    convergedRootCount: census.convergedRootCount,
    clusters: Object.freeze(census.clusters.map((cluster, clusterIndex) =>
      Object.freeze({
        clusterIndex,
        representativeResultIndex: cluster.representativeResultIndex,
        memberResultIndices: integerVector(
          cluster.memberResultIndices,
          `census.clusters[${clusterIndex}].memberResultIndices`,
        ),
        classification: cluster.classification,
        coordinates: Object.freeze({
          V_m_S: cluster.coordinates.V_m_S,
          y_m: cluster.coordinates.y_m,
        }),
        maximumMemberScaledInfinityDistance:
          cluster.maximumMemberScaledInfinityDistance,
        memberFullVectorDistancePass: cluster.memberFullVectorDistancePass,
        memberClassificationMatches: cluster.memberClassificationMatches,
      }))),
    enumerationCompleted: census.enumerationCompleted,
    allSeedsAttempted: census.allSeedsAttempted,
    allSeedsConverged: census.allSeedsConverged,
    convergedResultsPartitionedExactlyOnce:
      census.convergedResultsPartitionedExactlyOnce,
    allClusterMembersWithinFullVectorTolerance:
      census.allClusterMembersWithinFullVectorTolerance,
    allClusterMemberClassificationsMatch:
      census.allClusterMemberClassificationsMatch,
    allDiscoveredRootsReported: census.allDiscoveredRootsReported,
    globalExhaustivenessClaimed: census.globalExhaustivenessClaimed,
    selectionInputToAcceptedPath: census.selectionInputToAcceptedPath,
  });
}

function failureProbeProjection(
  probe: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const result = probe.result;
  return Object.freeze({
    probeId: probe.probeId,
    injectedAttemptIndex: probe.injectedAttemptIndex,
    result: continuationProjection(result, sourceNode, sha256Hex),
    sourceNodeObjectIdentity: Object.is(
      result.acceptedNodes[0]?.node,
      sourceNode,
    ),
    rollbackNodeIsSourceObject: Object.is(result.rollbackNode.node, sourceNode),
    rollbackNodeIsAcceptedMidpointObject:
      result.acceptedNodes[1] === undefined
        ? false
        : Object.is(result.rollbackNode, result.acceptedNodes[1]),
    rollbackUnknownsObjectIdentity: Object.is(
      result.rollbackUnknowns,
      result.rollbackNode.node.unknowns,
    ),
    prohibitedRescueBoundaryPass: continuationProhibitedAbsent(result),
  });
}

function aggregateModeMetrics(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
) {
  const paths = [
    ...graph.directedEdges,
    ...graph.roundTripAudits,
  ];
  const allNodeAudits = [
    ...graph.canonicalNodes,
    ...paths.flatMap((path) => path.attempts)
      .flatMap((attempt) => attempt.nodeAudits),
  ];
  const nodes = allNodeAudits.map((audit) => audit.node);
  const continuations = paths.flatMap((path) => path.attempts)
    .map((attempt) => attempt.continuation)
    .filter((continuation): continuation is Extract<
      PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
      { completed: true }
    > => continuation.completed);
  return Object.freeze({
    maximumScaledResidualInfinityNorm: maximum(
      nodes.map((node) => node.scaledResidualInfinityNorm),
    ),
    maximumScaledUpdateInfinityNorm: maximum(
      nodes.map((node) => node.scaledUpdateInfinityNorm),
    ),
    maximumLocalMaterialResidualInfinityNorm: maximum(
      nodes.map((node) => node.maximumLocalMaterialResidualInfinityNorm),
    ),
    minimumLandSimplexMargin: minimum(
      nodes.map((node) => node.minimumLandSimplexMargin),
    ),
    minimumEffectiveTriSegSigma: minimum(
      nodes.map((node) => node.effectiveTriSegAudit.sigmaMinimum),
    ),
    maximumEffectiveTriSegConditionNumber2: maximum(
      nodes.map((node) => node.effectiveTriSegAudit.conditionNumber2),
    ),
    minimumStaticRestoringMargin: minimum(
      nodes.map((node) => node.effectiveTriSegAudit.robustSignedMargin),
    ),
    maximumSchurToReequilibratedDifferenceTwoNorm: maximum(
      nodes.map((node) =>
        node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm),
    ),
    maximumAssembledToRawLandActiveDifferencePa: maximum(
      allNodeAudits.map((audit) =>
        audit.landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa),
    ),
    maximumLedgerRelativeTotalBloodVolumeDifference: maximum(
      allNodeAudits.map((audit) =>
        audit.ledger.relativeTotalBloodVolumeDifference),
    ),
    maximumDestinationAgreementScaledInfinityNorm:
      graph.maximumDestinationAgreementScaledInfinityNorm,
    maximumRoundTripClosureScaledInfinityNorm:
      graph.maximumRoundTripClosureScaledInfinityNorm,
    maximumCoarseFineScaledTangentDisagreement: maximum(
      continuations.map((continuation) =>
        continuation.maximumCoarseFineScaledTangentDisagreement),
    ),
    maximumAcceptedNodeStepScaledInfinityNorm: maximum(
      continuations.map((continuation) =>
        continuation.maximumAcceptedNodeStepScaledInfinityNorm),
    ),
    maximumPredictorCorrectionScaledInfinityNorm: maximum(
      continuations.map((continuation) =>
        continuation.maximumPredictorCorrectionScaledInfinityNorm),
    ),
    selectedRefinementFactors: Object.freeze([
      ...paths.map((path) => closedNullable(path.selectedRefinementFactor)),
    ]),
    selectedRefinementFactorCounts: Object.freeze({
      2: paths.filter((path) => path.selectedRefinementFactor === 2).length,
      4: paths.filter((path) => path.selectedRefinementFactor === 4).length,
      8: paths.filter((path) => path.selectedRefinementFactor === 8).length,
    }),
  });
}

function graphBroadClaims(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
) {
  return Object.freeze({
    phaseB1LandCoupledVolumeEnvelopePass:
      graph.phaseB1LandCoupledVolumeEnvelopePass,
    continuousVolumeIntervalRegularityPass:
      graph.continuousVolumeIntervalRegularityPass,
    globalRootUniquenessPass: graph.globalRootUniquenessPass,
    globalRootExhaustivenessPass: graph.globalRootExhaustivenessPass,
    energeticStabilityPass: graph.energeticStabilityPass,
    physiologicalInitializationPass: graph.physiologicalInitializationPass,
    closedLoopStationarityPass: graph.closedLoopStationarityPass,
    acceptedPhaseB1ReferenceBranchPass:
      graph.acceptedPhaseB1ReferenceBranchPass,
    fullBeatAcceptancePass: graph.fullBeatAcceptancePass,
    physiologicalValidationPass: graph.physiologicalValidationPass,
    phaseB1AcceptancePass: graph.phaseB1AcceptancePass,
    supportedEnvelopePass: graph.supportedEnvelopePass,
    releaseRuntimePass: graph.releaseRuntimePass,
    pureCoreParentEvidenceAuthenticationClaimed:
      graph.pureCoreParentEvidenceAuthenticationClaimed,
    modelCoreIntegration: graph.modelCoreIntegration,
    browserRuntimeAdopted: graph.browserRuntimeAdopted,
    releaseRuntimeReachable: graph.releaseRuntimeReachable,
  });
}

function requireEtaOneNode(
  node: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1[
    "results"
  ][PhaseB0SlsModeV1]["etaOne"]["node"],
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  if (node.eta !== 1) {
    throw new Error("Phase B1 finite-volume evidence requires exact eta-one node");
  }
  return node as PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
}

function requireGraphNodeDefinition(
  nodeId: "C" | "E",
): (typeof PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1)[number] {
  const node =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1.find(
      (candidate) => candidate.nodeId === nodeId,
    );
  if (node === undefined) throw new Error(`graph node definition absent: ${nodeId}`);
  return node;
}

function requireGraphNodeAudit(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  nodeId: string,
): PhaseB1EtaOneFiniteVolumeNodeAuditV1 {
  const matches = graph.canonicalNodes.filter((audit) => audit.nodeId === nodeId);
  if (matches.length !== 1) {
    throw new Error(`graph canonical node audit must be unique: ${nodeId}`);
  }
  return matches[0];
}

function requireCanonicalNode(
  nodes: ReadonlyMap<string, PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1>,
  nodeId: string,
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  const node = nodes.get(nodeId);
  if (node === undefined) throw new Error(`canonical node absent: ${nodeId}`);
  return node;
}

function requireForwardDirectedPath(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  edgeId: string,
): PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1 {
  const matches = graph.directedEdges.filter((path) =>
    path.edgeId === edgeId
    && path.pathRole === "canonical-source-directed"
    && path.direction === "forward");
  if (matches.length !== 1) {
    throw new Error(`canonical forward path must be unique: ${edgeId}`);
  }
  return matches[0];
}

function selectedContinuationEndpoint(
  path: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 | null {
  if (path.selectedAttemptIndex === null) return null;
  const continuation = path.attempts[path.selectedAttemptIndex]?.continuation;
  return continuation?.completed === true ? continuation.endpoint.node : null;
}

function firstContinuationNode(
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 | null {
  if (continuation.completed === true) {
    return continuation.nodes[0]?.node ?? null;
  }
  return continuation.acceptedNodes[0]?.node ?? null;
}

function canonicalPathId(
  path: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
): string {
  return [
    path.pathRole,
    path.edgeId,
    path.direction,
    path.sourceNodeId,
    path.destinationNodeId,
  ].join(":");
}

function assertFailureProbeBoundary(
  probe: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  expectedAttemptIndex: 0 | 1,
): void {
  const result = probe.result;
  const expectedAcceptedNodeCount = expectedAttemptIndex + 1;
  const expectedRollbackNode = result.acceptedNodes[expectedAttemptIndex];
  if (
    probe.injectedAttemptIndex !== expectedAttemptIndex
    || result.completed !== false
    || result.direction !== "forward"
    || result.refinementFactor !== 2
    || result.reason !== "injected-structured-failure"
    || result.failedAttempt.attemptIndex !== expectedAttemptIndex
    || result.acceptedNodes.length !== expectedAcceptedNodeCount
    || !Object.is(result.acceptedNodes[0]?.node, sourceNode)
    || expectedRollbackNode === undefined
    || !Object.is(result.rollbackNode, expectedRollbackNode)
    || !Object.is(result.rollbackUnknowns, expectedRollbackNode.node.unknowns)
    || !numericRecordExact(
      result.rollbackBloodVolumesM3,
      expectedRollbackNode.bloodVolumesM3,
    )
    || !continuationProhibitedAbsent(result)
  ) throw new Error(
    `Phase B1 finite-volume failure probe ${expectedAttemptIndex} boundary drifted`,
  );
}

function continuationProhibitedAbsent(
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
): boolean {
  return !continuation.hiddenSubdivisionApplied
    && !continuation.pseudoArclengthApplied
    && !continuation.projectionApplied
    && !continuation.clippingApplied
    && !continuation.nearestRootSelectionApplied
    && !continuation.minimumResidualRootSelectionApplied
    && !continuation.maximumJunctionRadiusRootSelectionApplied;
}

function censusPartitionPass(
  census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  unknownScales: readonly number[],
): boolean {
  const convergedIndices = census.results.flatMap((result, index) =>
    result.converged ? [index] : []);
  const memberIndices = census.clusters.flatMap((cluster) =>
    cluster.memberResultIndices).sort((left, right) => left - right);
  const partitionRecomputedPass = arrayExact(convergedIndices, memberIndices)
    && new Set(memberIndices).size === memberIndices.length;
  const clusterAudits = census.clusters.map((cluster) => {
    const representativeIndex = cluster.representativeResultIndex;
    const representative = Number.isInteger(representativeIndex)
      ? census.results[representativeIndex]
      : undefined;
    const memberInventoryPass = cluster.memberResultIndices.length > 0
      && cluster.memberResultIndices.every((resultIndex) =>
        Number.isInteger(resultIndex)
        && resultIndex >= 0
        && resultIndex < census.results.length)
      && cluster.memberResultIndices.includes(representativeIndex);
    if (representative?.converged !== true || !memberInventoryPass) {
      return Object.freeze({
        structuralPass: false,
        distancePass: false,
        classificationPass: false,
      });
    }
    const members = cluster.memberResultIndices.map(
      (resultIndex) => census.results[resultIndex],
    );
    if (members.some((member) => member?.converged !== true)) {
      return Object.freeze({
        structuralPass: false,
        distancePass: false,
        classificationPass: false,
      });
    }
    const convergedMembers = members as readonly PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[];
    const memberDistances = convergedMembers.map((member) =>
      scaledInfinityDistance(
        representative.unknowns,
        member.unknowns,
        unknownScales,
      ));
    const maximumMemberDistance = Math.max(...memberDistances);
    const distancePass = memberDistances.every((distance) =>
      Number.isFinite(distance)
      && distance
        <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .rootClusteringScaledInfinityTolerance);
    const classificationPass = convergedMembers.every((member) =>
      member.effectiveTriSegAudit.classification === cluster.classification);
    const structuralPass = representative.effectiveTriSegAudit.classification
        === cluster.classification
      && Object.is(
        representative.endpoint.triSegCoordinates.V_m_S,
        cluster.coordinates.V_m_S,
      )
      && Object.is(
        representative.endpoint.triSegCoordinates.y_m,
        cluster.coordinates.y_m,
      )
      && Object.is(
        cluster.maximumMemberScaledInfinityDistance,
        maximumMemberDistance,
      )
      && cluster.memberFullVectorDistancePass === distancePass
      && cluster.memberClassificationMatches === classificationPass;
    return Object.freeze({
      structuralPass,
      distancePass,
      classificationPass,
    });
  });
  const allClusterMembersWithinFullVectorTolerance = clusterAudits.every(
    (audit) => audit.structuralPass && audit.distancePass,
  );
  const allClusterMemberClassificationsMatch = clusterAudits.every(
    (audit) => audit.structuralPass && audit.classificationPass,
  );
  return census.eta === 1
    && census.convergedRootCount === convergedIndices.length
    && partitionRecomputedPass
    && clusterAudits.length > 0
    && census.convergedResultsPartitionedExactlyOnce
      === partitionRecomputedPass
    && census.allClusterMembersWithinFullVectorTolerance
      === allClusterMembersWithinFullVectorTolerance
    && census.allClusterMemberClassificationsMatch
      === allClusterMemberClassificationsMatch
    && allClusterMembersWithinFullVectorTolerance
    && allClusterMemberClassificationsMatch;
}

function censusClusterSetsBijective(
  declared: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  reverse: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  unknownScales: readonly number[],
): boolean {
  if (declared.clusters.length !== reverse.clusters.length) return false;
  const usedReverse = new Set<number>();
  for (const declaredCluster of declared.clusters) {
    const declaredRepresentative =
      declared.results[declaredCluster.representativeResultIndex];
    if (declaredRepresentative?.converged !== true) return false;
    const matches = reverse.clusters.flatMap((reverseCluster, index) => {
      const reverseRepresentative =
        reverse.results[reverseCluster.representativeResultIndex];
      const memberClassificationMultiplicityMatches =
        reverseCluster.memberResultIndices.length
          === declaredCluster.memberResultIndices.length
        && declaredCluster.memberResultIndices.every((resultIndex) => {
          const result = declared.results[resultIndex];
          return result?.converged === true
            && result.effectiveTriSegAudit.classification
              === declaredCluster.classification;
        })
        && reverseCluster.memberResultIndices.every((resultIndex) => {
          const result = reverse.results[resultIndex];
          return result?.converged === true
            && result.effectiveTriSegAudit.classification
              === declaredCluster.classification;
        });
      return reverseRepresentative?.converged === true
          && reverseCluster.classification === declaredCluster.classification
          && memberClassificationMultiplicityMatches
          && scaledInfinityDistance(
            declaredRepresentative.unknowns,
            reverseRepresentative.unknowns,
            unknownScales,
          ) <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .rootClusteringScaledInfinityTolerance
        ? [index]
        : [];
    });
    if (matches.length !== 1 || usedReverse.has(matches[0])) return false;
    usedReverse.add(matches[0]);
  }
  return usedReverse.size === reverse.clusters.length;
}

function trackedRestoringClusterCount(
  census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  canonicalNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  unknownScales: readonly number[],
): number {
  return census.clusters.filter((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    return representative?.converged === true
      && cluster.classification === "robust-restoring"
      && scaledInfinityDistance(
        representative.unknowns,
        canonicalNode.unknowns,
        unknownScales,
      ) <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .rootClusteringScaledInfinityTolerance;
  }).length;
}

function digestProjection(
  domain: string,
  projection: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  if (domain.length === 0) throw new Error("projection digest domain is empty");
  assertRawEvidenceDataShape(projection, `projection:${domain}`);
  const envelope = Object.freeze({
    domain,
    projection,
  });
  canonicalizeJson(envelope);
  return computeCanonicalSha256(envelope, sha256Hex);
}

function vectorSha(
  vector: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return digestProjection(
    "numeric-vector",
    numberVector(vector, "vectorSha"),
    sha256Hex,
  );
}

function numberVector(
  vector: readonly number[],
  field: string,
): readonly number[] {
  const copy = denseCopy(vector, field);
  copy.forEach((value, index) => requireFinite(value, `${field}[${index}]`));
  return Object.freeze([...copy]);
}

function integerVector(
  vector: readonly number[],
  field: string,
): readonly number[] {
  const copy = numberVector(vector, field);
  if (copy.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error(`${field} must contain nonnegative integers`);
  }
  return copy;
}

function numberMatrix(
  matrix: readonly (readonly number[])[],
  field: string,
): readonly (readonly number[])[] {
  return Object.freeze(denseCopy(matrix, field).map((row, index) =>
    numberVector(row, `${field}[${index}]`)));
}

function denseCopy<T>(
  values: readonly T[],
  field: string,
): readonly T[] {
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype) {
    throw new Error(`${field} must be a plain array`);
  }
  const expectedKeys = [
    ...Array.from({ length: values.length }, (_, index) => String(index)),
    "length",
  ];
  const actualKeys = Reflect.ownKeys(values);
  if (
    actualKeys.some((key) => typeof key !== "string")
    || actualKeys.length !== expectedKeys.length
    || expectedKeys.some((key) => !actualKeys.includes(key))
  ) throw new Error(`${field} must be dense and contain no extra properties`);
  for (let index = 0; index < values.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(values, String(index));
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${field}[${index}] must be an enumerable data property`);
  }
  return Object.freeze([...values]);
}

function numericRecordProjection<K extends string>(
  record: Readonly<Record<K, number>>,
  keys: readonly K[],
): Readonly<Record<K, number>> {
  assertExactDataRecordKeys(record, keys, "numeric record projection");
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    requireFinite(record[key], `numeric record projection.${key}`),
  ]))) as Readonly<Record<K, number>>;
}

function numericRecordExact<K extends string>(
  left: Readonly<Record<K, number>>,
  right: Readonly<Record<K, number>>,
): boolean {
  return BLOOD_COMPARTMENT_IDS.every((key) =>
    Object.is(left[key as K], right[key as K]));
}

function wallRecord<T>(
  evaluate: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    evaluate(wallId),
  ]))) as Readonly<Record<FourChamberWallId, T>>;
}

function closedNullable<T>(value: T | null) {
  return value === null
    ? Object.freeze({ tag: "null" as const })
    : Object.freeze({ tag: "value" as const, value });
}

function closedNullableMapped<T, U>(
  value: T | null,
  project: (value: T) => U,
) {
  return value === null
    ? Object.freeze({ tag: "null" as const })
    : Object.freeze({ tag: "value" as const, value: project(value) });
}

function closedMissing() {
  return Object.freeze({ tag: "missing" as const });
}

function closedValue<T>(value: T) {
  return Object.freeze({ tag: "value" as const, value });
}

function closedOwnProperty<T>(
  record: object,
  key: PropertyKey,
  project?: (value: unknown) => T,
) {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined) return closedMissing();
  if (!("value" in descriptor) || !descriptor.enumerable) {
    throw new Error(`${String(key)} must be an enumerable data property`);
  }
  if (descriptor.value === undefined) {
    return Object.freeze({ tag: "undefined" as const });
  }
  if (descriptor.value === null) {
    return Object.freeze({ tag: "null" as const });
  }
  return Object.freeze({
    tag: "value" as const,
    value: project === undefined
      ? closedTaggedData(descriptor.value, String(key), new WeakSet<object>())
      : project(descriptor.value),
  });
}

function closedTaggedData(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): unknown {
  if (value === undefined) return Object.freeze({ tag: "undefined" as const });
  if (value === null) return Object.freeze({ tag: "null" as const });
  if (typeof value === "number") return Object.freeze({
    tag: "number" as const,
    value: requireFinite(value, path),
  });
  if (typeof value === "string") return Object.freeze({
    tag: "string" as const,
    value,
  });
  if (typeof value === "boolean") return Object.freeze({
    tag: "boolean" as const,
    value,
  });
  if (typeof value !== "object") {
    throw new Error(`${path} is not closed JSON-safe data`);
  }
  if (seen.has(value)) throw new Error(`${path} contains a cycle`);
  seen.add(value);
  if (Array.isArray(value)) {
    const array = denseCopy(value, path);
    return Object.freeze({
      tag: "array" as const,
      values: Object.freeze(array.map((entry, index) =>
        closedTaggedData(entry, `${path}[${index}]`, seen))),
    });
  }
  if (
    Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null
  ) throw new Error(`${path} must be a plain object`);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    throw new Error(`${path} must not contain symbols`);
  }
  return Object.freeze({
    tag: "object" as const,
    entries: Object.freeze((keys as string[]).map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor === undefined
        || !("value" in descriptor)
        || !descriptor.enumerable
      ) throw new Error(`${path}.${key} must be an enumerable data property`);
      return Object.freeze({
        key,
        value: closedTaggedData(descriptor.value, `${path}.${key}`, seen),
      });
    })),
  });
}

function assertExactDataRecordKeys(
  record: object,
  expectedKeys: readonly string[],
  field: string,
): void {
  if (
    Array.isArray(record)
    || (
      Object.getPrototypeOf(record) !== Object.prototype
      && Object.getPrototypeOf(record) !== null
    )
  ) throw new Error(`${field} must be a plain record`);
  const actualKeys = Reflect.ownKeys(record);
  if (
    actualKeys.some((key) => typeof key !== "string")
    || actualKeys.length !== expectedKeys.length
    || expectedKeys.some((key) => !actualKeys.includes(key))
  ) throw new Error(`${field} must contain exactly the declared keys`);
  for (const key of actualKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${field}.${String(key)} must be an enumerable data property`);
  }
}

function assertRawEvidenceDataShape(value: unknown, path: string): void {
  assertRawEvidenceDataShapeRecursive(value, path, new WeakSet<object>());
}

function assertRawEvidenceDataShapeRecursive(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): void {
  if (value === null || value === undefined) return;
  if (typeof value === "number") {
    requireFinite(value, path);
    return;
  }
  if (typeof value === "string" || typeof value === "boolean") return;
  if (typeof value !== "object") {
    throw new Error(`${path} contains a non-data value`);
  }
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    denseCopy(value, path);
    for (let index = 0; index < value.length; index += 1) {
      assertRawEvidenceDataShapeRecursive(value[index], `${path}[${index}]`, seen);
    }
    return;
  }
  if (
    Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null
  ) throw new Error(`${path} must contain only plain objects and arrays`);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${path} contains a symbol key`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${path}.${key} must be an enumerable data property`);
    assertRawEvidenceDataShapeRecursive(
      descriptor.value,
      `${path}.${key}`,
      seen,
    );
  }
}

function assertRecursivelyFrozenAndClosed(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): void {
  if (value === null || value === undefined) return;
  if (typeof value === "number") {
    requireFinite(value, path);
    return;
  }
  if (typeof value === "string" || typeof value === "boolean") return;
  if (typeof value !== "object") {
    throw new Error(`${path} contains a non-data value`);
  }
  if (seen.has(value)) return;
  if (!Object.isFrozen(value)) {
    throw new Error(`Canonical finite-volume evidence is not frozen at ${path}`);
  }
  seen.add(value);
  if (Array.isArray(value)) {
    denseCopy(value, path);
    for (let index = 0; index < value.length; index += 1) {
      assertRecursivelyFrozenAndClosed(value[index], `${path}[${index}]`, seen);
    }
    return;
  }
  if (
    Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null
  ) throw new Error(`${path} must contain only plain objects and arrays`);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${path} contains a symbol key`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${path}.${key} must be an enumerable data property`);
    assertRecursivelyFrozenAndClosed(
      descriptor.value,
      `${path}.${key}`,
      seen,
    );
  }
}

function arrayExact<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("finite-volume evidence scaled vector dimensions drifted");
  }
  return maximum(left.map((value, index) => Math.abs(
    (requireFinite(value, `scaledDistance.left[${index}]`)
      - requireFinite(right[index], `scaledDistance.right[${index}]`))
      / requirePositiveFinite(scales[index], `scaledDistance.scale[${index}]`),
  )));
}

function minimum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("minimum requires a nonempty vector");
  return Math.min(...values.map((value, index) =>
    requireFinite(value, `minimum[${index}]`)));
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires a nonempty vector");
  return Math.max(...values.map((value, index) =>
    requireFinite(value, `maximum[${index}]`)));
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
