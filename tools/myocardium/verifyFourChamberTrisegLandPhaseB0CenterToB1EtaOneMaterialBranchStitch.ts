import { createHash } from "node:crypto";
import {
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type {
  PhaseB0SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1,
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
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1";
import {
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchReadinessV1";
import {
  buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticColdInitializationReadinessV1";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1,
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

const EXPECTED_STITCH_MANIFEST_SHA256 =
  "1d1459076227bfd16f924bb19d8f3fa9e5a59408480fb7d644369858d5ef8edd";
const EXPECTED_STITCH_NUMERICAL_EVIDENCE_SHA256 =
  "6759092ba01aa58cda41ef5f529f67bdeb7ebc3ee6cdd7afeba61c519af5adef";
const EXPECTED_STITCH_READINESS_SHA256 =
  "b9dfa93528f0431659d53b8c5998e490093a6236c636570cb21f4e729b90336a";
const MODES = Object.freeze(["on", "off"] as const);
const MINIMUM_NONDEGENERATE_ETA_ZERO_RAW_ACTIVE_DIFFERENCE_PA = 1_000;
const failures: string[] = [];

type RawEtaZeroBoundaryProjection = Readonly<{
  bridgeAnalyticEndpointEqualsColdAnchorEndpoint: boolean;
  bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode: boolean;
  layoutExact: boolean;
  maximumScaledUnknownDifference: number;
  noEtaZeroReinitializationOrResolveAppliedByStitch: boolean;
}>;

type RawCanonicalMaterialPathProjection = Readonly<{
  protocolId: string;
  homotopyId: string;
  subdivisionCounts: readonly number[];
  canonicalSubdivisionCount: number;
  canonicalEtaValues: readonly number[];
  nodeCount: number;
  edgeCount: number;
  maximumEndpointAgreementScaledInfinityNorm: number;
  reverseClosureToBridgeEtaZeroScaledInfinityNorm: number;
  everyNodeAccepted: boolean;
  fixedTimeVolumesFlowsAndCalciumAcrossPath: boolean;
  prohibitedOperationsAbsent: boolean;
}>;

type RawFiniteRootCensusProjection = Readonly<{
  etaZeroMatchingRestoringClusterCount: number;
  etaZeroSeparateSaddleClusterReported: boolean;
  etaOneMatchingRestoringClusterCount: number;
  allDeclaredSeedsAttemptedAndConverged: boolean;
  everyConvergedResultPartitionedExactlyOnce: boolean;
  allDiscoveredRootsReported: boolean;
  selectionInputToAcceptedPath: boolean;
  globalExhaustivenessClaimed: boolean;
}>;

type RawModeProjection = Readonly<{
  etaZeroBoundary: RawEtaZeroBoundaryProjection;
  canonicalMaterialPath: RawCanonicalMaterialPathProjection;
  canonicalGridExact: boolean;
  finiteRootCensus: RawFiniteRootCensusProjection;
}>;

try {
  verifyDeepExactComparatorBoundary();

  const bridgeManifest =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(sha256);
  const bridgeEvidence =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
      bridgeManifest,
      sha256,
    );
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
    bridgeManifest,
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
    buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256);
  const coldEvidence = buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
    coldManifest,
    sha256,
  );
  assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
    coldManifest,
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

  const manifest =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
      sha256,
    );
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
    manifest,
  );
  const numericalEvidence =
    buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
      manifest,
      sha256,
    );
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
    numericalEvidence,
    manifest,
  );
  const readiness =
    buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1(
      manifest,
      numericalEvidence,
    );

  const hashes = verifyArtifacts(
    bridgeManifest,
    bridgeEvidence,
    bridgeReadiness,
    coldManifest,
    coldEvidence,
    coldReadiness,
    manifest,
    numericalEvidence,
    readiness,
  );
  const modeMetrics = Object.freeze(Object.fromEntries(MODES.map((mode) => [
    mode,
    verifyMode(
      mode,
      numericalEvidence.bridgeEvidence,
      numericalEvidence.coldEvidence,
      numericalEvidence.results[mode],
      numericalEvidence.certificate.modes[mode],
    ),
  ]))) as Readonly<Record<PhaseB0SlsModeV1, ReturnType<typeof verifyMode>>>;
  verifyReadinessBoundary(readiness, manifest.contentSha256,
    numericalEvidence.certificate.contentSha256);

  const report = Object.freeze({
    pass: failures.length === 0,
    phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass:
      failures.length === 0,
    phaseB0OverallAcceptancePass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    phaseB1LandCoupledFiniteVolumeGraphPass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    continuousEtaIntervalRegularityPass: false,
    continuousVolumeIntervalRegularityPass: false,
    globalRootUniquenessPass: false,
    globalRootExhaustivenessPass: false,
    energeticStabilityPass: false,
    physiologicalInitializationPass: false,
    closedLoopStationarityPass: false,
    fullBeatAcceptancePass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
    evidenceLayerDirectParentAuthenticationPass:
      numericalEvidence.certificate.directParentAuthentication
        .allDirectParentsAuthenticated
      && readiness.implementation.evidenceLayerDirectParentAuthenticationPass,
    pureCoreParentEvidenceAuthenticationClaimed: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    hashes,
    lineage: manifest.lineage,
    evidenceBoundary: readiness.evidenceBoundary,
    modeMetrics,
    failures: Object.freeze([...failures]),
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    pass: false,
    phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    phaseB1LandCoupledFiniteVolumeGraphPass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
    failures,
  }, null, 2));
  process.exitCode = 1;
}

