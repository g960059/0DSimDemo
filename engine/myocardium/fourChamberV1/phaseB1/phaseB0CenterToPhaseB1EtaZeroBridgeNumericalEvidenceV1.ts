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
  buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeEvidenceManifestV1";
import {
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1,
  type PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeNumericalEvidenceV1";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1";

export const PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_NUMERICAL_EVIDENCE_V1_ID =
  "phase-b0-center-to-phase-b1-eta-zero-bridge-numerical-evidence-v1" as const;

const BRIDGE_SLS_MODES_V1 = Object.freeze(["on", "off"] as const);

type BridgeResultV1 = PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeModeSummaryV1 = Readonly<{
  slsMode: PhaseB0SlsModeV1;
  source: BridgeResultV1["source"];
  transfer: BridgeResultV1["transfer"];
  upstreamEvidenceAuthentication: Readonly<{
    parentManifestRebuiltAndPinned: true;
    parentNumericalCertificateRebuiltAndPinned: true;
    sourceModeResultTakenFromCanonicalBundle: true;
  }>;
  destination: Readonly<{
    adapterId: BridgeResultV1["destination"]["adapterId"];
    protocolId: BridgeResultV1["destination"]["protocolId"];
    homotopyId: BridgeResultV1["destination"]["homotopyId"];
    eta: 0;
    upstreamEvidenceSha256: string;
    upstreamTriSegSeed: BridgeResultV1["destination"]["upstreamTriSegSeed"];
    analyticallyReequilibratedSeedUnknownCount: number;
    solvedUnknownCount: number;
    unknownCount: number;
    materialUnknownCount: number;
    provenance: BridgeResultV1["destination"]["provenance"];
    analyticallyReequilibratedSeedTriSegCoordinates:
      BridgeResultV1["destination"]["analyticallyReequilibratedSeedEndpoint"]["triSegCoordinates"];
    solvedTriSegCoordinates:
      BridgeResultV1["destination"]["node"]["endpoint"]["triSegCoordinates"];
    warmStartImportedOrConsumed: false;
    bloodVolumeAdjustmentApplied: false;
    flowAdjustmentApplied: false;
    calciumWasNewtonUnknown: false;
    scaledResidualInfinityNorm: number;
    scaledUpdateInfinityNorm: number;
    equilibriumAudit: BridgeResultV1["destination"]["equilibriumAudit"];
  }>;
  parityAudit: BridgeResultV1["parityAudit"];
  broadNegativeClaims: Readonly<{
    phaseB0OverallAcceptancePass: false;
    acceptedPhaseB1ReferenceBranchPass: false;
    phaseB1LandCoupledVolumeEnvelopePass: false;
    continuousIntervalRegularityPass: false;
    globalRootUniquenessPass: false;
    energeticStabilityPass: false;
    physiologicalInitializationPass: false;
    closedLoopStationarityPass: false;
    fullBeatAcceptancePass: false;
    physiologicalValidationPass: false;
    releaseRuntimePass: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
  }>;
  modePass: boolean;
}>;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidencePayloadV1 =
  Readonly<{
    evidenceId:
      typeof PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_NUMERICAL_EVIDENCE_V1_ID;
    manifestSha256: string;
    sourceFiniteEnvelopeManifestSha256:
      typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1;
    sourceFiniteEnvelopeNumericalEvidenceSha256:
      typeof PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1;
    sourceFiniteEnvelopeAllModesPass: boolean;
    slsModes: typeof BRIDGE_SLS_MODES_V1;
    modes: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB0CenterToPhaseB1EtaZeroBridgeModeSummaryV1
    >>;
    allModesPass: boolean;
  }>;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceCertificateV1 =
  PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidencePayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1 =
  Readonly<{
    certificate:
      PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceCertificateV1;
    sourceFiniteEnvelopeEvidence:
      PhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceBundleV1;
    results: Readonly<Record<
      PhaseB0SlsModeV1,
      PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1
    >>;
  }>;

const CANONICAL_BRIDGE_NUMERICAL_EVIDENCE_BUNDLES_V1 = new WeakSet<object>();

export function buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
  manifest: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
    manifest,
  );
  const sourceManifest =
    buildPhaseB0TriSegFiniteSupportedEnvelopeEvidenceManifestV1(sha256Hex);
  if (
    sourceManifest.contentSha256
      !== PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1
    || sourceManifest.contentSha256
      !== manifest.lineage.phaseB0FiniteEnvelopeManifestSha256
  ) throw new Error("Phase B0-to-B1 bridge source manifest drifted");
  const sourceFiniteEnvelopeEvidence =
    buildPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
      sourceManifest,
      sha256Hex,
    );
  assertCanonicalPhaseB0TriSegFiniteSupportedEnvelopeNumericalEvidenceV1(
    sourceFiniteEnvelopeEvidence,
    sourceManifest,
  );
  const sourceCertificate = sourceFiniteEnvelopeEvidence.certificate;
  if (
    sourceCertificate.contentSha256
      !== PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1
    || sourceCertificate.contentSha256
      !== manifest.lineage.phaseB0FiniteEnvelopeNumericalEvidenceSha256
    || !sourceCertificate.allModesPass
    || canonicalizeJson(Object.keys(sourceFiniteEnvelopeEvidence.results))
      !== canonicalizeJson(BRIDGE_SLS_MODES_V1)
  ) throw new Error("Phase B0-to-B1 bridge source numerical evidence drifted");

  const results = Object.freeze({
    on: bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      sourceFiniteEnvelopeEvidence.results.on,
      sourceCertificate.contentSha256,
      sha256Hex,
    ),
    off: bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      sourceFiniteEnvelopeEvidence.results.off,
      sourceCertificate.contentSha256,
      sha256Hex,
    ),
  });
  if (
    canonicalizeJson(Object.keys(results)) !== canonicalizeJson(BRIDGE_SLS_MODES_V1)
  ) throw new Error("Phase B0-to-B1 bridge mode-key contract drifted");
  const modes = Object.freeze({
    on: summarizeBridgeMode(results.on, "on", sourceCertificate.contentSha256),
    off: summarizeBridgeMode(
      results.off,
      "off",
      sourceCertificate.contentSha256,
    ),
  });
  const payload:
    PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidencePayloadV1 =
    Object.freeze({
      evidenceId:
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_NUMERICAL_EVIDENCE_V1_ID,
      manifestSha256: manifest.contentSha256,
      sourceFiniteEnvelopeManifestSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1,
      sourceFiniteEnvelopeNumericalEvidenceSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
      sourceFiniteEnvelopeAllModesPass: sourceCertificate.allModesPass,
      slsModes: BRIDGE_SLS_MODES_V1,
      modes,
      allModesPass: modes.on.modePass && modes.off.modePass,
    });
  canonicalizeJson(payload);
  const certificate = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  const bundle = Object.freeze({
    certificate,
    sourceFiniteEnvelopeEvidence,
    results,
  });
  CANONICAL_BRIDGE_NUMERICAL_EVIDENCE_BUNDLES_V1.add(bundle);
  return bundle;
}

