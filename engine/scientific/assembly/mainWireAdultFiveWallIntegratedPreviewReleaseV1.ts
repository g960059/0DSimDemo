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
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
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
  "d66b948dc85265cc5d40c23038b1e67682784f068bc54c8daf10bb249e6a8e47" as const;
export const MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ARTIFACT_PATH =
  "engine/scientific/assembly/releases/main-wire-adult-five-wall-integrated-preview-0.1.0.json" as const;

export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ARTIFACT_PATH =
  "data/scientific/releases/integrated-preview-0.1.0/normal-sinus-periodic-seed-run-v1.json" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_RAW_SHA256 =
  "6cfcca91f6642b08d5ebfc60bc6c2e45c56b084da74791182bb33b8388926546" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256 =
  "a4ae4457bb9d2b670edfbd4bd76a60ce1b79c17c7d8405e28719d5eb207b7424" as const;
export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256 =
  "544e5d8e84eb53fdb3ab44d88bce96f3c315186b3636f3e43585be5666f5b967" as const;

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
          checkpointSha256:
            MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256,
          completedCycleCount: 70,
          classification: "period1-converged",
          physiologicalAcceptanceEstablished: false,
          releaseAcceptanceEstablished: false,
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
        seedCheckpointSha256:
          MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256,
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
    limitations: [
      "development preview, not the current stable product release",
      "physiological or clinical validation is not established",
      "the pulmonary PA-PArt waveform mechanism remains an open structural blocker",
      "active HeartMate II is one unsteady post-activation beat and not a periodic result",
      "the HeartMate II inertance profile is a literature transcription and is not release-approved",
      "external AF joint checkpointing and rhythm-synchronized IABP remain blocked",
      "multipatch myocardium and patient-specific fitting are not included",
    ],
  }) as unknown as SimulationReleaseManifestInputV1;
}

export async function assembleMainWireAdultFiveWallIntegratedPreviewReleaseV1():
Promise<SimulationReleaseV1> {
  return createSimulationReleaseV1(
    mainWireAdultFiveWallIntegratedPreviewReleaseInputV1(),
  );
}