function verifyArtifacts(
  bridgeManifest: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1
  >,
  bridgeEvidence: PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1,
  bridgeReadiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1
  >,
  coldManifest: ReturnType<
    typeof buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1
  >,
  coldEvidence: PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1,
  coldReadiness: ReturnType<
    typeof buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1
  >,
  manifest: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1
  >,
  numericalEvidence: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1
  >,
  readiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1
  >,
) {
  const bridgeReadinessSha256 = computeCanonicalSha256(bridgeReadiness, sha256);
  const coldReadinessSha256 = computeCanonicalSha256(coldReadiness, sha256);
  const readinessSha256 = computeCanonicalSha256(readiness, sha256);

  const recursivelyFrozenArtifacts = [
    bridgeManifest,
    bridgeEvidence,
    bridgeReadiness,
    coldManifest,
    coldEvidence,
    coldReadiness,
    manifest,
    numericalEvidence,
    readiness,
  ].every((artifact) => isDeepFrozen(artifact));
  if (!recursivelyFrozenArtifacts) {
    failures.push(
      "manifest, numerical bundle, readiness, or embedded raw parent/result graph is not recursively frozen",
    );
  }

  expectEqual(
    "bridge parent manifest self hash",
    bridgeManifest.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1(
        bridgeManifest,
      ),
      sha256,
    ),
  );
  expectEqual(
    "bridge parent numerical self hash",
    bridgeEvidence.certificate.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1(
        bridgeEvidence.certificate,
      ),
      sha256,
    ),
  );
  expectEqual("bridge parent manifest pin", bridgeManifest.contentSha256,
    ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1);
  expectEqual("bridge parent numerical pin",
    bridgeEvidence.certificate.contentSha256,
    ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1);
  expectEqual("bridge parent readiness pin", bridgeReadinessSha256,
    ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1);

  expectEqual(
    "cold parent manifest self hash",
    coldManifest.contentSha256,
    computeCanonicalSha256(
      phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1(
        coldManifest,
      ),
      sha256,
    ),
  );
  expectEqual(
    "cold parent numerical self hash",
    coldEvidence.certificate.contentSha256,
    computeCanonicalSha256(
      phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1(
        coldEvidence.certificate,
      ),
      sha256,
    ),
  );
  expectEqual("cold parent manifest pin", coldManifest.contentSha256,
    ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1);
  expectEqual("cold parent numerical pin",
    coldEvidence.certificate.contentSha256,
    ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1);
  expectEqual("cold parent readiness pin", coldReadinessSha256,
    ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1);

  expectEqual(
    "stitch manifest self hash",
    manifest.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ),
  );
  expectEqual("stitch manifest pin", manifest.contentSha256,
    EXPECTED_STITCH_MANIFEST_SHA256);
  expectEqual(
    "stitch numerical self hash",
    numericalEvidence.certificate.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1(
        numericalEvidence.certificate,
      ),
      sha256,
    ),
  );
  expectEqual("stitch numerical pin",
    numericalEvidence.certificate.contentSha256,
    EXPECTED_STITCH_NUMERICAL_EVIDENCE_SHA256);
  expectEqual("stitch readiness pin", readinessSha256,
    EXPECTED_STITCH_READINESS_SHA256);

  for (const [label, keys] of [
    ["bridge certificate modes", bridgeEvidence.certificate.slsModes],
    ["bridge summary keys", Object.keys(bridgeEvidence.certificate.modes)],
    ["bridge result keys", Object.keys(bridgeEvidence.results)],
    ["cold summary keys", Object.keys(coldEvidence.certificate.modes)],
    ["cold result keys", Object.keys(coldEvidence.results)],
    ["stitch certificate modes", numericalEvidence.certificate.slsModes],
    ["stitch summary keys", Object.keys(numericalEvidence.certificate.modes)],
    ["stitch result keys", Object.keys(numericalEvidence.results)],
    ["embedded bridge result keys", Object.keys(numericalEvidence.bridgeEvidence.results)],
    ["embedded cold result keys", Object.keys(numericalEvidence.coldEvidence.results)],
  ] as const) expectDeepExact(label, keys, MODES);

  try {
    assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
      numericalEvidence.bridgeEvidence,
      bridgeManifest,
    );
  } catch (error) {
    failures.push(`embedded bridge bundle failed canonical WeakSet gate: ${message(error)}`);
  }
  try {
    assertCanonicalPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
      numericalEvidence.coldEvidence,
      coldManifest,
    );
  } catch (error) {
    failures.push(`embedded cold bundle failed canonical WeakSet gate: ${message(error)}`);
  }
  if (
    !deepExactEqual(
      numericalEvidence.bridgeEvidence.certificate,
      bridgeEvidence.certificate,
    )
    || !deepExactEqual(
      numericalEvidence.coldEvidence.certificate,
      coldEvidence.certificate,
    )
    || !MODES.every((mode) =>
      deepExactEqual(
        numericalEvidence.bridgeEvidence.results[mode],
        bridgeEvidence.results[mode],
      )
      && deepExactEqual(
        numericalEvidence.coldEvidence.results[mode],
        coldEvidence.results[mode],
      ))
  ) failures.push("embedded parent bundles differ from independently rebuilt parents");

  const protocol = manifest.protocolDefinition;
  const bindingChecks = [
    manifest.bindings.protocolDefinitionSha256
      === computeCanonicalSha256(protocol, sha256),
    manifest.bindings.directParentsSha256
      === computeCanonicalSha256(protocol.directParents, sha256),
    manifest.bindings.etaZeroBoundarySha256
      === computeCanonicalSha256(protocol.etaZeroBoundary, sha256),
    manifest.bindings.materialPathSha256
      === computeCanonicalSha256(protocol.canonicalMaterialPath, sha256),
    manifest.bindings.etaOneConstitutiveBoundarySha256
      === computeCanonicalSha256(protocol.etaOneConstitutiveBoundary, sha256),
    manifest.bindings.finiteRootCensusSha256
      === computeCanonicalSha256(protocol.finiteRootCensus, sha256),
    manifest.bindings.stitchPolicySha256
      === computeCanonicalSha256(protocol.policy, sha256),
    manifest.bindings.prohibitedOperationsSha256
      === computeCanonicalSha256(protocol.prohibitedOperations, sha256),
    manifest.bindings.claimBoundarySha256
      === computeCanonicalSha256(protocol.claimBoundary, sha256),
    Object.values(manifest.implementationClaims).every((value) => value === true),
    Object.values(manifest.deferred).every((value) => value === true),
    Object.values(manifest.negativeClaims).every((value) => value === false),
    Object.values(protocol.prohibitedOperations).every((value) => value === false),
    Object.values(protocol.claimBoundary).every((value) => value === false),
    bridgeEvidence.certificate.allModesPass,
    coldEvidence.certificate.allModesPass,
    numericalEvidence.certificate.directParentAuthentication
      .allDirectParentsAuthenticated,
    numericalEvidence.certificate.allModesPass,
  ];
  if (bindingChecks.some((value) => !value)) {
    failures.push("stitch protocol, inner hashes, parent authentication, or claims drifted");
  }
  expectDeepExact("stitch manifest lineage", manifest.lineage, Object.freeze({
    bridgeManifestSha256: ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
    bridgeNumericalEvidenceSha256:
      ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
    bridgeReadinessSha256: ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
    coldManifestSha256: ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
    coldNumericalEvidenceSha256:
      ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
    coldReadinessSha256: ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
    canonicalParentManifestsVerifiedLive: true,
    parentNumericalAndReadinessArtifactsRebuiltAndPinnedByNumericalEvidence: true,
  }));

  return Object.freeze({
    manifest: manifest.contentSha256,
    numericalEvidence: numericalEvidence.certificate.contentSha256,
    readiness: readinessSha256,
    bridgeParentManifest: bridgeManifest.contentSha256,
    bridgeParentNumericalEvidence: bridgeEvidence.certificate.contentSha256,
    bridgeParentReadiness: bridgeReadinessSha256,
    coldParentManifest: coldManifest.contentSha256,
    coldParentNumericalEvidence: coldEvidence.certificate.contentSha256,
    coldParentReadiness: coldReadinessSha256,
    recursivelyFrozenArtifacts,
  });
}

