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
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1";
import {
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1,
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeReadinessV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1,
  stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
  ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
  ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
  ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
  ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
  ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1";
import {
  buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticColdInitializationReadinessV1";
import type { PhaseB1EndpointStateV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationEvidenceManifestV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  type PhaseB1ColdHomotopyPathSuccessV1,
  type PhaseB1ColdNodeSuccessV1,
  type PhaseB1ColdRootCensusV1,
  type PhaseB1ProjectSyntheticColdInitializationResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  assertCanonicalPhaseB1ProjectSyntheticColdNumericalEvidenceV1,
  buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1,
  phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1,
  type PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationNumericalEvidenceV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_NUMERICAL_EVIDENCE_V1_ID =
  "phase-b0-center-to-phase-b1-eta-one-material-branch-stitch-numerical-evidence-v1" as const;

const MODES = Object.freeze(["on", "off"] as const);
const CANONICAL_BUNDLES = new WeakSet<object>();

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchModeSummaryV1 =
  ReturnType<typeof summarizeMode>;

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidencePayloadV1 =
  Readonly<{
    evidenceId:
      typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_NUMERICAL_EVIDENCE_V1_ID;
    manifestSha256: string;
    directParentAuthentication: ReturnType<typeof parentAuthenticationRecord>;
    slsModes: typeof MODES;
    modes: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchModeSummaryV1
    >>;
    allModesPass: boolean;
  }>;

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceCertificateV1 =
  PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidencePayloadV1 &
  Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1 =
  Readonly<{
    certificate:
      PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceCertificateV1;
    bridgeEvidence:
      PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1;
    coldEvidence: PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1;
    results: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1
    >>;
  }>;

export function buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
  manifest:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
    manifest,
  );

  const bridgeManifest =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(sha256Hex);
  const bridgeEvidence =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
      bridgeManifest,
      sha256Hex,
    );
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
    bridgeEvidence,
    bridgeManifest,
  );
  const bridgeReadiness =
    buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1(
      bridgeManifest,
      bridgeEvidence,
    );

  const coldManifest =
    buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256Hex);
  const coldEvidence = buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
    coldManifest,
    sha256Hex,
  );
  assertCanonicalPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
    coldEvidence,
    coldManifest,
  );
  const coldReadiness =
    buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1(
      coldManifest,
      coldEvidence,
    );

  authenticateParents(
    bridgeManifest.contentSha256,
    bridgeEvidence,
    computeCanonicalSha256(bridgeReadiness, sha256Hex),
    coldManifest.contentSha256,
    coldEvidence,
    computeCanonicalSha256(coldReadiness, sha256Hex),
    sha256Hex,
  );
  const directParentAuthentication = parentAuthenticationRecord();

  const results = Object.freeze({
    on: stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
      bridgeEvidence.results.on,
      coldEvidence.results.on,
    ),
    off: stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
      bridgeEvidence.results.off,
      coldEvidence.results.off,
    ),
  });
  const modes = Object.freeze({
    on: summarizeMode(
      bridgeEvidence.results.on,
      coldEvidence.results.on,
      results.on,
      sha256Hex,
    ),
    off: summarizeMode(
      bridgeEvidence.results.off,
      coldEvidence.results.off,
      results.off,
      sha256Hex,
    ),
  });
  const payload:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidencePayloadV1 =
    Object.freeze({
      evidenceId:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_NUMERICAL_EVIDENCE_V1_ID,
      manifestSha256: manifest.contentSha256,
      directParentAuthentication,
      slsModes: MODES,
      modes,
      allModesPass:
        directParentAuthentication.allDirectParentsAuthenticated
        && modes.on.modePass
        && modes.off.modePass,
    });
  canonicalizeJson(payload);
  const certificate = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  const bundle = Object.freeze({
    certificate,
    bridgeEvidence,
    coldEvidence,
    results,
  });
  assertDeepFrozenPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
    bundle,
  );
  CANONICAL_BUNDLES.add(bundle);
  return bundle;
}

export function assertDeepFrozenPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
  bundle:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1 {
  assertRecursivelyFrozen(
    bundle,
    "phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundle",
    new WeakSet<object>(),
  );
  return bundle;
}

