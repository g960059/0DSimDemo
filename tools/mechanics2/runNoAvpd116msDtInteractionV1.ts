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
import { gzipSync } from "node:zlib";

import {
  buildNoAvpdPhysiologyMatrixParamsV1,
  noAvpdPhysiologyMatrixCandidateV1,
} from "@/engine/mechanics2/benches/NoAvpdPhysiologyMatrixBenchV1";
import {
  currentHarnessImplementationSha256,
  currentImplementationSha256,
  writeNoAvpdFourChamberHillTriSegReportV1,
} from "@/tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");

export const NO_AVPD_116MS_DT_INTERACTION_ARTIFACT_ID_V1 =
  "no-avpd-lv-ca-decay-116ms-dt-interaction-v1" as const;

export const NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1 = Object.freeze({
  protocolId: "no-avpd-lv-ca-decay-116ms-cold32-hr60-dt-interaction-v1",
  evidenceStatus:
    "report-only-solver-time-step-interaction-not-convergence-order-evidence",
  candidateId: "lv-ca-decay-116ms" as const,
  heartRateBpm: 60,
  cycleLengthSec: 1,
  beats: 32,
  requestedDurationSec: 32,
  initialization: "independent-cold-start-per-time-step",
  crossTimeStepWarmStartAllowed: false,
  dtSec: [0.005, 0.0025] as const,
  sampleEverySteps: 1,
  sampleRetention: "last-two-complete-beats" as const,
  parameterChangesAcrossRuns: false,
  convergenceOrderEstimated: false,
  waveformDifferenceComputed: false,
  physiologyThresholdsApplied: false,
  interpretationBoundary:
    "two-time-step-fail-pass-reproduction-identifies-solver-time-step-interaction-only-and-does-not-establish-convergence-order-accuracy-stability-or-physiological-validity",
} as const);

const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-lv-ca-decay-116ms-dt-interaction-v1.json",
);
const rawDirectory = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-lv-ca-decay-116ms-dt-interaction-v1",
);

const HARNESS_SOURCE_PATHS = [
  "engine/mechanics2/benches/NoAvpdPhysiologyMatrixBenchV1.ts",
  "tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1.ts",
  "tools/mechanics2/runNoAvpd116msDtInteractionV1.ts",
] as const;

type SourceReportV1 = ReturnType<typeof writeNoAvpdFourChamberHillTriSegReportV1>;

export type NoAvpd116msDtInteractionRunSummaryV1 = ReturnType<
typeof compactNoAvpd116msDtInteractionRunV1
>;

export type NoAvpd116msDtInteractionArtifactV1 = ReturnType<
typeof assembleNoAvpd116msDtInteractionArtifactV1
>;

export function compactNoAvpd116msDtInteractionRunV1(input: {
  readonly report: SourceReportV1;
  readonly rawReportPath: string;
  readonly rawPlaintextSha256: string;
  readonly rawCompressedSha256: string;
  readonly rawCompressedByteLength: number;
}) {
  const report = input.report;
  const oneBeatNormalizedMax = report.reportOnlyExactBeatBoundaryReturnMap
    .oneBeatMapResidual?.normalizedFullStateDrift.maxAbsDimensionless ?? null;
  const failedStepIndex = parseFailedStepIndex(report.failureReason);
  return {
    dtSec: report.dtSec,
    stepsPerCycle: integerStepsPerCycle(
      report.runProtocol.cycleLengthSec,
      report.dtSec,
    ),
    requestedBeats: report.beatsRequested,
    requestedDurationSec:
      report.beatsRequested * report.runProtocol.cycleLengthSec,
    structuralStatus: report.status,
    failureReason: report.failureReason,
    failureLocalization: {
      failedStepIndex,
      failedStepNumberOneBased: failedStepIndex == null ? null : failedStepIndex + 1,
      acceptedTimeSec: report.finalState.timeSec,
      acceptedBeatsCompleted: report.beatsCompleted,
    },
    initialization: report.runProtocol.initialization,
    solverWork: report.solverWork,
    hardDiagnostics: report.hardDiagnostics,
    exactReturnMap: {
      availability: report.reportOnlyExactBeatBoundaryReturnMap.availability,
      oneBeatNormalizedMax,
      twoBeatNormalizedMax: report.reportOnlyExactBeatBoundaryReturnMap
        .twoBeatMapResidual?.normalizedFullStateDrift.maxAbsDimensionless ?? null,
      thresholdsApplied: false,
    },
    retainedRawSampleCount: report.samples.length,
    rawEvidence: {
      storage:
        "gzip-full-source-report-including-raw-retained-samples-no-smoothing-no-decimation" as const,
      sourceReportPath: input.rawReportPath,
      sourceNormalizedSha256: report.normalizedSha256,
      sourcePlaintextSha256: input.rawPlaintextSha256,
      sourceCompressedSha256: input.rawCompressedSha256,
      compressedByteLength: input.rawCompressedByteLength,
    },
  };
}

