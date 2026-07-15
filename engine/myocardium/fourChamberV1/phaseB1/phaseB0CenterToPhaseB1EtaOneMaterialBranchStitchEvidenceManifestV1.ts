import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_EVIDENCE_MANIFEST_V1_ID,
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_NUMERICAL_EVIDENCE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_EVIDENCE_MANIFEST_V1_ID,
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationEvidenceManifestV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_NUMERICAL_EVIDENCE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationNumericalEvidenceV1";

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_EVIDENCE_MANIFEST_V1_ID =
  "phase-b0-center-to-phase-b1-eta-one-material-branch-stitch-evidence-manifest-v1" as const;

export const ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1 =
  "a74e6294986d2144573990df4fca5e1d17a58c4642a7b0737f3b956db525528c" as const;
export const ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1 =
  "183f938b1a87c619dee2fd60344ac4f1baed2aa94eac9a0bea8e40552111f60c" as const;
export const ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1 =
  "84ccdf648a18e0f6a5eea1278c744fae2ac02822375075e1862f84376fd8ac47" as const;
export const ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1 =
  "eacff4e5019d4b7650cd7bba7c3999994ebee674f37093177e572bfef7fa33b7" as const;
export const ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1 =
  "1f3066c237c5fb5661a66824968d6f924f243803a2b5f570d2832fc2d28a01d9" as const;
export const ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1 =
  "401b5e5b29b8ed33794d693074f199773e45b142d44a6191ebf3ab7fd956f994" as const;

const STITCH_MANIFESTS_V1 = new WeakSet<object>();
const SLS_MODES = Object.freeze(["on", "off"] as const);

const PROHIBITED_OPERATIONS = Object.freeze({
  etaZeroReinitializationOrResolve: false,
  bloodVolumeAdjustment: false,
  inertialFlowAdjustment: false,
  calciumAdjustmentOrNewtonUnknown: false,
  hiddenHomotopySubdivision: false,
  pseudoArclengthAcceptanceRescue: false,
  projection: false,
  clipping: false,
  nearestRootSelection: false,
  minimumResidualRootSelection: false,
  maximumJunctionRadiusRootSelection: false,
  rootCensusSelectionInputToAcceptedPath: false,
} as const);

const CLAIM_BOUNDARY = Object.freeze({
  phaseB0OverallAcceptance: false,
  acceptedPhaseB1ReferenceBranch: false,
  phaseB1LandCoupledFiniteVolumeGraph: false,
  phaseB1LandCoupledVolumeEnvelope: false,
  continuousEtaIntervalRegularity: false,
  continuousVolumeIntervalRegularity: false,
  globalRootUniqueness: false,
  globalRootExhaustiveness: false,
  energeticStability: false,
  physiologicalInitialization: false,
  closedLoopStationarity: false,
  fullBeatAcceptance: false,
  physiologicalValidation: false,
  phaseB1Acceptance: false,
  supportedEnvelope: false,
  releaseRuntimePass: false,
  pureCoreParentEvidenceAuthenticationClaimed: false,
  modelCoreIntegration: false,
  browserRuntimeAdoption: false,
  releaseRuntimeReachability: false,
} as const);

