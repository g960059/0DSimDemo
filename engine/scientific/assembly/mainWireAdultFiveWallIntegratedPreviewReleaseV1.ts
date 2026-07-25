import {
  mechanicalSupportPresetV1,
  type MechanicalSupportPresetIdV1,
} from "@/engine/devices/presetsV1";
import type {
  MechanicalSupportConfigV1,
} from "@/engine/devices/typesV1";
import type {
  DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_RUNTIME_ABI_SHA256_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
  createMainWireIntegratedModelAllOffZeroInertanceProfileV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import {
  cloneAndFreezeCanonicalJson,
  createSimulationReleaseV1,
  type CanonicalJsonObject,
  type SimulationReleaseManifestInputV1,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ID =
  "circleheart/adult-five-wall-integrated-preview" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_VERSION =
  "0.1.0" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256 =
  "32d4f2c936eabd6b19fcb18386ba540174de6627110b1c2febb0140938f0fa5d" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ARTIFACT_PATH =
  "engine/scientific/assembly/releases/main-wire-adult-five-wall-integrated-preview-0.1.0.json" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_LIMITATIONS_ACK_KEY_V1 =
  "circleheart.modelLimitations.circleheart-adult-five-wall-integrated-preview.0.1.0" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_LIMITATIONS_V1 =
  Object.freeze([
    "development preview, not the current stable product release",
    "physiological or clinical validation is not established",
    "the pulmonary PA-PArt waveform mechanism remains an open structural blocker",
    "active HeartMate II is one unsteady post-activation beat and not a periodic result",
    "the HeartMate II inertance profile is a literature transcription and is not release-approved",
    "external AF joint checkpointing and rhythm-synchronized IABP remain blocked",
    "multipatch myocardium and patient-specific fitting are not included",
    "exact numerical checkpoint evidence is canonical-environment-bound; cross-runtime bitwise equivalence is not claimed",
  ] as const);

export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ARTIFACT_PATH =
  "data/scientific/releases/integrated-preview-0.1.0/normal-sinus-periodic-seed-run-v1.json" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH =
  "data/scientific/evidence/integrated-preview-0.1.0/canonical-periodic-v3-source.json" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_RAW_SHA256 =
  "c3735e70eb940ca231f3d8f9456756664bf081edf334e7239463d9f0c8fb09f6" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_CANONICAL_SHA256 =
  "183525fb3d0911f3a10b873b7410cef2ec15146aa352002f88e9d27cc26f7b8a" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_COLD_INITIALIZATION_CHECKPOINT_SHA256 =
  "ab04a3ad56b21c9d06971dceed606053c52569c00122d20485fe5077b69218f5" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_CANONICAL_EXECUTION_ENVIRONMENT_V1 =
  Object.freeze({
    nodeVersion: "v26.4.0" as const,
    v8Version: "14.6.202.34-node.21" as const,
    platform: "darwin" as const,
    arch: "arm64" as const,
    crossRuntimeBitwiseEquivalenceClaimed: false as const,
  });
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_RAW_SHA256 =
  "71455dfb3e59d132ac6b3df6ddcde322c4aefbfb67be4c1119a8daef7c21299c" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256 =
  "a990889b4c31218b55998da12371cf34bd5d88effeb237acc4547b45dd566b10" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_START_CHECKPOINT_SHA256 =
  "9fc15d39328e3ef1e3c4f17d22b99c224fd44efebbf4b1fe5cbdb5cec3036aef" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256 =
  "f4024a1570f791315211a0d88b767fb4b0e846ac80dba3f57079ca7924accad0" as const;

export type MainWireIntegratedPreviewMechanicalSupportInputDefinitionV1 =
Readonly<{
  previewPresetId:
    | "all-off"
    | "lvad-hmii-9000-one-beat-transient";
  configPresetId: MechanicalSupportPresetIdV1;
  activeDeviceIds: readonly [] | readonly ["LVAD"];
  interpretation:
    | "numerically-periodic-all-off-seed"
    | "one-unsteady-post-activation-beat";
  profile: DynamicMechanicalSupportInertanceProfileV1;
  config: MechanicalSupportConfigV1;
}>;

export const MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1 =
  cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    "all-off": {
      previewPresetId: "all-off",
      configPresetId: "all-off",
      activeDeviceIds: [],
      interpretation: "numerically-periodic-all-off-seed",
      profile: createMainWireIntegratedModelAllOffZeroInertanceProfileV3(),
      config: mechanicalSupportPresetV1("all-off"),
    },
    "lvad-hmii-9000-one-beat-transient": {
      previewPresetId: "lvad-hmii-9000-one-beat-transient",
      configPresetId: "lvad-hmii-9000",
      activeDeviceIds: ["LVAD"],
      interpretation: "one-unsteady-post-activation-beat",
      profile:
        createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2(),
      config: mechanicalSupportPresetV1("lvad-hmii-9000"),
    },
  }) as unknown as Readonly<Record<
    "all-off" | "lvad-hmii-9000-one-beat-transient",
    MainWireIntegratedPreviewMechanicalSupportInputDefinitionV1
  >>;

export const MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1 = Object.freeze({
  protocolId: "main-wire-integrated-preview-one-beat-continuation-v1" as const,
  protocolVersion: "1.0.0" as const,
  nominalDtSec: 0.002 as const,
  cycleLengthSec: 1 as const,
  maximumAcceptedStepCountPerBeat: 1_100 as const,
  observationPolicy:
    "raw-accepted-endpoints-with-rhythm-and-coronary-boundary-clipping" as const,
  supportedMechanicalSupportInputs: Object.freeze([
    "all-off",
    "lvad-hmii-9000-one-beat-transient",
  ] as const),
  canonicalMechanicalSupportInputs:
    MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1,
  activeLvadInterpretation:
    "state-preserving-structural-fork-from-p1-all-off-seed-followed-by-one-unsteady-beat" as const,
  activeLvadPeriodicSteadyStateClaimed: false as const,
});

