import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireIntegratedModelTbvAttributionV1,
  type MainWireIntegratedModelTbvAttributionExecutionPurposeV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTbvAttributionV1";

const executionPurpose: MainWireIntegratedModelTbvAttributionExecutionPurposeV1 =
  process.argv.includes("--bounded-smoke")
    ? "bounded-smoke"
    : "primary-attribution-evidence";
const maximumCycleCount = optionalIntegerArgument("--maximum-cycles");
const outputPath = optionalArgument("--output");

const result = await runMainWireIntegratedModelTbvAttributionV1({
  executionPurpose,
  ...(maximumCycleCount === null ? {} : { maximumCycleCount }),
});
const artifact = Object.freeze({
  artifactSchemaVersion: 1 as const,
  generatedBy:
    "tools/scientific/runMainWireIntegratedModelTbvAttributionV1.ts" as const,
  ...result,
});
const serialized = `${JSON.stringify(artifact, null, 2)}\n`;

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
      primaryAttributionNumericallyEstablished:
        result.primaryAttributionNumericallyEstablished,
      arms: Object.fromEntries(
        result.armOrder.map((armId) => [
          armId,
          {
            completedCycleCount:
              result.arms[armId].numerics.completedCycleCount,
            classificationStatus:
              result.arms[armId].numerics.classificationStatus,
            terminalPeriod1MaximumNormalizedDelta:
              result.arms[armId].numerics.terminalPeriod1MaximumNormalizedDelta,
          },
        ]),
      ),
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
  const value = optionalArgument(name);
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${name} must be a safe integer`);
  }
  return parsed;
}
