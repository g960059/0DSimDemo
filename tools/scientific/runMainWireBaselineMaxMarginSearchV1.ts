import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from
  "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  validateMainWireIntegratedModelStandard68CheckpointV1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  evaluateMainWireBaselineCalibrationCandidateV1,
  type MainWireBaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1";
import {
  buildMainWireBaselineSearchDesignV1,
  buildMainWireBaselineSegmentDesignV1,
  compareMainWireBaselineCandidateObjectivesV1,
  scoreMainWireBaselineCandidateObjectiveV1,
  type MainWireBaselineCandidateObjectiveV1,
  type MainWireBaselineSearchCandidateV1,
} from "@/analysis/methods/mainWire/MainWireBaselineMaxMarginSearchV1";
import type {
  MainWireBaselineNumericalFloorAuditV1,
  MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

type SearchWorkerJobV1 = Readonly<{
  candidate: MainWireBaselineSearchCandidateV1;
  sourceCheckpoint: unknown;
  sourceCandidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
}>;

type SearchEvaluationV1 = Readonly<{
  candidateId: string;
  stage: MainWireBaselineSearchCandidateV1["stage"];
  ordinal: number;
  coordinateValues: Readonly<Record<string, number>>;
  transformedCoordinateValues: Readonly<Record<string, number>>;
  sourceCheckpointSha256: string;
  evaluationStatus: MainWireBaselineCalibrationEvaluationV1["status"];
  evaluationPhase: string | null;
  requestIdentitySha256: string | null;
  initializationKind: string | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  classificationStatus: string | null;
  constructionGateStatus: string | null;
  failedConstructionCheckIds: readonly string[];
  objective: MainWireBaselineCandidateObjectiveV1 | null;
  message: string | null;
}>;

type SearchWorkerExecutionV1 = Readonly<{
  evaluation: SearchEvaluationV1;
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  acceptedCheckpoint: MainWireIntegratedModelStandard68CheckpointV1 | null;
}>;

type SearchSeedSelectionV1 = Readonly<{
  artifactPath: string;
  artifactSha256: string;
  searchId: string;
  studyIdentitySha256: string;
  executionCommit: string;
  importedCandidateCount: number;
  defaultedCoordinateIds:
    readonly MainWireBaselineCalibrationParameterIdV1[];
  compatibilityGuard:
    "exact-sources-unchanged-current-parameter-policy-reapplication";
  priorResultRole: "exploratory-seed-selection-only";
  selectedCandidateId: string;
  selectedObjectiveStatus: MainWireBaselineCandidateObjectiveV1["status"];
  selectedFailedCheckIds: readonly MainWireIntegratedModelBaselineValidationCheckIdV1[];
  selectedPrimaryWorstBufferedInteriorMargin: number;
  selectedWorstBufferedInteriorMargin: number;
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
}>;

const encodedWorkerJob = argumentV1("--worker-job");
if (encodedWorkerJob !== null) {
  await runWorkerV1(encodedWorkerJob);
} else {
  await runCoordinatorV1();
}

async function runCoordinatorV1(): Promise<void> {
  const floorPath = resolve(requiredArgumentV1("--numerical-floor"));
  const outputPath = resolve(requiredArgumentV1("--output"));
  const seedReportArgument = argumentV1("--seed-report");
  const reserveRecoverySeedCandidateId = argumentV1(
    "--reserve-recovery-seed-candidate-id",
  );
  const segmentStartCandidateId = argumentV1("--segment-start-candidate-id");
  const segmentEndCandidateId = argumentV1("--segment-end-candidate-id");
  const segmentRequested = segmentStartCandidateId !== null
    || segmentEndCandidateId !== null;
  if ((segmentStartCandidateId === null) !== (segmentEndCandidateId === null)) {
    throw new Error("segment search requires both endpoint candidate IDs");
  }
  if (segmentStartCandidateId === segmentEndCandidateId && segmentRequested) {
    throw new Error("segment search endpoint candidate IDs must differ");
  }
  if (segmentRequested && reserveRecoverySeedCandidateId !== null) {
    throw new Error("segment and reserve-recovery search modes are exclusive");
  }
  if (reserveRecoverySeedCandidateId !== null && seedReportArgument === null) {
    throw new Error("reserve-recovery seed requires --seed-report");
  }
  if (segmentRequested && seedReportArgument === null) {
    throw new Error("segment search requires --seed-report");
  }
  const requestedParallelism = positiveIntegerV1(
    argumentV1("--parallelism") ?? "8",
    "parallelism",
  );
  const numericalFloorJson = JSON.parse(
    await readFile(floorPath, "utf8"),
  ) as unknown;
  const numericalFloor = parseNumericalFloorV1(numericalFloorJson);
  const numericalFloorArtifactSha256 = await sha256CanonicalJsonHex(
    numericalFloorJson,
  );
  const sourceCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      settledBaselineCheckpointJson,
    );
  const baselineDesign = buildMainWireBaselineSearchDesignV1({
    stage: "initial",
  });
  const sourceCandidateInputs = baselineDesign[0].candidateInputs;
  const seedSelection = seedReportArgument === null
    ? null
    : await loadSearchSeedSelectionV1({
        artifactPath: resolve(seedReportArgument),
        numericalFloorArtifactSha256,
        numericalFloors: numericalFloor.metricFloors,
        sourceCheckpointSha256: sourceCheckpoint.checkpointSha256,
        sourceCandidateInputs,
        requestedCandidateId:
          segmentStartCandidateId ?? reserveRecoverySeedCandidateId,
      });
  const segmentEndSelection = segmentEndCandidateId === null
    ? null
    : await loadSearchSeedSelectionV1({
        artifactPath: resolve(seedReportArgument!),
        numericalFloorArtifactSha256,
        numericalFloors: numericalFloor.metricFloors,
        sourceCheckpointSha256: sourceCheckpoint.checkpointSha256,
        sourceCandidateInputs,
        requestedCandidateId: segmentEndCandidateId,
      });
  const largestStageCount = segmentEndSelection !== null
    ? MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy
      .paretoSegmentFractions.length
    : seedSelection === null
    ? Math.max(
        baselineDesign.length,
        MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy
          .refinementCandidateCountIncludingCenter,
      )
    : MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy
      .refinementCandidateCountIncludingCenter;
  const effectiveParallelism = Math.min(
    requestedParallelism,
    Math.max(1, availableParallelism() - 1),
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
      .maximumParallelEvaluations,
    largestStageCount,
  );
  const startedAt = performance.now();
  let completed = 0;
  const progress = ({ evaluation }: SearchWorkerExecutionV1) => {
    completed += 1;
    process.stderr.write(
      `[baseline-search] ${completed} ${evaluation.candidateId}: `
        + `${evaluation.evaluationStatus}, `
        + `${evaluation.objective?.status ?? "unscored"}, `
        + `primary=${formatV1(
          evaluation.objective?.primaryWorstBufferedInteriorMargin ?? null,
        )}, overall=${formatV1(
          evaluation.objective?.worstBufferedInteriorMargin ?? null,
        )}, ${Math.round(evaluation.wallTimeMs)} ms, `
        + `${evaluation.completedCycleCount ?? "-"} cycles\n`,
    );
  };
  let initial: readonly SearchWorkerExecutionV1[];
  let refinement: readonly SearchWorkerExecutionV1[];
  let bestInitialCandidateId: string | null;
  if (seedSelection === null) {
    process.stderr.write(
      `[baseline-search] ${baselineDesign.length} initial candidates, `
        + `${effectiveParallelism} workers\n`,
    );
    initial = await runPoolV1(baselineDesign.map((candidate) =>
      Object.freeze({
        candidate,
        sourceCheckpoint,
        sourceCandidateInputs,
        numericalFloors: numericalFloor.metricFloors,
      })), effectiveParallelism, progress);
    const bestInitial = bestExecutionV1(initial);
    if (bestInitial.acceptedCheckpoint === null) {
      throw new Error("best initial candidate has no accepted checkpoint");
    }
    bestInitialCandidateId = bestInitial.evaluation.candidateId;
    const refinementCandidates = buildMainWireBaselineSearchDesignV1({
      stage: "refinement",
      center: bestInitial.candidateInputs,
    });
    process.stderr.write(
      `[baseline-search] ${refinementCandidates.length} refinement candidates `
        + `around ${bestInitial.evaluation.candidateId}\n`,
    );
    refinement = await runPoolV1(refinementCandidates.map((candidate) =>
      Object.freeze({
        candidate,
        sourceCheckpoint: bestInitial.acceptedCheckpoint,
        sourceCandidateInputs: bestInitial.candidateInputs,
        numericalFloors: numericalFloor.metricFloors,
      })), effectiveParallelism, progress);
  } else if (segmentEndSelection !== null) {
    initial = Object.freeze([]);
    bestInitialCandidateId = null;
    const segmentCandidates = buildMainWireBaselineSegmentDesignV1({
      start: seedSelection.candidateInputs,
      end: segmentEndSelection.candidateInputs,
    });
    process.stderr.write(
      `[baseline-search] verified segment ${seedSelection.selectedCandidateId}`
        + ` -> ${segmentEndSelection.selectedCandidateId}; `
        + `${segmentCandidates.length} points, ${effectiveParallelism} workers\n`,
    );
    const start = (await runPoolV1([Object.freeze({
      candidate: segmentCandidates[0],
      sourceCheckpoint,
      sourceCandidateInputs,
      numericalFloors: numericalFloor.metricFloors,
    })], 1, progress))[0];
    if (start.acceptedCheckpoint === null) {
      throw new Error("segment start did not produce an accepted checkpoint");
    }
    const remaining = await runPoolV1(
      segmentCandidates.slice(1).map((candidate) => Object.freeze({
        candidate,
        sourceCheckpoint: start.acceptedCheckpoint!,
        sourceCandidateInputs: start.candidateInputs,
        numericalFloors: numericalFloor.metricFloors,
      })),
      effectiveParallelism,
      progress,
    );
    refinement = Object.freeze([start, ...remaining]);
  } else {
    initial = Object.freeze([]);
    bestInitialCandidateId = null;
    const recovery = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
      .searchPolicy.preloadReserveRecovery;
    const refinementCandidates = buildMainWireBaselineSearchDesignV1({
      stage: "refinement",
      center: seedSelection.candidateInputs,
      contractionOverride: reserveRecoverySeedCandidateId === null
        ? undefined
        : recovery.refinementContraction,
      coordinateBounds: reserveRecoverySeedCandidateId === null
        ? undefined
        : Object.freeze({
            "hemodynamics.total-blood-volume-ml": Object.freeze({
              maximum: recovery.maximumOperatingTotalBloodVolumeMl,
            }),
          }),
    });
    process.stderr.write(
      `[baseline-search] verified prior report selected `
        + `${seedSelection.selectedCandidateId}; re-evaluating its center, then `
        + `${refinementCandidates.length - 1} neighbours with `
        + `${effectiveParallelism} workers\n`,
    );
    const center = (await runPoolV1([Object.freeze({
      candidate: refinementCandidates[0],
      sourceCheckpoint,
      sourceCandidateInputs,
      numericalFloors: numericalFloor.metricFloors,
    })], 1, progress))[0];
    if (center.acceptedCheckpoint === null) {
      throw new Error("imported search seed did not produce an accepted checkpoint");
    }
    const neighbours = await runPoolV1(
      refinementCandidates.slice(1).map((candidate) => Object.freeze({
        candidate,
        sourceCheckpoint: center.acceptedCheckpoint!,
        sourceCandidateInputs: center.candidateInputs,
        numericalFloors: numericalFloor.metricFloors,
      })),
      effectiveParallelism,
      progress,
    );
    refinement = Object.freeze([center, ...neighbours]);
  }
  const all = [...initial, ...refinement];
  const ranked = rankExecutionsV1(all);
  const best = ranked[0];
  if (best === undefined || best.evaluation.objective === null) {
    throw new Error("baseline search produced no scored candidate");
  }
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const finalists = ranked.slice(0, policy.finalistCount);
  const feasiblePrimaryMargins = ranked.flatMap(({ evaluation }) => {
    const objective = evaluation.objective;
    return objective?.status === "feasible"
        && objective.primaryWorstBufferedInteriorMargin !== null
      ? [objective.primaryWorstBufferedInteriorMargin]
      : [];
  });
  const maximumFeasiblePrimaryMargin = feasiblePrimaryMargins.length === 0
    ? Number.NEGATIVE_INFINITY
    : Math.max(...feasiblePrimaryMargins);
  const primaryEquivalent = ranked.filter(({ evaluation }) => {
    const objective = evaluation.objective;
    return objective?.status === "feasible"
      && objective.primaryWorstBufferedInteriorMargin !== null
      && maximumFeasiblePrimaryMargin
        - objective.primaryWorstBufferedInteriorMargin
        <= policy.equivalentPrimaryMarginEpsilon;
  });
  const bestEquivalentOverallMargin = primaryEquivalent.length === 0
    ? Number.NEGATIVE_INFINITY
    : Math.max(...primaryEquivalent.map(({ evaluation }) =>
        evaluation.objective?.worstBufferedInteriorMargin
          ?? Number.NEGATIVE_INFINITY));
  const equivalentCandidateIds = primaryEquivalent
    .filter(({ evaluation }) => {
      const margin = evaluation.objective?.worstBufferedInteriorMargin;
      return margin !== null && margin !== undefined
        && bestEquivalentOverallMargin - margin
          <= policy.equivalentWorstMarginEpsilon;
    }).map(({ evaluation }) => evaluation.candidateId);
  const study = await compileMainWireBaselineConditioningStudyV1();
  const protocolCommit = gitV1([
    "log",
    "-1",
    "--format=%H",
    "--",
    "analysis/policies/mainWire/MainWireBaselineConditioningStudyV1.ts",
  ]);
  const executionCommit = gitV1(["rev-parse", "HEAD"]);
  const batchWallTimeMs = performance.now() - startedAt;
  const summedEvaluationWallTimeMs = all.reduce((sum, execution) =>
    sum + execution.evaluation.wallTimeMs, 0);
  const report = Object.freeze({
    schemaVersion: 1 as const,
    searchId: segmentEndSelection !== null
      ? "main-wire-baseline-pareto-segment-search-result-v1" as const
      : reserveRecoverySeedCandidateId === null
        ? "main-wire-baseline-max-margin-search-result-v2" as const
        : "main-wire-baseline-preload-reserve-recovery-search-result-v1" as const,
    studyIdentitySha256: study.studyIdentitySha256,
    protocolCommit,
    executionCommit,
    numericalFloorArtifactPath: portableRepositoryPathV1(floorPath),
    numericalFloorArtifactSha256,
    executionMode: segmentEndSelection !== null
      ? "verified-report-seeded-transformed-coordinate-segment" as const
      : seedSelection === null
      ? "full-initial-and-refinement" as const
      : reserveRecoverySeedCandidateId === null
        ? "verified-report-seeded-refinement" as const
        : "verified-report-seeded-preload-reserve-recovery" as const,
    preloadReserveRecoveryPolicy: reserveRecoverySeedCandidateId === null
      ? null
      : policy.preloadReserveRecovery,
    seedSelection: seedSelection === null
      ? null
      : searchSeedSelectionReportV1(seedSelection),
    segmentSelection: segmentEndSelection === null || seedSelection === null
      ? null
      : Object.freeze({
          start: searchSeedSelectionReportV1(seedSelection),
          end: searchSeedSelectionReportV1(segmentEndSelection),
          interpolationSpace:
            "parameter-declared-transformed-coordinate" as const,
          fractions: MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
            .searchPolicy.paretoSegmentFractions,
        }),
    requestedParallelism,
    effectiveParallelism,
    batchWallTimeMs,
    summedEvaluationWallTimeMs,
    observedThroughputSpeedup: batchWallTimeMs > 0
      ? summedEvaluationWallTimeMs / batchWallTimeMs
      : 0,
    initialCandidateCount: initial.length,
    refinementCandidateCount: refinement.length,
    acceptedCandidateCount: all.filter(({ evaluation }) =>
      evaluation.evaluationStatus === "accepted").length,
    feasibleCandidateCount: all.filter(({ evaluation }) =>
      evaluation.objective?.status === "feasible").length,
    rankingPolicy: Object.freeze({
      first: "all-construction-gates-and-floor-buffers-feasible" as const,
      second: "within-epsilon-of-maximum-primary-interior" as const,
      third: "maximum-overall-interior" as const,
      fourth: "minimum-reference-departure" as const,
      primaryMarginEpsilon: policy.equivalentPrimaryMarginEpsilon,
      overallMarginEpsilon: policy.equivalentWorstMarginEpsilon,
    }),
    bestInitialCandidateId,
    bestCandidateId: best.evaluation.candidateId,
    maximumFeasiblePrimaryMargin,
    bestPrimaryEquivalentOverallMargin: bestEquivalentOverallMargin,
    finalistCandidateIds: Object.freeze(finalists.map(({ evaluation }) =>
      evaluation.candidateId)),
    equivalentCandidateIds: Object.freeze(equivalentCandidateIds),
    ranking: Object.freeze(ranked.map(({ evaluation }, index) =>
      Object.freeze({ rank: index + 1, candidateId: evaluation.candidateId }))),
    evaluations: Object.freeze(all.map(({ evaluation }) => evaluation)),
    claim: Object.freeze({
      evidenceRole: "construction" as const,
      restCorridorsOnly: true as const,
      primaryInteriorBeforeMacroHemodynamics: true as const,
      preloadReserveRecoveryScreenRequired:
        (reserveRecoverySeedCandidateId !== null
          || segmentEndSelection !== null) as boolean,
      preloadReserveQualified: false as const,
      perturbationSafetyQualified: false as const,
      finalistRefinedDtQualified: false as const,
      uniqueParameterVectorClaimed: false as const,
      selectionClaimed: false as const,
    }),
  });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

async function runWorkerV1(encoded: string): Promise<void> {
  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  const job = parseWorkerJobV1(JSON.parse(decoded) as unknown);
  const sourceCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      job.sourceCheckpoint,
    );
  const exactSource = sameCoordinatesV1(
    job.candidate.candidateInputs,
    job.sourceCandidateInputs,
  );
  const evaluation = await evaluateMainWireBaselineCalibrationCandidateV1({
    hemodynamicResearchInputs:
      job.candidate.candidateInputs.hemodynamicResearchInputs,
    mechanismResearchInputs:
      job.candidate.candidateInputs.mechanismResearchInputs,
    ventricularContractilityScale:
      job.candidate.candidateInputs.ventricularContractilityScale,
    nominalDtSec:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
        .explorationNominalDtSec,
    initialization: exactSource
      ? Object.freeze({
          kind: "standard68-exact-checkpoint" as const,
          checkpoint: sourceCheckpoint,
        })
      : Object.freeze({
          kind: "standard68-parameter-continuation" as const,
          sourceCheckpoint,
          sourceHemodynamicResearchInputs:
            job.sourceCandidateInputs.hemodynamicResearchInputs,
          sourceVentricularContractilityScale:
            job.sourceCandidateInputs.ventricularContractilityScale,
          sourceMechanismResearchInputs:
            job.sourceCandidateInputs.mechanismResearchInputs,
        }),
  });
  const compact = compactEvaluationV1(
    job.candidate,
    sourceCheckpoint.checkpointSha256,
    evaluation,
    job.numericalFloors,
  );
  process.stdout.write(JSON.stringify(Object.freeze({
    evaluation: compact,
    candidateInputs: job.candidate.candidateInputs,
    acceptedCheckpoint: evaluation.status === "accepted"
      ? evaluation.exactResult.checkpoint
      : null,
  })));
}