export function assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
  bundle:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
  manifest:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
    manifest,
  );
  if (
    bundle === null
    || typeof bundle !== "object"
    || !CANONICAL_BUNDLES.has(bundle)
    || bundle.certificate.manifestSha256 !== manifest.contentSha256
  ) throw new Error(
    "Phase B0-to-B1 eta-one stitch numerical evidence must be canonically built for this manifest",
  );
  assertDeepFrozenPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
    bundle,
  );
  return bundle;
}

export function phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1(
  certificate:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceCertificateV1,
): PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidencePayloadV1 {
  return Object.freeze({
    evidenceId: certificate.evidenceId,
    manifestSha256: certificate.manifestSha256,
    directParentAuthentication: certificate.directParentAuthentication,
    slsModes: certificate.slsModes,
    modes: certificate.modes,
    allModesPass: certificate.allModesPass,
  });
}

function parentAuthenticationRecord() {
  return Object.freeze({
    bridge: Object.freeze({
      manifestSha256: ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
      numericalEvidenceSha256:
        ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
      readinessSha256: ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
      manifestRebuiltAndPinned: true as const,
      numericalBundleCanonical: true as const,
      numericalCertificateSelfHashedAndPinned: true as const,
      readinessRebuiltAndPinned: true as const,
    }),
    cold: Object.freeze({
      manifestSha256: ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
      numericalEvidenceSha256: ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
      readinessSha256: ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
      manifestRebuiltAndPinned: true as const,
      numericalBundleCanonical: true as const,
      numericalCertificateSelfHashedAndPinned: true as const,
      readinessRebuiltAndPinned: true as const,
    }),
    exactSlsModeKeys: true as const,
    allDirectParentsAuthenticated: true as const,
  });
}

function authenticateParents(
  bridgeManifestSha256: string,
  bridgeEvidence: PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1,
  bridgeReadinessSha256: string,
  coldManifestSha256: string,
  coldEvidence: PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1,
  coldReadinessSha256: string,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  const bridgeCertificate = bridgeEvidence.certificate;
  const coldCertificate = coldEvidence.certificate;
  const exactModeKeys = [
    bridgeCertificate.slsModes,
    Object.keys(bridgeCertificate.modes),
    Object.keys(bridgeEvidence.results),
    Object.keys(coldCertificate.modes),
    Object.keys(coldEvidence.results),
  ].every((keys) => canonicalizeJson(keys) === canonicalizeJson(MODES));
  if (
    bridgeManifestSha256 !== ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1
    || bridgeCertificate.manifestSha256 !== bridgeManifestSha256
    || bridgeCertificate.contentSha256
      !== ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1
    || bridgeCertificate.contentSha256 !== computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1(
        bridgeCertificate,
      ),
      sha256Hex,
    )
    || !bridgeCertificate.allModesPass
    || bridgeReadinessSha256 !== ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1
    || coldManifestSha256 !== ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1
    || coldCertificate.manifestSha256 !== coldManifestSha256
    || coldCertificate.contentSha256
      !== ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1
    || coldCertificate.contentSha256 !== computeCanonicalSha256(
      phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1(coldCertificate),
      sha256Hex,
    )
    || !coldCertificate.allModesPass
    || coldReadinessSha256 !== ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1
    || !exactModeKeys
    || MODES.some((mode) =>
      bridgeEvidence.results[mode].slsMode !== mode
      || coldEvidence.results[mode].slsMode !== mode)
  ) throw new Error("Phase B0-to-B1 eta-one stitch direct-parent authentication failed");
}

