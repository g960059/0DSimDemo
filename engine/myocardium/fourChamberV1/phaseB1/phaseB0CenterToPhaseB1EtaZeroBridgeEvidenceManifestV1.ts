import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeEvidenceManifestV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationEvidenceManifestV1";

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_EVIDENCE_MANIFEST_V1_ID =
  "phase-b0-center-to-phase-b1-eta-zero-bridge-evidence-manifest-v1" as const;

export const PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1 =
  "701e9706965fcffd6604d2bde079ec40d5dec39781429ea074b8ab6edb9684a3" as const;
export const PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1" as const;
export const PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_READINESS_SHA256_V1 =
  "3319c2bcac060156d7a8b1e1b13f6440b2faf022c6359cf9467c7366f0bd9a52" as const;
export const PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1 =
  "eacff4e5019d4b7650cd7bba7c3999994ebee674f37093177e572bfef7fa33b7" as const;
export const PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_NUMERICAL_SHA256_V1 =
  "1f3066c237c5fb5661a66824968d6f924f243803a2b5f570d2832fc2d28a01d9" as const;
export const PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_READINESS_SHA256_V1 =
  "401b5e5b29b8ed33794d693074f199773e45b142d44a6191ebf3ab7fd956f994" as const;

const BRIDGE_MANIFESTS_V1 = new WeakSet<object>();

const BRIDGE_PROHIBITED_OPERATIONS_V1 = Object.freeze({
  copyPhaseB0LandState: false,
  copyPhaseB0SlsState: false,
  copyPhaseB0CalciumState: false,
  adjustBloodVolumes: false,
  adjustInertialFlows: false,
  selectAnotherFiniteEnvelopeNode: false,
  claimRawLandActiveStressParityAtEtaZero: false,
} as const);

const BRIDGE_CLAIM_BOUNDARY_V1 = Object.freeze({
  phaseB0OverallAcceptance: false,
  acceptedPhaseB1ReferenceBranch: false,
  phaseB1LandCoupledVolumeEnvelope: false,
  continuousIntervalRegularity: false,
  globalRootUniqueness: false,
  energeticStability: false,
  physiologicalInitialization: false,
  closedLoopStationarity: false,
  fullBeatAcceptance: false,
  modelCoreIntegration: false,
  browserRuntimeAdoption: false,
  releaseRuntimeReachability: false,
} as const);

