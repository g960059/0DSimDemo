import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedLanePresetV1,
} from "@/engine/myocardium/MainWireIntegratedLanePresetV1";
import {
  INTEGRATED_LANE_PRESENTATION_COVERAGE_V1,
  INTEGRATED_LANE_PRESENTATION_DT_SEC_V1,
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_SESSION_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  INTEGRATED_V3_LANE_BADGE_V1,
  INTEGRATED_V3_LANE_CAPABILITIES_V1,
  INTEGRATED_V3_LANE_DISPLAY_NAME_V1,
  INTEGRATED_V3_LANE_ID_V1,
  INTEGRATED_V3_LANE_KIND_V1,
  INTEGRATED_V3_LANE_LIMITATIONS_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import {
  CANONICAL_JSON_ALGORITHM_V1,
  RELEASE_DIGEST_ALGORITHM_V1,
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
  type SimulationReleaseEvidenceStatusV1,
  type SimulationReleaseLifecycleStatusV1,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_MANIFEST_V1_SCHEMA_ID =
  "main-wire-integrated-v3-development-lane-manifest-v1" as const;
export const MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID =
  "main-wire-integrated-coronary-sinus-hmii-experimental" as const;
export const MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION =
  "0.0.1" as const;
export const MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256 =
  "4753c81aa3635af0723b88afa0a6f567ecb8f31f0d5df2a8f074bf87eed23a86" as const;
export const MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ARTIFACT_PATH =
  "engine/myocardium/releases/main-wire-integrated-coronary-sinus-hmii-experimental-0.0.1.json" as const;
export const MAIN_WIRE_INTEGRATED_LANE_STATE_CODEC_V1_ID =
  "main-wire-integrated-v3-operational-checkpoint-state-codec-v1" as const;
export const MAIN_WIRE_INTEGRATED_LANE_EXPLORATORY_PROTOCOL_V1_ID =
  "main-wire-integrated-v3-live-presentation-exploratory-protocol-v1" as const;

export type MainWireIntegratedLaneDevelopmentManifestV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_MANIFEST_V1_SCHEMA_ID;
  identityPolicy: Readonly<{
    canonicalJson: typeof CANONICAL_JSON_ALGORITHM_V1;
    digest: typeof RELEASE_DIGEST_ALGORITHM_V1;
  }>;
  id: typeof MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID;
  version:
    typeof MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION;
  lifecycleStatus: SimulationReleaseLifecycleStatusV1;
  evidenceStatus: SimulationReleaseEvidenceStatusV1;
  lane: CanonicalJsonObject;
  scientificModel: CanonicalJsonObject;
  stateCodec: CanonicalJsonObject;
  frozenPresetSnapshot: CanonicalJsonObject;
  observableSchema: CanonicalJsonObject;
  protocol: CanonicalJsonObject;
  evidence: CanonicalJsonObject;
  claims: readonly string[];
  limitations: readonly string[];
  capabilities: CanonicalJsonObject;
}>;

export type MainWireIntegratedLaneDevelopmentIdentityV1 = Readonly<{
  ref: SimulationReleaseRef;
  manifest: MainWireIntegratedLaneDevelopmentManifestV1;
}>;

/**
 * Builds the development identity from the production-owned preset and schema.
 * The checked-in artifact is generated from this value and loaded separately.
 */
export async function buildMainWireIntegratedLaneDevelopmentIdentityV1():
Promise<MainWireIntegratedLaneDevelopmentIdentityV1> {
  const preset = await createMainWireIntegratedLanePresetV1();
  const {
    provider: _provider,
    ...coronaryInitializeInput
  } = preset.coronaryInitializeInput;
  const providerBinding = {
    contractId: preset.provider.contractId,
    providerId: preset.provider.providerId,
    parameterSetId: preset.provider.parameterSetId,
    parameterIdentityHash: preset.provider.parameterIdentityHash,
    stateSchemaVersion: preset.provider.stateSchemaVersion,
  };
  const observableCatalogSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  );
  const manifest = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_MANIFEST_V1_SCHEMA_ID,
    identityPolicy: {
      canonicalJson: CANONICAL_JSON_ALGORITHM_V1,
      digest: RELEASE_DIGEST_ALGORITHM_V1,
    },
    id: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_ID,
    version: MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_VERSION,
    lifecycleStatus: "development" as const,
    evidenceStatus: "unverified" as const,
    lane: {
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      laneId: INTEGRATED_V3_LANE_ID_V1,
      displayName: INTEGRATED_V3_LANE_DISPLAY_NAME_V1,
      badge: INTEGRATED_V3_LANE_BADGE_V1,
      sessionId: MAIN_WIRE_INTEGRATED_SCIENTIFIC_SESSION_V1_ID,
    },
    scientificModel: {
      transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      transactionClaim: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3,
    },
    stateCodec: {
      codecId: MAIN_WIRE_INTEGRATED_LANE_STATE_CODEC_V1_ID,
      acceptedStateTransactionId:
        MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
      checkpointSchemaVersion: 3,
      checkpointClaim: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3,
      mechanicsProviderBinding: providerBinding,
      mechanicsProviderCodecSurface: ["clone", "decode", "encode"],
      migrationClaimed: false,
      clockRebaseClaimed: false,
    },
    frozenPresetSnapshot: {
      providerBinding,
      coronaryInitializeInput,
      coronaryStepInput: preset.coronaryStepInput,
      rhythmConfiguration: preset.rhythm.configuration,
      rhythmColdAcceptedState: preset.rhythm.state,
      dynamicMechanicalSupportConfig: preset.config,
      dynamicMechanicalSupportInertanceProfile: preset.profile,
    },
    observableSchema: {
      schemaId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
      schemaVersion:
        MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
      sha256: observableCatalogSha256,
      snapshot: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
    },
    protocol: {
      protocolId: MAIN_WIRE_INTEGRATED_LANE_EXPLORATORY_PROTOCOL_V1_ID,
      protocolVersion: "1.0.0",
      classification: "exploratory",
      approvalStatus: "not-approved",
      coverage: INTEGRATED_LANE_PRESENTATION_COVERAGE_V1,
      presentationDtSec: INTEGRATED_LANE_PRESENTATION_DT_SEC_V1,
      fixedInput: true,
      exactReplayOrExportClaimed: false,
      periodicSteadyStateClaimed: false,
    },
    evidence: {
      status: "unverified",
      clinicalValidationClaimed: false,
      longTermPhysiologicalValidationEstablished: false,
      activeMcsPeriodicSteadyEvidence: "none",
      dynamicMcsInertanceProfileReleaseApproved: false as const,
      dynamicMcsInertanceProfileProvenance:
        "literature-circuit-inertance-not-independently-validated",
      orderedLaneLimitations: INTEGRATED_V3_LANE_LIMITATIONS_V1,
    },
    claims: [],
    limitations: INTEGRATED_V3_LANE_LIMITATIONS_V1,
    capabilities: INTEGRATED_V3_LANE_CAPABILITIES_V1,
  });
  const typedManifest =
    manifest as unknown as MainWireIntegratedLaneDevelopmentManifestV1;
  const ref = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    id: typedManifest.id,
    version: typedManifest.version,
    sha256: await sha256CanonicalJsonHex(typedManifest),
  }) as unknown as SimulationReleaseRef;
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ref,
    manifest: typedManifest,
  }) as unknown as MainWireIntegratedLaneDevelopmentIdentityV1;
}
