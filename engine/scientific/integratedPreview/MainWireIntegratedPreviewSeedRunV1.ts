import seedRunRawJson from
  "@/data/scientific/releases/integrated-preview-0.1.0/normal-sinus-periodic-seed-run-v1.json?raw";
import type {
  MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  mainWireIntegratedModelPeriodicProtocolIdentityHashV3,
  type MainWireIntegratedModelHealthyReferenceProjectionV3,
  type MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireIntegratedModelPeriodicClassificationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH,
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_CANONICAL_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_RAW_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_RAW_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_START_CHECKPOINT_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256,
} from "@/engine/scientific/assembly";
import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  sha256TextHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ID =
  "circleheart-main-wire-integrated-preview-seed-run-v1" as const;

export type MainWireIntegratedPreviewSeedInputSpecV1 = Readonly<{
  schemaId: "circleheart-integrated-simulation-input-spec-v1";
  schemaVersion: 1;
  modelAssembly: "base+coronary-v3+dynamic-mcs+composed-rhythm-v2";
  fixedGlobalTotalBloodVolumeMl: 5_600;
  rhythm: Readonly<{
    presetId: "composed-regular-sinus-60-v1";
    heartRateBpm: 60;
    cycleLengthSec: 1;
    externalAfOwnerIncluded: false;
  }>;
  mechanicalSupport: Readonly<{
    presetId: "all-off";
    activeDeviceIds: readonly [];
  }>;
  nominalDtSec: 0.002;
}>;

export type MainWireIntegratedPreviewSeedRunPayloadV1 = Readonly<{
  artifactId: typeof MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ID;
  schemaVersion: 2;
  role: "release-bound-live-session-seed";
  simulationInputSpec: MainWireIntegratedPreviewSeedInputSpecV1;
  sourceEvidence: Readonly<{
    experimentId: string;
    executionPurpose: "canonical-evidence";
    protocolIdentityHash: string;
    completedCycleCount: 70;
    classification: MainWireIntegratedModelPeriodicClassificationV3;
    sourceArtifact: Readonly<{
      path:
        typeof MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH;
      artifactSchemaVersion: 4;
      rawFileSha256: string;
      canonicalJsonSha256: string;
    }>;
    numericalPeriod1Established: true;
    physiologicalAcceptanceEstablished: false;
    independentValidationEstablished: false;
    releaseAcceptanceEstablished: false;
    terminalCheckpointExactRoundTripVerified: true;
  }>;
  displaySeed: Readonly<{
    terminalCycleTrace:
      MainWireIntegratedModelPeriodicTerminalCycleTraceV3;
    terminalHealthyReferenceProjection:
      MainWireIntegratedModelHealthyReferenceProjectionV3;
  }>;
  startModelState: MainWireIntegratedModelCheckpointV3;
  terminalModelState: MainWireIntegratedModelCheckpointV3;
  claims: Readonly<{
    exactTerminalCycleStartCheckpointIncluded: true;
    exactTerminalCycleEndCheckpointIncluded: true;
    stateTransitionInputIdentitiesIncluded: true;
    executableBuildProvenanceAttached: false;
    standaloneReplayCompleteArtifactClaimed: false;
    rawAcceptedEndpointSamples: true;
    smoothingOrInterpolationApplied: false;
    numericalPeriod1Established: true;
    physiologicalAcceptanceEstablished: false;
    clinicalValidationClaimed: false;
  }>;
}>;

export type MainWireIntegratedPreviewSeedRunV1 = Readonly<{
  payload: MainWireIntegratedPreviewSeedRunPayloadV1;
  payloadSha256:
    typeof MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256;
}>;

let cachedSeed: MainWireIntegratedPreviewSeedRunV1 | null = null;

export async function loadMainWireIntegratedPreviewSeedRunV1():
Promise<MainWireIntegratedPreviewSeedRunV1> {
  if (cachedSeed !== null) return cachedSeed;
  if (
    await sha256TextHex(seedRunRawJson)
      !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_RAW_SHA256
  ) throw new Error("integrated preview seed raw-file SHA-256 mismatch");
  const parsed = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(
    JSON.parse(seedRunRawJson),
  );
  if (
    Object.keys(parsed).sort().join(",") !== "payload,payloadSha256"
    || parsed.payloadSha256
      !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256
    || typeof parsed.payload !== "object"
    || parsed.payload === null
    || await sha256CanonicalJsonHex(parsed.payload)
      !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256
  ) throw new Error("integrated preview seed payload SHA-256 mismatch");
  const payload = parsed.payload as unknown as
    MainWireIntegratedPreviewSeedRunPayloadV1;
  if (
    payload.artifactId !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ID
    || payload.schemaVersion !== 2
    || payload.role !== "release-bound-live-session-seed"
    || payload.simulationInputSpec.schemaId
      !== "circleheart-integrated-simulation-input-spec-v1"
    || payload.simulationInputSpec.modelAssembly
      !== "base+coronary-v3+dynamic-mcs+composed-rhythm-v2"
    || payload.simulationInputSpec.nominalDtSec !== 0.002
    || payload.sourceEvidence.classification.status !== "period1-converged"
    || payload.sourceEvidence.completedCycleCount !== 70
    || payload.displaySeed.terminalCycleTrace.samples.length !== 504
    || payload.startModelState.checkpointSha256
      !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_START_CHECKPOINT_SHA256
    || payload.terminalModelState.checkpointSha256
      !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_TERMINAL_CHECKPOINT_SHA256
    || payload.startModelState.schemaVersion !== 3
    || payload.terminalModelState.schemaVersion !== 3
    || payload.startModelState.acceptedTimeSec
      !== payload.displaySeed.terminalCycleTrace.startTimeSec
    || payload.terminalModelState.acceptedTimeSec
      !== payload.displaySeed.terminalCycleTrace.endTimeSec
    || payload.sourceEvidence.sourceArtifact.path
      !== MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH
    || payload.sourceEvidence.sourceArtifact.artifactSchemaVersion !== 4
    || payload.sourceEvidence.sourceArtifact.rawFileSha256
      !== MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_RAW_SHA256
    || payload.sourceEvidence.sourceArtifact.canonicalJsonSha256
      !== MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_CANONICAL_SHA256
  ) throw new Error("integrated preview seed identity is unsupported");
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const expectedFixedGlobalTotalBloodVolumeMl =
    fixture.fixedGlobalTotalBloodVolumeMl;
  if (
    payload.simulationInputSpec.fixedGlobalTotalBloodVolumeMl
      !== expectedFixedGlobalTotalBloodVolumeMl
    || payload.startModelState.coronary.baseCheckpointV2
      .fixedGlobalTotalBloodVolumeMl
      !== expectedFixedGlobalTotalBloodVolumeMl
    || payload.terminalModelState.coronary.baseCheckpointV2
      .fixedGlobalTotalBloodVolumeMl
      !== expectedFixedGlobalTotalBloodVolumeMl
  ) {
    throw new Error(
      "integrated preview seed fixed global blood volume differs from "
        + "the live model fixture",
    );
  }
  const currentProtocolIdentityHash =
    await mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
      fixture,
      {
        nominalDtSec: payload.simulationInputSpec.nominalDtSec,
        executionPurpose: payload.sourceEvidence.executionPurpose,
      },
    );
  if (
    currentProtocolIdentityHash
      !== payload.sourceEvidence.protocolIdentityHash
  ) {
    throw new Error(
      "integrated preview seed protocol identity differs from the live "
        + "model fixture",
    );
  }
  cachedSeed = parsed as unknown as MainWireIntegratedPreviewSeedRunV1;
  return cachedSeed;
}
