import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireIntegratedModelPulmonaryWaveformAuditV1,
  type MainWireIntegratedModelPulmonaryWaveformAuditExecutionPurposeV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPulmonaryWaveformAuditV1";

const executionPurpose = executionPurposeArgument();
const maximumCycleCount = optionalIntegerArgument("--maximum-cycles");
const outputPath = optionalArgument("--output");
const result = await runMainWireIntegratedModelPulmonaryWaveformAuditV1({
  executionPurpose,
  ...(maximumCycleCount === null ? {} : { maximumCycleCount }),
});
const serialized = `${JSON.stringify(result, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(
    `${JSON.stringify({
      experimentId: result.experimentId,
      outputPath: absoluteOutputPath,
      byteLength: Buffer.byteLength(serialized),
      executionPurpose: result.executionPurpose,
      completedCycleCount: result.completedCycleCount,
      classificationStatus: result.classificationStatus,
      primaryMechanismAttributionEstablished:
        result.primaryMechanismAttributionEstablished,
      attributionClassification:
        result.diagnostics.attributionClassification,
      protocolIdentityHash: result.protocolIdentityHash,
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

function optionalIntegerArgument(name: string): number | null {
  const raw = optionalArgument(name);
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
}

function executionPurposeArgument():
MainWireIntegratedModelPulmonaryWaveformAuditExecutionPurposeV1 {
  const value = optionalArgument("--execution-purpose") ??
    "primary-mechanism-audit";
  if (
    value !== "primary-mechanism-audit" &&
    value !== "bounded-smoke"
  ) {
    throw new Error(
      "--execution-purpose must be primary-mechanism-audit or bounded-smoke",
    );
  }
  return value;
}
