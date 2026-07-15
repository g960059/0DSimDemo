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
  PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
  type PhaseB0PublishedTriSegRootResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
  runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1,
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
  type PhaseB0TriSegEnvelopeDirectedEdgeAuditV1,
  type PhaseB0TriSegEnvelopeNodeAuditV1,
  type PhaseB0TriSegEnvelopePathAttemptV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";
import {
  PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeEvidenceManifestV1";
import {
  PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";

export const PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NUMERICAL_EVIDENCE_V1_ID =
  "phase-b0-published-taylor-triseg-finite-supported-envelope-numerical-evidence-v1" as const;

type CoordinateTraceV1 = Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}>;

type LoadPointTraceV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeNodeTraceV1 = Readonly<{
  nodeId: string;
  rootId: string;
  rootAlgorithmicJacobianId: string;
  oracleId: string;
  staticAuditId: string;
  loadPoint: LoadPointTraceV1;
  coordinates: CoordinateTraceV1;
  bloodVolumesM3: Readonly<{
    LA: number;
    LV: number;
    SA: number;
    SV: number;
    RA: number;
    RV: number;
    PA: number;
    PV: number;
  }>;
  totalBloodVolumeDifferenceM3: number;
  relativeTotalBloodVolumeDifference: number;
  allBloodVolumesPositive: boolean;
  unchangedCompartmentsExact: boolean;
  ledgerAccepted: boolean;
  taylorDomainPass: boolean;
  scaledRootResidualInfinityNorm: number;
  scaledRootUpdateInfinityNorm: number;
  rootSigmaMinimum: number;
  rootConditionNumber2: number;
  staticRestoringClassification: string;
  staticRestoringInertia: Readonly<{
    positive: number;
    neutral: number;
    negative: number;
  }>;
  robustRestoringMargin: number;
  generalizedForceTransformAuditDifference2: number;
  independentJacobianScaledStep: number;
  independentJacobianInitialCoordinates: CoordinateTraceV1;
  independentJacobianRootId: string;
  independentJacobianAlgorithmicJacobianId: string;
  independentJacobianCoordinates: CoordinateTraceV1;
  independentJacobianCoordinateAgreementScaledInfinityNorm: number;
  independentJacobianClassification: string;
  independentJacobianClassificationMatches: boolean;
  independentJacobianStepAuditPass: boolean;
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
}>;

type RootTraceV1 = Readonly<{
  converged: boolean;
  rootId: string;
  algorithmicJacobianId: string;
  coordinates: CoordinateTraceV1 | null;
  rollbackCoordinates: CoordinateTraceV1 | null;
  lastAcceptedCoordinates: CoordinateTraceV1 | null;
  failureReason: string | null;
  failureMessage: string | null;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeAttemptTraceV1 = Readonly<{
  refinementFactor: 2 | 4 | 8 | 16 | 32;
  refinementTrigger:
    "none" | "hard-failure" | "fifty-percent-guard-not-met";
  continuationAuditId: string;
  pathParameterization: string;
  parameterDerivativeStencil: string;
  tangentAlgorithmicJacobianId: string | null;
  path: readonly LoadPointTraceV1[];
  anchorCoordinates: CoordinateTraceV1;
  anchorRoot: RootTraceV1;
  roots: readonly RootTraceV1[];
  segments: readonly Readonly<{
    segmentIndex: number;
    tangentAlgorithmicJacobianId: string;
    from: LoadPointTraceV1;
    to: LoadPointTraceV1;
    scaledLoadArclength: number;
    scaledLoadUnitDirection: readonly [number, number];
    parameterDerivativeActualScaledLoadStep: number;
    scaledCoordinateTangentPerUnitLoadArclength: readonly [number, number];
    tangentPredictionHalvingDifferenceScaledInfinityNorm: number;
    normalizedAugmentedTangent: readonly [number, number, number, number];
    tangentDotWithPrevious: number | null;
    predictedCoordinates: CoordinateTraceV1;
    correctedRoot: RootTraceV1;
    predictorCorrectionScaledInfinityNorm: number | null;
    predictorCorrectionToAcceptedCoordinateStepRatio: number | null;
    acceptedCoordinateStepScaledInfinityNorm: number | null;
  }>[];
  nodeAudits: readonly PhaseB0TriSegFiniteSupportedEnvelopeNodeTraceV1[];
  continuationFailure: Readonly<{
    phase: string;
    segmentIndex: number | null;
    reason: string;
    message: string;
    lastAcceptedCoordinates: CoordinateTraceV1;
    predictedCoordinates: CoordinateTraceV1 | null;
  }> | null;
  numericalPathAccepted: boolean;
  branchIdentityEstablished: boolean;
  branchIdentity: string;
  previousRootUse: string;
  pathNodeCount: number;
  rootCount: number;
  segmentCount: number;
  anchorCorrectionScaledInfinityNorm: number | null;
  maximumTangentPredictionHalvingDifferenceScaledInfinityNorm: number | null;
  maximumPredictorCorrectionScaledInfinityNorm: number | null;
  maximumPredictorCorrectionToAcceptedCoordinateStepRatio: number | null;
  maximumAcceptedScaledCoordinateStep: number | null;
  minimumTangentDot: number | null;
  thresholdViolations: readonly string[];
  loadScales: LoadPointTraceV1;
  allConverged: boolean;
  hardGatePass: boolean;
  fiftyPercentGuardPass: boolean;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeDirectedEdgeTraceV1 = Readonly<{
  edgeId: string;
  edgeClass: "center-spoke" | "perimeter";
  direction: "forward" | "reverse";
  sourceNodeId: string;
  destinationNodeId: string;
  attempts: readonly PhaseB0TriSegFiniteSupportedEnvelopeAttemptTraceV1[];
  selectedAttemptIndex: number;
  selectedRefinementFactor: 2 | 4 | 8 | 16 | 32;
  firstGuardPassingFactor: 2 | 4 | 8 | 16 | 32;
  selectionRuleAuditPass: boolean;
  destinationAgreementScaledInfinityNorm: number;
  rollbackCoordinatesOnFailure: CoordinateTraceV1;
  accepted: boolean;
  prohibitedOperationsAbsent: boolean;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1 = Readonly<{
  slsMode: PhaseB0SlsModeV1;
  runtimeComponentIds:
    PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1["runtimeComponentIds"];
  runtimeComponentIdentityPass: boolean;
  anchorVolumesM3: Readonly<{ LV: number; RV: number }>;
  anchorTotalBloodVolumeM3: number;
  canonicalNodeCount: number;
  directedEdgeCount: number;
  rootCensusCount: number;
  auditedSampleNodeCount: number;
  selectedRefinementFactorCounts: readonly Readonly<{
    refinementFactor: 2 | 4 | 8 | 16 | 32;
    count: number;
  }>[];
  canonicalNodes: readonly PhaseB0TriSegFiniteSupportedEnvelopeNodeTraceV1[];
  directedEdges: readonly PhaseB0TriSegFiniteSupportedEnvelopeDirectedEdgeTraceV1[];
  routeClosureAudits: Readonly<{
    centerTriangles: readonly Readonly<{
      triangleId: string;
      clockwiseTraversedEdges:
        readonly PhaseB0TriSegFiniteSupportedEnvelopeDirectedEdgeTraceV1[];
      counterclockwiseTraversedEdges:
        readonly PhaseB0TriSegFiniteSupportedEnvelopeDirectedEdgeTraceV1[];
      clockwiseClosureScaledInfinityNorm: number;
      counterclockwiseClosureScaledInfinityNorm: number;
      pass: boolean;
    }>[];
    perimeterCycles: readonly Readonly<{
      direction: "clockwise" | "counterclockwise";
      traversedEdgeKeys: readonly string[];
      traversedEdges:
        readonly PhaseB0TriSegFiniteSupportedEnvelopeDirectedEdgeTraceV1[];
      closureScaledInfinityNorm: number;
      pass: boolean;
    }>[];
    pass: boolean;
  }>;
  maximumDestinationAgreementScaledInfinityNorm: number;
  maximumReverseClosureScaledInfinityNorm: number;
  maximumScaledRootResidualInfinityNorm: number;
  maximumScaledRootUpdateInfinityNorm: number;
  minimumRootJacobianSigmaMinimum: number;
  maximumRootJacobianConditionNumber2: number;
  minimumRobustRestoringMargin: number;
  maximumGeneralizedForceTransformAuditDifference2: number;
  maximumIndependentJacobianCoordinateAgreementScaledInfinityNorm: number;
  maximumRelativeBloodVolumeDifference: number;
  rootCensus: readonly Readonly<{
    nodeId: string;
    declaredSeeds: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1.rootEnumeration.seeds;
    reverseDeclaredSeeds: readonly Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>[];
    seedCount: number;
    convergedRootCount: number;
    reverseSeedOrderConvergedRootCount: number;
    clusterCount: number;
    forwardResults: readonly RootTraceV1[];
    reverseResults: readonly RootTraceV1[];
    forwardResultCoordinates: readonly Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>[];
    reverseResultCoordinates: readonly Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>[];
    clusters: readonly Readonly<{
      representativeResultIndex: number;
      memberResultIndices: readonly number[];
      classification: string;
      coordinates: Readonly<{
        septalMidwallCapVolumeM3: number;
        junctionRadiusM: number;
      }>;
    }>[];
    acceptedBranchClusterIndex: number;
    seedOrderInvariant: boolean;
    pass: boolean;
  }>[];
  valveSmoothingStructuralIndependenceAudit: Readonly<{
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
  structuredFailureProbes: readonly Readonly<{
    probeId: string;
    direction: "forward" | "reverse";
    edgeId: string;
    injectedMaximumRefinementFactor: 2;
    pathEntryCoordinates: Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>;
    attempts: readonly PhaseB0TriSegFiniteSupportedEnvelopeAttemptTraceV1[];
    rollbackCoordinates: Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>;
    rollbackMatchesDirectionSpecificEntry: boolean;
    rejectedAttemptEndpointCoordinates: Readonly<{
      septalMidwallCapVolumeM3: number;
      junctionRadiusM: number;
    }>;
    rollbackDiffersFromRejectedAttemptEndpoint: boolean;
    prohibitedOperationsAbsent: boolean;
    pass: boolean;
  }>[];
  everyCanonicalNodeHardGatePass: boolean;
  everyCanonicalNodeFiftyPercentGuardPass: boolean;
  everyAuditedSampleNodeHardGatePass: boolean;
  everyIndependentJacobianStepAuditPass: boolean;
  everyLedgerAuditPass: boolean;
  everyLedgerUsesPvAsExactLvComplement: boolean;
  everyLedgerUsesSvAsExactRvComplement: boolean;
  everyLedgerKeepsLaRaSaPaExact: boolean;
  everyDirectedEdgeAccepted: boolean;
  everyDirectedEdgeSelectionRuleAuditPass: boolean;
  everyAttemptRecordedInDeclaredPrefix: boolean;
  everyContinuationUsesCenterFixedLoadScales: boolean;
  everySelectedAttemptFiftyPercentGuardPass: boolean;
  everyCensusSeedConverged: boolean;
  everyCensusSeedOrderInvariant: boolean;
  everyCensusClusterReported: boolean;
  componentIdentityAuditPass: boolean;
  prohibitedOperationsAbsent: boolean;
  staticValveSmoothingStructuralIndependencePass: boolean;
  routeClosurePass: boolean;
  structuredFailureRollbackPass: boolean;
  broadNegativeClaimsRemainFalse: boolean;
  finiteDeclaredGraphEnvelopePass: boolean;
  modePass: boolean;
}>;

export type PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidencePayloadV1 =
  Readonly<{
    evidenceId:
      typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NUMERICAL_EVIDENCE_V1_ID;
    manifestSha256: string;
    modes: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1
    >>;
    allModesPass: boolean;
  }>;

export type PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceCertificateV1 =
  PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidencePayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1 =
  Readonly<{
    certificate:
      PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceCertificateV1;
    results: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1
    >>;
    failureProbes: Readonly<Record<
      PhaseB0SlsModeV1,
      readonly PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1[]
    >>;
  }>;

const CANONICAL_FINITE_ENVELOPE_NUMERICAL_EVIDENCE_BUNDLES_V1 =
  new WeakSet<object>();

export function buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
  manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
    manifest,
  );
  const results = Object.freeze({
    on: runPhaseB0TriSegFiniteSupportedEnvelopeV1("on", sha256Hex),
    off: runPhaseB0TriSegFiniteSupportedEnvelopeV1("off", sha256Hex),
  });
  const failureProbes = Object.freeze({
    on: Object.freeze([
      runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1(
        "on",
        "forward",
        sha256Hex,
      ),
      runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1(
        "on",
        "reverse",
        sha256Hex,
      ),
    ]),
    off: Object.freeze([
      runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1(
        "off",
        "forward",
        sha256Hex,
      ),
      runPhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1(
        "off",
        "reverse",
        sha256Hex,
      ),
    ]),
  });
  const modes = Object.freeze({
    on: summarizeMode(results.on, failureProbes.on, manifest),
    off: summarizeMode(results.off, failureProbes.off, manifest),
  });
  const payload:
    PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidencePayloadV1 =
    Object.freeze({
      evidenceId:
        PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NUMERICAL_EVIDENCE_V1_ID,
      manifestSha256: manifest.contentSha256,
      modes,
      allModesPass: modes.on.modePass && modes.off.modePass,
    });
  canonicalizeJson(payload);
  const certificate = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  const bundle = Object.freeze({ certificate, results, failureProbes });
  CANONICAL_FINITE_ENVELOPE_NUMERICAL_EVIDENCE_BUNDLES_V1.add(bundle);
  return bundle;
}

export function assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
  bundle: PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1,
  manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
): PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
    manifest,
  );
  if (
    bundle === null
    || typeof bundle !== "object"
    || !CANONICAL_FINITE_ENVELOPE_NUMERICAL_EVIDENCE_BUNDLES_V1.has(bundle)
    || bundle.certificate.manifestSha256 !== manifest.contentSha256
  ) throw new Error(
    "Phase B0 finite-envelope numerical evidence must be canonically built for this manifest",
  );
  return bundle;
}

