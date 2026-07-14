import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  NO_AVPD_PHYSIOLOGY_MATRIX_BENCH_ID_V1,
  NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1,
  NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1,
  buildNoAvpdPhysiologyMatrixParamsV1,
  noAvpdPhysiologyMatrixCandidateV1,
  type NoAvpdPhysiologyMatrixCandidateIdV1,
} from "@/engine/mechanics2/benches/NoAvpdPhysiologyMatrixBenchV1";
import {
  summarizeNoAvpdPhysiologyMatrixDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdPhysiologyMatrixDiagnosticsV1";
import {
  currentHarnessImplementationSha256,
  currentImplementationSha256,
  writeNoAvpdFourChamberHillTriSegReportV1,
} from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const candidateDirectory = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-physiology-matrix-v1/candidates",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-physiology-matrix-v1.json",
);

const MATRIX_HARNESS_SOURCE_PATHS = [
  "engine/mechanics2/benches/NoAvpdPhysiologyMatrixBenchV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdPhysiologyMatrixDiagnosticsV1.ts",
  "tools/mechanics2/runNoAvpdPhysiologyMatrixV1.ts",
] as const;

type SourceReportV1 = ReturnType<typeof writeNoAvpdFourChamberHillTriSegReportV1>;

export const NO_AVPD_PHYSIOLOGY_MATRIX_ARTIFACT_ID_V1 =
  "no-avpd-physiology-matrix-report-v1" as const;

export type NoAvpdPhysiologyMatrixArtifactV1 = ReturnType<
typeof assembleNoAvpdPhysiologyMatrixV1
>;

export function writeNoAvpdPhysiologyMatrixCandidateV1(
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
): {
  readonly candidateId: NoAvpdPhysiologyMatrixCandidateIdV1;
  readonly sourceReportPath: string;
  readonly sourceNormalizedSha256: string;
  readonly compressedFileSha256: string;
  readonly status: SourceReportV1["status"];
  readonly oneBeatNormalizedMax: number | null;
} {
  const spec = noAvpdPhysiologyMatrixCandidateV1(candidateId);
  const params = buildNoAvpdPhysiologyMatrixParamsV1(candidateId);
  mkdirSync(candidateDirectory, { recursive: true });
  const destinationPath = candidateSourcePath(candidateId);
  const plainTemporaryPath = destinationPath + ".plain-" + process.pid;
  const compressedTemporaryPath = destinationPath + ".tmp-" + process.pid;
  const report = writeNoAvpdFourChamberHillTriSegReportV1({
    beats: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.beats,
    dtSec: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.dtSec,
    sampleEverySteps: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.sampleEverySteps,
    sampleRetention: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.sampleRetention,
    params,
  }, plainTemporaryPath);
  const sourceBytes = readFileSync(plainTemporaryPath);
  const compressed = gzipSync(sourceBytes, { level: 9 });
  writeFileSync(compressedTemporaryPath, compressed);
  renameSync(compressedTemporaryPath, destinationPath);
  unlinkSync(plainTemporaryPath);
  const oneBeatNormalizedMax = report.reportOnlyExactBeatBoundaryReturnMap
    .oneBeatMapResidual?.normalizedFullStateDrift.maxAbsDimensionless ?? null;
  return {
    candidateId: spec.candidateId,
    sourceReportPath: relativeRepoPath(destinationPath),
    sourceNormalizedSha256: report.normalizedSha256,
    compressedFileSha256: sha256Bytes(compressed),
    status: report.status,
    oneBeatNormalizedMax,
  };
}