export function assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
  bundle: PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1,
  manifest: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
): PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1 {
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
    manifest,
  );
  if (
    bundle === null
    || typeof bundle !== "object"
    || !CANONICAL_BRIDGE_NUMERICAL_EVIDENCE_BUNDLES_V1.has(bundle)
    || bundle.certificate.manifestSha256 !== manifest.contentSha256
    || bundle.certificate.sourceFiniteEnvelopeManifestSha256
      !== manifest.lineage.phaseB0FiniteEnvelopeManifestSha256
    || bundle.certificate.sourceFiniteEnvelopeNumericalEvidenceSha256
      !== manifest.lineage.phaseB0FiniteEnvelopeNumericalEvidenceSha256
  ) throw new Error(
    "Phase B0-to-B1 eta-zero bridge numerical evidence must be canonically built for this manifest",
  );
  return bundle;
}

export function phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1(
  certificate:
    PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceCertificateV1,
): PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidencePayloadV1 {
  return Object.freeze({
    evidenceId: certificate.evidenceId,
    manifestSha256: certificate.manifestSha256,
    sourceFiniteEnvelopeManifestSha256:
      certificate.sourceFiniteEnvelopeManifestSha256,
    sourceFiniteEnvelopeNumericalEvidenceSha256:
      certificate.sourceFiniteEnvelopeNumericalEvidenceSha256,
    sourceFiniteEnvelopeAllModesPass:
      certificate.sourceFiniteEnvelopeAllModesPass,
    slsModes: certificate.slsModes,
    modes: certificate.modes,
    allModesPass: certificate.allModesPass,
  });
}

