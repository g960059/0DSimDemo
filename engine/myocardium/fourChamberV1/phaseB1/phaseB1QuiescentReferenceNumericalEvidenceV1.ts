import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { PhaseB0SlsModeV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1,
  phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1";
import {
  buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphReadinessV1";
import {
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
  runPhaseB1QuiescentPressureReferenceInverseV1,
  type PhaseB1QuiescentPressureReferenceContinuationResultV1,
  type PhaseB1QuiescentPressureReferenceEdgeV1,
  type PhaseB1QuiescentPressureReferenceInverseResultV1,
  type PhaseB1QuiescentPressureReferenceNodeV1,
  type PhaseB1QuiescentPressureReferenceSchurAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  buildPhaseB1QuiescentReferenceEventFreeCaseV1,
  type PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  runPhaseB1QuiescentReferenceEventFreeIdentityHoldV1,
  type PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeIdentityHoldV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";

export const PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID =
  "phase-b1-project-synthetic-quiescent-reference-numerical-evidence-v1" as const;

const MODES = Object.freeze(["on", "off"] as const);
const CANONICAL_BUNDLES = new WeakSet<object>();

type ParentGraphReadinessV1 = ReturnType<
  typeof buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1
>;

export type PhaseB1QuiescentReferenceRawModeEvidenceV1 = Readonly<{
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1;
  eventFreeCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  identityHold: PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1;
}>;

export type PhaseB1QuiescentReferenceModeSummaryV1 =
  ReturnType<typeof summarizeMode>;

export type PhaseB1QuiescentReferenceNumericalEvidencePayloadV1 = Readonly<{
  evidenceId: typeof PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID;
  manifestSha256: string;
  manifestBindings:
    PhaseB1QuiescentReferenceEvidenceManifestV1["bindings"];
  directParentAuthentication: ReturnType<typeof parentAuthenticationRecord>;
  slsModes: typeof MODES;
  modes: Readonly<Record<
    PhaseB0SlsModeV1,
    PhaseB1QuiescentReferenceModeSummaryV1
  >>;
  narrowClaims: Readonly<{
    projectSyntheticQuiescentPressureReferenceInverse: boolean;
    instantaneousHydraulicQuiescence: boolean;
    projectSyntheticQuiescentReferenceEventFreeCase: boolean;
    projectSyntheticToleranceCertifiedIdentityHold: boolean;
  }>;
  broadClaims: ReturnType<typeof certificateBroadClaims>;
  allModesPass: boolean;
}>;

export type PhaseB1QuiescentReferenceNumericalEvidenceCertificateV1 =
  PhaseB1QuiescentReferenceNumericalEvidencePayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1 = Readonly<{
  certificate: PhaseB1QuiescentReferenceNumericalEvidenceCertificateV1;
  directParent: Readonly<{
    manifest: PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1;
    numericalEvidence:
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1;
    readiness: ParentGraphReadinessV1;
  }>;
  results: Readonly<Record<
    PhaseB0SlsModeV1,
    PhaseB1QuiescentReferenceRawModeEvidenceV1
  >>;
}>;

export function buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(manifest);
  if (typeof sha256Hex !== "function") {
    throw new Error("quiescent-reference numerical evidence requires sha256");
  }

  const parentManifest =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
      sha256Hex,
    );
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
    parentManifest,
  );
  const parentNumerical =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
      parentManifest,
      sha256Hex,
    );
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1(
    parentNumerical,
    parentManifest,
  );
  const parentReadiness =
    buildFourChamberPhaseB1EtaOneLandCoupledFiniteVolumeGraphStatusV1(
      parentManifest,
      parentNumerical,
    );
  authenticateDirectParent(
    manifest,
    parentManifest,
    parentNumerical,
    parentReadiness,
    sha256Hex,
  );
  const directParentAuthentication = parentAuthenticationRecord();

  const results = deepFreeze({
    on: buildRawMode(parentNumerical.results.on, sha256Hex),
    off: buildRawMode(parentNumerical.results.off, sha256Hex),
  });
  const modes = Object.freeze({
    on: summarizeMode(results.on),
    off: summarizeMode(results.off),
  });
  const narrowClaims = Object.freeze({
    projectSyntheticQuiescentPressureReferenceInverse:
      modes.on.narrowClaims.projectSyntheticQuiescentPressureReferenceInverse
      && modes.off.narrowClaims
        .projectSyntheticQuiescentPressureReferenceInverse,
    instantaneousHydraulicQuiescence:
      modes.on.narrowClaims.instantaneousHydraulicQuiescence
      && modes.off.narrowClaims.instantaneousHydraulicQuiescence,
    projectSyntheticQuiescentReferenceEventFreeCase:
      modes.on.narrowClaims.projectSyntheticQuiescentReferenceEventFreeCase
      && modes.off.narrowClaims
        .projectSyntheticQuiescentReferenceEventFreeCase,
    projectSyntheticToleranceCertifiedIdentityHold:
      modes.on.narrowClaims.projectSyntheticToleranceCertifiedIdentityHold
      && modes.off.narrowClaims
        .projectSyntheticToleranceCertifiedIdentityHold,
  });
  const broadClaims = certificateBroadClaims(manifest);
  const allModesPass = directParentAuthentication
      .allDirectParentArtifactsAuthenticated
    && Object.values(narrowClaims).every((value) => value === true)
    && Object.values(broadClaims).every((value) => value === false)
    && modes.on.modePass
    && modes.off.modePass;
  const payload: PhaseB1QuiescentReferenceNumericalEvidencePayloadV1 =
    Object.freeze({
      evidenceId: PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID,
      manifestSha256: manifest.contentSha256,
      manifestBindings: manifest.bindings,
      directParentAuthentication,
      slsModes: MODES,
      modes,
      narrowClaims,
      broadClaims,
      allModesPass,
    });
  canonicalizeJson(payload);
  const certificate = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  const bundle = deepFreeze({
    certificate,
    directParent: Object.freeze({
      manifest: parentManifest,
      numericalEvidence: parentNumerical,
      readiness: parentReadiness,
    }),
    results,
  });
  assertDeepFrozenPhaseB1QuiescentReferenceNumericalEvidenceV1(bundle);
  if (
    bundle.certificate.allModesPass !== true
    || Object.values(bundle.certificate.narrowClaims)
      .some((value) => value !== true)
    || Object.values(bundle.certificate.broadClaims)
      .some((value) => value !== false)
  ) throw new Error(
    "only passing quiescent-reference numerical evidence may be canonical",
  );
  CANONICAL_BUNDLES.add(bundle);
  return bundle;
}

