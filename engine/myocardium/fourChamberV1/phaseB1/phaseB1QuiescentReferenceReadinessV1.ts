import { canonicalizeJson } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID,
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_STATUS_V1 =
  "project-synthetic-phase-b1-quiescent-reference-evidence-complete-with-physiological-reference-stationarity-and-runtime-acceptance-deferred" as const;

export const FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_BLOCKERS_V1 =
  Object.freeze([
    "Do not promote a four-coordinate project-synthetic pressure inverse or its independently restarted finite rho paths to a biological loading path, accepted reference branch, continuous reference-coordinate envelope, or global-root certificate",
    "Do not promote a tolerance-certified event-free backward-Euler identity hold to analytical closed-loop stationarity; establish independent analytical, event-integrated, energetic, timestep-convergence, and full-beat periodic-attractor evidence",
    "Establish separately accepted physiological initialization and reference calibration, pathological-envelope coverage, and physiological or experimental Land and TriSeg validation before Phase B1 acceptance",
    "Complete accepted full-beat and event-integrated evidence before ModelCore, browser, or release-runtime adoption",
  ] as const);

const MODES = Object.freeze(["on", "off"] as const);
const READINESS_RESULTS = new WeakSet<object>();

const READINESS_KEYS = Object.freeze([
  "phase",
  "completionStatus",
  "evidenceBoundary",
  "manifestSha256",
  "numericalEvidenceSha256",
  "lineage",
  "directParentAuthentication",
  "bindings",
  "implementation",
  "deferred",
  "allEvidenceBindingsPass",
  "evidenceLayerDirectParentAuthenticationPass",
  "projectSyntheticQuiescentPressureReferenceInversePass",
  "instantaneousHydraulicQuiescencePass",
  "projectSyntheticQuiescentReferenceEventFreeCasePass",
  "projectSyntheticToleranceCertifiedIdentityHoldPass",
  "biologicalPressurePathPass",
  "acceptedPhaseB1ReferenceBranchPass",
  "physiologicalReferenceAcceptancePass",
  "supportedReferenceEnvelopePass",
  "continuousReferenceCoordinateRegularityPass",
  "continuousPressurePathRegularityPass",
  "closedLoopAnalyticalStationarityPass",
  "globalRootUniquenessPass",
  "globalRootExhaustivenessPass",
  "energeticStabilityPass",
  "fullBeatAcceptancePass",
  "eventIntegratedAcceptancePass",
  "physiologicalValidationPass",
  "phaseB1AcceptancePass",
  "pureCoreParentEvidenceAuthenticationClaimed",
  "releaseRuntimePass",
  "modelCoreIntegration",
  "browserRuntimeAdopted",
  "releaseRuntimeReachable",
  "testOnly",
  "blockers",
] as const);

const BINDING_KEYS = Object.freeze([
  "quiescentReferenceEvidenceManifestSha256",
  "protocolDefinitionSha256",
  "directParentSha256",
  "componentIdsSha256",
  "inverseProtocolSha256",
  "inversePolicySha256",
  "eventFreeCaseProtocolSha256",
  "eventFreeCasePolicySha256",
  "identityHoldProtocolSha256",
  "identityHoldPolicySha256",
  "identityHoldDtGridSha256",
  "prohibitedOperationsSha256",
  "claimBoundarySha256",
  "numericalEvidenceSha256",
] as const);

const IMPLEMENTATION_KEYS = Object.freeze([
  "slsTopologies",
  "exactPairedPhysicalSlsModeInventory",
  "manifestAndNumericalEvidenceCanonicalLive",
  "directParentGraphArtifactsAuthenticated",
  "effectiveJacobianStepAndStencilGateBound",
  "reducedRestoringManifoldCorrectorBound",
  "destinationRegistryCompiledOnceFromAcceptedDestination",
  "completeIndependentDtGridIdentityHoldBound",
  "pureCoreParentEvidenceAuthenticationClaimed",
  "evidenceClass",
] as const);

const LINEAGE_KEYS = Object.freeze([
  "directParentGraphManifestSha256",
  "directParentGraphNumericalEvidenceSha256",
  "directParentGraphReadinessSha256",
  "canonicalDirectParentManifestVerifiedLive",
  "directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence",
  "evidenceLayerDirectParentLineageAuthentication",
  "pureCoreParentEvidenceAuthenticationClaimed",
] as const);

