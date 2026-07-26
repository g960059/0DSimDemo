import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID,
  renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelPeriodicSteadyArtifactSvgV3";

export function renderMainWireIntegratedModelPeriodicSteadyArtifactSvgCliV3(
  args: readonly string[] = process.argv.slice(2),
): Readonly<{
  artifactId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID;
  inputPath: string;
  outputPath: string;
  byteLength: number;
}> {
  const inputPath = requiredPathArgument(args, "--input");
  const outputPath = requiredPathArgument(args, "--output");
  if (path.extname(outputPath).toLowerCase() !== ".svg") {
    throw new Error("--output must name an .svg file");
  }
  const parsed: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  const svg = renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(parsed);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, svg, "utf8");
  return Object.freeze({
    artifactId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID,
    inputPath,
    outputPath,
    byteLength: Buffer.byteLength(svg),
  });
}

function requiredPathArgument(args: readonly string[], flag: string): string {
  const index = args.indexOf(flag);
  const value = index < 0 ? undefined : args[index + 1];
  if (value === undefined || value.length === 0 || value.startsWith("--")) {
    throw new Error(
      `usage: --input periodic-v3.json --output periodic-v3.svg (missing ${flag})`,
    );
  }
  return path.resolve(value);
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  const rendered =
    renderMainWireIntegratedModelPeriodicSteadyArtifactSvgCliV3();
  process.stdout.write(`${JSON.stringify(rendered)}\n`);
}
