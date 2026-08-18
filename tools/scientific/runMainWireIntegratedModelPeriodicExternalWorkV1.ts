import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicExecutionPurposeV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

const executionPurpose = executionPurposeArgument();
const nominalDtSec = numericArgument("--dt", 0.002);
const maximumCycleCount = integerArgument(
  "--maximum-cycles",
  executionPurpose === "bounded-smoke"
    ? MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
      .boundedSmokeDefaultMaximumCycleCount
    : MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
      .defaultMaximumCycleCount,
);
const outputPath = optionalArgument("--output");

const result = await runMainWireIntegratedModelPeriodicSteadyV3({
  nominalDtSec,
  maximumCycleCount,
  executionPurpose,
});
const terminalCycleTraceSha256 = await sha256CanonicalJsonHex(
  result.terminalCycleTrace,
);
const artifact = Object.freeze({
  artifactSchemaVersion: 1 as const,
  artifactId:
    "main-wire-integrated-model-periodic-external-work-evidence-v1" as const,
  experimentId: result.experimentId,
  executionPurpose: result.executionPurpose,
  protocolIdentityHash: result.protocolIdentityHash,
  modelConditionIdentityId: result.modelConditionIdentityId,
  modelConditionIdentityHash: result.modelConditionIdentityHash,
  nominalDtSec: result.nominalDtSec,
  requestedMaximumCycleCount: result.requestedMaximumCycleCount,
  completedCycleCount: result.completedCycleCount,
  terminationReason: result.terminationReason,
  classification: result.classification,
  terminalCycleTraceSha256,
  terminalCycleTraceSampleCount: result.terminalCycleTrace.sampleCount,
  terminalPeriodicExternalWork: result.terminalPeriodicExternalWork,
  terminalCheckpointSha256: result.terminalCheckpoint.checkpointSha256,
  terminalCheckpointExactRoundTripVerified:
    result.terminalCheckpointExactRoundTripVerified,
  physiologicalValidationEstablished: false as const,
  clinicalValidationClaimed: false as const,
});
const serialized = `${canonicalJsonStringify(artifact)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(
    `${JSON.stringify({
      artifactId: artifact.artifactId,
      outputPath: absoluteOutputPath,
      byteLength: Buffer.byteLength(serialized),
      executionPurpose: artifact.executionPurpose,
      completedCycleCount: artifact.completedCycleCount,
      terminationReason: artifact.terminationReason,
      externalWorkStatus:
        artifact.terminalPeriodicExternalWork.status,
      lvExternalWorkMmHgMl:
        artifact.terminalPeriodicExternalWork.leftVentricle
          .externalWorkMmHgMl,
      rvExternalWorkMmHgMl:
        artifact.terminalPeriodicExternalWork.rightVentricle
          .externalWorkMmHgMl,
      terminalCycleTraceSha256,
      terminalCheckpointSha256: artifact.terminalCheckpointSha256,
    })}\n`,
  );
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

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be finite`);
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}

function executionPurposeArgument(): MainWireIntegratedModelPeriodicExecutionPurposeV3 {
  const value = optionalArgument("--execution-purpose") ?? "canonical-evidence";
  if (
    value !== "canonical-evidence" &&
    value !== "bounded-smoke" &&
    value !== "fixed-horizon-characterization"
  ) {
    throw new Error(
      "--execution-purpose must be canonical-evidence, bounded-smoke, or fixed-horizon-characterization",
    );
  }
  return value;
}