export function phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1(
  certificate:
    PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceCertificateV1,
): PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidencePayloadV1 {
  return Object.freeze({
    evidenceId: certificate.evidenceId,
    manifestSha256: certificate.manifestSha256,
    modes: certificate.modes,
    allModesPass: certificate.allModesPass,
  });
}

function summarizeRoot(
  root: PhaseB0PublishedTriSegRootResultV1,
): RootTraceV1 {
  if (root.converged === false) {
    return Object.freeze({
      converged: false,
      rootId: root.rootId,
      algorithmicJacobianId: root.algorithmicJacobianId,
      coordinates: null,
      rollbackCoordinates: Object.freeze({ ...root.rollbackCoordinates }),
      lastAcceptedCoordinates: Object.freeze({ ...root.lastAcceptedCoordinates }),
      failureReason: root.reason,
      failureMessage: root.message,
    });
  }
  return Object.freeze({
    converged: true,
    rootId: root.rootId,
    algorithmicJacobianId: root.algorithmicJacobianId,
    coordinates: Object.freeze({ ...root.coordinates }),
    rollbackCoordinates: null,
    lastAcceptedCoordinates: null,
    failureReason: null,
    failureMessage: null,
  });
}

function summarizeNodeAudit(
  node: PhaseB0TriSegEnvelopeNodeAuditV1,
): PhaseB0TriSegFiniteSupportedEnvelopeNodeTraceV1 {
  const independentRoot = node.independentJacobianStepAudit.root;
  const independentClassification =
    node.independentJacobianStepAudit.classification;
  if (!independentRoot.converged || independentClassification === null) {
    throw new Error(
      `finite-envelope node ${node.nodeId} has no independent converged audit`,
    );
  }
  return Object.freeze({
    nodeId: node.nodeId,
    rootId: node.root.rootId,
    rootAlgorithmicJacobianId: node.root.algorithmicJacobianId,
    oracleId: node.root.oracle.oracleId,
    staticAuditId: node.staticAudit.auditId,
    loadPoint: Object.freeze({
      leftVentricularCavityVolumeM3:
        node.root.geometry.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        node.root.geometry.rightVentricularCavityVolumeM3,
    }),
    coordinates: Object.freeze({ ...node.coordinates }),
    bloodVolumesM3: Object.freeze({ ...node.ledger.bloodVolumesM3 }),
    totalBloodVolumeDifferenceM3: node.ledger.totalBloodVolumeDifferenceM3,
    relativeTotalBloodVolumeDifference:
      node.ledger.relativeTotalBloodVolumeDifference,
    allBloodVolumesPositive: node.ledger.allVolumesPositive,
    unchangedCompartmentsExact: node.ledger.unchangedCompartmentsExact,
    ledgerAccepted: node.ledger.accepted,
    taylorDomainPass: node.taylorDomainPass,
    scaledRootResidualInfinityNorm:
      node.staticAudit.rootRegularity.scaledResidualInfinityNorm,
    scaledRootUpdateInfinityNorm:
      node.staticAudit.rootRegularity.scaledUpdateInfinityNorm,
    rootSigmaMinimum: node.staticAudit.rootRegularity.sigmaMinimum,
    rootConditionNumber2: node.staticAudit.rootRegularity.conditionNumber2,
    staticRestoringClassification:
      node.staticAudit.scaledRestoringTangent.classification,
    staticRestoringInertia: Object.freeze({
      ...node.staticAudit.scaledRestoringTangent.inertia,
    }),
    robustRestoringMargin:
      node.staticAudit.scaledRestoringTangent.robustSignedMargin,
    generalizedForceTransformAuditDifference2:
      node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm,
    independentJacobianScaledStep:
      node.independentJacobianStepAudit.scaledStep,
    independentJacobianInitialCoordinates: Object.freeze({
      ...node.independentJacobianStepAudit.initialCoordinates,
    }),
    independentJacobianRootId: independentRoot.rootId,
    independentJacobianAlgorithmicJacobianId:
      independentRoot.algorithmicJacobianId,
    independentJacobianCoordinates:
      Object.freeze({ ...independentRoot.coordinates }),
    independentJacobianCoordinateAgreementScaledInfinityNorm: requireMetric(
      node.independentJacobianStepAudit
        .coordinateAgreementScaledInfinityNorm,
      `node ${node.nodeId} independent agreement`,
    ),
    independentJacobianClassification: independentClassification,
    independentJacobianClassificationMatches:
      node.independentJacobianStepAudit.classificationMatches,
    independentJacobianStepAuditPass:
      node.independentJacobianStepAudit.pass,
    hardGatePass: node.hardGatePass,
    fiftyPercentGuardPass: node.fiftyPercentGuardPass,
  });
}

