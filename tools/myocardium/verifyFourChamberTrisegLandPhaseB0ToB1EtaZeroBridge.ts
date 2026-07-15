import { createHash } from "node:crypto";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  createPhaseB0HydromechanicsInitialStateV1,
  evaluatePhaseB0HydromechanicsStateV1,
  type PhaseB0HydromechanicsStateV1,
  type PhaseB0SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import {
  buildPhaseB0SyntheticHydromechanicsCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import {
  PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
  type PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeEvidenceManifestV1";
import {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeNumericalEvidenceV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_READINESS_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_NUMERICAL_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_READINESS_SHA256_V1,
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1";
import {
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeModeSummaryV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeReadinessV1";
import {
  buildPhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  encodePhaseB1EndpointTopologyVectorsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const EXPECTED_BRIDGE_MANIFEST_SHA256 =
  "a74e6294986d2144573990df4fca5e1d17a58c4642a7b0737f3b956db525528c";
const EXPECTED_BRIDGE_NUMERICAL_EVIDENCE_SHA256 =
  "183f938b1a87c619dee2fd60344ac4f1baed2aa94eac9a0bea8e40552111f60c";
const EXPECTED_BRIDGE_READINESS_SHA256 =
  "84ccdf648a18e0f6a5eea1278c744fae2ac02822375075e1862f84376fd8ac47";
const MODES = Object.freeze(["on", "off"] as const);

type ModeMetric = Readonly<{
  mode: PhaseB0SlsModeV1;
  sourceCenterReconstructionPass: boolean;
  canonicalCoreReplayPass: boolean;
  canonicalSummaryReplayPass: boolean;
  seedAndTopologyPass: boolean;
  equilibriumPass: boolean;
  independentlyRecomputedEquilibriumPass: boolean;
  exactSharedStateParityPass: boolean;
  thresholdPass: boolean;
  maximumAssembledActiveStressAbsoluteDifferencePa: number;
  maximumRawLandActiveDiagnosticDifferencePa: number;
  maximumSlsOverstressAbsoluteDifferencePa: number;
  maximumTotalWallStressAbsoluteDifferencePa: number;
  maximumTotalWallTangentAbsoluteDifferencePa: number;
  maximumTriSegResidualAbsoluteDifferenceNPerM: number;
  maximumPressureAbsoluteDifferencePa: number;
  maximumAtrialPressureRelativeDifference: number;
  maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2: number;
  scaledColdResidualInfinityNorm: number;
  independentlyScaledResidualInfinityNorm: number;
  independentlyMinimumLandSimplexMargin: number;
  independentlyMaximumLandResidualInfinityNorm: number;
  independentlyMaximumSlsResidualInfinityNorm: number;
}>;
type BridgeDestination =
  PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1["destination"];
type BridgeNodeEvaluation =
  PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1["destination"]["node"];
type BridgeResidualEvaluation = BridgeNodeEvaluation["residualEvaluation"];
type BridgeClosedLoopEvaluation = BridgeResidualEvaluation["closedLoop"];
type PhaseB0NewtonScaleRegistry = ReturnType<
  typeof buildPhaseB0SyntheticHydromechanicsCaseV1
>["newtonScaleRegistry"];

const failures: string[] = [];

try {
  const manifest =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(sha256);
  const numericalEvidence =
    buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
      manifest,
      sha256,
    );
  const readiness =
    buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1(
      manifest,
      numericalEvidence,
    );
  const readinessSha256 = computeCanonicalSha256(readiness, sha256);

  verifyHashesAndLineage(
    manifest,
    numericalEvidence.certificate,
    numericalEvidence.sourceFiniteEnvelopeEvidence,
    readiness,
    readinessSha256,
  );

  expectCanonicalEqual(
    "certificate SLS mode keys",
    numericalEvidence.certificate.slsModes,
    MODES,
  );
  expectCanonicalEqual(
    "certificate mode-record keys",
    Object.keys(numericalEvidence.certificate.modes),
    MODES,
  );
  expectCanonicalEqual(
    "result mode-record keys",
    Object.keys(numericalEvidence.results),
    MODES,
  );
  expectCanonicalEqual(
    "source result mode-record keys",
    Object.keys(numericalEvidence.sourceFiniteEnvelopeEvidence.results),
    MODES,
  );

  const modeMetrics = Object.freeze(Object.fromEntries(MODES.map((mode) => [
    mode,
    verifyMode(
      mode,
      numericalEvidence.sourceFiniteEnvelopeEvidence.results[mode],
      numericalEvidence.results[mode],
      numericalEvidence.certificate.modes[mode],
      numericalEvidence.certificate.sourceFiniteEnvelopeNumericalEvidenceSha256,
    ),
  ]))) as Readonly<Record<PhaseB0SlsModeV1, ModeMetric>>;

  if (!numericalEvidence.certificate.allModesPass) {
    failures.push("bridge numerical evidence did not accept both SLS modes");
  }
  verifyReadinessBoundary(readiness);

  const report = Object.freeze({
    pass: failures.length === 0,
    phaseB0CenterToPhaseB1EtaZeroBridgePass: failures.length === 0,
    phaseB0OverallAcceptancePass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    continuousIntervalRegularityPass: false,
    globalRootUniquenessPass: false,
    energeticStabilityPass: false,
    physiologicalInitializationPass: false,
    closedLoopStationarityPass: false,
    fullBeatAcceptancePass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
    hashes: Object.freeze({
      manifest: manifest.contentSha256,
      numericalEvidence: numericalEvidence.certificate.contentSha256,
      readiness: readinessSha256,
    }),
    lineage: manifest.lineage,
    evidenceBoundary: readiness.evidenceBoundary,
    modeMetrics,
    failures: Object.freeze(failures),
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    pass: false,
    phaseB0CenterToPhaseB1EtaZeroBridgePass: false,
    phaseB0OverallAcceptancePass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    phaseB1LandCoupledVolumeEnvelopePass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
    failures,
  }, null, 2));
  process.exitCode = 1;
}

function verifyHashesAndLineage(
  manifest: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1
  >,
  certificate: ReturnType<
    typeof buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1
  >["certificate"],
  sourceFiniteEnvelopeEvidence:
    PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1,
  readiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1
  >,
  readinessSha256: string,
): void {
  expectEqual(
    "bridge manifest self hash",
    manifest.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ),
  );
  expectEqual(
    "bridge manifest pinned hash",
    manifest.contentSha256,
    EXPECTED_BRIDGE_MANIFEST_SHA256,
  );
  expectEqual(
    "bridge numerical-evidence self hash",
    certificate.contentSha256,
    computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1(
        certificate,
      ),
      sha256,
    ),
  );
  expectEqual(
    "bridge numerical-evidence pinned hash",
    certificate.contentSha256,
    EXPECTED_BRIDGE_NUMERICAL_EVIDENCE_SHA256,
  );
  expectEqual(
    "bridge readiness pinned hash",
    readinessSha256,
    EXPECTED_BRIDGE_READINESS_SHA256,
  );

  const rebuiltParentManifest =
    buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(sha256);
  try {
    assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
      sourceFiniteEnvelopeEvidence,
      rebuiltParentManifest,
    );
  } catch (error) {
    failures.push(
      `embedded parent B0 numerical bundle is not canonical: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const parentCertificate = sourceFiniteEnvelopeEvidence.certificate;
  const parentAuthenticationPass =
    rebuiltParentManifest.contentSha256
      === PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1
    && parentCertificate.manifestSha256
      === PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1
    && parentCertificate.contentSha256
      === PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1
    && parentCertificate.contentSha256 === computeCanonicalSha256(
      phaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceHashPayloadV1(
        parentCertificate,
      ),
      sha256,
    )
    && parentCertificate.allModesPass
    && canonicalEqual(Object.keys(parentCertificate.modes), MODES)
    && canonicalEqual(Object.keys(sourceFiniteEnvelopeEvidence.results), MODES)
    && canonicalEqual(Object.keys(sourceFiniteEnvelopeEvidence.failureProbes), MODES)
    && MODES.every((mode) =>
      parentCertificate.modes[mode].slsMode === mode
      && sourceFiniteEnvelopeEvidence.results[mode].slsMode === mode
      && sourceFiniteEnvelopeEvidence.failureProbes[mode]
        .every((probe) => probe.slsMode === mode));
  if (!parentAuthenticationPass) {
    failures.push(
      "embedded parent B0 numerical certificate was not independently rebuilt, pinned, self-hashed, and mode-bound",
    );
  }

  const expectedLineage = Object.freeze({
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
    canonicalParentManifestsVerifiedLive: true as const,
    parentNumericalAndReadinessArtifactsAreFrozenLineagePins: true as const,
  });
  expectCanonicalEqual("complete parent lineage", manifest.lineage, expectedLineage);
  expectCanonicalEqual("readiness lineage", readiness.lineage, expectedLineage);
  expectEqual(
    "certificate source manifest lineage",
    certificate.sourceFiniteEnvelopeManifestSha256,
    expectedLineage.phaseB0FiniteEnvelopeManifestSha256,
  );
  expectEqual(
    "certificate source numerical lineage",
    certificate.sourceFiniteEnvelopeNumericalEvidenceSha256,
    expectedLineage.phaseB0FiniteEnvelopeNumericalEvidenceSha256,
  );

  const protocol = manifest.protocolDefinition;
  const bindingChecks = [
    manifest.bindings.protocolDefinitionSha256
      === computeCanonicalSha256(protocol, sha256),
    manifest.bindings.sourceContractSha256
      === computeCanonicalSha256(protocol.source, sha256),
    manifest.bindings.transferContractSha256
      === computeCanonicalSha256(protocol.transfer, sha256),
    manifest.bindings.destinationContractSha256
      === computeCanonicalSha256(protocol.destination, sha256),
    manifest.bindings.bridgePolicySha256
      === computeCanonicalSha256(protocol.policy, sha256),
    manifest.bindings.prohibitedOperationsSha256
      === computeCanonicalSha256(protocol.prohibitedOperations, sha256),
    manifest.bindings.claimBoundarySha256
      === computeCanonicalSha256(protocol.claimBoundary, sha256),
    protocol.bridgeId === PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
    protocol.source.protocolId
      === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID,
    protocol.source.nodeId === "C",
    protocol.source.requiredNumericalEvidenceSha256
      === PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
    protocol.transfer.fields.join(",") === "V_m_S,y_m",
    protocol.transfer.noOtherPhaseB0StateTransferred,
    protocol.destination.adapterId
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
    protocol.destination.protocolId
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
    protocol.destination.homotopyId
      === PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
    protocol.destination.eta === 0,
    canonicalEqual(
      protocol.policy,
      PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
    ),
    Object.values(protocol.prohibitedOperations).every((value) => value === false),
    Object.values(protocol.claimBoundary).every((value) => value === false),
    Object.values(manifest.implementationClaims).every((value) => value === true),
    Object.values(manifest.deferred).every((value) => value === true),
    Object.values(manifest.negativeClaims).every((value) => value === false),
  ];
  if (bindingChecks.some((pass) => !pass)) {
    failures.push("bridge protocol, lineage, or inner hash binding drifted");
  }
  if (
    readiness.bindings.bridgeEvidenceManifestSha256 !== manifest.contentSha256
    || readiness.bindings.numericalEvidenceSha256 !== certificate.contentSha256
  ) failures.push("readiness does not bind the canonical bridge artifacts");
}

function verifyMode(
  mode: PhaseB0SlsModeV1,
  sourceResult: PhaseB0TriSegFiniteSupportedEnvelopeModeResultV1,
  result: PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
  summary: PhaseB0CenterToPhaseB1EtaZeroBridgeModeSummaryV1,
  sourceEvidenceSha256: string,
): ModeMetric {
  const prefix = `SLS-${mode}`;
  if (
    sourceResult.slsMode !== mode
    || result.slsMode !== mode
    || summary.slsMode !== mode
  ) failures.push(`${prefix} mode-key binding drifted`);

  const replay = bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
    sourceResult,
    sourceEvidenceSha256,
    sha256,
  );
  const canonicalCoreReplayPass = canonicalEqual(replay, result);
  if (!canonicalCoreReplayPass) {
    failures.push(`${prefix} independently replayed bridge is not canonical-equal`);
  }
  const replayedSummary = summarizeIndependently(
    replay,
    mode,
    sourceEvidenceSha256,
  );
  const canonicalSummaryReplayPass = canonicalEqual(replayedSummary, summary);
  if (!canonicalSummaryReplayPass) {
    failures.push(`${prefix} independently reconstructed summary drifted`);
  }

  const centers = sourceResult.canonicalNodes.filter((node) => node.nodeId === "C");
  if (centers.length !== 1) {
    failures.push(`${prefix} source does not contain exactly one center C`);
    return failedModeMetric(mode, canonicalCoreReplayPass, canonicalSummaryReplayPass);
  }
  const center = centers[0];
  const sourceCenterAccepted = sourceResult.finiteDeclaredGraphEnvelopePass
    && center.hardGatePass
    && center.fiftyPercentGuardPass
    && center.ledger.accepted
    && center.taylorDomainPass;
  if (!sourceCenterAccepted) failures.push(`${prefix} source center is not accepted`);

  const fixture = buildPhaseB0SyntheticHydromechanicsCaseV1(sha256);
  const baseState = createPhaseB0HydromechanicsInitialStateV1(fixture, mode);
  const transferredCoordinates = Object.freeze({
    V_m_S: center.coordinates.septalMidwallCapVolumeM3,
    y_m: center.coordinates.junctionRadiusM,
  });
  const sourceState = buildSourceCenterState(
    baseState,
    center.ledger.bloodVolumesM3,
    transferredCoordinates,
  );
  const sourceEvaluation = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    sourceState,
  );
  const sourceCenterReconstructionPass =
    sourceEvaluation.state === sourceState
    && sourceState.timeSec === 0
    && sourceState.bloodVolumesM3.LV
      === center.root.geometry.leftVentricularCavityVolumeM3
    && sourceState.bloodVolumesM3.RV
      === center.root.geometry.rightVentricularCavityVolumeM3
    && canonicalEqual(sourceEvaluation.triSegGeometry, center.root.geometry)
    && canonicalEqual(sourceEvaluation.triSegOracle, center.root.oracle)
    && WALL_IDS.filter((wallId): wallId is "LVFW" | "SEP" | "RVFW" =>
      wallId === "LVFW" || wallId === "SEP" || wallId === "RVFW")
      .every((wallId) => sourceEvaluation.wallMechanics[wallId]
        .totalKirchhoffStressPa
          === center.root.wallStress.fiberKirchhoffStressPa[wallId]);
  if (!sourceCenterReconstructionPass) {
    failures.push(`${prefix} independent Phase B0 center reconstruction failed`);
  }

  const destination = result.destination;
  const destinationEndpoint = destination.node.endpoint;
  const destinationState = destinationEndpoint.differentialState;
  const destinationEvaluation = destination.node.residualEvaluation.closedLoop;
  const expectedUnknownCount = mode === "on" ? 37 : 32;
  const expectedMaterialUnknownCount = mode === "on" ? 35 : 30;
  const seedAndTopologyPass =
    result.bridgeId === PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID
    && result.source.protocolId
      === PHASE_B0_TRISEG_FINITE_SUPPORTED_ENVELOPE_V1_ID
    && result.source.nodeId === "C"
    && result.source.rootId === center.root.rootId
    && result.source.algorithmicJacobianId === center.root.algorithmicJacobianId
    && result.upstreamFiniteEnvelopeEvidenceSha256 === sourceEvidenceSha256
    && result.transfer.fieldNames.join(",") === "V_m_S,y_m"
    && result.transfer.noOtherPhaseB0StateTransferred
    && canonicalEqual(result.source.coordinates, transferredCoordinates)
    && canonicalEqual(result.transfer.triSegCoordinates, transferredCoordinates)
    && destination.adapterId
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID
    && destination.protocolId
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID
    && destination.homotopyId
      === PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID
    && destination.slsMode === mode
    && destination.eta === 0
    && destination.upstreamEvidenceSha256 === sourceEvidenceSha256
    && canonicalEqual(destination.upstreamTriSegSeed, transferredCoordinates)
    && canonicalEqual(
      destination.analyticallyReequilibratedSeedEndpoint.triSegCoordinates,
      transferredCoordinates,
    )
    && canonicalEqual(destinationEndpoint.triSegCoordinates, transferredCoordinates)
    && destination.layout.unknownCount === expectedUnknownCount
    && destination.layout.materialUnknownCount === expectedMaterialUnknownCount
    && destination.analyticallyReequilibratedSeedUnknowns.length
      === expectedUnknownCount
    && destination.node.unknowns.length === expectedUnknownCount
    && destination.node.residualEvaluation.residual.length === expectedUnknownCount
    && !destination.warmStartImportedOrConsumed
    && !destination.bloodVolumeAdjustmentApplied
    && !destination.flowAdjustmentApplied
    && !destination.calciumWasNewtonUnknown;
  if (!seedAndTopologyPass) failures.push(`${prefix} seed/eta-zero topology failed`);

  const independentEquilibrium = independentlyAuditDestinationEquilibrium(
    mode,
    destination,
  );
  const equilibrium = destination.equilibriumAudit;
  const recordedEquilibriumFlagsPass =
    equilibrium.upstreamSeedCoordinatesEncodedExactly
    && equilibrium.etaIsExactlyZero
    && equilibrium.fixedTimeSec === 0
    && equilibrium.fixedBloodVolumesPreserved
    && equilibrium.fixedInertialFlowsPreserved
    && equilibrium.fixedCalciumStatesPreserved
    && equilibrium.seedToSolvedScaledInfinityNorm === 0
    && canonicalEqual(equilibrium.solvedTriSegCoordinates, transferredCoordinates)
    && equilibrium.topologyPass
    && equilibrium.materialEquilibriumPass
    && equilibrium.slsEquilibriumPass
    && equilibrium.calciumEquilibriumPass
    && equilibrium.triSegEquilibriumPass
    && equilibrium.prohibitedNumericalOperationsAbsent
    && equilibrium.coupledColdNodeEquilibriumPass
    && Object.values(equilibrium.wallByWall).every((wall) =>
      wall.wallPass
      && wall.materialEquilibriumPass
      && wall.slsEquilibriumPass
      && wall.calciumEquilibriumPass
      && !wall.sourceLandProjectionUsed
      && !wall.stabilizationStiffnessIncludedInStressOrTangent
      && !wall.productionStateResidualUsesStrainRate)
    && !equilibrium.closedLoopStationarityClaimed
    && !equilibrium.physiologicalInitializationClaimed
    && !equilibrium.supportedEnvelopeClaimed;
  const equilibriumPass = independentEquilibrium.pass
    && recordedEquilibriumFlagsPass
    && independentEquilibrium.auditConsistencyPass;
  if (!equilibriumPass) failures.push(`${prefix} coupled eta-zero equilibrium failed`);

  const destinationScaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256);
  const destinationBinding = buildPhaseB1WallMaterialBindingV1(
    destinationScaffold.phaseA1TissueManifestBundle,
    sha256,
  );
  const exact = Object.freeze({
    timeExact: sourceState.timeSec === destinationEndpoint.timeSec,
    bloodVolumesExact: numericRecordExact(
      sourceState.bloodVolumesM3,
      destinationState.bloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
    ),
    inertialStateFlowsExact: numericRecordExact(
      sourceState.inertialFlowsM3PerSec,
      destinationState.inertialFlowsM3PerSec,
      INERTIAL_FLOW_IDS,
    ),
    solvedTriSegCoordinatesExact:
      canonicalEqual(transferredCoordinates, destinationEndpoint.triSegCoordinates),
    wallFiberStrainsExact: WALL_IDS.every((wallId) =>
      sourceEvaluation.wallMechanics[wallId].fiberLogStrain
        === destinationEvaluation.wallMechanics[wallId].fiberLogStrain),
    wallReferenceVolumesExact: WALL_IDS.every((wallId) =>
      sourceEvaluation.wallMechanics[wallId].wallReferenceMaterialVolumeM3
        === destinationEvaluation.wallMechanics[wallId]
          .wallReferenceMaterialVolumeM3),
    passiveMaterialEvaluationsExact: WALL_IDS.every((wallId) =>
      canonicalEqual(
        sourceEvaluation.wallMechanics[wallId].equilibriumPassive,
        destinationEvaluation.wallMechanics[wallId].equilibriumPassive,
      )),
    triSegGeometryExact:
      canonicalEqual(sourceEvaluation.triSegGeometry, destinationEvaluation.triSegGeometry),
    triSegOracleExact:
      canonicalEqual(sourceEvaluation.triSegOracle, destinationEvaluation.triSegOracle),
    pericardiumExact:
      canonicalEqual(sourceEvaluation.pericardium, destinationEvaluation.pericardium),
    vascularEvaluationsExact:
      canonicalEqual(sourceEvaluation.vascular, destinationEvaluation.vascular),
    computedFlowsExact:
      canonicalEqual(sourceEvaluation.allFlowsM3PerSec, destinationEvaluation.allFlowsM3PerSec),
    phaseA1TissueBundleBindingExact:
      fixture.phaseA1TissueManifestBundle.contentSha256
        === destination.provenance.phaseA1TissueManifestBundleSha256,
    newtonScaleRegistryValuesExact: canonicalEqual(
      registryValuePayload(fixture.newtonScaleRegistry),
      registryValuePayload(destinationScaffold.newtonScaleRegistry),
    ),
    destinationProvenanceBindingsExact:
      destination.provenance.symmetricClosedLoopScaffoldConfigurationSha256
        === phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256)
      && destination.provenance.phaseB1WallMaterialBindingSha256
        === destinationBinding.contentSha256
      && destination.provenance.phaseA1TissueManifestBundleSha256
        === destinationScaffold.phaseA1TissueManifestBundle.contentSha256
      && destination.provenance.newtonScaleRegistryContentSha256
        === destinationScaffold.newtonScaleRegistry.registryContentSha256,
    sharedFlowAndPressureParameterBindingsExact: canonicalEqual(
      sharedFlowPressurePayload(fixture),
      sharedFlowPressurePayload(destinationScaffold),
    ),
  });
  const exactSharedStateParityPass = Object.values(exact).every(Boolean);
  for (const [field, value] of Object.entries(exact)) {
    const recorded = result.parityAudit[
      field as keyof typeof exact
    ];
    if (!value || recorded !== value) {
      failures.push(`${prefix} independently recomputed exact parity ${field} failed`);
    }
  }

  const metrics = recomputeParityMetrics(sourceEvaluation, destinationEvaluation);
  const parity = result.parityAudit;
  for (const field of Object.keys(metrics) as (keyof typeof metrics)[]) {
    if (!roundoffEqual(metrics[field], parity[field])) {
      failures.push(`${prefix} reported parity metric ${field} is not reproducible`);
    }
  }
  const policy = PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1;
  const thresholdPass =
    metrics.maximumAssembledActiveStressAbsoluteDifferencePa
      <= policy.maximumAssembledActiveStressAbsoluteDifferencePa
    && metrics.maximumSlsOverstressAbsoluteDifferencePa
      <= policy.maximumSlsOverstressAbsoluteDifferencePa
    && metrics.maximumTotalWallStressAbsoluteDifferencePa
      <= policy.maximumTotalWallStressAbsoluteDifferencePa
    && metrics.maximumTotalWallTangentAbsoluteDifferencePa
      <= policy.maximumTotalWallTangentAbsoluteDifferencePa
    && metrics.maximumTriSegResidualAbsoluteDifferenceNPerM
      <= policy.maximumTriSegResidualAbsoluteDifferenceNPerM
    && metrics.maximumPressureAbsoluteDifferencePa
      <= policy.maximumPressureAbsoluteDifferencePa
    && metrics.maximumAtrialPressureRelativeDifference
      <= policy.maximumAtrialPressureRelativeDifference
    && metrics.maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2
      <= policy.maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2
    && destination.node.scaledResidualInfinityNorm
      <= policy.maximumB1ScaledColdResidualInfinityNorm;
  if (!thresholdPass) failures.push(`${prefix} declared parity threshold failed`);
  if (
    metrics.maximumRawLandActiveDiagnosticDifferencePa <= 1_000
    || metrics.maximumRawLandActiveDiagnosticDifferencePa
      <= metrics.maximumAssembledActiveStressAbsoluteDifferencePa
    || !policy.rawLandActiveStressAtEtaZeroIsDiagnosticNotAssembledActiveStress
    || parity.rawLandActiveStressDirectParityClaimed
  ) failures.push(`${prefix} raw-Land/assembled-active semantic boundary failed`);

  const parityFlagsPass =
    parity.sourceCenterAccepted === sourceCenterAccepted
    && parity.sourceCenterIsUnique === (centers.length === 1)
    && parity.transferredOnlyTriSegCoordinates
    && parity.sourceSeedEncodedExactly
    && parity.destinationEtaIsExactlyZero
    && parity.destinationColdEquilibriumPass
    && parity.pinnedEvidenceDigestAndCanonicalCurrentSourceMatched
    && !parity.rawLandActiveStressDirectParityClaimed
    && !parity.landStateCopiedFromPhaseB0
    && !parity.slsStateCopiedFromPhaseB0
    && !parity.calciumStateCopiedFromPhaseB0
    && parity.sharedPhysicalStateParityPass;
  if (!parityFlagsPass) failures.push(`${prefix} parity semantic flags failed`);
  if (
    !result.phaseB0CenterToPhaseB1EtaZeroBridgePass
    || Object.values(broadNegativeClaims(result)).some((value) => value !== false)
    || Object.values(summary.broadNegativeClaims).some((value) => value !== false)
    || Object.values(summary.upstreamEvidenceAuthentication)
      .some((value) => value !== true)
    || !summary.modePass
  ) failures.push(`${prefix} bridge pass or broad-negative boundary failed`);

  return Object.freeze({
    mode,
    sourceCenterReconstructionPass,
    canonicalCoreReplayPass,
    canonicalSummaryReplayPass,
    seedAndTopologyPass,
    equilibriumPass,
    independentlyRecomputedEquilibriumPass: independentEquilibrium.pass,
    exactSharedStateParityPass,
    thresholdPass,
    ...metrics,
    scaledColdResidualInfinityNorm: destination.node.scaledResidualInfinityNorm,
    independentlyScaledResidualInfinityNorm:
      independentEquilibrium.scaledResidualInfinityNorm,
    independentlyMinimumLandSimplexMargin:
      independentEquilibrium.minimumLandSimplexMargin,
    independentlyMaximumLandResidualInfinityNorm:
      independentEquilibrium.maximumLandResidualInfinityNorm,
    independentlyMaximumSlsResidualInfinityNorm:
      independentEquilibrium.maximumSlsResidualInfinityNorm,
  });
}

function summarizeIndependently(
  result: PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
  mode: PhaseB0SlsModeV1,
  sourceEvidenceSha256: string,
): PhaseB0CenterToPhaseB1EtaZeroBridgeModeSummaryV1 {
  const destination = result.destination;
  const broad = broadNegativeClaims(result);
  const unknownCount = mode === "on" ? 37 : 32;
  const materialUnknownCount = mode === "on" ? 35 : 30;
  const transferParity = canonicalEqual(
    result.source.coordinates,
    result.transfer.triSegCoordinates,
  ) && canonicalEqual(
    result.transfer.triSegCoordinates,
    destination.upstreamTriSegSeed,
  ) && canonicalEqual(
    destination.upstreamTriSegSeed,
    destination.analyticallyReequilibratedSeedEndpoint.triSegCoordinates,
  ) && canonicalEqual(
    destination.upstreamTriSegSeed,
    destination.node.endpoint.triSegCoordinates,
  ) && canonicalEqual(
    destination.upstreamTriSegSeed,
    destination.equilibriumAudit.solvedTriSegCoordinates,
  );
  const modePass = result.slsMode === mode
    && destination.slsMode === mode
    && result.upstreamFiniteEnvelopeEvidenceSha256 === sourceEvidenceSha256
    && destination.upstreamEvidenceSha256 === sourceEvidenceSha256
    && result.source.nodeId === "C"
    && result.transfer.noOtherPhaseB0StateTransferred
    && result.transfer.fieldNames.join(",") === "V_m_S,y_m"
    && result.parityAudit.pinnedEvidenceDigestAndCanonicalCurrentSourceMatched
    && destination.eta === 0
    && destination.layout.unknownCount === unknownCount
    && destination.layout.materialUnknownCount === materialUnknownCount
    && destination.analyticallyReequilibratedSeedUnknowns.length === unknownCount
    && destination.node.unknowns.length === unknownCount
    && transferParity
    && !destination.warmStartImportedOrConsumed
    && !destination.bloodVolumeAdjustmentApplied
    && !destination.flowAdjustmentApplied
    && !destination.calciumWasNewtonUnknown
    && destination.equilibriumAudit.coupledColdNodeEquilibriumPass
    && result.parityAudit.sharedPhysicalStateParityPass
    && result.phaseB0CenterToPhaseB1EtaZeroBridgePass
    && Object.values(broad).every((value) => value === false);
  return Object.freeze({
    slsMode: result.slsMode,
    source: result.source,
    transfer: result.transfer,
    upstreamEvidenceAuthentication: Object.freeze({
      parentManifestRebuiltAndPinned: true as const,
      parentNumericalCertificateRebuiltAndPinned: true as const,
      sourceModeResultTakenFromCanonicalBundle: true as const,
    }),
    destination: Object.freeze({
      adapterId: destination.adapterId,
      protocolId: destination.protocolId,
      homotopyId: destination.homotopyId,
      eta: destination.eta,
      upstreamEvidenceSha256: destination.upstreamEvidenceSha256,
      upstreamTriSegSeed: destination.upstreamTriSegSeed,
      analyticallyReequilibratedSeedUnknownCount:
        destination.analyticallyReequilibratedSeedUnknowns.length,
      solvedUnknownCount: destination.node.unknowns.length,
      unknownCount: destination.layout.unknownCount,
      materialUnknownCount: destination.layout.materialUnknownCount,
      provenance: destination.provenance,
      analyticallyReequilibratedSeedTriSegCoordinates:
        destination.analyticallyReequilibratedSeedEndpoint.triSegCoordinates,
      solvedTriSegCoordinates: destination.node.endpoint.triSegCoordinates,
      warmStartImportedOrConsumed: destination.warmStartImportedOrConsumed,
      bloodVolumeAdjustmentApplied: destination.bloodVolumeAdjustmentApplied,
      flowAdjustmentApplied: destination.flowAdjustmentApplied,
      calciumWasNewtonUnknown: destination.calciumWasNewtonUnknown,
      scaledResidualInfinityNorm: destination.node.scaledResidualInfinityNorm,
      scaledUpdateInfinityNorm: destination.node.scaledUpdateInfinityNorm,
      equilibriumAudit: destination.equilibriumAudit,
    }),
    parityAudit: result.parityAudit,
    broadNegativeClaims: broad,
    modePass,
  });
}

function broadNegativeClaims(result: PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1) {
  return Object.freeze({
    phaseB0OverallAcceptancePass: false as const,
    acceptedPhaseB1ReferenceBranchPass: result.acceptedPhaseB1ReferenceBranchPass,
    phaseB1LandCoupledVolumeEnvelopePass:
      result.phaseB1LandCoupledVolumeEnvelopePass,
    continuousIntervalRegularityPass: result.continuousIntervalRegularityPass,
    globalRootUniquenessPass: result.globalRootUniquenessPass,
    energeticStabilityPass: result.energeticStabilityPass,
    physiologicalInitializationPass: result.physiologicalInitializationPass,
    closedLoopStationarityPass: result.closedLoopStationarityPass,
    fullBeatAcceptancePass: result.fullBeatAcceptancePass,
    physiologicalValidationPass: false as const,
    releaseRuntimePass: false as const,
    modelCoreIntegration: result.modelCoreIntegration,
    browserRuntimeAdopted: result.browserRuntimeAdopted,
    releaseRuntimeReachable: result.releaseRuntimeReachable,
  });
}

function recomputeParityMetrics(
  source: ReturnType<typeof evaluatePhaseB0HydromechanicsStateV1>,
  destination: BridgeClosedLoopEvaluation,
) {
  const maximumAssembledActiveStressAbsoluteDifferencePa = Math.max(
    ...WALL_IDS.map((wallId) => {
      const sourceWall = source.wallMechanics[wallId];
      const destinationWall = destination.wallMechanics[wallId];
      const assembledActive = destinationWall.totalKirchhoffStressPa
        - destinationWall.equilibriumPassive.equilibriumKirchhoffStressPa
        - destinationWall.slsOverstressPa;
      return Math.abs(sourceWall.activeKirchhoffStressPa - assembledActive);
    }),
  );
  return Object.freeze({
    maximumAssembledActiveStressAbsoluteDifferencePa,
    maximumRawLandActiveDiagnosticDifferencePa: maximumWallDifference(
      (wallId) => source.wallMechanics[wallId].activeKirchhoffStressPa,
      (wallId) => destination.wallMechanics[wallId].activeKirchhoffStressPa,
    ),
    maximumSlsOverstressAbsoluteDifferencePa: maximumWallDifference(
      (wallId) => source.wallMechanics[wallId].slsOverstressPa,
      (wallId) => destination.wallMechanics[wallId].slsOverstressPa,
    ),
    maximumTotalWallStressAbsoluteDifferencePa: maximumWallDifference(
      (wallId) => source.wallMechanics[wallId].totalKirchhoffStressPa,
      (wallId) => destination.wallMechanics[wallId].totalKirchhoffStressPa,
    ),
    maximumTotalWallTangentAbsoluteDifferencePa: maximumWallDifference(
      (wallId) => source.wallMechanics[wallId].totalTangentAtFixedAlphaPa,
      (wallId) => destination.wallMechanics[wallId]
        .totalTangentAtFixedInternalStatePa,
    ),
    maximumTriSegResidualAbsoluteDifferenceNPerM: Math.max(
      Math.abs(
        source.triSegOracle.equilibriumResidual.axialNPerM
        - destination.triSegOracle.equilibriumResidual.axialNPerM,
      ),
      Math.abs(
        source.triSegOracle.equilibriumResidual.radialNPerM
        - destination.triSegOracle.equilibriumResidual.radialNPerM,
      ),
    ),
    maximumPressureAbsoluteDifferencePa: Math.max(
      maximumRecordAbsoluteDifference(
        source.chamberTransmuralPressurePa,
        destination.chamberTransmuralPressurePa,
      ),
      maximumRecordAbsoluteDifference(
        source.chamberAbsolutePressurePa,
        destination.chamberAbsolutePressurePa,
      ),
      maximumRecordAbsoluteDifference(
        source.compartmentAbsolutePressurePa,
        destination.compartmentAbsolutePressurePa,
      ),
    ),
    maximumAtrialPressureRelativeDifference: Math.max(
      maximumRecursiveRelativeDifference(
        source.atria.LA.pressure,
        destination.atria.LA.pressure,
      ),
      maximumRecursiveRelativeDifference(
        source.atria.RA.pressure,
        destination.atria.RA.pressure,
      ),
    ),
    maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2: Math.max(
      ...INERTIAL_FLOW_IDS.map((flowId) => Math.abs(
        source.inertialMomentum[flowId].flowAccelerationM3PerSec2
        - destination.inertialMomentum[flowId].flowAccelerationM3PerSec2,
      )),
    ),
  });
}

function independentlyAuditDestinationEquilibrium(
  mode: PhaseB0SlsModeV1,
  destination: BridgeDestination,
) {
  const node = destination.node;
  const endpoint = node.endpoint;
  const state = endpoint.differentialState;
  const seedEndpoint = destination.analyticallyReequilibratedSeedEndpoint;
  const residualEvaluation = node.residualEvaluation;
  const residual = residualEvaluation.residual;
  const layout = destination.layout;
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const expectedUnknownCount = mode === "on" ? 37 : 32;
  const expectedMaterialUnknownCount = mode === "on" ? 35 : 30;
  const expectedUnknownLabels = [
    ...WALL_IDS.flatMap((wallId) => [
      "CaTRPN", "B", "W", "S", "xiW", "xiS",
    ].map((label) => `tissue.${wallId}.patch-0.land.${label}`)),
    ...(mode === "on"
      ? WALL_IDS.map((wallId) => `tissue.${wallId}.patch-0.sls.alphaV`)
      : []),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ];
  const expectedResidualLabels = [
    ...WALL_IDS.flatMap((wallId) => [
      `cold.${wallId}.population.CaTRPN`,
      `cold.${wallId}.population.B`,
      `cold.${wallId}.population.W`,
      `cold.${wallId}.population.S`,
      `cold.${wallId}.distortion.xiW`,
      `cold.${wallId}.distortion.xiS`,
    ]),
    ...(mode === "on"
      ? WALL_IDS.map((wallId) => `cold.${wallId}.sls.alphaVMinusFiberLogStrain`)
      : []),
    "cold.triseg.equilibrium.axial",
    "cold.triseg.equilibrium.radial",
  ];
  const topologyVectors = encodePhaseB1EndpointTopologyVectorsV1(endpoint);
  const topologyPass =
    destination.slsMode === mode
    && state.slsMode === mode
    && layout.slsMode === mode
    && layout.unknownCount === expectedUnknownCount
    && layout.materialUnknownCount === expectedMaterialUnknownCount
    && node.unknowns.length === expectedUnknownCount
    && destination.analyticallyReequilibratedSeedUnknowns.length
      === expectedUnknownCount
    && residual.length === expectedUnknownCount
    && layout.unknownLabels.length === expectedUnknownCount
    && layout.residualLabels.length === expectedUnknownCount
    && layout.unknownScales.length === expectedUnknownCount
    && layout.residualScales.length === expectedUnknownCount
    && layout.strictLowerBounds.length === expectedUnknownCount
    && layout.strictAffineConstraints.length === 2 * WALL_IDS.length
    && canonicalEqual(layout.unknownLabels, expectedUnknownLabels)
    && canonicalEqual(layout.residualLabels, expectedResidualLabels)
    && layout.unknownScales.every((value) => Number.isFinite(value) && value > 0)
    && layout.residualScales.every((value) => Number.isFinite(value) && value > 0)
    && topologyVectors.slsMode === mode
    && topologyVectors.nonCalciumDifferentialState.length
      === (mode === "on" ? 49 : 44)
    && topologyVectors.algebraicState.length === 2
    && topologyVectors.algebraicState[0] === endpoint.triSegCoordinates.V_m_S
    && topologyVectors.algebraicState[1] === endpoint.triSegCoordinates.y_m
    && node.unknowns[node.unknowns.length - 2]
      === endpoint.triSegCoordinates.V_m_S
    && node.unknowns[node.unknowns.length - 1]
      === endpoint.triSegCoordinates.y_m;

  const fixedTimePass = endpoint.timeSec === 0
    && seedEndpoint.timeSec === 0
    && residualEvaluation.eta === 0
    && node.eta === 0
    && destination.eta === 0;
  const fixedBloodVolumesPass = numericRecordExact(
    state.bloodVolumesM3,
    seedEndpoint.differentialState.bloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
  );
  const fixedInertialFlowsPass = numericRecordExact(
    state.inertialFlowsM3PerSec,
    seedEndpoint.differentialState.inertialFlowsM3PerSec,
    INERTIAL_FLOW_IDS,
  );
  const fixedCalciumPass = WALL_IDS.every((wallId) => {
    const calcium = state.calciumByWall[wallId];
    const seedCalcium = seedEndpoint.differentialState.calciumByWall[wallId];
    const freeCalcium = residualEvaluation.freeCalciumUMByWall[wallId];
    const backwardEuler =
      residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
    return calcium.r === 0
      && calcium.d === 0
      && calcium.r === seedCalcium.r
      && calcium.d === seedCalcium.d
      && Number.isFinite(freeCalcium)
      && freeCalcium >= 0
      && !backwardEuler.calciumResidualPresent
      && backwardEuler.calciumIsKnownEndpointForcing;
  });

  let minimumLandSimplexMargin = Number.POSITIVE_INFINITY;
  let maximumPopulationResidualInfinityNorm = 0;
  let maximumDistortionResidualInfinityNorm = 0;
  let maximumEqualStateLandResidualInfinityNorm = 0;
  const wallRecomputations = Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId, wallIndex) => {
      const offset = 6 * wallIndex;
      const land = state.landByWall[wallId];
      const seedLand = seedEndpoint.differentialState.landByWall[wallId];
      const material = residualEvaluation.wallMaterialByWall[wallId];
      const backwardEuler =
        residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
      const wallResidual = residual.slice(offset, offset + 6);
      const populationResidual = maximumAbsolute(wallResidual.slice(0, 4));
      const distortionResidual = maximumAbsolute(wallResidual.slice(4, 6));
      const equalStateLandResidual = maximumAbsolute(backwardEuler.landResidual);
      const simplexMargin = landPopulationSimplexMargin(land);
      minimumLandSimplexMargin = Math.min(
        minimumLandSimplexMargin,
        simplexMargin,
      );
      maximumPopulationResidualInfinityNorm = Math.max(
        maximumPopulationResidualInfinityNorm,
        populationResidual,
      );
      maximumDistortionResidualInfinityNorm = Math.max(
        maximumDistortionResidualInfinityNorm,
        distortionResidual,
      );
      maximumEqualStateLandResidualInfinityNorm = Math.max(
        maximumEqualStateLandResidualInfinityNorm,
        equalStateLandResidual,
      );
      const topologyEncodedExactly = land.length === 6
        && seedLand.length === 6
        && land.every((value, index) => value === node.unknowns[offset + index])
        && land.every((value, index) => value === seedLand[index]);
      const pass = topologyEncodedExactly
        && simplexMargin > 0
        && wallResidual.length === 6
        && wallResidual.every((value) => Number.isFinite(value))
        && populationResidual <= policy.maximumLocalMaterialResidualInfinityNorm
        && distortionResidual <= policy.maximumLocalMaterialResidualInfinityNorm
        && backwardEuler.landResidual.length === 6
        && equalStateLandResidual
          <= policy.maximumLocalMaterialResidualInfinityNorm
        && material.kernelId === PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID
        && backwardEuler.kernelId === PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID
        && material.wallId === wallId
        && material.sourceLandOutput.health.finite
        && !material.sourceLandOutput.health.projectionUsed
        && !material.stabilizationStiffnessIncludedInStressOrTangent
        && !material.productionStateResidualUsesStrainRate
        && !backwardEuler.productionStateResidualUsesStrainRate;
      return [wallId, Object.freeze({
        populationResidual,
        distortionResidual,
        equalStateLandResidual,
        simplexMargin,
        topologyEncodedExactly,
        pass,
      })];
    }),
  )) as Readonly<Record<FourChamberWallId, Readonly<{
    populationResidual: number;
    distortionResidual: number;
    equalStateLandResidual: number;
    simplexMargin: number;
    topologyEncodedExactly: boolean;
    pass: boolean;
  }>>>;
  const materialPass = Object.values(wallRecomputations)
    .every((wall) => wall.pass);

  let maximumSlsConstraintInfinityNorm = 0;
  let maximumEqualStateSlsResidualInfinityNorm = 0;
  const slsPass = WALL_IDS.every((wallId, wallIndex) => {
    const material = residualEvaluation.wallMaterialByWall[wallId];
    const backwardEuler =
      residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
    if (mode === "off") {
      return state.slsMode === "off"
        && seedEndpoint.differentialState.slsMode === "off"
        && !Object.hasOwn(state, "slsAlphaVByWall")
        && !Object.hasOwn(seedEndpoint.differentialState, "slsAlphaVByWall")
        && material.sls.mode === "off"
        && !material.sls.statePhysicallyPresent
        && material.sls.alphaV === null
        && material.sls.overstressPa === 0
        && backwardEuler.slsResidual === null
        && backwardEuler.slsResidualPartialByNextAlphaV === null;
    }
    if (
      state.slsMode !== "on"
      || seedEndpoint.differentialState.slsMode !== "on"
    ) return false;
    const alphaV = state.slsAlphaVByWall[wallId];
    const seedAlphaV = seedEndpoint.differentialState.slsAlphaVByWall[wallId];
    const constraint = residual[30 + wallIndex];
    const equalStateResidual = backwardEuler.slsResidual;
    maximumSlsConstraintInfinityNorm = Math.max(
      maximumSlsConstraintInfinityNorm,
      Math.abs(constraint),
    );
    maximumEqualStateSlsResidualInfinityNorm = Math.max(
      maximumEqualStateSlsResidualInfinityNorm,
      Math.abs(equalStateResidual ?? Number.POSITIVE_INFINITY),
    );
    return alphaV === node.unknowns[30 + wallIndex]
      && alphaV === seedAlphaV
      && material.sls.mode === "on"
      && material.sls.statePhysicallyPresent
      && material.sls.alphaV === alphaV
      && Number.isFinite(constraint)
      && roundoffEqual(constraint, alphaV - material.fiberLogStrain)
      && Math.abs(constraint) <= policy.maximumLocalMaterialResidualInfinityNorm
      && equalStateResidual !== null
      && Math.abs(equalStateResidual)
        <= policy.maximumLocalMaterialResidualInfinityNorm
      && backwardEuler.slsResidualPartialByNextAlphaV !== null;
  });

  const triSegOffset = expectedUnknownCount - 2;
  const triSegResidual = residual.slice(triSegOffset);
  const triSegResidualPass = triSegResidual.length === 2
    && triSegResidual.every(Number.isFinite)
    && triSegResidual[0] === residualEvaluation.triSegResidualNPerM.axial
    && triSegResidual[1] === residualEvaluation.triSegResidualNPerM.radial
    && triSegResidual[0]
      === residualEvaluation.closedLoop.triSegOracle.equilibriumResidual.axialNPerM
    && triSegResidual[1]
      === residualEvaluation.closedLoop.triSegOracle.equilibriumResidual.radialNPerM;
  const scaledResidualInfinityNorm = Math.max(...residual.map(
    (value, index) => Math.abs(value / layout.residualScales[index]),
  ));
  const seedToSolvedScaledInfinityNorm = Math.max(
    ...node.unknowns.map((value, index) => Math.abs(
      (value - destination.analyticallyReequilibratedSeedUnknowns[index])
        / layout.unknownScales[index],
    )),
  );
  const maximumLandResidualInfinityNorm = Math.max(
    maximumPopulationResidualInfinityNorm,
    maximumDistortionResidualInfinityNorm,
    maximumEqualStateLandResidualInfinityNorm,
  );
  const maximumSlsResidualInfinityNorm = Math.max(
    maximumSlsConstraintInfinityNorm,
    maximumEqualStateSlsResidualInfinityNorm,
  );
  const maximumLocalMaterialResidualInfinityNorm = Math.max(
    maximumPopulationResidualInfinityNorm,
    maximumDistortionResidualInfinityNorm,
    maximumSlsConstraintInfinityNorm,
  );
  const residualAndNewtonGatePass =
    roundoffEqual(scaledResidualInfinityNorm, node.scaledResidualInfinityNorm)
    && scaledResidualInfinityNorm <= policy.maximumScaledColdResidualInfinityNorm
    && node.scaledUpdateInfinityNorm <= policy.maximumScaledColdUpdateInfinityNorm
    && roundoffEqual(
      maximumLocalMaterialResidualInfinityNorm,
      node.maximumLocalMaterialResidualInfinityNorm,
    )
    && maximumLocalMaterialResidualInfinityNorm
      <= policy.maximumLocalMaterialResidualInfinityNorm
    && roundoffEqual(minimumLandSimplexMargin, node.minimumLandSimplexMargin)
    && minimumLandSimplexMargin > 0;
  const prohibitedOperationsAbsent =
    !node.projectionApplied
    && !node.clippingApplied
    && !node.fallbackApplied
    && !residualEvaluation.projectionApplied
    && !residualEvaluation.clippingApplied
    && !destination.warmStartImportedOrConsumed
    && !destination.bloodVolumeAdjustmentApplied
    && !destination.flowAdjustmentApplied
    && !destination.calciumWasNewtonUnknown;

  const audit = destination.equilibriumAudit;
  const auditWallConsistency = WALL_IDS.every((wallId) => {
    const independently = wallRecomputations[wallId];
    const recorded = audit.wallByWall[wallId];
    const material = residualEvaluation.wallMaterialByWall[wallId];
    const backwardEuler =
      residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
    const calcium = state.calciumByWall[wallId];
    return recorded.wallId === wallId
      && canonicalEqual(recorded.calciumState, calcium)
      && recorded.freeCalciumUM
        === residualEvaluation.freeCalciumUMByWall[wallId]
      && recorded.landPopulationResidualInfinityNormPerSec
        === independently.populationResidual
      && recorded.landDistortionResidualInfinityNorm
        === independently.distortionResidual
      && recorded.equalStateBackwardEulerLandResidualInfinityNorm
        === independently.equalStateLandResidual
      && recorded.minimumLandPopulationSimplexMargin
        === independently.simplexMargin
      && recorded.sourceLandStateFinite
        === material.sourceLandOutput.health.finite
      && recorded.sourceLandProjectionUsed
        === material.sourceLandOutput.health.projectionUsed
      && recorded.slsStatePhysicallyPresent === material.sls.statePhysicallyPresent
      && recorded.slsAlphaV === material.sls.alphaV
      && recorded.slsOverstressPa === material.sls.overstressPa
      && recorded.equalStateBackwardEulerSlsResidual
        === backwardEuler.slsResidual
      && recorded.materialEquilibriumPass === independently.pass
      && recorded.calciumEquilibriumPass
      && recorded.slsEquilibriumPass
      && recorded.wallPass;
  });
  const auditConsistencyPass =
    audit.coldUnknownCount === expectedUnknownCount
    && audit.coldMaterialUnknownCount === expectedMaterialUnknownCount
    && audit.coldResidualCount === residual.length
    && canonicalEqual(audit.residualVector, residual)
    && canonicalEqual(audit.endpointTopologyVectors, topologyVectors)
    && audit.fixedBloodVolumesPreserved === fixedBloodVolumesPass
    && audit.fixedInertialFlowsPreserved === fixedInertialFlowsPass
    && audit.fixedCalciumStatesPreserved === fixedCalciumPass
    && roundoffEqual(
      audit.seedToSolvedScaledInfinityNorm,
      seedToSolvedScaledInfinityNorm,
    )
    && audit.maximumLandPopulationResidualInfinityNormPerSec
      === maximumPopulationResidualInfinityNorm
    && audit.maximumLandDistortionResidualInfinityNorm
      === maximumDistortionResidualInfinityNorm
    && audit.maximumEqualStateBackwardEulerLandResidualInfinityNorm
      === maximumEqualStateLandResidualInfinityNorm
    && audit.maximumAbsoluteSlsEquilibriumConstraint
      === maximumSlsConstraintInfinityNorm
    && audit.maximumAbsoluteEqualStateBackwardEulerSlsResidual
      === maximumEqualStateSlsResidualInfinityNorm
    && canonicalEqual(
      audit.triSegResidualNPerM,
      residualEvaluation.triSegResidualNPerM,
    )
    && roundoffEqual(
      audit.scaledResidualInfinityNorm,
      scaledResidualInfinityNorm,
    )
    && audit.scaledUpdateInfinityNorm === node.scaledUpdateInfinityNorm
    && roundoffEqual(audit.minimumLandSimplexMargin, minimumLandSimplexMargin)
    && audit.topologyPass === topologyPass
    && audit.materialEquilibriumPass === materialPass
    && audit.slsEquilibriumPass === slsPass
    && audit.calciumEquilibriumPass === fixedCalciumPass
    && audit.triSegEquilibriumPass
      === (triSegResidualPass
        && scaledResidualInfinityNorm
          <= policy.maximumScaledColdResidualInfinityNorm
        && residualEvaluation.eta === 0
        && node.effectiveTriSegAudit.accepted)
    && audit.prohibitedNumericalOperationsAbsent
      === prohibitedOperationsAbsent
    && auditWallConsistency;
  const pass = topologyPass
    && fixedTimePass
    && fixedBloodVolumesPass
    && fixedInertialFlowsPass
    && fixedCalciumPass
    && materialPass
    && slsPass
    && triSegResidualPass
    && residualAndNewtonGatePass
    && prohibitedOperationsAbsent
    && seedToSolvedScaledInfinityNorm
      <= policy.maximumScaledColdUpdateInfinityNorm;
  return Object.freeze({
    pass,
    auditConsistencyPass,
    scaledResidualInfinityNorm,
    minimumLandSimplexMargin,
    maximumLandResidualInfinityNorm,
    maximumSlsResidualInfinityNorm,
  });
}

function landPopulationSimplexMargin(land: readonly number[]): number {
  const [ca, b, w, s] = land;
  return Math.min(ca, 1 - ca, b, w, s, 1 - b - w - s);
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function verifyReadinessBoundary(
  readiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1
  >,
): void {
  if (
    !readiness.phaseB0CenterToPhaseB1EtaZeroBridgePass
    || !readiness.implementation
      .landAndCalciumReconstructedAndPhysicalSlsTopologyAppliedInsideB1
    || !readiness.implementation.fullDeclaredParityAndEquilibriumAuditPass
    || readiness.phaseB0OverallAcceptancePass
    || readiness.acceptedPhaseB1ReferenceBranchPass
    || readiness.phaseB1LandCoupledVolumeEnvelopePass
    || readiness.continuousIntervalRegularityPass
    || readiness.globalRootUniquenessPass
    || readiness.energeticStabilityPass
    || readiness.physiologicalInitializationPass
    || readiness.closedLoopStationarityPass
    || readiness.fullBeatAcceptancePass
    || readiness.physiologicalValidationPass
    || readiness.releaseRuntimePass
    || readiness.modelCoreIntegration
    || readiness.browserRuntimeAdopted
    || readiness.releaseRuntimeReachable
  ) failures.push("bridge readiness overclaims a deferred acceptance boundary");
}

function buildSourceCenterState(
  baseState: PhaseB0HydromechanicsStateV1,
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>,
): PhaseB0HydromechanicsStateV1 {
  const shared = Object.freeze({
    timeSec: 0 as const,
    bloodVolumesM3,
    inertialFlowsM3PerSec: baseState.inertialFlowsM3PerSec,
    triSegCoordinates,
  });
  return baseState.slsMode === "on"
    ? Object.freeze({
      ...shared,
      slsMode: "on" as const,
      slsAlphaVByWall: baseState.slsAlphaVByWall,
    })
    : Object.freeze({ ...shared, slsMode: "off" as const });
}

function registryValuePayload(
  registry: PhaseB0NewtonScaleRegistry,
) {
  return Object.freeze({
    policy: registry.policy,
    unknownScales: registry.unknownScales,
    numericalUnknownOffsets: Object.freeze({
      default: registry.unknownOffsets.default,
      septalMidwallVolumeM3: registry.unknownOffsets.septalMidwallVolumeM3,
      junctionRadiusM: registry.unknownOffsets.junctionRadiusM,
    }),
    residualScales: registry.residualScales,
    tolerances: registry.tolerances,
  });
}

function sharedFlowPressurePayload(input: Readonly<{
  valveLossParametersByFlow: unknown;
  inletLossParametersByFlow: unknown;
  vascularComplianceParametersByCompartment: unknown;
  peripheralResistancePaSecPerM3ByFlow: unknown;
  pericardiumParameters: unknown;
  intrathoracicPressurePa: number;
}>) {
  return Object.freeze({
    valveLossParametersByFlow: input.valveLossParametersByFlow,
    inletLossParametersByFlow: input.inletLossParametersByFlow,
    vascularComplianceParametersByCompartment:
      input.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      input.peripheralResistancePaSecPerM3ByFlow,
    pericardiumParameters: input.pericardiumParameters,
    intrathoracicPressurePa: input.intrathoracicPressurePa,
  });
}

function failedModeMetric(
  mode: PhaseB0SlsModeV1,
  canonicalCoreReplayPass: boolean,
  canonicalSummaryReplayPass: boolean,
): ModeMetric {
  return Object.freeze({
    mode,
    sourceCenterReconstructionPass: false,
    canonicalCoreReplayPass,
    canonicalSummaryReplayPass,
    seedAndTopologyPass: false,
    equilibriumPass: false,
    independentlyRecomputedEquilibriumPass: false,
    exactSharedStateParityPass: false,
    thresholdPass: false,
    maximumAssembledActiveStressAbsoluteDifferencePa: Number.NaN,
    maximumRawLandActiveDiagnosticDifferencePa: Number.NaN,
    maximumSlsOverstressAbsoluteDifferencePa: Number.NaN,
    maximumTotalWallStressAbsoluteDifferencePa: Number.NaN,
    maximumTotalWallTangentAbsoluteDifferencePa: Number.NaN,
    maximumTriSegResidualAbsoluteDifferenceNPerM: Number.NaN,
    maximumPressureAbsoluteDifferencePa: Number.NaN,
    maximumAtrialPressureRelativeDifference: Number.NaN,
    maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2: Number.NaN,
    scaledColdResidualInfinityNorm: Number.NaN,
    independentlyScaledResidualInfinityNorm: Number.NaN,
    independentlyMinimumLandSimplexMargin: Number.NaN,
    independentlyMaximumLandResidualInfinityNorm: Number.NaN,
    independentlyMaximumSlsResidualInfinityNorm: Number.NaN,
  });
}

function maximumWallDifference(
  left: (wallId: FourChamberWallId) => number,
  right: (wallId: FourChamberWallId) => number,
): number {
  return Math.max(...WALL_IDS.map((wallId) => Math.abs(
    left(wallId) - right(wallId),
  )));
}

function numericRecordExact<K extends string>(
  left: Readonly<Record<K, number>>,
  right: Readonly<Record<K, number>>,
  keys: readonly K[],
): boolean {
  return keys.every((key) => left[key] === right[key]);
}

function maximumRecordAbsoluteDifference<K extends string>(
  left: Readonly<Record<K, number>>,
  right: Readonly<Record<K, number>>,
): number {
  const keys = Object.keys(left) as K[];
  if (
    keys.length !== Object.keys(right).length
    || keys.some((key) => !Object.hasOwn(right, key))
  ) throw new Error("independent parity record structure drifted");
  return Math.max(0, ...keys.map((key) => Math.abs(left[key] - right[key])));
}

function maximumRecursiveRelativeDifference(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") {
    const scale = Math.max(Math.abs(left), Math.abs(right));
    return scale === 0 ? 0 : Math.abs(left - right) / scale;
  }
  if (
    left === null || right === null
    || typeof left !== "object" || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)
  ) {
    if (left !== right) throw new Error("independent relative metric structure drifted");
    return 0;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      throw new Error("independent relative metric array length drifted");
    }
    return Math.max(0, ...left.map((entry, index) =>
      maximumRecursiveRelativeDifference(entry, right[index])));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const keys = Object.keys(leftRecord).sort();
  if (!canonicalEqual(keys, Object.keys(rightRecord).sort())) {
    throw new Error("independent relative metric record keys drifted");
  }
  return Math.max(0, ...keys.map((key) =>
    maximumRecursiveRelativeDifference(leftRecord[key], rightRecord[key])));
}

function roundoffEqual(left: number, right: number): boolean {
  return left === right || Math.abs(left - right)
    <= 64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

function expectCanonicalEqual(label: string, actual: unknown, expected: unknown) {
  if (!canonicalEqual(actual, expected)) failures.push(`${label} drifted`);
}

function expectEqual(label: string, actual: string, expected: string): void {
  if (actual !== expected) failures.push(`${label}: expected ${expected}, got ${actual}`);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
