import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EVIDENCE_MANIFEST_V1_ID,
  buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1";
import {
  PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphNumericalEvidenceV1";
import {
  FOUR_CHAMBER_PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_STATUS_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphReadinessV1";
import {
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeIdentityHoldV1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_QUIESCENT_REFERENCE_EVIDENCE_MANIFEST_V1_ID =
  "phase-b1-project-synthetic-quiescent-reference-evidence-manifest-v1" as const;

export const PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1 =
  "bcf9c3c628a9a8bed02e783f503f266efd5a44dece1e636a05e18d6bcdbfe89c" as const;
export const PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1 =
  "3a304894732eea7ed0a0ffd55ea5a18b1c6554c874fea60e288adad15151d4d8" as const;
export const PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1 =
  "54a60c3d446a26520aeabecada96694d36e9c3a577675b162ff7ff3d4746dd7f" as const;

const MANIFESTS = new WeakSet<object>();
const PROTOCOL_DEFINITIONS = new WeakSet<object>();
const SLS_MODES = Object.freeze(["on", "off"] as const);
const FAILURE_PROBE_ATTEMPT_INDICES = Object.freeze([0, 1] as const);

const DIRECT_PARENT = Object.freeze({
  graphId: PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_V1_ID,
  manifestId:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_EVIDENCE_MANIFEST_V1_ID,
  numericalEvidenceId:
    PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_NUMERICAL_EVIDENCE_V1_ID,
  readinessStatus:
    FOUR_CHAMBER_PHASE_B1_ETA_ONE_LAND_COUPLED_FINITE_VOLUME_GRAPH_STATUS_V1,
  manifestSha256:
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
  numericalEvidenceSha256:
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  readinessSha256:
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
  requiredGraphPass: true as const,
  canonicalDirectParentManifestVerifiedLive: true as const,
  directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence:
    true as const,
  evidenceLayerDirectParentLineageAuthentication: true as const,
  pureCoreParentEvidenceAuthenticationClaimed: false as const,
} as const);

const COMPONENT_IDS = Object.freeze({
  inverse: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
  eventFreeCase: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
  identityHold:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID,
} as const);

const REFERENCE_COORDINATE_MAP = Object.freeze({
  dimension: 4 as const,
  coordinates: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .logUnknownLabels,
  atrialReferenceCavityVolumeMap: Object.freeze({
    LA: "V0_LA*exp(log_LA_reference_cavity_multiplier)" as const,
    RA: "V0_RA*exp(log_RA_reference_cavity_multiplier)" as const,
  }),
  triSegReferenceMidwallAreaMap:
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .freewallReferenceAreaMap,
  leftVentricularFreewallLogMap:
    "ell_LVFW=ell_even+ell_odd" as const,
  rightVentricularFreewallLogMap:
    "ell_RVFW=ell_even-ell_odd" as const,
  septalReferenceMidwallAreaFixedAnchorExact: true as const,
} as const);

const PRESSURE_SCHEDULE = Object.freeze({
  kind: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .targetPressureSchedule,
  formula: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .targetPressureFormula,
  loadParameter: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .loadParameter,
  loadParameterInterval:
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .loadParameterInterval,
  sourceAndDestinationPressuresRequiredStrictlyPositive: true as const,
  biologicalPathClaimed: false as const,
} as const);

const INVERSE_REFINEMENT = Object.freeze({
  factors: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
    .refinementFactors,
  selectionRule: "first-hard-pass-with-50pct-guard" as const,
  everyFactorAttemptStartsFromExactCanonicalSourceIndependently: true as const,
  factorEndpointsSharedAsSeeds: false as const,
  factorEightReverseRequired: true as const,
  forwardEndpointAgreementRequired: true as const,
} as const);

const AUGMENTED_JACOBIAN = Object.freeze({
  primary: Object.freeze({
    construction:
      "direct-full-augmented-five-point-algorithmic-jacobian" as const,
    scaledStep:
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .fullJacobianScaledStep,
    includesEveryColdUnknownAndAllFourLogCoordinates: true as const,
  }),
  independent: Object.freeze({
    construction:
      "independent-direct-full-augmented-five-point-algorithmic-jacobian" as const,
    scaledStep:
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .independentSchurJacobianScaledStep,
    includesEveryColdUnknownAndAllFourLogCoordinates: true as const,
  }),
  effectiveStepAndStencilGate:
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .effectiveJacobianStencilGate,
  directColdBlockEliminationSuppliesFourByFourPressureSchur: true as const,
  nestedFiniteDifferenceApplied: false as const,
} as const);

const INVERSE_PROTOCOL = Object.freeze({
  inverseId: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
  policy: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
  referenceCoordinateMap: REFERENCE_COORDINATE_MAP,
  positiveGeometricPressureSchedule: PRESSURE_SCHEDULE,
  refinement: INVERSE_REFINEMENT,
  augmentedJacobian: AUGMENTED_JACOBIAN,
  restoringManifoldCorrector: Object.freeze({
    reducedUnknownDimension: 4 as const,
    boundary:
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .correctorBoundary,
    nonlinearColdBlockRestoredAtEveryReducedTrial: true as const,
    directFullAugmentedJacobianSuppliesReducedSchur: true as const,
    monolithicFullNewtonClaimed: false as const,
  }),
  hardGates:
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates,
  fiftyPercentGuard:
    PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
      .fiftyPercentGuard,
  failureProbes: Object.freeze({
    injectedAttemptIndices: FAILURE_PROBE_ATTEMPT_INDICES,
    structuredRollbackRequired: true as const,
  }),
  livePassingResultBrand: Object.freeze({
    weakSetBackedCanonicalAssertionRequired: true as const,
    onlyPassingResultsBranded: true as const,
  }),
  testOnly: true as const,
} as const);

const EVENT_FREE_CASE_PROTOCOL = Object.freeze({
  caseId: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
  policy: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1,
  destinationRegistryStageBoundary:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
      .destinationRegistryStageBoundary,
  destinationRegistryCompiledExactlyOnce: true as const,
  acceptedInverseDestinationDefinesRegistry: true as const,
  geometryChanges:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1.geometryChanges,
  septalReferenceMidwallAreaFixedAnchorExact: true as const,
  inverseAnchorRegistryValuesReverseEngineered:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
      .inverseAnchorRegistryValuesReverseEngineered,
  adaptiveRescalingAllowed:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
      .adaptiveRescalingAllowed,
  eventSchedulerIntegrated: false as const,
  testOnly: true as const,
} as const);

const IDENTITY_HOLD_PROTOCOL = Object.freeze({
  holdId: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID,
  policy: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1,
  dtGridSec:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
  everyStepStartsFromSameReferenceEndpointIndependently:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
      .everyStepStartsFromSameReferenceEndpointIndependently,
  nonTimeStateComparison:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
      .nonTimeStateComparison,
  expectedStoredScalarCountBySlsMode:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
      .expectedStoredScalarCountBySlsMode,
  acceptedNewtonStepCount:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
      .acceptedNewtonStepCount,
  destinationRegistryObjectReusedAcrossAllSteps: true as const,
  destinationRegistryRecompiledDuringHold: false as const,
  eventFree: true as const,
  eventSchedulerIntegrated:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
      .eventSchedulerIntegrated,
  adaptiveRescalingAllowed:
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
      .adaptiveRescalingAllowed,
  testOnly: true as const,
} as const);

const PROHIBITED_OPERATIONS = Object.freeze({
  regularizationApplied: false as const,
  priorApplied: false as const,
  projectionApplied: false as const,
  clippingApplied: false as const,
  hiddenSubdivisionApplied: false as const,
  pseudoArclengthApplied: false as const,
  rootRankingApplied: false as const,
  nestedFiniteDifferenceApplied: false as const,
  fallbackReseedApplied: false as const,
  inverseAnchorRegistryValuesReverseEngineered: false as const,
  destinationRegistryAdaptiveRescalingApplied: false as const,
  holdAdaptiveRescalingApplied: false as const,
  eventSchedulerIntegrated: false as const,
} as const);

const CLAIM_BOUNDARY = Object.freeze({
  projectSyntheticQuiescentPressureReferenceInverse: true as const,
  instantaneousHydraulicQuiescence: true as const,
  projectSyntheticQuiescentReferenceEventFreeCase: true as const,
  projectSyntheticToleranceCertifiedIdentityHold: true as const,
  biologicalPressurePath: false as const,
  acceptedPhaseB1ReferenceBranch: false as const,
  physiologicalReferenceAcceptance: false as const,
  supportedReferenceEnvelope: false as const,
  continuousReferenceCoordinateRegularity: false as const,
  continuousPressurePathRegularity: false as const,
  closedLoopAnalyticalStationarity: false as const,
  globalRootUniqueness: false as const,
  globalRootExhaustiveness: false as const,
  energeticStability: false as const,
  fullBeatAcceptance: false as const,
  eventIntegratedAcceptance: false as const,
  physiologicalValidation: false as const,
  phaseB1Acceptance: false as const,
  pureCoreParentEvidenceAuthenticationClaimed: false as const,
  modelCoreIntegration: false as const,
  browserRuntimeAdoption: false as const,
  releaseRuntimeReachability: false as const,
} as const);

const IMPLEMENTATION_CLAIMS = Object.freeze({
  pairedPhysicalSlsModesBound: true as const,
  exactCanonicalDirectParentGraphManifestVerifiedLive: true as const,
  graphManifestNumericalAndReadinessHashesPinned: true as const,
  fourLogPositiveGeometricPressureInversePolicyBound: true as const,
  septalReferenceAreaRemainsFixedAtAnchor: true as const,
  independentTwoFourEightRefinementAttemptsBound: true as const,
  primaryAndIndependentDirectFullAugmentedJacobiansBound: true as const,
  effectiveJacobianStepAndStencilGateBound: true as const,
  reducedRestoringManifoldCorrectorBound: true as const,
  hardAndFiftyPercentGuardsBound: true as const,
  structuredFailureProbesBound: true as const,
  livePassingInverseBrandRequired: true as const,
  destinationRegistryCompiledOnceFromAcceptedDestination: true as const,
  noRegistryReverseEngineeringOrAdaptiveScaling: true as const,
  exactDtGridAndCompleteNonTimeIdentityBound: true as const,
  zeroAcceptedNewtonStepsAndEventFreeHoldBound: true as const,
  narrowProjectSyntheticClaimBoundaryEnforced: true as const,
} as const);

const DEFERRED = Object.freeze({
  biologicalPressurePath: true as const,
  acceptedPhaseB1ReferenceBranch: true as const,
  physiologicalReferenceAcceptance: true as const,
  supportedReferenceEnvelope: true as const,
  continuousReferenceAndPressurePathRegularity: true as const,
  closedLoopAnalyticalStationarity: true as const,
  globalRootUniquenessOrExhaustiveness: true as const,
  energeticStability: true as const,
  fullBeatAndEventIntegratedAcceptance: true as const,
  physiologicalValidation: true as const,
  phaseB1Acceptance: true as const,
  runtimeIntegration: true as const,
} as const);

const LINEAGE = Object.freeze({
  directParentGraphManifestSha256:
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
  directParentGraphNumericalEvidenceSha256:
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  directParentGraphReadinessSha256:
    PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
  canonicalDirectParentManifestVerifiedLive: true as const,
  directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence:
    true as const,
  evidenceLayerDirectParentLineageAuthentication: true as const,
  pureCoreParentEvidenceAuthenticationClaimed: false as const,
} as const);

export function buildPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1() {
  const protocolDefinition = Object.freeze({
    protocolId:
      "phase-b1-project-synthetic-quiescent-reference-evidence-protocol-v1" as const,
    slsModes: SLS_MODES,
    directParent: DIRECT_PARENT,
    componentIds: COMPONENT_IDS,
    inverseProtocol: INVERSE_PROTOCOL,
    eventFreeCaseProtocol: EVENT_FREE_CASE_PROTOCOL,
    identityHoldProtocol: IDENTITY_HOLD_PROTOCOL,
    prohibitedOperations: PROHIBITED_OPERATIONS,
    claimBoundary: CLAIM_BOUNDARY,
    testOnly: true as const,
  } as const);
  PROTOCOL_DEFINITIONS.add(protocolDefinition);
  return protocolDefinition;
}

export type PhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1 =
  ReturnType<
    typeof buildPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1
  >;

export type PhaseB1QuiescentReferenceEvidenceManifestPayloadV1 = Readonly<{
  manifestId: typeof PHASE_B1_QUIESCENT_REFERENCE_EVIDENCE_MANIFEST_V1_ID;
  status:
    "project-synthetic-phase-b1-quiescent-reference-inverse-and-event-free-identity-hold-not-physiological-reference-or-stationarity";
  evidenceClass:
    "project-synthetic-quiescent-pressure-reference-inverse-event-free-tolerance-certified-identity-hold-regression";
  lineage: typeof LINEAGE;
  bindings: Readonly<{
    protocolDefinitionSha256: string;
    directParentSha256: string;
    componentIdsSha256: string;
    inverseProtocolSha256: string;
    inversePolicySha256: string;
    eventFreeCaseProtocolSha256: string;
    eventFreeCasePolicySha256: string;
    identityHoldProtocolSha256: string;
    identityHoldPolicySha256: string;
    identityHoldDtGridSha256: string;
    prohibitedOperationsSha256: string;
    claimBoundarySha256: string;
  }>;
  protocolDefinition: PhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1;
  implementationClaims: typeof IMPLEMENTATION_CLAIMS;
  deferred: typeof DEFERRED;
  claimBoundary: typeof CLAIM_BOUNDARY;
  testOnly: true;
}>;

export type PhaseB1QuiescentReferenceEvidenceManifestV1 =
  PhaseB1QuiescentReferenceEvidenceManifestPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1QuiescentReferenceEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceEvidenceManifestV1 {
  const protocolDefinition =
    buildPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1();
  const payload: PhaseB1QuiescentReferenceEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId: PHASE_B1_QUIESCENT_REFERENCE_EVIDENCE_MANIFEST_V1_ID,
      status:
        "project-synthetic-phase-b1-quiescent-reference-inverse-and-event-free-identity-hold-not-physiological-reference-or-stationarity",
      evidenceClass:
        "project-synthetic-quiescent-pressure-reference-inverse-event-free-tolerance-certified-identity-hold-regression",
      lineage: LINEAGE,
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
        inverseProtocolSha256: computeCanonicalSha256(
          protocolDefinition.inverseProtocol,
          sha256Hex,
        ),
        inversePolicySha256: computeCanonicalSha256(
          protocolDefinition.inverseProtocol.policy,
          sha256Hex,
        ),
        eventFreeCaseProtocolSha256: computeCanonicalSha256(
          protocolDefinition.eventFreeCaseProtocol,
          sha256Hex,
        ),
        eventFreeCasePolicySha256: computeCanonicalSha256(
          protocolDefinition.eventFreeCaseProtocol.policy,
          sha256Hex,
        ),
        identityHoldProtocolSha256: computeCanonicalSha256(
          protocolDefinition.identityHoldProtocol,
          sha256Hex,
        ),
        identityHoldPolicySha256: computeCanonicalSha256(
          protocolDefinition.identityHoldProtocol.policy,
          sha256Hex,
        ),
        identityHoldDtGridSha256: computeCanonicalSha256(
          protocolDefinition.identityHoldProtocol.dtGridSec,
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
      testOnly: true,
    });
  // Explicitly close the self-hash payload under canonical JSON before hashing.
  canonicalizeJson(payload);
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  MANIFESTS.add(manifest);
  return validatePhaseB1QuiescentReferenceEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
): PhaseB1QuiescentReferenceEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !MANIFESTS.has(manifest)
  ) throw new Error(
    "Phase B1 quiescent-reference manifest must be canonically built in this process",
  );
  return manifest;
}

