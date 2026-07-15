import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  runPhaseB1ProjectSyntheticColdInitializationV1,
  runPhaseB1ProjectSyntheticColdStructuredFailureProbeV1,
  type PhaseB1ColdHomotopyPathResultV1,
  type PhaseB1ProjectSyntheticColdInitializationResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  type PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationEvidenceManifestV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import { WALL_IDS } from
  "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_PROJECT_SYNTHETIC_COLD_NUMERICAL_EVIDENCE_V1_ID =
  "phase-b1-project-synthetic-cold-numerical-evidence-v1" as const;

type SuccessfulPathSummary = Readonly<{
  completed: true;
  requestedSubdivisionCount: number;
  requestedEtaValues: readonly number[];
  attemptedEtaValues: readonly number[];
  nodeCount: number;
  edgeCount: number;
  pathEntryCorrectionScaledInfinityNorm: number;
  recomputedPathEntryCorrectionScaledInfinityNorm: number;
  maximumAcceptedNodeStepScaledInfinityNorm: number;
  recomputedMaximumAcceptedNodeStepScaledInfinityNorm: number;
  maximumPredictorCorrectionScaledInfinityNorm: number;
  recomputedMaximumPredictorCorrectionScaledInfinityNorm: number;
  minimumLandSimplexMargin: number;
  maximumLocalMaterialResidualInfinityNorm: number;
  minimumEffectiveTriSegSigma: number;
  maximumEffectiveTriSegConditionNumber2: number;
  maximumSchurToReequilibratedDifferenceTwoNorm: number;
  minimumStaticRestoringMargin: number;
  everyNodeAccepted: boolean;
  traceAndMetricAuditPass: boolean;
  prohibitedOperationsAbsent: boolean;
  pass: boolean;
}>;

type FailedPathSummary = Readonly<{
  completed: false;
  requestedSubdivisionCount: number;
  requestedEtaValues: readonly number[];
  attemptedEtaValues: readonly number[];
  reason: string;
  message: string;
  acceptedNodeCount: number;
  prohibitedOperationsAbsent: boolean;
  pass: false;
}>;

type PathSummary = SuccessfulPathSummary | FailedPathSummary;

export type PhaseB1ProjectSyntheticColdNumericalEvidencePayloadV1 = Readonly<{
  evidenceId: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_NUMERICAL_EVIDENCE_V1_ID;
  manifestSha256: string;
  modes: Readonly<Record<PhaseB1SlsModeV1, Readonly<{
    slsMode: PhaseB1SlsModeV1;
    unknownCount: number;
    materialUnknownCount: number;
    forwardPaths: readonly PathSummary[];
    reversePath: PathSummary | null;
    maximumEndpointAgreementScaledInfinityNorm: number | null;
    reverseClosureScaledInfinityNorm: number | null;
    maximumCanonicalParityRelativeDifference: number | null;
    rootCensus: readonly Readonly<{
      eta: 0 | 1;
      seedCount: number;
      resultCount: number;
      convergedRootCount: number;
      allSeedsAttempted: boolean;
      allSeedsConverged: boolean;
      clusters: readonly Readonly<{
        representativeResultIndex: number;
        memberResultIndices: readonly number[];
        classification: string;
        coordinates: Readonly<{ V_m_S: number; y_m: number }>;
      }>[];
      censusBoundaryPass: boolean;
    }>[];
    structuredFailureProbes: readonly Readonly<{
      direction: "forward" | "reverse";
      injectedAttemptIndex: 0 | 1;
      attemptedEtaValues: readonly number[];
      acceptedNodeCount: number;
      failureReason: string;
      rollbackMatchesPathEntry: boolean;
      failedNodeRollbackMatchesEntryOrLastAccepted: boolean;
      prohibitedOperationsAbsent: boolean;
      pass: boolean;
    }>[];
    fixedInputAndClaimBoundaryPass: boolean;
    modePass: boolean;
  }>>>;
  allModesPass: boolean;
}>;

export type PhaseB1ProjectSyntheticColdNumericalEvidenceCertificateV1 =
  PhaseB1ProjectSyntheticColdNumericalEvidencePayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1 = Readonly<{
  certificate: PhaseB1ProjectSyntheticColdNumericalEvidenceCertificateV1;
  results: Readonly<Record<
    PhaseB1SlsModeV1,
    PhaseB1ProjectSyntheticColdInitializationResultV1
  >>;
}>;

const CANONICAL_COLD_NUMERICAL_EVIDENCE_BUNDLES_V1 = new WeakSet<object>();