function summarizeMode(
  bridge: PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1["results"][PhaseB0SlsModeV1],
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const canonicalForward = cold.canonicalForwardPath;
  const canonicalReverse = cold.canonicalReversePath;
  if (
    canonicalForward === null
    || !canonicalForward.completed
    || canonicalReverse === null
    || !canonicalReverse.completed
  ) throw new Error("eta-one stitch summary requires canonical forward and reverse paths");
  const successfulForward = cold.forwardPaths.filter(
    (path): path is PhaseB1ColdHomotopyPathSuccessV1 => path.completed,
  );
  if (successfulForward.length !== 4) {
    throw new Error("eta-one stitch summary requires four successful forward paths");
  }
  const etaZeroBridgeAnalytic = endpointProjection(
    bridge.destination.analyticallyReequilibratedSeedEndpoint,
  );
  const etaZeroColdAnchor = endpointProjection(cold.anchorEndpoint);
  const etaZeroBridgeSolved = nodeProjection(bridge.destination.node, sha256Hex);
  const etaZeroColdCanonical = nodeProjection(canonicalForward.nodes[0], sha256Hex);
  const etaZeroBoundary = Object.freeze({
    bridgeAnalyticEndpointProjectionSha256: computeCanonicalSha256(
      etaZeroBridgeAnalytic,
      sha256Hex,
    ),
    coldAnchorEndpointProjectionSha256: computeCanonicalSha256(
      etaZeroColdAnchor,
      sha256Hex,
    ),
    bridgeSolvedNodeProjectionSha256: computeCanonicalSha256(
      etaZeroBridgeSolved,
      sha256Hex,
    ),
    coldCanonicalEtaZeroNodeProjectionSha256: computeCanonicalSha256(
      etaZeroColdCanonical,
      sha256Hex,
    ),
    bridgeSolvedUnknownsSha256: vectorSha(
      bridge.destination.node.unknowns,
      sha256Hex,
    ),
    coldCanonicalEtaZeroUnknownsSha256: vectorSha(
      canonicalForward.nodes[0].unknowns,
      sha256Hex,
    ),
    bridgeAnalyticEndpointEqualsColdAnchorEndpoint:
      stitch.etaZeroBoundary.bridgeAnalyticEndpointEqualsColdAnchorEndpoint,
    bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode:
      stitch.etaZeroBoundary.bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode,
    layoutExact: stitch.etaZeroBoundary.layoutExact,
    maximumScaledUnknownDifference:
      stitch.etaZeroBoundary.maximumScaledUnknownDifference,
    noEtaZeroReinitializationOrResolveAppliedByStitch:
      stitch.etaZeroBoundary.noEtaZeroReinitializationOrResolveAppliedByStitch,
    projectionHashesExact:
      canonicalizeJson(etaZeroBridgeAnalytic) === canonicalizeJson(etaZeroColdAnchor)
      && canonicalizeJson(etaZeroBridgeSolved)
        === canonicalizeJson(etaZeroColdCanonical),
  });

  const forwardPaths = Object.freeze(successfulForward.map((path) =>
    detailedPathProjection(path, sha256Hex)));
  const canonicalForwardProjection = detailedPathProjection(
    canonicalForward,
    sha256Hex,
  );
  const canonicalReverseProjection = detailedPathProjection(
    canonicalReverse,
    sha256Hex,
  );
  const canonicalMaterialPath = Object.freeze({
    forwardPaths,
    canonicalForward: canonicalForwardProjection,
    canonicalReverse: canonicalReverseProjection,
    maximumEndpointAgreementScaledInfinityNorm:
      stitch.canonicalMaterialPath.maximumEndpointAgreementScaledInfinityNorm,
    reverseClosureToBridgeEtaZeroScaledInfinityNorm:
      stitch.canonicalMaterialPath.reverseClosureToBridgeEtaZeroScaledInfinityNorm,
    everyNodeAccepted: stitch.canonicalMaterialPath.everyNodeAccepted,
    fixedTimeVolumesFlowsAndCalciumAcrossPath:
      stitch.canonicalMaterialPath.fixedTimeVolumesFlowsAndCalciumAcrossPath,
    prohibitedOperationsAbsent:
      stitch.canonicalMaterialPath.prohibitedOperationsAbsent,
    canonicalGridExact:
      canonicalizeJson(canonicalForward.requestedEtaValues)
        === canonicalizeJson(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .canonicalEtaValues,
        )
      && canonicalizeJson(canonicalForward.attemptedEtaValues)
        === canonicalizeJson(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .canonicalEtaValues,
        ),
  });

  const etaOneNode = stitch.etaOne.node;
  const independentlyProjectedWalls = wallRecord((wallId) => {
    const wall = etaOneNode.residualEvaluation.closedLoop.wallMechanics[wallId];
    const assembledActiveStressPa = wall.totalKirchhoffStressPa
      - wall.equilibriumPassive.equilibriumKirchhoffStressPa
      - wall.slsOverstressPa;
    return Object.freeze({
      rawLandActiveStressPa: wall.activeKirchhoffStressPa,
      assembledActiveStressPa,
      absoluteDifferencePa: Math.abs(
        assembledActiveStressPa - wall.activeKirchhoffStressPa,
      ),
    });
  });
  const independentlyMaximumEtaOneDifference = Math.max(
    ...WALL_IDS.map((wallId) =>
      independentlyProjectedWalls[wallId].absoluteDifferencePa),
  );
  const etaOne = Object.freeze({
    eta: etaOneNode.eta,
    node: nodeProjection(etaOneNode, sha256Hex),
    endpointProjectionSha256: computeCanonicalSha256(
      endpointProjection(etaOneNode.endpoint),
      sha256Hex,
    ),
    unknownsSha256: vectorSha(etaOneNode.unknowns, sha256Hex),
    wallByWall: independentlyProjectedWalls,
    maximumAssembledToRawLandActiveStressDifferencePa:
      independentlyMaximumEtaOneDifference,
    reportedWallAuditExact:
      canonicalizeJson(independentlyProjectedWalls)
        === canonicalizeJson(stitch.etaOne.wallByWall),
    reportedMaximumExact:
      independentlyMaximumEtaOneDifference
        === stitch.etaOne.maximumAssembledToRawLandActiveStressDifferencePa,
    canonicalLandAssemblyPass:
      independentlyMaximumEtaOneDifference
        <= PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
          .maximumEtaOneAssembledToRawLandActiveStressDifferencePa,
  });

  const censuses = Object.freeze(cold.rootCensus.map((census) =>
    censusProjection(census, cold.layout.unknownScales, sha256Hex)));
  const finiteRootCensus = Object.freeze({
    censuses,
    etaZeroMatchingRestoringClusterCount:
      stitch.finiteRootCensus.etaZeroMatchingRestoringClusterCount,
    etaZeroSeparateSaddleClusterReported:
      stitch.finiteRootCensus.etaZeroSeparateSaddleClusterReported,
    etaOneMatchingRestoringClusterCount:
      stitch.finiteRootCensus.etaOneMatchingRestoringClusterCount,
    allDeclaredSeedsAttemptedAndConverged:
      stitch.finiteRootCensus.allDeclaredSeedsAttemptedAndConverged,
    everyConvergedResultPartitionedExactlyOnce:
      stitch.finiteRootCensus.everyConvergedResultPartitionedExactlyOnce,
    allDiscoveredRootsReported:
      stitch.finiteRootCensus.allDiscoveredRootsReported,
    selectionInputToAcceptedPath:
      stitch.finiteRootCensus.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed:
      stitch.finiteRootCensus.globalExhaustivenessClaimed,
    censusBoundaryPass: censuses.length === 2
      && censuses.every((census) => census.censusBoundaryPass),
  });
  const broadNegativeClaims = broadClaims(stitch);
  const modePass = stitch.slsMode === bridge.slsMode
    && stitch.slsMode === cold.slsMode
    && stitch.phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass
    && etaZeroBoundary.projectionHashesExact
    && etaZeroBoundary.maximumScaledUnknownDifference === 0
    && canonicalMaterialPath.canonicalGridExact
    && canonicalMaterialPath.everyNodeAccepted
    && canonicalMaterialPath.fixedTimeVolumesFlowsAndCalciumAcrossPath
    && canonicalMaterialPath.prohibitedOperationsAbsent
    && etaOne.eta === 1
    && etaOne.reportedWallAuditExact
    && etaOne.reportedMaximumExact
    && etaOne.canonicalLandAssemblyPass
    && finiteRootCensus.censusBoundaryPass
    && finiteRootCensus.everyConvergedResultPartitionedExactlyOnce
    && !finiteRootCensus.selectionInputToAcceptedPath
    && !finiteRootCensus.globalExhaustivenessClaimed
    && stitch.testOnly
    && Object.values(broadNegativeClaims).every((value) => value === false);
  return Object.freeze({
    slsMode: stitch.slsMode,
    sourceModeResultsTakenFromCanonicalBundles: true as const,
    etaZeroBoundary,
    canonicalMaterialPath,
    etaOne,
    finiteRootCensus,
    broadNegativeClaims,
    testOnly: stitch.testOnly,
    modePass,
  });
}

