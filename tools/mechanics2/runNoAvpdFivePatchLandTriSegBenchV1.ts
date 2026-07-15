import { randomUUID } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  runNoAvpdFivePatchLandTriSegBenchV1,
  type NoAvpdFivePatchLandBenchOptionsV1,
  type NoAvpdFivePatchLandBenchResultV1,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchLandTriSegBenchV1";
import type { NoAvpdFivePatchLandSlsVariantV1 } from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

export type NoAvpdFivePatchLandTriSegCliOptionsV1 = {
  readonly bench: NoAvpdFivePatchLandBenchOptionsV1;
  readonly outputPath: string | null;
};

export function parseNoAvpdFivePatchLandTriSegCliArgsV1(
  args: readonly string[],
): NoAvpdFivePatchLandTriSegCliOptionsV1 {
  let beats: number | undefined;
  let dtSec: number | undefined;
  let slsVariant: NoAvpdFivePatchLandSlsVariantV1 | undefined;
  let outputPath: string | null = null;
  let returnMapTolerance: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "--help" || arg === "-h") {
      throw new Error(usageText());
    }
    const value = args[index + 1];
    switch (arg) {
      case "--beats":
        beats = parseNumber(value, arg);
        index += 1;
        break;
      case "--dt":
        dtSec = parseNumber(value, arg);
        index += 1;
        break;
      case "--sls":
        if (
          value !== "off" &&
          value !== "atrial-only" &&
          value !== "all-patch"
        ) {
          throw new Error("--sls must be one of: off, atrial-only, all-patch");
        }
        slsVariant = value;
        index += 1;
        break;
      case "--output":
        if (value == null || value.trim() === "") {
          throw new Error("--output requires a non-empty path");
        }
        outputPath = resolve(value);
        index += 1;
        break;
      case "--return-map-tolerance":
        returnMapTolerance = parseNumber(value, arg);
        index += 1;
        break;
      default:
        throw new Error(`unknown argument: ${arg}\n${usageText()}`);
    }
  }

  return Object.freeze({
    bench: Object.freeze({
      ...(beats == null ? {} : { beats }),
      ...(dtSec == null ? {} : { dtSec }),
      ...(slsVariant == null ? {} : { slsVariant }),
      ...(returnMapTolerance == null
        ? {}
        : {
            fullStateReturnMapMaxAbsDimensionlessTolerance: returnMapTolerance,
          }),
    }),
    outputPath,
  });
}

export function runNoAvpdFivePatchLandTriSegCliV1(
  args: readonly string[] = process.argv.slice(2),
): NoAvpdFivePatchLandBenchResultV1 {
  const options = parseNoAvpdFivePatchLandTriSegCliArgsV1(args);
  const startTimeMs = performance.now();
  const result = runNoAvpdFivePatchLandTriSegBenchV1(options.bench);
  const elapsedSec = (performance.now() - startTimeMs) / 1_000;
  if (options.outputPath != null) {
    writeJsonAtomically(
      options.outputPath,
      `${JSON.stringify(result, null, 2)}\n`,
    );
  }
  process.stdout.write(
    `${JSON.stringify({
      status: result.status,
      failureReason: result.failureReason,
      outputPath: options.outputPath,
      stepsAccepted: result.stepsAccepted,
      stepsAttempted: result.stepsAttempted,
      slsVariant: result.protocol.slsVariant,
      maximumGlobalScaledResidual:
        result.hardDiagnostics.maximumGlobalScaledResidual,
      maximumTriSegRelativeResidual:
        result.hardDiagnostics.maximumTriSegRelativeResidual,
      elapsedSec,
    })}\n`,
  );
  return result;
}

function writeJsonAtomically(destinationPath: string, body: string): void {
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, body, "utf8");
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function parseNumber(value: string | undefined, option: string): number {
  if (value == null) throw new Error(`${option} requires a value`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${option} must be finite`);
  }
  return parsed;
}

function usageText(): string {
  return [
    "Usage: vite-node --script tools/mechanics2/runNoAvpdFivePatchLandTriSegBenchV1.ts [options]",
    "  --beats <integer>=1",
    "  --dt <seconds>",
    "  --sls <off|atrial-only|all-patch>",
    "  --return-map-tolerance <nonnegative-number>  (optional hard gate)",
    "  --output <json-path>                         (full report; stdout is always a compact summary)",
  ].join("\n");
}

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    const result = runNoAvpdFivePatchLandTriSegCliV1();
    process.exitCode = result.status === "pass" ? 0 : 1;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
