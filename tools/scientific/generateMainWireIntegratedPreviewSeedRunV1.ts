import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ARTIFACT_PATH,
} from "@/engine/scientific/assembly/mainWireAdultFiveWallIntegratedPreviewReleaseV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
  sha256TextHex,
} from "@/engine/scientific/release";

const ARTIFACT_ID =
  "circleheart-main-wire-integrated-preview-seed-run-v1" as const;
const DEFAULT_SOURCE =
  MAIN_WIRE_INTEGRATED_PREVIEW_PERIODIC_SOURCE_V3_ARTIFACT_PATH;
const DEFAULT_OUTPUT =
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_RUN_V1_ARTIFACT_PATH;

const check = process.argv.includes("--check");
const sourcePath = path.resolve(optionalArgument("--source") ?? DEFAULT_SOURCE);
const outputPath = path.resolve(optionalArgument("--output") ?? DEFAULT_OUTPUT);
const portableSourcePath = portableRepositoryPath(sourcePath);
const sourceRaw = readFileSync(sourcePath, "utf8");
const source = JSON.parse(
  sourceRaw,
) as Record<string, unknown>;
const terminalCycleTrace = requiredRecord(
  source.terminalCycleTrace,
  "source terminalCycleTrace",
);
const terminalCycleStartCheckpoint = requiredRecord(
  source.terminalCycleStartCheckpoint,
  "source terminalCycleStartCheckpoint",
);
const terminalCheckpoint = requiredRecord(
  source.terminalCheckpoint,
  "source terminalCheckpoint",
);
const classification = requiredRecord(
  source.classification,
  "source classification",
);
if (
  source.artifactSchemaVersion !== 4
  || source.executionPurpose !== "canonical-evidence"
  || source.numericalPeriod1Established !== true
  || source.fixedGlobalTotalBloodVolumeMl !== 5_600
  || source.terminalCheckpointExactRoundTripVerified !== true
  || classification.status !== "period1-converged"
  || !Array.isArray(terminalCycleTrace.samples)
  || terminalCycleTrace.samples.length === 0
  || terminalCycleStartCheckpoint.schemaVersion !== 3
  || terminalCheckpoint.schemaVersion !== 3
  || terminalCycleStartCheckpoint.acceptedTimeSec
    !== terminalCycleTrace.startTimeSec
  || terminalCheckpoint.acceptedTimeSec !== terminalCycleTrace.endTimeSec
) {
  throw new Error("source is not the canonical integrated V3 P1 artifact");
}

const [sourceRawFileSha256, sourceCanonicalJsonSha256] = await Promise.all([
  sha256TextHex(sourceRaw),
  sha256CanonicalJsonHex(source),
]);
const payload = Object.freeze({
  artifactId: ARTIFACT_ID,
  schemaVersion: 2 as const,
  role: "release-bound-live-session-seed" as const,
  simulationInputSpec: Object.freeze({
    schemaId: "circleheart-integrated-simulation-input-spec-v1" as const,
    schemaVersion: 1 as const,
    modelAssembly:
      "base+coronary-v3+dynamic-mcs+composed-rhythm-v2" as const,
    fixedGlobalTotalBloodVolumeMl: source.fixedGlobalTotalBloodVolumeMl,
    rhythm: Object.freeze({
      presetId: "composed-regular-sinus-60-v1" as const,
      heartRateBpm: 60,
      cycleLengthSec: 1,
      externalAfOwnerIncluded: false as const,
    }),
    mechanicalSupport: Object.freeze({
      presetId: "all-off" as const,
      activeDeviceIds: Object.freeze([]),
    }),
    nominalDtSec: source.nominalDtSec,
  }),
  sourceEvidence: Object.freeze({
    experimentId: source.experimentId,
    executionPurpose: source.executionPurpose,
    protocolIdentityHash: source.protocolIdentityHash,
    completedCycleCount: source.completedCycleCount,
    classification,
    sourceArtifact: Object.freeze({
      path: portableSourcePath,
      artifactSchemaVersion: 4 as const,
      rawFileSha256: sourceRawFileSha256,
      canonicalJsonSha256: sourceCanonicalJsonSha256,
    }),
    numericalPeriod1Established: true as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    terminalCheckpointExactRoundTripVerified: true as const,
  }),
  displaySeed: Object.freeze({
    terminalCycleTrace,
    terminalHealthyReferenceProjection:
      source.terminalHealthyReferenceProjection,
  }),
  startModelState: terminalCycleStartCheckpoint,
  terminalModelState: terminalCheckpoint,
  claims: Object.freeze({
    exactTerminalCycleStartCheckpointIncluded: true as const,
    exactTerminalCycleEndCheckpointIncluded: true as const,
    stateTransitionInputIdentitiesIncluded: true as const,
    executableBuildProvenanceAttached: false as const,
    standaloneReplayCompleteArtifactClaimed: false as const,
    rawAcceptedEndpointSamples: true as const,
    smoothingOrInterpolationApplied: false as const,
    numericalPeriod1Established: true as const,
    physiologicalAcceptanceEstablished: false as const,
    clinicalValidationClaimed: false as const,
  }),
});
const artifact = Object.freeze({
  payload,
  payloadSha256: await sha256CanonicalJsonHex(payload),
});
const serialized = `${canonicalJsonStringify(artifact)}\n`;
if (check) {
  if (readFileSync(outputPath, "utf8") !== serialized) {
    throw new Error("checked-in integrated preview seed artifact differs");
  }
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
}
process.stdout.write(`${JSON.stringify({
  artifactId: ARTIFACT_ID,
  sourcePath: portableSourcePath,
  sourceRawFileSha256,
  sourceCanonicalJsonSha256,
  outputPath,
  payloadSha256: artifact.payloadSha256,
  sampleCount: terminalCycleTrace.samples.length,
  startCheckpointSha256: terminalCycleStartCheckpoint.checkpointSha256,
  terminalCheckpointSha256: terminalCheckpoint.checkpointSha256,
  check,
})}\n`);

function optionalArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function requiredRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function portableRepositoryPath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath);
  if (
    relative.length === 0
    || relative === ".."
    || relative.startsWith(`..${path.sep}`)
    || path.isAbsolute(relative)
  ) {
    throw new Error("source evidence must be a file inside the repository");
  }
  return relative.split(path.sep).join("/");
}
