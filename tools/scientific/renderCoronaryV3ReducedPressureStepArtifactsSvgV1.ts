import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

import {
  renderCoronaryV3ReducedPressureStepArtifactsSvgV1,
} from "@/engine/coronary/diagnostics/CoronaryV3ReducedPressureStepArtifactSvgV1";

export const CORONARY_V3_REDUCED_PRESSURE_STEP_DIAGNOSTIC_SVG_PATH_V1 =
  "artifacts/coronary-v3/reduced-pressure-step-raw-diagnostic-v1.svg" as const;

export function renderCoronaryV3ReducedPressureStepArtifactsSvgCliV1(
  args: readonly string[] = process.argv.slice(2),
): Readonly<{
  v1InputPath: string;
  v2InputPath: string;
  outputPath: string;
}> {
  const v1InputPath = requiredPathArgument(args, "--v1-input");
  const v2InputPath = requiredPathArgument(args, "--v2-input");
  const outputPath = requiredPathArgument(args, "--output");
  if (path.extname(v1InputPath).toLowerCase() !== ".json"
    || path.extname(v2InputPath).toLowerCase() !== ".json") {
    throw new Error("--v1-input and --v2-input must name JSON artifacts");
  }
  if (path.extname(outputPath).toLowerCase() !== ".svg") {
    throw new Error("--output must name an .svg file");
  }

  // Parse and validate both complete inputs before creating or writing output.
  const v1Candidate: unknown = JSON.parse(readFileSync(v1InputPath, "utf8"));
  const v2Candidate: unknown = JSON.parse(readFileSync(v2InputPath, "utf8"));
  const svg = renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
    v1Candidate,
    v2Candidate,
  );
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, svg, "utf8");
  return Object.freeze({ v1InputPath, v2InputPath, outputPath });
}

function requiredPathArgument(args: readonly string[], flag: string): string {
  const index = args.indexOf(flag);
  const value = index < 0 ? undefined : args[index + 1];
  if (value === undefined || value.length === 0 || value.startsWith("--")) {
    throw new Error(
      `usage: --v1-input v1.json --v2-input v2.json --output diagnostic.svg (missing ${flag})`,
    );
  }
  return path.resolve(value);
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  const rendered = renderCoronaryV3ReducedPressureStepArtifactsSvgCliV1();
  process.stdout.write(`${JSON.stringify(rendered)}\n`);
}
