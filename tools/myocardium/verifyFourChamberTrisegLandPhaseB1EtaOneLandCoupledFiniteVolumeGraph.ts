import { createHash } from "node:crypto";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import type { ScaledDampedNewtonDiagnosticsV1 } from
  "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1";
import {
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchReadinessV1";
import type {
  PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1,
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1,
  PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1,
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1";
import {
  buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphReadinessV1";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
  runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ColdEtaOneFixedVolumeLoadContinuationV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1,
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1,
  buildPhaseB1EtaOneFiniteVolumeLedgerV1,
  runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1,
  type PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  type PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  type PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1,
  type PhaseB1EtaOneFiniteVolumePathAttemptV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import type { PhaseB1EndpointStateV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeResultV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  type PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const MODES = Object.freeze(["on", "off"] as const);
const EXPECTED_DIMENSIONS = Object.freeze({ on: 37, off: 32 } as const);
const EXPECTED_GRAPH_MANIFEST_SHA256 =
  "bcf9c3c628a9a8bed02e783f503f266efd5a44dece1e636a05e18d6bcdbfe89c";
const EXPECTED_GRAPH_NUMERICAL_SHA256 =
  "3a304894732eea7ed0a0ffd55ea5a18b1c6554c874fea60e288adad15151d4d8";
const EXPECTED_GRAPH_READINESS_SHA256 =
  "54a60c3d446a26520aeabecada96694d36e9c3a577675b162ff7ff3d4746dd7f";
const failures: string[] = [];

type Mode = typeof MODES[number];
type NumericalEvidence = ReturnType<
  typeof buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1
>;
type Readiness = ReturnType<
  typeof buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1
>;

try {
  verifyStrictComparatorBoundary();

  const parentManifest =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
      sha256,
    );
  const parentEvidence =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
      parentManifest,
      sha256,
    );
  const parentReadiness =
    buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1(
      parentManifest,
      parentEvidence,
    );

  const manifest =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(sha256);
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
    manifest,
  );
  const numericalEvidence =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
      manifest,
      sha256,
    );
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
    numericalEvidence,
    manifest,
  );
  const readiness =
    buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1(
      manifest,
      numericalEvidence,
    );

  const hashes = verifyArtifacts(
    parentManifest,
    parentEvidence,
    parentReadiness,
    manifest,
    numericalEvidence,
    readiness,
  );
  const modeMetrics = Object.freeze(Object.fromEntries(MODES.map((mode) => [
    mode,
    verifyMode(
      mode,
      parentEvidence.results[mode],
      numericalEvidence.results[mode],
      numericalEvidence,
    ),
  ]))) as Readonly<Record<Mode, ReturnType<typeof verifyMode>>>;

  verifyReadiness(readiness, manifest.contentSha256,
    numericalEvidence.certificate.contentSha256);
  verifyMutationMatrix(manifest, numericalEvidence);

  const report = Object.freeze({
    pass: failures.length === 0,
    phaseB1LandCoupledFiniteVolumeGraphPass: failures.length === 0,
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
    pureCoreParentEvidenceAuthenticationClaimed: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    hashes,
    modeMetrics,
    failures: Object.freeze([...failures]),
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
} catch (error) {
  failures.push(message(error));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    pass: false,
    phaseB1LandCoupledFiniteVolumeGraphPass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
    failures,
  }, null, 2));
  process.exitCode = 1;
}

function verifyArtifacts(
  parentManifest: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1
  >,
  parentEvidence: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1
  >,
  parentReadiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1
  >,
  manifest: ReturnType<
    typeof buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1
  >,
  numericalEvidence: NumericalEvidence,
  readiness: Readiness,
) {
  expectEqual(
    "parent manifest self hash",
    parentManifest.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1(
        parentManifest,
      ),
      sha256,
    ),
  );
  expectEqual(
    "parent numerical self hash",
    parentEvidence.certificate.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1(
        parentEvidence.certificate,
      ),
      sha256,
    ),
  );
  const parentReadinessSha256 = computeCanonicalSha256(parentReadiness, sha256);
  expectEqual("parent manifest pin", parentManifest.contentSha256,
    PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_MANIFEST_SHA256_V1);
  expectEqual("parent numerical pin", parentEvidence.certificate.contentSha256,
    PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_NUMERICAL_SHA256_V1);
  expectEqual("parent readiness pin", parentReadinessSha256,
    PHASE_B1_ETA_ONE_FINITE_VOLUME_GRAPH_PARENT_STITCH_READINESS_SHA256_V1);

  expectEqual(
    "graph manifest self hash",
    manifest.contentSha256,
    computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ),
  );
  expectEqual(
    "graph numerical self hash",
    numericalEvidence.certificate.contentSha256,
    computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
        numericalEvidence.certificate,
      ),
      sha256,
    ),
  );
  const certificateKeys = Object.freeze([
    "evidenceId",
    "manifestSha256",
    "directParentAuthentication",
    "slsModes",
    "modes",
    "allModesPass",
    "hashAlgorithm",
    "contentSha256",
  ] as const);
  const envelopeShapes = Object.freeze([
    Object.freeze({
      label: "parent numerical certificate",
      value: parentEvidence.certificate,
      keys: certificateKeys,
    }),
    Object.freeze({
      label: "parent numerical bundle",
      value: parentEvidence,
      keys: Object.freeze([
        "certificate",
        "bridgeEvidence",
        "coldEvidence",
        "results",
      ] as const),
    }),
    Object.freeze({
      label: "parent numerical results",
      value: parentEvidence.results,
      keys: MODES,
    }),
    Object.freeze({
      label: "current numerical certificate",
      value: numericalEvidence.certificate,
      keys: certificateKeys,
    }),
    Object.freeze({
      label: "current numerical bundle",
      value: numericalEvidence,
      keys: Object.freeze([
        "certificate",
        "stitchEvidence",
        "results",
        "failureProbes",
      ] as const),
    }),
    Object.freeze({
      label: "current numerical results",
      value: numericalEvidence.results,
      keys: MODES,
    }),
    Object.freeze({
      label: "current numerical failure probes",
      value: numericalEvidence.failureProbes,
      keys: MODES,
    }),
  ]);
  for (const shape of envelopeShapes) {
    if (!exactPlainRecordKeys(shape.value, shape.keys)) {
      failures.push(`${shape.label} Reflect.ownKeys/data-descriptor closure drifted`);
    }
  }
  const certificateWithUnhashedExtra = Object.freeze({
    ...numericalEvidence.certificate,
    outsideHashPayload: true,
  }) as typeof numericalEvidence.certificate & Readonly<{
    outsideHashPayload: true;
  }>;
  if (
    !deepExactEqual(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
        certificateWithUnhashedExtra,
      ),
      phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
        numericalEvidence.certificate,
      ),
    )
    || exactPlainRecordKeys(certificateWithUnhashedExtra, certificateKeys)
  ) failures.push("certificate field outside hash payload was not schema-rejected");
  if (
    parentEvidence.certificate.hashAlgorithm
      !== NORMATIVE_MANIFEST_HASH_ALGORITHM
    || numericalEvidence.certificate.hashAlgorithm
      !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) failures.push("parent/current numerical certificate hashAlgorithm drifted");
  const graphReadinessSha256 = computeCanonicalSha256(readiness, sha256);
  expectEqual(
    "graph manifest fixed pin",
    manifest.contentSha256,
    EXPECTED_GRAPH_MANIFEST_SHA256,
  );
  expectEqual(
    "graph numerical fixed pin",
    numericalEvidence.certificate.contentSha256,
    EXPECTED_GRAPH_NUMERICAL_SHA256,
  );
  expectEqual(
    "graph readiness fixed pin",
    graphReadinessSha256,
    EXPECTED_GRAPH_READINESS_SHA256,
  );

  const modeKeyInventories: readonly [string, readonly string[]][] = [
    ["parent certificate modes", parentEvidence.certificate.slsModes],
    ["parent certificate summaries", Reflect.ownKeys(parentEvidence.certificate.modes)
      .map(String)],
    ["parent raw results", Reflect.ownKeys(parentEvidence.results).map(String)],
    ["graph certificate modes", numericalEvidence.certificate.slsModes],
    ["graph certificate summaries",
      Reflect.ownKeys(numericalEvidence.certificate.modes).map(String)],
    ["graph raw results", Reflect.ownKeys(numericalEvidence.results).map(String)],
  ];
  for (const [label, keys] of modeKeyInventories) {
    if (!exactStringArray(keys, MODES)) failures.push(`${label} drifted`);
  }

  const protocol = manifest.protocolDefinition;
  const bindingChecks = Object.freeze({
    protocolDefinition: manifest.bindings.protocolDefinitionSha256
      === computeCanonicalSha256(protocol, sha256),
    directParent: manifest.bindings.directParentSha256
      === computeCanonicalSha256(protocol.directParent, sha256),
    componentIds: manifest.bindings.componentIdsSha256
      === computeCanonicalSha256(protocol.componentIds, sha256),
    nodeGraph: manifest.bindings.nodeGraphSha256
      === computeCanonicalSha256(protocol.nodeGraph, sha256),
    edgeGraph: manifest.bindings.edgeGraphSha256
      === computeCanonicalSha256(protocol.edgeGraph, sha256),
    fixedStateLedger: manifest.bindings.fixedStateLedgerSha256
      === computeCanonicalSha256(protocol.fixedStateLedger, sha256),
    continuation: manifest.bindings.continuationSha256
      === computeCanonicalSha256(protocol.continuation, sha256),
    nodeGates: manifest.bindings.nodeGatesSha256
      === computeCanonicalSha256(protocol.nodeGates, sha256),
    fiftyPercentGuard: manifest.bindings.fiftyPercentGuardSha256
      === computeCanonicalSha256(protocol.fiftyPercentGuard, sha256),
    rootCensus: manifest.bindings.rootCensusSha256
      === computeCanonicalSha256(protocol.rootCensus, sha256),
    routeScope: manifest.bindings.routeScopeSha256
      === computeCanonicalSha256(protocol.routeScope, sha256),
    prohibitedOperations: manifest.bindings.prohibitedOperationsSha256
      === computeCanonicalSha256(protocol.prohibitedOperations, sha256),
    claimBoundary: manifest.bindings.claimBoundarySha256
      === computeCanonicalSha256(protocol.claimBoundary, sha256),
  });
  if (Object.values(bindingChecks).some((pass) => !pass)) {
    failures.push("graph manifest section binding drifted");
  }
  if (
    !deepExactEqual(numericalEvidence.stitchEvidence, parentEvidence)
    || !MODES.every((mode) => deepExactEqual(
      numericalEvidence.stitchEvidence.results[mode],
      parentEvidence.results[mode],
    ))
  ) failures.push("embedded stitch evidence differs from independent rebuild");

  if (![parentManifest, parentEvidence, parentReadiness, manifest,
    numericalEvidence, readiness].every((artifact) => isDeepFrozen(artifact))) {
    failures.push("manifest, parent, numerical bundle, readiness, or raw graph is not recursively frozen");
  }
  return Object.freeze({
    directParentManifest: parentManifest.contentSha256,
    directParentNumericalEvidence: parentEvidence.certificate.contentSha256,
    directParentReadiness: parentReadinessSha256,
    manifest: manifest.contentSha256,
    numericalEvidence: numericalEvidence.certificate.contentSha256,
    readiness: graphReadinessSha256,
  });
}

function verifyMode(
  mode: Mode,
  independentlyRebuiltStitch:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  numericalEvidence: NumericalEvidence,
) {
  const prefix = `SLS-${mode}`;
  const embeddedStitch = numericalEvidence.stitchEvidence.results[mode];
  const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(mode, sha256);
  const replay = runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
    independentlyRebuiltStitch,
    sha256,
  );
  const replayDeepExact = deepExactEqual(replay, graph);
  if (!replayDeepExact) failures.push(`${prefix} independent graph replay drifted`);

  verifyGraphInventory(prefix, graph);
  if (
    session.layout.unknownCount !== EXPECTED_DIMENSIONS[mode]
    || session.layout.residualLabels.length !== EXPECTED_DIMENSIONS[mode]
    || session.layout.unknownLabels.length !== EXPECTED_DIMENSIONS[mode]
    || !denseFiniteVector(session.layout.unknownScales, EXPECTED_DIMENSIONS[mode])
    || !denseFiniteVector(session.layout.residualScales, EXPECTED_DIMENSIONS[mode])
    || session.layout.unknownScales.some((value) => value <= 0)
    || session.layout.residualScales.some((value) => value <= 0)
  ) failures.push(`${prefix} 37/32 layout inventory drifted`);

  const canonicalById = new Map(graph.canonicalNodes.map((audit) => [
    audit.nodeId,
    audit,
  ] as const));
  const center = canonicalById.get("C");
  if (center === undefined) throw new Error(`${prefix} center node is absent`);
  const replayedCenterResidual = session.evaluateResidualVectorAtVolumes({
    bloodVolumesM3: session.anchorFixedInputs.bloodVolumesM3,
    unknowns: embeddedStitch.etaOne.node.unknowns,
  });
  const centerDifference = maximumAbsoluteDifference(
    replayedCenterResidual,
    embeddedStitch.etaOne.node.residualEvaluation.residual,
  );
  if (
    !Object.is(center.node, embeddedStitch.etaOne.node)
    || !Object.is(graph.centerReplayAudit.replayedResidual.length,
      EXPECTED_DIMENSIONS[mode])
    || !exactNumberArray(
      graph.centerReplayAudit.replayedResidual,
      replayedCenterResidual,
    )
    || centerDifference !== 0
    || graph.centerReplayAudit.maximumAbsoluteResidualReplayDifference !== 0
    || !graph.centerReplayAudit.centerNodePreservedByObjectIdentity
    || !graph.centerReplayAudit.pass
  ) failures.push(`${prefix} center Object.is or residual replay drifted`);

  for (const audit of graph.canonicalNodes) {
    verifyNodeAudit(
      `${prefix} canonical-${audit.nodeId}`,
      audit,
      session,
      audit.ledger.bloodVolumesM3,
    );
  }

  const pathAudit = verifyAllPaths(prefix, graph, canonicalById, session);
  const censusAudit = verifyAllCensuses(
    prefix,
    graph.rootCensus,
    canonicalById,
    session,
  );
  const failureProbeAudit = verifyFailureProbes(
    prefix,
    numericalEvidence.failureProbes[mode],
    graph,
    canonicalById,
    session,
  );
  const independentSummary = summarizeModeIndependently(
    numericalEvidence.stitchEvidence,
    graph,
    numericalEvidence.failureProbes[mode],
    sha256,
  );
  const certificateSummaryExact = deepExactEqual(
    independentSummary,
    numericalEvidence.certificate.modes[mode],
  );
  if (!certificateSummaryExact) {
    failures.push(`${prefix} independently projected certificate summary drifted`);
  }
  const broadClaimsFalse = Object.values(graphBroadClaims(graph))
    .every((value) => value === false);
  if (
    !graph.phaseB1LandCoupledFiniteVolumeGraphPass
    || !graph.testOnly
    || !graph.parentStitchObjectConsumed
    || !broadClaimsFalse
  ) failures.push(`${prefix} graph pass or broad claim boundary drifted`);

  return Object.freeze({
    mode,
    unknownCount: session.layout.unknownCount,
    replayDeepExact,
    canonicalNodeCount: graph.canonicalNodes.length,
    directedPathCount: graph.directedEdges.length,
    roundTripCount: graph.roundTripAudits.length,
    rootCensusCount: graph.rootCensus.length,
    pathAudit,
    censusAudit,
    failureProbeAudit,
    certificateSummaryExact,
    aggregateMetrics: independentSummary.aggregateMetrics,
    centerObjectIdentityPass: Object.is(center.node, embeddedStitch.etaOne.node),
    centerResidualReplayDifference: centerDifference,
    broadClaimsFalse,
  });
}