const DIRECT_PARENT_AUTHENTICATION_KEYS = Object.freeze([
  "finiteVolumeGraph",
  "exactSlsModeKeys",
  "evidenceLayerDirectParentLineageAuthentication",
  "pureCoreParentEvidenceAuthenticationClaimed",
  "allDirectParentArtifactsAuthenticated",
] as const);

const FINITE_VOLUME_GRAPH_AUTHENTICATION_KEYS = Object.freeze([
  "manifestSha256",
  "numericalEvidenceSha256",
  "readinessSha256",
  "manifestRebuiltCanonicalSelfHashedAndPinned",
  "numericalBundleRebuiltCanonicalSelfHashedAndPinned",
  "readinessRebuiltCanonicalHashedAndPinned",
  "liveBrandedOnOffGraphResultsConsumed",
] as const);

const DEFERRED_KEYS = Object.freeze([
  "biologicalPressurePath",
  "acceptedPhaseB1ReferenceBranch",
  "physiologicalReferenceAcceptance",
  "supportedReferenceEnvelope",
  "continuousReferenceAndPressurePathRegularity",
  "closedLoopAnalyticalStationarity",
  "globalRootUniquenessOrExhaustiveness",
  "energeticStability",
  "fullBeatAndEventIntegratedAcceptance",
  "physiologicalValidation",
  "phaseB1Acceptance",
  "runtimeIntegration",
] as const);

const NARROW_PASS_KEYS = Object.freeze([
  "projectSyntheticQuiescentPressureReferenceInversePass",
  "instantaneousHydraulicQuiescencePass",
  "projectSyntheticQuiescentReferenceEventFreeCasePass",
  "projectSyntheticToleranceCertifiedIdentityHoldPass",
] as const);

const BROAD_FALSE_KEYS = Object.freeze([
  "biologicalPressurePathPass",
  "acceptedPhaseB1ReferenceBranchPass",
  "physiologicalReferenceAcceptancePass",
  "supportedReferenceEnvelopePass",
  "continuousReferenceCoordinateRegularityPass",
  "continuousPressurePathRegularityPass",
  "closedLoopAnalyticalStationarityPass",
  "globalRootUniquenessPass",
  "globalRootExhaustivenessPass",
  "energeticStabilityPass",
  "fullBeatAcceptancePass",
  "eventIntegratedAcceptancePass",
  "physiologicalValidationPass",
  "phaseB1AcceptancePass",
  "pureCoreParentEvidenceAuthenticationClaimed",
  "releaseRuntimePass",
  "modelCoreIntegration",
  "browserRuntimeAdopted",
  "releaseRuntimeReachable",
] as const);