function endpointProjection(endpoint: PhaseB1EndpointStateV1) {
  const state = endpoint.differentialState;
  const common = {
    timeSec: endpoint.timeSec,
    bloodVolumesM3: recordProjection(state.bloodVolumesM3, BLOOD_COMPARTMENT_IDS),
    inertialFlowsM3PerSec: recordProjection(
      state.inertialFlowsM3PerSec,
      INERTIAL_FLOW_IDS,
    ),
    calciumByWall: wallRecord((wallId) => Object.freeze({
      r: state.calciumByWall[wallId].r,
      d: state.calciumByWall[wallId].d,
    })),
    landByWall: wallRecord((wallId) =>
      Object.freeze([...state.landByWall[wallId]])),
    triSegCoordinates: Object.freeze({ ...endpoint.triSegCoordinates }),
  };
  return state.slsMode === "on"
    ? Object.freeze({
      ...common,
      slsMode: "on" as const,
      slsAlphaVByWall: recordProjection(state.slsAlphaVByWall, WALL_IDS),
    })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

function nodeProjection(
  node: PhaseB1ColdNodeSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    eta: node.eta,
    unknownCount: node.unknowns.length,
    unknownsSha256: vectorSha(node.unknowns, sha256Hex),
    residualCount: node.residualEvaluation.residual.length,
    residualVectorSha256: vectorSha(
      node.residualEvaluation.residual,
      sha256Hex,
    ),
    endpointProjectionSha256: computeCanonicalSha256(
      endpointProjection(node.endpoint),
      sha256Hex,
    ),
    scaledResidualInfinityNorm: node.scaledResidualInfinityNorm,
    scaledUpdateInfinityNorm: node.scaledUpdateInfinityNorm,
    minimumLandSimplexMargin: node.minimumLandSimplexMargin,
    maximumLocalMaterialResidualInfinityNorm:
      node.maximumLocalMaterialResidualInfinityNorm,
    effectiveTriSeg: Object.freeze({
      classification: node.effectiveTriSegAudit.classification,
      sigmaMinimum: node.effectiveTriSegAudit.sigmaMinimum,
      conditionNumber2: node.effectiveTriSegAudit.conditionNumber2,
      robustSignedMargin: node.effectiveTriSegAudit.robustSignedMargin,
      schurToReequilibratedDifferenceTwoNorm:
        node.effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
      accepted: node.effectiveTriSegAudit.accepted,
    }),
    projectionApplied: node.projectionApplied,
    clippingApplied: node.clippingApplied,
    fallbackApplied: node.fallbackApplied,
  });
}