function verifyMode(
  mode: PhaseB0SlsModeV1,
  bridgeEvidence: PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1,
  coldEvidence: PhaseB1ProjectSyntheticColdNumericalEvidenceBundleV1,
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
  publishedSummary: unknown,
) {
  const prefix = `SLS-${mode}`;
  const bridge = bridgeEvidence.results[mode];
  const cold = coldEvidence.results[mode];
  if (
    bridge.slsMode !== mode
    || cold.slsMode !== mode
    || stitch.slsMode !== mode
    || bridge.destination.layout.slsMode !== mode
    || cold.layout.slsMode !== mode
  ) failures.push(`${prefix} exact mode-key binding drifted`);

  const replay = stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
    bridge,
    cold,
  );
  const coreReplayDeepExact = deepExactEqual(replay, stitch);
  if (!coreReplayDeepExact) failures.push(`${prefix} core replay is not deep exact`);

  const canonicalForward = cold.canonicalForwardPath;
  const canonicalReverse = cold.canonicalReversePath;
  if (
    canonicalForward === null
    || !canonicalForward.completed
    || canonicalReverse === null
    || !canonicalReverse.completed
  ) throw new Error(`${prefix} canonical forward/reverse path is absent`);

  const etaZeroAnalyticDeepExact = deepExactEqual(
    bridge.destination.analyticallyReequilibratedSeedEndpoint,
    cold.anchorEndpoint,
  );
  const etaZeroNodeDeepExact = deepExactEqual(
    bridge.destination.node,
    canonicalForward.nodes[0],
  );
  const etaZeroLayoutDeepExact = deepExactEqual(
    bridge.destination.layout,
    cold.layout,
  );
  const etaZeroMaximumScaledUnknownDifference = scaledInfinityDistance(
    bridge.destination.node.unknowns,
    canonicalForward.nodes[0].unknowns,
    cold.layout.unknownScales,
  );
  const rawEtaZeroBoundary = Object.freeze({
    bridgeAnalyticEndpointEqualsColdAnchorEndpoint: etaZeroAnalyticDeepExact,
    bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode: etaZeroNodeDeepExact,
    layoutExact: etaZeroLayoutDeepExact,
    maximumScaledUnknownDifference: etaZeroMaximumScaledUnknownDifference,
    noEtaZeroReinitializationOrResolveAppliedByStitch:
      etaZeroAnalyticDeepExact
      && etaZeroNodeDeepExact
      && etaZeroLayoutDeepExact
      && Object.is(stitch.etaOne.node, canonicalForward.endpoint),
  }) satisfies RawEtaZeroBoundaryProjection;
  if (!etaZeroAnalyticDeepExact || !etaZeroNodeDeepExact || !etaZeroLayoutDeepExact) {
    failures.push(`${prefix} raw eta-zero boundary is not deep exact`);
  }
  expectDeepExact(
    `${prefix} raw eta-zero boundary projection versus stitch result`,
    stitch.etaZeroBoundary,
    rawEtaZeroBoundary,
  );
  verifyDenseNode(`${prefix} bridge eta-zero`, bridge.destination.node, cold);

  const successfulForward = cold.forwardPaths.filter(
    (path): path is PhaseB1ColdHomotopyPathSuccessV1 => path.completed,
  );
  const forwardInventoryExact = successfulForward.length === 4
    && successfulForward.length === cold.forwardPaths.length
    && exactNumberArray(
      successfulForward.map((path) => path.requestedSubdivisionCount),
      [1, 2, 4, 8],
    );
  if (!forwardInventoryExact) failures.push(`${prefix} forward path inventory drifted`);
  for (const path of successfulForward) {
    verifyPath(
      `${prefix} forward-${path.requestedSubdivisionCount}`,
      path,
      "forward",
      etaGrid(path.requestedSubdivisionCount, "forward"),
      bridge.destination.node.unknowns,
      bridge.destination.node.endpoint,
      cold,
    );
  }
  if (!Object.is(successfulForward[3], canonicalForward)) {
    failures.push(`${prefix} canonical forward path is not the inventory's 8-path`);
  }
  verifyPath(
    `${prefix} reverse-8`,
    canonicalReverse,
    "reverse",
    etaGrid(8, "reverse"),
    canonicalForward.endpoint.unknowns,
    bridge.destination.node.endpoint,
    cold,
  );
  if (
    !deepExactEqual(
      canonicalReverse.nodes[0].unknowns,
      canonicalForward.endpoint.unknowns,
    )
    || !deepExactEqual(
      canonicalReverse.nodes[0].endpoint,
      canonicalForward.endpoint.endpoint,
    )
    || !deepExactEqual(canonicalForward.nodes[0], bridge.destination.node)
  ) failures.push(`${prefix} forward/reverse raw endpoint identities drifted`);

  const sampledNodes = [
    ...successfulForward.flatMap((path) => path.nodes),
    ...canonicalReverse.nodes,
  ];
  const maximumSampledScaledResidualInfinityNorm = Math.max(
    ...sampledNodes.map((node) => node.scaledResidualInfinityNorm),
  );

  const recomputedEndpointAgreement = maximumPairwiseScaledDistance(
    successfulForward.map((path) => path.endpoint.unknowns),
    cold.layout.unknownScales,
  );
  const recomputedReverseClosure = scaledInfinityDistance(
    canonicalReverse.endpoint.unknowns,
    bridge.destination.node.unknowns,
    cold.layout.unknownScales,
  );
  const everyNodeAccepted = sampledNodes.every((node) =>
    Number.isFinite(node.scaledResidualInfinityNorm)
    && node.scaledResidualInfinityNorm
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    && Number.isFinite(node.scaledUpdateInfinityNorm)
    && node.scaledUpdateInfinityNorm
      <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdUpdateInfinityNorm
    && Number.isFinite(node.minimumLandSimplexMargin)
    && node.minimumLandSimplexMargin > 0
    && node.effectiveTriSegAudit.accepted
    && !node.projectionApplied
    && !node.clippingApplied
    && !node.fallbackApplied);
  const referenceEndpoint = bridge.destination.node.endpoint;
  const fixedTimeVolumesFlowsAndCalciumAcrossPath = sampledNodes.every((node) =>
    node.endpoint.timeSec === referenceEndpoint.timeSec
    && deepExactEqual(
      node.endpoint.differentialState.bloodVolumesM3,
      referenceEndpoint.differentialState.bloodVolumesM3,
    )
    && deepExactEqual(
      node.endpoint.differentialState.inertialFlowsM3PerSec,
      referenceEndpoint.differentialState.inertialFlowsM3PerSec,
    )
    && deepExactEqual(
      node.endpoint.differentialState.calciumByWall,
      referenceEndpoint.differentialState.calciumByWall,
    ));
  const prohibitedOperationsAbsent = successfulForward.every(
    pathProhibitedOperationsAbsent,
  ) && pathProhibitedOperationsAbsent(canonicalReverse);
  const canonicalGridExact = exactNumberArray(
    canonicalForward.requestedEtaValues,
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
      .canonicalEtaValues,
  ) && exactNumberArray(
    canonicalForward.attemptedEtaValues,
    PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
      .canonicalEtaValues,
  );
  const rawCanonicalMaterialPath = Object.freeze({
    protocolId: cold.protocolId,
    homotopyId: cold.homotopyId,
    subdivisionCounts: Object.freeze(successfulForward.map(
      (path) => path.requestedSubdivisionCount,
    )),
    canonicalSubdivisionCount: canonicalForward.requestedSubdivisionCount,
    canonicalEtaValues: Object.freeze([...canonicalForward.requestedEtaValues]),
    nodeCount: canonicalForward.nodes.length,
    edgeCount: canonicalForward.edgeAudits.length,
    maximumEndpointAgreementScaledInfinityNorm: recomputedEndpointAgreement,
    reverseClosureToBridgeEtaZeroScaledInfinityNorm: recomputedReverseClosure,
    everyNodeAccepted,
    fixedTimeVolumesFlowsAndCalciumAcrossPath,
    prohibitedOperationsAbsent,
  }) satisfies RawCanonicalMaterialPathProjection;
  expectDeepExact(
    `${prefix} raw canonical-material-path projection versus stitch result`,
    stitch.canonicalMaterialPath,
    rawCanonicalMaterialPath,
  );
  if (
    !Object.is(
      recomputedEndpointAgreement,
      stitch.canonicalMaterialPath.maximumEndpointAgreementScaledInfinityNorm,
    )
    || !Object.is(
      recomputedReverseClosure,
      stitch.canonicalMaterialPath.reverseClosureToBridgeEtaZeroScaledInfinityNorm,
    )
    || recomputedEndpointAgreement
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .endpointAgreementScaledInfinityTolerance
    || recomputedReverseClosure
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .reverseClosureScaledInfinityTolerance
  ) failures.push(`${prefix} endpoint agreement or reverse closure drifted`);

  const etaZeroRawActiveDifferencePa = maximumAssembledToRawActiveDifference(
    canonicalForward.nodes[0],
  );
  if (
    !Number.isFinite(etaZeroRawActiveDifferencePa)
    || etaZeroRawActiveDifferencePa
      <= MINIMUM_NONDEGENERATE_ETA_ZERO_RAW_ACTIVE_DIFFERENCE_PA
  ) failures.push(`${prefix} eta-zero raw-vs-assembled active diagnostic degenerated`);

  const etaOneNode = canonicalForward.endpoint;
  const etaOneWalls = wallRecord((wallId) => activeStressIdentity(
    etaOneNode,
    wallId,
  ));
  const etaOneMaximumDifferencePa = Math.max(
    ...WALL_IDS.map((wallId) => etaOneWalls[wallId].absoluteDifferencePa),
  );
  if (
    etaOneNode.eta !== 1
    || !deepExactEqual(etaOneNode, stitch.etaOne.node)
    || !deepExactEqual(etaOneWalls, stitch.etaOne.wallByWall)
    || !Object.is(
      etaOneMaximumDifferencePa,
      stitch.etaOne.maximumAssembledToRawLandActiveStressDifferencePa,
    )
    || etaOneMaximumDifferencePa
      > PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
        .maximumEtaOneAssembledToRawLandActiveStressDifferencePa
  ) failures.push(`${prefix} eta-one wall active-stress identity drifted`);

  const censusAudit = verifyCensusInventory(
    prefix,
    cold,
    bridge.destination.node.unknowns,
    etaOneNode.unknowns,
  );
  expectDeepExact(
    `${prefix} raw finite-root-census projection versus stitch result`,
    stitch.finiteRootCensus,
    censusAudit.stitchProjection,
  );
  const rawModeProjection = Object.freeze({
    etaZeroBoundary: rawEtaZeroBoundary,
    canonicalMaterialPath: rawCanonicalMaterialPath,
    canonicalGridExact,
    finiteRootCensus: censusAudit.stitchProjection,
  }) satisfies RawModeProjection;
  const independentSummary = summarizeModeIndependently(
    bridge,
    cold,
    stitch,
    rawModeProjection,
    sha256,
  );
  const canonicalSummaryDeepExact = deepExactEqual(
    independentSummary,
    publishedSummary,
  );
  if (!canonicalSummaryDeepExact) {
    failures.push(`${prefix} explicit numerical summary replay drifted`);
  }

  const broadClaimsFalse = Object.values(broadClaims(stitch))
    .every((value) => value === false);
  if (
    !stitch.phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass
    || !stitch.testOnly
    || !broadClaimsFalse
  ) failures.push(`${prefix} pure stitch core claim boundary drifted`);

  return Object.freeze({
    mode,
    coreReplayDeepExact,
    canonicalSummaryDeepExact,
    etaZeroAnalyticDeepExact,
    etaZeroNodeDeepExact,
    etaZeroLayoutDeepExact,
    forwardInventoryExact,
    forwardNodeCount: successfulForward.reduce(
      (sum, path) => sum + path.nodes.length,
      0,
    ),
    canonicalForwardNodeCount: canonicalForward.nodes.length,
    canonicalForwardEdgeCount: canonicalForward.edgeAudits.length,
    reverseNodeCount: canonicalReverse.nodes.length,
    reverseEdgeCount: canonicalReverse.edgeAudits.length,
    maximumEndpointAgreementScaledInfinityNorm: recomputedEndpointAgreement,
    reverseClosureScaledInfinityNorm: recomputedReverseClosure,
    maximumSampledScaledResidualInfinityNorm,
    etaZeroMaximumAssembledToRawActiveDifferencePa:
      etaZeroRawActiveDifferencePa,
    etaOneMaximumAssembledToRawLandActiveDifferencePa:
      etaOneMaximumDifferencePa,
    censusAudit,
    broadClaimsFalse,
  });
}