export function buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
  manifest: PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
    manifest,
  );
  const results = Object.freeze({
    on: runPhaseB1ProjectSyntheticColdInitializationV1("on", sha256Hex),
    off: runPhaseB1ProjectSyntheticColdInitializationV1("off", sha256Hex),
  });
  const modes = Object.freeze({
    on: summarizeMode(results.on, sha256Hex),
    off: summarizeMode(results.off, sha256Hex),
  });
  const payload: PhaseB1ProjectSyntheticColdNumericalEvidencePayloadV1 =
    Object.freeze({
      evidenceId: PHASE_B1_PROJECT_SYNTHETIC_COLD_NUMERICAL_EVIDENCE_V1_ID,
      manifestSha256: manifest.contentSha256,
      modes,
      allModesPass: modes.on.modePass && modes.off.modePass,
    });
  const certificate = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  const bundle = Object.freeze({ certificate, results });
  CANONICAL_COLD_NUMERICAL_EVIDENCE_BUNDLES_V1.add(bundle);
  return bundle;
}

export function assertCanonicalPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
  bundle: PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1,
  manifest: PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
): PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1 {
  if (
    bundle === null
    || typeof bundle !== "object"
    || !CANONICAL_COLD_NUMERICAL_EVIDENCE_BUNDLES_V1.has(bundle)
    || bundle.certificate.manifestSha256 !== manifest.contentSha256
  ) throw new Error(
    "Phase B1 cold numerical evidence must be canonically built for this manifest",
  );
  return bundle;
}

export function phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1(
  certificate: PhaseB1ProjectSyntheticColdNumericalEvidenceCertificateV1,
): PhaseB1ProjectSyntheticColdNumericalEvidencePayloadV1 {
  return Object.freeze({
    evidenceId: certificate.evidenceId,
    manifestSha256: certificate.manifestSha256,
    modes: certificate.modes,
    allModesPass: certificate.allModesPass,
  });
}

function summarizeMode(
  result: PhaseB1ProjectSyntheticColdInitializationResultV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const anchorUnknowns = encodeEndpoint(result.anchorEndpoint);
  const forwardPaths = result.forwardPaths.map((path, index) => summarizePath(
    path,
    policy.subdivisionCounts[index],
    "forward",
    anchorUnknowns,
    result.layout.unknownScales,
  ));
  const canonicalEntry = result.canonicalForwardPath?.endpoint.unknowns ?? null;
  const reversePath = result.canonicalReversePath === null
    ? null
    : summarizePath(
      result.canonicalReversePath,
      policy.canonicalSubdivisionCount,
      "reverse",
      canonicalEntry,
      result.layout.unknownScales,
    );
  const rootCensus = result.rootCensus.map((census) => {
    const allSeedsAttempted = census.results.length === policy.enumerationSeeds.length
      && census.seeds.length === policy.enumerationSeeds.length
      && census.allSeedsAttempted;
    const convergedRootCount = census.results.filter(
      (entry) => entry.converged,
    ).length;
    const allSeedsConverged = convergedRootCount === policy.enumerationSeeds.length
      && census.allSeedsConverged;
    const clusters = census.clusters.map((cluster) => Object.freeze({
      representativeResultIndex: cluster.representativeResultIndex,
      memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
      classification: cluster.classification,
      coordinates: Object.freeze({ ...cluster.coordinates }),
    }));
    const censusBoundaryPass = census.enumerationCompleted
      && allSeedsAttempted
      && allSeedsConverged
      && census.convergedRootCount === convergedRootCount
      && clusters.length > 0
      && census.allDiscoveredRootsReported
      && !census.selectionInputToAcceptedPath
      && !census.globalExhaustivenessClaimed;
    return Object.freeze({
      eta: census.eta,
      seedCount: census.seeds.length,
      resultCount: census.results.length,
      convergedRootCount,
      allSeedsAttempted,
      allSeedsConverged,
      clusters: Object.freeze(clusters),
      censusBoundaryPass,
    });
  });
  const structuredFailureProbes = (["forward", "reverse"] as const).flatMap(
    (direction) => ([0, 1] as const).map((injectedAttemptIndex) =>
      summarizeFailureProbe(
        result.slsMode,
        direction,
        injectedAttemptIndex,
        sha256Hex,
      )),
  );
  const fixedInputAndClaimBoundaryPass =
    !result.fixedBloodVolumesChanged
    && !result.fixedFlowsChanged
    && !result.calciumWasNewtonUnknown
    && !result.warmStartImportedOrConsumed
    && !result.closedLoopStationarityClaimed
    && !result.continuousIntervalRegularityClaimed
    && !result.globalRootUniquenessClaimed
    && !result.energeticStabilityClaimed
    && !result.acceptedPhysiologicalColdInitializationPass
    && !result.acceptedPhaseB1ReferenceBranchPass
    && !result.supportedEnvelopePass
    && !result.physiologicalValidationPass
    && !result.releaseRuntimePass
    && !result.modelCoreIntegration
    && !result.browserRuntimeAdopted
    && !result.releaseRuntimeReachable;
  const modePass = result.projectSyntheticColdInitializationImplementationPass
    && result.layout.unknownCount === (result.slsMode === "on" ? 37 : 32)
    && forwardPaths.length === policy.subdivisionCounts.length
    && forwardPaths.every((path) => path.pass)
    && reversePath?.pass === true
    && result.maximumEndpointAgreementScaledInfinityNorm !== null
    && result.maximumEndpointAgreementScaledInfinityNorm
      <= policy.endpointAgreementScaledInfinityTolerance
    && result.reverseClosureScaledInfinityNorm !== null
    && result.reverseClosureScaledInfinityNorm
      <= policy.reverseClosureScaledInfinityTolerance
    && result.maximumCanonicalParityRelativeDifference !== null
    && result.maximumCanonicalParityRelativeDifference <= 1e-12
    && rootCensus.every((census) => census.censusBoundaryPass)
    && structuredFailureProbes.every((probe) => probe.pass)
    && fixedInputAndClaimBoundaryPass;
  return Object.freeze({
    slsMode: result.slsMode,
    unknownCount: result.layout.unknownCount,
    materialUnknownCount: result.layout.materialUnknownCount,
    forwardPaths: Object.freeze(forwardPaths),
    reversePath,
    maximumEndpointAgreementScaledInfinityNorm:
      result.maximumEndpointAgreementScaledInfinityNorm,
    reverseClosureScaledInfinityNorm: result.reverseClosureScaledInfinityNorm,
    maximumCanonicalParityRelativeDifference:
      result.maximumCanonicalParityRelativeDifference,
    rootCensus: Object.freeze(rootCensus),
    structuredFailureProbes: Object.freeze(structuredFailureProbes),
    fixedInputAndClaimBoundaryPass,
    modePass,
  });
}