export function assembleNoAvpd116msDtInteractionArtifactV1(
  runs: readonly NoAvpd116msDtInteractionRunSummaryV1[],
  hashes: {
    readonly parameterSha256: string;
    readonly implementationSha256: string;
    readonly sourceHarnessImplementationSha256: string;
    readonly interactionHarnessImplementationSha256: string;
  },
) {
  const sortedRuns = runs.slice().sort((left, right) => right.dtSec - left.dtSec);
  if (sortedRuns.length !== 2) {
    throw new Error("116 ms dt-interaction artifact requires exactly two runs");
  }
  const [coarse, fine] = sortedRuns;
  if (coarse?.dtSec !== 0.005 || fine?.dtSec !== 0.0025) {
    throw new Error("116 ms dt-interaction artifact requires dt=5 ms and 2.5 ms");
  }
  const reproducedExpectedInteraction =
    coarse.structuralStatus === "fail"
    && coarse.failureLocalization.failedStepIndex === 202
    && Math.abs(coarse.failureLocalization.acceptedTimeSec - 1.01) <= 1e-12
    && fine.structuralStatus === "pass"
    && fine.solverWork.stepsAttempted === 12_800
    && fine.solverWork.stepsAccepted === 12_800;
  const body = {
    artifactId: NO_AVPD_116MS_DT_INTERACTION_ARTIFACT_ID_V1,
    statusScope: "report-only-diagnostic-bundle" as const,
    evidenceStatus:
      "report-only-solver-time-step-interaction-not-convergence-order-evidence" as const,
    protocol: NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1,
    protocolSha256: sha256Json(NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1),
    candidate: noAvpdPhysiologyMatrixCandidateV1("lv-ca-decay-116ms"),
    provenance: {
      parameterSha256: hashes.parameterSha256,
      sameParameterSnapshotAcrossRuns: true as const,
      implementationSha256: hashes.implementationSha256,
      sourceHarnessImplementationSha256:
        hashes.sourceHarnessImplementationSha256,
      interactionHarnessImplementationSha256:
        hashes.interactionHarnessImplementationSha256,
    },
    comparison: {
      reproducedExpectedInteraction,
      coarseOutcome: "dt-5ms-structural-fail-at-step-202-after-time-1.01s" as const,
      fineOutcome: "dt-2.5ms-completes-cold32" as const,
      convergenceOrderEstimated: false as const,
      errorEstimateComputed: false as const,
      waveformComparisonPerformed: false as const,
      physiologyClassificationPerformed: false as const,
      interpretation:
        "the-coarse-failure-and-fine-completion-localize-a-solver-time-step-interaction-but-neither-outcome-is-a-physiology-acceptance-result" as const,
    },
    runs: sortedRuns,
  };
  return {
    ...body,
    normalizedSha256: sha256Json(body),
  };
}