export function buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchProtocolDefinitionV1() {
  return Object.freeze({
    stitchId:
      PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
    slsModes: SLS_MODES,
    directParents: Object.freeze({
      etaZeroBridge: Object.freeze({
        bridgeId: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
        manifestId:
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_EVIDENCE_MANIFEST_V1_ID,
        numericalEvidenceId:
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_NUMERICAL_EVIDENCE_V1_ID,
        manifestSha256: ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
        numericalEvidenceSha256:
          ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
        readinessSha256: ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
      }),
      coldMaterialBranch: Object.freeze({
        protocolId: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
        homotopyId: PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
        manifestId:
          PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_EVIDENCE_MANIFEST_V1_ID,
        numericalEvidenceId:
          PHASE_B1_PROJECT_SYNTHETIC_COLD_NUMERICAL_EVIDENCE_V1_ID,
        manifestSha256: ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
        numericalEvidenceSha256: ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
        readinessSha256: ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
      }),
    }),
    etaZeroBoundary: Object.freeze({
      bridgeDestinationEta: 0 as const,
      bridgeAnalyticEndpointEqualsColdAnchorEndpoint: "deep-exact" as const,
      bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode: "deep-exact" as const,
      bridgeLayoutEqualsColdLayout: "deep-exact" as const,
      enumerableUndefinedDistinguishedFromMissing: true as const,
      maximumScaledUnknownDifference: 0 as const,
      noReinitializationOrResolveByStitch: true as const,
    }),
    canonicalMaterialPath: Object.freeze({
      forwardSubdivisionCounts:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
          .requiredForwardSubdivisionCounts,
      canonicalSubdivisionCount: 8 as const,
      canonicalEtaValues:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
          .canonicalEtaValues,
      canonicalNodeCount: 9 as const,
      canonicalEdgeCount: 8 as const,
      reverseSubdivisionCount: 8 as const,
      fixedTimeBloodVolumesFlowsAndCalcium: true as const,
      numericalConstitutiveContinuationNotBiologicalLoadingPath: true as const,
    }),
    etaOneConstitutiveBoundary: Object.freeze({
      eta: 1 as const,
      assembledActiveDefinition:
        "totalKirchhoffStress-equilibriumPassiveKirchhoffStress-slsOverstress" as const,
      comparedQuantity: "raw-Land-active-Kirchhoff-stress" as const,
      maximumAbsoluteDifferencePa:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
          .maximumEtaOneAssembledToRawLandActiveStressDifferencePa,
      allFiveWallsAudited: true as const,
    }),
    finiteRootCensus: Object.freeze({
      etaValues:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .enumerationFractions,
      declaredSeeds:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds,
      allSeedsAttemptedAndConverged: true as const,
      everyConvergedResultPartitionedExactlyOnce: true as const,
      allDiscoveredClustersReported: true as const,
      selectionInputToAcceptedPath: false as const,
      globalExhaustivenessClaimed: false as const,
    }),
    policy:
      PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1,
    parentBridgePolicy: PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
    parentColdPolicy: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
    prohibitedOperations: PROHIBITED_OPERATIONS,
    claimBoundary: CLAIM_BOUNDARY,
  });
}

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchProtocolDefinitionV1 =
  ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchProtocolDefinitionV1
  >;

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_EVIDENCE_MANIFEST_V1_ID;
    status:
      "project-synthetic-b0-center-connected-b1-eta-one-material-branch-stitch-not-phase-b1-reference-acceptance";
    evidenceClass:
      "project-synthetic-cross-phase-exact-boundary-and-sampled-material-branch-stitch-regression";
    lineage: Readonly<{
      bridgeManifestSha256: typeof ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1;
      bridgeNumericalEvidenceSha256:
        typeof ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1;
      bridgeReadinessSha256:
        typeof ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1;
      coldManifestSha256: typeof ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1;
      coldNumericalEvidenceSha256:
        typeof ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1;
      coldReadinessSha256:
        typeof ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1;
      canonicalParentManifestsVerifiedLive: true;
      parentNumericalAndReadinessArtifactsRebuiltAndPinnedByNumericalEvidence: true;
    }>;
    bindings: Readonly<{
      protocolDefinitionSha256: string;
      directParentsSha256: string;
      etaZeroBoundarySha256: string;
      materialPathSha256: string;
      etaOneConstitutiveBoundarySha256: string;
      finiteRootCensusSha256: string;
      stitchPolicySha256: string;
      prohibitedOperationsSha256: string;
      claimBoundarySha256: string;
    }>;
    protocolDefinition:
      PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchProtocolDefinitionV1;
    implementationClaims: Readonly<{
      pairedPhysicalSlsModes: true;
      canonicalDirectParentBundlesRequired: true;
      etaZeroFullSolvedStateBoundaryIsDeepExact: true;
      canonicalOneTwoFourEightForwardPathsBound: true;
      canonicalEightSegmentForwardAndReversePathsBound: true;
      fixedTimeBloodVolumesFlowsAndCalciumAcrossPath: true;
      etaOneAssembledActiveEqualsRawLandAuditedPerWall: true;
      finiteDeclaredRootCensusPartitionAndLinkAudited: true;
      noEtaZeroResolveHiddenPathOperationOrCensusRootSelection: true;
    }>;
    deferred: Readonly<{
      phaseB0OverallAcceptance: true;
      acceptedPhaseB1ReferenceBranch: true;
      phaseB1LandCoupledFiniteVolumeGraph: true;
      phaseB1LandCoupledVolumeEnvelope: true;
      continuousEtaAndVolumeIntervalRegularity: true;
      globalRootUniquenessOrExhaustiveness: true;
      energeticStability: true;
      physiologicalInitializationAndStationarity: true;
      fullBeatAndPhysiologicalValidation: true;
      runtimeIntegration: true;
    }>;
    negativeClaims: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1 =
  PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestPayloadV1 &
  Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1 {
  verifyParentManifests(sha256Hex);
  const protocolDefinition =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchProtocolDefinitionV1();
  const payload:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_EVIDENCE_MANIFEST_V1_ID,
      status:
        "project-synthetic-b0-center-connected-b1-eta-one-material-branch-stitch-not-phase-b1-reference-acceptance",
      evidenceClass:
        "project-synthetic-cross-phase-exact-boundary-and-sampled-material-branch-stitch-regression",
      lineage: Object.freeze({
        bridgeManifestSha256: ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
        bridgeNumericalEvidenceSha256:
          ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
        bridgeReadinessSha256: ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
        coldManifestSha256: ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
        coldNumericalEvidenceSha256:
          ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
        coldReadinessSha256: ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
        canonicalParentManifestsVerifiedLive: true,
        parentNumericalAndReadinessArtifactsRebuiltAndPinnedByNumericalEvidence:
          true,
      }),
      bindings: Object.freeze({
        protocolDefinitionSha256: computeCanonicalSha256(
          protocolDefinition,
          sha256Hex,
        ),
        directParentsSha256: computeCanonicalSha256(
          protocolDefinition.directParents,
          sha256Hex,
        ),
        etaZeroBoundarySha256: computeCanonicalSha256(
          protocolDefinition.etaZeroBoundary,
          sha256Hex,
        ),
        materialPathSha256: computeCanonicalSha256(
          protocolDefinition.canonicalMaterialPath,
          sha256Hex,
        ),
        etaOneConstitutiveBoundarySha256: computeCanonicalSha256(
          protocolDefinition.etaOneConstitutiveBoundary,
          sha256Hex,
        ),
        finiteRootCensusSha256: computeCanonicalSha256(
          protocolDefinition.finiteRootCensus,
          sha256Hex,
        ),
        stitchPolicySha256: computeCanonicalSha256(
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
      }),
      protocolDefinition,
      implementationClaims: Object.freeze({
        pairedPhysicalSlsModes: true,
        canonicalDirectParentBundlesRequired: true,
        etaZeroFullSolvedStateBoundaryIsDeepExact: true,
        canonicalOneTwoFourEightForwardPathsBound: true,
        canonicalEightSegmentForwardAndReversePathsBound: true,
        fixedTimeBloodVolumesFlowsAndCalciumAcrossPath: true,
        etaOneAssembledActiveEqualsRawLandAuditedPerWall: true,
        finiteDeclaredRootCensusPartitionAndLinkAudited: true,
        noEtaZeroResolveHiddenPathOperationOrCensusRootSelection: true,
      }),
      deferred: Object.freeze({
        phaseB0OverallAcceptance: true,
        acceptedPhaseB1ReferenceBranch: true,
        phaseB1LandCoupledFiniteVolumeGraph: true,
        phaseB1LandCoupledVolumeEnvelope: true,
        continuousEtaAndVolumeIntervalRegularity: true,
        globalRootUniquenessOrExhaustiveness: true,
        energeticStability: true,
        physiologicalInitializationAndStationarity: true,
        fullBeatAndPhysiologicalValidation: true,
        runtimeIntegration: true,
      }),
      negativeClaims: CLAIM_BOUNDARY,
    });
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  STITCH_MANIFESTS_V1.add(manifest);
  return validatePhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
  manifest:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !STITCH_MANIFESTS_V1.has(manifest)
  ) throw new Error(
    "Phase B0-to-B1 eta-one stitch manifest must be canonically built in this process",
  );
  return manifest;
}