function summarizePath(
  path: PhaseB1ColdHomotopyPathResultV1,
  expectedSubdivisionCount: number,
  direction: "forward" | "reverse",
  entryUnknowns: readonly number[] | null,
  scales: readonly number[],
): PathSummary {
  const prohibitedOperationsAbsent = !path.hiddenSubdivisionApplied
    && !path.pseudoArclengthApplied
    && !path.projectionApplied
    && !path.clippingApplied
    && !path.nearestRootSelectionApplied
    && !path.minimumResidualRootSelectionApplied
    && !path.maximumJunctionRadiusRootSelectionApplied;
  if (path.completed === false) return Object.freeze({
    completed: false,
    requestedSubdivisionCount: path.requestedSubdivisionCount,
    requestedEtaValues: path.requestedEtaValues,
    attemptedEtaValues: path.attemptedEtaValues,
    reason: path.failedNode.reason,
    message: path.failedNode.message,
    acceptedNodeCount: path.acceptedNodes.length,
    prohibitedOperationsAbsent,
    pass: false,
  });
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const expectedEtaValues = Array.from(
    { length: expectedSubdivisionCount + 1 },
    (_, index) => direction === "forward"
      ? index / expectedSubdivisionCount
      : 1 - index / expectedSubdivisionCount,
  );
  const recomputedPathEntryCorrectionScaledInfinityNorm = entryUnknowns === null
    ? Number.POSITIVE_INFINITY
    : scaledInfinityDistance(entryUnknowns, path.nodes[0].unknowns, scales);
  const recomputedSteps = path.nodes.slice(1).map((node, index) =>
    scaledInfinityDistance(path.nodes[index].unknowns, node.unknowns, scales));
  const recomputedCorrections = path.edgeAudits.map((edge) =>
    scaledInfinityDistance(edge.predictorUnknowns, edge.acceptedUnknowns, scales));
  const recomputedMaximumAcceptedNodeStepScaledInfinityNorm =
    recomputedSteps.length === 0 ? 0 : Math.max(...recomputedSteps);
  const recomputedMaximumPredictorCorrectionScaledInfinityNorm =
    recomputedCorrections.length === 0 ? 0 : Math.max(...recomputedCorrections);
  const everyNodeAccepted = path.nodes.every((node) =>
    node.effectiveTriSegAudit.accepted
    && node.minimumLandSimplexMargin > 0
    && node.maximumLocalMaterialResidualInfinityNorm
      <= policy.maximumLocalMaterialResidualInfinityNorm
    && node.scaledResidualInfinityNorm <= policy.maximumScaledColdResidualInfinityNorm
    && !node.projectionApplied
    && !node.clippingApplied
    && !node.fallbackApplied);
  const traceAndMetricAuditPass =
    path.requestedSubdivisionCount === expectedSubdivisionCount
    && vectorsRoundoffEqual(path.requestedEtaValues, expectedEtaValues)
    && vectorsRoundoffEqual(path.attemptedEtaValues, expectedEtaValues)
    && path.nodes.length === expectedEtaValues.length
    && path.edgeAudits.length === expectedSubdivisionCount
    && path.edgeAudits.every((edge, index) =>
      roundoffEqual(edge.fromEta, expectedEtaValues[index])
      && roundoffEqual(edge.toEta, expectedEtaValues[index + 1])
      && vectorsRoundoffEqual(edge.acceptedUnknowns, path.nodes[index + 1].unknowns)
      && roundoffEqual(
        edge.acceptedNodeStepScaledInfinityNorm,
        recomputedSteps[index],
      )
      && roundoffEqual(
        edge.predictorCorrectionScaledInfinityNorm,
        recomputedCorrections[index],
      ))
    && roundoffEqual(
      path.pathEntryCorrectionScaledInfinityNorm,
      recomputedPathEntryCorrectionScaledInfinityNorm,
    )
    && roundoffEqual(
      path.maximumAcceptedNodeStepScaledInfinityNorm,
      recomputedMaximumAcceptedNodeStepScaledInfinityNorm,
    )
    && roundoffEqual(
      path.maximumPredictorCorrectionScaledInfinityNorm,
      recomputedMaximumPredictorCorrectionScaledInfinityNorm,
    );
  const minimumLandSimplexMargin = Math.min(
    ...path.nodes.map((node) => node.minimumLandSimplexMargin),
  );
  const maximumLocalMaterialResidualInfinityNorm = Math.max(
    ...path.nodes.map((node) => node.maximumLocalMaterialResidualInfinityNorm),
  );
  const minimumEffectiveTriSegSigma = Math.min(
    ...path.nodes.map((node) => node.effectiveTriSegAudit.sigmaMinimum),
  );
  const maximumEffectiveTriSegConditionNumber2 = Math.max(
    ...path.nodes.map((node) => node.effectiveTriSegAudit.conditionNumber2),
  );
  const maximumSchurToReequilibratedDifferenceTwoNorm = Math.max(
    ...path.nodes.map((node) =>
      node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm),
  );
  const minimumStaticRestoringMargin = Math.min(
    ...path.nodes.map((node) => node.effectiveTriSegAudit.robustSignedMargin),
  );
  const pass = traceAndMetricAuditPass
    && everyNodeAccepted
    && prohibitedOperationsAbsent
    && path.branchIdentityEstablished
    && path.pathEntryCorrectionScaledInfinityNorm
      <= policy.maximumPathEntryCorrectionScaledInfinityNorm
    && path.maximumAcceptedNodeStepScaledInfinityNorm
      <= policy.maximumAcceptedNodeStepScaledInfinityNorm
    && path.maximumPredictorCorrectionScaledInfinityNorm
      <= policy.maximumPredictorCorrectionScaledInfinityNorm;
  return Object.freeze({
    completed: true,
    requestedSubdivisionCount: path.requestedSubdivisionCount,
    requestedEtaValues: path.requestedEtaValues,
    attemptedEtaValues: path.attemptedEtaValues,
    nodeCount: path.nodes.length,
    edgeCount: path.edgeAudits.length,
    pathEntryCorrectionScaledInfinityNorm: path.pathEntryCorrectionScaledInfinityNorm,
    recomputedPathEntryCorrectionScaledInfinityNorm,
    maximumAcceptedNodeStepScaledInfinityNorm:
      path.maximumAcceptedNodeStepScaledInfinityNorm,
    recomputedMaximumAcceptedNodeStepScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm:
      path.maximumPredictorCorrectionScaledInfinityNorm,
    recomputedMaximumPredictorCorrectionScaledInfinityNorm,
    minimumLandSimplexMargin,
    maximumLocalMaterialResidualInfinityNorm,
    minimumEffectiveTriSegSigma,
    maximumEffectiveTriSegConditionNumber2,
    maximumSchurToReequilibratedDifferenceTwoNorm,
    minimumStaticRestoringMargin,
    everyNodeAccepted,
    traceAndMetricAuditPass,
    prohibitedOperationsAbsent,
    pass,
  });
}