function compactEvaluationV1(
  candidate: MainWireBaselineSearchCandidateV1,
  sourceCheckpointSha256: string,
  evaluation: MainWireBaselineCalibrationEvaluationV1,
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[],
): SearchEvaluationV1 {
  const common = Object.freeze({
    candidateId: candidate.candidateId,
    stage: candidate.stage,
    ordinal: candidate.ordinal,
    coordinateValues: candidate.coordinateValues,
    transformedCoordinateValues: candidate.transformedCoordinateValues,
    sourceCheckpointSha256,
  });
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      ...common,
      evaluationStatus: evaluation.status,
      evaluationPhase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      initializationKind: null,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      classificationStatus: evaluation.partial?.classificationStatus ?? null,
      constructionGateStatus: null,
      failedConstructionCheckIds: Object.freeze([]),
      objective: null,
      message: evaluation.message,
    });
  }
  return Object.freeze({
    ...common,
    evaluationStatus: evaluation.status,
    evaluationPhase: null,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    initializationKind: evaluation.initializationKind,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    objective: scoreMainWireBaselineCandidateObjectiveV1({
      checks: evaluation.exactResult.checks,
      candidate: candidate.candidateInputs,
      numericalFloors,
    }),
    message: null,
  });
}

async function runPoolV1(
  jobs: readonly SearchWorkerJobV1[],
  parallelism: number,
  onCompleted: (execution: SearchWorkerExecutionV1) => void,
): Promise<readonly SearchWorkerExecutionV1[]> {
  let nextIndex = 0;
  const results = new Array<SearchWorkerExecutionV1>(jobs.length);
  const active = new Set<ChildProcessWithoutNullStreams>();
  const stop = () => {
    for (const child of active) child.kill("SIGTERM");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await Promise.all(Array.from({ length: parallelism }, async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= jobs.length) return;
        const spawned = spawnWorkerV1(jobs[index]);
        active.add(spawned.process);
        let execution: SearchWorkerExecutionV1;
        try {
          execution = await spawned.result;
        } finally {
          active.delete(spawned.process);
        }
        results[index] = execution;
        onCompleted(execution);
      }
    }));
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
  return Object.freeze(results);
}

