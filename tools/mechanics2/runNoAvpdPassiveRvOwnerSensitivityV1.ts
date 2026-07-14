import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runNoAvpdPassiveRvOwnerSensitivityBenchV1,
  type NoAvpdPassiveRvOwnerCandidateReportV1,
  type NoAvpdPassiveRvOwnerSensitivityReportV1,
} from "@/engine/mechanics2/benches/NoAvpdPassiveRvOwnerSensitivityBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-passive-rv-owner-sensitivity-v1.json",
);

const MODEL_SOURCE_PATHS = [
  "engine/mechanics2/constitutive/HillCeSeeSlsV1.ts",
  "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
  "engine/mechanics2/geometry/TriSegGeometryV1.ts",
  "engine/mechanics2/solver/DampedNewtonV1.ts",
  "engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1.ts",
] as const;

const HARNESS_SOURCE_PATHS = [
  "engine/mechanics2/benches/NoAvpdPassiveLvEdpvrBenchV1.ts",
  "engine/mechanics2/benches/NoAvpdPassiveRvOwnerSensitivityBenchV1.ts",
  "tools/mechanics2/runNoAvpdPassiveRvOwnerSensitivityV1.ts",
] as const;

export const NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_ARTIFACT_ID_V1 =
  "no-avpd-passive-rv-owner-sensitivity-report-v1" as const;

export type NoAvpdPassiveRvOwnerSensitivityArtifactV1 = ReturnType<
  typeof buildNoAvpdPassiveRvOwnerSensitivityArtifactV1
>;

export function buildNoAvpdPassiveRvOwnerSensitivityArtifactV1(
  benchReport: NoAvpdPassiveRvOwnerSensitivityReportV1 = runNoAvpdPassiveRvOwnerSensitivityBenchV1(),
) {
  const families = benchReport.families.map((family) => ({
    declaration: family.declaration,
    candidates: family.candidates.map(candidateWithHashes),
  }));
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
    protocolSha256: sha256Json(benchReport.protocol),
    implementationSha256,
    harnessImplementationSha256,
    sourceFiles,
    candidateHashTreatment:
      "each-candidate-hashes-declaration-effective-parameters-and-complete-raw-edpvr-report" as const,
    rawPointTreatment:
      "full-independent-lv-volume-grid-no-smoothing-no-decimation" as const,
    familyComparisonBoundary:
      "compare-within-declared-one-factor-family-only-no-cross-family-ranking" as const,
    duplicateReferenceTreatment:
      "identical-effective-input-family-references-share-one-bench-execution-but-remain-separate-declarations-and-candidate-hashes" as const,
    completenessBoundary:
      "all-candidate-points-available-is-a-structural-artifact-completeness-check-not-a-physiology-gate" as const,
  };
  const body = {
    artifactId: NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_ARTIFACT_ID_V1,
    protocol: benchReport.protocol,
    families,
    summary: benchReport.summary,
    provenance,
  };
  return {
    ...body,
    normalizedSha256: sha256Json(body),
  };
}

export function writeNoAvpdPassiveRvOwnerSensitivityReportV1(
  destinationPath = defaultOutputPath,
): NoAvpdPassiveRvOwnerSensitivityArtifactV1 {
  const artifact = buildNoAvpdPassiveRvOwnerSensitivityArtifactV1();
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(artifact, null, 2)}\n`);
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  const artifact =
    writeNoAvpdPassiveRvOwnerSensitivityReportV1(destinationPath);
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-passive-rv-owner-sensitivity-report-written",
        outputPath: destinationPath,
        summary: artifact.summary,
        rootAvailability: artifact.families.map((family) => ({
          familyId: family.declaration.familyId,
          candidates: family.candidates.map((candidate) => ({
            candidateId: candidate.declaration.candidateId,
            rootAvailability: candidate.summary.rootAvailability,
          })),
        })),
        provenance: artifact.provenance,
        normalizedSha256: artifact.normalizedSha256,
      },
      null,
      2,
    ),
  );
  if (!artifact.summary.allCandidatePointsAvailable) process.exitCode = 1;
}

function candidateWithHashes(candidate: NoAvpdPassiveRvOwnerCandidateReportV1) {
  const body = {
    declaration: candidate.declaration,
    effectiveInputs: candidate.effectiveInputs,
    edpvr: candidate.edpvr,
    summary: candidate.summary,
  };
  return {
    ...body,
    hashes: {
      declarationSha256: sha256Json(candidate.declaration),
      effectiveParameterSha256: sha256Json({
        boundary: candidate.edpvr.boundary,
        model: candidate.edpvr.parameterSnapshot,
      }),
      completeCandidateReportSha256: sha256Json(body),
    },
  };
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

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--") || value.length === 0) {
    throw new Error(`${flag} must be followed by a value`);
  }
  return value;
}