export function assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
  bundle: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
): PhaseB1QuiescentReferenceNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(manifest);
  if (
    bundle === null
    || typeof bundle !== "object"
    || !CANONICAL_BUNDLES.has(bundle)
    || bundle.certificate.manifestSha256 !== manifest.contentSha256
    || bundle.certificate.allModesPass !== true
  ) throw new Error(
    "quiescent-reference numerical evidence must be canonically built for this manifest",
  );
  return assertDeepFrozenPhaseB1QuiescentReferenceNumericalEvidenceV1(bundle);
}

export function assertDeepFrozenPhaseB1QuiescentReferenceNumericalEvidenceV1(
  bundle: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
): PhaseB1QuiescentReferenceNumericalEvidenceBundleV1 {
  assertRecursivelyFrozen(
    bundle,
    "phaseB1QuiescentReferenceNumericalEvidenceBundle",
    new WeakSet<object>(),
  );
  canonicalizeJson(bundle.certificate);
  return bundle;
}

export function phaseB1QuiescentReferenceNumericalEvidenceHashPayloadV1(
  certificate: PhaseB1QuiescentReferenceNumericalEvidenceCertificateV1,
): PhaseB1QuiescentReferenceNumericalEvidencePayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = certificate;
  return Object.freeze(payload);
}

function buildRawMode(
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceRawModeEvidenceV1 {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(graph);
  const inverse = runPhaseB1QuiescentPressureReferenceInverseV1(
    graph,
    sha256Hex,
  );
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(inverse);
  const eventFreeCase = buildPhaseB1QuiescentReferenceEventFreeCaseV1(
    inverse,
    sha256Hex,
  );
  const identityHold =
    runPhaseB1QuiescentReferenceEventFreeIdentityHoldV1(eventFreeCase);
  if (
    !Object.is(inverse.sourceGraph, graph)
    || !Object.is(eventFreeCase.inverse, inverse)
    || !Object.is(identityHold.case, eventFreeCase)
    || inverse.projectSyntheticQuiescentReferenceInversePass !== true
    || eventFreeCase.projectSyntheticQuiescentReferenceEventFreeCasePass
      !== true
    || identityHold.projectSyntheticToleranceCertifiedIdentityHoldPass
      !== true
  ) throw new Error(
    `quiescent-reference raw evidence identity/pass failed for ${graph.slsMode}`,
  );
  return deepFreeze({ graph, inverse, eventFreeCase, identityHold });
}

function authenticateDirectParent(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  parentManifest:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
  parentNumerical:
    PhaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceBundleV1,
  parentReadiness: ParentGraphReadinessV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  const certificate = parentNumerical.certificate;
  const parentReadinessSha256 = computeCanonicalSha256(
    parentReadiness,
    sha256Hex,
  );
  const exactModeKeys = [
    certificate.slsModes,
    Reflect.ownKeys(certificate.modes),
    Reflect.ownKeys(parentNumerical.results),
  ].every((keys) => canonicalizeJson(keys) === canonicalizeJson(MODES));
  for (const mode of MODES) {
    assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(
      parentNumerical.results[mode],
    );
  }
  if (
    parentManifest.contentSha256
      !== PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1
    || parentManifest.contentSha256 !== computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestHashPayloadV1(
        parentManifest,
      ),
      sha256Hex,
    )
    || certificate.manifestSha256 !== parentManifest.contentSha256
    || certificate.contentSha256
      !== PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1
    || certificate.contentSha256 !== computeCanonicalSha256(
      phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceHashPayloadV1(
        certificate,
      ),
      sha256Hex,
    )
    || parentReadinessSha256
      !== PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1
    || manifest.lineage.directParentGraphManifestSha256
      !== parentManifest.contentSha256
    || manifest.lineage.directParentGraphNumericalEvidenceSha256
      !== certificate.contentSha256
    || manifest.lineage.directParentGraphReadinessSha256
      !== parentReadinessSha256
    || !certificate.allModesPass
    || !parentReadiness.phaseB1LandCoupledFiniteVolumeGraphPass
    || !parentReadiness.evidenceLayerDirectParentAuthenticationPass
    || !exactModeKeys
    || MODES.some((mode) =>
      parentNumerical.results[mode].slsMode !== mode
      || !parentNumerical.results[mode]
        .phaseB1LandCoupledFiniteVolumeGraphPass)
  ) throw new Error(
    "quiescent-reference direct finite-volume-graph parent authentication failed",
  );
}

function parentAuthenticationRecord() {
  return Object.freeze({
    finiteVolumeGraph: Object.freeze({
      manifestSha256:
        PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
      numericalEvidenceSha256:
        PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
      readinessSha256:
        PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
      manifestRebuiltCanonicalSelfHashedAndPinned: true as const,
      numericalBundleRebuiltCanonicalSelfHashedAndPinned: true as const,
      readinessRebuiltCanonicalHashedAndPinned: true as const,
      liveBrandedOnOffGraphResultsConsumed: true as const,
    }),
    exactSlsModeKeys: true as const,
    evidenceLayerDirectParentLineageAuthentication: true as const,
    pureCoreParentEvidenceAuthenticationClaimed: false as const,
    allDirectParentArtifactsAuthenticated: true as const,
  });
}