export function assertCanonicalPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1(
  protocolDefinition: PhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1,
): PhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1 {
  if (
    protocolDefinition === null
    || typeof protocolDefinition !== "object"
    || !PROTOCOL_DEFINITIONS.has(protocolDefinition)
  ) throw new Error(
    "Phase B1 quiescent-reference protocol must be canonically built in this process",
  );
  return protocolDefinition;
}

/**
 * Structural assertion for adversarial manifest input. It requires an exact
 * closed inventory, recursively frozen plain data, dense arrays, data-only
 * properties, and canonical equality to every fixed protocol inventory.
 */
export function assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
  value: unknown,
): asserts value is PhaseB1QuiescentReferenceEvidenceManifestV1 {
  // Reject cycles and every non-canonical JSON descriptor before the
  // recursive inventory walk. The latter deliberately memoizes shared,
  // acyclic subobjects and therefore is not itself a cycle detector.
  canonicalizeJson(value);
  assertRecursivelyFrozenAndClosed(value, "$", new WeakSet<object>());
  assertExactPlainRecordV1(value, [
    "manifestId",
    "status",
    "evidenceClass",
    "lineage",
    "bindings",
    "protocolDefinition",
    "implementationClaims",
    "deferred",
    "claimBoundary",
    "testOnly",
    "hashAlgorithm",
    "contentSha256",
  ], "phaseB1QuiescentReferenceManifest");
  const manifest = value as unknown as
    PhaseB1QuiescentReferenceEvidenceManifestV1;
  assertExactPlainRecordV1(manifest.lineage, Object.keys(LINEAGE),
    "phaseB1QuiescentReferenceManifest.lineage");
  assertExactPlainRecordV1(manifest.bindings, [
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
  ], "phaseB1QuiescentReferenceManifest.bindings");
  assertExactPlainRecordV1(manifest.protocolDefinition, [
    "protocolId",
    "slsModes",
    "directParent",
    "componentIds",
    "inverseProtocol",
    "eventFreeCaseProtocol",
    "identityHoldProtocol",
    "prohibitedOperations",
    "claimBoundary",
    "testOnly",
  ], "phaseB1QuiescentReferenceManifest.protocolDefinition");
  assertDensePlainArrayV1(manifest.protocolDefinition.slsModes, 2,
    "phaseB1QuiescentReferenceManifest.protocolDefinition.slsModes");
  assertDensePlainArrayV1(
    manifest.protocolDefinition.inverseProtocol.refinement.factors,
    3,
    "phaseB1QuiescentReferenceManifest.protocolDefinition.inverseProtocol.refinement.factors",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.inverseProtocol.failureProbes
      .injectedAttemptIndices,
    2,
    "phaseB1QuiescentReferenceManifest.protocolDefinition.inverseProtocol.failureProbes.injectedAttemptIndices",
  );
  assertDensePlainArrayV1(
    manifest.protocolDefinition.identityHoldProtocol.dtGridSec,
    3,
    "phaseB1QuiescentReferenceManifest.protocolDefinition.identityHoldProtocol.dtGridSec",
  );
  const exactInventories: readonly [unknown, unknown, string][] = [
    [manifest.lineage, LINEAGE, "lineage"],
    [manifest.protocolDefinition.directParent, DIRECT_PARENT, "directParent"],
    [manifest.protocolDefinition.componentIds, COMPONENT_IDS, "componentIds"],
    [manifest.protocolDefinition.inverseProtocol, INVERSE_PROTOCOL,
      "inverseProtocol"],
    [manifest.protocolDefinition.eventFreeCaseProtocol,
      EVENT_FREE_CASE_PROTOCOL, "eventFreeCaseProtocol"],
    [manifest.protocolDefinition.identityHoldProtocol,
      IDENTITY_HOLD_PROTOCOL, "identityHoldProtocol"],
    [manifest.protocolDefinition.prohibitedOperations,
      PROHIBITED_OPERATIONS, "prohibitedOperations"],
    [manifest.protocolDefinition.claimBoundary, CLAIM_BOUNDARY,
      "protocolDefinition.claimBoundary"],
    [manifest.implementationClaims, IMPLEMENTATION_CLAIMS,
      "implementationClaims"],
    [manifest.deferred, DEFERRED, "deferred"],
    [manifest.claimBoundary, CLAIM_BOUNDARY, "claimBoundary"],
  ];
  for (const [actual, expected, field] of exactInventories) {
    if (canonicalizeJson(actual) !== canonicalizeJson(expected)) {
      throw new Error(
        `Phase B1 quiescent-reference ${field} inventory drifted`,
      );
    }
  }
}

