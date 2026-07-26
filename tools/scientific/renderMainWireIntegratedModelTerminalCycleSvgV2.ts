import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

import {
  renderMainWireIntegratedModelTerminalCycleTraceSvgV2,
  type MainWireIntegratedModelTerminalCycleClassificationContextV2,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelTerminalCycleSvgV2";

export function renderMainWireIntegratedModelTerminalCycleSvgCliV2(
  args: readonly string[] = process.argv.slice(2),
): Readonly<{ inputPath: string; outputPath: string }> {
  const inputPath = requiredPathArgument(args, "--input");
  const outputPath = requiredPathArgument(args, "--output");
  if (path.extname(outputPath).toLowerCase() !== ".svg") {
    throw new Error("--output must name an .svg file");
  }
  const parsed: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  const selected = selectTerminalCycleTrace(parsed);
  const svg = renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
    selected.trace,
    selected.classificationContext,
  );
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, svg, "utf8");
  return Object.freeze({ inputPath, outputPath });
}

/**
 * Accepts a serialized trace directly, a full exploration result, or the
 * terminalCycleExploration envelope used by scientific summary JSON. It does
 * not execute the numerical runtime.
 */
function selectTerminalCycleTrace(parsed: unknown): Readonly<{
  trace: unknown;
  classificationContext:
    MainWireIntegratedModelTerminalCycleClassificationContextV2;
}> {
  const root = asRecord(parsed);
  if (root === null) {
    return Object.freeze({
      trace: parsed,
      classificationContext: "unclassified" as const,
    });
  }
  if (root.terminalCycleTrace !== undefined) {
    return Object.freeze({
      trace: root.terminalCycleTrace,
      classificationContext: classificationContext(root),
    });
  }
  const exploration = asRecord(root.terminalCycleExploration);
  if (exploration?.terminalCycleTrace !== undefined) {
    return Object.freeze({
      trace: exploration.terminalCycleTrace,
      classificationContext: classificationContext(root),
    });
  }
  return Object.freeze({
    trace: parsed,
    classificationContext: "unclassified" as const,
  });
}

function classificationContext(
  root: Record<string, unknown>,
): MainWireIntegratedModelTerminalCycleClassificationContextV2 {
  const classification = asRecord(root.classification);
  if (classification === null) return "unclassified";
  const status = classification.status;
  if (status === "period1-converged"
    || status === "period2-suspect"
    || status === "not-converged") {
    return status;
  }
  throw new Error("input classification status is invalid");
}

function requiredPathArgument(args: readonly string[], flag: string): string {
  const index = args.indexOf(flag);
  const value = index < 0 ? undefined : args[index + 1];
  if (value === undefined || value.length === 0 || value.startsWith("--")) {
    throw new Error(`usage: --input trace.json --output trace.svg (missing ${flag})`);
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
  const rendered = renderMainWireIntegratedModelTerminalCycleSvgCliV2();
  process.stdout.write(`${JSON.stringify(rendered)}\n`);
}