function spawnWorkerV1(job: SearchWorkerJobV1): Readonly<{
  process: ChildProcessWithoutNullStreams;
  result: Promise<SearchWorkerExecutionV1>;
}> {
  const executable = resolve(process.cwd(), "node_modules/.bin/vite-node");
  const script = fileURLToPath(import.meta.url);
  const encoded = Buffer.from(JSON.stringify(job), "utf8").toString("base64url");
  const child = spawn(executable, [
    "--script",
    script,
    "--worker-job",
    encoded,
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const result = new Promise<SearchWorkerExecutionV1>((resolveResult, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 2_000_000) {
        child.kill("SIGTERM");
        reject(new Error(`search worker output overflow: ${job.candidate.candidateId}`));
      }
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      if (stderr.length > 100_000) stderr = stderr.slice(-100_000);
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code !== 0) {
        reject(new Error(
          `search worker ${job.candidate.candidateId} exited ${code ?? signal}: `
            + stderr.trim(),
        ));
        return;
      }
      try {
        resolveResult(parseWorkerExecutionV1(JSON.parse(stdout) as unknown));
      } catch (error) {
        reject(new Error(
          `search worker ${job.candidate.candidateId} returned invalid JSON: `
            + (error instanceof Error ? error.message : String(error)),
        ));
      }
    });
  });
  return Object.freeze({ process: child, result });
}