export function validatePhaseB1QuiescentReferenceEvidenceManifestV1(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1QuiescentReferenceEvidenceManifestV1 {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(manifest);
  assertCanonicalPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1(
    manifest.protocolDefinition,
  );
  assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
    manifest,
  );
  if (
    manifest.manifestId !== PHASE_B1_QUIESCENT_REFERENCE_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
    || manifest.testOnly !== true
  ) throw new Error("Phase B1 quiescent-reference manifest identity drifted");
  assertCanonicalSha256(
    phaseB1QuiescentReferenceEvidenceManifestHashPayloadV1(manifest),
    manifest.contentSha256,
    sha256Hex,
  );
  verifyDirectParentGraphManifest(sha256Hex);

  const protocol = manifest.protocolDefinition;
  const expected = buildPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1();
  const identityChecks = [
    protocol.slsModes === SLS_MODES,
    protocol.directParent === DIRECT_PARENT,
    protocol.componentIds === COMPONENT_IDS,
    protocol.inverseProtocol === INVERSE_PROTOCOL,
    protocol.inverseProtocol.policy
      === PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
    protocol.eventFreeCaseProtocol === EVENT_FREE_CASE_PROTOCOL,
    protocol.eventFreeCaseProtocol.policy
      === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1,
    protocol.identityHoldProtocol === IDENTITY_HOLD_PROTOCOL,
    protocol.identityHoldProtocol.policy
      === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1,
    protocol.identityHoldProtocol.dtGridSec
      === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
    protocol.prohibitedOperations === PROHIBITED_OPERATIONS,
    protocol.claimBoundary === CLAIM_BOUNDARY,
    manifest.implementationClaims === IMPLEMENTATION_CLAIMS,
    manifest.deferred === DEFERRED,
    manifest.claimBoundary === CLAIM_BOUNDARY,
  ];
  const bindingValues = Object.freeze({
    protocolDefinitionSha256: protocol,
    directParentSha256: protocol.directParent,
    componentIdsSha256: protocol.componentIds,
    inverseProtocolSha256: protocol.inverseProtocol,
    inversePolicySha256: protocol.inverseProtocol.policy,
    eventFreeCaseProtocolSha256: protocol.eventFreeCaseProtocol,
    eventFreeCasePolicySha256: protocol.eventFreeCaseProtocol.policy,
    identityHoldProtocolSha256: protocol.identityHoldProtocol,
    identityHoldPolicySha256: protocol.identityHoldProtocol.policy,
    identityHoldDtGridSha256: protocol.identityHoldProtocol.dtGridSec,
    prohibitedOperationsSha256: protocol.prohibitedOperations,
    claimBoundarySha256: protocol.claimBoundary,
  });
  const bindingChecks = Object.entries(bindingValues).map(([field, value]) =>
    manifest.bindings[field as keyof typeof manifest.bindings]
      === computeCanonicalSha256(value, sha256Hex));
  if (
    canonicalizeJson(protocol) !== canonicalizeJson(expected)
    || identityChecks.some((value) => !value)
    || bindingChecks.some((value) => !value)
  ) throw new Error("Phase B1 quiescent-reference manifest binding drifted");

  const narrowTrueClaims = Object.entries(protocol.claimBoundary)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
  if (
    protocol.slsModes.join(",") !== "on,off"
    || protocol.inverseProtocol.referenceCoordinateMap.dimension !== 4
    || protocol.inverseProtocol.refinement.factors.join(",") !== "2,4,8"
    || protocol.inverseProtocol.failureProbes.injectedAttemptIndices.join(",")
      !== "0,1"
    || protocol.identityHoldProtocol.dtGridSec.join(",")
      !== "0.000125,0.00025,0.0005"
    || protocol.identityHoldProtocol.acceptedNewtonStepCount !== 0
    || protocol.identityHoldProtocol.eventFree !== true
    || Object.values(protocol.prohibitedOperations)
      .some((value) => value !== false)
    || narrowTrueClaims.join(",")
      !== "projectSyntheticQuiescentPressureReferenceInverse,instantaneousHydraulicQuiescence,projectSyntheticQuiescentReferenceEventFreeCase,projectSyntheticToleranceCertifiedIdentityHold"
    || Object.values(manifest.implementationClaims)
      .some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
  ) throw new Error("Phase B1 quiescent-reference inventory drifted");
  return manifest;
}

export function phaseB1QuiescentReferenceEvidenceManifestHashPayloadV1(
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
): PhaseB1QuiescentReferenceEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function verifyDirectParentGraphManifest(
  sha256Hex: CanonicalSha256HexProvider,
): void {
  const parent =
    buildPhaseB1EtaOneLandCoupledFiniteVolumeGraphEvidenceManifestV1(
      sha256Hex,
    );
  if (
    parent.contentSha256
      !== PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1
  ) throw new Error(
    "Phase B1 quiescent-reference direct-parent graph manifest drifted",
  );
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
  if (!Object.isFrozen(value)) {
    throw new Error(`${path} must be frozen`);
  }
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
