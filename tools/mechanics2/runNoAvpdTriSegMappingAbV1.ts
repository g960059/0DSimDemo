import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import {
  runNoAvpdTriSegMappingAbBenchV1,
  type NoAvpdTriSegMappingAbBenchOptionsV1,
  type NoAvpdTriSegMappingAbBenchResultV1,
} from "@/engine/mechanics2/benches/NoAvpdTriSegMappingAbBenchV1";
import {
  summarizeNoAvpdTriSegMappingAbDiagnosticsV1,
  type NoAvpdTriSegMappingAbCandidateV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdTriSegMappingAbDiagnosticsV1";
import type { NoAvpdFourChamberHillTriSegParamsV1 } from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-triseg-mapping-ab-v1.json",
);

const MODEL_SOURCE_PATHS = [
  "engine/mechanics2/activation/LandFormCaTroponinActivationV1.ts",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2.ts",
  "engine/mechanics2/constitutive/HillCeSeeSlsV1.ts",
  "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
  "engine/mechanics2/geometry/TriSegGeometryV1.ts",
  "engine/mechanics2/solver/DampedNewtonV1.ts",
  "engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1.ts",
  "engine/mechanics2/valve/SmoothInertialValveV2.ts",
] as const;

const HARNESS_SOURCE_PATHS = [
  "engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1.ts",
  "engine/mechanics2/benches/NoAvpdTriSegMappingAbBenchV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdEventResolvedDiagnosticsV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdTriSegMappingAbDiagnosticsV1.ts",
  "tools/mechanics2/runNoAvpdTriSegMappingAbV1.ts",
] as const;

export const NO_AVPD_TRISEG_MAPPING_AB_ARTIFACT_ID_V1 =
  "no-avpd-triseg-mapping-ab-report-v1" as const;

export type NoAvpdTriSegMappingAbArtifactV1 = ReturnType<
  typeof buildNoAvpdTriSegMappingAbArtifactV1
>;

export function buildNoAvpdTriSegMappingAbArtifactV1(
  bench: NoAvpdTriSegMappingAbBenchResultV1,
  candidateEvidenceDirectory = "data/mechanics2/reports/no-avpd-triseg-mapping-ab-v1/candidates",
) {
  const diagnosticCandidates = bench.candidates.map(
    (candidate): NoAvpdTriSegMappingAbCandidateV1 => ({
      mappingMode: candidate.mappingMode,
      parameterSha256: sha256Json(candidate.params),
      nonMappingParameterSha256: sha256Json(
        parametersWithoutMapping(candidate.params),
      ),
      passiveReequilibration: candidate.passiveReequilibration,
      closedLoop: candidate.closedLoop,
    }),
  );
  const diagnostic =
    summarizeNoAvpdTriSegMappingAbDiagnosticsV1(diagnosticCandidates);
  const candidateEvidence = bench.candidates.map((candidate) => {
    const fileName = `${candidate.mappingMode}.json.gz`;
    return {
      mappingMode: candidate.mappingMode,
      mappingIdIncludedInStateAndParameters:
        candidate.params.triSegGeneralizedForceMapping ===
          candidate.mappingMode &&
        (candidate.closedLoopSourceReport === null ||
          candidate.closedLoopSourceReport.finalState
            .triSegGeneralizedForceMapping === candidate.mappingMode),
      sourceReportAvailability:
        candidate.closedLoopSourceReport === null
          ? ("unavailable-cold-start-exception" as const)
          : ("available" as const),
      compressedSourceReportPath:
        candidate.closedLoopSourceReport === null
          ? null
          : `${candidateEvidenceDirectory}/${fileName}`,
      completeSourceReportSha256:
        candidate.closedLoopSourceReport === null
          ? null
          : sha256Json(candidate.closedLoopSourceReport),
      completeSourceReportHashMethod:
        "sha256-of-canonical-compact-JSON-before-pretty-print-and-gzip" as const,
    };
  });
  const sourceFiles = [...MODEL_SOURCE_PATHS, ...HARNESS_SOURCE_PATHS].map(
    (path) => ({
      path,
      sha256: sha256Bytes(readFileSync(resolve(repoRoot, path))),
    }),
  );
  const implementationSha256 = hashSourcePaths(MODEL_SOURCE_PATHS);
  const harnessImplementationSha256 = hashHarnessSources(implementationSha256);
  const provenance = {
    deterministic: true as const,
    generatedAtIncluded: false as const,
    mappingIds: bench.candidates.map((candidate) => candidate.mappingMode),
    mappingIdPresentInEachParameterAndAvailableState: candidateEvidence.every(
      (candidate) => candidate.mappingIdIncludedInStateAndParameters,
    ),
    crossMappingWarmCheckpointUsed: false as const,
    coldStartFailureRetention:
      "candidate-remains-in-compact-artifact-even-when-source-report-is-unavailable" as const,
    completeReportTreatment:
      "one-gzip-json-per-candidate-when-cold-start-produces-a-bench-report" as const,
    compactArtifactTreatment:
      "passive-and-closed-loop-structural-numerical-summaries-no-waveform-imputation" as const,
    implementationSha256,
    harnessImplementationSha256,
    sourceFiles,
  };
  const body = {
    artifactId: NO_AVPD_TRISEG_MAPPING_AB_ARTIFACT_ID_V1,
    benchId: bench.benchId,
    protocol: bench.protocol,
    runOptions: bench.runOptions,
    diagnostic,
    candidateEvidence,
    provenance,
  };
  return {
    ...body,
    normalizedSha256: sha256Json(body),
  };
}