function verifyPath(
  label: string,
  path: PhaseB1ColdHomotopyPathSuccessV1,
  expectedDirection: "forward" | "reverse",
  expectedEta: readonly number[],
  entryUnknowns: readonly number[],
  fixedEndpoint: PhaseB1EndpointStateV1,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
): void {
  if (
    !denseArray(path.requestedEtaValues, expectedEta.length)
    || !denseArray(path.attemptedEtaValues, expectedEta.length)
    || !denseArray(path.nodes, expectedEta.length)
    || !denseArray(path.edgeAudits, expectedEta.length - 1)
    || !exactNumberArray(path.requestedEtaValues, expectedEta)
    || !exactNumberArray(path.attemptedEtaValues, expectedEta)
    || path.requestedSubdivisionCount !== expectedEta.length - 1
    || path.nodes.length !== expectedEta.length
    || path.edgeAudits.length !== expectedEta.length - 1
    || !Object.is(path.endpoint, path.nodes[path.nodes.length - 1])
    || path.direction !== expectedDirection
    || !path.branchIdentityEstablished
    || path.branchIdentity
      !== "numerically-tracked-from-declared-symmetric-anchor-by-corrected-active-material-homotopy"
    || path.previousNodeUsedAs !== "tangent-predictor-base-only"
    || !pathProhibitedOperationsAbsent(path)
  ) failures.push(
    `${label} grid, direction, branch identity, endpoint alias, or prohibited flags drifted`,
  );

  path.nodes.forEach((node, index) => {
    if (!Object.is(node.eta, expectedEta[index])) {
      failures.push(`${label} node-${index} eta drifted`);
    }
    verifyDenseNode(`${label} node-${index}`, node, cold, fixedEndpoint);
  });
  path.edgeAudits.forEach((edge, index) => {
    const previous = path.nodes[index];
    const next = path.nodes[index + 1];
    const acceptedStep = scaledInfinityDistance(
      previous.unknowns,
      next.unknowns,
      cold.layout.unknownScales,
    );
    const correction = scaledInfinityDistance(
      edge.predictorUnknowns,
      next.unknowns,
      cold.layout.unknownScales,
    );
    if (
      edge.fromEta !== expectedEta[index]
      || edge.toEta !== expectedEta[index + 1]
      || !denseFiniteVector(edge.predictorUnknowns, cold.layout.unknownCount)
      || !denseFiniteVector(edge.acceptedUnknowns, cold.layout.unknownCount)
      || !deepExactEqual(edge.acceptedUnknowns, next.unknowns)
      || !roundoffEqual(edge.acceptedNodeStepScaledInfinityNorm, acceptedStep)
      || !roundoffEqual(edge.predictorCorrectionScaledInfinityNorm, correction)
    ) failures.push(`${label} edge-${index} raw mapping or metric drifted`);
  });
  const entryCorrection = scaledInfinityDistance(
    entryUnknowns,
    path.nodes[0].unknowns,
    cold.layout.unknownScales,
  );
  const maximumStep = Math.max(0, ...path.edgeAudits.map(
    (edge) => edge.acceptedNodeStepScaledInfinityNorm,
  ));
  const maximumCorrection = Math.max(0, ...path.edgeAudits.map(
    (edge) => edge.predictorCorrectionScaledInfinityNorm,
  ));
  if (
    !roundoffEqual(path.pathEntryCorrectionScaledInfinityNorm, entryCorrection)
    || !roundoffEqual(path.maximumAcceptedNodeStepScaledInfinityNorm, maximumStep)
    || !roundoffEqual(path.maximumPredictorCorrectionScaledInfinityNorm,
      maximumCorrection)
    || entryCorrection
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumPathEntryCorrectionScaledInfinityNorm
    || maximumStep
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumAcceptedNodeStepScaledInfinityNorm
    || maximumCorrection
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumPredictorCorrectionScaledInfinityNorm
  ) failures.push(`${label} path metric drifted`);
}