function pathProjection(
  path: PhaseB1ColdHomotopyPathSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    direction: path.direction,
    requestedSubdivisionCount: path.requestedSubdivisionCount,
    requestedEtaValues: Object.freeze([...path.requestedEtaValues]),
    attemptedEtaValues: Object.freeze([...path.attemptedEtaValues]),
    nodeCount: path.nodes.length,
    edgeCount: path.edgeAudits.length,
    endpointUnknownsSha256: vectorSha(path.endpoint.unknowns, sha256Hex),
    pathEntryCorrectionScaledInfinityNorm:
      path.pathEntryCorrectionScaledInfinityNorm,
    maximumAcceptedNodeStepScaledInfinityNorm:
      path.maximumAcceptedNodeStepScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm:
      path.maximumPredictorCorrectionScaledInfinityNorm,
    branchIdentityEstablished: path.branchIdentityEstablished,
    previousNodeUsedAs: path.previousNodeUsedAs,
    prohibitedOperationsAbsent: pathProhibitedOperationsAbsent(path),
  });
}

function detailedPathProjection(
  path: PhaseB1ColdHomotopyPathSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
) {
  return Object.freeze({
    ...pathProjection(path, sha256Hex),
    nodes: Object.freeze(path.nodes.map((node) =>
      nodeProjection(node, sha256Hex))),
    edges: Object.freeze(path.edgeAudits.map((edge, index) => Object.freeze({
      index,
      fromEta: edge.fromEta,
      toEta: edge.toEta,
      predictorUnknownsSha256: vectorSha(edge.predictorUnknowns, sha256Hex),
      acceptedUnknownsSha256: vectorSha(edge.acceptedUnknowns, sha256Hex),
      acceptedNodeStepScaledInfinityNorm:
        edge.acceptedNodeStepScaledInfinityNorm,
      predictorCorrectionScaledInfinityNorm:
        edge.predictorCorrectionScaledInfinityNorm,
    }))),
  });
}