function bestExecutionV1(
  evaluations: readonly SearchWorkerExecutionV1[],
): SearchWorkerExecutionV1 {
  const ranked = rankExecutionsV1(evaluations).filter(({ evaluation }) =>
    evaluation.objective !== null);
  const best = ranked[0];
  if (best === undefined) throw new Error("baseline search produced no scored candidate");
  return best;
}

function rankExecutionsV1(
  evaluations: readonly SearchWorkerExecutionV1[],
): readonly SearchWorkerExecutionV1[] {
  return rankByObjectiveV1(
    evaluations,
    ({ evaluation }) => evaluation.objective,
  );
}

/**
 * Gives the adjustable macro-hemodynamic margins a real tie-breaking role
 * without allowing them to outrank a meaningfully better structural fit.
 */
function rankByObjectiveV1<T>(
  values: readonly T[],
  objectiveOf: (value: T) => MainWireBaselineCandidateObjectiveV1 | null,
): readonly T[] {
  const primaryEpsilon = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.equivalentPrimaryMarginEpsilon;
  const overallEpsilon = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.equivalentWorstMarginEpsilon;
  const feasiblePrimaryMargins = values.flatMap((value) => {
    const objective = objectiveOf(value);
    return objective?.status === "feasible"
        && objective.primaryWorstBufferedInteriorMargin !== null
      ? [objective.primaryWorstBufferedInteriorMargin]
      : [];
  });
  const bestPrimaryMargin = feasiblePrimaryMargins.length === 0
    ? Number.NEGATIVE_INFINITY
    : Math.max(...feasiblePrimaryMargins);
  const primaryEquivalentObjectives = values.flatMap((value) => {
    const objective = objectiveOf(value);
    return objective?.status === "feasible"
        && objective.primaryWorstBufferedInteriorMargin !== null
        && bestPrimaryMargin - objective.primaryWorstBufferedInteriorMargin
          <= primaryEpsilon
      ? [objective]
      : [];
  });
  const bestOverallMargin = primaryEquivalentObjectives.length === 0
    ? Number.NEGATIVE_INFINITY
    : Math.max(...primaryEquivalentObjectives.map((objective) =>
        objective.worstBufferedInteriorMargin ?? Number.NEGATIVE_INFINITY));
  const categoryV1 = (objective: MainWireBaselineCandidateObjectiveV1 | null) => {
    if (objective === null) return 4;
    if (objective.status !== "feasible") return 3;
    const primary = objective.primaryWorstBufferedInteriorMargin;
    if (primary === null || bestPrimaryMargin - primary > primaryEpsilon) {
      return 2;
    }
    const overall = objective.worstBufferedInteriorMargin;
    return overall !== null && bestOverallMargin - overall <= overallEpsilon
      ? 0
      : 1;
  };
  return Object.freeze([...values].sort((left, right) => {
    const leftObjective = objectiveOf(left);
    const rightObjective = objectiveOf(right);
    const leftCategory = categoryV1(leftObjective);
    const rightCategory = categoryV1(rightObjective);
    if (leftCategory !== rightCategory) return leftCategory - rightCategory;
    if (leftObjective === null || rightObjective === null) return 0;
    if (leftCategory === 0) {
      if (leftObjective.referenceDepartureRms
        !== rightObjective.referenceDepartureRms) {
        return leftObjective.referenceDepartureRms
          - rightObjective.referenceDepartureRms;
      }
    }
    if (leftCategory === 1) {
      const leftOverall = leftObjective.worstBufferedInteriorMargin
        ?? Number.NEGATIVE_INFINITY;
      const rightOverall = rightObjective.worstBufferedInteriorMargin
        ?? Number.NEGATIVE_INFINITY;
      if (leftOverall !== rightOverall) return rightOverall - leftOverall;
    }
    return compareMainWireBaselineCandidateObjectivesV1(
      leftObjective,
      rightObjective,
    );
  }));
}

