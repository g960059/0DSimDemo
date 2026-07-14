import { createHash } from "node:crypto";
import {
  existsSync,
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
  NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1,
  NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_BENCH_ID_V1,
  NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1,
  buildNoAvpdAtrialThinFilamentSlsParamsV1,
  noAvpdAtrialThinFilamentSlsCandidateV1,
  type NoAvpdAtrialThinFilamentSlsCandidateIdV1,
} from "@/engine/mechanics2/benches/NoAvpdAtrialThinFilamentSlsMatrixV1";
import {
  summarizeNoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1,
  summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1";
import {
  currentHarnessImplementationSha256,
  currentImplementationSha256,
  writeNoAvpdFourChamberHillTriSegReportV1,
} from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const candidateDirectory = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1/candidates",
);
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1.json",
);
const priorReuse2CandidateDirectory = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1/prior-reuse2-dt5ms/candidates",
);

const MATRIX_HARNESS_SOURCE_PATHS = [
  "engine/mechanics2/benches/NoAvpdAtrialThinFilamentSlsMatrixV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdAtrialMorphologyOwnerScreenDiagnosticsV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1.ts",
  "tools/mechanics2/runNoAvpdAtrialThinFilamentSlsMatrixV1.ts",
] as const;

type SourceReportV1 = ReturnType<
  typeof writeNoAvpdFourChamberHillTriSegReportV1
>;

export const NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_ARTIFACT_ID_V1 =
  "no-avpd-atrial-thin-filament-sls-matrix-report-v1" as const;

export type NoAvpdAtrialThinFilamentSlsMatrixArtifactV1 = ReturnType<
  typeof assembleNoAvpdAtrialThinFilamentSlsMatrixV1
>;

type NoAvpdAtrialThinFilamentSlsCandidateWriteOptionsV1 = {
  readonly beats?: number;
  readonly dtSec?: number;
  readonly destinationPath?: string;
};

export function writeNoAvpdAtrialThinFilamentSlsCandidateV1(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
  options: NoAvpdAtrialThinFilamentSlsCandidateWriteOptionsV1 = {},
) {
  const spec = noAvpdAtrialThinFilamentSlsCandidateV1(candidateId);
  const params = buildNoAvpdAtrialThinFilamentSlsParamsV1(candidateId);
  const beats =
    options.beats ?? NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.beats;
  const dtSec =
    options.dtSec ?? NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.dtSec;
  const destinationPath =
    options.destinationPath ?? candidateSourcePath(candidateId);
  mkdirSync(dirname(destinationPath), { recursive: true });
  const plainTemporaryPath = `${destinationPath}.plain-${process.pid}`;
  const compressedTemporaryPath = `${destinationPath}.tmp-${process.pid}`;
  const startedAt = performance.now();
  const report = writeNoAvpdFourChamberHillTriSegReportV1(
    {
      beats,
      dtSec,
      sampleEverySteps:
        NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.sampleEverySteps,
      sampleRetention:
        NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.sampleRetention,
      params,
    },
    plainTemporaryPath,
  );
  const sourceBytes = readFileSync(plainTemporaryPath);
  const compressed = gzipSync(sourceBytes, { level: 9 });
  writeFileSync(compressedTemporaryPath, compressed);
  renameSync(compressedTemporaryPath, destinationPath);
  unlinkSync(plainTemporaryPath);
  return {
    candidateId: spec.candidateId,
    beatsRequested: beats,
    dtSec,
    sourceReportPath: relativeRepoPath(destinationPath),
    sourceNormalizedSha256: report.normalizedSha256,
    sourceCompressedSha256: sha256Bytes(compressed),
    structuralStatus: report.status,
    failureReason: report.failureReason,
    beatsCompleted: report.beatsCompleted,
    oneBeatNormalizedMax:
      report.reportOnlyExactBeatBoundaryReturnMap.oneBeatMapResidual
        ?.normalizedFullStateDrift.maxAbsDimensionless ?? null,
    elapsedSec: (performance.now() - startedAt) / 1_000,
  };
}

export function noAvpdAtrialThinFilamentSlsCandidateCliExitCodeV1(result: {
  readonly structuralStatus: "pass" | "fail";
}): 0 | 1 {
  return result.structuralStatus === "pass" ? 0 : 1;
}