function verifyDenseNode(
  label: string,
  node: PhaseB1ColdNodeSuccessV1,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
  fixedEndpoint: PhaseB1EndpointStateV1 = node.endpoint,
): void {
  const residual = node.residualEvaluation.residual;
  const recomputedScaledResidual = Math.max(0, ...residual.map(
    (value, index) => Math.abs(value / cold.layout.residualScales[index]),
  ));
  const state = node.endpoint.differentialState;
  const landPass = WALL_IDS.every((wallId) => {
    const land = state.landByWall[wallId];
    const material = node.residualEvaluation.wallMaterialByWall[wallId];
    const backward =
      node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
    return denseFiniteVector(land, 6)
      && landPopulationSimplexMargin(land) > 0
      && material.sourceLandOutput.health.finite
      && !material.sourceLandOutput.health.projectionUsed
      && denseFiniteVector(backward.landResidual, 6)
      && Number.isFinite(node.residualEvaluation.freeCalciumUMByWall[wallId])
      && node.residualEvaluation.freeCalciumUMByWall[wallId] >= 0;
  });
  const slsPass = nodeSlsTopologyMatchesCold(node, cold);
  const fixedPass = node.endpoint.timeSec === fixedEndpoint.timeSec
    && deepExactEqual(
      state.bloodVolumesM3,
      fixedEndpoint.differentialState.bloodVolumesM3,
    )
    && deepExactEqual(
      state.inertialFlowsM3PerSec,
      fixedEndpoint.differentialState.inertialFlowsM3PerSec,
    )
    && deepExactEqual(
      state.calciumByWall,
      fixedEndpoint.differentialState.calciumByWall,
    );
  if (
    !denseFiniteVector(node.unknowns, cold.layout.unknownCount)
    || !denseFiniteVector(residual, cold.layout.unknownCount)
    || !Object.is(node.endpoint, node.residualEvaluation.endpoint)
    || node.residualEvaluation.eta !== node.eta
    || !roundoffEqual(recomputedScaledResidual, node.scaledResidualInfinityNorm)
    || node.scaledResidualInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    || node.scaledUpdateInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdUpdateInfinityNorm
    || node.minimumLandSimplexMargin <= 0
    || node.maximumLocalMaterialResidualInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumLocalMaterialResidualInfinityNorm
    || !node.effectiveTriSegAudit.accepted
    || node.projectionApplied
    || node.clippingApplied
    || node.fallbackApplied
    || node.residualEvaluation.projectionApplied
    || node.residualEvaluation.clippingApplied
    || !landPass
    || !slsPass
    || !fixedPass
  ) failures.push(`${label} residual, Land, Ca, SLS, fixed-state, or operation gate failed`);
}

function nodeSlsTopologyMatchesCold(
  node: PhaseB1ColdNodeSuccessV1,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
): boolean {
  const state = node.endpoint.differentialState;
  if (state.slsMode !== cold.slsMode || cold.layout.slsMode !== cold.slsMode) {
    return false;
  }
  return cold.slsMode === "on"
    ? WALL_IDS.every((wallId) => {
      const material = node.residualEvaluation.wallMaterialByWall[wallId];
      const backward =
        node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
      return state.slsMode === "on"
        && Number.isFinite(state.slsAlphaVByWall[wallId])
        && material.sls.mode === "on"
        && material.sls.statePhysicallyPresent
        && Number.isFinite(material.sls.overstressPa)
        && backward.slsResidual !== null
        && Number.isFinite(backward.slsResidual);
    })
    : WALL_IDS.every((wallId) => {
      const material = node.residualEvaluation.wallMaterialByWall[wallId];
      const backward =
        node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
      return state.slsMode === "off"
        && material.sls.mode === "off"
        && !material.sls.statePhysicallyPresent
        && material.sls.overstressPa === 0
        && backward.slsResidual === null;
    });
}