function summarizeMode(raw: PhaseB1QuiescentReferenceRawModeEvidenceV1) {
  const { graph, inverse, eventFreeCase, identityHold } = raw;
  const attempts = Object.freeze(inverse.attempts.map((attempt, index) =>
    continuationSummary(
      attempt,
      `forward-${attempt.refinementFactor}`,
      index === inverse.selectedAttemptIndex,
    )));
  const recomputedSelectedIndex = inverse.attempts.findIndex((attempt) =>
    attempt.completed
    && attempt.hardGatePass
    && attempt.fiftyPercentGuardPass);
  const closedRecomputedSelectedIndex = recomputedSelectedIndex < 0
    ? null
    : recomputedSelectedIndex;
  if (inverse.endpoint === null || inverse.factorEightReverse === null) {
    throw new Error(`passing inverse endpoint/reverse absent for ${raw.graph.slsMode}`);
  }
  const reverse = continuationSummary(
    inverse.factorEightReverse,
    "factor-eight-reverse",
    false,
  );
  const endpoint = nodeSummary(inverse.endpoint, "selected-endpoint", -1);
  const allNodes = Object.freeze([
    ...inverse.attempts.flatMap((attempt) => attempt.nodes),
    ...inverse.factorEightReverse.nodes,
  ]);
  const sourceIdentity = Object.freeze({
    graphId: graph.graphId,
    sourceGraphObjectIdentity: Object.is(inverse.sourceGraph, graph),
    sourceCanonicalNodeObjectIdentity:
      inverse.sourceCanonicalNodeObjectIdentity,
    sourceCanonicalNodeMatchesGraphCenter: graph.canonicalNodes.some((audit) =>
      audit.nodeId === "C"
      && Object.is(audit.node, inverse.sourceCanonicalNode)),
    anchorNewtonScaleRegistryContentSha256:
      inverse.anchorNewtonScaleRegistryContentSha256,
    anchorProvenance: Object.freeze({ ...inverse.anchorProvenance }),
    commonVascularTargetPressurePa: inverse.commonVascularTargetPressurePa,
    sourceChamberPressurePa: copyNumberRecord(
      inverse.sourceChamberPressurePa,
    ),
    audit: Object.freeze({ ...inverse.sourceIdentityAudit }),
    sourceSchurAuditObjectIdentity: Object.is(
      inverse.sourceSchurAudit,
      inverse.attempts[0].nodes[0]?.schurAudit,
    ),
    sourceSchurAudit: schurSummary(inverse.sourceSchurAudit),
  });
  const rawIdentity = Object.freeze({
    graphToInverseObjectIdentity: Object.is(inverse.sourceGraph, graph),
    inverseToEventFreeCaseObjectIdentity:
      Object.is(eventFreeCase.inverse, inverse),
    selectedEndpointToCaseObjectIdentity:
      Object.is(eventFreeCase.acceptedInverseEndpoint, inverse.endpoint),
    endpointStateToCaseObjectIdentity: Object.is(
      eventFreeCase.referenceEndpoint,
      inverse.endpoint.evaluation.endpoint,
    ),
    caseToIdentityHoldObjectIdentity:
      Object.is(identityHold.case, eventFreeCase),
    destinationRegistryModelObjectIdentity: Object.is(
      eventFreeCase.destinationRegistry,
      eventFreeCase.model.newtonScaleRegistry,
    ),
    allIdentityLinksExact: false as boolean,
  });
  const closedRawIdentity = Object.freeze({
    ...rawIdentity,
    allIdentityLinksExact: Object.entries(rawIdentity)
      .filter(([key]) => key !== "allIdentityLinksExact")
      .every(([, value]) => value === true),
  });
  const selection = Object.freeze({
    selectedAttemptIndex: inverse.selectedAttemptIndex,
    selectedRefinementFactor: inverse.selectedRefinementFactor,
    recomputedSelectedAttemptIndex: closedRecomputedSelectedIndex,
    exactTwoFourEightFactorInventory:
      inverse.attempts.map((attempt) => attempt.refinementFactor).join(",")
        === "2,4,8",
    everyAttemptStartsFromExactSourceIndependently:
      inverse.allAttemptsStartFromExactSourceIndependently,
    firstHardAndFiftyPercentGuardSelectionPass:
      inverse.firstHardAndFiftyPercentGuardSelectionPass,
    recomputedFirstSelectionExact:
      closedRecomputedSelectedIndex === inverse.selectedAttemptIndex
      && inverse.selectedRefinementFactor
        === (closedRecomputedSelectedIndex === null
          ? null
          : inverse.attempts[closedRecomputedSelectedIndex]
            .refinementFactor),
  });
  const endpointAgreementAndReverseClosure = Object.freeze({
    maximumForwardEndpointAgreementScaledInfinityNorm:
      inverse.maximumForwardEndpointAgreementScaledInfinityNorm,
    forwardEndpointAgreementPass: inverse.forwardEndpointAgreementPass,
    factorEightReverseClosureScaledInfinityNorm:
      inverse.factorEightReverseClosureScaledInfinityNorm,
    factorEightReverseClosurePass: inverse.factorEightReverseClosurePass,
  });
  const failureProbes = Object.freeze(inverse.failureProbes.map((probe) =>
    Object.freeze({
      injectedAttemptIndex: probe.injectedAttemptIndex,
      completed: probe.result.completed,
      reason: probe.result.reason,
      failedAttemptIndex: probe.result.failedAttemptIndex,
      requestedRhoValues: copyNumberArray(probe.result.requestedRhoValues),
      attemptedRhoValues: copyNumberArray(probe.result.attemptedRhoValues),
      acceptedNodeCount: probe.result.nodes.length,
      acceptedEdgeCount: probe.result.edges.length,
      rollbackNodeIsSourceObject: probe.rollbackNodeIsSourceObject,
      rollbackNodeIsAcceptedMidpointObject:
        probe.rollbackNodeIsAcceptedMidpointObject,
      rollbackUnknownsObjectIdentity: probe.rollbackUnknownsObjectIdentity,
      hardGatePass: probe.result.hardGatePass,
      fiftyPercentGuardPass: probe.result.fiftyPercentGuardPass,
      prohibitedOperations: continuationProhibitedOperations(probe.result),
      pass: probe.pass,
    })));
  const destination = destinationSummary(eventFreeCase, inverse);
  const hold = holdSummary(identityHold, eventFreeCase);
  const prohibitedOperations = modeProhibitedOperations(raw);
  const narrowClaims = Object.freeze({
    projectSyntheticQuiescentPressureReferenceInverse:
      inverse.projectSyntheticQuiescentReferenceInversePass,
    instantaneousHydraulicQuiescence:
      inverse.instantaneousHydraulicQuiescencePass,
    projectSyntheticQuiescentReferenceEventFreeCase:
      eventFreeCase.projectSyntheticQuiescentReferenceEventFreeCasePass,
    projectSyntheticToleranceCertifiedIdentityHold:
      identityHold.projectSyntheticToleranceCertifiedIdentityHoldPass,
  });
  const broadClaims = modeBroadClaims(raw);
  const continuationExtrema = continuationExtremaSummary(allNodes, inverse);
  const modePass = graph.phaseB1LandCoupledFiniteVolumeGraphPass
    && closedRawIdentity.allIdentityLinksExact
    && sourceIdentity.sourceGraphObjectIdentity
    && sourceIdentity.sourceCanonicalNodeObjectIdentity
    && sourceIdentity.sourceCanonicalNodeMatchesGraphCenter
    && sourceIdentity.sourceSchurAuditObjectIdentity
    && sourceIdentity.audit.pass
    && attempts.length === 3
    && attempts.every((attempt) => attempt.completed)
    && selection.exactTwoFourEightFactorInventory
    && selection.everyAttemptStartsFromExactSourceIndependently
    && selection.recomputedFirstSelectionExact
    && selection.firstHardAndFiftyPercentGuardSelectionPass
    && inverse.selectedAttemptIndex !== null
    && attempts[inverse.selectedAttemptIndex].hardGatePass
    && attempts[inverse.selectedAttemptIndex].fiftyPercentGuardPass
    && endpoint.hardGatePass
    && endpoint.allFlowsExactlyZero
    && reverse.completed
    && reverse.hardGatePass
    && reverse.fiftyPercentGuardPass
    && endpointAgreementAndReverseClosure.forwardEndpointAgreementPass
    && endpointAgreementAndReverseClosure.factorEightReverseClosurePass
    && failureProbes.length === 2
    && failureProbes.every((probe) => probe.pass)
    && continuationExtrema.everySchurEffectiveStepAndStencilGatePass
    && continuationExtrema.everySchurRankFour
    && continuationExtrema.everySchurIndependentAgreementPass
    && continuationExtrema.everySchurJacobiAuditConverged
    && continuationExtrema.everyColdRestoringAuditPass
    && destination.registryAudit.pass
    && destination.staticAudit.pass
    && hold.allDtGridStepsPass
    && Object.values(prohibitedOperations).every((value) => value === false)
    && Object.values(narrowClaims).every((value) => value === true)
    && Object.values(broadClaims).every((value) => value === false);
  return Object.freeze({
    slsMode: raw.graph.slsMode,
    rawIdentity: closedRawIdentity,
    sourceIdentity,
    attempts,
    selection,
    continuationExtrema,
    endpoint,
    endpointAgreementAndReverseClosure,
    factorEightReverse: reverse,
    failureProbes,
    destination,
    identityHold: hold,
    prohibitedOperations,
    narrowClaims,
    broadClaims,
    testOnly: true as const,
    modePass,
  });
}