export function writeNoAvpdTriSegMappingAbArtifactV1(
  options: NoAvpdTriSegMappingAbBenchOptionsV1 = {},
  destinationPath = defaultOutputPath,
): NoAvpdTriSegMappingAbArtifactV1 {
  const bench = runNoAvpdTriSegMappingAbBenchV1(options);
  const destinationDirectory = dirname(destinationPath);
  const candidateEvidenceAbsoluteDirectory = resolve(
    destinationDirectory,
    "no-avpd-triseg-mapping-ab-v1/candidates",
  );
  const candidateEvidenceRelativeDirectory = normalizePath(
    relative(repoRoot, candidateEvidenceAbsoluteDirectory),
  );
  const artifact = buildNoAvpdTriSegMappingAbArtifactV1(
    bench,
    candidateEvidenceRelativeDirectory,
  );
  mkdirSync(candidateEvidenceAbsoluteDirectory, { recursive: true });
  for (const candidate of bench.candidates) {
    if (candidate.closedLoopSourceReport === null) continue;
    const destination = resolve(
      candidateEvidenceAbsoluteDirectory,
      `${candidate.mappingMode}.json.gz`,
    );
    writeBytesAtomically(
      destination,
      gzipSync(
        `${JSON.stringify(candidate.closedLoopSourceReport, null, 2)}\n`,
        { level: 9 },
      ),
    );
  }
  writeTextAtomically(
    destinationPath,
    `${JSON.stringify(artifact, null, 2)}\n`,
  );
  return artifact;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const beats = positiveIntegerArgument("--beats", 32);
  const dtSec = positiveNumberArgument("--dt", 0.005);
  const sampleEverySteps = positiveIntegerArgument("--sample-every", 1);
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  const startedAt = performance.now();
  const artifact = writeNoAvpdTriSegMappingAbArtifactV1(
    { beats, dtSec, sampleEverySteps },
    destinationPath,
  );
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-triseg-mapping-ab-report-written",
        outputPath: destinationPath,
        elapsedSec: (performance.now() - startedAt) / 1_000,
        runOptions: artifact.runOptions,
        parameterIsolation: artifact.diagnostic.parameterIsolation,
        mappingClosureVerification:
          artifact.diagnostic.mappingClosureVerification,
        passiveComparison: artifact.diagnostic.passiveComparison,
        closedLoopComparison: artifact.diagnostic.closedLoopComparison,
        interpretation: artifact.diagnostic.interpretation,
        candidateEvidence: artifact.candidateEvidence,
        normalizedSha256: artifact.normalizedSha256,
      },
      null,
      2,
    ),
  );
  if (
    !artifact.diagnostic.parameterIsolation.nonMappingParametersIdentical ||
    !artifact.provenance.mappingIdPresentInEachParameterAndAvailableState
  ) {
    process.exitCode = 1;
  }
}

function parametersWithoutMapping(params: NoAvpdFourChamberHillTriSegParamsV1) {
  const { triSegGeneralizedForceMapping: _mapping, ...rest } = params;
  return rest;
}

function hashSourcePaths(paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const path of paths) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function hashHarnessSources(implementationSha256: string): string {
  const hash = createHash("sha256");
  hash.update("component-implementation-sha256");
  hash.update("\0");
  hash.update(implementationSha256);
  hash.update("\0");
  for (const path of HARNESS_SOURCE_PATHS) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function writeTextAtomically(path: string, value: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, value);
  renameSync(temporaryPath, path);
}

function writeBytesAtomically(path: string, value: Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, value);
  renameSync(temporaryPath, path);
}

function normalizePath(path: string): string {
  return path.split("\\").join("/");
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

function positiveIntegerArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be followed by a positive integer`);
  }
  return value;
}

function positiveNumberArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} must be followed by a positive finite number`);
  }
  return value;
}