function verifyCensusInventory(
  prefix: string,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
  etaZeroUnknowns: readonly number[],
  etaOneUnknowns: readonly number[],
) {
  if (
    cold.rootCensus.length !== 2
    || !exactNumberArray(cold.rootCensus.map((census) => census.eta), [0, 1])
  ) failures.push(`${prefix} census eta inventory drifted`);
  const etaZero = requireCensus(cold.rootCensus, 0);
  const etaOne = requireCensus(cold.rootCensus, 1);
  const zeroAudit = verifyCensus(`${prefix} census-eta0`, etaZero, cold);
  const oneAudit = verifyCensus(`${prefix} census-eta1`, etaOne, cold);
  const zeroMatches = matchingClusters(
    etaZero,
    etaZeroUnknowns,
    cold.layout.unknownScales,
  );
  const oneMatches = matchingClusters(
    etaOne,
    etaOneUnknowns,
    cold.layout.unknownScales,
  );
  const etaZeroMatchingRestoringClusterCount = zeroMatches.filter(
    (cluster) => cluster.classification === "robust-restoring",
  ).length;
  const etaZeroSeparateSaddleClusterReported = etaZero.clusters.some(
    (cluster) => cluster.classification === "robust-saddle"
      && !zeroMatches.includes(cluster),
  );
  const etaOneMatchingRestoringClusterCount = oneMatches.filter(
    (cluster) => cluster.classification === "robust-restoring",
  ).length;
  const stitchProjection = Object.freeze({
    etaZeroMatchingRestoringClusterCount,
    etaZeroSeparateSaddleClusterReported,
    etaOneMatchingRestoringClusterCount,
    allDeclaredSeedsAttemptedAndConverged:
      zeroAudit.declaredSeedsAttemptedAndConverged
      && oneAudit.declaredSeedsAttemptedAndConverged,
    everyConvergedResultPartitionedExactlyOnce:
      zeroAudit.partitionPass && oneAudit.partitionPass,
    allDiscoveredRootsReported:
      zeroAudit.allDiscoveredRootsReported
      && oneAudit.allDiscoveredRootsReported,
    selectionInputToAcceptedPath:
      zeroAudit.selectionInputToAcceptedPath
      || oneAudit.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed:
      zeroAudit.globalExhaustivenessClaimed
      || oneAudit.globalExhaustivenessClaimed,
  }) satisfies RawFiniteRootCensusProjection;
  if (
    etaZeroMatchingRestoringClusterCount !== 1
    || !etaZeroSeparateSaddleClusterReported
    || etaOneMatchingRestoringClusterCount !== 1
    || etaZero.clusters.length !== 2
    || etaOne.clusters.length !== 1
    || etaZero.selectionInputToAcceptedPath
    || etaOne.selectionInputToAcceptedPath
    || etaZero.globalExhaustivenessClaimed
    || etaOne.globalExhaustivenessClaimed
  ) failures.push(`${prefix} census-to-path link or claim boundary drifted`);
  return Object.freeze({
    etaZero: zeroAudit,
    etaOne: oneAudit,
    etaZeroMatchingRestoringClusterCount,
    etaZeroSeparateSaddleClusterReported,
    etaOneMatchingRestoringClusterCount,
    selectionInputToAcceptedPath: stitchProjection.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed: stitchProjection.globalExhaustivenessClaimed,
    stitchProjection,
  });
}

function verifyCensus(
  label: string,
  census: PhaseB1ColdRootCensusV1,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
) {
  const convergedIndices = census.results.flatMap((result, index) =>
    result.converged ? [index] : []);
  const memberIndices = census.clusters.flatMap(
    (cluster) => cluster.memberResultIndices,
  ).sort((left, right) => left - right);
  const partitionPass = exactNumberArray(convergedIndices, memberIndices)
    && new Set(memberIndices).size === memberIndices.length;
  const rawClusterPass = census.clusters.every((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    return representative?.converged === true
      && denseArray(
        cluster.memberResultIndices,
        cluster.memberResultIndices.length,
      )
      && cluster.memberResultIndices.includes(cluster.representativeResultIndex)
      && cluster.classification
        === representative.effectiveTriSegAudit.classification
      && deepExactEqual(
        cluster.coordinates,
        representative.endpoint.triSegCoordinates,
      )
      && cluster.memberResultIndices.every((index) => {
        const member = census.results[index];
        return member?.converged === true
          && member.effectiveTriSegAudit.classification
            === cluster.classification
          && scaledInfinityDistance(
            representative.unknowns,
            member.unknowns,
            cold.layout.unknownScales,
          ) <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .rootClusteringScaledInfinityTolerance;
      });
  });
  const declaredSeedsAttemptedAndConverged = deepExactEqual(
    census.seeds,
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds,
  )
    && denseArray(census.results, census.seeds.length)
    && census.results.length === census.seeds.length
    && census.results.every((result) => result.converged)
    && census.enumerationCompleted
    && census.allSeedsAttempted
    && census.allSeedsConverged;
  const pass = declaredSeedsAttemptedAndConverged
    && denseArray(census.clusters, census.clusters.length)
    && census.convergedRootCount === convergedIndices.length
    && census.allDiscoveredRootsReported
    && !census.selectionInputToAcceptedPath
    && !census.globalExhaustivenessClaimed
    && partitionPass
    && rawClusterPass;
  if (!pass) failures.push(`${label} raw seed/partition/cluster audit failed`);
  for (const [index, result] of census.results.entries()) {
    if (!result.converged) continue;
    verifyCensusNode(`${label} root-${index}`, result, cold);
  }
  return Object.freeze({
    eta: census.eta,
    seedCount: census.seeds.length,
    convergedRootCount: census.convergedRootCount,
    clusterCount: census.clusters.length,
    declaredSeedsAttemptedAndConverged,
    partitionPass,
    rawClusterPass,
    allDiscoveredRootsReported: census.allDiscoveredRootsReported,
    selectionInputToAcceptedPath: census.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed: census.globalExhaustivenessClaimed,
    pass,
  });
}

function verifyCensusNode(
  label: string,
  node: PhaseB1ColdNodeSuccessV1,
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
): void {
  const residual = node.residualEvaluation.residual;
  if (
    !denseFiniteVector(node.unknowns, cold.layout.unknownCount)
    || !denseFiniteVector(residual, cold.layout.unknownCount)
    || node.projectionApplied
    || node.clippingApplied
    || node.fallbackApplied
    || node.residualEvaluation.projectionApplied
    || node.residualEvaluation.clippingApplied
    || !nodeSlsTopologyMatchesCold(node, cold)
    || node.scaledResidualInfinityNorm
      > PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumScaledColdResidualInfinityNorm
    || node.minimumLandSimplexMargin <= 0
  ) failures.push(`${label} raw root residual or prohibited-operation audit failed`);
}