function continuationSummary(
  continuation: PhaseB1QuiescentPressureReferenceContinuationResultV1,
  scope: string,
  selected: boolean,
) {
  const nodes = Object.freeze(continuation.nodes.map((node, index) =>
    nodeSummary(node, scope, index)));
  const edges = Object.freeze(continuation.edges.map(edgeSummary));
  return Object.freeze({
    scope,
    direction: continuation.direction,
    refinementFactor: continuation.refinementFactor,
    initialization: continuation.initialization,
    requestedRhoValues: copyNumberArray(continuation.requestedRhoValues),
    attemptedRhoValues: copyNumberArray(continuation.attemptedRhoValues),
    completed: continuation.completed,
    failureReason: continuation.completed === true
      ? null
      : continuation.reason,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    maximumAcceptedNodeStepScaledInfinityNorm: continuation.completed
      ? continuation.maximumAcceptedNodeStepScaledInfinityNorm
      : null,
    maximumPredictorCorrectionScaledInfinityNorm: continuation.completed
      ? continuation.maximumPredictorCorrectionScaledInfinityNorm
      : null,
    maximumAbsoluteFiberLogStrain: continuation.completed
      ? continuation.maximumAbsoluteFiberLogStrain
      : null,
    hardGatePass: continuation.hardGatePass,
    fiftyPercentGuardPass: continuation.fiftyPercentGuardPass,
    selected,
    prohibitedOperations: continuationProhibitedOperations(continuation),
    everyNodeHardGatePass: nodes.every((node) => node.hardGatePass),
    everyNodeSchurFullRankPass: nodes.every((node) =>
      node.schurAudit.fullRankPass),
    everyNodeEffectiveStepAndStencilGatePass: nodes.every((node) =>
      node.schurAudit.effectiveJacobianStencilGatePass),
    everyEdgePass: edges.every((edge) => edge.pass),
  });
}

function nodeSummary(
  node: PhaseB1QuiescentPressureReferenceNodeV1,
  scope: string,
  nodeIndex: number,
) {
  const vascularAbsolutePressurePa = Object.freeze(Object.fromEntries(
    Object.entries(node.evaluation.closedLoop.vascular).map(
      ([id, vascular]) => [id, vascular.absolutePressurePa],
    ),
  ));
  return Object.freeze({
    scope,
    nodeIndex,
    rho: node.rho,
    logReferenceMultipliers: copyNumberArray(node.logReferenceMultipliers),
    referenceConfiguration: copyReferenceConfiguration(
      node.referenceConfiguration,
    ),
    targetChamberPressurePa: copyNumberRecord(node.targetChamberPressurePa),
    actualChamberPressurePa: copyNumberRecord(
      node.evaluation.closedLoop.chamberAbsolutePressurePa,
    ),
    vascularAbsolutePressurePa,
    allFlowsM3PerSec: copyNumberRecord(
      node.evaluation.closedLoop.allFlowsM3PerSec,
    ),
    scaledResidualInfinityNorm: node.scaledResidualInfinityNorm,
    maximumAbsoluteChamberTargetPressureDifferencePa:
      node.maximumAbsoluteChamberTargetPressureDifferencePa,
    maximumAbsoluteInertialFlowAccelerationM3PerSec2:
      node.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    maximumAbsoluteFiberLogStrain: node.maximumAbsoluteFiberLogStrain,
    coldRestoringAudit: Object.freeze({
      sourceGraphNodeObjectReused:
        node.coldRestoringAudit.sourceGraphNodeObjectReused,
      converged: node.coldRestoringAudit.converged,
      coldUnknownsExact: node.coldRestoringAudit.coldUnknownsExact,
      minimumLandSimplexMargin:
        node.coldRestoringAudit.minimumLandSimplexMargin,
      maximumLocalMaterialResidualInfinityNorm:
        node.coldRestoringAudit.maximumLocalMaterialResidualInfinityNorm,
      effectiveTriSegAccepted:
        node.coldRestoringAudit.effectiveTriSegAccepted,
      withinPublishedTaylorTwoPercentTensionErrorDomain:
        node.coldRestoringAudit
          .withinPublishedTaylorTwoPercentTensionErrorDomain,
      pass: node.coldRestoringAudit.pass,
    }),
    schurAudit: schurSummary(node.schurAudit),
    allFlowsExactlyZero: node.allFlowsExactlyZero,
    strictFiberLogStrainDomainPass: node.strictFiberLogStrainDomainPass,
    hardGatePass: node.hardGatePass,
    fiftyPercentGuardPass: node.fiftyPercentGuardPass,
  });
}

