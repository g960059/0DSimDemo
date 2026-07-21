import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

import {
  describeMainWireIntegratedModelTerminalCycleMorphologyV2,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelTerminalCycleMorphologyV2";
import type {
  MainWireIntegratedModelTerminalCycleTraceV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";

export function describeMainWireIntegratedModelTerminalCycleMorphologyCliV2(
  args: readonly string[] = process.argv.slice(2),
): Readonly<{ inputPath: string; outputPath: string }> {
  const inputPath = requiredPathArgument(args, "--input");
  const outputPath = requiredPathArgument(args, "--output");
  if (path.extname(outputPath).toLowerCase() !== ".json") {
    throw new Error("--output must name a .json file");
  }
  const parsed: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  const trace = selectTerminalCycleTrace(parsed);
  const descriptor = describeMainWireIntegratedModelTerminalCycleMorphologyV2(
    trace as MainWireIntegratedModelTerminalCycleTraceV2,
  );
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(descriptor, null, 2)}\n`, "utf8");
  return Object.freeze({ inputPath, outputPath });
}

/** Selects a trace without executing or mutating the numerical runtime. */
function selectTerminalCycleTrace(parsed: unknown): unknown {
  const root = asRecord(parsed);
  if (root === null) return parsed;
  if (root.terminalCycleTrace !== undefined) return root.terminalCycleTrace;
  const exploration = asRecord(root.terminalCycleExploration);
  if (exploration?.terminalCycleTrace !== undefined) {
    return exploration.terminalCycleTrace;
  }
  return parsed;
}

function requiredPathArgument(args: readonly string[], flag: string): string {
  const index = args.indexOf(flag);
  const value = index < 0 ? undefined : args[index + 1];
  if (value === undefined || value.length === 0 || value.startsWith("--")) {
    throw new Error(
      `usage: --input result.json --output morphology.json (missing ${flag})`,
    );
  }
  return path.resolve(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  const described =
    describeMainWireIntegratedModelTerminalCycleMorphologyCliV2();
  process.stdout.write(`${JSON.stringify(described)}\n`);
}
