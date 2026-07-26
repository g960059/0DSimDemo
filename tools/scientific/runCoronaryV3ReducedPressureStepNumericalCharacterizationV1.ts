import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runCoronaryV3ReducedPressureStepNumericalCharacterizationV1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV1";

const outputPath = optionalArgument("--output");
const result = runCoronaryV3ReducedPressureStepNumericalCharacterizationV1();
const serialized = `${JSON.stringify(result, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({
    characterizationId: result.characterizationId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    coarseDtSec: result.coarse.dtSec,
    fineDtSec: result.fine.dtSec,
    numericalQaPassed: result.numericalQaPassed,
    biologicalValidationEstablished:
      result.biologicalValidationEstablished,
    physiologicalAcceptanceEstablished:
      result.physiologicalAcceptanceEstablished,
  })}\n`);
}

if (!result.numericalQaPassed) process.exitCode = 1;

function optionalArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