export function buildFourChamberPhaseB1QuiescentReferenceStatusV1(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  numericalEvidence: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
) {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(manifest);
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
    numericalEvidence,
    manifest,
  );
  const certificate = numericalEvidence.certificate;
  const directParentAuthentication = certificate.directParentAuthentication;
  const parent = directParentAuthentication.finiteVolumeGraph;
  const exactPairedPhysicalSlsModeInventory = [
    certificate.slsModes,
    Reflect.ownKeys(certificate.modes),
    Reflect.ownKeys(numericalEvidence.results),
  ].every((keys) => canonicalizeJson(keys) === canonicalizeJson(MODES));
  const manifestBindingsExact = canonicalizeJson(certificate.manifestBindings)
    === canonicalizeJson(manifest.bindings);
  const parentLineageExact =
    manifest.lineage.directParentGraphManifestSha256 === parent.manifestSha256
    && manifest.lineage.directParentGraphNumericalEvidenceSha256
      === parent.numericalEvidenceSha256
    && manifest.lineage.directParentGraphReadinessSha256
      === parent.readinessSha256;
  const allEvidenceBindingsPass =
    certificate.evidenceId
      === PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID
    && certificate.manifestSha256 === manifest.contentSha256
    && manifestBindingsExact
    && parentLineageExact
    && directParentAuthentication.exactSlsModeKeys
    && directParentAuthentication
      .evidenceLayerDirectParentLineageAuthentication
    && !directParentAuthentication.pureCoreParentEvidenceAuthenticationClaimed
    && directParentAuthentication.allDirectParentArtifactsAuthenticated
    && exactPairedPhysicalSlsModeInventory;
  const everyModeNarrowPass = MODES.every((mode) =>
    Object.values(certificate.modes[mode].narrowClaims)
      .every((value) => value === true));
  const everyModeBroadClaimClosed = MODES.every((mode) =>
    Object.values(certificate.modes[mode].broadClaims)
      .every((value) => value === false));
  const everyModePassAndTestOnly = MODES.every((mode) =>
    certificate.modes[mode].modePass
    && certificate.modes[mode].testOnly === true);
  const certificateNarrowClaimsPass = Object.values(certificate.narrowClaims)
    .every((value) => value === true);
  const certificateBroadClaimsClosed = Object.values(certificate.broadClaims)
    .every((value) => value === false);
  const narrowEvidencePass = allEvidenceBindingsPass
    && certificate.allModesPass
    && certificateNarrowClaimsPass
    && certificateBroadClaimsClosed
    && everyModeNarrowPass
    && everyModeBroadClaimClosed
    && everyModePassAndTestOnly
    && Object.values(manifest.deferred).every((value) => value === true);
  const evidenceLayerDirectParentAuthenticationPass =
    directParentAuthentication.allDirectParentArtifactsAuthenticated;
  const readiness = Object.freeze({
    phase: "Phase B1 project-synthetic quiescent pressure reference and event-free identity hold" as const,
    completionStatus: FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_STATUS_V1,
    evidenceBoundary:
      "content-hashed paired-SLS project-synthetic evidence for a four-coordinate positive-pressure reference inverse with independently restarted 2/4/8 paths, direct primary/independent full augmented Jacobian Schur gates, a reduced restoring-manifold corrector, one accepted-destination registry compilation, and three independently restarted event-free backward-Euler tolerance-certified identity holds; not a biological pressure path, accepted or physiological reference, supported or continuous envelope, analytical stationarity, global-root or energetic certificate, full-beat or event-integrated acceptance, Phase B1 acceptance, or runtime evidence" as const,
    manifestSha256: manifest.contentSha256,
    numericalEvidenceSha256: certificate.contentSha256,
    lineage: manifest.lineage,
    directParentAuthentication,
    bindings: Object.freeze({
      quiescentReferenceEvidenceManifestSha256: manifest.contentSha256,
      protocolDefinitionSha256: manifest.bindings.protocolDefinitionSha256,
      directParentSha256: manifest.bindings.directParentSha256,
      componentIdsSha256: manifest.bindings.componentIdsSha256,
      inverseProtocolSha256: manifest.bindings.inverseProtocolSha256,
      inversePolicySha256: manifest.bindings.inversePolicySha256,
      eventFreeCaseProtocolSha256:
        manifest.bindings.eventFreeCaseProtocolSha256,
      eventFreeCasePolicySha256:
        manifest.bindings.eventFreeCasePolicySha256,
      identityHoldProtocolSha256:
        manifest.bindings.identityHoldProtocolSha256,
      identityHoldPolicySha256: manifest.bindings.identityHoldPolicySha256,
      identityHoldDtGridSha256: manifest.bindings.identityHoldDtGridSha256,
      prohibitedOperationsSha256:
        manifest.bindings.prohibitedOperationsSha256,
      claimBoundarySha256: manifest.bindings.claimBoundarySha256,
      numericalEvidenceSha256: certificate.contentSha256,
    }),
    implementation: Object.freeze({
      slsTopologies: certificate.slsModes,
      exactPairedPhysicalSlsModeInventory,
      manifestAndNumericalEvidenceCanonicalLive: true as const,
      directParentGraphArtifactsAuthenticated:
        evidenceLayerDirectParentAuthenticationPass,
      effectiveJacobianStepAndStencilGateBound:
        manifest.implementationClaims.effectiveJacobianStepAndStencilGateBound,
      reducedRestoringManifoldCorrectorBound:
        manifest.implementationClaims.reducedRestoringManifoldCorrectorBound,
      destinationRegistryCompiledOnceFromAcceptedDestination:
        manifest.implementationClaims
          .destinationRegistryCompiledOnceFromAcceptedDestination,
      completeIndependentDtGridIdentityHoldBound:
        manifest.implementationClaims.exactDtGridAndCompleteNonTimeIdentityBound
        && manifest.implementationClaims
          .zeroAcceptedNewtonStepsAndEventFreeHoldBound,
      pureCoreParentEvidenceAuthenticationClaimed: false as const,
      evidenceClass:
        "project-synthetic-quiescent-reference-and-event-free-tolerance-identity-evidence" as const,
    }),
    deferred: manifest.deferred,
    allEvidenceBindingsPass,
    evidenceLayerDirectParentAuthenticationPass,
    projectSyntheticQuiescentPressureReferenceInversePass: narrowEvidencePass
      && certificate.narrowClaims
        .projectSyntheticQuiescentPressureReferenceInverse,
    instantaneousHydraulicQuiescencePass: narrowEvidencePass
      && certificate.narrowClaims.instantaneousHydraulicQuiescence,
    projectSyntheticQuiescentReferenceEventFreeCasePass: narrowEvidencePass
      && certificate.narrowClaims
        .projectSyntheticQuiescentReferenceEventFreeCase,
    projectSyntheticToleranceCertifiedIdentityHoldPass: narrowEvidencePass
      && certificate.narrowClaims
        .projectSyntheticToleranceCertifiedIdentityHold,
    biologicalPressurePathPass: false as const,
    acceptedPhaseB1ReferenceBranchPass: false as const,
    physiologicalReferenceAcceptancePass: false as const,
    supportedReferenceEnvelopePass: false as const,
    continuousReferenceCoordinateRegularityPass: false as const,
    continuousPressurePathRegularityPass: false as const,
    closedLoopAnalyticalStationarityPass: false as const,
    globalRootUniquenessPass: false as const,
    globalRootExhaustivenessPass: false as const,
    energeticStabilityPass: false as const,
    fullBeatAcceptancePass: false as const,
    eventIntegratedAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    pureCoreParentEvidenceAuthenticationClaimed: false as const,
    releaseRuntimePass: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
    blockers: FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_BLOCKERS_V1,
  });
  assertReadinessStructureV1(readiness);
  READINESS_RESULTS.add(readiness);
  return readiness;
}