export function validatePhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
  manifest:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1 {
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
    manifest,
  );
  if (
    manifest.manifestId
      !== PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B0-to-B1 eta-one stitch manifest identity drifted");
  assertCanonicalSha256(
    phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  verifyParentManifests(sha256Hex);
  const expected =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchProtocolDefinitionV1();
  const protocol = manifest.protocolDefinition;
  const bindingChecks = [
    canonicalizeJson(protocol) === canonicalizeJson(expected),
    manifest.bindings.protocolDefinitionSha256
      === computeCanonicalSha256(protocol, sha256Hex),
    manifest.bindings.directParentsSha256
      === computeCanonicalSha256(protocol.directParents, sha256Hex),
    manifest.bindings.etaZeroBoundarySha256
      === computeCanonicalSha256(protocol.etaZeroBoundary, sha256Hex),
    manifest.bindings.materialPathSha256
      === computeCanonicalSha256(protocol.canonicalMaterialPath, sha256Hex),
    manifest.bindings.etaOneConstitutiveBoundarySha256
      === computeCanonicalSha256(protocol.etaOneConstitutiveBoundary, sha256Hex),
    manifest.bindings.finiteRootCensusSha256
      === computeCanonicalSha256(protocol.finiteRootCensus, sha256Hex),
    manifest.bindings.stitchPolicySha256
      === computeCanonicalSha256(protocol.policy, sha256Hex),
    manifest.bindings.prohibitedOperationsSha256
      === computeCanonicalSha256(protocol.prohibitedOperations, sha256Hex),
    manifest.bindings.claimBoundarySha256
      === computeCanonicalSha256(protocol.claimBoundary, sha256Hex),
    protocol.slsModes.join(",") === "on,off",
    protocol.canonicalMaterialPath.canonicalEtaValues.join(",")
      === "0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1",
    Object.values(protocol.prohibitedOperations)
      .every((value) => value === false),
    Object.values(protocol.claimBoundary).every((value) => value === false),
    Object.values(manifest.implementationClaims).every((value) => value === true),
    Object.values(manifest.deferred).every((value) => value === true),
    Object.values(manifest.negativeClaims).every((value) => value === false),
  ];
  if (bindingChecks.some((value) => !value)) {
    throw new Error("Phase B0-to-B1 eta-one stitch manifest binding drifted");
  }
  return manifest;
}

export function phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1(
  manifest:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function verifyParentManifests(sha256Hex: CanonicalSha256HexProvider): void {
  const bridge =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(sha256Hex);
  const cold =
    buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256Hex);
  if (
    bridge.contentSha256 !== ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1
    || cold.contentSha256 !== ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1
  ) throw new Error("Phase B0-to-B1 eta-one stitch parent manifest drifted");
}