export function assembleNoAvpdPhysiologyMatrixV1(
  destinationPath = defaultOutputPath,
) {
  const protocolSha256 = sha256Json(NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1);
  const implementationSha256 = currentImplementationSha256();
  const sourceHarnessImplementationSha256 = currentHarnessImplementationSha256();
  const matrixHarnessImplementationSha256 = matrixHarnessSha256();
  const candidates = NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1.map((spec) => {
    const sourcePath = candidateSourcePath(spec.candidateId);
    const compressed = readFileSync(sourcePath);
    const sourceBytes = gunzipSync(compressed);
    const sourceReport = JSON.parse(sourceBytes.toString("utf8")) as SourceReportV1;
    validateSourceReport(sourceReport, spec.candidateId);
    const diagnostics = summarizeNoAvpdPhysiologyMatrixDiagnosticsV1(sourceReport);
    const oneBeatNormalizedMax = sourceReport.reportOnlyExactBeatBoundaryReturnMap
      .oneBeatMapResidual?.normalizedFullStateDrift.maxAbsDimensionless ?? null;
    const orbitReadiness = sourceReport.status !== "pass"
      ? "structural-fail"
      : oneBeatNormalizedMax == null
        ? "unavailable"
        : oneBeatNormalizedMax
          <= NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1
            .orbitReadinessThreshold.maximumInclusive
          ? "ready-for-between-candidate-description"
          : "unsettled-no-ranking";
    return {
      candidateId: spec.candidateId,
      parentCandidateId: spec.parentCandidateId,
      family: spec.family,
      label: spec.label,
      intervention: spec.intervention,
      protocolSha256,
      parameterSnapshot: sourceReport.parameterSnapshot,
      parameterSha256: sourceReport.parameterSha256,
      sourceReportPath: relativeRepoPath(sourcePath),
      sourceNormalizedSha256: sourceReport.normalizedSha256,
      sourcePlaintextSha256: sha256Bytes(sourceBytes),
      sourceCompressedSha256: sha256Bytes(compressed),
      implementationSha256: sourceReport.implementationSha256,
      sourceHarnessImplementationSha256:
        sourceReport.harnessImplementationSha256,
      matrixHarnessImplementationSha256,
      structuralStatus: sourceReport.status,
      hardDiagnostics: sourceReport.hardDiagnostics,
      orbitReadiness: {
        status: orbitReadiness,
        oneBeatNormalizedMax,
        threshold:
          NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1
            .orbitReadinessThreshold.maximumInclusive,
        changesStructuralStatus: false,
        physiologyAcceptance: false,
      },
      diagnostics,
    };
  });
  const body = {
    artifactId: NO_AVPD_PHYSIOLOGY_MATRIX_ARTIFACT_ID_V1,
    benchId: NO_AVPD_PHYSIOLOGY_MATRIX_BENCH_ID_V1,
    evidenceStatus:
      "report-only-lv-active-relaxation-sensitivity-not-physiology-acceptance" as const,
    comparisonPolicy: {
      candidateOrder: NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1.map(
        (candidate) => candidate.candidateId,
      ),
      oneFactorChanged: "ventricular-calcium-decay-half-time" as const,
      changedWalls: ["leftFreeWall", "septum"] as const,
      allRateAnchorsScaledTogether: true as const,
      scalarWinnerScoreApplied: false as const,
      physiologyThresholdsApplied: false as const,
      crossParameterWarmStartUsed: false as const,
      rawTraceSmoothingApplied: false as const,
      rawTraceDecimationApplied: false as const,
      causalClaimBoundary:
        "calcium-decay-half-time-is-not-invasive-lv-pressure-tau" as const,
    },
    protocol: NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1,
    protocolSha256,
    implementationSha256,
    sourceHarnessImplementationSha256,
    matrixHarnessImplementationSha256,
    candidates,
  };
  const artifact = {
    ...body,
    normalizedSha256: sha256Json(body),
  };
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = destinationPath + ".tmp-" + process.pid;
  writeFileSync(temporaryPath, JSON.stringify(artifact, null, 2) + "\n");
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

function validateSourceReport(
  sourceReport: SourceReportV1,
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
): void {
  const { normalizedSha256, ...normalizedBody } = sourceReport;
  if (sha256Json(normalizedBody) !== normalizedSha256) {
    throw new Error("Candidate source normalized hash mismatch: " + candidateId);
  }
  const expectedParams = buildNoAvpdPhysiologyMatrixParamsV1(candidateId);
  const expectedParameterSha256 = sha256Json(expectedParams);
  if (
    sourceReport.parameterSha256 !== expectedParameterSha256
    || sha256Json(sourceReport.parameterSnapshot) !== expectedParameterSha256
  ) {
    throw new Error("Candidate parameter hash mismatch: " + candidateId);
  }
  if (sourceReport.implementationSha256 !== currentImplementationSha256()) {
    throw new Error("Candidate implementation hash mismatch: " + candidateId);
  }
  if (
    sourceReport.dtSec !== NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.dtSec
    || sourceReport.beatsRequested !== NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.beats
    || sourceReport.runProtocol.sampleEverySteps
      !== NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.sampleEverySteps
    || sourceReport.runProtocol.sampleRetention
      !== NO_AVPD_PHYSIOLOGY_MATRIX_PROTOCOL_V1.sampleRetention
    || sourceReport.runProtocol.initialization.mode !== "cold"
  ) {
    throw new Error("Candidate protocol mismatch: " + candidateId);
  }
}

function candidateSourcePath(
  candidateId: NoAvpdPhysiologyMatrixCandidateIdV1,
): string {
  return resolve(candidateDirectory, candidateId + ".json.gz");
}

function matrixHarnessSha256(): string {
  const hash = createHash("sha256");
  for (const path of MATRIX_HARNESS_SOURCE_PATHS) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function relativeRepoPath(path: string): string {
  return path.startsWith(repoRoot + "/") ? path.slice(repoRoot.length + 1) : path;
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
    throw new Error(flag + " must be followed by a value");
  }
  return value;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const candidateId = stringArgument("--candidate");
  const assembleOnly = process.argv.includes("--assemble");
  if (candidateId != null && assembleOnly) {
    throw new Error("--candidate and --assemble are mutually exclusive");
  }
  if (candidateId != null) {
    const result = writeNoAvpdPhysiologyMatrixCandidateV1(
      noAvpdPhysiologyMatrixCandidateV1(
        candidateId as NoAvpdPhysiologyMatrixCandidateIdV1,
      ).candidateId,
    );
    console.log(JSON.stringify({ stage: "candidate-complete", ...result }, null, 2));
  } else {
    if (!assembleOnly) {
      for (const candidate of NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1) {
        const result = writeNoAvpdPhysiologyMatrixCandidateV1(candidate.candidateId);
        console.log(JSON.stringify({ stage: "candidate-complete", ...result }));
      }
    }
    const artifact = assembleNoAvpdPhysiologyMatrixV1();
    console.log(JSON.stringify({
      stage: "matrix-complete",
      outputPath: defaultOutputPath,
      candidateCount: artifact.candidates.length,
      normalizedSha256: artifact.normalizedSha256,
      results: artifact.candidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        structuralStatus: candidate.structuralStatus,
        orbitReadiness: candidate.orbitReadiness,
      })),
    }, null, 2));
  }
}