function sameCoordinatesV1(
  left: MainWireBaselineCalibrationCandidateInputsV1,
  right: MainWireBaselineCalibrationCandidateInputsV1,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function loadSearchSeedSelectionV1(input: Readonly<{
  artifactPath: string;
  numericalFloorArtifactSha256: string;
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
  sourceCheckpointSha256: string;
  sourceCandidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  requestedCandidateId: string | null;
}>): Promise<SearchSeedSelectionV1> {
  const artifactJson = JSON.parse(
    await readFile(input.artifactPath, "utf8"),
  ) as unknown;
  const artifactSha256 = await sha256CanonicalJsonHex(artifactJson);
  const report = recordV1(artifactJson, "seed search report");
  const searchId = stringFieldV1(report, "searchId", "seed search report");
  const studyIdentitySha256 = sha256FieldV1(
    report,
    "studyIdentitySha256",
    "seed search report",
  );
  const executionCommit = sha1FieldV1(
    report,
    "executionCommit",
    "seed search report",
  );
  const reportNumericalFloorSha256 = sha256FieldV1(
    report,
    "numericalFloorArtifactSha256",
    "seed search report",
  );
  if (reportNumericalFloorSha256 !== input.numericalFloorArtifactSha256) {
    throw new Error("seed search report uses a different numerical-floor artifact");
  }
  if (gitV1(["merge-base", executionCommit, "HEAD"]) !== executionCommit) {
    throw new Error("seed search execution commit is not an ancestor of HEAD");
  }
  const guardedPaths = Object.freeze([
    "engine",
    "analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1.ts",
    "data/physiology/main-wire-normal-reference-evidence-v1.json",
    "studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json",
  ]);
  const changedGuardedPaths = gitV1([
    "diff",
    "--name-only",
    `${executionCommit}..HEAD`,
    "--",
    ...guardedPaths,
  ]);
  if (changedGuardedPaths !== "") {
    throw new Error(
      "seed search compatibility guard detected changed exact/evaluator sources: "
        + changedGuardedPaths.replaceAll("\n", ", "),
    );
  }
  const parameterPolicyChanged = gitV1([
    "diff",
    "--name-only",
    `${executionCommit}..HEAD`,
    "--",
    "analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1.ts",
  ]);
  if (parameterPolicyChanged !== "" && input.requestedCandidateId === null) {
    throw new Error(
      "automatic seed selection is unavailable after a parameter-policy change",
    );
  }
  const rawEvaluations = report.evaluations;
  if (!Array.isArray(rawEvaluations) || rawEvaluations.length < 1) {
    throw new Error("seed search report has no evaluations");
  }
  const coordinateIds = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.coordinateIds;
  let defaultedCoordinateIds:
    readonly MainWireBaselineCalibrationParameterIdV1[] | null = null;
  const expectedCheckIds = new Set(input.numericalFloors.map(({ checkId }) =>
    checkId));
  const imported = rawEvaluations.flatMap((rawEvaluation, index) => {
    const evaluation = recordV1(
      rawEvaluation,
      `seed search evaluation ${index}`,
    );
    if (evaluation.evaluationStatus !== "accepted") return [];
    const candidateId = stringFieldV1(
      evaluation,
      "candidateId",
      `seed search evaluation ${index}`,
    );
    const coordinateValues = recordV1(
      evaluation.coordinateValues,
      `seed search evaluation ${candidateId} coordinates`,
    );
    const coordinateKeys = Object.keys(coordinateValues).sort();
    const unknownCoordinateIds = coordinateKeys.filter((coordinateId) =>
      !coordinateIds.includes(
        coordinateId as MainWireBaselineCalibrationParameterIdV1,
      ));
    const missingCoordinateIds = coordinateIds.filter((coordinateId) =>
      !coordinateKeys.includes(coordinateId));
    if (
      unknownCoordinateIds.length > 0
      || (missingCoordinateIds.length > 0
        && input.requestedCandidateId === null)
    ) {
      throw new Error(`seed search evaluation ${candidateId} coordinate set differs`);
    }
    if (defaultedCoordinateIds === null) {
      defaultedCoordinateIds = Object.freeze([...missingCoordinateIds]);
    } else if (
      JSON.stringify(defaultedCoordinateIds)
        !== JSON.stringify(missingCoordinateIds)
    ) {
      throw new Error("seed search evaluations have inconsistent coordinate sets");
    }
    const updates = coordinateIds.map((parameterId) => Object.freeze({
      parameterId,
      value: coordinateKeys.includes(parameterId)
        ? finiteNumberFieldV1(
            coordinateValues,
            parameterId,
            `seed search evaluation ${candidateId} coordinates`,
          )
        : readMainWireBaselineCalibrationParameterV1(
            input.sourceCandidateInputs,
            parameterId,
          ),
    }));
    const candidateInputs = applyMainWireBaselineCalibrationParametersV1(
      input.sourceCandidateInputs,
      updates,
    );
    const priorObjective = recordV1(
      evaluation.objective,
      `seed search evaluation ${candidateId} objective`,
    );
    if (!Array.isArray(priorObjective.margins)) {
      throw new Error(`seed search evaluation ${candidateId} has no margins`);
    }
    const failedConstructionCheckIds = new Set(
      stringArrayV1(
        evaluation.failedConstructionCheckIds,
        `seed search evaluation ${candidateId} failed checks`,
      ),
    );
    const checks = priorObjective.margins.map((rawMargin, marginIndex) => {
      const margin = recordV1(
        rawMargin,
        `seed search evaluation ${candidateId} margin ${marginIndex}`,
      );
      const checkId = stringFieldV1(
        margin,
        "checkId",
        `seed search evaluation ${candidateId} margin ${marginIndex}`,
      ) as MainWireIntegratedModelBaselineValidationCheckIdV1;
      if (!expectedCheckIds.has(checkId)) {
        throw new Error(
          `seed search evaluation ${candidateId} has unexpected check ${checkId}`,
        );
      }
      return Object.freeze({
        checkId,
        status: failedConstructionCheckIds.has(checkId)
          ? "failed" as const
          : "passed" as const,
        actual: finiteNumberFieldV1(margin, "actual", `margin ${checkId}`),
        minimum: finiteNumberFieldV1(margin, "minimum", `margin ${checkId}`),
        maximum: finiteNumberFieldV1(margin, "maximum", `margin ${checkId}`),
        unit: stringFieldV1(margin, "unit", `margin ${checkId}`),
      });
    });
    if (
      checks.length !== expectedCheckIds.size
      || new Set(checks.map(({ checkId }) => checkId)).size
        !== expectedCheckIds.size
    ) {
      throw new Error(`seed search evaluation ${candidateId} check set differs`);
    }
    const objective = scoreMainWireBaselineCandidateObjectiveV1({
      checks: checks as readonly MainWireIntegratedModelBaselineValidationCheckV1[],
      candidate: candidateInputs,
      numericalFloors: input.numericalFloors,
    });
    return [Object.freeze({ candidateId, candidateInputs, objective })];
  });
  if (imported.length === 0) {
    throw new Error("seed search report has no accepted scored candidate");
  }
  const baselineCheckpointWasUsed = rawEvaluations.some((rawEvaluation) => {
    if (rawEvaluation === null || typeof rawEvaluation !== "object") return false;
    return (rawEvaluation as Record<string, unknown>).sourceCheckpointSha256
      === input.sourceCheckpointSha256;
  });
  if (!baselineCheckpointWasUsed) {
    throw new Error("seed search report does not bind the current baseline checkpoint");
  }
  const selected = input.requestedCandidateId === null
    ? rankByObjectiveV1(imported, ({ objective }) => objective)[0]
    : imported.find(({ candidateId }) =>
        candidateId === input.requestedCandidateId);
  const recovery = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.preloadReserveRecovery;
  const allowedSeedFailureCheckIds = new Set(normalReferenceEvidenceV1
    .checkGroups.filter(({ groupId }) =>
      recovery.allowedSeedFailureGroupIds.includes(
        groupId as typeof recovery.allowedSeedFailureGroupIds[number],
      ))
    .flatMap(({ checkIds }) => checkIds));
  if (
    selected === undefined
    || selected.objective.primaryWorstBufferedInteriorMargin === null
    || selected.objective.worstBufferedInteriorMargin === null
  ) {
    throw new Error("seed search report has no scored structural-first seed");
  }
  if (input.requestedCandidateId === null && selected.objective.status !== "feasible") {
    throw new Error("seed search report has no feasible structural-first seed");
  }
  if (
    input.requestedCandidateId !== null
    && (
      selected.objective.primaryWorstBufferedInteriorMargin
        < recovery.minimumSeedPrimaryBufferedInteriorMargin
      || selected.objective.failedCheckIds.some((checkId) =>
        !allowedSeedFailureCheckIds.has(checkId))
    )
  ) {
    throw new Error(
      `requested reserve-recovery seed is not structurally admissible: `
        + selected.objective.failedCheckIds.join(", "),
    );
  }
  return Object.freeze({
    artifactPath: input.artifactPath,
    artifactSha256,
    searchId,
    studyIdentitySha256,
    executionCommit,
    importedCandidateCount: imported.length,
    defaultedCoordinateIds: defaultedCoordinateIds ?? Object.freeze([]),
    compatibilityGuard:
      "exact-sources-unchanged-current-parameter-policy-reapplication" as const,
    priorResultRole: "exploratory-seed-selection-only" as const,
    selectedCandidateId: selected.candidateId,
    selectedObjectiveStatus: selected.objective.status,
    selectedFailedCheckIds: selected.objective.failedCheckIds,
    selectedPrimaryWorstBufferedInteriorMargin:
      selected.objective.primaryWorstBufferedInteriorMargin,
    selectedWorstBufferedInteriorMargin:
      selected.objective.worstBufferedInteriorMargin,
    candidateInputs: selected.candidateInputs,
  });
}

function searchSeedSelectionReportV1(
  selection: SearchSeedSelectionV1,
): Omit<SearchSeedSelectionV1, "candidateInputs"> {
  return Object.freeze({
    artifactPath: portableRepositoryPathV1(selection.artifactPath),
    artifactSha256: selection.artifactSha256,
    searchId: selection.searchId,
    studyIdentitySha256: selection.studyIdentitySha256,
    executionCommit: selection.executionCommit,
    importedCandidateCount: selection.importedCandidateCount,
    defaultedCoordinateIds: selection.defaultedCoordinateIds,
    compatibilityGuard: selection.compatibilityGuard,
    priorResultRole: selection.priorResultRole,
    selectedCandidateId: selection.selectedCandidateId,
    selectedObjectiveStatus: selection.selectedObjectiveStatus,
    selectedFailedCheckIds: selection.selectedFailedCheckIds,
    selectedPrimaryWorstBufferedInteriorMargin:
      selection.selectedPrimaryWorstBufferedInteriorMargin,
    selectedWorstBufferedInteriorMargin:
      selection.selectedWorstBufferedInteriorMargin,
  });
}

function parseNumericalFloorV1(input: unknown): MainWireBaselineNumericalFloorAuditV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("numerical-floor artifact must be an object");
  }
  const record = input as Partial<MainWireBaselineNumericalFloorAuditV1>;
  if (
    record.auditId !== "main-wire-baseline-numerical-floor-audit-v1"
    || record.status !== "completed"
    || !Array.isArray(record.metricFloors)
    || record.metricFloors.length < 1
  ) {
    throw new Error("numerical-floor artifact is incomplete");
  }
  return input as MainWireBaselineNumericalFloorAuditV1;
}