export function mainWireAdultFiveWallIntegratedPreviewReleaseInputV1():
SimulationReleaseManifestInputV1 {
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    id: MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ID,
    version:
      MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_VERSION,
    lifecycleStatus: "development",
    evidenceStatus: "verified-research",
    evidence: {
      evidenceSetId: "circleheart-integrated-preview-v3-evidence-v1",
      evidenceSetVersion: "1.0.0",
      status: "verified-research",
      snapshot: {
        seedRunArtifact: {
          path: MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ARTIFACT_PATH,
          rawFileSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_RAW_SHA256,
          payloadSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256,
          startCheckpointSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_SEED_START_CHECKPOINT_SHA256,
          terminalCheckpointSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256,
          completedCycleCount: 70,
          classification: "period1-converged",
          physiologicalAcceptanceEstablished: false,
          releaseAcceptanceEstablished: false,
        },
        periodicSourceArtifact: {
          path:
            MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH,
          artifactSchemaVersion: 5,
          runtimeAbiSha256:
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_RUNTIME_ABI_SHA256_V3,
          coldInitializationCheckpointSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_COLD_INITIALIZATION_CHECKPOINT_SHA256,
          canonicalExecutionEnvironment:
            MAIN_WIRE_INTEGRATED_PREVIEW_CANONICAL_EXECUTION_ENVIRONMENT_V1,
          rawFileSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_RAW_SHA256,
          canonicalJsonSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_CANONICAL_SHA256,
        },
        activeHeartMateIiEvidenceRole:
          "bounded-literature-transcription-and-transaction-smoke-only",
        pulmonaryWaveformStructuralBlocker:
          "underdamped-PA-to-PArt-edge-mechanism-localized-not-yet-remediated",
        clinicalValidationClaimed: false,
      },
    },
    scientificModel: {
      modelId: "adult-five-wall-integrated-preview-model",
      modelVersion: "0.1.0",
      assemblyId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      assemblyVersion: "3.0.0",
      snapshot: {
        transaction: {
          id: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
          claim: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3,
        },
        capabilities: {
          baseClosedLoop: true,
          coronaryV3: true,
          dynamicMechanicalSupport: true,
          composedRhythmV2: true,
          exactCheckpoint: true,
          multipatch: false,
          externalAfJointCheckpoint: false,
          acceptedVentricularSynchronizedIabp: false,
        },
        selectablePreviewInputs: {
          rhythm: ["composed-regular-sinus-60-v1"],
          mechanicalSupport:
            MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1
              .supportedMechanicalSupportInputs,
          mechanicalSupportDefinitions:
            MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1,
        },
      },
    },
    numericalRuntime: {
      runtimeId: "main-wire-integrated-accepted-state-runtime",
      runtimeVersion: "0.1.0",
      solverId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      solverVersion: "3.0.0",
      snapshot: {
        commit: "all-integrated-owners-atomic",
        failure: "retain-last-accepted-integrated-tuple",
        exactCheckpointCompatibility:
          "identical-simulation-release-ref-and-input-spec-only",
        transientPolicy:
          MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1,
      },
    },
    stateSchema: {
      schemaId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
      schemaVersion: 3,
      snapshot: {
        exactResumeClaim: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V3,
        seedStartCheckpointSha256:
          MAIN_WIRE_INTEGRATED_PREVIEW_SEED_START_CHECKPOINT_SHA256,
        seedTerminalCheckpointSha256:
          MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256,
      },
    },
    observableSchema: {
      schemaId: "circleheart-integrated-preview-trace-v1",
      schemaVersion: 1,
      snapshot: {
        rawAcceptedEndpointSamples: true,
        signals: [
          "chamber-volume-LA-LV-RA-RV",
          "absolute-pressure-LA-LV-RA-RV-Ao-PA-PVein",
          "valve-flow-MV-AoV-TV-PV",
          "pulmonary-five-node-pressure-volume-and-edge-flow",
          "coronary-total-and-LAD-subendocardial-flow",
          "five-wall-free-calcium",
          "dynamic-MCS-accepted-flow-by-device",
          "accepted-rhythm-event-identity",
          "solver-and-conservation-diagnostics",
        ],
      },
    },
    approvedProtocols: [
      {
        protocolId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
        protocolVersion: "3.0.0",
        snapshot: {
          policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
          claim: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3,
          bundledSeedRole: "initial-state-only",
        },
      },
      {
        protocolId:
          MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.protocolId,
        protocolVersion:
          MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.protocolVersion,
        snapshot: MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1,
      },
    ],
    claims: [
      "base, coronary V3, dynamic MCS and composed rhythm advance in one atomic accepted transaction",
      "the bundled all-off seed is numerically P1 and exact-checkpoint-restorable",
      "frontend-visible samples are raw accepted endpoints",
    ],
    limitations:
      MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_LIMITATIONS_V1,
  }) as unknown as SimulationReleaseManifestInputV1;
}

export async function assembleMainWireAdultFiveWallIntegratedPreviewReleaseV1():
Promise<SimulationReleaseV1> {
  return createSimulationReleaseV1(
    mainWireAdultFiveWallIntegratedPreviewReleaseInputV1(),
  );
}