function summarizeBridgeMode(
  result: PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
  expectedMode: PhaseB0SlsModeV1,
  expectedSourceEvidenceSha256: string,
): PhaseB0CenterToPhaseB1EtaZeroBridgeModeSummaryV1 {
  const destination = result.destination;
  const broadNegativeClaims = Object.freeze({
    phaseB0OverallAcceptancePass: false as const,
    acceptedPhaseB1ReferenceBranchPass:
      result.acceptedPhaseB1ReferenceBranchPass,
    phaseB1LandCoupledVolumeEnvelopePass:
      result.phaseB1LandCoupledVolumeEnvelopePass,
    continuousIntervalRegularityPass:
      result.continuousIntervalRegularityPass,
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
  const sourceTransferParity = canonicalizeJson(result.source.coordinates)
      === canonicalizeJson(result.transfer.triSegCoordinates)
    && canonicalizeJson(result.transfer.triSegCoordinates)
      === canonicalizeJson(destination.upstreamTriSegSeed)
    && canonicalizeJson(destination.upstreamTriSegSeed)
      === canonicalizeJson(
        destination.analyticallyReequilibratedSeedEndpoint.triSegCoordinates,
      )
    && canonicalizeJson(destination.upstreamTriSegSeed)
      === canonicalizeJson(destination.node.endpoint.triSegCoordinates)
    && canonicalizeJson(destination.upstreamTriSegSeed)
      === canonicalizeJson(destination.equilibriumAudit.solvedTriSegCoordinates);
  const expectedUnknownCount = expectedMode === "on" ? 37 : 32;
  const expectedMaterialUnknownCount = expectedMode === "on" ? 35 : 30;
  const modePass = result.slsMode === expectedMode
    && destination.slsMode === expectedMode
    && result.upstreamFiniteEnvelopeEvidenceSha256
      === expectedSourceEvidenceSha256
    && destination.upstreamEvidenceSha256 === expectedSourceEvidenceSha256
    && result.source.nodeId === "C"
    && result.transfer.noOtherPhaseB0StateTransferred
    && result.transfer.fieldNames.join(",") === "V_m_S,y_m"
    && result.parityAudit
      .pinnedEvidenceDigestAndCanonicalCurrentSourceMatched
    && destination.eta === 0
    && destination.layout.unknownCount === expectedUnknownCount
    && destination.layout.materialUnknownCount === expectedMaterialUnknownCount
    && destination.analyticallyReequilibratedSeedUnknowns.length
      === expectedUnknownCount
    && destination.node.unknowns.length === expectedUnknownCount
    && sourceTransferParity
    && !destination.warmStartImportedOrConsumed
    && !destination.bloodVolumeAdjustmentApplied
    && !destination.flowAdjustmentApplied
    && !destination.calciumWasNewtonUnknown
    && destination.equilibriumAudit.coupledColdNodeEquilibriumPass
    && result.parityAudit.sharedPhysicalStateParityPass
    && result.phaseB0CenterToPhaseB1EtaZeroBridgePass
    && Object.values(broadNegativeClaims).every((value) => value === false);
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
    broadNegativeClaims,
    modePass,
  });
}