function summarizeAttempt(
  attempt: PhaseB0TriSegEnvelopePathAttemptV1,
): PhaseB0TriSegFiniteSupportedEnvelopeAttemptTraceV1 {
  const continuation = attempt.continuation;
  return Object.freeze({
    refinementFactor: attempt.refinementFactor,
    refinementTrigger: attempt.refinementTrigger,
    continuationAuditId: continuation.auditId,
    pathParameterization: continuation.pathParameterization,
    parameterDerivativeStencil: continuation.parameterDerivativeStencil,
    tangentAlgorithmicJacobianId:
      continuation.tangentAlgorithmicJacobianId,
    path: Object.freeze(continuation.path.map((point) => Object.freeze({
      ...point,
    }))),
    anchorCoordinates: Object.freeze({ ...continuation.anchorCoordinates }),
    anchorRoot: summarizeRoot(continuation.anchorRoot),
    roots: Object.freeze(continuation.roots.map(summarizeRoot)),
    segments: Object.freeze(continuation.segments.map((segment) =>
      Object.freeze({
        segmentIndex: segment.segmentIndex,
        tangentAlgorithmicJacobianId:
          segment.tangentAlgorithmicJacobianId,
        from: Object.freeze({ ...segment.from }),
        to: Object.freeze({ ...segment.to }),
        scaledLoadArclength: segment.scaledLoadArclength,
        scaledLoadUnitDirection: Object.freeze([
          segment.scaledLoadUnitDirection[0],
          segment.scaledLoadUnitDirection[1],
        ] as const),
        parameterDerivativeActualScaledLoadStep:
          segment.parameterDerivativeActualScaledLoadStep,
        scaledCoordinateTangentPerUnitLoadArclength: Object.freeze([
          segment.scaledCoordinateTangentPerUnitLoadArclength[0],
          segment.scaledCoordinateTangentPerUnitLoadArclength[1],
        ] as const),
        tangentPredictionHalvingDifferenceScaledInfinityNorm:
          segment.tangentPredictionHalvingDifferenceScaledInfinityNorm,
        normalizedAugmentedTangent: Object.freeze([
          segment.normalizedAugmentedTangent[0],
          segment.normalizedAugmentedTangent[1],
          segment.normalizedAugmentedTangent[2],
          segment.normalizedAugmentedTangent[3],
        ] as const),
        tangentDotWithPrevious: segment.tangentDotWithPrevious,
        predictedCoordinates: Object.freeze({ ...segment.predictedCoordinates }),
        correctedRoot: summarizeRoot(segment.correctedRoot),
        predictorCorrectionScaledInfinityNorm:
          segment.predictorCorrectionScaledInfinityNorm,
        predictorCorrectionToAcceptedCoordinateStepRatio:
          segment.predictorCorrectionToAcceptedCoordinateStepRatio,
        acceptedCoordinateStepScaledInfinityNorm:
          segment.acceptedCoordinateStepScaledInfinityNorm,
      }))),
    nodeAudits: Object.freeze(attempt.nodeAudits.map(summarizeNodeAudit)),
    continuationFailure: continuation.failure === null
      ? null
      : Object.freeze({
        phase: continuation.failure.phase,
        segmentIndex: continuation.failure.segmentIndex,
        reason: continuation.failure.reason,
        message: continuation.failure.message,
        lastAcceptedCoordinates: Object.freeze({
          ...continuation.failure.lastAcceptedCoordinates,
        }),
        predictedCoordinates: continuation.failure.predictedCoordinates === null
          ? null
          : Object.freeze({ ...continuation.failure.predictedCoordinates }),
      }),
    numericalPathAccepted: continuation.numericalPathAccepted,
    branchIdentityEstablished: continuation.branchIdentityEstablished,
    branchIdentity: continuation.branchIdentity,
    previousRootUse: continuation.previousRootUse,
    pathNodeCount: continuation.path.length,
    rootCount: continuation.roots.length,
    segmentCount: continuation.segments.length,
    anchorCorrectionScaledInfinityNorm:
      continuation.anchorCorrectionScaledInfinityNorm,
    maximumTangentPredictionHalvingDifferenceScaledInfinityNorm:
      continuation.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm:
      continuation.maximumPredictorCorrectionScaledInfinityNorm,
    maximumPredictorCorrectionToAcceptedCoordinateStepRatio:
      continuation.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    maximumAcceptedScaledCoordinateStep:
      continuation.maximumAcceptedScaledCoordinateStep,
    minimumTangentDot: continuation.minimumTangentDot,
    thresholdViolations: Object.freeze([...continuation.thresholdViolations]),
    loadScales: Object.freeze({ ...continuation.loadScales }),
    allConverged: continuation.allConverged,
    hardGatePass: attempt.hardGatePass,
    fiftyPercentGuardPass: attempt.fiftyPercentGuardPass,
  });
}

