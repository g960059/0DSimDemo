import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

const ARTIFACT_ID =
  "circleheart-main-wire-integrated-preview-seed-run-v1" as const;
const DEFAULT_OUTPUT =
  "data/scientific/releases/integrated-preview-0.1.0/normal-sinus-periodic-seed-run-v1.json";

const sourcePath = requiredArgument("--source");
const outputPath = path.resolve(optionalArgument("--output") ?? DEFAULT_OUTPUT);
const source = JSON.parse(
  readFileSync(path.resolve(sourcePath), "utf8"),
) as Record<string, unknown>;
const terminalCycleTrace = requiredRecord(
  source.terminalCycleTrace,
  "source terminalCycleTrace",
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
  source.artifactSchemaVersion !== 3
  || source.executionPurpose !== "canonical-evidence"
  || source.numericalPeriod1Established !== true
  || source.terminalCheckpointExactRoundTripVerified !== true
  || classification.status !== "period1-converged"
  || !Array.isArray(terminalCycleTrace.samples)
  || terminalCycleTrace.samples.length === 0
  || terminalCheckpoint.schemaVersion !== 3
) {
  throw new Error("source is not the canonical integrated V3 P1 artifact");
}

const payload = Object.freeze({
  artifactId: ARTIFACT_ID,
  schemaVersion: 1 as const,
  role: "release-bound-live-session-seed" as const,
  simulationInputSpec: Object.freeze({
    schemaId: "circleheart-integrated-simulation-input-spec-v1" as const,
    schemaVersion: 1 as const,
    modelAssembly:
      "base+coronary-v3+dynamic-mcs+composed-rhythm-v2" as const,
    fixedGlobalTotalBloodVolumeMl: 5_600,
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
  modelState: terminalCheckpoint,
  claims: Object.freeze({
    exactCheckpointSeed: true as const,
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
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${canonicalJsonStringify(artifact)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify({
  artifactId: ARTIFACT_ID,
  outputPath,
  payloadSha256: artifact.payloadSha256,
  sampleCount: terminalCycleTrace.samples.length,
  checkpointSha256: terminalCheckpoint.checkpointSha256,
})}\n`);

function requiredArgument(name: string): string {
  const value = optionalArgument(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
}

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
