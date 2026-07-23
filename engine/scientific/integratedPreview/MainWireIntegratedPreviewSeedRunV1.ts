import seedRunRawJson from
  "@/data/scientific/releases/integrated-preview-0.1.0/normal-sinus-periodic-seed-run-v1.json?raw";
import type {
  MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import type {
  MainWireIntegratedModelHealthyReferenceProjectionV3,
  MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireIntegratedModelPeriodicClassificationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_PAYLOAD_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_RAW_SHA256,
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
  schemaVersion: 1;
  role: "release-bound-live-session-seed";
  simulationInputSpec: MainWireIntegratedPreviewSeedInputSpecV1;
  sourceEvidence: Readonly<{
    experimentId: string;
    executionPurpose: "canonical-evidence";
    protocolIdentityHash: string;
    completedCycleCount: 70;
    classification: MainWireIntegratedModelPeriodicClassificationV3;
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
  modelState: MainWireIntegratedModelCheckpointV3;
  claims: Readonly<{
    exactCheckpointSeed: true;
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
    || payload.schemaVersion !== 1
    || payload.role !== "release-bound-live-session-seed"
    || payload.simulationInputSpec.schemaId
      !== "circleheart-integrated-simulation-input-spec-v1"
    || payload.simulationInputSpec.modelAssembly
      !== "base+coronary-v3+dynamic-mcs+composed-rhythm-v2"
    || payload.simulationInputSpec.nominalDtSec !== 0.002
    || payload.sourceEvidence.classification.status !== "period1-converged"
    || payload.sourceEvidence.completedCycleCount !== 70
    || payload.displaySeed.terminalCycleTrace.samples.length !== 504
    || payload.modelState.checkpointSha256
      !== MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256
    || payload.modelState.schemaVersion !== 3
  ) throw new Error("integrated preview seed identity is unsupported");
  cachedSeed = parsed as unknown as MainWireIntegratedPreviewSeedRunV1;
  return cachedSeed;
}