function schurSummary(audit: PhaseB1QuiescentPressureReferenceSchurAuditV1) {
  return Object.freeze({
    pressureRows: Object.freeze([...audit.pressureRows]),
    logColumns: Object.freeze([...audit.logColumns]),
    coldBlockDimension: audit.coldBlockDimension,
    maximumPrimaryEffectiveScaledStep:
      audit.primaryScaledStepByColumn.length === 0
        ? null
        : Math.max(...audit.primaryScaledStepByColumn),
    independentConfiguredScaledStep: audit.independentScaledStep,
    primaryScaledStepByColumn:
      copyNumberArray(audit.primaryScaledStepByColumn),
    independentScaledStepByColumn:
      copyNumberArray(audit.independentScaledStepByColumn),
    primaryStencilByColumn: Object.freeze([
      ...audit.primaryStencilByColumn,
    ]),
    independentStencilByColumn: Object.freeze([
      ...audit.independentStencilByColumn,
    ]),
    everyCorrespondingEffectiveStepDiffers:
      audit.primaryScaledStepByColumn.every((value, index) =>
        !Object.is(value, audit.independentScaledStepByColumn[index])),
    everyIndependentEffectiveStepExceedsPrimary:
      audit.primaryScaledStepByColumn.every((value, index) =>
        audit.independentScaledStepByColumn[index] > value),
    effectiveJacobianStencilGatePass:
      audit.effectiveJacobianStencilGatePass,
    singularValuesDescending:
      copyNumberArray(audit.singularValuesDescending),
    independentSingularValuesDescending:
      copyNumberArray(audit.independentSingularValuesDescending),
    rank: audit.rank,
    independentRank: audit.independentRank,
    relativeMinimumSingularValue: audit.relativeMinimumSingularValue,
    independentRelativeMinimumSingularValue:
      audit.independentRelativeMinimumSingularValue,
    conditionNumber2: audit.conditionNumber2,
    independentConditionNumber2: audit.independentConditionNumber2,
    maximumCoarseFineScaledSchurAbsoluteDifference:
      audit.maximumIndependentScaledSchurAbsoluteDifference,
    maximumCoarseFineScaledSchurAbsoluteDifferenceGate:
      audit.maximumIndependentScaledSchurAbsoluteDifferenceGate,
    primaryColdBlockLuDiagnosticsByLog: Object.freeze(
      audit.coldBlockLuDiagnosticsByLog.map(copyLuDiagnostics),
    ),
    independentColdBlockLuDiagnosticsByLog: Object.freeze(
      audit.independentColdBlockLuDiagnosticsByLog.map(copyLuDiagnostics),
    ),
    minimumColdBlockRelativePivot: audit.minimumColdBlockRelativePivot,
    independentMinimumColdBlockRelativePivot:
      audit.independentMinimumColdBlockRelativePivot,
    minimumColdBlockRelativePivotGate:
      audit.minimumColdBlockRelativePivotGate,
    jacobiSvdAudit: Object.freeze({ ...audit.jacobiSvdAudit }),
    independentJacobiSvdAudit: Object.freeze({
      ...audit.independentJacobiSvdAudit,
    }),
    independentAgreementPass: audit.independentAgreementPass,
    minimumSingularValueGate: audit.minimumSingularValueGate,
    minimumRelativeSingularValueGate:
      audit.minimumRelativeSingularValueGate,
    maximumConditionNumber2Gate: audit.maximumConditionNumber2Gate,
    fullRankPass: audit.fullRankPass,
    fiftyPercentGuardPass: audit.fiftyPercentGuardPass,
  });
}

function edgeSummary(edge: PhaseB1QuiescentPressureReferenceEdgeV1) {
  return Object.freeze({
    edgeIndex: edge.edgeIndex,
    fromRho: edge.fromRho,
    toRho: edge.toRho,
    acceptedNodeStepScaledInfinityNorm:
      edge.acceptedNodeStepScaledInfinityNorm,
    predictorCorrectionScaledInfinityNorm:
      edge.predictorCorrectionScaledInfinityNorm,
    tangentAudit: Object.freeze({
      linearSolveDiagnostics: copyLuDiagnostics(
        edge.tangentAudit.linearSolveDiagnostics,
      ),
      linearResidualInfinityNorm:
        edge.tangentAudit.linearResidualInfinityNorm,
      pass: edge.tangentAudit.pass,
    }),
    correctorDiagnostics: Object.freeze({
      newtonIterationCount: edge.correctorDiagnostics.newtonIterationCount,
      acceptedStepCount: edge.correctorDiagnostics.acceptedStepCount,
      modelEvaluationCount: edge.correctorDiagnostics.modelEvaluationCount,
      totalBacktrackCount: edge.correctorDiagnostics.totalBacktrackCount,
      finalResidualInfinityNorm:
        edge.correctorDiagnostics.finalResidualInfinityNorm,
      finalUpdateInfinityNorm:
        edge.correctorDiagnostics.finalUpdateInfinityNorm,
    }),
    correctorBoundary: Object.freeze({ ...edge.correctorBoundary }),
    pass: edge.pass,
  });
}