function summarizeDirectedEdge(
  edge: PhaseB0TriSegEnvelopeDirectedEdgeAuditV1,
): PhaseB0TriSegFiniteSupportedEnvelopeDirectedEdgeTraceV1 {
  if (
    edge.selectedAttemptIndex === null
    || edge.selectedRefinementFactor === null
    || edge.firstGuardPassingFactor === null
  ) throw new Error(
    `finite-envelope edge ${edge.edgeId}:${edge.direction} has no selected attempt`,
  );
  const prohibitedOperationsAbsent = !edge.hiddenSubdivisionApplied
    && !edge.pseudoArclengthApplied
    && !edge.rootRankingApplied
    && edge.attempts.every((attempt) =>
      !attempt.continuation.nearestRootSelectionApplied
        && !attempt.continuation.minimumResidualSelectionApplied
        && !attempt.continuation.maximumJunctionRadiusSelectionApplied
        && !attempt.continuation.forcedPreviousSeptumApplied
        && !attempt.continuation.pseudoArclengthApplied
        && !attempt.continuation.supportedEnvelopeClaimed);
  return Object.freeze({
    edgeId: edge.edgeId,
    edgeClass: edge.edgeClass,
    direction: edge.direction,
    sourceNodeId: edge.sourceNodeId,
    destinationNodeId: edge.destinationNodeId,
    attempts: Object.freeze(edge.attempts.map(summarizeAttempt)),
    selectedAttemptIndex: edge.selectedAttemptIndex,
    selectedRefinementFactor: edge.selectedRefinementFactor,
    firstGuardPassingFactor: edge.firstGuardPassingFactor,
    selectionRuleAuditPass: edge.selectionRuleAuditPass,
    destinationAgreementScaledInfinityNorm: requireMetric(
      edge.destinationAgreementScaledInfinityNorm,
      `${edge.edgeId}:${edge.direction} destination agreement`,
    ),
    rollbackCoordinatesOnFailure:
      Object.freeze({ ...edge.rollbackCoordinatesOnFailure }),
    accepted: edge.accepted,
    prohibitedOperationsAbsent,
  });
}

