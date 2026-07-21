import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

import {
  runCoronaryV3LesionStructuralCmdDirectionalCharacterizationV1,
} from "@/engine/coronary/experiments/CoronaryV3LesionStructuralCmdDirectionalCharacterizationV1";

export const CORONARY_V3_LESION_STRUCTURAL_CMD_ARTIFACT_PATH_V1 =
  "artifacts/coronary-v3/lesion-structural-cmd-directional-v1.json" as const;

export function runCoronaryV3LesionStructuralCmdDirectionalCliV1(
  args: readonly string[] = process.argv.slice(2),
): Readonly<{
  characterizationId: string;
  outputPath: string;
  byteLength: number;
  numericalQaPassed: boolean;
  modelMechanismDirectionalChecksPassed: boolean;
  characterizationChecksPassed: boolean;
}> {
  const suppliedOutput = optionalArgument(args, "--output");
  const outputPath = path.resolve(
    suppliedOutput ?? CORONARY_V3_LESION_STRUCTURAL_CMD_ARTIFACT_PATH_V1,
  );
  if (path.extname(outputPath).toLowerCase() !== ".json") {
    throw new Error("--output must name a .json artifact");
  }
  const result =
    runCoronaryV3LesionStructuralCmdDirectionalCharacterizationV1();
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
  return Object.freeze({
    characterizationId: result.characterizationId,
    outputPath,
    byteLength: Buffer.byteLength(serialized),
    numericalQaPassed: result.numericalQaPassed,
    modelMechanismDirectionalChecksPassed:
      result.modelMechanismDirectionalChecksPassed,
    characterizationChecksPassed: result.characterizationChecksPassed,
  });
}

function optionalArgument(args: readonly string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (value === undefined || value.length === 0 || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  const summary = runCoronaryV3LesionStructuralCmdDirectionalCliV1();
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  if (!summary.characterizationChecksPassed) process.exitCode = 1;
}