function summarizeModeIndependently(
  bridge: PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1["results"][PhaseB0SlsModeV1],
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
  stitch: PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1,
  raw: RawModeProjection,
  sha256Hex: CanonicalSha256HexProvider,
) {
  const canonicalForward = cold.canonicalForwardPath;
  const canonicalReverse = cold.canonicalReversePath;
  if (
    canonicalForward === null
    || !canonicalForward.completed
    || canonicalReverse === null
    || !canonicalReverse.completed
  ) throw new Error("independent summary requires canonical paths");
  const successfulForward = cold.forwardPaths.filter(
    (path): path is PhaseB1ColdHomotopyPathSuccessV1 => path.completed,
  );
  if (successfulForward.length !== 4) {
    throw new Error("independent summary requires four forward paths");
  }
  const etaZeroBridgeAnalytic = endpointProjection(
    bridge.destination.analyticallyReequilibratedSeedEndpoint,
  );
  const etaZeroColdAnchor = endpointProjection(cold.anchorEndpoint);
  const etaZeroBridgeSolved = nodeProjection(bridge.destination.node, sha256Hex);
  const etaZeroColdCanonical = nodeProjection(canonicalForward.nodes[0], sha256Hex);
  const etaZeroBoundary = Object.freeze({
    bridgeAnalyticEndpointProjectionSha256:
      computeCanonicalSha256(etaZeroBridgeAnalytic, sha256Hex),
    coldAnchorEndpointProjectionSha256:
      computeCanonicalSha256(etaZeroColdAnchor, sha256Hex),
    bridgeSolvedNodeProjectionSha256:
      computeCanonicalSha256(etaZeroBridgeSolved, sha256Hex),
    coldCanonicalEtaZeroNodeProjectionSha256:
      computeCanonicalSha256(etaZeroColdCanonical, sha256Hex),
    bridgeSolvedUnknownsSha256:
      vectorSha(bridge.destination.node.unknowns, sha256Hex),
    coldCanonicalEtaZeroUnknownsSha256:
      vectorSha(canonicalForward.nodes[0].unknowns, sha256Hex),
    bridgeAnalyticEndpointEqualsColdAnchorEndpoint:
      raw.etaZeroBoundary.bridgeAnalyticEndpointEqualsColdAnchorEndpoint,
    bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode:
      raw.etaZeroBoundary.bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode,
    layoutExact: raw.etaZeroBoundary.layoutExact,
    maximumScaledUnknownDifference:
      raw.etaZeroBoundary.maximumScaledUnknownDifference,
    noEtaZeroReinitializationOrResolveAppliedByStitch:
      raw.etaZeroBoundary.noEtaZeroReinitializationOrResolveAppliedByStitch,
    projectionHashesExact:
      canonicalizeJson(etaZeroBridgeAnalytic) === canonicalizeJson(etaZeroColdAnchor)
      && canonicalizeJson(etaZeroBridgeSolved)
        === canonicalizeJson(etaZeroColdCanonical),
  });
  const canonicalMaterialPath = Object.freeze({
    forwardPaths: Object.freeze(successfulForward.map((path) =>
      detailedPathProjection(path, sha256Hex))),
    canonicalForward: detailedPathProjection(canonicalForward, sha256Hex),
    canonicalReverse: detailedPathProjection(canonicalReverse, sha256Hex),
    maximumEndpointAgreementScaledInfinityNorm:
      raw.canonicalMaterialPath.maximumEndpointAgreementScaledInfinityNorm,
    reverseClosureToBridgeEtaZeroScaledInfinityNorm:
      raw.canonicalMaterialPath.reverseClosureToBridgeEtaZeroScaledInfinityNorm,
    everyNodeAccepted: raw.canonicalMaterialPath.everyNodeAccepted,
    fixedTimeVolumesFlowsAndCalciumAcrossPath:
      raw.canonicalMaterialPath.fixedTimeVolumesFlowsAndCalciumAcrossPath,
    prohibitedOperationsAbsent:
      raw.canonicalMaterialPath.prohibitedOperationsAbsent,
    canonicalGridExact: raw.canonicalGridExact,
  });
  const etaOneNode = canonicalForward.endpoint;
  const walls = wallRecord((wallId) => activeStressIdentity(etaOneNode, wallId));
  const maximum = Math.max(...WALL_IDS.map(
    (wallId) => walls[wallId].absoluteDifferencePa,
  ));
  const etaOne = Object.freeze({
    eta: etaOneNode.eta,
    node: nodeProjection(etaOneNode, sha256Hex),
    endpointProjectionSha256:
      computeCanonicalSha256(endpointProjection(etaOneNode.endpoint), sha256Hex),
    unknownsSha256: vectorSha(etaOneNode.unknowns, sha256Hex),
    wallByWall: walls,
    maximumAssembledToRawLandActiveStressDifferencePa: maximum,
    reportedWallAuditExact:
      canonicalizeJson(walls) === canonicalizeJson(stitch.etaOne.wallByWall),
    reportedMaximumExact:
      maximum === stitch.etaOne.maximumAssembledToRawLandActiveStressDifferencePa,
    canonicalLandAssemblyPass:
      maximum <= PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
        .maximumEtaOneAssembledToRawLandActiveStressDifferencePa,
  });
  const censuses = Object.freeze(cold.rootCensus.map((census) =>
    censusProjection(census, cold.layout.unknownScales, sha256Hex)));
  const finiteRootCensus = Object.freeze({
    censuses,
    etaZeroMatchingRestoringClusterCount:
      raw.finiteRootCensus.etaZeroMatchingRestoringClusterCount,
    etaZeroSeparateSaddleClusterReported:
      raw.finiteRootCensus.etaZeroSeparateSaddleClusterReported,
    etaOneMatchingRestoringClusterCount:
      raw.finiteRootCensus.etaOneMatchingRestoringClusterCount,
    allDeclaredSeedsAttemptedAndConverged:
      raw.finiteRootCensus.allDeclaredSeedsAttemptedAndConverged,
    everyConvergedResultPartitionedExactlyOnce:
      raw.finiteRootCensus.everyConvergedResultPartitionedExactlyOnce,
    allDiscoveredRootsReported:
      raw.finiteRootCensus.allDiscoveredRootsReported,
    selectionInputToAcceptedPath:
      raw.finiteRootCensus.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed:
      raw.finiteRootCensus.globalExhaustivenessClaimed,
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
    inertialFlowsM3PerSec:
      recordProjection(state.inertialFlowsM3PerSec, INERTIAL_FLOW_IDS),
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
    residualVectorSha256: vectorSha(node.residualEvaluation.residual, sha256Hex),
    endpointProjectionSha256:
      computeCanonicalSha256(endpointProjection(node.endpoint), sha256Hex),
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

function detailedPathProjection(
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
    nodes: Object.freeze(path.nodes.map((node) => nodeProjection(node, sha256Hex))),
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
    const members = Object.freeze(cluster.memberResultIndices.map((index) => {
      const member = census.results[index];
      if (representative?.converged === true && member?.converged === true) {
        return Object.freeze({
          memberResultIndex: index,
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
        memberResultIndex: index,
        converged: false as const,
        classification: null,
        representativeScaledInfinityDistance: null,
      });
    }));
    const memberClassificationAndDistancePass = representative?.converged === true
      && cluster.classification
        === representative.effectiveTriSegAudit.classification
      && canonicalizeJson(cluster.coordinates)
        === canonicalizeJson(representative.endpoint.triSegCoordinates)
      && members.every((member) => member.converged
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
    && clusters.every((cluster) => cluster.memberClassificationAndDistancePass);
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
    allMemberClassificationsAndDistancesPass:
      clusters.every((cluster) => cluster.memberClassificationAndDistancePass),
    enumerationCompleted: census.enumerationCompleted,
    allSeedsAttempted: census.allSeedsAttempted,
    allSeedsConverged: census.allSeedsConverged,
    allDiscoveredRootsReported: census.allDiscoveredRootsReported,
    selectionInputToAcceptedPath: census.selectionInputToAcceptedPath,
    globalExhaustivenessClaimed: census.globalExhaustivenessClaimed,
    censusBoundaryPass,
  });
}

function verifyReadinessBoundary(
  readiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1
  >,
  manifestSha256: string,
  numericalSha256: string,
): void {
  const broad = broadClaims(readiness);
  if (
    !readiness.phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass
    || Object.values(readiness.implementation).some((value) =>
      typeof value === "boolean" && value !== true)
    || !Object.values(broad).every((value) => value === false)
    || !readiness.testOnly
    || readiness.bindings.stitchEvidenceManifestSha256 !== manifestSha256
    || readiness.bindings.numericalEvidenceSha256 !== numericalSha256
    || (readiness.blockers as readonly string[]).length === 0
  ) failures.push("stitch readiness overclaims or has an incomplete binding");
}

function broadClaims(input: Readonly<Record<string, unknown>> | PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchResultV1) {
  return Object.freeze({
    phaseB0OverallAcceptancePass: input.phaseB0OverallAcceptancePass,
    acceptedPhaseB1ReferenceBranchPass: input.acceptedPhaseB1ReferenceBranchPass,
    phaseB1LandCoupledFiniteVolumeGraphPass:
      input.phaseB1LandCoupledFiniteVolumeGraphPass,
    phaseB1LandCoupledVolumeEnvelopePass:
      input.phaseB1LandCoupledVolumeEnvelopePass,
    continuousEtaIntervalRegularityPass:
      input.continuousEtaIntervalRegularityPass,
    continuousVolumeIntervalRegularityPass:
      input.continuousVolumeIntervalRegularityPass,
    globalRootUniquenessPass: input.globalRootUniquenessPass,
    globalRootExhaustivenessPass: input.globalRootExhaustivenessPass,
    energeticStabilityPass: input.energeticStabilityPass,
    physiologicalInitializationPass: input.physiologicalInitializationPass,
    closedLoopStationarityPass: input.closedLoopStationarityPass,
    fullBeatAcceptancePass: input.fullBeatAcceptancePass,
    physiologicalValidationPass: input.physiologicalValidationPass,
    phaseB1AcceptancePass: input.phaseB1AcceptancePass,
    supportedEnvelopePass: input.supportedEnvelopePass,
    releaseRuntimePass: input.releaseRuntimePass,
    pureCoreParentEvidenceAuthenticationClaimed:
      input.pureCoreParentEvidenceAuthenticationClaimed,
    modelCoreIntegration: input.modelCoreIntegration,
    browserRuntimeAdopted: input.browserRuntimeAdopted,
    releaseRuntimeReachable: input.releaseRuntimeReachable,
  });
}

function activeStressIdentity(
  node: PhaseB1ColdNodeSuccessV1,
  wallId: FourChamberWallId,
) {
  const wall = node.residualEvaluation.closedLoop.wallMechanics[wallId];
  const assembledActiveStressPa = wall.totalKirchhoffStressPa
    - wall.equilibriumPassive.equilibriumKirchhoffStressPa
    - wall.slsOverstressPa;
  return Object.freeze({
    rawLandActiveStressPa: wall.activeKirchhoffStressPa,
    assembledActiveStressPa,
    absoluteDifferencePa:
      Math.abs(assembledActiveStressPa - wall.activeKirchhoffStressPa),
  });
}

function maximumAssembledToRawActiveDifference(
  node: PhaseB1ColdNodeSuccessV1,
): number {
  return Math.max(...WALL_IDS.map((wallId) =>
    activeStressIdentity(node, wallId).absoluteDifferencePa));
}

function matchingClusters(
  census: PhaseB1ColdRootCensusV1,
  target: readonly number[],
  scales: readonly number[],
) {
  return census.clusters.filter((cluster) => {
    const representative = census.results[cluster.representativeResultIndex];
    return representative?.converged === true
      && scaledInfinityDistance(representative.unknowns, target, scales)
        <= PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .rootClusteringScaledInfinityTolerance;
  });
}

function requireCensus(
  census: readonly PhaseB1ColdRootCensusV1[],
  eta: 0 | 1,
): PhaseB1ColdRootCensusV1 {
  const matches = census.filter((entry) => entry.eta === eta);
  if (matches.length !== 1) throw new Error(`requires exactly one eta=${eta} census`);
  return matches[0];
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

function etaGrid(
  count: number,
  direction: "forward" | "reverse",
): readonly number[] {
  return Object.freeze(Array.from({ length: count + 1 }, (_, index) =>
    direction === "forward" ? index / count : 1 - index / count));
}

function maximumPairwiseScaledDistance(
  vectors: readonly (readonly number[])[],
  scales: readonly number[],
): number {
  let maximum = 0;
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      maximum = Math.max(
        maximum,
        scaledInfinityDistance(vectors[left], vectors[right], scales),
      );
    }
  }
  return maximum;
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (
    !denseFiniteVector(left, scales.length)
    || !denseFiniteVector(right, scales.length)
    || !denseFiniteVector(scales, scales.length)
    || scales.some((scale) => !(scale > 0))
  ) throw new Error("scaled vector is sparse, non-finite, or dimensionally invalid");
  return Math.max(0, ...left.map((value, index) =>
    Math.abs((value - right[index]) / scales[index])));
}

function landPopulationSimplexMargin(land: readonly number[]): number {
  const [ca, b, w, s] = land;
  return Math.min(ca, 1 - ca, b, w, s, 1 - b - w - s);
}

function denseFiniteVector(
  values: readonly number[],
  expectedLength: number,
): boolean {
  return denseArray(values, expectedLength)
    && values.every((value) => Number.isFinite(value));
}

function denseArray(values: readonly unknown[], expectedLength: number): boolean {
  if (values.length !== expectedLength) return false;
  const keys = Object.keys(values).sort();
  const expected = Array.from({ length: expectedLength }, (_, index) =>
    String(index)).sort();
  return keys.length === expected.length
    && keys.every((key, index) => key === expected[index]);
}

function exactNumberArray(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return denseArray(left, right.length)
    && denseArray(right, right.length)
    && left.every((value, index) => Object.is(value, right[index]));
}

function deepExactEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
  ) return false;
  if (Array.isArray(left) && Array.isArray(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    const leftRecord = left as unknown as Readonly<Record<string, unknown>>;
    const rightRecord = right as unknown as Readonly<Record<string, unknown>>;
    return left.length === right.length
      && leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) =>
        key === rightKeys[index]
        && deepExactEqual(leftRecord[key], rightRecord[key]));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && deepExactEqual(leftRecord[key], rightRecord[key]));
}

function isDeepFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Reflect.ownKeys(value).every((key) =>
    isDeepFrozen((value as Readonly<Record<PropertyKey, unknown>>)[key], seen));
}

function verifyDeepExactComparatorBoundary(): void {
  const sparse = new Array(1);
  const explicit = [undefined];
  if (
    deepExactEqual(sparse, explicit)
    || deepExactEqual({}, { enumerableUndefined: undefined })
    || !deepExactEqual({ enumerableUndefined: undefined },
      { enumerableUndefined: undefined })
  ) throw new Error("deep-exact comparator does not distinguish holes or undefined keys");
}

function vectorSha(
  vector: readonly number[],
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return computeCanonicalSha256(Object.freeze([...vector]), sha256Hex);
}

function wallRecord<T>(
  evaluate: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) =>
    [wallId, evaluate(wallId)]))) as Readonly<Record<FourChamberWallId, T>>;
}

function recordProjection<K extends string>(
  record: Readonly<Record<K, number>>,
  keys: readonly K[],
): Readonly<Record<K, number>> {
  return Object.freeze(Object.fromEntries(keys.map((key) =>
    [key, record[key]]))) as Readonly<Record<K, number>>;
}

function roundoffEqual(left: number, right: number): boolean {
  return left === right || Math.abs(left - right)
    <= 64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}

function expectDeepExact(label: string, actual: unknown, expected: unknown): void {
  if (!deepExactEqual(actual, expected)) failures.push(`${label} drifted`);
}

function expectEqual(label: string, actual: string, expected: string): void {
  if (actual !== expected) failures.push(`${label}: expected ${expected}, got ${actual}`);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
