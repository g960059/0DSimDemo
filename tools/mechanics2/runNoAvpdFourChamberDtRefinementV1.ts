import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runNoAvpdFourChamberHillTriSegBenchV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  buildNoAvpdDtRefinementDiagnosticsV1,
  type NoAvpdDtRefinementDiagnosticsV1,
  type NoAvpdDtRefinementSourceRunV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdDtRefinementDiagnosticsV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";
import {
  currentHarnessImplementationSha256,
  currentImplementationSha256,
} from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

export const NO_AVPD_DT_REFINEMENT_ARTIFACT_ID_V1 =
  "no-avpd-four-chamber-hill-triseg-dt-refinement-artifact-v1" as const;

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-four-chamber-hill-triseg-dt-refinement-v1.json",
);

const DIAGNOSTICS_SOURCE_PATHS = [
  "engine/mechanics2/diagnostics/NoAvpdDtRefinementDiagnosticsV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdEventResolvedDiagnosticsV1.ts",
  "tools/mechanics2/runNoAvpdFourChamberDtRefinementV1.ts",
] as const;

export type NoAvpdDtRefinementArtifactV1 = {
  readonly artifactId: typeof NO_AVPD_DT_REFINEMENT_ARTIFACT_ID_V1;
  readonly statusScope: "report-only-diagnostic-bundle";
  readonly runDefinition: {
    readonly initialization: "independent-cold-start-per-time-step";
    readonly beatsPerRun: number;
    readonly requestedStepsPerCycle: readonly number[];
    readonly sampleEveryAcceptedSteps: 1;
    readonly sampleRetention: "last-two-complete-beats";
    readonly parameterChangesAcrossRuns: false;
    readonly waveformInterpolationForComparison: false;
  };
  readonly diagnosticsImplementationSha256: string;
  readonly diagnostics: NoAvpdDtRefinementDiagnosticsV1;
  readonly normalizedSha256: string;
};

export function runNoAvpdFourChamberDtRefinementV1(options: {
  readonly beats: number;
  readonly stepsPerCycle: readonly number[];
}): Omit<NoAvpdDtRefinementArtifactV1, "normalizedSha256"> {
  if (!Number.isInteger(options.beats) || options.beats < 3) {
    throw new Error("beats must be an integer of at least three for an observed two-cycle event window");
  }
  if (options.stepsPerCycle.length < 2) {
    throw new Error("at least two steps-per-cycle values are required");
  }
  const params = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  const parameterSha256 = sha256Json(params);
  const initialStateSha256 = sha256Json(initialNoAvpdFourChamberHillTriSegStateV1(params));
  const implementationSha256 = currentImplementationSha256();
  const harnessImplementationSha256 = currentHarnessImplementationSha256();
  const sourceRuns: NoAvpdDtRefinementSourceRunV1[] = [];
  for (const stepsPerCycle of options.stepsPerCycle) {
    if (!Number.isInteger(stepsPerCycle) || stepsPerCycle <= 0) {
      throw new Error("steps-per-cycle values must be positive integers");
    }
    const dtSec = params.cycleLengthSec / stepsPerCycle;
    const startedAt = performance.now();
    const result = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: options.beats,
      dtSec,
      sampleEverySteps: 1,
      sampleRetention: "last-two-complete-beats",
      params,
    });
    const elapsedSec = (performance.now() - startedAt) / 1_000;
    console.log(JSON.stringify({
      stage: "dt-run-complete",
      stepsPerCycle,
      dtSec,
      elapsedSec,
      status: result.status,
      failureReason: result.failureReason,
      beatsCompleted: result.beatsCompleted,
      oneBeatNormalizedMax:
        result.reportOnlyExactBeatBoundaryReturnMap.oneBeatMapResidual
          ?.normalizedFullStateDrift.maxAbsDimensionless ?? null,
    }));
    if (result.status !== "pass") {
      throw new Error(`N=${stepsPerCycle} failed: ${result.failureReason ?? "unknown"}`);
    }
    sourceRuns.push({
      result,
      parameterSha256,
      initialStateSha256,
      implementationSha256,
      harnessImplementationSha256,
      sourceRunSha256: sha256Json(result),
    });
  }
  return {
    artifactId: NO_AVPD_DT_REFINEMENT_ARTIFACT_ID_V1,
    statusScope: "report-only-diagnostic-bundle",
    runDefinition: {
      initialization: "independent-cold-start-per-time-step",
      beatsPerRun: options.beats,
      requestedStepsPerCycle: options.stepsPerCycle.slice(),
      sampleEveryAcceptedSteps: 1,
      sampleRetention: "last-two-complete-beats",
      parameterChangesAcrossRuns: false,
      waveformInterpolationForComparison: false,
    },
    diagnosticsImplementationSha256: diagnosticsImplementationSha256(),
    diagnostics: buildNoAvpdDtRefinementDiagnosticsV1(sourceRuns),
  };
}

export function writeNoAvpdFourChamberDtRefinementV1(
  options: { readonly beats: number; readonly stepsPerCycle: readonly number[] },
  destinationPath = defaultOutputPath,
): NoAvpdDtRefinementArtifactV1 {
  const body = runNoAvpdFourChamberDtRefinementV1(options);
  const normalizedSha256 = sha256Json(body);
  const artifact = { ...body, normalizedSha256 };
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(artifact, null, 2)}\n`);
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const beats = integerArgument("--beats", 32);
  const stepsPerCycle = integerListArgument("--steps-per-cycle", [200, 400, 800]);
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  const startedAt = performance.now();
  const artifact = writeNoAvpdFourChamberDtRefinementV1(
    { beats, stepsPerCycle },
    destinationPath,
  );
  console.log(JSON.stringify({
    stage: "dt-refinement-artifact-written",
    outputPath: destinationPath,
    elapsedSec: (performance.now() - startedAt) / 1_000,
    normalizedSha256: artifact.normalizedSha256,
    diagnosticsImplementationSha256: artifact.diagnosticsImplementationSha256,
    runs: artifact.diagnostics.runs.map((run) => ({
      stepsPerCycle: run.stepsPerCycle,
      dtSec: run.dtSec,
      rawEndpointSampleCount: run.rawEndpointSampleCount,
      oneBeatNormalizedMax:
        run.exactReturnMap.oneBeatMapResidual?.normalizedFullStateDrift
          .maxAbsDimensionless ?? null,
    })),
  }, null, 2));
}

function diagnosticsImplementationSha256(): string {
  const hash = createHash("sha256");
  for (const relativePath of DIAGNOSTICS_SOURCE_PATHS) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function integerArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be followed by a positive integer`);
  }
  return value;
}

function integerListArgument(flag: string, fallback: readonly number[]): readonly number[] {
  const raw = stringArgument(flag);
  if (raw === null) return fallback;
  const values = raw.split(",").map((part) => Number(part.trim()));
  if (values.length < 2 || values.some((value) => !Number.isInteger(value) || value <= 0)) {
    throw new Error(`${flag} must be a comma-separated list of positive integers`);
  }
  return values;
}

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--") || value.length === 0) {
    throw new Error(`${flag} must be followed by a value`);
  }
  return value;
}