export type FourChamberPhaseB1QuiescentReferenceStatusV1 = ReturnType<
  typeof buildFourChamberPhaseB1QuiescentReferenceStatusV1
>;

export function assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1(
  value: unknown,
): asserts value is FourChamberPhaseB1QuiescentReferenceStatusV1 {
  if (
    value === null
    || typeof value !== "object"
    || !READINESS_RESULTS.has(value)
  ) throw new Error(
    "Phase B1 quiescent-reference readiness must be canonically built in this process",
  );
  assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(value);
}

export function assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
  value: unknown,
): asserts value is FourChamberPhaseB1QuiescentReferenceStatusV1 {
  assertReadinessStructureV1(value);
}

function assertReadinessStructureV1(value: unknown): void {
  canonicalizeJson(value);
  assertRecursivelyFrozenAndClosed(value, "$", new WeakSet<object>());
  assertExactPlainRecordV1(value, READINESS_KEYS, "quiescentReferenceReadiness");
  const readiness = value;
  assertExactPlainRecordV1(
    readiness.lineage,
    LINEAGE_KEYS,
    "quiescentReferenceReadiness.lineage",
  );
  const lineage = readiness.lineage;
  assertExactPlainRecordV1(
    readiness.directParentAuthentication,
    DIRECT_PARENT_AUTHENTICATION_KEYS,
    "quiescentReferenceReadiness.directParentAuthentication",
  );
  const directParentAuthentication = readiness.directParentAuthentication;
  assertExactPlainRecordV1(
    directParentAuthentication.finiteVolumeGraph,
    FINITE_VOLUME_GRAPH_AUTHENTICATION_KEYS,
    "quiescentReferenceReadiness.directParentAuthentication.finiteVolumeGraph",
  );
  const finiteVolumeGraph = directParentAuthentication.finiteVolumeGraph;
  assertExactPlainRecordV1(
    readiness.bindings,
    BINDING_KEYS,
    "quiescentReferenceReadiness.bindings",
  );
  const bindings = readiness.bindings;
  assertExactPlainRecordV1(
    readiness.implementation,
    IMPLEMENTATION_KEYS,
    "quiescentReferenceReadiness.implementation",
  );
  const implementation = readiness.implementation;
  assertDensePlainArrayV1(
    implementation.slsTopologies,
    2,
    "quiescentReferenceReadiness.implementation.slsTopologies",
  );
  assertExactPlainRecordV1(
    readiness.deferred,
    DEFERRED_KEYS,
    "quiescentReferenceReadiness.deferred",
  );
  const deferred = readiness.deferred;
  assertDensePlainArrayV1(
    readiness.blockers,
    FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_BLOCKERS_V1.length,
    "quiescentReferenceReadiness.blockers",
  );
  const blockers = readiness.blockers;
  const slsTopologies = implementation.slsTopologies;
  if (
    readiness.phase
      !== "Phase B1 project-synthetic quiescent pressure reference and event-free identity hold"
    || readiness.completionStatus
      !== FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_STATUS_V1
    || readiness.testOnly !== true
    || slsTopologies.join(",") !== "on,off"
    || blockers.length === 0
    || blockers.some((blocker) =>
      typeof blocker !== "string" || blocker.length === 0)
    || Object.values(deferred).some((entry) => entry !== true)
    || readiness.allEvidenceBindingsPass !== true
    || readiness.evidenceLayerDirectParentAuthenticationPass !== true
    || typeof readiness.manifestSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(readiness.manifestSha256)
    || typeof readiness.numericalEvidenceSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(readiness.numericalEvidenceSha256)
    || Object.values(bindings).some((entry) =>
      typeof entry !== "string" || !/^[0-9a-f]{64}$/.test(entry))
    || [
      lineage.directParentGraphManifestSha256,
      lineage.directParentGraphNumericalEvidenceSha256,
      lineage.directParentGraphReadinessSha256,
      finiteVolumeGraph.manifestSha256,
      finiteVolumeGraph.numericalEvidenceSha256,
      finiteVolumeGraph.readinessSha256,
    ].some((entry) =>
      typeof entry !== "string" || !/^[0-9a-f]{64}$/.test(entry))
    || bindings.quiescentReferenceEvidenceManifestSha256
      !== readiness.manifestSha256
    || bindings.numericalEvidenceSha256 !== readiness.numericalEvidenceSha256
    || lineage.directParentGraphManifestSha256
      !== finiteVolumeGraph.manifestSha256
    || lineage.directParentGraphNumericalEvidenceSha256
      !== finiteVolumeGraph.numericalEvidenceSha256
    || lineage.directParentGraphReadinessSha256
      !== finiteVolumeGraph.readinessSha256
    || lineage.canonicalDirectParentManifestVerifiedLive !== true
    || lineage.directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence
      !== true
    || lineage.evidenceLayerDirectParentLineageAuthentication !== true
    || lineage.pureCoreParentEvidenceAuthenticationClaimed !== false
    || directParentAuthentication.exactSlsModeKeys !== true
    || directParentAuthentication
      .evidenceLayerDirectParentLineageAuthentication !== true
    || directParentAuthentication.pureCoreParentEvidenceAuthenticationClaimed
      !== false
    || directParentAuthentication.allDirectParentArtifactsAuthenticated !== true
    || finiteVolumeGraph.manifestRebuiltCanonicalSelfHashedAndPinned !== true
    || finiteVolumeGraph.numericalBundleRebuiltCanonicalSelfHashedAndPinned
      !== true
    || finiteVolumeGraph.readinessRebuiltCanonicalHashedAndPinned !== true
    || finiteVolumeGraph.liveBrandedOnOffGraphResultsConsumed !== true
    || implementation.exactPairedPhysicalSlsModeInventory !== true
    || implementation.manifestAndNumericalEvidenceCanonicalLive !== true
    || implementation.directParentGraphArtifactsAuthenticated !== true
    || implementation.effectiveJacobianStepAndStencilGateBound !== true
    || implementation.reducedRestoringManifoldCorrectorBound !== true
    || implementation.destinationRegistryCompiledOnceFromAcceptedDestination
      !== true
    || implementation.completeIndependentDtGridIdentityHoldBound !== true
    || implementation.pureCoreParentEvidenceAuthenticationClaimed !== false
    || implementation.evidenceClass
      !== "project-synthetic-quiescent-reference-and-event-free-tolerance-identity-evidence"
    || BROAD_FALSE_KEYS.some((key) => readiness[key] !== false)
    || NARROW_PASS_KEYS.some((key) => readiness[key] !== true)
  ) throw new Error("Phase B1 quiescent-reference readiness inventory drifted");
}

function assertRecursivelyFrozenAndClosed(
  value: unknown,
  path: string,
  visited: WeakSet<object>,
): void {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} must not contain a non-finite number`);
    }
    return;
  }
  if (typeof value !== "object") {
    throw new Error(`${path} must contain only canonical JSON data`);
  }
  if (visited.has(value)) return;
  visited.add(value);
  if (!Object.isFrozen(value)) throw new Error(`${path} must be frozen`);
  if (Array.isArray(value)) {
    assertDensePlainArrayV1(value, undefined, path);
    value.forEach((child, index) =>
      assertRecursivelyFrozenAndClosed(child, `${path}[${index}]`, visited));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${path} must be a plain object`);
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new Error(`${path} must not contain symbol properties`);
  }
  for (const key of Object.getOwnPropertyNames(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || descriptor.enumerable !== true
    ) throw new Error(`${path}.${key} must be an enumerable data property`);
    assertRecursivelyFrozenAndClosed(descriptor.value, `${path}.${key}`, visited);
  }
}