export function noAvpdAtrialThinFilamentSlsMatrixCliExitCodeV1(
  artifact: NoAvpdAtrialThinFilamentSlsMatrixArtifactV1,
): 0 | 1 {
  return artifact.parameterIsolation.nonFactorParametersIdentical &&
    artifact.parameterIsolation.allCandidatesUseLumensDefaultMapping &&
    artifact.parameterIsolation.allCandidatesUseIndependentColdStart &&
    artifact.parameterIsolation.allCandidatesUseFixedNumericalProtocol &&
    artifact.matrixDiagnostics.allStructuralPass
    ? 0
    : 1;
}

export function assembleNoAvpdAtrialThinFilamentSlsMatrixV1(
  destinationPath = defaultOutputPath,
) {
  const protocolSha256 = sha256Json(
    NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1,
  );
  const implementationSha256 = currentImplementationSha256();
  const sourceHarnessImplementationSha256 =
    currentHarnessImplementationSha256();
  const matrixHarnessImplementationSha256 = matrixHarnessSha256();
  const normalizedNonFactorHashes = new Set<string>();
  const candidates = NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1.map(
    (spec) => {
      const sourcePath = candidateSourcePath(spec.candidateId);
      const compressed = readFileSync(sourcePath);
      const sourceBytes = gunzipSync(compressed);
      const sourceReport = JSON.parse(
        sourceBytes.toString("utf8"),
      ) as SourceReportV1;
      validateSourceReport(sourceReport, spec.candidateId);
      const diagnostics =
        summarizeNoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1(
          sourceReport,
        );
      const nonFactorParameterSha256 = sha256Json(
        parametersWithoutDeclaredFactors(sourceReport.parameterSnapshot),
      );
      normalizedNonFactorHashes.add(nonFactorParameterSha256);
      return {
        candidateId: spec.candidateId,
        spec,
        label: spec.label,
        factors: {
          thinFilament: spec.thinFilamentFactor,
          thinFilamentDynamics: spec.thinFilamentDynamics,
          laSls: spec.slsFactor,
          laSlsModulusPa: spec.laSlsModulusPa,
        },
        protocolSha256,
        parameterSnapshot: sourceReport.parameterSnapshot,
        parameterSha256: sourceReport.parameterSha256,
        nonFactorParameterSha256,
        sourceReportPath: relativeRepoPath(sourcePath),
        compressedSourceReportPath: relativeRepoPath(sourcePath),
        sourceNormalizedSha256: sourceReport.normalizedSha256,
        sourcePlaintextSha256: sha256Bytes(sourceBytes),
        completeSourceReportSha256: sha256Bytes(sourceBytes),
        sourceCompressedSha256: sha256Bytes(compressed),
        implementationSha256: sourceReport.implementationSha256,
        sourceHarnessImplementationSha256:
          sourceReport.harnessImplementationSha256,
        matrixHarnessImplementationSha256,
        structuralStatus: sourceReport.status,
        statusScope: sourceReport.statusScope,
        failureReason: sourceReport.failureReason,
        beatsCompleted: sourceReport.beatsCompleted,
        initialization: sourceReport.runProtocol.initialization,
        hardDiagnostics: sourceReport.hardDiagnostics,
        solverWork: sourceReport.solverWork,
        exactBeatBoundaryReturnMap:
          sourceReport.reportOnlyExactBeatBoundaryReturnMap,
        diagnostics,
      };
    },
  );
  const matrixDiagnostics =
    summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1(
      candidates.map((candidate) => ({
        spec: noAvpdAtrialThinFilamentSlsCandidateV1(candidate.candidateId),
        diagnostics: candidate.diagnostics,
      })),
    );
  const nonFactorParametersIdentical = normalizedNonFactorHashes.size === 1;
  const priorReuse2Evidence = summarizePriorReuse2Evidence(candidates);
  const body = {
    artifactId: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_ARTIFACT_ID_V1,
    benchId: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_BENCH_ID_V1,
    evidenceStatus:
      "report-only-two-by-two-interaction-screen-no-calibration-physiology-acceptance-or-winner" as const,
    protocol: NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1,
    protocolSha256,
    parameterIsolation: {
      nonFactorParametersIdentical,
      normalizedNonFactorParameterSha256:
        normalizedNonFactorHashes.size === 1
          ? [...normalizedNonFactorHashes][0]!
          : null,
      ignoredMetadataPaths: [
        "atria.left.material.parameterSetId",
        "atria.left.material.calciumTroponinActivation.parameterSetId",
      ] as const,
      declaredFactorPaths: [
        "atria.left.material.calciumTroponinActivation.thinFilamentDynamics",
        "atria.left.material.sls.modulusPa",
      ] as const,
      allCandidatesUseLumensDefaultMapping: candidates.every(
        (candidate) =>
          candidate.parameterSnapshot.triSegGeneralizedForceMapping ===
          "lumens-2009-representative-tension-area-work",
      ),
      allCandidatesUseIndependentColdStart: candidates.every(
        (candidate) => candidate.initialization.mode === "cold",
      ),
      allCandidatesUseFixedNumericalProtocol: candidates.every(
        (candidate) =>
          candidate.parameterSnapshot.solver.maxIterations === 14 &&
          candidate.parameterSnapshot.solver.jacobianReuse.maxAcceptedSteps ===
            0,
      ),
      crossCandidateWarmStartUsed: false as const,
    },
    numericalProtocolProvenance: {
      currentProtocol:
        "common-dt5ms-max14-fresh-finite-difference-jacobian-every-global-newton-iteration" as const,
      priorProtocolEvidenceRetained: priorReuse2Evidence,
      exactFailedStepReplay: {
        source:
          "replay-from-final-accepted-state-of-prior-reuse2-lag-failures" as const,
        lag25Sls4: {
          priorFailure: "maximum-iterations-at-step-1404" as const,
          maxIterations24Reuse2: "accepted-in-16-iterations" as const,
          maxIterations14FreshJacobian:
            "accepted-in-8-iterations-zero-backtracks" as const,
        },
        lag25Sls8: {
          priorFailure: "line-search-failed-at-step-204" as const,
          maxIterations24Reuse2: "still-failed-line-search" as const,
          maxIterations14FreshJacobian:
            "accepted-in-8-iterations-zero-backtracks" as const,
        },
        interpretation:
          "fresh-jacobian-selected-as-common-numerical-protocol-not-morphology-tuning" as const,
      },
    },
    implementationSha256,
    sourceHarnessImplementationSha256,
    matrixHarnessImplementationSha256,
    candidates,
    matrixDiagnostics,
    winnerSelection: {
      status: "not-performed-evidence-only-screen" as const,
      promotedCandidateId: null,
      automaticSelectionAllowed: false as const,
    },
    timeStepConfirmation: {
      status: "not-run-no-candidate-promoted" as const,
      confirmationDtSec: 0.0025,
      candidatesRunAtConfirmationDt: [] as readonly string[],
    },
  };
  const artifact = {
    ...body,
    normalizedSha256: sha256Json(body),
  };
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(artifact, null, 2)}\n`);
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

function validateSourceReport(
  sourceReport: SourceReportV1,
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
): void {
  const { normalizedSha256, ...normalizedBody } = sourceReport;
  if (sha256Json(normalizedBody) !== normalizedSha256) {
    throw new Error(
      `candidate source normalized hash mismatch: ${candidateId}`,
    );
  }
  const expectedParams = buildNoAvpdAtrialThinFilamentSlsParamsV1(candidateId);
  const expectedParameterSha256 = sha256Json(expectedParams);
  if (
    sourceReport.parameterSha256 !== expectedParameterSha256 ||
    sha256Json(sourceReport.parameterSnapshot) !== expectedParameterSha256
  ) {
    throw new Error(`candidate parameter hash mismatch: ${candidateId}`);
  }
  if (sourceReport.implementationSha256 !== currentImplementationSha256()) {
    throw new Error(`candidate implementation hash mismatch: ${candidateId}`);
  }
  if (
    sourceReport.harnessImplementationSha256 !==
    currentHarnessImplementationSha256()
  ) {
    throw new Error(`candidate source harness hash mismatch: ${candidateId}`);
  }
  if (
    sourceReport.dtSec !==
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.dtSec ||
    sourceReport.beatsRequested !==
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.beats ||
    sourceReport.runProtocol.sampleEverySteps !==
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.sampleEverySteps ||
    sourceReport.runProtocol.sampleRetention !==
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.sampleRetention ||
    sourceReport.runProtocol.initialization.mode !== "cold"
  ) {
    throw new Error(`candidate protocol mismatch: ${candidateId}`);
  }
  if (
    sourceReport.parameterSnapshot.triSegGeneralizedForceMapping !==
    "lumens-2009-representative-tension-area-work"
  ) {
    throw new Error(`candidate mapping mismatch: ${candidateId}`);
  }
  if (
    sourceReport.parameterSnapshot.solver.maxIterations !== 14 ||
    sourceReport.parameterSnapshot.solver.jacobianReuse.maxAcceptedSteps !== 0
  ) {
    throw new Error(`candidate numerical protocol mismatch: ${candidateId}`);
  }
}

function parametersWithoutDeclaredFactors(
  parameterSnapshot: SourceReportV1["parameterSnapshot"],
): unknown {
  const normalized = JSON.parse(JSON.stringify(parameterSnapshot)) as Record<
    string,
    any
  >;
  const material = normalized.atria.left.material;
  material.parameterSetId = "<candidate-id-ignored>";
  material.calciumTroponinActivation.parameterSetId = "<candidate-id-ignored>";
  delete material.calciumTroponinActivation.thinFilamentDynamics;
  delete material.sls.modulusPa;
  return normalized;
}

function summarizePriorReuse2Evidence(
  currentCandidates: readonly {
    readonly candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1;
    readonly structuralStatus: "pass" | "fail";
    readonly beatsCompleted: number;
    readonly solverWork: SourceReportV1["solverWork"];
  }[],
) {
  const evidence = currentCandidates.map((current) => {
    const priorPath = resolve(
      priorReuse2CandidateDirectory,
      `${current.candidateId}.json.gz`,
    );
    if (!existsSync(priorPath)) {
      return {
        candidateId: current.candidateId,
        availability: "unavailable" as const,
        priorSourceReportPath: relativeRepoPath(priorPath),
        comparison: null,
      };
    }
    const compressed = readFileSync(priorPath);
    const plain = gunzipSync(compressed);
    const prior = JSON.parse(plain.toString("utf8")) as SourceReportV1;
    const { normalizedSha256, ...body } = prior;
    if (sha256Json(body) !== normalizedSha256) {
      throw new Error(
        `prior reuse2 normalized hash mismatch: ${current.candidateId}`,
      );
    }
    const comparableFullRuns =
      prior.status === "pass" &&
      current.structuralStatus === "pass" &&
      prior.solverWork.stepsAccepted === current.solverWork.stepsAccepted;
    return {
      candidateId: current.candidateId,
      availability: "available" as const,
      priorSourceReportPath: relativeRepoPath(priorPath),
      priorSourceNormalizedSha256: prior.normalizedSha256,
      priorSourceCompressedSha256: sha256Bytes(compressed),
      priorProtocol: {
        dtSec: prior.dtSec,
        maxIterations: prior.parameterSnapshot.solver.maxIterations,
        jacobianReuseMaxAcceptedSteps:
          prior.parameterSnapshot.solver.jacobianReuse.maxAcceptedSteps,
        structuralStatus: prior.status,
        failureReason: prior.failureReason,
        beatsCompleted: prior.beatsCompleted,
        stepsAccepted: prior.solverWork.stepsAccepted,
      },
      currentProtocol: {
        structuralStatus: current.structuralStatus,
        beatsCompleted: current.beatsCompleted,
        stepsAccepted: current.solverWork.stepsAccepted,
      },
      comparison: comparableFullRuns
        ? {
            availability: "available-equal-accepted-step-count" as const,
            freshJacobianMinusReuse2: solverWorkDelta(
              current.solverWork,
              prior.solverWork,
            ),
          }
        : {
            availability:
              "unavailable-prior-run-incomplete-or-step-count-mismatch" as const,
            freshJacobianMinusReuse2: null,
          },
    };
  });
  return {
    directory: relativeRepoPath(priorReuse2CandidateDirectory),
    evidenceStatus:
      "retained-numerical-protocol-evidence-not-a-physiology-comparison" as const,
    candidates: evidence,
  };
}

function solverWorkDelta(
  current: SourceReportV1["solverWork"],
  prior: SourceReportV1["solverWork"],
) {
  return {
    totalGlobalIterations:
      current.totalGlobalIterations - prior.totalGlobalIterations,
    totalGlobalResidualEvaluations:
      current.totalGlobalResidualEvaluations -
      prior.totalGlobalResidualEvaluations,
    totalGlobalJacobianEvaluations:
      current.totalGlobalJacobianEvaluations -
      prior.totalGlobalJacobianEvaluations,
    totalGlobalLineSearchBacktracks:
      current.totalGlobalLineSearchBacktracks -
      prior.totalGlobalLineSearchBacktracks,
    totalGlobalFreshJacobianRetries:
      current.totalGlobalFreshJacobianRetries -
      prior.totalGlobalFreshJacobianRetries,
  };
}

function candidateSourcePath(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
): string {
  return resolve(candidateDirectory, `${candidateId}.json.gz`);
}

function diagnosticCandidateSourcePath(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
  dtSec: number,
): string {
  const dtMicroseconds = Math.round(dtSec * 1_000_000);
  return resolve(
    candidateDirectory,
    `../dt-refinement/dt-${dtMicroseconds}us`,
    `${candidateId}.json.gz`,
  );
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

function optionalPositiveNumericArgument(flag: string): number | null {
  const raw = stringArgument(flag);
  if (raw == null) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} must be followed by a positive finite number`);
  }
  return value;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const candidateArgument = stringArgument("--candidate");
  const assembleOnly = process.argv.includes("--assemble");
  const diagnosticDtSec = optionalPositiveNumericArgument("--diagnostic-dt");
  if (candidateArgument != null && assembleOnly) {
    throw new Error("--candidate and --assemble are mutually exclusive");
  }
  if (diagnosticDtSec != null && candidateArgument == null) {
    throw new Error("--diagnostic-dt requires --candidate");
  }
  if (candidateArgument != null) {
    const candidateId = noAvpdAtrialThinFilamentSlsCandidateV1(
      candidateArgument as NoAvpdAtrialThinFilamentSlsCandidateIdV1,
    ).candidateId;
    const result = writeNoAvpdAtrialThinFilamentSlsCandidateV1(
      candidateId,
      diagnosticDtSec == null
        ? {}
        : {
            dtSec: diagnosticDtSec,
            destinationPath: diagnosticCandidateSourcePath(
              candidateId,
              diagnosticDtSec,
            ),
          },
    );
    console.log(
      JSON.stringify(
        {
          stage: "candidate-complete",
          protocolRole:
            diagnosticDtSec == null
              ? "predeclared-matrix-arm"
              : "time-step-refinement-diagnostic-not-matrix-arm",
          ...result,
        },
        null,
        2,
      ),
    );
    process.exitCode =
      noAvpdAtrialThinFilamentSlsCandidateCliExitCodeV1(result);
  } else {
    if (!assembleOnly) {
      for (const candidate of NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1) {
        console.log(
          JSON.stringify({
            stage: "candidate-complete",
            ...writeNoAvpdAtrialThinFilamentSlsCandidateV1(
              candidate.candidateId,
            ),
          }),
        );
      }
    }
    const artifact = assembleNoAvpdAtrialThinFilamentSlsMatrixV1();
    console.log(
      JSON.stringify(
        {
          stage: "matrix-complete",
          outputPath: defaultOutputPath,
          parameterIsolation: artifact.parameterIsolation,
          matrixDiagnostics: artifact.matrixDiagnostics,
          winnerSelection: artifact.winnerSelection,
          timeStepConfirmation: artifact.timeStepConfirmation,
          normalizedSha256: artifact.normalizedSha256,
          candidates: artifact.candidates.map((candidate) => ({
            candidateId: candidate.candidateId,
            structuralStatus: candidate.structuralStatus,
            beatsCompleted: candidate.beatsCompleted,
            orbitReadback: candidate.diagnostics.orbitReadback,
            metricVector: candidate.diagnostics.metricVector,
          })),
        },
        null,
        2,
      ),
    );
    process.exitCode = noAvpdAtrialThinFilamentSlsMatrixCliExitCodeV1(artifact);
  }
}