function continuationExtremaSummary(
  nodes: readonly PhaseB1QuiescentPressureReferenceNodeV1[],
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1,
) {
  if (nodes.length === 0) {
    throw new Error("quiescent-reference continuation extrema require nodes");
  }
  const schurAudits = nodes.map((node) => node.schurAudit);
  const primarySteps = schurAudits.flatMap((audit) =>
    audit.primaryScaledStepByColumn);
  const independentSteps = schurAudits.flatMap((audit) =>
    audit.independentScaledStepByColumn);
  const coldLandMargins = nodes.flatMap((node) =>
    node.coldRestoringAudit.minimumLandSimplexMargin === null
      ? []
      : [node.coldRestoringAudit.minimumLandSimplexMargin]);
  const coldMaterialResiduals = nodes.flatMap((node) =>
    node.coldRestoringAudit.maximumLocalMaterialResidualInfinityNorm === null
      ? []
      : [node.coldRestoringAudit.maximumLocalMaterialResidualInfinityNorm]);
  const byRefinementFactor = Object.freeze(inverse.attempts.map((attempt) => {
    const attemptNodes = attempt.nodes;
    const attemptEdges = attempt.edges;
    return Object.freeze({
      refinementFactor: attempt.refinementFactor,
      completed: attempt.completed,
      nodeCount: attemptNodes.length,
      edgeCount: attemptEdges.length,
      minimumScaledResidualInfinityNorm: finiteMinimum(
        attemptNodes.map((node) => node.scaledResidualInfinityNorm),
      ),
      maximumScaledResidualInfinityNorm: finiteMaximum(
        attemptNodes.map((node) => node.scaledResidualInfinityNorm),
      ),
      maximumAcceptedNodeStepScaledInfinityNorm: attempt.completed
        ? attempt.maximumAcceptedNodeStepScaledInfinityNorm
        : null,
      maximumPredictorCorrectionScaledInfinityNorm: attempt.completed
        ? attempt.maximumPredictorCorrectionScaledInfinityNorm
        : null,
      maximumAbsoluteFiberLogStrain: attempt.completed
        ? attempt.maximumAbsoluteFiberLogStrain
        : null,
      minimumColdRestoringLandSimplexMargin: finiteMinimum(
        attemptNodes.flatMap((node) =>
          node.coldRestoringAudit.minimumLandSimplexMargin === null
            ? []
            : [node.coldRestoringAudit.minimumLandSimplexMargin]),
      ),
      minimumPrimarySchurSigma: finiteMinimum(attemptNodes.map((node) =>
        node.schurAudit.singularValuesDescending[3])),
      minimumIndependentSchurSigma: finiteMinimum(attemptNodes.map((node) =>
        node.schurAudit.independentSingularValuesDescending[3])),
      maximumPrimarySchurConditionNumber2: finiteMaximum(attemptNodes.map(
        (node) => node.schurAudit.conditionNumber2,
      )),
      maximumIndependentSchurConditionNumber2: finiteMaximum(attemptNodes.map(
        (node) => node.schurAudit.independentConditionNumber2,
      )),
      hardGatePass: attempt.hardGatePass,
      fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
    });
  }));
  return Object.freeze({
    recordedNodeCountIncludingIndependentAttemptSourcesAndReverse:
      nodes.length,
    byRefinementFactor,
    minimumScaledResidualInfinityNorm: finiteMinimum(
      nodes.map((node) => node.scaledResidualInfinityNorm),
    ),
    maximumScaledResidualInfinityNorm: finiteMaximum(
      nodes.map((node) => node.scaledResidualInfinityNorm),
    ),
    maximumAbsoluteChamberTargetPressureDifferencePa: finiteMaximum(
      nodes.map((node) =>
        node.maximumAbsoluteChamberTargetPressureDifferencePa),
    ),
    maximumAbsoluteInertialFlowAccelerationM3PerSec2: finiteMaximum(
      nodes.map((node) =>
        node.maximumAbsoluteInertialFlowAccelerationM3PerSec2),
    ),
    maximumAbsoluteFiberLogStrain: finiteMaximum(
      nodes.map((node) => node.maximumAbsoluteFiberLogStrain),
    ),
    minimumColdRestoringLandSimplexMargin:
      finiteMinimum(coldLandMargins),
    maximumColdRestoringLocalMaterialResidualInfinityNorm:
      finiteMaximum(coldMaterialResiduals),
    minimumPrimaryEffectiveScaledStep: finiteMinimum(primarySteps),
    maximumPrimaryEffectiveScaledStep: finiteMaximum(primarySteps),
    minimumIndependentEffectiveScaledStep:
      finiteMinimum(independentSteps),
    maximumIndependentEffectiveScaledStep:
      finiteMaximum(independentSteps),
    minimumPrimarySchurSigma: finiteMinimum(schurAudits.map((audit) =>
      audit.singularValuesDescending[3])),
    minimumIndependentSchurSigma: finiteMinimum(schurAudits.map((audit) =>
      audit.independentSingularValuesDescending[3])),
    minimumPrimaryRelativeSchurSigma: finiteMinimum(schurAudits.map((audit) =>
      audit.relativeMinimumSingularValue)),
    minimumIndependentRelativeSchurSigma: finiteMinimum(schurAudits.map(
      (audit) => audit.independentRelativeMinimumSingularValue,
    )),
    maximumPrimarySchurConditionNumber2: finiteMaximum(schurAudits.map(
      (audit) => audit.conditionNumber2,
    )),
    maximumIndependentSchurConditionNumber2: finiteMaximum(schurAudits.map(
      (audit) => audit.independentConditionNumber2,
    )),
    minimumPrimaryColdBlockRelativePivot: finiteMinimum(schurAudits.map(
      (audit) => audit.minimumColdBlockRelativePivot,
    )),
    minimumIndependentColdBlockRelativePivot: finiteMinimum(schurAudits.map(
      (audit) => audit.independentMinimumColdBlockRelativePivot,
    )),
    maximumCoarseFineScaledSchurAbsoluteDifference: finiteMaximum(
      schurAudits.map((audit) =>
        audit.maximumIndependentScaledSchurAbsoluteDifference),
    ),
    maximumPrimaryJacobiFinalOffDiagonal: finiteMaximum(schurAudits.map(
      (audit) => audit.jacobiSvdAudit.finalMaximumOffDiagonal,
    )),
    maximumIndependentJacobiFinalOffDiagonal: finiteMaximum(schurAudits.map(
      (audit) => audit.independentJacobiSvdAudit.finalMaximumOffDiagonal,
    )),
    maximumPrimaryJacobiSweeps: finiteMaximum(schurAudits.map(
      (audit) => audit.jacobiSvdAudit.sweeps,
    )),
    maximumIndependentJacobiSweeps: finiteMaximum(schurAudits.map(
      (audit) => audit.independentJacobiSvdAudit.sweeps,
    )),
    everySchurRankFour: schurAudits.every((audit) =>
      audit.rank === 4 && audit.independentRank === 4),
    everySchurEffectiveStepAndStencilGatePass: schurAudits.every((audit) =>
      audit.effectiveJacobianStencilGatePass),
    everySchurIndependentAgreementPass: schurAudits.every((audit) =>
      audit.independentAgreementPass),
    everySchurJacobiAuditConverged: schurAudits.every((audit) =>
      audit.jacobiSvdAudit.converged
      && audit.independentJacobiSvdAudit.converged),
    everyColdRestoringAuditPass: nodes.every((node) =>
      node.coldRestoringAudit.pass),
  });
}

function destinationSummary(
  candidate: PhaseB1QuiescentReferenceEventFreeCaseV1,
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1,
) {
  const registry = candidate.destinationRegistry;
  return Object.freeze({
    caseId: candidate.caseId,
    inverseObjectIdentity: Object.is(candidate.inverse, inverse),
    acceptedInverseEndpointObjectIdentity:
      Object.is(candidate.acceptedInverseEndpoint, inverse.endpoint),
    referenceEndpointObjectIdentity: inverse.endpoint !== null && Object.is(
      candidate.referenceEndpoint,
      inverse.endpoint.evaluation.endpoint,
    ),
    destinationRegistryModelObjectIdentity: Object.is(
      registry,
      candidate.model.newtonScaleRegistry,
    ),
    wallMaterialBindingSha256: candidate.wallMaterialBinding.contentSha256,
    inverseAnchorRegistryContentSha256:
      inverse.anchorNewtonScaleRegistryContentSha256,
    destinationRegistryContentSha256: registry.registryContentSha256,
    destinationRegistryDiagnosticHash: registry.registryDiagnosticHash,
    destinationRegistryFixedBeforeRun: registry.fixedBeforeRun,
    destinationRegistryAdaptiveRescaling: registry.adaptiveRescaling,
    destinationRegistryTolerances: Object.freeze({
      ...registry.tolerances,
    }),
    registryAudit: Object.freeze({ ...candidate.registryAudit }),
    staticAudit: Object.freeze({ ...candidate.staticAudit }),
    destinationChamberPressurePa: copyNumberRecord(
      candidate.destinationEvaluation.closedLoop.chamberAbsolutePressurePa,
    ),
    destinationAllFlowsM3PerSec: copyNumberRecord(
      candidate.destinationEvaluation.closedLoop.allFlowsM3PerSec,
    ),
    projectSyntheticQuiescentReferenceEventFreeCasePass:
      candidate.projectSyntheticQuiescentReferenceEventFreeCasePass,
  });
}

