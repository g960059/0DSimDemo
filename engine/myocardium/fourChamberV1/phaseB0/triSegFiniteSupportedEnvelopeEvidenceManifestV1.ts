import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
  PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1,
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegNaturalParameterContinuationV1";
import {
  PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringAuditV1";
import {
  PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID,
  buildPhaseB0TriSegStaticRestoringGateManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/valveNumericalPolicyV1";
import {
  PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
  validateStabilizedTriSegAppendixAcHighPrecisionPackV1,
} from "@/engine/myocardium/fourChamberV1/triseg/stabilizedAppendixAcReferenceV1";
import {
  PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";

export const PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EVIDENCE_MANIFEST_V1_ID =
  "phase-b0-published-taylor-triseg-finite-supported-envelope-evidence-manifest-v1" as const;

export const PHASE_B0_FINITE_ENVELOPE_PARENT_CASE_SHA256_V1 =
  "f8bbfbb7ad6bd76bd160ceb86fb903a35e1d0398397f99189f2ae32ff48ae75c" as const;
export const PHASE_B0_FINITE_ENVELOPE_PARENT_LOCAL_STATIC_MANIFEST_SHA256_V1 =
  "a253d1d98127633d68e9062102de9f1593fadccf770b581b74d7f7a81657bfa0" as const;
export const PHASE_B0_FINITE_ENVELOPE_PARENT_TISSUE_BUNDLE_SHA256_V1 =
  "a39afa8363bb84b625111a15b5b392ed3bedf2369a4f6a92a784b8da2339d089" as const;
export const PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1 =
  "ead56ce0d17204e9b140a203e4c8ee8c2e1c71c483c3a880b6fbbc6bd9f84577" as const;
export const PHASE_B0_FINITE_ENVELOPE_PARENT_APPENDIX_AC_PACK_SHA256_V1 =
  "c2ff9b98ebfc2015a13ccab399f8240790859515f90af061110a0aa69b4c7cee" as const;

const FINITE_ENVELOPE_MANIFESTS_V1 = new WeakSet<object>();

export type PhaseB0TriSegFiniteSupportedEnvelopeProtocolDefinitionV1 =
  Readonly<{
    protocolId: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID;
    nodes: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1;
    edges: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1;
    policy: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1;
  }>;

export type PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EVIDENCE_MANIFEST_V1_ID;
    status:
      "finite-declared-static-triseg-volume-graph-evidence-not-phase-b0-overall-acceptance";
    evidenceClass:
      "project-synthetic-finite-sampled-published-taylor-static-envelope-regression";
    lineage: Readonly<{
      syntheticHydromechanicsCaseSha256:
        typeof PHASE_B0_FINITE_ENVELOPE_PARENT_CASE_SHA256_V1;
      localStaticRestoringManifestSha256:
        typeof PHASE_B0_FINITE_ENVELOPE_PARENT_LOCAL_STATIC_MANIFEST_SHA256_V1;
      phaseA1TissueManifestBundleSha256:
        typeof PHASE_B0_FINITE_ENVELOPE_PARENT_TISSUE_BUNDLE_SHA256_V1;
      newtonScaleRegistrySha256:
        typeof PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1;
      stabilizedAppendixAcReferencePackSha256:
        typeof PHASE_B0_FINITE_ENVELOPE_PARENT_APPENDIX_AC_PACK_SHA256_V1;
      canonicalUpstreamArtifactsVerified: true;
    }>;
    bindings: Readonly<{
      protocolDefinitionSha256: string;
      nodeGraphSha256: string;
      edgeGraphSha256: string;
      policySha256: string;
      prohibitedOperationsSha256: string;
      claimBoundarySha256: string;
      componentIds: Readonly<{
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
    }>;
    protocolDefinition:
      PhaseB0TriSegFiniteSupportedEnvelopeProtocolDefinitionV1;
    implementationClaims: Readonly<{
      declaredThreeByThreeLvRvVolumeNodeGraph: true;
      eightCenterSpokesAndEightPerimeterEdgesTraversedBothWays: true;
      closedEightCompartmentBloodLedgerAtEverySample: true;
      pairedPhysicalSlsOnAndOffTopologies: true;
      firstHardPassWithFiftyPercentGuardAdaptiveSelection: true;
      everyRefinementAttemptRecordedFromPredeclaredFactors: true;
      everyAcceptedNodePublishedTaylorDomainAndStaticRestoringGate: true;
      independentAlgorithmicJacobianStepAtEveryAcceptedNode: true;
      bidirectionalCanonicalEndpointAgreement: true;
      centerTriangleAndFullPerimeterRouteClosure: true;
      finiteAllSeedRootCensusAtEveryCanonicalNode: true;
      reverseSeedOrderCensusInvariance: true;
      everyDiscoveredFiniteCensusClusterReported: true;
      staticValveSmoothingStructuralIndependenceOnly: true;
      structuredRefinementExhaustionRollbackInBothDirections: true;
      noProjectionClippingRootRankingPseudoArclengthOrHiddenSubdivision: true;
    }>;
    deferred: Readonly<{
      continuousRectangleInteriorRegularity: true;
      globalRootExhaustivenessAndUniqueness: true;
      energeticOrThermodynamicStability: true;
      phaseB0OverallAcceptance: true;
      phaseB1LandCoupledVolumeEnvelope: true;
      fullBeatAcceptance: true;
      physiologicalValidation: true;
      releaseRuntimeIntegration: true;
    }>;
    negativeClaims: Readonly<{
      continuousRectangleInteriorEstablished: false;
      globalRootUniquenessEstablished: false;
      energeticStabilityEstablished: false;
      phaseB0OverallAcceptance: false;
      phaseB1LandCoupledVolumeEnvelope: false;
      fullBeatAcceptance: false;
      physiologicalValidation: false;
      modelCoreIntegration: false;
      browserRuntimeAdopted: false;
      releaseRuntimeReachable: false;
    }>;
  }>;

export type PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1 =
  PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1 {
  verifyParents(sha256Hex);
  const protocolDefinition = buildProtocolDefinition();
  const payload:
    PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId:
        PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EVIDENCE_MANIFEST_V1_ID,
      status:
        "finite-declared-static-triseg-volume-graph-evidence-not-phase-b0-overall-acceptance",
      evidenceClass:
        "project-synthetic-finite-sampled-published-taylor-static-envelope-regression",
      lineage: Object.freeze({
        syntheticHydromechanicsCaseSha256:
          PHASE_B0_FINITE_ENVELOPE_PARENT_CASE_SHA256_V1,
        localStaticRestoringManifestSha256:
          PHASE_B0_FINITE_ENVELOPE_PARENT_LOCAL_STATIC_MANIFEST_SHA256_V1,
        phaseA1TissueManifestBundleSha256:
          PHASE_B0_FINITE_ENVELOPE_PARENT_TISSUE_BUNDLE_SHA256_V1,
        newtonScaleRegistrySha256:
          PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1,
        stabilizedAppendixAcReferencePackSha256:
          PHASE_B0_FINITE_ENVELOPE_PARENT_APPENDIX_AC_PACK_SHA256_V1,
        canonicalUpstreamArtifactsVerified: true,
      }),
      bindings: Object.freeze({
        protocolDefinitionSha256: computeCanonicalSha256(
          protocolDefinition,
          sha256Hex,
        ),
        nodeGraphSha256: computeCanonicalSha256(
          protocolDefinition.nodes,
          sha256Hex,
        ),
        edgeGraphSha256: computeCanonicalSha256(
          protocolDefinition.edges,
          sha256Hex,
        ),
        policySha256: computeCanonicalSha256(
          protocolDefinition.policy,
          sha256Hex,
        ),
        prohibitedOperationsSha256: computeCanonicalSha256(
          protocolDefinition.policy.prohibitedOperations,
          sha256Hex,
        ),
        claimBoundarySha256: computeCanonicalSha256(
          protocolDefinition.policy.claimBoundary,
          sha256Hex,
        ),
        componentIds: Object.freeze({
          runner: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
          rootSolver: PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID,
          sameTimeLevelHydromechanicsEvaluation:
            PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID,
          syntheticCase: PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID,
          staticGateManifest:
            PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID,
          algorithmicJacobian: PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
          valveNumericalPolicy: PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID,
          publishedTaylorOracle: PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
          equationAssembly: "published-Taylor-2009",
          localStaticClassifier:
            PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID,
          naturalParameterContinuation:
            PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
        }),
      }),
      protocolDefinition,
      implementationClaims: Object.freeze({
        declaredThreeByThreeLvRvVolumeNodeGraph: true,
        eightCenterSpokesAndEightPerimeterEdgesTraversedBothWays: true,
        closedEightCompartmentBloodLedgerAtEverySample: true,
        pairedPhysicalSlsOnAndOffTopologies: true,
        firstHardPassWithFiftyPercentGuardAdaptiveSelection: true,
        everyRefinementAttemptRecordedFromPredeclaredFactors: true,
        everyAcceptedNodePublishedTaylorDomainAndStaticRestoringGate: true,
        independentAlgorithmicJacobianStepAtEveryAcceptedNode: true,
        bidirectionalCanonicalEndpointAgreement: true,
        centerTriangleAndFullPerimeterRouteClosure: true,
        finiteAllSeedRootCensusAtEveryCanonicalNode: true,
        reverseSeedOrderCensusInvariance: true,
        everyDiscoveredFiniteCensusClusterReported: true,
        staticValveSmoothingStructuralIndependenceOnly: true,
        structuredRefinementExhaustionRollbackInBothDirections: true,
        noProjectionClippingRootRankingPseudoArclengthOrHiddenSubdivision: true,
      }),
      deferred: Object.freeze({
        continuousRectangleInteriorRegularity: true,
        globalRootExhaustivenessAndUniqueness: true,
        energeticOrThermodynamicStability: true,
        phaseB0OverallAcceptance: true,
        phaseB1LandCoupledVolumeEnvelope: true,
        fullBeatAcceptance: true,
        physiologicalValidation: true,
        releaseRuntimeIntegration: true,
      }),
      negativeClaims: Object.freeze({
        continuousRectangleInteriorEstablished: false,
        globalRootUniquenessEstablished: false,
        energeticStabilityEstablished: false,
        phaseB0OverallAcceptance: false,
        phaseB1LandCoupledVolumeEnvelope: false,
        fullBeatAcceptance: false,
        physiologicalValidation: false,
        modelCoreIntegration: false,
        browserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
      }),
    });
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  FINITE_ENVELOPE_MANIFESTS_V1.add(manifest);
  return validatePhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
  manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
): PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !FINITE_ENVELOPE_MANIFESTS_V1.has(manifest)
  ) throw new Error(
    "Phase B0 finite-envelope manifest must be canonically built in this process",
  );
  return manifest;
}

