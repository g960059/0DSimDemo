import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import {
  NO_AVPD_TRISEG_FIBER_WORK_AUDIT_BENCH_ID_V1,
  runNoAvpdTriSegFiberWorkAuditBenchV1,
} from "@/engine/mechanics2/benches/NoAvpdTriSegFiberWorkAuditBenchV1";
import type { NoAvpdFourChamberBenchResultV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import { currentImplementationSha256 } from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultSourcePath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-physiology-matrix-v1/candidates/lv-ca-decay-155ms-baseline.json.gz",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-triseg-fiber-work-audit-v1.json",
);

const AUDIT_IMPLEMENTATION_SOURCE_PATHS = [
  "engine/mechanics2/diagnostics/NoAvpdTriSegFiberWorkAuditV1.ts",
  "engine/mechanics2/benches/NoAvpdTriSegFiberWorkAuditBenchV1.ts",
  "tools/mechanics2/runNoAvpdTriSegFiberWorkAuditV1.ts",
] as const;

export const NO_AVPD_TRISEG_FIBER_WORK_AUDIT_ARTIFACT_ID_V1 =
  "no-avpd-triseg-fiber-work-audit-report-v1" as const;

type SourceReportV1 = NoAvpdFourChamberBenchResultV1 & {
  readonly implementationSha256: string;
  readonly harnessImplementationSha256: string;
  readonly parameterSha256: string;
  readonly normalizedSha256: string;
};

export type NoAvpdTriSegFiberWorkAuditArtifactV1 = ReturnType<
  typeof writeNoAvpdTriSegFiberWorkAuditArtifactV1
>;

export function writeNoAvpdTriSegFiberWorkAuditArtifactV1(
  sourcePath = defaultSourcePath,
  destinationPath = defaultOutputPath,
) {
  const compressedSource = readFileSync(sourcePath);
  const sourceBytes = sourcePath.endsWith(".gz")
    ? gunzipSync(compressedSource)
    : compressedSource;
  const source = JSON.parse(sourceBytes.toString("utf8")) as SourceReportV1;
  validateSource(source);
  const audit = runNoAvpdTriSegFiberWorkAuditBenchV1(source);
  const currentModelImplementation = currentImplementationSha256();
  const body = {
    artifactId: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_ARTIFACT_ID_V1,
    benchId: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_BENCH_ID_V1,
    evidenceStatus:
      "report-only-generalized-force-mapping-comparison-no-acceptance-gate" as const,
    source: {
      path: relativeRepoPath(sourcePath),
      compressedFileSha256: sha256Bytes(compressedSource),
      plaintextFileSha256: sha256Bytes(sourceBytes),
      normalizedSha256: source.normalizedSha256,
      parameterSha256: source.parameterSha256,
      implementationSha256: source.implementationSha256,
      harnessImplementationSha256: source.harnessImplementationSha256,
    },
    currentModelImplementationSha256: currentModelImplementation,
    sourceImplementationMatchesCurrent:
      source.implementationSha256 === currentModelImplementation,
    auditImplementationSha256: auditImplementationSha256(),
    audit,
  };
  const artifact = {
    ...body,
    normalizedSha256: sha256Json(body),
  };
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, JSON.stringify(artifact, null, 2) + "\n");
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

function validateSource(source: SourceReportV1): void {
  const { normalizedSha256, ...body } = source;
  if (sha256Json(body) !== normalizedSha256) {
    throw new Error("source normalized hash mismatch");
  }
  if (sha256Json(source.parameterSnapshot) !== source.parameterSha256) {
    throw new Error("source parameter hash mismatch");
  }
  if (source.status !== "pass") {
    throw new Error("source structural-numerical status must pass");
  }
}

function auditImplementationSha256(): string {
  const hash = createHash("sha256");
  for (const path of AUDIT_IMPLEMENTATION_SOURCE_PATHS) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function relativeRepoPath(path: string): string {
  return path.startsWith(`${repoRoot}/`)
    ? path.slice(repoRoot.length + 1)
    : path;
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const sourcePath = resolve(
    repoRoot,
    stringArgument("--source") ?? defaultSourcePath,
  );
  const outputPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  const artifact = writeNoAvpdTriSegFiberWorkAuditArtifactV1(
    sourcePath,
    outputPath,
  );
  console.log(
    JSON.stringify(
      {
        stage: "no-avpd-triseg-fiber-work-audit-written",
        outputPath,
        sourcePath,
        normalizedSha256: artifact.normalizedSha256,
        nominalPointCount: artifact.audit.nominalCycle.pointCount,
        passiveGridPointCount: artifact.audit.passiveGrid.pointCount,
      },
      null,
      2,
    ),
  );
}