export function writeNoAvpd116msDtInteractionV1(
  destinationPath = defaultOutputPath,
): NoAvpd116msDtInteractionArtifactV1 {
  const params = buildNoAvpdPhysiologyMatrixParamsV1("lv-ca-decay-116ms");
  const parameterSha256 = sha256Json(params);
  const implementationSha256 = currentImplementationSha256();
  const sourceHarnessImplementationSha256 = currentHarnessImplementationSha256();
  const summaries: NoAvpd116msDtInteractionRunSummaryV1[] = [];
  mkdirSync(rawDirectory, { recursive: true });

  for (const dtSec of NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1.dtSec) {
    const rawPath = rawReportPath(dtSec);
    const plainTemporaryPath = rawPath + ".plain-" + process.pid;
    const compressedTemporaryPath = rawPath + ".tmp-" + process.pid;
    const startedAt = performance.now();
    const report = writeNoAvpdFourChamberHillTriSegReportV1({
      beats: NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1.beats,
      dtSec,
      sampleEverySteps: NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1.sampleEverySteps,
      sampleRetention: NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1.sampleRetention,
      params,
    }, plainTemporaryPath);
    const plaintext = readFileSync(plainTemporaryPath);
    const compressed = gzipSync(plaintext, { level: 9 });
    writeFileSync(compressedTemporaryPath, compressed);
    renameSync(compressedTemporaryPath, rawPath);
    unlinkSync(plainTemporaryPath);
    const summary = compactNoAvpd116msDtInteractionRunV1({
      report,
      rawReportPath: relativeRepoPath(rawPath),
      rawPlaintextSha256: sha256Bytes(plaintext),
      rawCompressedSha256: sha256Bytes(compressed),
      rawCompressedByteLength: compressed.byteLength,
    });
    summaries.push(summary);
    console.log(JSON.stringify({
      stage: "116ms-dt-run-complete",
      dtSec,
      elapsedSec: (performance.now() - startedAt) / 1_000,
      structuralStatus: summary.structuralStatus,
      failureLocalization: summary.failureLocalization,
      stepsAttempted: summary.solverWork.stepsAttempted,
      stepsAccepted: summary.solverWork.stepsAccepted,
      oneBeatNormalizedMax: summary.exactReturnMap.oneBeatNormalizedMax,
      rawReportPath: summary.rawEvidence.sourceReportPath,
    }));
  }

  const artifact = assembleNoAvpd116msDtInteractionArtifactV1(summaries, {
    parameterSha256,
    implementationSha256,
    sourceHarnessImplementationSha256,
    interactionHarnessImplementationSha256: interactionHarnessSha256(),
  });
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = destinationPath + ".tmp-" + process.pid;
  writeFileSync(temporaryPath, JSON.stringify(artifact, null, 2) + "\n");
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

function rawReportPath(dtSec: number): string {
  const label = dtSec === 0.005 ? "dt-5ms" : "dt-2p5ms";
  return resolve(rawDirectory, label + ".json.gz");
}

function parseFailedStepIndex(failureReason: string | null): number | null {
  if (failureReason == null) return null;
  const match = /^step-(\d+):/.exec(failureReason);
  return match == null ? null : Number(match[1]);
}

function integerStepsPerCycle(cycleLengthSec: number, dtSec: number): number | null {
  const ratio = cycleLengthSec / dtSec;
  const rounded = Math.round(ratio);
  return Math.abs(ratio - rounded) <= 1e-10 ? rounded : null;
}

function interactionHarnessSha256(): string {
  const hash = createHash("sha256");
  for (const relativePath of HARNESS_SOURCE_PATHS) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, relativePath)));
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const outputArgumentIndex = process.argv.indexOf("--output");
  const destinationPath = outputArgumentIndex < 0
    ? defaultOutputPath
    : resolve(repoRoot, process.argv[outputArgumentIndex + 1] ?? "");
  if (outputArgumentIndex >= 0 && process.argv[outputArgumentIndex + 1] == null) {
    throw new Error("--output must be followed by a path");
  }
  const startedAt = performance.now();
  const artifact = writeNoAvpd116msDtInteractionV1(destinationPath);
  console.log(JSON.stringify({
    stage: "116ms-dt-interaction-artifact-written",
    outputPath: destinationPath,
    elapsedSec: (performance.now() - startedAt) / 1_000,
    normalizedSha256: artifact.normalizedSha256,
    reproducedExpectedInteraction:
      artifact.comparison.reproducedExpectedInteraction,
    runs: artifact.runs.map((run) => ({
      dtSec: run.dtSec,
      structuralStatus: run.structuralStatus,
      failureLocalization: run.failureLocalization,
      stepsAttempted: run.solverWork.stepsAttempted,
      stepsAccepted: run.solverWork.stepsAccepted,
      oneBeatNormalizedMax: run.exactReturnMap.oneBeatNormalizedMax,
    })),
  }, null, 2));
  if (!artifact.comparison.reproducedExpectedInteraction) process.exitCode = 1;
}