function censusProjection(
  census: PhaseB1ColdRootCensusV1,
  unknownScales: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
) {
  const results = Object.freeze(census.results.map((result, resultIndex) => {
    if (result.converged === true) return Object.freeze({
        resultIndex,
        converged: true as const,
        eta: result.eta,
        unknownsSha256: vectorSha(result.unknowns, sha256Hex),
        coordinates: Object.freeze({ ...result.endpoint.triSegCoordinates }),
        classification: result.effectiveTriSegAudit.classification,
        scaledResidualInfinityNorm: result.scaledResidualInfinityNorm,
      });
    return Object.freeze({
      resultIndex,
      converged: false as const,
      eta: result.eta,
      reason: result.reason,
      rollbackUnknownsSha256: vectorSha(result.rollbackUnknowns, sha256Hex),
    });
  }));
  const clusters = Object.freeze(census.clusters.map((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    const members = Object.freeze(cluster.memberResultIndices.map(
      (memberResultIndex) => {
        const member = census.results[memberResultIndex];
        if (representative?.converged === true && member?.converged === true) {
          return Object.freeze({
            memberResultIndex,
            converged: true as const,
            classification: member.effectiveTriSegAudit.classification,
            representativeScaledInfinityDistance: scaledInfinityDistance(
              representative.unknowns,
              member.unknowns,
              unknownScales,
            ),
          });
        }
        return Object.freeze({
          memberResultIndex,
          converged: false as const,
          classification: null,
          representativeScaledInfinityDistance: null,
        });
      },
    ));
    const memberClassificationAndDistancePass =
      representative?.converged === true
      && cluster.classification
        === representative.effectiveTriSegAudit.classification
      && canonicalizeJson(cluster.coordinates)
        === canonicalizeJson(representative.endpoint.triSegCoordinates)
      && members.every((member) =>
        member.converged
        && member.classification === cluster.classification
        && member.representativeScaledInfinityDistance !== null
        && member.representativeScaledInfinityDistance
          <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .rootClusteringScaledInfinityTolerance);
    return Object.freeze({
      representativeResultIndex: cluster.representativeResultIndex,
      memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
      classification: cluster.classification,
      coordinates: Object.freeze({ ...cluster.coordinates }),
      members,
      memberClassificationAndDistancePass,
    });
  }));
  const convergedIndices = census.results.flatMap((result, index) =>
    result.converged ? [index] : []);
  const memberIndices = clusters.flatMap((cluster) =>
    cluster.memberResultIndices).sort((left, right) => left - right);
  const partitionPass = canonicalizeJson(convergedIndices)
      === canonicalizeJson(memberIndices)
    && new Set(memberIndices).size === memberIndices.length
    && clusters.every((cluster) =>
      cluster.memberResultIndices.includes(cluster.representativeResultIndex))
    && clusters.every((cluster) =>
      cluster.memberClassificationAndDistancePass);
  const censusBoundaryPass = census.seeds.length
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .enumerationSeeds.length
    && census.results.length === census.seeds.length
    && census.enumerationCompleted
    && census.allSeedsAttempted
    && census.allSeedsConverged
    && census.allDiscoveredRootsReported
    && !census.selectionInputToAcceptedPath
    && !census.globalExhaustivenessClaimed
    && partitionPass;
  return Object.freeze({
    eta: census.eta,
    seeds: Object.freeze(census.seeds.map((seed) => Object.freeze({ ...seed }))),
    results,
    convergedRootCount: census.convergedRootCount,
    clusters,
    partitionPass,
    allMemberClassificationsAndDistancesPass: clusters.every((cluster) =>
      cluster.memberClassificationAndDistancePass),
    enumerationCompleted: census.enumerationCompleted,
    allSeedsAttempted: census.allSeedsAttempted,
    allSeedsConverged: census.allSeedsConverged,
    allDiscoveredRootsReported: census.allDiscoveredRootsReported,
    selectionInputToAcceptedPath: census.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed: census.globalExhaustivenessClaimed,
    censusBoundaryPass,
  });
}