function parseWorkerJobV1(input: unknown): SearchWorkerJobV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("search worker job must be an object");
  }
  const record = input as Record<string, unknown>;
  if (
    record.candidate === null || typeof record.candidate !== "object"
    || record.sourceCheckpoint === null
      || typeof record.sourceCheckpoint !== "object"
    || record.sourceCandidateInputs === null
      || typeof record.sourceCandidateInputs !== "object"
    || !Array.isArray(record.numericalFloors)
  ) {
    throw new Error("search worker job is incomplete");
  }
  return input as SearchWorkerJobV1;
}

function parseWorkerExecutionV1(input: unknown): SearchWorkerExecutionV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("search worker execution must be an object");
  }
  const record = input as Record<string, unknown>;
  if (
    record.evaluation === null || typeof record.evaluation !== "object"
    || record.candidateInputs === null
      || typeof record.candidateInputs !== "object"
  ) {
    throw new Error("search worker execution is incomplete");
  }
  return input as SearchWorkerExecutionV1;
}

function recordV1(input: unknown, label: string): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be an object`);
  }
  return input as Record<string, unknown>;
}

function stringFieldV1(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value;
}

function finiteNumberFieldV1(
  record: Record<string, unknown>,
  key: string,
  label: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label}.${key} must be finite`);
  }
  return value;
}

function stringArrayV1(input: unknown, label: string): readonly string[] {
  if (!Array.isArray(input) || !input.every((value) => typeof value === "string")) {
    throw new Error(`${label} must be a string array`);
  }
  return input;
}

function sha256FieldV1(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const value = stringFieldV1(record, key, label);
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label}.${key} must be a SHA-256 hex digest`);
  }
  return value;
}

function sha1FieldV1(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const value = stringFieldV1(record, key, label);
  if (!/^[0-9a-f]{40}$/.test(value)) {
    throw new Error(`${label}.${key} must be a Git commit SHA`);
  }
  return value;
}

function portableRepositoryPathV1(absolutePath: string): string {
  const portable = relative(process.cwd(), absolutePath);
  if (
    portable === ""
    || portable === ".."
    || portable.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    || isAbsolute(portable)
  ) {
    throw new Error(`artifact must be inside the repository: ${absolutePath}`);
  }
  return portable;
}

function argumentV1(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function requiredArgumentV1(name: string): string {
  const value = argumentV1(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
}

function positiveIntegerV1(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function gitV1(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function formatV1(value: number | null): string {
  return value === null ? "-" : value.toFixed(4);
}