function summarizeMode(
  result: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  failureProbes:
    readonly PhaseB0TriSegFiniteSupportedEnvelopeFailureProbeV1[],
  manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
): PhaseB0TriSegFiniteSupportedEnvelopeModeSummaryV1 {
  const policy = PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1;
  const allAttempts = result.directedEdges.flatMap((edge) => edge.attempts);
  const routeAttempts = [
    ...result.routeClosureAudits.centerTriangles.flatMap((triangle) => [
      ...triangle.clockwiseTraversedEdges,
      ...triangle.counterclockwiseTraversedEdges,
    ]),
    ...result.routeClosureAudits.perimeterCycles.flatMap(
      (cycle) => cycle.traversedEdges,
    ),
  ].flatMap((edge) => edge.attempts);
  const probeAttempts = failureProbes.flatMap((probe) => probe.attempts);
  const allRuntimeAttempts = [...allAttempts, ...routeAttempts, ...probeAttempts];
  const auditedSampleNodes = [
    ...result.canonicalNodes,
    ...allRuntimeAttempts.flatMap(
      (attempt) => attempt.nodeAudits,
    ),
  ];
  const selectedAttempts = result.directedEdges.map((edge) =>
    edge.selectedAttemptIndex === null
      ? null
      : edge.attempts[edge.selectedAttemptIndex]);
  const selectedRefinementFactorCounts = Object.freeze(
    policy.adaptiveRefinement.refinementFactors.map((refinementFactor) =>
      Object.freeze({
        refinementFactor,
        count: result.directedEdges.filter((edge) =>
          edge.selectedRefinementFactor === refinementFactor).length,
      })),
  );
  const canonicalNodes = Object.freeze(
    result.canonicalNodes.map(summarizeNodeAudit),
  );
  const directedEdges = Object.freeze(
    result.directedEdges.map(summarizeDirectedEdge),
  );
  const routeClosureAudits = Object.freeze({
    centerTriangles: Object.freeze(
      result.routeClosureAudits.centerTriangles.map((triangle) => Object.freeze({
        triangleId: triangle.triangleId,
        clockwiseTraversedEdges: Object.freeze(
          triangle.clockwiseTraversedEdges.map(summarizeDirectedEdge),
        ),
        counterclockwiseTraversedEdges: Object.freeze(
          triangle.counterclockwiseTraversedEdges.map(summarizeDirectedEdge),
        ),
        clockwiseClosureScaledInfinityNorm: requireMetric(
          triangle.clockwiseClosureScaledInfinityNorm,
          `${triangle.triangleId} clockwise closure`,
        ),
        counterclockwiseClosureScaledInfinityNorm: requireMetric(
          triangle.counterclockwiseClosureScaledInfinityNorm,
          `${triangle.triangleId} counterclockwise closure`,
        ),
        pass: triangle.pass,
      })),
    ),
    perimeterCycles: Object.freeze(
      result.routeClosureAudits.perimeterCycles.map((cycle) => Object.freeze({
        direction: cycle.direction,
        traversedEdgeKeys: Object.freeze(cycle.traversedEdges.map(
          (edge) => `${edge.edgeId}:${edge.direction}`,
        )),
        traversedEdges: Object.freeze(
          cycle.traversedEdges.map(summarizeDirectedEdge),
        ),
        closureScaledInfinityNorm: requireMetric(
          cycle.closureScaledInfinityNorm,
          `${cycle.direction} perimeter closure`,
        ),
        pass: cycle.pass,
      })),
    ),
    pass: result.routeClosureAudits.pass,
  });
  const rootCensus = Object.freeze(result.rootCensus.map((census) => {
    const acceptedBranchClusterIndex = census.acceptedBranchClusterIndex;
    if (acceptedBranchClusterIndex === null) {
      throw new Error(
        `finite-envelope census ${census.nodeId} has no accepted branch cluster`,
      );
    }
    return Object.freeze({
      nodeId: census.nodeId,
      declaredSeeds: policy.rootEnumeration.seeds,
      reverseDeclaredSeeds: Object.freeze(
        [...policy.rootEnumeration.seeds].reverse().map((seed) =>
          Object.freeze({ ...seed })),
      ),
      seedCount: census.seedCount,
      convergedRootCount: census.results.filter((entry) => entry.converged)
        .length,
      reverseSeedOrderConvergedRootCount: census.reverseSeedOrderResults
        .filter((entry) => entry.converged).length,
      clusterCount: census.clusters.length,
      forwardResults: Object.freeze(census.results.map(summarizeRoot)),
      reverseResults: Object.freeze(
        census.reverseSeedOrderResults.map(summarizeRoot),
      ),
      forwardResultCoordinates: Object.freeze(census.results.map(
        (entry, index) => convergedCoordinates(
          entry,
          `${census.nodeId} forward seed ${index}`,
        ),
      )),
      reverseResultCoordinates: Object.freeze(
        census.reverseSeedOrderResults.map((entry, index) =>
          convergedCoordinates(
            entry,
            `${census.nodeId} reverse seed ${index}`,
          )),
      ),
      clusters: Object.freeze(census.clusters.map((cluster) => Object.freeze({
        representativeResultIndex: cluster.representativeResultIndex,
        memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
        classification: cluster.classification,
        coordinates: Object.freeze({ ...cluster.coordinates }),
      }))),
      acceptedBranchClusterIndex,
      seedOrderInvariant: census.seedOrderInvariant,
      pass: census.pass,
    });
  }));
  const valveSmoothingStructuralIndependenceAudit = Object.freeze({
    claim: result.staticValveSmoothingStructuralIndependenceAudit.claim,
    cases: Object.freeze(
      result.staticValveSmoothingStructuralIndependenceAudit.cases.map(
        (entry) => Object.freeze({
          pressureGateWidthPa: entry.pressureGateWidthPa,
          flowSmoothingM3PerSec: entry.flowSmoothingM3PerSec,
          maximumWallStressAbsoluteDifferencePa:
            entry.maximumWallStressAbsoluteDifferencePa,
          maximumTriSegResidualAbsoluteDifferenceNPerM:
            entry.maximumTriSegResidualAbsoluteDifferenceNPerM,
          pass: entry.pass,
        }),
      ),
    ),
    pass: result.staticValveSmoothingStructuralIndependenceAudit.pass,
  });
  const structuredFailureProbes = Object.freeze(failureProbes.map((probe) => {
    const prohibitedOperationsAbsent = !probe.hiddenSubdivisionApplied
      && !probe.pseudoArclengthApplied
      && !probe.rootRankingApplied
      && probe.attempts.every((attempt) =>
        !attempt.continuation.nearestRootSelectionApplied
          && !attempt.continuation.minimumResidualSelectionApplied
          && !attempt.continuation.maximumJunctionRadiusSelectionApplied
          && !attempt.continuation.forcedPreviousSeptumApplied
          && !attempt.continuation.pseudoArclengthApplied
          && !attempt.continuation.supportedEnvelopeClaimed);
    const pass = probe.attempts.length === 1
      && probe.attempts[0].refinementFactor === 2
      && probe.selectedAttemptIndex === null
      && !probe.accepted
      && probe.rollbackMatchesDirectionSpecificEntry
      && probe.rollbackDiffersFromRejectedAttemptEndpoint
      && prohibitedOperationsAbsent;
    return Object.freeze({
      probeId: probe.probeId,
      direction: probe.direction,
      edgeId: probe.edgeId,
      injectedMaximumRefinementFactor: probe.injectedMaximumRefinementFactor,
      pathEntryCoordinates: Object.freeze({ ...probe.pathEntryCoordinates }),
      attempts: Object.freeze(probe.attempts.map(summarizeAttempt)),
      rollbackCoordinates: Object.freeze({ ...probe.rollbackCoordinates }),
      rollbackMatchesDirectionSpecificEntry:
        probe.rollbackMatchesDirectionSpecificEntry,
      rejectedAttemptEndpointCoordinates: Object.freeze({
        ...probe.rejectedAttemptEndpointCoordinates,
      }),
      rollbackDiffersFromRejectedAttemptEndpoint:
        probe.rollbackDiffersFromRejectedAttemptEndpoint,
      prohibitedOperationsAbsent,
      pass,
    });
  }));
  const maximumDestinationAgreementScaledInfinityNorm = requireMetric(
    result.maximumDestinationAgreementScaledInfinityNorm,
    "maximumDestinationAgreementScaledInfinityNorm",
  );
  const maximumReverseClosureScaledInfinityNorm = requireMetric(
    result.maximumReverseClosureScaledInfinityNorm,
    "maximumReverseClosureScaledInfinityNorm",
  );
  const maximumScaledRootResidualInfinityNorm = maximum(
    auditedSampleNodes.map((node) =>
      node.staticAudit.rootRegularity.scaledResidualInfinityNorm),
    "maximumScaledRootResidualInfinityNorm",
  );
  const maximumScaledRootUpdateInfinityNorm = maximum(
    auditedSampleNodes.map((node) =>
      node.staticAudit.rootRegularity.scaledUpdateInfinityNorm),
    "maximumScaledRootUpdateInfinityNorm",
  );
  const minimumRootJacobianSigmaMinimum = minimum(
    auditedSampleNodes.map((node) =>
      node.staticAudit.rootRegularity.sigmaMinimum),
    "minimumRootJacobianSigmaMinimum",
  );
  const maximumRootJacobianConditionNumber2 = maximum(
    auditedSampleNodes.map((node) =>
      node.staticAudit.rootRegularity.conditionNumber2),
    "maximumRootJacobianConditionNumber2",
  );
  const minimumRobustRestoringMargin = minimum(
    auditedSampleNodes.map((node) =>
      node.staticAudit.scaledRestoringTangent.robustSignedMargin),
    "minimumRobustRestoringMargin",
  );
  const maximumGeneralizedForceTransformAuditDifference2 = maximum(
    auditedSampleNodes.map((node) =>
      node.staticAudit.generalizedForceTransformAudit.differenceTwoNorm),
    "maximumGeneralizedForceTransformAuditDifference2",
  );
  const maximumIndependentJacobianCoordinateAgreementScaledInfinityNorm =
    maximum(auditedSampleNodes.map((node) => requireMetric(
      node.independentJacobianStepAudit
        .coordinateAgreementScaledInfinityNorm,
      "independentJacobianCoordinateAgreementScaledInfinityNorm",
    )), "maximumIndependentJacobianCoordinateAgreementScaledInfinityNorm");
  const maximumRelativeBloodVolumeDifference = maximum(
    auditedSampleNodes.map((node) =>
      node.ledger.relativeTotalBloodVolumeDifference),
    "maximumRelativeBloodVolumeDifference",
  );
  const everyCanonicalNodeHardGatePass = result.canonicalNodes.every(
    (node) => node.hardGatePass,
  );
  const everyCanonicalNodeFiftyPercentGuardPass = result.canonicalNodes.every(
    (node) => node.fiftyPercentGuardPass,
  );
  const everyAuditedSampleNodeHardGatePass = auditedSampleNodes.every(
    (node) => node.hardGatePass,
  );
  const everyIndependentJacobianStepAuditPass = auditedSampleNodes.every(
    (node) => node.independentJacobianStepAudit.pass,
  );
  const everyLedgerAuditPass = auditedSampleNodes.every(
    (node) => node.ledger.accepted,
  );
  const centerLedger = result.canonicalNodes.find((node) => node.nodeId === "C")
    ?.ledger.bloodVolumesM3;
  if (centerLedger === undefined) {
    throw new Error("finite-envelope numerical evidence requires center ledger");
  }
  const everyLedgerUsesPvAsExactLvComplement = auditedSampleNodes.every(
    (node) => node.ledger.bloodVolumesM3.PV
      === centerLedger.PV
        - (node.ledger.bloodVolumesM3.LV - centerLedger.LV),
  );
  const everyLedgerUsesSvAsExactRvComplement = auditedSampleNodes.every(
    (node) => node.ledger.bloodVolumesM3.SV
      === centerLedger.SV
        - (node.ledger.bloodVolumesM3.RV - centerLedger.RV),
  );
  const everyLedgerKeepsLaRaSaPaExact = auditedSampleNodes.every((node) =>
    node.ledger.bloodVolumesM3.LA === centerLedger.LA
      && node.ledger.bloodVolumesM3.RA === centerLedger.RA
      && node.ledger.bloodVolumesM3.SA === centerLedger.SA
      && node.ledger.bloodVolumesM3.PA === centerLedger.PA);
  const everyDirectedEdgeAccepted = result.directedEdges.every(
    (edge) => edge.accepted,
  );
  const everyDirectedEdgeSelectionRuleAuditPass = result.directedEdges.every(
    (edge) => edge.selectionRuleAuditPass,
  );
  const everyAttemptRecordedInDeclaredPrefix = result.directedEdges.every(
    (edge) => edge.attempts.length > 0
      && edge.attempts.every((attempt, index) =>
        attempt.refinementFactor
          === policy.adaptiveRefinement.refinementFactors[index])
      && edge.attempts.length
        <= policy.adaptiveRefinement.refinementFactors.length,
  );
  const usesCenterFixedLoadScales = (
    attempt: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1[
      "directedEdges"
    ][number]["attempts"][number],
  ) => attempt.continuation.loadScales.leftVentricularCavityVolumeM3
      === result.anchorVolumesM3.LV
    && attempt.continuation.loadScales.rightVentricularCavityVolumeM3
      === result.anchorVolumesM3.RV;
  const everyContinuationUsesCenterFixedLoadScales = allRuntimeAttempts.every(
    usesCenterFixedLoadScales,
  );
  const everySelectedAttemptFiftyPercentGuardPass = selectedAttempts.every(
    (attempt) => attempt !== null && attempt.fiftyPercentGuardPass,
  );
  const everyCensusSeedConverged = result.rootCensus.every(
    (census) => census.allSeedsAttempted && census.allSeedsConverged,
  );
  const everyCensusSeedOrderInvariant = result.rootCensus.every(
    (census) => census.seedOrderInvariant,
  );
  const everyCensusClusterReported = result.rootCensus.every(
    (census) => census.allDiscoveredClustersReported
      && !census.globalExhaustivenessClaimed
      && census.clusters.length > 0,
  );
  const runtimeRoots = [
    ...allRuntimeAttempts.flatMap((attempt) => [
      attempt.continuation.anchorRoot,
      ...attempt.continuation.roots,
      ...attempt.continuation.segments.map((segment) => segment.correctedRoot),
    ]),
    ...result.rootCensus.flatMap((census) => [
      ...census.results,
      ...census.reverseSeedOrderResults,
    ]),
  ];
  const componentIdentityAuditPass =
    result.protocolId === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
    && result.runtimeComponentIdentityPass
    && canonicalizeJson(result.runtimeComponentIds)
      === canonicalizeJson(manifest.bindings.componentIds)
    && allRuntimeAttempts.every((attempt) =>
      attempt.continuation.auditId
        === PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID
      && attempt.continuation.tangentAlgorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && attempt.continuation.segments.every((segment) =>
        segment.tangentAlgorithmicJacobianId
          === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID))
    && runtimeRoots.every((root) =>
      root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
      && root.algorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && (!root.converged
        || root.oracle.oracleId === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID))
    && auditedSampleNodes.every((node) =>
      node.root.rootId === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
      && node.root.algorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && node.root.oracle.oracleId
        === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID
      && node.staticAudit.auditId
        === PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID
      && node.independentJacobianStepAudit.root.rootId
        === PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
      && node.independentJacobianStepAudit.root.algorithmicJacobianId
        === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
      && (!node.independentJacobianStepAudit.root.converged
        || node.independentJacobianStepAudit.root.oracle.oracleId
          === PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID));
  const allRuntimeEdges = [
    ...result.directedEdges,
    ...result.routeClosureAudits.centerTriangles.flatMap((triangle) => [
      ...triangle.clockwiseTraversedEdges,
      ...triangle.counterclockwiseTraversedEdges,
    ]),
    ...result.routeClosureAudits.perimeterCycles.flatMap(
      (cycle) => cycle.traversedEdges,
    ),
  ];
  const prohibitedOperationsAbsent = allRuntimeEdges.every((edge) =>
    !edge.hiddenSubdivisionApplied
      && !edge.pseudoArclengthApplied
      && !edge.rootRankingApplied)
    && failureProbes.every((probe) =>
      !probe.hiddenSubdivisionApplied
      && !probe.pseudoArclengthApplied
      && !probe.rootRankingApplied)
    && allRuntimeAttempts.every((attempt) =>
      !attempt.continuation.nearestRootSelectionApplied
        && !attempt.continuation.minimumResidualSelectionApplied
        && !attempt.continuation.maximumJunctionRadiusSelectionApplied
        && !attempt.continuation.forcedPreviousSeptumApplied
        && !attempt.continuation.pseudoArclengthApplied
        && !attempt.continuation.supportedEnvelopeClaimed);
  const routeClosurePass = result.routeClosureAudits.pass
    && result.routeClosureAudits.centerTriangles.length === 8
    && result.routeClosureAudits.centerTriangles.every((entry) => entry.pass)
    && result.routeClosureAudits.perimeterCycles.length === 2
    && result.routeClosureAudits.perimeterCycles.every((entry) => entry.pass);
  const structuredFailureRollbackPass = structuredFailureProbes.length === 2
    && structuredFailureProbes.some((probe) => probe.direction === "forward")
    && structuredFailureProbes.some((probe) => probe.direction === "reverse")
    && structuredFailureProbes.every((probe) => probe.pass);
  const broadNegativeClaimsRemainFalse = !result.continuousRectangleInteriorPass
    && !result.globalRootUniquenessPass
    && !result.energeticStabilityPass
    && !result.phaseB0OverallAcceptancePass
    && !result.phaseB1LandCoupledVolumeEnvelopePass
    && !result.physiologicalValidationPass
    && !result.releaseRuntimePass;
  const modePass = result.canonicalNodes.length === 9
    && result.directedEdges.length === 32
    && result.rootCensus.length === 9
    && everyCanonicalNodeHardGatePass
    && everyCanonicalNodeFiftyPercentGuardPass
    && everyAuditedSampleNodeHardGatePass
    && everyIndependentJacobianStepAuditPass
    && everyLedgerAuditPass
    && everyLedgerUsesPvAsExactLvComplement
    && everyLedgerUsesSvAsExactRvComplement
    && everyLedgerKeepsLaRaSaPaExact
    && everyDirectedEdgeAccepted
    && everyDirectedEdgeSelectionRuleAuditPass
    && everyAttemptRecordedInDeclaredPrefix
    && everyContinuationUsesCenterFixedLoadScales
    && everySelectedAttemptFiftyPercentGuardPass
    && everyCensusSeedConverged
    && everyCensusSeedOrderInvariant
    && everyCensusClusterReported
    && componentIdentityAuditPass
    && prohibitedOperationsAbsent
    && valveSmoothingStructuralIndependenceAudit.cases.length === 9
    && valveSmoothingStructuralIndependenceAudit.pass
    && routeClosurePass
    && structuredFailureRollbackPass
    && broadNegativeClaimsRemainFalse
    && result.finiteDeclaredGraphEnvelopePass;
  return Object.freeze({
    slsMode: result.slsMode,
    runtimeComponentIds: Object.freeze({ ...result.runtimeComponentIds }),
    runtimeComponentIdentityPass: result.runtimeComponentIdentityPass,
    anchorVolumesM3: Object.freeze({ ...result.anchorVolumesM3 }),
    anchorTotalBloodVolumeM3: result.anchorTotalBloodVolumeM3,
    canonicalNodeCount: result.canonicalNodes.length,
    directedEdgeCount: result.directedEdges.length,
    rootCensusCount: result.rootCensus.length,
    auditedSampleNodeCount: auditedSampleNodes.length,
    selectedRefinementFactorCounts,
    canonicalNodes,
    directedEdges,
    routeClosureAudits,
    maximumDestinationAgreementScaledInfinityNorm,
    maximumReverseClosureScaledInfinityNorm,
    maximumScaledRootResidualInfinityNorm,
    maximumScaledRootUpdateInfinityNorm,
    minimumRootJacobianSigmaMinimum,
    maximumRootJacobianConditionNumber2,
    minimumRobustRestoringMargin,
    maximumGeneralizedForceTransformAuditDifference2,
    maximumIndependentJacobianCoordinateAgreementScaledInfinityNorm,
    maximumRelativeBloodVolumeDifference,
    rootCensus,
    valveSmoothingStructuralIndependenceAudit,
    structuredFailureProbes,
    everyCanonicalNodeHardGatePass,
    everyCanonicalNodeFiftyPercentGuardPass,
    everyAuditedSampleNodeHardGatePass,
    everyIndependentJacobianStepAuditPass,
    everyLedgerAuditPass,
    everyLedgerUsesPvAsExactLvComplement,
    everyLedgerUsesSvAsExactRvComplement,
    everyLedgerKeepsLaRaSaPaExact,
    everyDirectedEdgeAccepted,
    everyDirectedEdgeSelectionRuleAuditPass,
    everyAttemptRecordedInDeclaredPrefix,
    everyContinuationUsesCenterFixedLoadScales,
    everySelectedAttemptFiftyPercentGuardPass,
    everyCensusSeedConverged,
    everyCensusSeedOrderInvariant,
    everyCensusClusterReported,
    componentIdentityAuditPass,
    prohibitedOperationsAbsent,
    staticValveSmoothingStructuralIndependencePass:
      result.staticValveSmoothingStructuralIndependenceAudit.pass,
    routeClosurePass,
    structuredFailureRollbackPass,
    broadNegativeClaimsRemainFalse,
    finiteDeclaredGraphEnvelopePass: result.finiteDeclaredGraphEnvelopePass,
    modePass,
  });
}

function maximum(values: readonly number[], field: string): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${field} requires a nonempty finite sample`);
  }
  return Math.max(...values);
}

function minimum(values: readonly number[], field: string): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${field} requires a nonempty finite sample`);
  }
  return Math.min(...values);
}

function requireMetric(value: number | null, field: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function convergedCoordinates(
  result: PhaseB0PublishedTriSegRootResultV1,
  field: string,
) {
  if (result.converged === false) {
    throw new Error(`${field} did not converge: ${result.message}`);
  }
  return Object.freeze({ ...result.coordinates });
}