function summarizeModeIndependently(
  stitchEvidence: NumericalEvidence["stitchEvidence"],
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  failureProbes: readonly [
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  ],
  sha256Hex: CanonicalSha256HexProvider,
) {
  const stitch = stitchEvidence.results[graph.slsMode];
  const stitchEtaOneNode = requireEtaOneNode(stitch.etaOne.node);
  const unknownScales = stitchEvidence.coldEvidence.results[graph.slsMode]
    .layout.unknownScales;
  const canonical = new Map(graph.canonicalNodes.map((audit) => [
    audit.nodeId,
    audit.node,
  ] as const));
  const nodes = Object.freeze(graph.canonicalNodes.map((audit) =>
    independentNodeSummary(audit, sha256Hex)));
  const directedPaths = Object.freeze(graph.directedEdges.map((path) =>
    independentPathSummary(
      path,
      requireCanonicalNode(canonical, path.sourceNodeId),
      sha256Hex,
    )));
  const roundTrips = Object.freeze(graph.roundTripAudits.map((path) => {
    const forward = graph.directedEdges.filter((candidate) =>
      candidate.edgeId === path.edgeId && candidate.direction === "forward");
    if (forward.length !== 1) throw new Error("independent round-trip forward path absent");
    const endpoint = selectedContinuationEndpoint(forward[0]);
    if (endpoint === null) throw new Error("independent round-trip source absent");
    return independentPathSummary(path, endpoint.node, sha256Hex);
  }));
  const rootCensuses = Object.freeze(graph.rootCensus.map((census) =>
    independentCensusSummary(
      census,
      requireCanonicalNode(canonical, census.nodeId),
      unknownScales,
      sha256Hex,
    )));
  const failureProbeSummaries = Object.freeze(failureProbes.map((probe) =>
    independentFailureProbeSummary(probe, stitchEtaOneNode, sha256Hex)));
  const centerReplay = Object.freeze({
    centerNodePreservedByObjectIdentity:
      graph.centerReplayAudit.centerNodePreservedByObjectIdentity,
    independentlyConfirmedCenterNodeObjectIdentity: Object.is(
      requireCanonicalNode(canonical, "C"),
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
    residualReplayExact: exactNumberArray(
      graph.centerReplayAudit.replayedResidual,
      stitchEtaOneNode.residualEvaluation.residual,
    ),
    pass: graph.centerReplayAudit.pass,
  });
  const aggregateMetrics = independentAggregateModeMetrics(graph);
  const broadClaims = graphBroadClaims(graph);
  const expectedNodeIds =
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1.map(
      (node) => node.nodeId,
    );
  const directedPathIds = graph.directedEdges.map(canonicalPathId);
  const roundTripIds = graph.roundTripAudits.map(canonicalPathId);
  const inventoryPass = nodes.length === 9
    && exactStringArray(nodes.map((node) => node.nodeId), expectedNodeIds)
    && new Set(nodes.map((node) => node.nodeId)).size === 9
    && directedPaths.length === 32
    && new Set(directedPathIds).size === 32
    && roundTrips.length === 16
    && new Set(roundTripIds).size === 16
    && rootCensuses.length === 9
    && exactStringArray(
      rootCensuses.map((census) => census.nodeId),
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
    && nodes.every((summary) => summary.hardGatePass)
    && nodes.every((summary) => summary.fiftyPercentGuardPass)
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
    && rootCensuses.every((summary) =>
      summary.partitionAndBijectionRecomputedPass)
    && failureProbeSummaries.every((summary) => summary.probePass)
    && Object.values(aggregateMetrics.selectedRefinementFactorCounts)
      .reduce((sum, count) => sum + count, 0) === 48
    && Object.values(broadClaims).every((value) => value === false);
  return Object.freeze({
    slsMode: graph.slsMode,
    graphId: graph.graphId,
    componentIdsSha256: digestProjectionIndependent(
      "component-ids",
      graph.componentIds,
      sha256Hex,
    ),
    parentStitchCenterNodeConsumedByIdentity:
      centerReplay.independentlyConfirmedCenterNodeObjectIdentity,
    centerReplay,
    nodes,
    directedPaths,
    roundTrips,
    rootCensuses,
    failureProbes: failureProbeSummaries,
    aggregateMetrics,
    routeScopeSha256: digestProjectionIndependent(
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

function independentNodeSummary(
  audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const node = audit.node;
  return Object.freeze({
    nodeId: audit.nodeId,
    digestSha256: digestProjectionIndependent(
      `canonical-node:${audit.nodeId}`,
      independentNodeAuditProjection(audit, sha256Hex),
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

function independentPathSummary(
  path: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const firstNodes = path.attempts.map((attempt) =>
    firstContinuationLoadNode(attempt.continuation)?.node ?? null);
  const exactSourceObjectIdentity = firstNodes.every((node) =>
    node !== null && Object.is(node, expectedSourceNode));
  const factors = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
    .continuation.refinementFactors;
  const factorPrefixExact = path.attempts.every((attempt, index) =>
    attempt.refinementFactor === factors[index]);
  const firstGuardPassingIndex = path.attempts.findIndex(
    (attempt) => attempt.fiftyPercentGuardPass,
  );
  const selectedIndex = firstGuardPassingIndex < 0
    ? null
    : firstGuardPassingIndex;
  const stoppedAtFirstGuardPass = selectedIndex === null
    ? path.attempts.length === factors.length
    : path.attempts.length === selectedIndex + 1;
  const selectionRuleRecomputedPass = factorPrefixExact
    && stoppedAtFirstGuardPass
    && path.selectedAttemptIndex === selectedIndex
    && path.selectedRefinementFactor === (
      selectedIndex === null ? null : path.attempts[selectedIndex].refinementFactor
    )
    && path.firstGuardPassingFactor === (
      selectedIndex === null ? null : path.attempts[selectedIndex].refinementFactor
    );
  const attempts = Object.freeze(path.attempts.map((attempt, index) =>
    Object.freeze({
      attemptIndex: index,
      refinementFactor: attempt.refinementFactor,
      digestSha256: digestProjectionIndependent(
        `path-attempt:${canonicalPathId(path)}:${index}`,
        independentAttemptProjection(attempt, expectedSourceNode, sha256Hex),
        sha256Hex,
      ),
      hardGatePass: attempt.hardGatePass,
      fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
      refinementTrigger: attempt.refinementTrigger,
      sourceNodeObjectIdentity: Object.is(
        firstContinuationLoadNode(attempt.continuation)?.node,
        expectedSourceNode,
      ),
    })));
  const allRecordedProhibitedOperationsAbsent = !path.hiddenSubdivisionApplied
    && !path.pseudoArclengthApplied
    && !path.etaHomotopyRescueApplied
    && !path.rootRankingApplied
    && path.attempts.every((attempt) =>
      continuationProhibitedAbsent(attempt.continuation)
      && attempt.nodeAudits.every((audit) => audit.prohibitedOperationsAbsent));
  return Object.freeze({
    pathId: canonicalPathId(path),
    edgeId: path.edgeId,
    edgeClass: path.edgeClass,
    pathRole: path.pathRole,
    direction: path.direction,
    sourceNodeId: path.sourceNodeId,
    destinationNodeId: path.destinationNodeId,
    digestSha256: digestProjectionIndependent(
      `path:${canonicalPathId(path)}`,
      independentPathProjection(path, expectedSourceNode, sha256Hex),
      sha256Hex,
    ),
    attempts,
    selectedAttemptIndex: closedNullableIndependent(path.selectedAttemptIndex),
    selectedRefinementFactor:
      closedNullableIndependent(path.selectedRefinementFactor),
    firstGuardPassingFactor:
      closedNullableIndependent(path.firstGuardPassingFactor),
    destinationAgreementScaledInfinityNorm:
      closedNullableIndependent(path.destinationAgreementScaledInfinityNorm),
    factorPrefixExact,
    stoppedAtFirstGuardPass,
    selectionRuleRecomputedPass,
    exactSourceObjectIdentity,
    allRecordedProhibitedOperationsAbsent,
    accepted: path.accepted,
  });
}

function independentCensusSummary(
  census: PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1,
  canonicalNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  unknownScales: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
) {
  const declaredProjection = independentCensusProjection(
    census.declared,
    sha256Hex,
  );
  const reverseProjection = independentCensusProjection(
    census.reverse,
    sha256Hex,
  );
  const declaredPartition = censusPartitionPass(census.declared, unknownScales);
  const reversePartition = censusPartitionPass(census.reverse, unknownScales);
  const expectedDeclaredSeeds =
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds;
  const expectedReverseSeeds = Object.freeze([...expectedDeclaredSeeds].reverse());
  const declaredInventoryRecomputedPass = census.declared.seedOrder
      === "declared"
    && census.declared.seeds.length === expectedDeclaredSeeds.length
    && census.declared.results.length === expectedDeclaredSeeds.length
    && censusSeedsExact(census.declared.seeds, expectedDeclaredSeeds)
    && census.declared.enumerationCompleted
    && census.declared.allSeedsAttempted
    && census.declared.allSeedsConverged
    && census.declared.allDiscoveredRootsReported
    && !census.declared.selectionInputToAcceptedPath
    && !census.declared.globalExhaustivenessClaimed;
  const reverseInventoryRecomputedPass = census.reverse.seedOrder === "reverse"
    && census.reverse.seeds.length === expectedReverseSeeds.length
    && census.reverse.results.length === expectedReverseSeeds.length
    && censusSeedsExact(census.reverse.seeds, expectedReverseSeeds)
    && census.reverse.enumerationCompleted
    && census.reverse.allSeedsAttempted
    && census.reverse.allSeedsConverged
    && census.reverse.allDiscoveredRootsReported
    && !census.reverse.selectionInputToAcceptedPath
    && !census.reverse.globalExhaustivenessClaimed;
  const recomputedBijection = censusBijection(
    census.declared,
    census.reverse,
    unknownScales,
  );
  const declaredTracked = matchingRestoringClusterCount(
    census.declared,
    canonicalNode.unknowns,
    unknownScales,
  );
  const reverseTracked = matchingRestoringClusterCount(
    census.reverse,
    canonicalNode.unknowns,
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
    digestSha256: digestProjectionIndependent(
      `node-census:${census.nodeId}`,
      Object.freeze({
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
      }),
      sha256Hex,
    ),
    declaredDigestSha256: digestProjectionIndependent(
      `node-census:${census.nodeId}:declared`,
      declaredProjection,
      sha256Hex,
    ),
    reverseDigestSha256: digestProjectionIndependent(
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

function independentFailureProbeSummary(
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
    digestSha256: digestProjectionIndependent(
      `failure-probe:${result.slsMode}:C-to-E:${probe.injectedAttemptIndex}`,
      independentFailureProbeProjection(probe, sourceNode, sha256Hex),
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

function independentAggregateModeMetrics(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
) {
  const paths = [...graph.directedEdges, ...graph.roundTripAudits];
  const allNodeAudits = [
    ...graph.canonicalNodes,
    ...paths.flatMap((path) => path.attempts)
      .flatMap((attempt) => attempt.nodeAudits),
  ];
  const nodes = allNodeAudits.map((audit) => audit.node);
  const continuations = paths.flatMap((path) => path.attempts)
    .map((attempt) => attempt.continuation)
    .filter((continuation): continuation is PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1 =>
      continuation.completed === true);
  return Object.freeze({
    maximumScaledResidualInfinityNorm: maximumFinite(
      nodes.map((node) => node.scaledResidualInfinityNorm),
    ),
    maximumScaledUpdateInfinityNorm: maximumFinite(
      nodes.map((node) => node.scaledUpdateInfinityNorm),
    ),
    maximumLocalMaterialResidualInfinityNorm: maximumFinite(
      nodes.map((node) => node.maximumLocalMaterialResidualInfinityNorm),
    ),
    minimumLandSimplexMargin: minimumFinite(
      nodes.map((node) => node.minimumLandSimplexMargin),
    ),
    minimumEffectiveTriSegSigma: minimumFinite(
      nodes.map((node) => node.effectiveTriSegAudit.sigmaMinimum),
    ),
    maximumEffectiveTriSegConditionNumber2: maximumFinite(
      nodes.map((node) => node.effectiveTriSegAudit.conditionNumber2),
    ),
    minimumStaticRestoringMargin: minimumFinite(
      nodes.map((node) => node.effectiveTriSegAudit.robustSignedMargin),
    ),
    maximumSchurToReequilibratedDifferenceTwoNorm: maximumFinite(
      nodes.map((node) =>
        node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm),
    ),
    maximumAssembledToRawLandActiveDifferencePa: maximumFinite(
      allNodeAudits.map((audit) =>
        audit.landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa),
    ),
    maximumLedgerRelativeTotalBloodVolumeDifference: maximumFinite(
      allNodeAudits.map((audit) =>
        audit.ledger.relativeTotalBloodVolumeDifference),
    ),
    maximumDestinationAgreementScaledInfinityNorm:
      graph.maximumDestinationAgreementScaledInfinityNorm,
    maximumRoundTripClosureScaledInfinityNorm:
      graph.maximumRoundTripClosureScaledInfinityNorm,
    maximumCoarseFineScaledTangentDisagreement: maximumFinite(
      continuations.map((continuation) =>
        continuation.maximumCoarseFineScaledTangentDisagreement),
    ),
    maximumAcceptedNodeStepScaledInfinityNorm: maximumFinite(
      continuations.map((continuation) =>
        continuation.maximumAcceptedNodeStepScaledInfinityNorm),
    ),
    maximumPredictorCorrectionScaledInfinityNorm: maximumFinite(
      continuations.map((continuation) =>
        continuation.maximumPredictorCorrectionScaledInfinityNorm),
    ),
    selectedRefinementFactors: Object.freeze(paths.map((path) =>
      closedNullableIndependent(path.selectedRefinementFactor))),
    selectedRefinementFactorCounts: Object.freeze({
      2: paths.filter((path) => path.selectedRefinementFactor === 2).length,
      4: paths.filter((path) => path.selectedRefinementFactor === 4).length,
      8: paths.filter((path) => path.selectedRefinementFactor === 8).length,
    }),
  });
}

function independentNodeAuditProjection(
  audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    nodeId: audit.nodeId,
    ledger: Object.freeze({
      nodeId: audit.ledger.nodeId,
      bloodVolumesM3: numericRecordProjectionIndependent(
        audit.ledger.bloodVolumesM3,
        BLOOD_COMPARTMENT_IDS,
      ),
      deltaLeftVentricularVolumeM3:
        audit.ledger.deltaLeftVentricularVolumeM3,
      deltaRightVentricularVolumeM3:
        audit.ledger.deltaRightVentricularVolumeM3,
      anchorTotalBloodVolumeM3: audit.ledger.anchorTotalBloodVolumeM3,
      nodeTotalBloodVolumeM3: audit.ledger.nodeTotalBloodVolumeM3,
      totalBloodVolumeDifferenceM3: audit.ledger.totalBloodVolumeDifferenceM3,
      relativeTotalBloodVolumeDifference:
        audit.ledger.relativeTotalBloodVolumeDifference,
      allVolumesPositive: audit.ledger.allVolumesPositive,
      unchangedCompartmentsExact: audit.ledger.unchangedCompartmentsExact,
      complementLedgerExact: audit.ledger.complementLedgerExact,
      accepted: audit.ledger.accepted,
    }),
    node: independentNodeProjection(audit.node, sha256Hex),
    etaOneExact: audit.etaOneExact,
    fixedStateExact: audit.fixedStateExact,
    effectiveTriSegRestoringPass: audit.effectiveTriSegRestoringPass,
    landIdentityAudit: independentLandIdentityProjection(audit),
    thresholdMetricsFinite: audit.thresholdMetricsFinite,
    thresholdNormMetricsNonnegative: audit.thresholdNormMetricsNonnegative,
    prohibitedOperationsAbsent: audit.prohibitedOperationsAbsent,
    hardGatePass: audit.hardGatePass,
    fiftyPercentGuardPass: audit.fiftyPercentGuardPass,
  });
}

function independentNodeProjection(
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    converged: node.converged,
    eta: node.eta,
    endpoint: independentEndpointProjection(node.endpoint),
    unknowns: numberVectorIndependent(node.unknowns),
    residualEvaluation: Object.freeze({
      eta: node.residualEvaluation.eta,
      residual: numberVectorIndependent(node.residualEvaluation.residual),
      endpoint: independentEndpointProjection(node.residualEvaluation.endpoint),
      freeCalciumUMByWall: numericRecordProjectionIndependent(
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
          closedLoopMechanicsSha256: digestProjectionIndependent(
            `node-wall-closed-loop-mechanics:${wallId}`,
            independentClosedLoopWallMechanicsProjection(
              node.residualEvaluation.closedLoop.wallMechanics[wallId],
            ),
            sha256Hex,
          ),
          materialStateSha256: digestProjectionIndependent(
            `node-wall-material-state:${wallId}`,
            independentWallMaterialProjection(
              node.residualEvaluation.wallMaterialByWall[wallId],
            ),
            sha256Hex,
          ),
          backwardEulerSha256: digestProjectionIndependent(
            `node-wall-backward-euler:${wallId}`,
            independentWallBackwardEulerProjection(
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
      rawJacobian: numberMatrixIndependent(node.algorithmicJacobian.rawJacobian),
      scaledJacobian: numberMatrixIndependent(
        node.algorithmicJacobian.scaledJacobian,
      ),
      stencilByColumn: denseCopyIndependent(
        node.algorithmicJacobian.stencilByColumn,
      ),
      scaledStep: node.algorithmicJacobian.scaledStep,
      scaledStepByColumn: numberVectorIndependent(
        node.algorithmicJacobian.scaledStepByColumn,
      ),
    }),
    newtonDiagnostics: independentNewtonDiagnosticsProjection(
      node.newtonDiagnostics,
    ),
    minimumLandSimplexMargin: node.minimumLandSimplexMargin,
    maximumLocalMaterialResidualInfinityNorm:
      node.maximumLocalMaterialResidualInfinityNorm,
    effectiveTriSegAudit: independentEffectiveTriSegProjection(
      node.effectiveTriSegAudit,
    ),
    scaledResidualInfinityNorm: node.scaledResidualInfinityNorm,
    scaledUpdateInfinityNorm: node.scaledUpdateInfinityNorm,
    projectionApplied: node.projectionApplied,
    clippingApplied: node.clippingApplied,
    fallbackApplied: node.fallbackApplied,
  });
}

function independentClosedLoopWallMechanicsProjection(
  wall: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[
    "residualEvaluation"
  ]["closedLoop"]["wallMechanics"][FourChamberWallId],
) {
  return Object.freeze({
    wallId: wall.wallId,
    fiberLogStrain: wall.fiberLogStrain,
    wallReferenceMaterialVolumeM3: wall.wallReferenceMaterialVolumeM3,
    equilibriumPassive: independentEquilibriumPassiveProjection(
      wall.equilibriumPassive,
    ),
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

function independentWallMaterialProjection(
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
    reconstructedSourceLandState: numberVectorIndependent(
      material.reconstructedSourceLandState,
    ),
    sourceLandOutput: Object.freeze({
      sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
      sourceStressConvention: source.sourceStressConvention,
      stabilizationStiffnessPa: source.stabilizationStiffnessPa,
      algorithmicTangentPa: closedOwnPropertyIndependent(
        source,
        "algorithmicTangentPa",
      ),
      frozenStateTangentPa: closedOwnPropertyIndependent(
        source,
        "frozenStateTangentPa",
      ),
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
    wallActiveStressPartialsPaByLandState: numberVectorIndependent(
      material.wallActiveStressPartialsPaByLandState,
    ),
    passive: independentEquilibriumPassiveProjection(material.passive),
    sls: Object.freeze({
      mode: material.sls.mode,
      statePhysicallyPresent: material.sls.statePhysicallyPresent,
      alphaV: closedNullableIndependent(material.sls.alphaV),
      overstressPa: material.sls.overstressPa,
      storedEnergyDensityJPerM3: material.sls.storedEnergyDensityJPerM3,
      stressPartialPaPerFiberLogStrainAtFixedAlpha:
        material.sls.stressPartialPaPerFiberLogStrainAtFixedAlpha,
      stressPartialPaPerAlphaV: closedNullableIndependent(
        material.sls.stressPartialPaPerAlphaV,
      ),
    }),
    totalWallKirchhoffStressPa: material.totalWallKirchhoffStressPa,
    totalStressPartialPaPerFiberLogStrainAtFixedInternalState:
      material.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
    totalStressPartialsPaByLandState: numberVectorIndependent(
      material.totalStressPartialsPaByLandState,
    ),
    totalStressPartialPaPerAlphaV: closedNullableIndependent(
      material.totalStressPartialPaPerAlphaV,
    ),
    stabilizationStiffnessIncludedInStressOrTangent:
      material.stabilizationStiffnessIncludedInStressOrTangent,
    productionStateResidualUsesStrainRate:
      material.productionStateResidualUsesStrainRate,
  });
}

function independentWallBackwardEulerProjection(
  backward: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1[
    "residualEvaluation"
  ]["wallBackwardEulerAtEqualStatesByWall"][FourChamberWallId],
) {
  return Object.freeze({
    kernelId: backward.kernelId,
    state: independentWallMaterialProjection(backward.state),
    landResidual: numberVectorIndependent(backward.landResidual),
    landStateJacobianRowMajor: numberVectorIndependent(
      backward.landStateJacobianRowMajor,
    ),
    landResidualPartialByNextFiberLogStrain: numberVectorIndependent(
      backward.landResidualPartialByNextFiberLogStrain,
    ),
    slsResidual: closedNullableIndependent(backward.slsResidual),
    slsResidualPartialByNextFiberLogStrain: closedNullableIndependent(
      backward.slsResidualPartialByNextFiberLogStrain,
    ),
    slsResidualPartialByNextAlphaV: closedNullableIndependent(
      backward.slsResidualPartialByNextAlphaV,
    ),
    calciumResidualPresent: backward.calciumResidualPresent,
    calciumIsKnownEndpointForcing: backward.calciumIsKnownEndpointForcing,
    productionStateResidualUsesStrainRate:
      backward.productionStateResidualUsesStrainRate,
  });
}

function independentEquilibriumPassiveProjection(
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

function independentEndpointProjection(endpoint: PhaseB1EndpointStateV1) {
  const state = endpoint.differentialState;
  return Object.freeze({
    stateId: endpoint.stateId,
    timeSec: endpoint.timeSec,
    differentialState: Object.freeze({
      slsMode: state.slsMode,
      bloodVolumesM3: numericRecordProjectionIndependent(
        state.bloodVolumesM3,
        BLOOD_COMPARTMENT_IDS,
      ),
      inertialFlowsM3PerSec: numericRecordProjectionIndependent(
        state.inertialFlowsM3PerSec,
        INERTIAL_FLOW_IDS,
      ),
      calciumByWall: wallRecord((wallId) => Object.freeze({
        r: state.calciumByWall[wallId].r,
        d: state.calciumByWall[wallId].d,
      })),
      landByWall: wallRecord((wallId) => numberVectorIndependent(
        state.landByWall[wallId],
      )),
      slsAlphaVByWall: closedOwnPropertyIndependent(
        state,
        "slsAlphaVByWall",
        (value) => numericRecordProjectionIndependent(
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

function independentLandIdentityProjection(
  audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
) {
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

function independentEffectiveTriSegProjection(
  audit: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1["effectiveTriSegAudit"],
) {
  return Object.freeze({
    auditId: audit.auditId,
    scaledSchurGeneralizedForceTangent: numberVectorIndependent(
      audit.scaledSchurGeneralizedForceTangent,
    ),
    scaledReequilibratedCoarseTangent: numberVectorIndependent(
      audit.scaledReequilibratedCoarseTangent,
    ),
    scaledReequilibratedFineTangent: numberVectorIndependent(
      audit.scaledReequilibratedFineTangent,
    ),
    symmetricFineTangent: numberVectorIndependent(audit.symmetricFineTangent),
    eigenvaluesAscending: numberVectorIndependent(audit.eigenvaluesAscending),
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

function independentNewtonDiagnosticsProjection(
  diagnostics: ScaledDampedNewtonDiagnosticsV1,
) {
  return Object.freeze({
    newtonIterationCount: diagnostics.newtonIterationCount,
    acceptedStepCount: diagnostics.acceptedStepCount,
    modelEvaluationCount: diagnostics.modelEvaluationCount,
    totalBacktrackCount: diagnostics.totalBacktrackCount,
    finalResidualInfinityNorm: closedNullableIndependent(
      diagnostics.finalResidualInfinityNorm,
    ),
    finalUpdateInfinityNorm: diagnostics.finalUpdateInfinityNorm,
    history: Object.freeze(denseCopyIndependent(diagnostics.history).map(
      (iteration, index) => Object.freeze({
        historyIndex: index,
        iteration: iteration.iteration,
        residualInfinityNorm: iteration.residualInfinityNorm,
        residualTwoNorm: iteration.residualTwoNorm,
        merit: iteration.merit,
        previousAcceptedUpdateInfinityNorm:
          iteration.previousAcceptedUpdateInfinityNorm,
        rawNewtonUpdateInfinityNorm: closedNullableIndependent(
          iteration.rawNewtonUpdateInfinityNorm,
        ),
        fractionToBoundaryMaximumStep: closedNullableIndependent(
          iteration.fractionToBoundaryMaximumStep,
        ),
        fractionToBoundaryLimitingUnknownIndex: closedNullableIndependent(
          iteration.fractionToBoundaryLimitingUnknownIndex,
        ),
        fractionToBoundaryLimitingAffineConstraintId: closedNullableIndependent(
          iteration.fractionToBoundaryLimitingAffineConstraintId,
        ),
        acceptedStepLength: closedNullableIndependent(
          iteration.acceptedStepLength,
        ),
        acceptedUpdateInfinityNorm: closedNullableIndependent(
          iteration.acceptedUpdateInfinityNorm,
        ),
        backtrackCount: iteration.backtrackCount,
        inadmissibleTrialCount: iteration.inadmissibleTrialCount,
        nonFiniteTrialCount: iteration.nonFiniteTrialCount,
        linearSolve: closedNullableMappedIndependent(
          iteration.linearSolve,
          independentDenseLuProjection,
        ),
        outcome: iteration.outcome,
        modelDiagnostic: closedOwnPropertyIndependent(
          iteration,
          "modelDiagnostic",
        ),
        acceptedTrialModelDiagnostic: closedOwnPropertyIndependent(
          iteration,
          "acceptedTrialModelDiagnostic",
        ),
      }),
    )),
  });
}

function independentDenseLuProjection(
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

function independentPathProjection(
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
      projection: independentAttemptProjection(
        attempt,
        expectedSourceNode,
        sha256Hex,
      ),
    }))),
    selectedAttemptIndex: closedNullableIndependent(path.selectedAttemptIndex),
    selectedRefinementFactor:
      closedNullableIndependent(path.selectedRefinementFactor),
    firstGuardPassingFactor:
      closedNullableIndependent(path.firstGuardPassingFactor),
    selectionRuleAuditPass: path.selectionRuleAuditPass,
    destinationAgreementScaledInfinityNorm: closedNullableIndependent(
      path.destinationAgreementScaledInfinityNorm,
    ),
    accepted: path.accepted,
    declaredRollbackUnknownsOnFailure: numberVectorIndependent(
      path.declaredRollbackUnknownsOnFailure,
    ),
    hiddenSubdivisionApplied: path.hiddenSubdivisionApplied,
    pseudoArclengthApplied: path.pseudoArclengthApplied,
    etaHomotopyRescueApplied: path.etaHomotopyRescueApplied,
    rootRankingApplied: path.rootRankingApplied,
  });
}

function independentAttemptProjection(
  attempt: PhaseB1EtaOneFiniteVolumePathAttemptV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    refinementFactor: attempt.refinementFactor,
    continuation: independentContinuationProjection(
      attempt.continuation,
      expectedSourceNode,
      sha256Hex,
    ),
    nodeAudits: Object.freeze(attempt.nodeAudits.map((audit, index) =>
      Object.freeze({
        nodeIndex: index,
        nodeId: audit.nodeId,
        nodeAuditDigestSha256: digestProjectionIndependent(
          `attempt-node:${audit.nodeId}`,
          independentNodeAuditProjection(audit, sha256Hex),
          sha256Hex,
        ),
      }))),
    hardGatePass: attempt.hardGatePass,
    fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
    refinementTrigger: attempt.refinementTrigger,
  });
}

function independentContinuationProjection(
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  expectedSourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const common = Object.freeze({
    continuationId: continuation.continuationId,
    slsMode: continuation.slsMode,
    direction: continuation.direction,
    refinementFactor: continuation.refinementFactor,
    requestedSValues: numberVectorIndependent(continuation.requestedSValues),
    attemptedSValues: numberVectorIndependent(continuation.attemptedSValues),
    sourceBloodVolumesM3: numericRecordProjectionIndependent(
      continuation.sourceBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    destinationBloodVolumesM3: numericRecordProjectionIndependent(
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
        independentLoadNodeProjection(loadNode, index, sha256Hex))),
      edgeAudits: Object.freeze(continuation.edgeAudits.map((edge, index) =>
        independentContinuationEdgeProjection(edge, index, sha256Hex))),
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
      (loadNode, index) =>
        independentLoadNodeProjection(loadNode, index, sha256Hex),
    )),
    edgeAudits: Object.freeze(continuation.edgeAudits.map((edge, index) =>
      independentContinuationEdgeProjection(edge, index, sha256Hex))),
    failedAttempt: independentFailedAttemptProjection(
      continuation.failedAttempt,
      sha256Hex,
    ),
    reason: continuation.reason,
    message: continuation.message,
    rollbackNode: independentLoadNodeProjection(
      continuation.rollbackNode,
      -1,
      sha256Hex,
    ),
    rollbackUnknowns: numberVectorIndependent(continuation.rollbackUnknowns),
    rollbackBloodVolumesM3: numericRecordProjectionIndependent(
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

function independentLoadNodeProjection(
  loadNode: Readonly<{
    s: number;
    bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
    node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
  }>,
  nodeIndex: number,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    nodeIndex,
    s: loadNode.s,
    bloodVolumesM3: numericRecordProjectionIndependent(
      loadNode.bloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    nodeDigestSha256: digestProjectionIndependent(
      `load-node:${nodeIndex}`,
      independentNodeProjection(loadNode.node, sha256Hex),
      sha256Hex,
    ),
  });
}

function independentContinuationEdgeProjection(
  edge: PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1[
    "edgeAudits"
  ][number],
  edgeIndex: number,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    edgeIndex,
    reportedEdgeIndex: edge.edgeIndex,
    fromS: edge.fromS,
    toS: edge.toS,
    fromBloodVolumesM3: numericRecordProjectionIndependent(
      edge.fromBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    toBloodVolumesM3: numericRecordProjectionIndependent(
      edge.toBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    tangentAudit: independentTangentAuditProjection(edge.tangentAudit),
    predictorUnknowns: numberVectorIndependent(edge.predictorUnknowns),
    acceptedUnknowns: numberVectorIndependent(edge.acceptedUnknowns),
    acceptedNodeStepScaledInfinityNorm:
      edge.acceptedNodeStepScaledInfinityNorm,
    predictorCorrectionScaledInfinityNorm:
      edge.predictorCorrectionScaledInfinityNorm,
    acceptedNode: independentLoadNodeProjection(
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

function independentTangentAuditProjection(
  tangent: PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditV1,
) {
  if (tangent.success === false) return Object.freeze({
    success: false as const,
    reason: tangent.reason,
    message: tangent.message,
    linearSolveFailureReason: closedNullableIndependent(
      tangent.linearSolveFailureReason,
    ),
    linearSolveDiagnostics: closedNullableMappedIndependent(
      tangent.linearSolveDiagnostics,
      independentDenseLuProjection,
    ),
  });
  return Object.freeze({
    success: true as const,
    coarseStep: tangent.coarseStep,
    fineStep: tangent.fineStep,
    coarseStencil: tangent.coarseStencil,
    fineStencil: tangent.fineStencil,
    coarseScaledResidualDerivativeByS: numberVectorIndependent(
      tangent.coarseScaledResidualDerivativeByS,
    ),
    fineScaledResidualDerivativeByS: numberVectorIndependent(
      tangent.fineScaledResidualDerivativeByS,
    ),
    coarseScaledUnknownTangentByS: numberVectorIndependent(
      tangent.coarseScaledUnknownTangentByS,
    ),
    fineScaledUnknownTangentByS: numberVectorIndependent(
      tangent.fineScaledUnknownTangentByS,
    ),
    coarseLinearSolveDiagnostics: independentDenseLuProjection(
      tangent.coarseLinearSolveDiagnostics,
    ),
    fineLinearSolveDiagnostics: independentDenseLuProjection(
      tangent.fineLinearSolveDiagnostics,
    ),
    coarseFineScaledTangentDisagreement:
      tangent.coarseFineScaledTangentDisagreement,
    tangentDisagreementPass: tangent.tangentDisagreementPass,
  });
}

function independentFailedAttemptProjection(
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
    fromBloodVolumesM3: numericRecordProjectionIndependent(
      attempt.fromBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    toBloodVolumesM3: numericRecordProjectionIndependent(
      attempt.toBloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    tangentAudit: closedNullableMappedIndependent(
      attempt.tangentAudit,
      independentTangentAuditProjection,
    ),
    predictorUnknowns: closedNullableMappedIndependent(
      attempt.predictorUnknowns,
      numberVectorIndependent,
    ),
    correctorResult: closedNullableMappedIndependent(
      attempt.correctorResult,
      (result) => independentColdNodeResultProjection(result, sha256Hex),
    ),
    candidateNodeStepScaledInfinityNorm: closedNullableIndependent(
      attempt.candidateNodeStepScaledInfinityNorm,
    ),
    candidatePredictorCorrectionScaledInfinityNorm: closedNullableIndependent(
      attempt.candidatePredictorCorrectionScaledInfinityNorm,
    ),
  });
}

function independentColdNodeResultProjection(
  result: PhaseB1ColdEtaOneFixedVolumeNodeResultV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  if (result.converged === true) return Object.freeze({
    converged: true as const,
    node: independentNodeProjection(result, sha256Hex),
  });
  return Object.freeze({
    converged: false as const,
    eta: result.eta,
    reason: result.reason,
    message: result.message,
    rollbackUnknowns: numberVectorIndependent(result.rollbackUnknowns),
    lastAcceptedUnknowns: closedNullableMappedIndependent(
      result.lastAcceptedUnknowns,
      numberVectorIndependent,
    ),
    newtonDiagnostics: closedNullableMappedIndependent(
      result.newtonDiagnostics,
      independentNewtonDiagnosticsProjection,
    ),
    projectionApplied: result.projectionApplied,
    clippingApplied: result.clippingApplied,
    fallbackApplied: result.fallbackApplied,
  });
}

function independentCensusProjection(
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
        resultDigestSha256: digestProjectionIndependent(
          `census-result:${census.seedOrder}:${resultIndex}`,
          independentColdNodeResultProjection(result, sha256Hex),
          sha256Hex,
        ),
        eta: result.eta,
        classification: result.converged === true
          ? closedValueIndependent(result.effectiveTriSegAudit.classification)
          : closedMissingIndependent(),
      }))),
    convergedRootCount: census.convergedRootCount,
    clusters: Object.freeze(census.clusters.map((cluster, clusterIndex) =>
      Object.freeze({
        clusterIndex,
        representativeResultIndex: cluster.representativeResultIndex,
        memberResultIndices: integerVectorIndependent(
          cluster.memberResultIndices,
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

function independentFailureProbeProjection(
  probe: PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  sourceNode: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const result = probe.result;
  return Object.freeze({
    probeId: probe.probeId,
    injectedAttemptIndex: probe.injectedAttemptIndex,
    result: independentContinuationProjection(result, sourceNode, sha256Hex),
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

function verifyGraphInventory(
  prefix: string,
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
): void {
  const expectedNodeIds = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NODES_V1
    .map((node) => node.nodeId);
  const expectedEdgeIds = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1
    .map((edge) => edge.edgeId);
  const directedInventory = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1
    .flatMap((edge) => [
      `${edge.edgeId}|forward|${edge.fromNodeId}|${edge.toNodeId}`,
      `${edge.edgeId}|reverse|${edge.toNodeId}|${edge.fromNodeId}`,
    ]);
  const actualDirected = graph.directedEdges.map((edge) =>
    `${edge.edgeId}|${edge.direction}|${edge.sourceNodeId}|${edge.destinationNodeId}`);
  const actualRoundTrips = graph.roundTripAudits.map((edge) => edge.edgeId);
  if (
    !denseArray(graph.canonicalNodes, 9)
    || !denseArray(graph.directedEdges, 32)
    || !denseArray(graph.roundTripAudits, 16)
    || !denseArray(graph.rootCensus, 9)
    || !exactStringArray(graph.canonicalNodes.map((node) => node.nodeId), expectedNodeIds)
    || !sameStringSet(actualDirected, directedInventory)
    || !sameStringSet(actualRoundTrips, expectedEdgeIds)
    || !exactStringArray(graph.rootCensus.map((census) => census.nodeId), expectedNodeIds)
    || graph.directedEdges.some((edge) =>
      edge.pathRole !== "canonical-source-directed")
    || graph.roundTripAudits.some((edge) =>
      edge.pathRole !== "forward-endpoint-roundtrip"
      || edge.direction !== "reverse")
  ) failures.push(`${prefix} exact 9/16/32/16/9 graph inventory drifted`);
}

function verifyNodeAudit(
  label: string,
  audit: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  expectedVolumes: Readonly<Record<BloodCompartmentId, number>>,
): void {
  const { node, ledger } = audit;
  const policy = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1;
  verifyLedger(label, ledger, session.anchorFixedInputs.bloodVolumesM3,
    expectedVolumes);
  verifyNode(`${label} node`, node, session, expectedVolumes);

  const wallIdentity = wallRecord((wallId) => {
    const mechanics = node.residualEvaluation.closedLoop.wallMechanics[wallId];
    const rawLandActiveStressPa = mechanics.activeKirchhoffStressPa;
    const assembledActiveStressPa = mechanics.totalKirchhoffStressPa
      - mechanics.equilibriumPassive.equilibriumKirchhoffStressPa
      - mechanics.slsOverstressPa;
    return Object.freeze({
      rawLandActiveStressPa,
      assembledActiveStressPa,
      absoluteDifferencePa: Math.abs(
        assembledActiveStressPa - rawLandActiveStressPa,
      ),
    });
  });
  const maximumLandDifference = Math.max(...WALL_IDS.map(
    (wallId) => wallIdentity[wallId].absoluteDifferencePa,
  ));
  const thresholdMetricsFinite = [
    node.scaledResidualInfinityNorm,
    node.scaledUpdateInfinityNorm,
    node.maximumLocalMaterialResidualInfinityNorm,
    node.minimumLandSimplexMargin,
    node.effectiveTriSegAudit.sigmaMinimum,
    node.effectiveTriSegAudit.conditionNumber2,
    node.effectiveTriSegAudit.robustSignedMargin,
    node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
  ].every(Number.isFinite);
  const thresholdNormMetricsNonnegative = [
    node.scaledResidualInfinityNorm,
    node.scaledUpdateInfinityNorm,
    node.maximumLocalMaterialResidualInfinityNorm,
    node.effectiveTriSegAudit.sigmaMinimum,
    node.effectiveTriSegAudit.conditionNumber2,
    node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
  ].every((value) => value >= 0);
  const prohibitedOperationsAbsent = node.projectionApplied === false
    && node.clippingApplied === false
    && node.fallbackApplied === false
    && node.residualEvaluation.projectionApplied === false
    && node.residualEvaluation.clippingApplied === false;
  const expectedHardPass = ledger.accepted
    && node.eta === 1
    && node.residualEvaluation.eta === 1
    && thresholdMetricsFinite
    && thresholdNormMetricsNonnegative
    && node.scaledResidualInfinityNorm
      <= policy.gates.maximumScaledResidualInfinityNorm
    && node.scaledUpdateInfinityNorm
      <= policy.gates.maximumScaledUpdateInfinityNorm
    && node.maximumLocalMaterialResidualInfinityNorm
      <= policy.gates.maximumLocalMaterialResidualInfinityNorm
    && node.minimumLandSimplexMargin >= policy.gates.minimumLandSimplexMargin
    && node.effectiveTriSegAudit.accepted
    && node.effectiveTriSegAudit.classification === "robust-restoring"
    && node.effectiveTriSegAudit.sigmaMinimum
      >= policy.gates.minimumEffectiveTriSegSigma
    && node.effectiveTriSegAudit.conditionNumber2
      <= policy.gates.maximumEffectiveTriSegConditionNumber2
    && node.effectiveTriSegAudit.robustSignedMargin
      >= policy.gates.minimumStaticRestoringMargin
    && node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm
      <= policy.gates.maximumSchurToReequilibratedDifferenceTwoNorm
    && node.effectiveTriSegAudit.withinPublishedTaylorTwoPercentTensionErrorDomain
    && maximumLandDifference
      <= policy.gates.maximumAssembledToRawLandActiveDifferencePa
    && prohibitedOperationsAbsent;
  const guard = policy.fiftyPercentGuard;
  const expectedGuardPass = expectedHardPass
    && node.scaledResidualInfinityNorm
      <= guard.upperThresholdMultiplier * policy.gates.maximumScaledResidualInfinityNorm
    && node.scaledUpdateInfinityNorm
      <= guard.upperThresholdMultiplier * policy.gates.maximumScaledUpdateInfinityNorm
    && node.maximumLocalMaterialResidualInfinityNorm
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumLocalMaterialResidualInfinityNorm
    && node.minimumLandSimplexMargin
      >= guard.lowerThresholdMultiplier * policy.gates.minimumLandSimplexMargin
    && node.effectiveTriSegAudit.sigmaMinimum
      >= guard.lowerThresholdMultiplier * policy.gates.minimumEffectiveTriSegSigma
    && node.effectiveTriSegAudit.conditionNumber2
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumEffectiveTriSegConditionNumber2
    && node.effectiveTriSegAudit.robustSignedMargin
      >= guard.lowerThresholdMultiplier * policy.gates.minimumStaticRestoringMargin
    && node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumSchurToReequilibratedDifferenceTwoNorm
    && maximumLandDifference
      <= guard.upperThresholdMultiplier
        * policy.gates.maximumAssembledToRawLandActiveDifferencePa;
  if (
    !deepExactEqual(audit.landIdentityAudit.wallByWall, wallIdentity)
    || !Object.is(
      audit.landIdentityAudit.maximumAssembledToRawLandActiveDifferencePa,
      maximumLandDifference,
    )
    || !audit.landIdentityAudit.pass
    || audit.thresholdMetricsFinite !== thresholdMetricsFinite
    || audit.thresholdNormMetricsNonnegative !== thresholdNormMetricsNonnegative
    || audit.prohibitedOperationsAbsent !== prohibitedOperationsAbsent
    || audit.hardGatePass !== expectedHardPass
    || audit.fiftyPercentGuardPass !== expectedGuardPass
    || !audit.etaOneExact
    || !audit.fixedStateExact
    || !audit.effectiveTriSegRestoringPass
  ) failures.push(`${label} independent node/Land/gate projection drifted`);
}

function verifyLedger(
  label: string,
  ledger: PhaseB1EtaOneFiniteVolumeNodeAuditV1["ledger"],
  anchor: Readonly<Record<BloodCompartmentId, number>>,
  expected: Readonly<Record<BloodCompartmentId, number>>,
): void {
  const anchorTotal = totalBloodVolume(anchor);
  const nodeTotal = totalBloodVolume(ledger.bloodVolumesM3);
  const deltaLv = ledger.bloodVolumesM3.LV - anchor.LV;
  const deltaRv = ledger.bloodVolumesM3.RV - anchor.RV;
  const difference = nodeTotal - anchorTotal;
  const relative = Math.abs(difference) / anchorTotal;
  if (
    !exactPlainRecordKeys(ledger.bloodVolumesM3, BLOOD_COMPARTMENT_IDS)
    || !deepExactEqual(ledger.bloodVolumesM3, expected)
    || !BLOOD_COMPARTMENT_IDS.every((id) =>
      Number.isFinite(ledger.bloodVolumesM3[id])
      && ledger.bloodVolumesM3[id] > 0)
    || !Object.is(ledger.deltaLeftVentricularVolumeM3, deltaLv)
    || !Object.is(ledger.deltaRightVentricularVolumeM3, deltaRv)
    || !Object.is(ledger.anchorTotalBloodVolumeM3, anchorTotal)
    || !Object.is(ledger.nodeTotalBloodVolumeM3, nodeTotal)
    || !Object.is(ledger.totalBloodVolumeDifferenceM3, difference)
    || !Object.is(ledger.relativeTotalBloodVolumeDifference, relative)
    || ledger.bloodVolumesM3.PV !== anchor.PV - deltaLv
    || ledger.bloodVolumesM3.SV !== anchor.SV - deltaRv
    || !["LA", "RA", "SA", "PA"].every((id) =>
      ledger.bloodVolumesM3[id as BloodCompartmentId]
        === anchor[id as BloodCompartmentId])
    || !ledger.allVolumesPositive
    || !ledger.unchangedCompartmentsExact
    || !ledger.complementLedgerExact
    || !ledger.accepted
    || !Number.isFinite(relative)
    || relative
      > PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .totalBloodVolumeRelativeTolerance
  ) failures.push(`${label} closed fixed-volume ledger drifted`);
}

function verifyNode(
  label: string,
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  expectedVolumes: Readonly<Record<BloodCompartmentId, number>>,
): void {
  const dimension = session.layout.unknownCount;
  const state = node.endpoint.differentialState;
  const residual = node.residualEvaluation.residual;
  verifyLiveResidualReplay(label, node, session, expectedVolumes);
  const scaledResidual = Math.max(0, ...residual.map((value, index) =>
    Math.abs(value / session.layout.residualScales[index])));
  const maximumLocal = Math.max(
    node.residualEvaluation.maximumAbsolutePopulationRhsPerSec,
    node.residualEvaluation.maximumAbsoluteDistortionConstraint,
    node.residualEvaluation.maximumAbsoluteSlsConstraint,
  );
  const jacobian = node.algorithmicJacobian;
  const rawJacobianPass = denseMatrix(jacobian.rawJacobian, dimension, dimension)
    && jacobian.rawJacobian.every((row) => row.every(Number.isFinite));
  const scaledJacobianPass = denseMatrix(
    jacobian.scaledJacobian,
    dimension,
    dimension,
  ) && jacobian.scaledJacobian.every((row) => row.every(Number.isFinite));
  let jacobianScaleRelationPass = rawJacobianPass && scaledJacobianPass;
  if (jacobianScaleRelationPass) {
    for (let row = 0; row < dimension; row += 1) {
      for (let column = 0; column < dimension; column += 1) {
        const expected = jacobian.rawJacobian[row][column]
          * session.layout.unknownScales[column]
          / session.layout.residualScales[row];
        if (!roundoffEqual(jacobian.scaledJacobian[row][column], expected)) {
          jacobianScaleRelationPass = false;
        }
      }
    }
  }
  const jacobianInventoryPass = rawJacobianPass
    && scaledJacobianPass
    && jacobianScaleRelationPass
    && denseArray(jacobian.stencilByColumn, dimension)
    && jacobian.stencilByColumn.every((stencil) =>
      stencil === "centered-five-point"
      || stencil === "forward-five-point"
      || stencil === "backward-five-point")
    && denseFiniteVector(jacobian.scaledStepByColumn, dimension)
    && jacobian.scaledStepByColumn.every((step) => step > 0)
    && Number.isFinite(jacobian.scaledStep)
    && jacobian.scaledStep > 0;

  const landPass = exactPlainRecordKeys(state.landByWall, WALL_IDS)
    && exactPlainRecordKeys(
      node.residualEvaluation.wallMaterialByWall,
      WALL_IDS,
    )
    && exactPlainRecordKeys(
      node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall,
      WALL_IDS,
    )
    && exactPlainRecordKeys(
      node.residualEvaluation.freeCalciumUMByWall,
      WALL_IDS,
    )
    && WALL_IDS.every((wallId) => {
      const land = state.landByWall[wallId];
      const material = node.residualEvaluation.wallMaterialByWall[wallId];
      const backward =
        node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
      const health = material.sourceLandOutput.health;
      const slsPass = session.slsMode === "on"
        ? state.slsMode === "on"
          && Number.isFinite(state.slsAlphaVByWall[wallId])
          && material.sls.mode === "on"
          && material.sls.statePhysicallyPresent
          && Number.isFinite(material.sls.overstressPa)
          && backward.slsResidual !== null
          && Number.isFinite(backward.slsResidual)
        : state.slsMode === "off"
          && material.sls.mode === "off"
          && !material.sls.statePhysicallyPresent
          && material.sls.overstressPa === 0
          && backward.slsResidual === null;
      return denseFiniteVector(land, 6)
        && landPopulationSimplexMargin(land) >= 0
        && denseFiniteVector(material.reconstructedSourceLandState, 6)
        && denseFiniteVector(material.wallActiveStressPartialsPaByLandState, 6)
        && denseFiniteVector(material.totalStressPartialsPaByLandState, 6)
        && denseFiniteVector(backward.landResidual, 6)
        && denseFiniteVector(backward.landStateJacobianRowMajor, 36)
        && denseFiniteVector(backward.landResidualPartialByNextFiberLogStrain, 6)
        && health.finite
        && !health.projectionUsed
        && Number.isFinite(health.stateConservationResidual)
        && health.stateConservationResidual >= 0
        && Number.isFinite(health.minimumPopulation)
        && health.minimumPopulation >= 0
        && Number.isFinite(node.residualEvaluation.freeCalciumUMByWall[wallId])
        && node.residualEvaluation.freeCalciumUMByWall[wallId] >= 0
        && slsPass;
    });

  const triSeg = node.effectiveTriSegAudit;
  const triSegVectorPass = denseFiniteVector(
    triSeg.scaledSchurGeneralizedForceTangent,
    4,
  ) && denseFiniteVector(triSeg.scaledReequilibratedCoarseTangent, 4)
    && denseFiniteVector(triSeg.scaledReequilibratedFineTangent, 4)
    && denseFiniteVector(triSeg.symmetricFineTangent, 4)
    && denseFiniteVector(triSeg.eigenvaluesAscending, 2);
  const triSegScalarPass = [
    triSeg.derivativeDisagreementTwoNorm,
    triSeg.uncertaintyBound,
    triSeg.robustSignedMargin,
    triSeg.sigmaMinimum,
    triSeg.conditionNumber2,
    triSeg.schurToReequilibratedDifferenceTwoNorm,
  ].every(Number.isFinite)
    && triSeg.derivativeDisagreementTwoNorm >= 0
    && triSeg.uncertaintyBound >= 0
    && triSeg.sigmaMinimum >= 0
    && triSeg.conditionNumber2 >= 0
    && triSeg.schurToReequilibratedDifferenceTwoNorm >= 0;

  if (
    node.converged !== true
    || node.eta !== 1
    || node.residualEvaluation.eta !== 1
    || !Object.is(node.endpoint, node.residualEvaluation.endpoint)
    || !denseFiniteVector(node.unknowns, dimension)
    || !denseFiniteVector(residual, dimension)
    || !exactPlainRecordKeys(state.bloodVolumesM3, BLOOD_COMPARTMENT_IDS)
    || !exactPlainRecordKeys(state.inertialFlowsM3PerSec, INERTIAL_FLOW_IDS)
    || !exactPlainRecordKeys(state.calciumByWall, WALL_IDS)
    || !deepExactEqual(state.bloodVolumesM3, expectedVolumes)
    || !deepExactEqual(
      state.inertialFlowsM3PerSec,
      session.anchorFixedInputs.inertialFlowsM3PerSec,
    )
    || !deepExactEqual(
      state.calciumByWall,
      session.anchorFixedInputs.calciumByWall,
    )
    || state.slsMode !== session.slsMode
    || node.endpoint.timeSec !== 0
    || !roundoffEqual(node.scaledResidualInfinityNorm, scaledResidual)
    || !roundoffEqual(
      node.maximumLocalMaterialResidualInfinityNorm,
      maximumLocal,
    )
    || !Number.isFinite(node.scaledResidualInfinityNorm)
    || !Number.isFinite(node.scaledUpdateInfinityNorm)
    || !Number.isFinite(node.minimumLandSimplexMargin)
    || !Number.isFinite(node.maximumLocalMaterialResidualInfinityNorm)
    || node.scaledResidualInfinityNorm < 0
    || node.scaledUpdateInfinityNorm < 0
    || node.maximumLocalMaterialResidualInfinityNorm < 0
    || node.minimumLandSimplexMargin
      !== Math.min(...WALL_IDS.map((wallId) =>
        landPopulationSimplexMargin(state.landByWall[wallId])))
    || !jacobianInventoryPass
    || !landPass
    || !triSegVectorPass
    || !triSegScalarPass
    || !allNumericLeavesFinite(node.newtonDiagnostics)
    || node.projectionApplied
    || node.clippingApplied
    || node.fallbackApplied
    || node.residualEvaluation.projectionApplied
    || node.residualEvaluation.clippingApplied
  ) failures.push(`${label} full 37/32 node/Jacobian/Land/TriSeg audit failed`);
}

function verifyLiveResidualReplay(
  label: string,
  node: PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  expectedVolumes: Readonly<Record<BloodCompartmentId, number>>,
): void {
  let liveResidual: readonly number[] | null = null;
  try {
    liveResidual = session.evaluateResidualVectorAtVolumes({
      bloodVolumesM3: expectedVolumes,
      unknowns: node.unknowns,
    });
  } catch (error) {
    failures.push(`${label} live residual replay threw: ${message(error)}`);
  }
  const storedResidual = node.residualEvaluation.residual;
  const liveResidualExact = liveResidual !== null
    && exactNumberArray(liveResidual, storedResidual);
  const liveResidualRoundoff = liveResidual !== null
    && vectorRoundoffEqual(liveResidual, storedResidual);
  if (!liveResidualExact || !liveResidualRoundoff) {
    failures.push(`${label} expected-volume/unknown live residual replay drifted`);
  }
}

function verifyAllPaths(
  prefix: string,
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  canonicalById: ReadonlyMap<string, PhaseB1EtaOneFiniteVolumeNodeAuditV1>,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
) {
  const factorHistogram: Record<"2" | "4" | "8", number> = {
    2: 0,
    4: 0,
    8: 0,
  };
  for (const definition of
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EDGES_V1) {
    const matching = graph.directedEdges.filter(
      (edge) => edge.edgeId === definition.edgeId,
    );
    const forward = matching.filter((edge) => edge.direction === "forward");
    const reverse = matching.filter((edge) => edge.direction === "reverse");
    if (forward.length !== 1 || reverse.length !== 1) {
      failures.push(`${prefix} ${definition.edgeId} directed multiplicity drifted`);
      continue;
    }
    verifyDirectedPath(
      `${prefix} ${definition.edgeId}-forward`,
      forward[0],
      requireCanonicalAudit(canonicalById, definition.fromNodeId),
      requireCanonicalAudit(canonicalById, definition.toNodeId),
      session,
      false,
    );
    verifyDirectedPath(
      `${prefix} ${definition.edgeId}-reverse`,
      reverse[0],
      requireCanonicalAudit(canonicalById, definition.toNodeId),
      requireCanonicalAudit(canonicalById, definition.fromNodeId),
      session,
      false,
    );

    const roundTrips = graph.roundTripAudits.filter(
      (edge) => edge.edgeId === definition.edgeId,
    );
    if (roundTrips.length !== 1) {
      failures.push(`${prefix} ${definition.edgeId} round-trip multiplicity drifted`);
      continue;
    }
    const forwardEndpoint = selectedContinuationEndpoint(forward[0]);
    if (forwardEndpoint === null) {
      failures.push(`${prefix} ${definition.edgeId} forward endpoint absent`);
      continue;
    }
    verifyDirectedPath(
      `${prefix} ${definition.edgeId}-forward-endpoint-roundtrip`,
      roundTrips[0],
      Object.freeze({
        ...requireCanonicalAudit(canonicalById, definition.toNodeId),
        node: forwardEndpoint.node,
      }),
      requireCanonicalAudit(canonicalById, definition.fromNodeId),
      session,
      true,
    );
    const roundTripFirst = firstContinuationLoadNode(
      roundTrips[0].attempts[0]?.continuation,
    );
    if (
      roundTripFirst === null
      || !Object.is(roundTripFirst.node, forwardEndpoint.node)
    ) failures.push(`${prefix} ${definition.edgeId} round-trip source is not forward endpoint identity`);
  }
  for (const edge of [...graph.directedEdges, ...graph.roundTripAudits]) {
    if (edge.selectedRefinementFactor !== null) {
      factorHistogram[String(edge.selectedRefinementFactor) as "2" | "4" | "8"] += 1;
    }
  }
  const maximumDestination = Math.max(...graph.directedEdges.map((edge) =>
    requireFiniteNumber(edge.destinationAgreementScaledInfinityNorm,
      `${prefix} directed destination metric`)));
  const maximumRoundTrip = Math.max(...graph.roundTripAudits.map((edge) =>
    requireFiniteNumber(edge.destinationAgreementScaledInfinityNorm,
      `${prefix} round-trip closure metric`)));
  if (
    !Object.is(
      graph.maximumDestinationAgreementScaledInfinityNorm,
      maximumDestination,
    )
    || !Object.is(graph.maximumRoundTripClosureScaledInfinityNorm,
      maximumRoundTrip)
    || maximumDestination
      > PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .endpointAgreementScaledInfinityTolerance
    || maximumRoundTrip
      > PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
        .reverseClosureScaledInfinityTolerance
  ) failures.push(`${prefix} aggregate endpoint/round-trip metric drifted`);
  return Object.freeze({
    factorHistogram: Object.freeze(factorHistogram),
    maximumDestinationAgreementScaledInfinityNorm: maximumDestination,
    maximumRoundTripClosureScaledInfinityNorm: maximumRoundTrip,
  });
}

function verifyDirectedPath(
  label: string,
  edge: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
  source: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  destination: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  roundTrip: boolean,
): void {
  const declaredFactors = [2, 4, 8] as const;
  const factors = edge.attempts.map((attempt) => attempt.refinementFactor);
  if (
    !denseArray(edge.attempts, edge.attempts.length)
    || edge.attempts.length < 1
    || edge.attempts.length > 3
    || !exactNumberArray(factors, declaredFactors.slice(0, factors.length))
    || edge.sourceNodeId !== source.nodeId
    || edge.destinationNodeId !== destination.nodeId
    || edge.pathRole !== (roundTrip
      ? "forward-endpoint-roundtrip"
      : "canonical-source-directed")
    || edge.hiddenSubdivisionApplied
    || edge.pseudoArclengthApplied
    || edge.etaHomotopyRescueApplied
    || edge.rootRankingApplied
  ) failures.push(`${label} path inventory, role, or top-level prohibited flag drifted`);

  let previousFactorEndpoint:
    PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 | null = null;
  const recomputedGuardPasses: boolean[] = [];
  edge.attempts.forEach((attempt, attemptIndex) => {
    const attemptLabel = `${label} factor-${attempt.refinementFactor}`;
    const continuation = attempt.continuation;
    const first = firstContinuationLoadNode(continuation);
    if (
      first === null
      || !Object.is(first.node, source.node)
      || !deepExactEqual(first.bloodVolumesM3, source.ledger.bloodVolumesM3)
      || !deepExactEqual(
        continuation.sourceBloodVolumesM3,
        source.ledger.bloodVolumesM3,
      )
      || previousFactorEndpoint !== null
        && Object.is(first.node, previousFactorEndpoint)
    ) failures.push(`${attemptLabel} exact canonical source or no-factor-seed-sharing drifted`);

    const attemptAudit = verifyContinuationAttempt(
      attemptLabel,
      continuation,
      attempt.nodeAudits,
      source,
      destination,
      session,
    );
    if (
      attempt.hardGatePass !== attemptAudit.hardGatePass
      || attempt.fiftyPercentGuardPass !== attemptAudit.fiftyPercentGuardPass
      || attempt.refinementTrigger !== (attemptAudit.fiftyPercentGuardPass
        ? "none"
        : attemptAudit.hardGatePass
          ? "fifty-percent-guard-not-met"
          : "hard-failure")
    ) failures.push(`${attemptLabel} hard/50-percent/trigger projection drifted`);
    recomputedGuardPasses.push(attemptAudit.fiftyPercentGuardPass);
    previousFactorEndpoint = attemptAudit.endpoint;
    if (attemptIndex < edge.attempts.length - 1 && attemptAudit.fiftyPercentGuardPass) {
      failures.push(`${attemptLabel} adaptive search continued after first pass`);
    }
  });

  const firstPassingIndex = recomputedGuardPasses.findIndex(Boolean);
  const expectedSelectedIndex = firstPassingIndex < 0 ? null : firstPassingIndex;
  const selected = expectedSelectedIndex === null
    ? null
    : edge.attempts[expectedSelectedIndex];
  const selectedEndpoint = selected?.continuation.completed === true
    ? selected.continuation.endpoint
    : null;
  const expectedAgreement = selectedEndpoint === null
    ? null
    : scaledInfinityDistance(
      selectedEndpoint.node.unknowns,
      destination.node.unknowns,
      session.layout.unknownScales,
    );
  const tolerance = roundTrip
    ? PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
      .reverseClosureScaledInfinityTolerance
    : PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
      .endpointAgreementScaledInfinityTolerance;
  if (
    expectedSelectedIndex === null
    || edge.selectedAttemptIndex !== expectedSelectedIndex
    || edge.attempts.length !== expectedSelectedIndex + 1
    || edge.selectedRefinementFactor !== selected?.refinementFactor
    || edge.firstGuardPassingFactor !== selected?.refinementFactor
    || !edge.selectionRuleAuditPass
    || !Object.is(edge.destinationAgreementScaledInfinityNorm, expectedAgreement)
    || expectedAgreement === null
    || !Number.isFinite(expectedAgreement)
    || expectedAgreement > tolerance
    || !edge.accepted
    || !Object.is(edge.declaredRollbackUnknownsOnFailure, source.node.unknowns)
  ) failures.push(`${label} first-pass selection, rollback declaration, or closure drifted`);
}

function verifyContinuationAttempt(
  label: string,
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  nodeAudits: readonly PhaseB1EtaOneFiniteVolumeNodeAuditV1[],
  source: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  destination: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
) {
  const factor = continuation.refinementFactor;
  const expectedS = buildSGrid(factor, continuation.direction);
  const loadNodes = continuation.completed === true
    ? continuation.nodes
    : continuation.acceptedNodes;
  const allProhibitedAbsent = continuation.hiddenSubdivisionApplied === false
    && continuation.pseudoArclengthApplied === false
    && continuation.projectionApplied === false
    && continuation.clippingApplied === false
    && continuation.nearestRootSelectionApplied === false
    && continuation.minimumResidualRootSelectionApplied === false
    && continuation.maximumJunctionRadiusRootSelectionApplied === false;
  if (
    continuation.slsMode !== session.slsMode
    || continuation.direction !== (expectedS[0] === 0 ? "forward" : "reverse")
    || !exactNumberArray(continuation.requestedSValues, expectedS)
    || !denseArray(continuation.attemptedSValues,
      continuation.attemptedSValues.length)
    || continuation.attemptedSValues.some((value, index) =>
      !Object.is(value, expectedS[index]))
    || !deepExactEqual(
      continuation.sourceBloodVolumesM3,
      source.ledger.bloodVolumesM3,
    )
    || !deepExactEqual(
      continuation.destinationBloodVolumesM3,
      destination.ledger.bloodVolumesM3,
    )
    || continuation.previousNodeUsedAs !== "tangent-predictor-base-only"
    || !allProhibitedAbsent
    || !denseArray(loadNodes, loadNodes.length)
    || !denseArray(nodeAudits, loadNodes.length)
  ) failures.push(`${label} grid/source/destination/prohibited inventory drifted`);

  loadNodes.forEach((loadNode, index) => {
    const expectedVolumes = interpolateVolumes(
      source.ledger.bloodVolumesM3,
      destination.ledger.bloodVolumesM3,
      loadNode.s,
      continuation.direction,
      session.anchorFixedInputs.bloodVolumesM3,
    );
    if (
      !Object.is(loadNode.s, expectedS[index])
      || !deepExactEqual(loadNode.bloodVolumesM3, expectedVolumes)
      || !Object.is(nodeAudits[index]?.node, loadNode.node)
    ) failures.push(`${label} load-node-${index} vector or object identity drifted`);
    const audit = nodeAudits[index];
    if (audit !== undefined) {
      verifyNodeAudit(
        `${label} node-${index}`,
        audit,
        session,
        loadNode.bloodVolumesM3,
      );
    }
  });

  if (continuation.completed === false) {
    verifyFailedContinuation(label, continuation, session);
    return Object.freeze({
      endpoint: null,
      hardGatePass: false,
      fiftyPercentGuardPass: false,
    });
  }
  verifySuccessfulContinuation(label, continuation, session);
  const metricsFinite = [
    continuation.maximumCoarseFineScaledTangentDisagreement,
    continuation.maximumAcceptedNodeStepScaledInfinityNorm,
    continuation.maximumPredictorCorrectionScaledInfinityNorm,
  ].every(Number.isFinite);
  const hardGatePass = continuation.nodes.length === factor + 1
    && continuation.edgeAudits.length === factor
    && Object.is(continuation.nodes[0].node, source.node)
    && deepExactEqual(
      continuation.endpoint.bloodVolumesM3,
      destination.ledger.bloodVolumesM3,
    )
    && nodeAudits.every((audit) => audit.hardGatePass)
    && metricsFinite
    && continuation.maximumCoarseFineScaledTangentDisagreement
      <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
        .continuation.maximumCoarseFineScaledTangentDisagreement
    && continuation.maximumAcceptedNodeStepScaledInfinityNorm
      <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
        .continuation.maximumAcceptedNodeStepScaledInfinityNorm
    && continuation.maximumPredictorCorrectionScaledInfinityNorm
      <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
        .continuation.maximumPredictorCorrectionScaledInfinityNorm
    && allProhibitedAbsent;
  const guard = PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
    .fiftyPercentGuard;
  const fiftyPercentGuardPass = hardGatePass
    && nodeAudits.every((audit) => audit.fiftyPercentGuardPass)
    && continuation.maximumCoarseFineScaledTangentDisagreement
      <= guard.upperThresholdMultiplier
        * PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
          .continuation.maximumCoarseFineScaledTangentDisagreement
    && continuation.maximumAcceptedNodeStepScaledInfinityNorm
      <= guard.upperThresholdMultiplier
        * PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
          .continuation.maximumAcceptedNodeStepScaledInfinityNorm
    && continuation.maximumPredictorCorrectionScaledInfinityNorm
      <= guard.upperThresholdMultiplier
        * PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1
          .continuation.maximumPredictorCorrectionScaledInfinityNorm;
  return Object.freeze({
    endpoint: continuation.endpoint.node,
    hardGatePass,
    fiftyPercentGuardPass,
  });
}

function verifySuccessfulContinuation(
  label: string,
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
): void {
  const dimension = session.layout.unknownCount;
  if (
    !denseArray(continuation.nodes, continuation.refinementFactor + 1)
    || !denseArray(continuation.edgeAudits, continuation.refinementFactor)
    || !Object.is(
      continuation.endpoint,
      continuation.nodes[continuation.nodes.length - 1],
    )
    || !continuation.branchIdentityEstablished
    || continuation.branchIdentity
      !== "restoring-root-tracked-by-full-state-fixed-volume-tangent-predictor-corrector"
  ) failures.push(`${label} successful continuation inventory/endpoint identity drifted`);

  let maximumTangentDisagreement = 0;
  let maximumNodeStep = 0;
  let maximumPredictorCorrection = 0;
  continuation.edgeAudits.forEach((edge, index) => {
    const previous = continuation.nodes[index];
    const accepted = continuation.nodes[index + 1];
    const tangent = edge.tangentAudit;
    const expectedPredictor = previous.node.unknowns.map((value, column) =>
      value + (accepted.s - previous.s)
        * tangent.fineScaledUnknownTangentByS[column]
        * session.layout.unknownScales[column]);
    const recomputedDisagreement = maximumAbsoluteDifference(
      tangent.coarseScaledUnknownTangentByS,
      tangent.fineScaledUnknownTangentByS,
    );
    const recomputedNodeStep = scaledInfinityDistance(
      previous.node.unknowns,
      accepted.node.unknowns,
      session.layout.unknownScales,
    );
    const recomputedCorrection = scaledInfinityDistance(
      edge.predictorUnknowns,
      accepted.node.unknowns,
      session.layout.unknownScales,
    );
    maximumTangentDisagreement = Math.max(
      maximumTangentDisagreement,
      recomputedDisagreement,
    );
    maximumNodeStep = Math.max(maximumNodeStep, recomputedNodeStep);
    maximumPredictorCorrection = Math.max(
      maximumPredictorCorrection,
      recomputedCorrection,
    );
    const coarseLinearResidual = tangentLinearResidualInfinityNorm(
      previous.node.algorithmicJacobian.scaledJacobian,
      tangent.coarseScaledUnknownTangentByS,
      tangent.coarseScaledResidualDerivativeByS,
    );
    const fineLinearResidual = tangentLinearResidualInfinityNorm(
      previous.node.algorithmicJacobian.scaledJacobian,
      tangent.fineScaledUnknownTangentByS,
      tangent.fineScaledResidualDerivativeByS,
    );
    verifyIndependentLoadTangentAudit(
      `${label} edge-${index}`,
      continuation,
      previous.s,
      previous.node.unknowns,
      previous.node.algorithmicJacobian.scaledJacobian,
      tangent,
      session,
    );
    if (
      edge.edgeIndex !== index
      || !Object.is(edge.fromS, previous.s)
      || !Object.is(edge.toS, accepted.s)
      || !deepExactEqual(edge.fromBloodVolumesM3, previous.bloodVolumesM3)
      || !deepExactEqual(edge.toBloodVolumesM3, accepted.bloodVolumesM3)
      || !tangent.success
      || tangent.coarseStep
        !== PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1
          .coarseLoadDerivativeStep
      || tangent.fineStep
        !== PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1
          .fineLoadDerivativeStep
      || !denseFiniteVector(
        tangent.coarseScaledResidualDerivativeByS,
        dimension,
      )
      || !denseFiniteVector(
        tangent.fineScaledResidualDerivativeByS,
        dimension,
      )
      || !denseFiniteVector(tangent.coarseScaledUnknownTangentByS, dimension)
      || !denseFiniteVector(tangent.fineScaledUnknownTangentByS, dimension)
      || !verifyLuDiagnostics(tangent.coarseLinearSolveDiagnostics, dimension)
      || !verifyLuDiagnostics(tangent.fineLinearSolveDiagnostics, dimension)
      || !Number.isFinite(coarseLinearResidual)
      || !Number.isFinite(fineLinearResidual)
      || coarseLinearResidual > 1e-8
      || fineLinearResidual > 1e-8
      || !Object.is(
        tangent.coarseFineScaledTangentDisagreement,
        recomputedDisagreement,
      )
      || tangent.tangentDisagreementPass !== (
        recomputedDisagreement
          <= PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1
            .maximumCoarseFineScaledTangentDisagreement
      )
      || !vectorRoundoffEqual(edge.predictorUnknowns, expectedPredictor)
      || !deepExactEqual(edge.acceptedUnknowns, accepted.node.unknowns)
      || !Object.is(edge.acceptedNode, accepted)
      || !Object.is(edge.acceptedNodeStepScaledInfinityNorm, recomputedNodeStep)
      || !Object.is(
        edge.predictorCorrectionScaledInfinityNorm,
        recomputedCorrection,
      )
      || !edge.edgePass
    ) failures.push(`${label} edge-${index} full tangent/Jacobian/predictor/corrector audit failed`);
  });
  if (
    !Object.is(
      continuation.maximumCoarseFineScaledTangentDisagreement,
      maximumTangentDisagreement,
    )
    || !Object.is(
      continuation.maximumAcceptedNodeStepScaledInfinityNorm,
      maximumNodeStep,
    )
    || !Object.is(
      continuation.maximumPredictorCorrectionScaledInfinityNorm,
      maximumPredictorCorrection,
    )
  ) failures.push(`${label} continuation aggregate vector metric drifted`);
}

function verifyFailedContinuation(
  label: string,
  continuation: Exclude<
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1
  >,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
): void {
  const failure = continuation.failedAttempt;
  const rollback = continuation.acceptedNodes[
    continuation.acceptedNodes.length - 1
  ];
  const tangent = failure.tangentAudit;
  continuation.acceptedNodes.forEach((accepted, index) => {
    const expectedVolumes = interpolateVolumes(
      continuation.sourceBloodVolumesM3,
      continuation.destinationBloodVolumesM3,
      accepted.s,
      continuation.direction,
      session.anchorFixedInputs.bloodVolumesM3,
    );
    if (!deepExactEqual(accepted.bloodVolumesM3, expectedVolumes)) {
      failures.push(`${label} accepted-node-${index} expected volume drifted`);
    }
    verifyNode(
      `${label} accepted-node-${index}`,
      accepted.node,
      session,
      expectedVolumes,
    );
  });
  continuation.edgeAudits.forEach((edge, index) => {
    const previous = continuation.acceptedNodes[index];
    const accepted = continuation.acceptedNodes[index + 1];
    if (previous === undefined || accepted === undefined) {
      failures.push(`${label} accepted edge-${index} node inventory drifted`);
      return;
    }
    verifyIndependentLoadTangentAudit(
      `${label} accepted-edge-${index}`,
      continuation,
      previous.s,
      previous.node.unknowns,
      previous.node.algorithmicJacobian.scaledJacobian,
      edge.tangentAudit,
      session,
    );
  });
  if (failure.correctorResult?.converged === true) {
    verifyLiveResidualReplay(
      `${label} failed-corrector-node`,
      failure.correctorResult,
      session,
      failure.toBloodVolumesM3,
    );
  }
  if (tangent?.success === true && rollback !== undefined) {
    verifyIndependentLoadTangentAudit(
      `${label} failed-attempt-${failure.attemptIndex}`,
      continuation,
      failure.fromS,
      rollback.node.unknowns,
      rollback.node.algorithmicJacobian.scaledJacobian,
      tangent,
      session,
    );
    const expectedPredictor = rollback.node.unknowns.map((value, column) =>
      value + (failure.toS - failure.fromS)
        * tangent.fineScaledUnknownTangentByS[column]
        * session.layout.unknownScales[column]);
    if (
      failure.predictorUnknowns !== null
      && !vectorRoundoffEqual(failure.predictorUnknowns, expectedPredictor)
    ) failures.push(`${label} failed-attempt predictor drifted`);
  }
  if (
    rollback === undefined
    || !Object.is(continuation.rollbackNode, rollback)
    || !Object.is(continuation.rollbackUnknowns, rollback.node.unknowns)
    || !Object.is(continuation.rollbackBloodVolumesM3, rollback.bloodVolumesM3)
    || failure.attemptIndex !== continuation.edgeAudits.length
    || !Object.is(failure.fromS, rollback.s)
    || !deepExactEqual(failure.fromBloodVolumesM3, rollback.bloodVolumesM3)
    || !denseFiniteVector(continuation.rollbackUnknowns,
      session.layout.unknownCount)
    || !continuationProhibitedAbsent(continuation)
    || continuation.branchIdentityEstablished
    || continuation.branchIdentity !== "not-established"
    || tangent?.success === true && (
      !denseFiniteVector(tangent.coarseScaledResidualDerivativeByS,
        session.layout.unknownCount)
      || !denseFiniteVector(tangent.fineScaledResidualDerivativeByS,
        session.layout.unknownCount)
      || !denseFiniteVector(tangent.coarseScaledUnknownTangentByS,
        session.layout.unknownCount)
      || !denseFiniteVector(tangent.fineScaledUnknownTangentByS,
        session.layout.unknownCount)
    )
  ) failures.push(`${label} failed-attempt rollback or tangent inventory drifted`);
}

function verifyIndependentLoadTangentAudit(
  label: string,
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  sourceS: number,
  sourceUnknowns: readonly number[],
  scaledJacobian: readonly (readonly number[])[],
  tangent: PhaseB1ColdEtaOneFixedVolumeLoadTangentAuditSuccessV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
): void {
  const policy = PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1;
  let coarse: ReturnType<typeof reconstructLoadDerivativeIndependent> | null = null;
  let fine: ReturnType<typeof reconstructLoadDerivativeIndependent> | null = null;
  try {
    coarse = reconstructLoadDerivativeIndependent(
      continuation,
      sourceS,
      sourceUnknowns,
      policy.coarseLoadDerivativeStep,
      session,
    );
    fine = reconstructLoadDerivativeIndependent(
      continuation,
      sourceS,
      sourceUnknowns,
      policy.fineLoadDerivativeStep,
      session,
    );
  } catch (error) {
    failures.push(`${label} independent five-point derivative threw: ${message(error)}`);
    return;
  }
  let coarseSolve: ReturnType<typeof solveDensePartialPivotIndependent> | null = null;
  let fineSolve: ReturnType<typeof solveDensePartialPivotIndependent> | null = null;
  try {
    coarseSolve = solveDensePartialPivotIndependent(
      scaledJacobian,
      coarse.scaledResidualDerivativeByS.map((value) => -value),
    );
    fineSolve = solveDensePartialPivotIndependent(
      scaledJacobian,
      fine.scaledResidualDerivativeByS.map((value) => -value),
    );
  } catch (error) {
    failures.push(`${label} independent dense tangent solve threw: ${message(error)}`);
    return;
  }
  const derivativeExact = exactNumberArray(
    coarse.scaledResidualDerivativeByS,
    tangent.coarseScaledResidualDerivativeByS,
  ) && exactNumberArray(
    fine.scaledResidualDerivativeByS,
    tangent.fineScaledResidualDerivativeByS,
  );
  const derivativeRoundoff = vectorRoundoffEqual(
    coarse.scaledResidualDerivativeByS,
    tangent.coarseScaledResidualDerivativeByS,
  ) && vectorRoundoffEqual(
    fine.scaledResidualDerivativeByS,
    tangent.fineScaledResidualDerivativeByS,
  );
  const tangentExact = exactNumberArray(
    coarseSolve.solution,
    tangent.coarseScaledUnknownTangentByS,
  ) && exactNumberArray(
    fineSolve.solution,
    tangent.fineScaledUnknownTangentByS,
  );
  const tangentRoundoff = vectorRoundoffEqual(
    coarseSolve.solution,
    tangent.coarseScaledUnknownTangentByS,
  ) && vectorRoundoffEqual(
    fineSolve.solution,
    tangent.fineScaledUnknownTangentByS,
  );
  if (
    tangent.coarseStep !== policy.coarseLoadDerivativeStep
    || tangent.fineStep !== policy.fineLoadDerivativeStep
    || tangent.coarseStencil !== coarse.stencil
    || tangent.fineStencil !== fine.stencil
    || !derivativeExact
    || !derivativeRoundoff
    || !tangentExact
    || !tangentRoundoff
    || !deepExactEqual(
      tangent.coarseLinearSolveDiagnostics,
      coarseSolve.diagnostics,
    )
    || !deepExactEqual(
      tangent.fineLinearSolveDiagnostics,
      fineSolve.diagnostics,
    )
  ) failures.push(`${label} independent five-point derivative/tangent audit drifted`);
}

function reconstructLoadDerivativeIndependent(
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  sourceS: number,
  sourceUnknowns: readonly number[],
  step: number,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
) {
  if (!Number.isFinite(sourceS) || !Number.isFinite(step) || step <= 0) {
    throw new Error("five-point load derivative source/step is invalid");
  }
  const stencil = sourceS - 2 * step < 0
    ? "forward-five-point" as const
    : sourceS + 2 * step > 1
      ? "backward-five-point" as const
      : "centered-five-point" as const;
  const offsets = stencil === "centered-five-point"
    ? [-2, -1, 1, 2]
    : stencil === "forward-five-point"
      ? [0, 1, 2, 3, 4]
      : [0, -1, -2, -3, -4];
  const scaledResiduals = offsets.map((offset) => {
    const sampleS = sourceS + offset * step;
    if (sampleS < 0 || sampleS > 1) {
      throw new Error(`five-point load derivative sample ${sampleS} left [0,1]`);
    }
    const volumes = interpolateVolumes(
      continuation.sourceBloodVolumesM3,
      continuation.destinationBloodVolumesM3,
      sampleS,
      continuation.direction,
      session.anchorFixedInputs.bloodVolumesM3,
    );
    const residual = session.evaluateResidualVectorAtVolumes({
      bloodVolumesM3: volumes,
      unknowns: sourceUnknowns,
    });
    if (!denseFiniteVector(residual, session.layout.unknownCount)) {
      throw new Error("five-point load derivative residual dimension drifted");
    }
    return Object.freeze(residual.map((value, row) => {
      const scaled = value / session.layout.residualScales[row];
      if (!Number.isFinite(scaled)) {
        throw new Error(`five-point scaled residual ${row} is non-finite`);
      }
      return scaled;
    }));
  });
  const derivative = Object.freeze(Array.from(
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
      if (!Number.isFinite(value)) {
        throw new Error(`five-point load derivative ${row} is non-finite`);
      }
      return value;
    },
  ));
  return Object.freeze({ stencil, scaledResidualDerivativeByS: derivative });
}

function solveDensePartialPivotIndependent(
  matrix: readonly (readonly number[])[],
  rightHandSide: readonly number[],
) {
  const dimension = rightHandSide.length;
  if (
    dimension <= 0
    || !denseMatrix(matrix, dimension, dimension)
    || !denseFiniteVector(rightHandSide, dimension)
    || matrix.some((row) => row.some((value) => !Number.isFinite(value)))
  ) throw new Error("independent dense solve input drifted");
  const lu = Float64Array.from(matrix.flat());
  const transformedRightHandSide = Float64Array.from(rightHandSide);
  let matrixInfinityNorm = 0;
  let maximumAbsoluteOriginalEntry = 0;
  for (let row = 0; row < dimension; row += 1) {
    let rowSum = 0;
    for (let column = 0; column < dimension; column += 1) {
      const absolute = Math.abs(lu[row * dimension + column]);
      rowSum += absolute;
      maximumAbsoluteOriginalEntry = Math.max(
        maximumAbsoluteOriginalEntry,
        absolute,
      );
    }
    matrixInfinityNorm = Math.max(matrixInfinityNorm, rowSum);
  }
  const pivotThreshold = 64 * Number.EPSILON * matrixInfinityNorm;
  if (matrixInfinityNorm === 0) throw new Error("independent dense solve matrix is zero");
  let maximumAbsoluteFactorEntry = maximumAbsoluteOriginalEntry;
  let minimumAbsolutePivot = Number.POSITIVE_INFINITY;
  let maximumAbsolutePivot = 0;
  let rowSwapCount = 0;
  for (let column = 0; column < dimension; column += 1) {
    let pivotRow = column;
    let pivotAbsolute = Math.abs(lu[column * dimension + column]);
    for (let row = column + 1; row < dimension; row += 1) {
      const candidate = Math.abs(lu[row * dimension + column]);
      if (candidate > pivotAbsolute) {
        pivotAbsolute = candidate;
        pivotRow = row;
      }
    }
    if (!Number.isFinite(pivotAbsolute) || pivotAbsolute <= pivotThreshold) {
      throw new Error(`independent dense solve pivot ${column} failed`);
    }
    if (pivotRow !== column) {
      for (let entryColumn = 0; entryColumn < dimension; entryColumn += 1) {
        const first = column * dimension + entryColumn;
        const second = pivotRow * dimension + entryColumn;
        const temporary = lu[first];
        lu[first] = lu[second];
        lu[second] = temporary;
      }
      const temporary = transformedRightHandSide[column];
      transformedRightHandSide[column] = transformedRightHandSide[pivotRow];
      transformedRightHandSide[pivotRow] = temporary;
      rowSwapCount += 1;
    }
    const pivot = lu[column * dimension + column];
    const absolutePivot = Math.abs(pivot);
    minimumAbsolutePivot = Math.min(minimumAbsolutePivot, absolutePivot);
    maximumAbsolutePivot = Math.max(maximumAbsolutePivot, absolutePivot);
    for (let row = column + 1; row < dimension; row += 1) {
      const rowOffset = row * dimension;
      const factor = lu[rowOffset + column] / pivot;
      if (!Number.isFinite(factor)) {
        throw new Error("independent dense solve factor became non-finite");
      }
      lu[rowOffset + column] = factor;
      transformedRightHandSide[row] -=
        factor * transformedRightHandSide[column];
      for (let entryColumn = column + 1; entryColumn < dimension; entryColumn += 1) {
        const index = rowOffset + entryColumn;
        lu[index] -= factor * lu[column * dimension + entryColumn];
        maximumAbsoluteFactorEntry = Math.max(
          maximumAbsoluteFactorEntry,
          Math.abs(lu[index]),
        );
      }
      if (!Number.isFinite(transformedRightHandSide[row])) {
        throw new Error("independent dense solve RHS became non-finite");
      }
    }
  }
  const solution = new Float64Array(dimension);
  for (let row = dimension - 1; row >= 0; row -= 1) {
    let value = transformedRightHandSide[row];
    for (let column = row + 1; column < dimension; column += 1) {
      value -= lu[row * dimension + column] * solution[column];
    }
    value /= lu[row * dimension + row];
    if (!Number.isFinite(value)) {
      throw new Error("independent dense solve solution became non-finite");
    }
    solution[row] = value;
  }
  const diagnostics = Object.freeze({
    dimension,
    matrixInfinityNorm,
    maximumAbsoluteOriginalEntry,
    maximumAbsoluteFactorEntry,
    minimumAbsolutePivot,
    maximumAbsolutePivot,
    relativeMinimumPivot: minimumAbsolutePivot / matrixInfinityNorm,
    pivotGrowthFactor:
      maximumAbsoluteFactorEntry / maximumAbsoluteOriginalEntry,
    rowSwapCount,
    pivotThreshold,
  });
  return Object.freeze({
    solution: Object.freeze(Array.from(solution)),
    diagnostics,
  });
}

function tangentLinearResidualInfinityNorm(
  matrix: readonly (readonly number[])[],
  tangent: readonly number[],
  derivative: readonly number[],
): number {
  if (
    matrix.length !== tangent.length
    || tangent.length !== derivative.length
    || !denseMatrix(matrix, tangent.length, tangent.length)
  ) return Number.POSITIVE_INFINITY;
  return Math.max(0, ...matrix.map((row, rowIndex) => Math.abs(
    row.reduce((sum, value, column) => sum + value * tangent[column], 0)
      + derivative[rowIndex],
  )));
}

function verifyLuDiagnostics(
  diagnostics: Readonly<{
    dimension: number;
    matrixInfinityNorm: number;
    maximumAbsoluteOriginalEntry: number;
    maximumAbsoluteFactorEntry: number;
    minimumAbsolutePivot: number;
    maximumAbsolutePivot: number;
    relativeMinimumPivot: number;
    pivotGrowthFactor: number;
    rowSwapCount: number;
    pivotThreshold: number;
  }>,
  dimension: number,
): boolean {
  return diagnostics.dimension === dimension
    && Number.isInteger(diagnostics.rowSwapCount)
    && diagnostics.rowSwapCount >= 0
    && diagnostics.rowSwapCount < dimension
    && [
      diagnostics.matrixInfinityNorm,
      diagnostics.maximumAbsoluteOriginalEntry,
      diagnostics.maximumAbsoluteFactorEntry,
      diagnostics.minimumAbsolutePivot,
      diagnostics.maximumAbsolutePivot,
      diagnostics.relativeMinimumPivot,
      diagnostics.pivotGrowthFactor,
      diagnostics.pivotThreshold,
    ].every((value) => Number.isFinite(value) && value >= 0);
}

function verifyAllCensuses(
  prefix: string,
  censuses: readonly PhaseB1EtaOneFiniteVolumeNodeCensusAuditV1[],
  canonicalById: ReadonlyMap<string, PhaseB1EtaOneFiniteVolumeNodeAuditV1>,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
) {
  let totalClusters = 0;
  for (const audit of censuses) {
    const canonical = requireCanonicalAudit(canonicalById, audit.nodeId);
    const declared = verifyCensus(
      `${prefix} census-${audit.nodeId}-declared`,
      audit.declared,
      "declared",
      canonical,
      session,
    );
    const reverse = verifyCensus(
      `${prefix} census-${audit.nodeId}-reverse`,
      audit.reverse,
      "reverse",
      canonical,
      session,
    );
    totalClusters += audit.declared.clusters.length + audit.reverse.clusters.length;
    const bijection = censusBijection(
      audit.declared,
      audit.reverse,
      session.layout.unknownScales,
    );
    const declaredTracked = matchingRestoringClusterCount(
      audit.declared,
      canonical.node.unknowns,
      session.layout.unknownScales,
    );
    const reverseTracked = matchingRestoringClusterCount(
      audit.reverse,
      canonical.node.unknowns,
      session.layout.unknownScales,
    );
    if (
      !declared.pass
      || !reverse.pass
      || !bijection
      || !audit.clusterSetsBijective
      || !audit.declaredInventoryPass
      || !audit.reverseInventoryPass
      || audit.declaredTrackedRestoringClusterCount !== declaredTracked
      || audit.reverseTrackedRestoringClusterCount !== reverseTracked
      || declaredTracked !== 1
      || reverseTracked !== 1
      || !audit.trackedCanonicalMatchesExactlyOneRestoringCluster
      || !audit.pass
    ) failures.push(`${prefix} census-${audit.nodeId} bijection/tracked-one projection drifted`);
  }
  return Object.freeze({
    censusCount: censuses.length,
    declaredAndReverseCensusCount: 2 * censuses.length,
    totalClusters,
  });
}

function verifyCensus(
  label: string,
  census: PhaseB1ColdEtaOneFixedVolumeRootCensusV1,
  expectedOrder: "declared" | "reverse",
  canonical: PhaseB1EtaOneFiniteVolumeNodeAuditV1,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
) {
  const declaredSeeds =
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds;
  const expectedSeeds = expectedOrder === "declared"
    ? declaredSeeds
    : Object.freeze([...declaredSeeds].reverse());
  const convergedIndices = census.results.flatMap((result, index) =>
    result.converged ? [index] : []);
  const memberIndices = census.clusters.flatMap(
    (cluster) => [...cluster.memberResultIndices],
  );
  const sortedConverged = [...convergedIndices].sort((left, right) => left - right);
  const sortedMembers = [...memberIndices].sort((left, right) => left - right);
  const partitionPass = exactNumberArray(sortedConverged, sortedMembers)
    && new Set(memberIndices).size === memberIndices.length;
  let clusterPass = denseArray(census.clusters, census.clusters.length)
    && census.clusters.length > 0;
  for (const [clusterIndex, cluster] of census.clusters.entries()) {
    const representative = census.results[cluster.representativeResultIndex];
    const memberDistances = cluster.memberResultIndices.map((resultIndex) => {
      const member = census.results[resultIndex];
      if (representative?.converged !== true || member?.converged !== true) {
        return Number.POSITIVE_INFINITY;
      }
      return scaledInfinityDistance(
        representative.unknowns,
        member.unknowns,
        session.layout.unknownScales,
      );
    });
    const maximumDistance = Math.max(0, ...memberDistances);
    const membersPass = denseArray(
      cluster.memberResultIndices,
      cluster.memberResultIndices.length,
    ) && cluster.memberResultIndices.length > 0
      && cluster.memberResultIndices.includes(cluster.representativeResultIndex)
      && cluster.memberResultIndices.every((resultIndex) =>
        Number.isInteger(resultIndex)
        && resultIndex >= 0
        && resultIndex < census.results.length)
      && representative?.converged === true
      && cluster.memberResultIndices.every((resultIndex) => {
        const member = census.results[resultIndex];
        return member?.converged === true
          && member.effectiveTriSegAudit.classification === cluster.classification;
      });
    const distancePass = memberDistances.every((distance) =>
      Number.isFinite(distance)
      && distance
        <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
          .rootClusteringScaledInfinityTolerance);
    if (
      !membersPass
      || !distancePass
      || representative?.converged !== true
      || representative.effectiveTriSegAudit.classification
        !== cluster.classification
      || !deepExactEqual(
        representative.endpoint.triSegCoordinates,
        cluster.coordinates,
      )
      || !Object.is(cluster.maximumMemberScaledInfinityDistance, maximumDistance)
      || cluster.memberFullVectorDistancePass !== distancePass
      || cluster.memberClassificationMatches !== membersPass
    ) {
      clusterPass = false;
      failures.push(`${label} cluster-${clusterIndex} member multiplicity/classification drifted`);
    }
  }
  for (const [index, result] of census.results.entries()) {
    if (result.converged !== true) {
      failures.push(`${label} root-${index} did not converge`);
      continue;
    }
    verifyNode(
      `${label} root-${index}`,
      result,
      session,
      canonical.ledger.bloodVolumesM3,
    );
  }
  const pass = census.eta === 1
    && census.seedOrder === expectedOrder
    && denseArray(census.seeds, 3)
    && deepExactEqual(census.seeds, expectedSeeds)
    && denseArray(census.results, 3)
    && census.results.every((result) => result.converged)
    && census.convergedRootCount === convergedIndices.length
    && census.enumerationCompleted
    && census.allSeedsAttempted
    && census.allSeedsConverged
    && census.convergedResultsPartitionedExactlyOnce === partitionPass
    && census.allClusterMembersWithinFullVectorTolerance === clusterPass
    && census.allClusterMemberClassificationsMatch === clusterPass
    && census.allDiscoveredRootsReported
    && !census.selectionInputToAcceptedPath
    && !census.globalExhaustivenessClaimed
    && partitionPass
    && clusterPass;
  if (!pass) failures.push(`${label} seed/result/partition/claim audit failed`);
  return Object.freeze({
    pass,
    seedCount: census.seeds.length,
    convergedRootCount: census.convergedRootCount,
    clusterCount: census.clusters.length,
    partitionPass,
    clusterPass,
  });
}

function censusBijection(
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
      const candidateRepresentative =
        reverse.results[candidate.representativeResultIndex];
      const classificationMultiplicityMatches = candidate.memberResultIndices.length
          === cluster.memberResultIndices.length
        && candidate.memberResultIndices.every((resultIndex) => {
          const result = reverse.results[resultIndex];
          return result?.converged === true
            && result.effectiveTriSegAudit.classification === cluster.classification;
        });
      return candidateRepresentative?.converged === true
        && candidate.classification === cluster.classification
        && classificationMultiplicityMatches
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
  target: readonly number[],
  scales: readonly number[],
): number {
  return census.clusters.filter((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    return representative?.converged === true
      && cluster.classification === "robust-restoring"
      && scaledInfinityDistance(representative.unknowns, target, scales)
        <= PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_POLICY_V1.gates
          .rootClusteringScaledInfinityTolerance;
  }).length;
}

function verifyFailureProbes(
  prefix: string,
  probes: readonly PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1[],
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  canonicalById: ReadonlyMap<string, PhaseB1EtaOneFiniteVolumeNodeAuditV1>,
  session: PhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
) {
  const center = requireCanonicalAudit(canonicalById, "C");
  const east = requireCanonicalAudit(canonicalById, "E");
  const independentlyRebuilt = Object.freeze([0, 1].map((attemptIndex) =>
    runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1({
      session,
      sourceNode: center.node,
      sourceBloodVolumesM3: center.ledger.bloodVolumesM3,
      destinationBloodVolumesM3: east.ledger.bloodVolumesM3,
      direction: "forward",
      refinementFactor: 2,
    }, attemptIndex as 0 | 1))) as readonly [
      PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
      PhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
    ];
  if (
    !denseArray(probes, 2)
    || !deepExactEqual(probes, independentlyRebuilt)
  ) failures.push(`${prefix} failure-probe independent replay drifted`);
  probes.forEach((probe, index) => {
    const result = probe.result;
    const rollback = result.acceptedNodes[result.acceptedNodes.length - 1];
    const first = result.acceptedNodes[0];
    const failed = result.failedAttempt;
    if (
      probe.injectedAttemptIndex !== index
      || result.completed
      || result.reason !== "injected-structured-failure"
      || result.direction !== "forward"
      || result.refinementFactor !== 2
      || !Object.is(first?.node, center.node)
      || result.acceptedNodes.length !== index + 1
      || result.edgeAudits.length !== index
      || failed.attemptIndex !== index
      || failed.tangentAudit?.success !== true
      || !denseFiniteVector(
        failed.tangentAudit.coarseScaledResidualDerivativeByS,
        session.layout.unknownCount,
      )
      || !denseFiniteVector(
        failed.tangentAudit.fineScaledResidualDerivativeByS,
        session.layout.unknownCount,
      )
      || !denseFiniteVector(
        failed.tangentAudit.coarseScaledUnknownTangentByS,
        session.layout.unknownCount,
      )
      || !denseFiniteVector(
        failed.tangentAudit.fineScaledUnknownTangentByS,
        session.layout.unknownCount,
      )
      || failed.predictorUnknowns === null
      || !denseFiniteVector(failed.predictorUnknowns, session.layout.unknownCount)
      || failed.correctorResult !== null
      || failed.candidateNodeStepScaledInfinityNorm !== null
      || failed.candidatePredictorCorrectionScaledInfinityNorm !== null
      || rollback === undefined
      || !Object.is(result.rollbackNode, rollback)
      || !Object.is(result.rollbackUnknowns, rollback.node.unknowns)
      || !Object.is(result.rollbackBloodVolumesM3, rollback.bloodVolumesM3)
      || result.hiddenSubdivisionApplied
      || result.pseudoArclengthApplied
      || result.projectionApplied
      || result.clippingApplied
      || result.nearestRootSelectionApplied
      || result.minimumResidualRootSelectionApplied
      || result.maximumJunctionRadiusRootSelectionApplied
      || result.branchIdentityEstablished
      || result.branchIdentity !== "not-established"
    ) failures.push(`${prefix} failure-probe-${index} rollback identity/tag drifted`);
    verifyFailedContinuation(`${prefix} failure-probe-${index}`, result, session);
  });
  const canonicalCenter = graph.canonicalNodes.find((audit) => audit.nodeId === "C");
  if (!Object.is(canonicalCenter?.node, center.node)) {
    failures.push(`${prefix} failure probes are not bound to canonical graph center`);
  }
  return Object.freeze({
    probeCount: probes.length,
    injectedAttemptIndices: Object.freeze(probes.map(
      (probe) => probe.injectedAttemptIndex,
    )),
    rollbackIdentityPass: probes.every((probe) => {
      const rollback = probe.result.acceptedNodes[
        probe.result.acceptedNodes.length - 1
      ];
      return rollback !== undefined
        && Object.is(probe.result.rollbackNode, rollback)
        && Object.is(probe.result.rollbackUnknowns, rollback.node.unknowns)
        && Object.is(probe.result.rollbackBloodVolumesM3,
          rollback.bloodVolumesM3);
    }),
  });
}

function verifyReadiness(
  readiness: Readiness,
  manifestSha256: string,
  numericalSha256: string,
): void {
  const positiveClaims = Object.entries(readiness)
    .filter(([key, value]) => key.endsWith("Pass") && value === true)
    .map(([key]) => key);
  if (
    readiness.bindings.finiteVolumeGraphEvidenceManifestSha256
      !== manifestSha256
    || readiness.bindings.numericalEvidenceSha256 !== numericalSha256
    || readiness.phaseB1LandCoupledFiniteVolumeGraphPass !== true
    || readiness.evidenceLayerDirectParentAuthenticationPass !== true
    || readiness.implementation.evidenceLayerDirectParentAuthenticationPass
      !== true
    || !exactStringArray(readiness.implementation.slsTopologies, MODES)
    || readiness.implementation.declaredCanonicalNodeCountPerMode !== 9
    || readiness.implementation.declaredUndirectedEdgeCountPerMode !== 16
    || readiness.implementation.auditedCanonicalSourceDirectedEdgeCountPerMode
      !== 32
    || readiness.implementation.auditedForwardEndpointRoundTripCountPerMode
      !== 16
    || readiness.implementation.finiteRootCensusCountPerMode !== 9
    || !exactNumberArray(
      readiness.implementation.adaptiveRefinementFactors,
      [2, 4, 8],
    )
    || !exactNumberArray(
      readiness.implementation.structuredFailureProbeAttemptIndices,
      [0, 1],
    )
    || readiness.pureCoreParentEvidenceAuthenticationClaimed
    || !readiness.testOnly
    || readiness.modelCoreIntegration
    || readiness.browserRuntimeAdopted
    || readiness.releaseRuntimeReachable
    || positiveClaims.some((claim) => ![
      "phaseB1LandCoupledFiniteVolumeGraphPass",
      "evidenceLayerDirectParentAuthenticationPass",
    ].includes(claim))
  ) failures.push("readiness binding, narrow claim, or exact inventory drifted");
}

function verifyMutationMatrix(
  manifest: ReturnType<
    typeof buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1
  >,
  numericalEvidence: NumericalEvidence,
): void {
  const manifestJsonCopy = JSON.parse(JSON.stringify(manifest)) as typeof manifest;
  expectRejected("manifest JSON copy WeakSet gate", () =>
    assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
      manifestJsonCopy,
    ));
  const shallowBundle = { ...numericalEvidence } as NumericalEvidence;
  expectRejected("shallow numerical bundle WeakSet gate", () =>
    assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
      shallowBundle,
      manifest,
    ));

  const graph = numericalEvidence.results.on;
  const canonicalNode = graph.canonicalNodes[0].node;
  const firstPath = graph.directedEdges[0];
  const firstContinuation = firstPath.attempts[0].continuation;
  if (!firstContinuation.completed) {
    failures.push("mutation matrix requires a successful canonical path");
    return;
  }
  const landHealth = canonicalNode.residualEvaluation.wallMaterialByWall.LA
    .sourceLandOutput.health;
  const jacobianRow = canonicalNode.algorithmicJacobian.rawJacobian[0];
  const tangentVector = firstContinuation.edgeAudits[0].tangentAudit
    .fineScaledUnknownTangentByS;
  const attemptArray = firstPath.attempts;
  const roundTrip = graph.roundTripAudits[0];
  const censusIndices = graph.rootCensus[0].declared.clusters[0]
    .memberResultIndices;
  const certificateSummary = numericalEvidence.certificate.modes.on;
  const digestMutationAudit = structuredClone(graph.canonicalNodes[0]);
  const digestMutationDomain = `canonical-node:${digestMutationAudit.nodeId}`;
  const canonicalNodeDigest = digestProjectionIndependent(
    digestMutationDomain,
    independentNodeAuditProjection(graph.canonicalNodes[0], sha256),
    sha256,
  );
  const clonedNodeDigestBeforeMutation = digestProjectionIndependent(
    digestMutationDomain,
    independentNodeAuditProjection(digestMutationAudit, sha256),
    sha256,
  );
  if (canonicalNodeDigest !== clonedNodeDigestBeforeMutation) {
    failures.push("deep-cloned node audit projection changed before mutation");
  }
  const clonedLandHealth = digestMutationAudit.node.residualEvaluation
    .wallMaterialByWall.LA.sourceLandOutput.health;
  (clonedLandHealth as { finite: boolean }).finite = !clonedLandHealth.finite;
  const clonedNodeDigestAfterMutation = digestProjectionIndependent(
    digestMutationDomain,
    independentNodeAuditProjection(digestMutationAudit, sha256),
    sha256,
  );
  if (clonedNodeDigestAfterMutation === clonedNodeDigestBeforeMutation) {
    failures.push("raw Land health mutation did not change node projection digest");
  }
  const before = Object.freeze({
    landFinite: landHealth.finite,
    jacobian00: jacobianRow[0],
    tangent0: tangentVector[0],
    attemptLength: attemptArray.length,
    roundTripAccepted: roundTrip.accepted,
    censusLength: censusIndices.length,
    modePass: certificateSummary.modePass,
  });
  expectRejected("deep raw Land health mutation", () => {
    (landHealth as { finite: boolean }).finite = !landHealth.finite;
  });
  expectRejected("deep raw Jacobian row mutation", () => {
    (jacobianRow as number[])[0] += 1;
  });
  expectRejected("deep tangent vector mutation", () => {
    (tangentVector as number[])[0] += 1;
  });
  expectRejected("attempt array mutation", () => {
    (attemptArray as unknown[]).pop();
  });
  expectRejected("round-trip mutation", () => {
    (roundTrip as { accepted: boolean }).accepted = false;
  });
  expectRejected("census member-index mutation", () => {
    (censusIndices as number[]).push(99);
  });
  expectRejected("certificate summary mutation", () => {
    (certificateSummary as { modePass: boolean }).modePass = false;
  });
  const after = Object.freeze({
    landFinite: landHealth.finite,
    jacobian00: jacobianRow[0],
    tangent0: tangentVector[0],
    attemptLength: attemptArray.length,
    roundTripAccepted: roundTrip.accepted,
    censusLength: censusIndices.length,
    modePass: certificateSummary.modePass,
  });
  if (!deepExactEqual(before, after)) {
    failures.push("mutation matrix altered canonical evidence despite rejection");
  }
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
  node: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1[
    "etaOne"
  ]["node"],
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  if (node.eta !== 1) {
    throw new Error("finite-volume verifier requires an exact eta-one node");
  }
  return node as PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
}

function requireCanonicalNode(
  nodes: ReadonlyMap<string, PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1>,
  nodeId: string,
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  const node = nodes.get(nodeId);
  if (node === undefined) throw new Error(`canonical node ${nodeId} absent`);
  return node;
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
    [...cluster.memberResultIndices]).sort((left, right) => left - right);
  const partitionRecomputedPass = exactNumberArray(
    convergedIndices,
    memberIndices,
  ) && new Set(memberIndices).size === memberIndices.length;
  const clusterAudits = census.clusters.map((cluster) => {
    const representativeIndex = cluster.representativeResultIndex;
    const representative = Number.isInteger(representativeIndex)
      ? census.results[representativeIndex]
      : undefined;
    const memberInventoryPass = cluster.memberResultIndices.length > 0
      && denseArray(
        cluster.memberResultIndices,
        cluster.memberResultIndices.length,
      )
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
    const distances = convergedMembers.map((member) =>
      scaledInfinityDistance(
        representative.unknowns,
        member.unknowns,
        unknownScales,
      ));
    const maximumDistance = Math.max(...distances);
    const distancePass = distances.every((distance) =>
      Number.isFinite(distance)
      && distance
        <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .rootClusteringScaledInfinityTolerance);
    const classificationPass = convergedMembers.every((member) =>
      member.effectiveTriSegAudit.classification === cluster.classification);
    const structuralPass =
      representative.effectiveTriSegAudit.classification
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
        maximumDistance,
      )
      && cluster.memberFullVectorDistancePass === distancePass
      && cluster.memberClassificationMatches === classificationPass;
    return Object.freeze({ structuralPass, distancePass, classificationPass });
  });
  const allMembersWithinTolerance = clusterAudits.every((audit) =>
    audit.structuralPass && audit.distancePass);
  const allClassificationsMatch = clusterAudits.every((audit) =>
    audit.structuralPass && audit.classificationPass);
  return census.eta === 1
    && census.convergedRootCount === convergedIndices.length
    && partitionRecomputedPass
    && clusterAudits.length > 0
    && census.convergedResultsPartitionedExactlyOnce
      === partitionRecomputedPass
    && census.allClusterMembersWithinFullVectorTolerance
      === allMembersWithinTolerance
    && census.allClusterMemberClassificationsMatch
      === allClassificationsMatch
    && allMembersWithinTolerance
    && allClassificationsMatch;
}

function censusSeedsExact(
  actual: readonly Readonly<{ V_m_S: number; y_m: number }>[],
  expected: readonly Readonly<{ V_m_S: number; y_m: number }>[],
): boolean {
  return denseArray(actual, expected.length)
    && denseArray(expected, expected.length)
    && actual.every((seed, index) =>
      exactPlainRecordKeys(seed, ["V_m_S", "y_m"])
      && exactPlainRecordKeys(expected[index], ["V_m_S", "y_m"])
      && Object.is(seed.V_m_S, expected[index].V_m_S)
      && Object.is(seed.y_m, expected[index].y_m));
}

function digestProjectionIndependent(
  domain: string,
  projection: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  if (domain.length === 0) throw new Error("projection digest domain is empty");
  assertIndependentRawEvidenceDataShape(
    projection,
    `independent-projection:${domain}`,
    new WeakSet<object>(),
  );
  return computeCanonicalSha256(Object.freeze({ domain, projection }), sha256Hex);
}

function vectorSha(
  vector: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return digestProjectionIndependent(
    "numeric-vector",
    numberVectorIndependent(vector, "vectorSha"),
    sha256Hex,
  );
}

function numberVectorIndependent(
  vector: readonly number[],
  field = "numberVector",
): readonly number[] {
  const copy = denseCopyIndependent(vector, field);
  copy.forEach((value, index) => {
    if (!Number.isFinite(value)) throw new Error(`${field}[${index}] is non-finite`);
  });
  return Object.freeze([...copy]);
}

function integerVectorIndependent(
  vector: readonly number[],
  field = "integerVector",
): readonly number[] {
  const copy = numberVectorIndependent(vector, field);
  if (copy.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error(`${field} must contain nonnegative integers`);
  }
  return copy;
}

function numberMatrixIndependent(
  matrix: readonly (readonly number[])[],
  field = "numberMatrix",
): readonly (readonly number[])[] {
  return Object.freeze(denseCopyIndependent(matrix, field).map((row, index) =>
    numberVectorIndependent(row, `${field}[${index}]`)));
}

function denseCopyIndependent<T>(
  values: readonly T[],
  field = "array",
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
  const lengthDescriptor = Object.getOwnPropertyDescriptor(values, "length");
  if (
    lengthDescriptor === undefined
    || !("value" in lengthDescriptor)
    || lengthDescriptor.enumerable
    || lengthDescriptor.value !== values.length
  ) throw new Error(`${field}.length descriptor drifted`);
  return Object.freeze([...values]);
}

function numericRecordProjectionIndependent<K extends string>(
  record: Readonly<Record<K, number>>,
  keys: readonly K[],
): Readonly<Record<K, number>> {
  if (!exactPlainRecordKeys(record, keys)) {
    throw new Error("numeric record projection keys drifted");
  }
  return Object.freeze(Object.fromEntries(keys.map((key) => {
    const value = record[key];
    if (!Number.isFinite(value)) {
      throw new Error(`numeric record projection.${key} is non-finite`);
    }
    return [key, value];
  }))) as Readonly<Record<K, number>>;
}

function closedNullableIndependent<T>(value: T | null) {
  return value === null
    ? Object.freeze({ tag: "null" as const })
    : Object.freeze({ tag: "value" as const, value });
}

function closedNullableMappedIndependent<T, U>(
  value: T | null,
  project: (value: T) => U,
) {
  return value === null
    ? Object.freeze({ tag: "null" as const })
    : Object.freeze({ tag: "value" as const, value: project(value) });
}

function closedMissingIndependent() {
  return Object.freeze({ tag: "missing" as const });
}

function closedValueIndependent<T>(value: T) {
  return Object.freeze({ tag: "value" as const, value });
}

function closedOwnPropertyIndependent<T>(
  record: object,
  key: PropertyKey,
  project?: (value: unknown) => T,
) {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined) return closedMissingIndependent();
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
      ? closedTaggedDataIndependent(
        descriptor.value,
        String(key),
        new WeakSet<object>(),
      )
      : project(descriptor.value),
  });
}

function closedTaggedDataIndependent(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): unknown {
  if (value === undefined) return Object.freeze({ tag: "undefined" as const });
  if (value === null) return Object.freeze({ tag: "null" as const });
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} is non-finite`);
    return Object.freeze({ tag: "number" as const, value });
  }
  if (typeof value === "string") {
    return Object.freeze({ tag: "string" as const, value });
  }
  if (typeof value === "boolean") {
    return Object.freeze({ tag: "boolean" as const, value });
  }
  if (typeof value !== "object") {
    throw new Error(`${path} is not closed JSON-safe data`);
  }
  if (seen.has(value)) throw new Error(`${path} contains a repeated object`);
  seen.add(value);
  if (Array.isArray(value)) {
    const array = denseCopyIndependent(value, path);
    return Object.freeze({
      tag: "array" as const,
      values: Object.freeze(array.map((entry, index) =>
        closedTaggedDataIndependent(entry, `${path}[${index}]`, seen))),
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
    entries: Object.freeze((keys as string[]).map((childKey) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, childKey);
      if (
        descriptor === undefined
        || !("value" in descriptor)
        || !descriptor.enumerable
      ) throw new Error(`${path}.${childKey} must be an enumerable data property`);
      return Object.freeze({
        key: childKey,
        value: closedTaggedDataIndependent(
          descriptor.value,
          `${path}.${childKey}`,
          seen,
        ),
      });
    })),
  });
}

function assertIndependentRawEvidenceDataShape(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): void {
  if (value === null || value === undefined) return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} is non-finite`);
    return;
  }
  if (typeof value === "string" || typeof value === "boolean") return;
  if (typeof value !== "object") throw new Error(`${path} contains non-data`);
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    denseCopyIndependent(value, path);
    value.forEach((entry, index) =>
      assertIndependentRawEvidenceDataShape(entry, `${path}[${index}]`, seen));
    return;
  }
  if (
    Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null
  ) throw new Error(`${path} must be a plain object`);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${path} contains a symbol`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) throw new Error(`${path}.${key} must be an enumerable data property`);
    assertIndependentRawEvidenceDataShape(
      descriptor.value,
      `${path}.${key}`,
      seen,
    );
  }
}

function maximumFinite(values: readonly number[]): number {
  if (!denseFiniteVector(values, values.length) || values.length === 0) {
    throw new Error("maximumFinite requires a nonempty dense finite vector");
  }
  return Math.max(...values);
}

function minimumFinite(values: readonly number[]): number {
  if (!denseFiniteVector(values, values.length) || values.length === 0) {
    throw new Error("minimumFinite requires a nonempty dense finite vector");
  }
  return Math.min(...values);
}

function requireCanonicalAudit(
  audits: ReadonlyMap<string, PhaseB1EtaOneFiniteVolumeNodeAuditV1>,
  nodeId: string,
): PhaseB1EtaOneFiniteVolumeNodeAuditV1 {
  const audit = audits.get(nodeId);
  if (audit === undefined) throw new Error(`canonical node ${nodeId} absent`);
  return audit;
}

function firstContinuationLoadNode(
  continuation: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1 | undefined,
) {
  if (continuation === undefined) return null;
  return continuation.completed === true
    ? continuation.nodes[0] ?? null
    : continuation.acceptedNodes[0] ?? null;
}

function selectedContinuationEndpoint(
  edge: PhaseB1EtaOneFiniteVolumeDirectedEdgeAuditV1,
) {
  if (edge.selectedAttemptIndex === null) return null;
  const continuation = edge.attempts[edge.selectedAttemptIndex]?.continuation;
  return continuation?.completed === true ? continuation.endpoint : null;
}

function buildSGrid(
  factor: 2 | 4 | 8,
  direction: "forward" | "reverse",
): readonly number[] {
  return Object.freeze(Array.from({ length: factor + 1 }, (_, index) =>
    direction === "forward" ? index / factor : 1 - index / factor));
}

function interpolateVolumes(
  source: Readonly<Record<BloodCompartmentId, number>>,
  destination: Readonly<Record<BloodCompartmentId, number>>,
  s: number,
  direction: "forward" | "reverse",
  anchor: Readonly<Record<BloodCompartmentId, number>>,
): Readonly<Record<BloodCompartmentId, number>> {
  const lower = direction === "forward" ? source : destination;
  const upper = direction === "forward" ? destination : source;
  const lv = s === 0 ? lower.LV : s === 1 ? upper.LV
    : lower.LV + s * (upper.LV - lower.LV);
  const rv = s === 0 ? lower.RV : s === 1 ? upper.RV
    : lower.RV + s * (upper.RV - lower.RV);
  return Object.freeze({
    LA: anchor.LA,
    LV: lv,
    SA: anchor.SA,
    SV: anchor.SV - (rv - anchor.RV),
    RA: anchor.RA,
    RV: rv,
    PA: anchor.PA,
    PV: anchor.PV - (lv - anchor.LV),
  });
}

function totalBloodVolume(
  volumes: Readonly<Record<BloodCompartmentId, number>>,
): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartmentId) => sum + volumes[compartmentId],
    0,
  );
}

function wallRecord<T>(
  evaluate: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) =>
    [wallId, evaluate(wallId)]))) as Readonly<Record<FourChamberWallId, T>>;
}

function denseArray(values: readonly unknown[], expectedLength: number): boolean {
  if (!Array.isArray(values) || values.length !== expectedLength) return false;
  const keys = Reflect.ownKeys(values);
  const expected = [
    ...Array.from({ length: expectedLength }, (_, index) => String(index)),
    "length",
  ];
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
  ) return false;
  for (let index = 0; index < expectedLength; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(values, String(index));
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !descriptor.enumerable
    ) return false;
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(values, "length");
  return lengthDescriptor !== undefined
    && "value" in lengthDescriptor
    && !lengthDescriptor.enumerable
    && lengthDescriptor.value === expectedLength;
}

function denseMatrix(
  matrix: readonly (readonly number[])[],
  rows: number,
  columns: number,
): boolean {
  return denseArray(matrix, rows)
    && matrix.every((row) => denseArray(row, columns));
}

function denseFiniteVector(
  values: readonly number[],
  expectedLength: number,
): boolean {
  return denseArray(values, expectedLength)
    && values.every(Number.isFinite);
}

function exactPlainRecordKeys(
  value: object,
  expectedKeys: readonly string[],
): boolean {
  if (
    Array.isArray(value)
    || (
      Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null
    )
  ) return false;
  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== expectedKeys.length
    || keys.some((key, index) => key !== expectedKeys[index])
  ) return false;
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === "string"
      && descriptor !== undefined
      && "value" in descriptor
      && descriptor.enumerable;
  });
}

function exactNumberArray(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return denseArray(left, right.length)
    && denseArray(right, right.length)
    && left.every((value, index) => Object.is(value, right[index]));
}

function exactStringArray(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return denseArray(left, right.length)
    && denseArray(right, right.length)
    && left.every((value, index) => value === right[index]);
}

function sameStringSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && new Set(left).size === left.length
    && new Set(right).size === right.length
    && left.every((value) => right.includes(value));
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (
    !denseFiniteVector(left, scales.length)
    || !denseFiniteVector(right, scales.length)
    || !denseFiniteVector(scales, scales.length)
    || scales.some((scale) => scale <= 0)
  ) throw new Error("scaled distance received sparse/non-finite vectors");
  return Math.max(0, ...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function maximumAbsoluteDifference(
  left: readonly number[],
  right: readonly number[],
): number {
  if (
    !denseFiniteVector(left, right.length)
    || !denseFiniteVector(right, right.length)
  ) throw new Error("maximum difference received sparse/non-finite vectors");
  return Math.max(0, ...left.map((value, index) =>
    Math.abs(value - right[index])));
}

function vectorRoundoffEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return denseFiniteVector(left, right.length)
    && denseFiniteVector(right, right.length)
    && left.every((value, index) => roundoffEqual(value, right[index]));
}

function roundoffEqual(left: number, right: number): boolean {
  return Number.isFinite(left)
    && Number.isFinite(right)
    && (Object.is(left, right) || Math.abs(left - right)
      <= 128 * Number.EPSILON
        * Math.max(1, Math.abs(left), Math.abs(right)));
}

function landPopulationSimplexMargin(land: readonly number[]): number {
  if (!denseFiniteVector(land, 6)) return Number.NEGATIVE_INFINITY;
  const [ca, b, w, s] = land;
  return Math.min(ca, 1 - ca, b, w, s, 1 - b - w - s);
}

function requireFiniteNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`${label} is null or non-finite`);
  }
  return value;
}

function allNumericLeavesFinite(
  value: unknown,
  seen = new WeakSet<object>(),
): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value) && !denseArray(value, value.length)) return false;
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return false;
    if (!allNumericLeavesFinite(descriptor.value, seen)) return false;
  }
  return true;
}

function deepExactEqual(
  left: unknown,
  right: unknown,
  seen = new WeakMap<object, WeakSet<object>>(),
): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
    || Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)
  ) return false;
  let paired = seen.get(left);
  if (paired?.has(right)) return true;
  if (paired === undefined) {
    paired = new WeakSet<object>();
    seen.set(left, paired);
  }
  paired.add(right);
  const leftKeys = Reflect.ownKeys(left);
  const rightKeys = Reflect.ownKeys(right);
  if (
    leftKeys.length !== rightKeys.length
    || leftKeys.some((key, index) => key !== rightKeys[index])
  ) return false;
  for (const key of leftKeys) {
    const leftDescriptor = Object.getOwnPropertyDescriptor(left, key);
    const rightDescriptor = Object.getOwnPropertyDescriptor(right, key);
    if (
      leftDescriptor === undefined
      || rightDescriptor === undefined
      || !("value" in leftDescriptor)
      || !("value" in rightDescriptor)
      || leftDescriptor.enumerable !== rightDescriptor.enumerable
      || leftDescriptor.configurable !== rightDescriptor.configurable
      || leftDescriptor.writable !== rightDescriptor.writable
    ) return false;
    if (!deepExactEqual(leftDescriptor.value, rightDescriptor.value, seen)) {
      return false;
    }
  }
  return true;
}

function isDeepFrozen(
  value: unknown,
  seen = new WeakSet<object>(),
): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return false;
    if (!isDeepFrozen(descriptor.value, seen)) return false;
  }
  return true;
}

function verifyStrictComparatorBoundary(): void {
  const sparse = new Array(1);
  const explicitUndefined = [undefined];
  const missing = Object.freeze({ state: "missing" });
  const ownUndefined = Object.freeze({ state: "undefined" });
  const explicitNull = Object.freeze({ state: "null" });
  const value = Object.freeze({ state: "value", value: 0 });
  const hidden = Object.defineProperty({}, "x", {
    value: 1,
    enumerable: false,
  });
  const accessor = Object.defineProperty({}, "x", {
    get: () => 1,
    enumerable: true,
  });
  const symbol = Symbol("extra");
  const withSymbol = { [symbol]: 1 };
  const writable = Object.defineProperty({}, "x", {
    value: 1,
    enumerable: true,
    configurable: false,
    writable: true,
  });
  const nonwritable = Object.defineProperty({}, "x", {
    value: 1,
    enumerable: true,
    configurable: false,
    writable: false,
  });
  const configurable = Object.defineProperty({}, "x", {
    value: 1,
    enumerable: true,
    configurable: true,
    writable: false,
  });
  const nonconfigurable = Object.defineProperty({}, "x", {
    value: 1,
    enumerable: true,
    configurable: false,
    writable: false,
  });
  if (
    deepExactEqual(sparse, explicitUndefined)
    || deepExactEqual({}, { x: undefined })
    || deepExactEqual(missing, ownUndefined)
    || deepExactEqual(ownUndefined, explicitNull)
    || deepExactEqual(explicitNull, value)
    || deepExactEqual(hidden, {})
    || deepExactEqual(accessor, { x: 1 })
    || deepExactEqual(withSymbol, {})
    || deepExactEqual(writable, nonwritable)
    || deepExactEqual(configurable, nonconfigurable)
    || !deepExactEqual({ x: undefined }, { x: undefined })
    || !Object.is(-0, -0)
    || deepExactEqual(-0, 0)
  ) throw new Error(
    "strict comparator does not distinguish sparse/missing/undefined/null/value/descriptors/symbols/-0",
  );
}

function expectRejected(label: string, action: () => unknown): void {
  let rejected = false;
  try {
    action();
  } catch {
    rejected = true;
  }
  if (!rejected) failures.push(`${label} was not rejected`);
}

function expectDeepExact(label: string, actual: unknown, expected: unknown): void {
  if (!deepExactEqual(actual, expected)) failures.push(`${label} drifted`);
}

function expectEqual(label: string, actual: string, expected: string): void {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