export function validatePhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
  manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1 {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(
    manifest,
  );
  if (
    manifest.manifestId
      !== PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B0 finite-envelope manifest identity drifted");
  assertCanonicalSha256(
    phaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  verifyParents(sha256Hex);
  const protocol = manifest.protocolDefinition;
  const expected = buildProtocolDefinition();
  if (
    canonicalizeJson(protocol) !== canonicalizeJson(expected)
    || manifest.bindings.protocolDefinitionSha256
      !== computeCanonicalSha256(protocol, sha256Hex)
    || manifest.bindings.nodeGraphSha256
      !== computeCanonicalSha256(protocol.nodes, sha256Hex)
    || manifest.bindings.edgeGraphSha256
      !== computeCanonicalSha256(protocol.edges, sha256Hex)
    || manifest.bindings.policySha256
      !== computeCanonicalSha256(protocol.policy, sha256Hex)
    || manifest.bindings.prohibitedOperationsSha256
      !== computeCanonicalSha256(
        protocol.policy.prohibitedOperations,
        sha256Hex,
      )
    || manifest.bindings.claimBoundarySha256
      !== computeCanonicalSha256(protocol.policy.claimBoundary, sha256Hex)
    || manifest.bindings.componentIds.runner
      !== PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
    || manifest.bindings.componentIds.rootSolver
      !== PHASE_B0_PUBLISHED_TRISEG_ROOT_V1_ID
    || manifest.bindings.componentIds.sameTimeLevelHydromechanicsEvaluation
      !== PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID
    || manifest.bindings.componentIds.syntheticCase
      !== PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID
    || manifest.bindings.componentIds.staticGateManifest
      !== PHASE_B0_TRISEG_STATIC_RESTORING_GATE_MANIFEST_V1_ID
    || manifest.bindings.componentIds.algorithmicJacobian
      !== PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    || manifest.bindings.componentIds.valveNumericalPolicy
      !== PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID
    || manifest.bindings.componentIds.publishedTaylorOracle
      !== PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID
    || manifest.bindings.componentIds.equationAssembly
      !== "published-Taylor-2009"
    || manifest.bindings.componentIds.localStaticClassifier
      !== PHASE_B0_TRISEG_STATIC_RESTORING_AUDIT_V1_ID
    || manifest.bindings.componentIds.naturalParameterContinuation
      !== PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID
  ) throw new Error("Phase B0 finite-envelope evidence binding drifted");
  if (
    protocol.nodes.length !== 9
    || protocol.edges.length !== 16
    || protocol.edges.filter((edge) => edge.edgeClass === "center-spoke")
      .length !== 8
    || protocol.edges.filter((edge) => edge.edgeClass === "perimeter")
      .length !== 8
    || protocol.policy.slsModes.join(",") !== "on,off"
    || protocol.policy.adaptiveRefinement.refinementFactors.join(",")
      !== "2,4,8,16,32"
    || protocol.policy.rootEnumeration.seeds.length !== 3
    || protocol.policy.rootEnumeration.globalExhaustivenessClaimed !== false
    || Object.values(protocol.policy.prohibitedOperations)
      .some((value) => value !== false)
    || Object.values(protocol.policy.claimBoundary)
      .some((value) => value !== false)
  ) throw new Error("Phase B0 finite-envelope protocol values drifted");
  if (
    Object.values(manifest.implementationClaims)
      .some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) throw new Error("Phase B0 finite-envelope claim boundary drifted");
  return manifest;
}

export function phaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestHashPayloadV1(
  manifest: PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
): PhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function buildProtocolDefinition():
PhaseB0TriSegFiniteSupportedEnvelopeProtocolDefinitionV1 {
  return Object.freeze({
    protocolId: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
    nodes: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_NODES_V1,
    edges: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_EDGES_V1,
    policy: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_POLICY_V1,
  });
}

function verifyParents(sha256Hex: CanonicalSha256HexProvider): void {
  const fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256Hex);
  const staticManifest = buildPhaseB0TriSegStaticRestoringGateManifestV1(
    fixture,
    sha256Hex,
  );
  validateStabilizedTriSegAppendixAcHighPrecisionPackV1(sha256Hex);
  if (
    fixture.contentSha256
      !== PHASE_B0_FINITE_ENVELOPE_PARENT_CASE_SHA256_V1
    || staticManifest.contentSha256
      !== PHASE_B0_FINITE_ENVELOPE_PARENT_LOCAL_STATIC_MANIFEST_SHA256_V1
    || fixture.phaseA1TissueManifestBundle.contentSha256
      !== PHASE_B0_FINITE_ENVELOPE_PARENT_TISSUE_BUNDLE_SHA256_V1
    || fixture.phaseA1TissueManifestBundle.contentSha256
      !== PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1.bundle
    || fixture.newtonScaleRegistryContentSha256
      !== PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1
    || fixture.newtonScaleRegistry.registryContentSha256
      !== PHASE_B0_FINITE_ENVELOPE_PARENT_NEWTON_SCALE_REGISTRY_SHA256_V1
    || STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256
      !== PHASE_B0_FINITE_ENVELOPE_PARENT_APPENDIX_AC_PACK_SHA256_V1
  ) throw new Error("Phase B0 finite-envelope parent evidence drifted");
}