function broadClaims(stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1) {
  return Object.freeze({
    phaseB0OverallAcceptancePass: stitch.phaseB0OverallAcceptancePass,
    acceptedPhaseB1ReferenceBranchPass:
      stitch.acceptedPhaseB1ReferenceBranchPass,
    phaseB1LandCoupledFiniteVolumeGraphPass:
      stitch.phaseB1LandCoupledFiniteVolumeGraphPass,
    phaseB1LandCoupledVolumeEnvelopePass:
      stitch.phaseB1LandCoupledVolumeEnvelopePass,
    continuousEtaIntervalRegularityPass:
      stitch.continuousEtaIntervalRegularityPass,
    continuousVolumeIntervalRegularityPass:
      stitch.continuousVolumeIntervalRegularityPass,
    globalRootUniquenessPass: stitch.globalRootUniquenessPass,
    globalRootExhaustivenessPass: stitch.globalRootExhaustivenessPass,
    energeticStabilityPass: stitch.energeticStabilityPass,
    physiologicalInitializationPass: stitch.physiologicalInitializationPass,
    closedLoopStationarityPass: stitch.closedLoopStationarityPass,
    fullBeatAcceptancePass: stitch.fullBeatAcceptancePass,
    physiologicalValidationPass: stitch.physiologicalValidationPass,
    phaseB1AcceptancePass: stitch.phaseB1AcceptancePass,
    supportedEnvelopePass: stitch.supportedEnvelopePass,
    releaseRuntimePass: stitch.releaseRuntimePass,
    pureCoreParentEvidenceAuthenticationClaimed:
      stitch.pureCoreParentEvidenceAuthenticationClaimed,
    modelCoreIntegration: stitch.modelCoreIntegration,
    browserRuntimeAdopted: stitch.browserRuntimeAdopted,
    releaseRuntimeReachable: stitch.releaseRuntimeReachable,
  });
}

function pathProhibitedOperationsAbsent(
  path: PhaseB1ColdHomotopyPathSuccessV1,
): boolean {
  return !path.hiddenSubdivisionApplied
    && !path.pseudoArclengthApplied
    && !path.projectionApplied
    && !path.clippingApplied
    && !path.nearestRootSelectionApplied
    && !path.minimumResidualRootSelectionApplied
    && !path.maximumJunctionRadiusRootSelectionApplied;
}

function vectorSha(
  vector: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return computeCanonicalSha256(Object.freeze([...vector]), sha256Hex);
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("eta-one stitch numerical evidence vector dimension drifted");
  }
  return Math.max(0, ...left.map((value, index) =>
    Math.abs((value - right[index]) / scales[index])));
}

function wallRecord<T>(
  evaluate: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, evaluate(wallId)]),
  )) as Readonly<Record<FourChamberWallId, T>>;
}

function recordProjection<K extends string>(
  record: Readonly<Record<K, number>>,
  keys: readonly K[],
): Readonly<Record<K, number>> {
  return Object.freeze(Object.fromEntries(
    keys.map((key) => [key, record[key]]),
  )) as Readonly<Record<K, number>>;
}

function assertRecursivelyFrozen(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): void {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  if (!Object.isFrozen(value)) {
    throw new Error(`Canonical stitch evidence object is not frozen at ${path}`);
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    assertRecursivelyFrozen(
      Reflect.get(value, key),
      `${path}.${String(key)}`,
      seen,
    );
  }
}
