import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runNoAvpdPassiveLvEdpvrBenchV1,
  type NoAvpdPassiveLvEdpvrReportV1,
} from "@/engine/mechanics2/benches/NoAvpdPassiveLvEdpvrBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-passive-lv-edpvr-v1.json",
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
  "tools/mechanics2/runNoAvpdPassiveLvEdpvrV1.ts",
] as const;

export const NO_AVPD_PASSIVE_LV_EDPVR_ARTIFACT_ID_V1 =
  "no-avpd-passive-lv-edpvr-report-v1" as const;

export type NoAvpdPassiveLvEdpvrArtifactV1 = ReturnType<
  typeof buildNoAvpdPassiveLvEdpvrArtifactV1
>;

export function buildNoAvpdPassiveLvEdpvrArtifactV1(
  benchReport: NoAvpdPassiveLvEdpvrReportV1 = runNoAvpdPassiveLvEdpvrBenchV1(),
) {
  const parameters = {
    boundary: benchReport.boundary,
    model: benchReport.parameterSnapshot,
  };
  const availablePoints = benchReport.points.filter(
    (point) => point.status === "available",
  );
  const rvSearchUpperMl = benchReport.boundary.rvVolumeSearchMl[1];
  const highRvVolumeWarningThresholdMl = 0.75 * rvSearchUpperMl;
  const highRvPoints = availablePoints.filter(
    (point) => point.rvVolumeMl >= highRvVolumeWarningThresholdMl,
  );
  const maximumRequiredRvVolumeMl =
    availablePoints.length === 0
      ? null
      : Math.max(...availablePoints.map((point) => point.rvVolumeMl));
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
    parameterSha256: sha256Json(parameters),
    implementationSha256,
    harnessImplementationSha256,
    sourceFiles,
    rawPointTreatment:
      "all-independent-volume-equilibrium-points-no-smoothing-no-decimation" as const,
    derivativeTreatment:
      "bench-centered-secant-values-no-renderer-recalculation" as const,
  };
  const summary = {
    ...benchReport.summary,
    maximumRequiredRvVolumeMl,
    maximumAbsoluteRvPressureTargetResidualMmHg:
      availablePoints.length === 0
        ? null
        : Math.max(
            ...availablePoints.map((point) =>
              Math.abs(point.rvPressureTargetResidualMmHg),
            ),
          ),
    maximumTriSegRelativeResidual:
      availablePoints.length === 0
        ? null
        : Math.max(
            ...availablePoints.map((point) => point.triSegRelativeResidual),
          ),
    highRvVolumeWarning: {
      status:
        highRvPoints.length > 0
          ? "warning-search-headroom"
          : "below-search-headroom-threshold",
      thresholdMl: highRvVolumeWarningThresholdMl,
      searchUpperBoundMl: rvSearchUpperMl,
      affectedPointCount: highRvPoints.length,
      affectedLvVolumesMl: highRvPoints.map((point) => point.lvVolumeMl),
      boundary:
        "engineering-search-headroom-warning-only-not-a-physiologic-rv-volume-threshold",
    },
  } as const;
  const body = {
    artifactId: NO_AVPD_PASSIVE_LV_EDPVR_ARTIFACT_ID_V1,
    protocol: benchReport.protocol,
    parameters,
    points: benchReport.points,
    summary,
    provenance,
  };
  return {
    ...body,
    normalizedSha256: sha256Json(body),
  };
}

export function writeNoAvpdPassiveLvEdpvrReportV1(
  destinationPath = defaultOutputPath,
): NoAvpdPassiveLvEdpvrArtifactV1 {
  const artifact = buildNoAvpdPassiveLvEdpvrArtifactV1();
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
  const artifact = writeNoAvpdPassiveLvEdpvrReportV1(destinationPath);
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-passive-lv-edpvr-report-written",
        outputPath: destinationPath,
        summary: artifact.summary,
        provenance: artifact.provenance,
        normalizedSha256: artifact.normalizedSha256,
      },
      null,
      2,
    ),
  );
  if (!artifact.summary.allPointsAvailable) process.exitCode = 1;
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