function summarizeFailureProbe(
  slsMode: PhaseB1SlsModeV1,
  direction: "forward" | "reverse",
  injectedAttemptIndex: 0 | 1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const probe = runPhaseB1ProjectSyntheticColdStructuredFailureProbeV1(
    slsMode,
    direction,
    sha256Hex,
    injectedAttemptIndex,
  );
  const path = probe.path;
  const requestedEtaValues = direction === "forward"
    ? Array.from(
      { length: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .canonicalSubdivisionCount + 1 },
      (_, index) => index
        / PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .canonicalSubdivisionCount,
    )
    : Array.from(
      { length: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .canonicalSubdivisionCount + 1 },
      (_, index) => 1 - index
        / PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .canonicalSubdivisionCount,
    );
  const expectedEtaValues = requestedEtaValues.slice(0, injectedAttemptIndex + 1);
  const rollbackMatchesPathEntry = canonicalizeJson(path.rollbackEndpoint)
    === canonicalizeJson(probe.pathEntryEndpoint);
  const expectedRollbackUnknowns = injectedAttemptIndex === 0
    ? probe.pathEntryUnknowns
    : path.acceptedNodes[injectedAttemptIndex - 1]?.unknowns ?? [];
  const expectedLastAcceptedUnknowns = injectedAttemptIndex === 0
    ? null
    : expectedRollbackUnknowns;
  const failedNodeRollbackMatchesEntryOrLastAccepted = vectorsRoundoffEqual(
    path.failedNode.rollbackUnknowns,
    expectedRollbackUnknowns,
  ) && (expectedLastAcceptedUnknowns === null
    ? path.failedNode.lastAcceptedUnknowns === null
    : path.failedNode.lastAcceptedUnknowns !== null
      && vectorsRoundoffEqual(
        path.failedNode.lastAcceptedUnknowns,
        expectedLastAcceptedUnknowns,
      ));
  const prohibitedOperationsAbsent = !path.hiddenSubdivisionApplied
    && !path.pseudoArclengthApplied
    && !path.projectionApplied
    && !path.clippingApplied
    && !path.nearestRootSelectionApplied
    && !path.minimumResidualRootSelectionApplied
    && !path.maximumJunctionRadiusRootSelectionApplied
    && !path.failedNode.projectionApplied
    && !path.failedNode.clippingApplied
    && !path.failedNode.fallbackApplied;
  const pass = probe.injectedAttemptIndex === injectedAttemptIndex
    && vectorsRoundoffEqual(path.attemptedEtaValues, expectedEtaValues)
    && path.acceptedNodes.length === injectedAttemptIndex
    && path.failedNode.reason === "final-audit-failed"
    && path.failedNode.message === "deterministic structured-failure rollback probe"
    && rollbackMatchesPathEntry
    && failedNodeRollbackMatchesEntryOrLastAccepted
    && prohibitedOperationsAbsent
    && !path.branchIdentityEstablished;
  return Object.freeze({
    direction,
    injectedAttemptIndex,
    attemptedEtaValues: path.attemptedEtaValues,
    acceptedNodeCount: path.acceptedNodes.length,
    failureReason: path.failedNode.reason,
    rollbackMatchesPathEntry,
    failedNodeRollbackMatchesEntryOrLastAccepted,
    prohibitedOperationsAbsent,
    pass,
  });
}

function encodeEndpoint(endpoint: PhaseB1EndpointStateV1): readonly number[] {
  const state = endpoint.differentialState;
  return Object.freeze([
    ...WALL_IDS.flatMap((wallId) => state.landByWall[wallId]),
    ...(state.slsMode === "on"
      ? WALL_IDS.map((wallId) =>
        state.slsAlphaVByWall[wallId])
      : []),
    endpoint.triSegCoordinates.V_m_S,
    endpoint.triSegCoordinates.y_m,
  ]);
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function vectorsRoundoffEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => roundoffEqual(value, right[index]));
}

function roundoffEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 4096 * Number.EPSILON * Math.max(
    1,
    Math.abs(left),
    Math.abs(right),
  );
}