function holdSummary(
  hold: PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1,
  candidate: PhaseB1QuiescentReferenceEventFreeCaseV1,
) {
  const steps = Object.freeze(hold.stepAudits.map((audit) => {
    if (!audit.converged || !audit.result.converged) {
      throw new Error(
        `passing identity-hold evidence contains failed dt ${audit.dtSec}`,
      );
    }
    const result = audit.result;
    return Object.freeze({
      dtSec: audit.dtSec,
      converged: audit.converged,
      previousEndpointObjectIdentity: Object.is(
        result.previousEndpoint,
        candidate.referenceEndpoint,
      ),
      previousEndpointReplaysReferenceTimeExact:
        audit.previousEndpointReplaysReferenceTimeExact,
      previousEndpointNonTimeStateExact:
        audit.previousEndpointNonTimeStateExact,
      nextTimeAdvanceExact: audit.nextTimeAdvanceExact,
      nextNewtonTopologyExact: audit.nextNewtonTopologyExact,
      nextCalciumStateExact: audit.nextCalciumStateExact,
      allCalciumScalarsExactlyZero: audit.allCalciumScalarsExactlyZero,
      comparedNewtonScalarCount: audit.comparedNewtonScalarCount,
      comparedCalciumScalarCount: audit.comparedCalciumScalarCount,
      newtonIterationCount: result.newtonDiagnostics.newtonIterationCount,
      acceptedNewtonStepCount: result.newtonDiagnostics.acceptedStepCount,
      acceptedNewtonStepCountExactZero:
        audit.acceptedNewtonStepCountExactZero,
      finalScaledResidualInfinityNorm:
        audit.finalScaledResidualInfinityNorm,
      finalScaledUpdateInfinityNorm: audit.finalScaledUpdateInfinityNorm,
      scaledResidualGatePass: audit.scaledResidualGatePass,
      scaledUpdateGatePass: audit.scaledUpdateGatePass,
      allClosedLoopFlowsExactlyZero:
        audit.allClosedLoopFlowsExactlyZero,
      maximumAbsoluteVolumeResidualM3PerSec:
        audit.maximumAbsoluteVolumeResidualM3PerSec,
      totalBloodVolumeChangeM3: audit.totalBloodVolumeChangeM3,
      exactVolumeIdentityPass: audit.exactVolumeIdentityPass,
      maximumAbsoluteChamberTargetPressureDifferencePa:
        audit.maximumAbsoluteChamberTargetPressureDifferencePa,
      chamberPressureGatePass: audit.chamberPressureGatePass,
      maximumAbsoluteInertialFlowAccelerationM3PerSec2:
        audit.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
      inertialFlowAccelerationGatePass:
        audit.inertialFlowAccelerationGatePass,
      destinationRegistryObjectIdentityAtInvocation:
        audit.destinationRegistryObjectIdentityAtInvocation,
      eventFree: audit.eventFree,
      noProjectionClippingClampOrFallback:
        audit.noProjectionClippingClampOrFallback,
      slsTopologyPreserved: audit.slsTopologyPreserved,
      pass: audit.pass,
    });
  }));
  return Object.freeze({
    holdId: hold.holdId,
    caseObjectIdentity: Object.is(hold.case, candidate),
    dtGridSec: copyNumberArray(hold.dtGridSec),
    exactDtGrid: hold.dtGridSec.join(",") === "0.000125,0.00025,0.0005",
    steps,
    everyStepStartedFromSameReferenceEndpointIndependently:
      hold.everyStepStartedFromSameReferenceEndpointIndependently,
    destinationRegistryObjectReusedAcrossAllSteps:
      hold.destinationRegistryObjectReusedAcrossAllSteps,
    destinationRegistryRecompiledDuringHold:
      hold.destinationRegistryRecompiledDuringHold,
    adaptiveRescalingApplied: hold.adaptiveRescalingApplied,
    allDtGridStepsPass: hold.allDtGridStepsPass,
    projectSyntheticToleranceCertifiedIdentityHoldPass:
      hold.projectSyntheticToleranceCertifiedIdentityHoldPass,
  });
}

function continuationProhibitedOperations(
  continuation: PhaseB1QuiescentPressureReferenceContinuationResultV1,
) {
  return Object.freeze({
    hiddenSubdivisionApplied: continuation.hiddenSubdivisionApplied,
    pseudoArclengthApplied: continuation.pseudoArclengthApplied,
    regularizationApplied: continuation.regularizationApplied,
    priorApplied: continuation.priorApplied,
    projectionApplied: continuation.projectionApplied,
    clippingApplied: continuation.clippingApplied,
    rootRankingApplied: continuation.rootRankingApplied,
  });
}

function modeProhibitedOperations(
  raw: PhaseB1QuiescentReferenceRawModeEvidenceV1,
) {
  const continuations = [
    ...raw.inverse.attempts,
    ...(raw.inverse.factorEightReverse === null
      ? []
      : [raw.inverse.factorEightReverse]),
    ...raw.inverse.failureProbes.map((probe) => probe.result),
  ];
  return Object.freeze({
    regularizationApplied: continuations.some((value) =>
      value.regularizationApplied),
    priorApplied: continuations.some((value) => value.priorApplied),
    projectionApplied: continuations.some((value) => value.projectionApplied),
    clippingApplied: continuations.some((value) => value.clippingApplied),
    hiddenSubdivisionApplied: continuations.some((value) =>
      value.hiddenSubdivisionApplied),
    pseudoArclengthApplied: continuations.some((value) =>
      value.pseudoArclengthApplied),
    rootRankingApplied: continuations.some((value) =>
      value.rootRankingApplied),
    nestedFiniteDifferenceApplied:
      raw.inverse.correctorBoundary.nestedFiniteDifferenceApplied,
    fallbackReseedApplied:
      raw.inverse.correctorBoundary.fallbackReseedApplied,
    inverseAnchorRegistryValuesReverseEngineered:
      raw.eventFreeCase.registryAudit.anchorRegistryValuesReverseEngineered,
    destinationRegistryAdaptiveRescalingApplied:
      raw.eventFreeCase.registryAudit.adaptiveRescalingApplied,
    holdAdaptiveRescalingApplied: raw.identityHold.adaptiveRescalingApplied,
    eventSchedulerIntegrated:
      !raw.identityHold.stepAudits.every((audit) => audit.eventFree),
  });
}