export type PhaseB0CenterToPhaseB1EtaZeroBridgeProtocolDefinitionV1 =
  Readonly<{
    bridgeId: typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID;
    source: Readonly<{
      protocolId: typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID;
      nodeId: "C";
      requiredNumericalEvidenceSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1;
    }>;
    transfer: Readonly<{
      fields:
        typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1.transferredFields;
      noOtherPhaseB0StateTransferred: true;
    }>;
    destination: Readonly<{
      adapterId:
        typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID;
      protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
      homotopyId: typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
      eta: 0;
    }>;
    policy: typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1;
    prohibitedOperations: typeof BRIDGE_PROHIBITED_OPERATIONS_V1;
    claimBoundary: typeof BRIDGE_CLAIM_BOUNDARY_V1;
  }>;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_EVIDENCE_MANIFEST_V1_ID;
    status:
      "project-synthetic-b0-center-to-b1-eta-zero-bridge-evidence-not-phase-b1-acceptance";
    evidenceClass:
      "project-synthetic-cross-phase-center-node-state-reconstruction-and-equilibrium-regression";
    lineage: Readonly<{
      phaseB0FiniteEnvelopeManifestSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1;
      phaseB0FiniteEnvelopeNumericalEvidenceSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1;
      phaseB0FiniteEnvelopeReadinessSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_READINESS_SHA256_V1;
      phaseB1ColdInitializationManifestSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1;
      phaseB1ColdInitializationNumericalEvidenceSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_NUMERICAL_SHA256_V1;
      phaseB1ColdInitializationReadinessSha256:
        typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_READINESS_SHA256_V1;
      canonicalParentManifestsVerifiedLive: true;
      parentNumericalAndReadinessArtifactsAreFrozenLineagePins: true;
    }>;
    bindings: Readonly<{
      protocolDefinitionSha256: string;
      sourceContractSha256: string;
      transferContractSha256: string;
      destinationContractSha256: string;
      bridgePolicySha256: string;
      prohibitedOperationsSha256: string;
      claimBoundarySha256: string;
      componentIds: Readonly<{
        bridge: typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID;
        sourceFiniteEnvelope:
          typeof PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID;
        destinationExternalSeedAdapter:
          typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID;
        destinationColdProtocol:
          typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
        destinationMaterialHomotopy:
          typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
      }>;
    }>;
    protocolDefinition: PhaseB0CenterToPhaseB1EtaZeroBridgeProtocolDefinitionV1;
    implementationClaims: Readonly<{
      canonicalB0FiniteEnvelopeCertificateUsedAsSource: true;
      exactlyOneAcceptedCenterNodePerSlsMode: true;
      onlyTriSegCoordinatesTransferred: true;
      landAndCalciumStatesReconstructedInsideB1: true;
      physicalSlsTopologyAppliedInsideB1: true;
      destinationSolvedAtEtaZero: true;
      pairedPhysicalSlsOnAndOffTopologies: true;
      fullDeclaredSharedStateAndEquilibriumParityAudit: true;
      rawLandActiveStressKeptDiagnosticAtEtaZero: true;
      noBloodVolumeOrFlowAdjustment: true;
      noWarmStartImportedOrConsumed: true;
    }>;
    deferred: Readonly<{
      phaseB0OverallAcceptance: true;
      acceptedPhaseB1ReferenceBranch: true;
      phaseB1LandCoupledVolumeEnvelope: true;
      continuousIntervalRegularity: true;
      globalRootUniqueness: true;
      energeticStability: true;
      physiologicalInitialization: true;
      closedLoopStationarity: true;
      fullBeatAcceptance: true;
      runtimeIntegration: true;
    }>;
    negativeClaims: typeof BRIDGE_CLAIM_BOUNDARY_V1;
  }>;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1 =
  PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1 {
  verifyBridgeParents(sha256Hex);
  const protocolDefinition = buildBridgeProtocolDefinition();
  const payload: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_EVIDENCE_MANIFEST_V1_ID,
      status:
        "project-synthetic-b0-center-to-b1-eta-zero-bridge-evidence-not-phase-b1-acceptance",
      evidenceClass:
        "project-synthetic-cross-phase-center-node-state-reconstruction-and-equilibrium-regression",
      lineage: Object.freeze({
        phaseB0FiniteEnvelopeManifestSha256:
          PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1,
        phaseB0FiniteEnvelopeNumericalEvidenceSha256:
          PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
        phaseB0FiniteEnvelopeReadinessSha256:
          PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_READINESS_SHA256_V1,
        phaseB1ColdInitializationManifestSha256:
          PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1,
        phaseB1ColdInitializationNumericalEvidenceSha256:
          PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_NUMERICAL_SHA256_V1,
        phaseB1ColdInitializationReadinessSha256:
          PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_READINESS_SHA256_V1,
        canonicalParentManifestsVerifiedLive: true,
        parentNumericalAndReadinessArtifactsAreFrozenLineagePins: true,
      }),
      bindings: Object.freeze({
        protocolDefinitionSha256: computeCanonicalSha256(
          protocolDefinition,
          sha256Hex,
        ),
        sourceContractSha256: computeCanonicalSha256(
          protocolDefinition.source,
          sha256Hex,
        ),
        transferContractSha256: computeCanonicalSha256(
          protocolDefinition.transfer,
          sha256Hex,
        ),
        destinationContractSha256: computeCanonicalSha256(
          protocolDefinition.destination,
          sha256Hex,
        ),
        bridgePolicySha256: computeCanonicalSha256(
          protocolDefinition.policy,
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
          bridge: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
          sourceFiniteEnvelope:
            PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
          destinationExternalSeedAdapter:
            PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
          destinationColdProtocol:
            PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
          destinationMaterialHomotopy:
            PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
        }),
      }),
      protocolDefinition,
      implementationClaims: Object.freeze({
        canonicalB0FiniteEnvelopeCertificateUsedAsSource: true,
        exactlyOneAcceptedCenterNodePerSlsMode: true,
        onlyTriSegCoordinatesTransferred: true,
        landAndCalciumStatesReconstructedInsideB1: true,
        physicalSlsTopologyAppliedInsideB1: true,
        destinationSolvedAtEtaZero: true,
        pairedPhysicalSlsOnAndOffTopologies: true,
        fullDeclaredSharedStateAndEquilibriumParityAudit: true,
        rawLandActiveStressKeptDiagnosticAtEtaZero: true,
        noBloodVolumeOrFlowAdjustment: true,
        noWarmStartImportedOrConsumed: true,
      }),
      deferred: Object.freeze({
        phaseB0OverallAcceptance: true,
        acceptedPhaseB1ReferenceBranch: true,
        phaseB1LandCoupledVolumeEnvelope: true,
        continuousIntervalRegularity: true,
        globalRootUniqueness: true,
        energeticStability: true,
        physiologicalInitialization: true,
        closedLoopStationarity: true,
        fullBeatAcceptance: true,
        runtimeIntegration: true,
      }),
      negativeClaims: BRIDGE_CLAIM_BOUNDARY_V1,
    });
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  BRIDGE_MANIFESTS_V1.add(manifest);
  return validatePhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
  manifest: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
): PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !BRIDGE_MANIFESTS_V1.has(manifest)
  ) throw new Error(
    "Phase B0-to-B1 eta-zero bridge manifest must be canonically built in this process",
  );
  return manifest;
}

