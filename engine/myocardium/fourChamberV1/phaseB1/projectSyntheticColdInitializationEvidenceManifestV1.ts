import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  buildPhaseB0TriSegStaticRestoringGateManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegStaticRestoringGateManifestV1";
import {
  buildPhaseB1MonolithicVerticalSliceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/monolithicVerticalSliceManifestV1";
import {
  PHASE_B1_ENDPOINT_STATE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MonolithicVerticalSliceReadinessV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
  buildPhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1,
  type PhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticVerticalSliceCaseDescriptorV1";
import {
  PUBLISHED_TRISEG_ROOT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";

export const PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_EVIDENCE_MANIFEST_V1_ID =
  "phase-b1-project-synthetic-cold-initialization-evidence-manifest-v1" as const;

export const PHASE_B1_COLD_PARENT_VERTICAL_DESCRIPTOR_SHA256_V1 =
  "d2fd8e854e6c520d1ea73be0b3f32005e50e2be282fee94484d2ce6e91ab1d99" as const;
export const PHASE_B1_COLD_PARENT_VERTICAL_MANIFEST_SHA256_V1 =
  "973351efd96000e1a69041eb44b41db44d2e4ecc3556005763f3d1ce672e9d69" as const;
export const PHASE_B1_COLD_PARENT_VERTICAL_READINESS_SHA256_V1 =
  "379fb468c1feba725db39465ea7c7bee24476e60e36265a6dce77bc673a82324" as const;
export const PHASE_B1_COLD_B0_STATIC_RESTORING_MANIFEST_SHA256_V1 =
  "a253d1d98127633d68e9062102de9f1593fadccf770b581b74d7f7a81657bfa0" as const;

const COLD_INITIALIZATION_MANIFESTS_V1 = new WeakSet<object>();

export type PhaseB1ProjectSyntheticColdInitializationEvidenceManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_EVIDENCE_MANIFEST_V1_ID;
    status:
      "project-synthetic-cold-material-branch-regression-not-accepted-physiological-initialization";
    evidenceClass:
      "project-synthetic-coupled-cold-initialization-and-sampled-active-material-homotopy-regression";
    lineage: Readonly<{
      verticalSliceDescriptorSha256:
        typeof PHASE_B1_COLD_PARENT_VERTICAL_DESCRIPTOR_SHA256_V1;
      verticalSliceManifestSha256:
        typeof PHASE_B1_COLD_PARENT_VERTICAL_MANIFEST_SHA256_V1;
      verticalSliceReadinessSha256:
        typeof PHASE_B1_COLD_PARENT_VERTICAL_READINESS_SHA256_V1;
      b0StaticRestoringThresholdSemanticsManifestSha256:
        typeof PHASE_B1_COLD_B0_STATIC_RESTORING_MANIFEST_SHA256_V1;
      shortHorizonEvidenceIsNotANormativeParent: true;
      canonicalUpstreamArtifactsVerified: true;
    }>;
    bindings: Readonly<{
      protocolDefinitionSha256: string;
      fixedInputsSha256: string;
      topologyBySlsModeSha256: string;
      policySha256: string;
      modelBindingsSha256: string;
      prohibitedOperationsSha256: string;
      claimBoundarySha256: string;
      componentIds: Readonly<{
        coldRunner:
          typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
        materialHomotopy:
          typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
        wallMaterialKernel: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
        endpointState: typeof PHASE_B1_ENDPOINT_STATE_V1_ID;
        triSegEnumerationRootSolver: typeof PUBLISHED_TRISEG_ROOT_V1_ID;
        effectiveTriSegAudit:
          "phase-b1-cold-equilibrium-material-schur-triseg-audit-v1";
      }>;
    }>;
    protocolDefinition:
      PhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1;
    implementationClaims: Readonly<{
      independentFromSyntheticWarmStart: true;
      fixedBloodVolumeFlowAndCalciumInputs: true;
      coupledThirtySevenAndThirtyTwoUnknownColdResiduals: true;
      allFiveLandSteadySystemsInsideColdSolve: true;
      exactDistortionAndSlsColdConstraints: true;
      perWallActiveAnchorStressCorrespondingToDeclaredTransmuralPressure: true;
      fixedOneTwoFourEightSegmentTangentPredictorCorrectorRuns: true;
      directPathEntryClosureAgainstDeclaredAnchor: true;
      canonicalEightSegmentReverseClosure: true;
      everyAcceptedNodeEffectiveMaterialSchurAudit: true;
      everyAcceptedNodeIndependentReequilibratedTangentAudit: true;
      endpointRootCensusWithAllDiscoveredClustersReported: true;
      everyPredeclaredEndpointCensusSeedConverged: true;
      canonicalMaterialParityAtEtaOne: true;
      pairedPhysicalSlsTopologies: true;
      structuredFailureAndRollback: true;
      noHiddenSubdivisionProjectionClippingOrRootRanking: true;
    }>;
    deferred: Readonly<{
      physiologicalColdInitialization: true;
      acceptedPhaseB1ReferenceBranch: true;
      phaseB0SupportedEnvelopeClosure: true;
      continuousIntervalRegularity: true;
      globalRootExhaustiveness: true;
      energeticOrThermodynamicStability: true;
      stationaryCirculationInitialization: true;
      acceptedReferenceShortHorizon: true;
      generalTimestepConvergence: true;
      wholeHeartBackwardEulerEnergyAcceptance: true;
      fullBeatPeriodicAttractor: true;
      multistartAttractorAndPathologicalEnvelope: true;
      physiologicalAndExperimentalLandValidation: true;
      releaseRuntimeIntegration: true;
    }>;
    negativeClaims: Readonly<{
      physiologicalColdInitializationAccepted: false;
      phaseB1ReferenceBranchAccepted: false;
      phaseB0SupportedEnvelopeClosed: false;
      continuousIntervalRegularityEstablished: false;
      globalRootUniquenessEstablished: false;
      energeticStabilityEstablished: false;
      closedLoopStationarityEstablished: false;
      phaseB1Acceptance: false;
      supportedEnvelope: false;
      physiologicalValidation: false;
      modelCoreIntegration: false;
      browserRuntimeAdopted: false;
      releaseRuntimeReachable: false;
    }>;
  }>;

export type PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1 =
  PhaseB1ProjectSyntheticColdInitializationEvidenceManifestPayloadV1 &
  Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1 {
  verifyParents(sha256Hex);
  const protocolDefinition =
    buildPhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1(
      sha256Hex,
    );
  const payload:
    PhaseB1ProjectSyntheticColdInitializationEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_EVIDENCE_MANIFEST_V1_ID,
      status:
        "project-synthetic-cold-material-branch-regression-not-accepted-physiological-initialization",
      evidenceClass:
        "project-synthetic-coupled-cold-initialization-and-sampled-active-material-homotopy-regression",
      lineage: Object.freeze({
        verticalSliceDescriptorSha256:
          PHASE_B1_COLD_PARENT_VERTICAL_DESCRIPTOR_SHA256_V1,
        verticalSliceManifestSha256:
          PHASE_B1_COLD_PARENT_VERTICAL_MANIFEST_SHA256_V1,
        verticalSliceReadinessSha256:
          PHASE_B1_COLD_PARENT_VERTICAL_READINESS_SHA256_V1,
        b0StaticRestoringThresholdSemanticsManifestSha256:
          PHASE_B1_COLD_B0_STATIC_RESTORING_MANIFEST_SHA256_V1,
        shortHorizonEvidenceIsNotANormativeParent: true,
        canonicalUpstreamArtifactsVerified: true,
      }),
      bindings: Object.freeze({
        protocolDefinitionSha256: computeCanonicalSha256(
          protocolDefinition,
          sha256Hex,
        ),
        fixedInputsSha256: computeCanonicalSha256(
          protocolDefinition.fixedInputs,
          sha256Hex,
        ),
        topologyBySlsModeSha256: computeCanonicalSha256(
          protocolDefinition.topologyBySlsMode,
          sha256Hex,
        ),
        policySha256: computeCanonicalSha256(
          protocolDefinition.policy,
          sha256Hex,
        ),
        modelBindingsSha256: computeCanonicalSha256(
          protocolDefinition.bindings,
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
        componentIds: Object.freeze({
          coldRunner: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
          materialHomotopy:
            PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
          wallMaterialKernel: PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
          endpointState: PHASE_B1_ENDPOINT_STATE_V1_ID,
          triSegEnumerationRootSolver: PUBLISHED_TRISEG_ROOT_V1_ID,
          effectiveTriSegAudit:
            "phase-b1-cold-equilibrium-material-schur-triseg-audit-v1",
        }),
      }),
      protocolDefinition,
      implementationClaims: Object.freeze({
        independentFromSyntheticWarmStart: true,
        fixedBloodVolumeFlowAndCalciumInputs: true,
        coupledThirtySevenAndThirtyTwoUnknownColdResiduals: true,
        allFiveLandSteadySystemsInsideColdSolve: true,
        exactDistortionAndSlsColdConstraints: true,
        perWallActiveAnchorStressCorrespondingToDeclaredTransmuralPressure: true,
        fixedOneTwoFourEightSegmentTangentPredictorCorrectorRuns: true,
        directPathEntryClosureAgainstDeclaredAnchor: true,
        canonicalEightSegmentReverseClosure: true,
        everyAcceptedNodeEffectiveMaterialSchurAudit: true,
        everyAcceptedNodeIndependentReequilibratedTangentAudit: true,
        endpointRootCensusWithAllDiscoveredClustersReported: true,
        everyPredeclaredEndpointCensusSeedConverged: true,
        canonicalMaterialParityAtEtaOne: true,
        pairedPhysicalSlsTopologies: true,
        structuredFailureAndRollback: true,
        noHiddenSubdivisionProjectionClippingOrRootRanking: true,
      }),
      deferred: Object.freeze({
        physiologicalColdInitialization: true,
        acceptedPhaseB1ReferenceBranch: true,
        phaseB0SupportedEnvelopeClosure: true,
        continuousIntervalRegularity: true,
        globalRootExhaustiveness: true,
        energeticOrThermodynamicStability: true,
        stationaryCirculationInitialization: true,
        acceptedReferenceShortHorizon: true,
        generalTimestepConvergence: true,
        wholeHeartBackwardEulerEnergyAcceptance: true,
        fullBeatPeriodicAttractor: true,
        multistartAttractorAndPathologicalEnvelope: true,
        physiologicalAndExperimentalLandValidation: true,
        releaseRuntimeIntegration: true,
      }),
      negativeClaims: Object.freeze({
        physiologicalColdInitializationAccepted: false,
        phaseB1ReferenceBranchAccepted: false,
        phaseB0SupportedEnvelopeClosed: false,
        continuousIntervalRegularityEstablished: false,
        globalRootUniquenessEstablished: false,
        energeticStabilityEstablished: false,
        closedLoopStationarityEstablished: false,
        phaseB1Acceptance: false,
        supportedEnvelope: false,
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
  COLD_INITIALIZATION_MANIFESTS_V1.add(manifest);
  return validatePhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
  manifest: PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
): PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !COLD_INITIALIZATION_MANIFESTS_V1.has(manifest)
  ) throw new Error(
    "Phase B1 cold-initialization manifest must be canonically built in this process",
  );
  return manifest;
}

export function validatePhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
  manifest: PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1 {
  assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
    manifest,
  );
  if (
    manifest.manifestId
      !== PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B1 cold-initialization manifest identity drifted");
  assertCanonicalSha256(
    phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  verifyParents(sha256Hex);
  const expected =
    buildPhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1(
      sha256Hex,
    );
  const protocol = manifest.protocolDefinition;
  if (
    canonicalizeJson(protocol) !== canonicalizeJson(expected)
    || manifest.bindings.protocolDefinitionSha256
      !== computeCanonicalSha256(protocol, sha256Hex)
    || manifest.bindings.fixedInputsSha256
      !== computeCanonicalSha256(protocol.fixedInputs, sha256Hex)
    || manifest.bindings.topologyBySlsModeSha256
      !== computeCanonicalSha256(protocol.topologyBySlsMode, sha256Hex)
    || manifest.bindings.policySha256
      !== computeCanonicalSha256(protocol.policy, sha256Hex)
    || manifest.bindings.modelBindingsSha256
      !== computeCanonicalSha256(protocol.bindings, sha256Hex)
    || manifest.bindings.prohibitedOperationsSha256
      !== computeCanonicalSha256(protocol.prohibitedOperations, sha256Hex)
    || manifest.bindings.claimBoundarySha256
      !== computeCanonicalSha256(protocol.claimBoundary, sha256Hex)
  ) throw new Error("Phase B1 cold-initialization evidence binding drifted");
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  if (
    canonicalizeJson(protocol.policy) !== canonicalizeJson(policy)
    || protocol.topologyBySlsMode.on.unknownCount !== 37
    || protocol.topologyBySlsMode.on.materialUnknownCount !== 35
    || protocol.topologyBySlsMode.off.unknownCount !== 32
    || protocol.topologyBySlsMode.off.materialUnknownCount !== 30
    || protocol.topologyBySlsMode.on.unknownLabels.length !== 37
    || protocol.topologyBySlsMode.off.unknownLabels.length !== 32
    || protocol.topologyBySlsMode.on.residualLabels.length !== 37
    || protocol.topologyBySlsMode.off.residualLabels.length !== 32
    || policy.subdivisionCounts.join(",") !== "1,2,4,8"
    || policy.canonicalSubdivisionCount !== 8
    || policy.enumerationFractions.join(",") !== "0,1"
    || Object.values(protocol.prohibitedOperations).some((value) => value !== false)
    || Object.values(protocol.claimBoundary).some((value) => value !== false)
  ) throw new Error("Phase B1 cold-initialization protocol values drifted");
  if (
    Object.values(manifest.implementationClaims).some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) throw new Error("Phase B1 cold-initialization claim boundary drifted");
  return manifest;
}

export function phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1(
  manifest: PhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
): PhaseB1ProjectSyntheticColdInitializationEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function verifyParents(sha256Hex: CanonicalSha256HexProvider): void {
  const descriptor = buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    sha256Hex,
  );
  const verticalManifest = buildPhaseB1MonolithicVerticalSliceManifestV1(
    descriptor,
    sha256Hex,
  );
  const verticalReadiness =
    buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1(verticalManifest);
  const b0Fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256Hex);
  const b0StaticManifest = buildPhaseB0TriSegStaticRestoringGateManifestV1(
    b0Fixture,
    sha256Hex,
  );
  if (
    descriptor.contentSha256
      !== PHASE_B1_COLD_PARENT_VERTICAL_DESCRIPTOR_SHA256_V1
    || verticalManifest.contentSha256
      !== PHASE_B1_COLD_PARENT_VERTICAL_MANIFEST_SHA256_V1
    || computeCanonicalSha256(verticalReadiness, sha256Hex)
      !== PHASE_B1_COLD_PARENT_VERTICAL_READINESS_SHA256_V1
    || b0StaticManifest.contentSha256
      !== PHASE_B1_COLD_B0_STATIC_RESTORING_MANIFEST_SHA256_V1
  ) throw new Error("Phase B1 cold-initialization parent evidence drifted");
}