function modeBroadClaims(raw: PhaseB1QuiescentReferenceRawModeEvidenceV1) {
  return Object.freeze({
    inverseEventFreeBackwardEulerIdentityHoldPass:
      raw.inverse.eventFreeBackwardEulerIdentityHoldPass,
    inverseClosedLoopStationarityPass:
      raw.inverse.closedLoopStationarityPass,
    inverseBiologicalPathClaimed: raw.inverse.biologicalPathClaimed,
    inversePhysiologicalReferenceAcceptancePass:
      raw.inverse.physiologicalReferenceAcceptancePass,
    inverseSupportedReferenceEnvelopePass:
      raw.inverse.supportedReferenceEnvelopePass,
    inverseFullBeatAcceptancePass: raw.inverse.fullBeatAcceptancePass,
    inversePhysiologicalValidationPass:
      raw.inverse.physiologicalValidationPass,
    inversePhaseB1AcceptancePass: raw.inverse.phaseB1AcceptancePass,
    inversePureCoreParentEvidenceAuthenticationClaimed:
      raw.inverse.pureCoreParentEvidenceAuthenticationClaimed,
    inverseModelCoreIntegration: raw.inverse.modelCoreIntegration,
    inverseBrowserRuntimeAdopted: raw.inverse.browserRuntimeAdopted,
    inverseReleaseRuntimeReachable: raw.inverse.releaseRuntimeReachable,
    eventFreeCaseClosedLoopStationarityPass:
      raw.eventFreeCase.closedLoopStationarityPass,
    eventFreeCasePhysiologicalReferenceAcceptancePass:
      raw.eventFreeCase.physiologicalReferenceAcceptancePass,
    eventFreeCaseSupportedReferenceEnvelopePass:
      raw.eventFreeCase.supportedReferenceEnvelopePass,
    eventFreeCaseFullBeatAcceptancePass:
      raw.eventFreeCase.fullBeatAcceptancePass,
    eventFreeCasePhysiologicalValidationPass:
      raw.eventFreeCase.physiologicalValidationPass,
    eventFreeCasePhaseB1AcceptancePass:
      raw.eventFreeCase.phaseB1AcceptancePass,
    eventFreeCaseModelCoreIntegration:
      raw.eventFreeCase.modelCoreIntegration,
    eventFreeCaseBrowserRuntimeAdopted:
      raw.eventFreeCase.browserRuntimeAdopted,
    eventFreeCaseReleaseRuntimeReachable:
      raw.eventFreeCase.releaseRuntimeReachable,
    identityHoldAnalyticalExactEquilibriumClaimed:
      raw.identityHold.analyticalExactEquilibriumClaimed,
    identityHoldClosedLoopStationarityPass:
      raw.identityHold.closedLoopStationarityPass,
    identityHoldPhysiologicalReferenceAcceptancePass:
      raw.identityHold.physiologicalReferenceAcceptancePass,
    identityHoldSupportedReferenceEnvelopePass:
      raw.identityHold.supportedReferenceEnvelopePass,
    identityHoldFullBeatAcceptancePass:
      raw.identityHold.fullBeatAcceptancePass,
    identityHoldEventIntegratedAcceptancePass:
      raw.identityHold.eventIntegratedAcceptancePass,
    identityHoldPhysiologicalValidationPass:
      raw.identityHold.physiologicalValidationPass,
    identityHoldPhaseB1AcceptancePass:
      raw.identityHold.phaseB1AcceptancePass,
    identityHoldModelCoreIntegration: raw.identityHold.modelCoreIntegration,
    identityHoldBrowserRuntimeAdopted:
      raw.identityHold.browserRuntimeAdopted,
    identityHoldReleaseRuntimeReachable:
      raw.identityHold.releaseRuntimeReachable,
  });
}

function certificateBroadClaims(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
) {
  const boundary = manifest.claimBoundary;
  return Object.freeze({
    biologicalPressurePath: boundary.biologicalPressurePath,
    acceptedPhaseB1ReferenceBranch: boundary.acceptedPhaseB1ReferenceBranch,
    physiologicalReferenceAcceptance:
      boundary.physiologicalReferenceAcceptance,
    supportedReferenceEnvelope: boundary.supportedReferenceEnvelope,
    continuousReferenceCoordinateRegularity:
      boundary.continuousReferenceCoordinateRegularity,
    continuousPressurePathRegularity:
      boundary.continuousPressurePathRegularity,
    closedLoopAnalyticalStationarity:
      boundary.closedLoopAnalyticalStationarity,
    globalRootUniqueness: boundary.globalRootUniqueness,
    globalRootExhaustiveness: boundary.globalRootExhaustiveness,
    energeticStability: boundary.energeticStability,
    fullBeatAcceptance: boundary.fullBeatAcceptance,
    eventIntegratedAcceptance: boundary.eventIntegratedAcceptance,
    physiologicalValidation: boundary.physiologicalValidation,
    phaseB1Acceptance: boundary.phaseB1Acceptance,
    pureCoreParentEvidenceAuthenticationClaimed:
      boundary.pureCoreParentEvidenceAuthenticationClaimed,
    modelCoreIntegration: boundary.modelCoreIntegration,
    browserRuntimeAdoption: boundary.browserRuntimeAdoption,
    releaseRuntimeReachability: boundary.releaseRuntimeReachability,
  });
}

type LuDiagnosticsV1 =
  PhaseB1QuiescentPressureReferenceSchurAuditV1[
    "coldBlockLuDiagnosticsByLog"
  ][number];

function copyLuDiagnostics(diagnostics: LuDiagnosticsV1) {
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

function copyReferenceConfiguration(
  configuration:
    PhaseB1QuiescentPressureReferenceNodeV1["referenceConfiguration"],
) {
  return Object.freeze({
    atrialReferenceCavityVolumeM3ByChamber: Object.freeze({
      ...configuration.atrialReferenceCavityVolumeM3ByChamber,
    }),
    triSegReferenceMidwallAreaM2ByWall: Object.freeze({
      ...configuration.triSegReferenceMidwallAreaM2ByWall,
    }),
  });
}

function copyNumberArray(values: readonly number[]): readonly number[] {
  return Object.freeze([...values]);
}

function copyNumberRecord<Key extends string>(
  values: Readonly<Record<Key, number>>,
): Readonly<Record<Key, number>> {
  return Object.freeze({ ...values });
}

function finiteMinimum(values: readonly number[]): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("finite minimum requires one or more finite values");
  }
  return Math.min(...values);
}

function finiteMaximum(values: readonly number[]): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("finite maximum requires one or more finite values");
  }
  return Math.max(...values);
}

function deepFreeze<T>(value: T, visited = new WeakSet<object>()): T {
  if (
    value === null
    || (typeof value !== "object" && typeof value !== "function")
  ) return value;
  const objectValue = value as object;
  if (visited.has(objectValue)) return value;
  visited.add(objectValue);
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreeze(descriptor.value, visited);
    }
  }
  return Object.freeze(value);
}

function assertRecursivelyFrozen(
  value: unknown,
  path: string,
  visited: WeakSet<object>,
): void {
  if (
    value === null
    || (typeof value !== "object" && typeof value !== "function")
  ) return;
  const objectValue = value as object;
  if (visited.has(objectValue)) return;
  visited.add(objectValue);
  if (!Object.isFrozen(objectValue)) {
    throw new Error(`${path} must be recursively frozen`);
  }
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && "value" in descriptor) {
      assertRecursivelyFrozen(
        descriptor.value,
        `${path}.${String(key)}`,
        visited,
      );
    }
  }
}