export function validatePhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
  manifest: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1 {
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
    manifest,
  );
  if (
    manifest.manifestId
      !== PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B0-to-B1 eta-zero bridge manifest identity drifted");
  assertCanonicalSha256(
    phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  verifyBridgeParents(sha256Hex);
  const expected = buildBridgeProtocolDefinition();
  const protocol = manifest.protocolDefinition;
  if (
    canonicalizeJson(protocol) !== canonicalizeJson(expected)
    || manifest.bindings.protocolDefinitionSha256
      !== computeCanonicalSha256(protocol, sha256Hex)
    || manifest.bindings.sourceContractSha256
      !== computeCanonicalSha256(protocol.source, sha256Hex)
    || manifest.bindings.transferContractSha256
      !== computeCanonicalSha256(protocol.transfer, sha256Hex)
    || manifest.bindings.destinationContractSha256
      !== computeCanonicalSha256(protocol.destination, sha256Hex)
    || manifest.bindings.bridgePolicySha256
      !== computeCanonicalSha256(protocol.policy, sha256Hex)
    || manifest.bindings.prohibitedOperationsSha256
      !== computeCanonicalSha256(protocol.prohibitedOperations, sha256Hex)
    || manifest.bindings.claimBoundarySha256
      !== computeCanonicalSha256(protocol.claimBoundary, sha256Hex)
    || manifest.bindings.componentIds.bridge
      !== PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID
    || manifest.bindings.componentIds.sourceFiniteEnvelope
      !== PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
    || manifest.bindings.componentIds.destinationExternalSeedAdapter
      !== PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID
    || manifest.bindings.componentIds.destinationColdProtocol
      !== PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID
    || manifest.bindings.componentIds.destinationMaterialHomotopy
      !== PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID
    || canonicalizeJson(protocol.policy)
      !== canonicalizeJson(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
      )
    || protocol.source.nodeId !== "C"
    || protocol.destination.eta !== 0
    || protocol.transfer.fields.join(",") !== "V_m_S,y_m"
    || Object.values(protocol.prohibitedOperations)
      .some((value) => value !== false)
    || Object.values(protocol.claimBoundary).some((value) => value !== false)
  ) throw new Error("Phase B0-to-B1 eta-zero bridge evidence binding drifted");
  if (
    Object.values(manifest.implementationClaims)
      .some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) throw new Error("Phase B0-to-B1 eta-zero bridge claim boundary drifted");
  return manifest;
}

export function phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1(
  manifest: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
): PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function buildBridgeProtocolDefinition():
  PhaseB0CenterToPhaseB1EtaZeroBridgeProtocolDefinitionV1 {
  return Object.freeze({
    bridgeId: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
    source: Object.freeze({
      protocolId: PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
      nodeId: "C" as const,
      requiredNumericalEvidenceSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
    }),
    transfer: Object.freeze({
      fields:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1.transferredFields,
      noOtherPhaseB0StateTransferred: true as const,
    }),
    destination: Object.freeze({
      adapterId:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
      protocolId: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
      homotopyId: PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
      eta: 0 as const,
    }),
    policy: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
    prohibitedOperations: BRIDGE_PROHIBITED_OPERATIONS_V1,
    claimBoundary: BRIDGE_CLAIM_BOUNDARY_V1,
  });
}

function verifyBridgeParents(sha256Hex: CanonicalSha256HexProvider): void {
  const phaseB0Manifest =
    buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(sha256Hex);
  const phaseB1ColdManifest =
    buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
      sha256Hex,
    );
  if (
    phaseB0Manifest.contentSha256
      !== PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1
    || phaseB1ColdManifest.contentSha256
      !== PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1
  ) throw new Error("Phase B0-to-B1 eta-zero bridge parent manifest drifted");
}
