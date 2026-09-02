import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from
  "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
import type {
  MainWireIntegratedModelRoundedEjectionCandidateInitializationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";
import {
  evaluateMainWireBaselineCalibrationCandidateV1,
  type MainWireBaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1";
import {
  scoreMainWireBaselineCandidateObjectiveV1,
  type MainWireBaselineCandidateObjectiveV1,
} from "@/analysis/methods/mainWire/MainWireBaselineMaxMarginSearchV1";
import type {
  MainWireBaselineNumericalFloorAuditV1,
  MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  composeMainWireBaselineFinalistComparisonToleranceV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  qualifyMainWireIntegratedModelFormalPreloadReserveV1,
  type MainWireIntegratedModelFormalPreloadReserveQualificationV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  applyMainWireBaselineCalibrationParametersV1,
  assertMainWireBaselineCalibrationCandidateOnReleaseLatticeV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";
import {
  assertMainWireStandard69PreloadReservePassedV1,
} from "@/analysis/policies/mainWire/MainWireStandard69PreloadReservePolicyV1";

const QUALIFICATION_ID =
  "main-wire-baseline-finalist-qualification-v1" as const;

type EvaluationLabelV1 =
  | "rest-continuation-2ms"
  | "rest-cold-2ms"
  | "rest-cold-1ms"
  | "safety-hr70-cold-2ms"
  | "safety-afterload-plus-10-percent-2ms";

type EvaluationJobV1 = Readonly<{
  kind: "evaluation";
  label: EvaluationLabelV1;
  candidate: MainWireBaselineCalibrationCandidateInputsV1;
  nominalDtSec: number;
  initialization: MainWireIntegratedModelRoundedEjectionCandidateInitializationV1;
  returnCheckpoint: boolean;
}>;

type PreloadReserveJobV1 = Readonly<{
  kind: "formal-preload-reserve";
  label: "formal-preload-reserve";
  candidate: MainWireBaselineCalibrationCandidateInputsV1;
  checkpoint: MainWireIntegratedModelStandard68CheckpointV1;
}>;

type WorkerJobV1 = EvaluationJobV1 | PreloadReserveJobV1;

type CompactEvaluationV1 = Readonly<{
  status: MainWireBaselineCalibrationEvaluationV1["status"];
  phase: string | null;
  requestIdentitySha256: string | null;
  exactModelIdentitySha256: string | null;
  analysisMethodId: string | null;
  constructionPolicyRevisionId: string | null;
  initializationKind: string | null;
  nominalDtSec: number | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  classificationStatus: string | null;
  constructionGateStatus: string | null;
  failedConstructionCheckIds: readonly string[];
  checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
  measurements: unknown | null;
  checkpointSha256: string | null;
  message: string | null;
}>;

type EvaluationExecutionV1 = Readonly<{
  kind: "evaluation";
  label: EvaluationLabelV1;
  evaluation: CompactEvaluationV1;
  checkpoint: MainWireIntegratedModelStandard68CheckpointV1 | null;
}>;

type PreloadReserveExecutionV1 = Readonly<{
  kind: "formal-preload-reserve";
  label: "formal-preload-reserve";
  status: "passed" | "failed";
  wallTimeMs: number;
  qualification: MainWireIntegratedModelFormalPreloadReserveQualificationV1 | null;
  message: string | null;
}>;

type WorkerExecutionV1 = EvaluationExecutionV1 | PreloadReserveExecutionV1;

type SearchCandidateV1 = Readonly<{
  searchArtifactPath: string;
  searchArtifactSha256: string;
  searchId: string;
  searchExecutionCommit: string;
  studyIdentitySha256: string;
  numericalFloorArtifactSha256: string;
  candidateId: string;
  coordinateValues: Readonly<Record<string, number>>;
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
}>;

const encodedWorkerJob = argumentV1("--worker-job");
if (encodedWorkerJob !== null) {
  await runWorkerV1(encodedWorkerJob);
} else {
  await runCoordinatorV1();
}

async function runCoordinatorV1(): Promise<void> {
  const scope = parseScopeV1(argumentV1("--scope") ?? "full");
  const searchArtifactPath = resolve(requiredArgumentV1("--search-report"));
  const candidateId = requiredArgumentV1("--candidate-id");
  const floorArtifactPath = resolve(requiredArgumentV1("--numerical-floor"));
  const outputPath = resolve(requiredArgumentV1("--output"));
  const checkpointOutputArgument = argumentV1("--checkpoint-output");
  const checkpointOutputPath = checkpointOutputArgument === null
    ? null
    : resolve(checkpointOutputArgument);
  if (scope === "preload-only" && checkpointOutputArgument !== null) {
    throw new Error("preload-only screening does not persist a checkpoint");
  }
  if (checkpointOutputPath !== null) {
    portableRepositoryPathV1(checkpointOutputPath);
  }
  const requestedParallelism = positiveIntegerV1(
    argumentV1("--parallelism") ?? "5",
    "parallelism",
  );
  const floorJson = JSON.parse(await readFile(floorArtifactPath, "utf8")) as unknown;
  const numericalFloor = parseNumericalFloorV1(floorJson);
  const numericalFloorArtifactSha256 = await sha256CanonicalJsonHex(floorJson);
  const searchCandidate = await loadSearchCandidateV1({
    artifactPath: searchArtifactPath,
    candidateId,
    numericalFloorArtifactSha256,
    requireFinalist: scope === "full",
  });
  const study = await compileMainWireBaselineConditioningStudyV1();
  if (
    scope === "full"
    && searchCandidate.studyIdentitySha256 !== study.studyIdentitySha256
  ) {
    throw new Error("search report and current finalist study identities differ");
  }
  if (scope === "full") {
    assertMainWireBaselineCalibrationCandidateOnReleaseLatticeV1(
      searchCandidate.candidateInputs,
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy
        .coordinateIds,
    );
  }
  const baselineCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      settledBaselineCheckpointJson,
    );
  const baselineCandidate = baselineCandidateV1();
  const explorationDt = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .numericalPolicy.explorationNominalDtSec;
  const refinedDt = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .numericalPolicy.finalistRefinedDtSec;
  const startedAt = performance.now();

  process.stderr.write(
    `[baseline-finalist] ${candidateId}: materializing continuation checkpoint\n`,
  );
  const continuation = await spawnWorkerV1(Object.freeze({
    kind: "evaluation" as const,
    label: "rest-continuation-2ms" as const,
    candidate: searchCandidate.candidateInputs,
    nominalDtSec: explorationDt,
    initialization: Object.freeze({
      kind: "standard68-parameter-continuation" as const,
      sourceCheckpoint: baselineCheckpoint,
      sourceHemodynamicResearchInputs:
        baselineCandidate.hemodynamicResearchInputs,
      sourceVentricularContractilityScale:
        baselineCandidate.ventricularContractilityScale,
      sourceMechanismResearchInputs:
        baselineCandidate.mechanismResearchInputs,
    }),
    returnCheckpoint: true,
  })).result;
  if (
    continuation.kind !== "evaluation"
    || continuation.evaluation.status !== "accepted"
    || continuation.checkpoint === null
  ) {
    throw new Error("finalist continuation did not produce an accepted checkpoint");
  }
  progressV1(continuation);

  const candidateCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      continuation.checkpoint,
    );
  if (scope === "preload-only") {
    const preload = await spawnWorkerV1(Object.freeze({
      kind: "formal-preload-reserve" as const,
      label: "formal-preload-reserve" as const,
      candidate: searchCandidate.candidateInputs,
      checkpoint: candidateCheckpoint,
    })).result;
    if (preload.kind !== "formal-preload-reserve") {
      throw new Error("preload-only worker returned an evaluation");
    }
    progressV1(preload);
    const report = Object.freeze({
      schemaVersion: 1 as const,
      screenId: "main-wire-baseline-preload-reserve-screen-v1" as const,
      status: preload.status,
      currentStudyIdentitySha256: study.studyIdentitySha256,
      sourceStudyIdentitySha256: searchCandidate.studyIdentitySha256,
      executionCommit: gitV1(["rev-parse", "HEAD"]),
      searchArtifactPath: portableRepositoryPathV1(searchArtifactPath),
      searchArtifactSha256: searchCandidate.searchArtifactSha256,
      searchId: searchCandidate.searchId,
      searchExecutionCommit: searchCandidate.searchExecutionCommit,
      candidateId,
      coordinateValues: searchCandidate.coordinateValues,
      numericalFloorArtifactPath: portableRepositoryPathV1(floorArtifactPath),
      numericalFloorArtifactSha256,
      batchWallTimeMs: performance.now() - startedAt,
      continuation: compactExecutionForReportV1(continuation),
      formalPreloadReserve: preload,
      claim: Object.freeze({
        evidenceRole: "construction" as const,
        exploratoryScreenOnly: true as const,
        selectedBaselineClaimed: false as const,
      }),
    });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${outputPath}\n`);
    return;
  }
  const afterloadCandidate = applyMainWireBaselineCalibrationParametersV1(
    searchCandidate.candidateInputs,
    [Object.freeze({
      parameterId: "hemodynamics.systemic-resistance" as const,
      value: searchCandidate.candidateInputs.hemodynamicResearchInputs
        .systemicResistance * 1.1,
    })],
  );
  const hr70Candidate = Object.freeze({
    ...searchCandidate.candidateInputs,
    hemodynamicResearchInputs: Object.freeze({
      ...searchCandidate.candidateInputs.hemodynamicResearchInputs,
      heartRateBpm: 70,
    }),
  });
  const remainingJobs: readonly WorkerJobV1[] = Object.freeze([
    Object.freeze({
      kind: "evaluation" as const,
      label: "rest-cold-2ms" as const,
      candidate: searchCandidate.candidateInputs,
      nominalDtSec: explorationDt,
      initialization: Object.freeze({ kind: "cold" as const }),
      returnCheckpoint: true,
    }),
    Object.freeze({
      kind: "evaluation" as const,
      label: "rest-cold-1ms" as const,
      candidate: searchCandidate.candidateInputs,
      nominalDtSec: refinedDt,
      initialization: Object.freeze({ kind: "cold" as const }),
      returnCheckpoint: false,
    }),
    Object.freeze({
      kind: "evaluation" as const,
      label: "safety-hr70-cold-2ms" as const,
      candidate: hr70Candidate,
      nominalDtSec: explorationDt,
      initialization: Object.freeze({ kind: "cold" as const }),
      returnCheckpoint: false,
    }),
    Object.freeze({
      kind: "evaluation" as const,
      label: "safety-afterload-plus-10-percent-2ms" as const,
      candidate: afterloadCandidate,
      nominalDtSec: explorationDt,
      initialization: Object.freeze({
        kind: "standard68-parameter-continuation" as const,
        sourceCheckpoint: candidateCheckpoint,
        sourceHemodynamicResearchInputs:
          searchCandidate.candidateInputs.hemodynamicResearchInputs,
        sourceVentricularContractilityScale:
          searchCandidate.candidateInputs.ventricularContractilityScale,
        sourceMechanismResearchInputs:
          searchCandidate.candidateInputs.mechanismResearchInputs,
      }),
      returnCheckpoint: false,
    }),
    Object.freeze({
      kind: "formal-preload-reserve" as const,
      label: "formal-preload-reserve" as const,
      candidate: searchCandidate.candidateInputs,
      checkpoint: candidateCheckpoint,
    }),
  ]);
  const effectiveParallelism = Math.min(
    requestedParallelism,
    Math.max(1, availableParallelism() - 1),
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
      .maximumParallelEvaluations,
    remainingJobs.length,
  );
  process.stderr.write(
    `[baseline-finalist] ${remainingJobs.length} qualification jobs, `
      + `${effectiveParallelism} workers\n`,
  );
  const remaining = await runPoolV1(
    remainingJobs,
    effectiveParallelism,
    progressV1,
  );
  const executions = Object.freeze([continuation, ...remaining]);
  const evaluationByLabel = new Map(executions.flatMap((execution) =>
    execution.kind === "evaluation"
      ? [[execution.label, execution] as const]
      : []));
  const cold2 = requiredEvaluationV1(evaluationByLabel, "rest-cold-2ms");
  const cold1 = requiredEvaluationV1(evaluationByLabel, "rest-cold-1ms");
  const hr70 = requiredEvaluationV1(
    evaluationByLabel,
    "safety-hr70-cold-2ms",
  );
  const afterload = requiredEvaluationV1(
    evaluationByLabel,
    "safety-afterload-plus-10-percent-2ms",
  );
  const preload = executions.find((execution) =>
    execution.kind === "formal-preload-reserve");
  if (preload === undefined || preload.kind !== "formal-preload-reserve") {
    throw new Error("formal preload-reserve execution is missing");
  }
  const restObjectives = Object.freeze({
    continuation2ms: objectiveV1(
      continuation.evaluation,
      searchCandidate.candidateInputs,
      numericalFloor.metricFloors,
    ),
    cold2ms: objectiveV1(
      cold2.evaluation,
      searchCandidate.candidateInputs,
      numericalFloor.metricFloors,
    ),
    cold1ms: objectiveV1(
      cold1.evaluation,
      searchCandidate.candidateInputs,
      numericalFloor.metricFloors,
    ),
  });
  const initializationAgreement = compareEvaluationsV1(
    cold2.evaluation,
    continuation.evaluation,
    numericalFloor.metricFloors,
  );
  const refinedDtAgreement = compareEvaluationsV1(
    cold2.evaluation,
    cold1.evaluation,
    numericalFloor.metricFloors,
  );
  const hr70Safety = safetyQualificationV1(hr70.evaluation);
  const afterloadSafety = safetyQualificationV1(afterload.evaluation);
  const restPassed = Object.values(restObjectives).every((objective) =>
    objective?.status === "feasible");
  const status = restPassed
      && initializationAgreement.status === "passed"
      && refinedDtAgreement.status === "passed"
      && hr70Safety.status === "passed"
      && afterloadSafety.status === "passed"
      && preload.status === "passed"
    ? "passed" as const
    : "failed" as const;
  const coldCheckpoint = cold2.checkpoint === null
    ? null
    : await validateMainWireIntegratedModelStandard68CheckpointV1(
        cold2.checkpoint,
      );
  if (status === "passed" && checkpointOutputPath !== null) {
    if (coldCheckpoint === null) {
      throw new Error("qualified finalist has no cold checkpoint to persist");
    }
    await writeFile(
      checkpointOutputPath,
      `${JSON.stringify(coldCheckpoint, null, 2)}\n`,
      "utf8",
    );
  }
  const report = Object.freeze({
    schemaVersion: 1 as const,
    qualificationId: QUALIFICATION_ID,
    status,
    studyIdentitySha256: study.studyIdentitySha256,
    protocolCommit: gitV1([
      "log",
      "-1",
      "--format=%H",
      "--",
      "analysis/policies/mainWire/MainWireBaselineConditioningStudyV1.ts",
    ]),
    executionCommit: gitV1(["rev-parse", "HEAD"]),
    searchArtifactPath: portableRepositoryPathV1(searchArtifactPath),
    searchArtifactSha256: searchCandidate.searchArtifactSha256,
    searchId: searchCandidate.searchId,
    searchExecutionCommit: searchCandidate.searchExecutionCommit,
    candidateId,
    coordinateValues: searchCandidate.coordinateValues,
    numericalFloorArtifactPath: portableRepositoryPathV1(floorArtifactPath),
    numericalFloorArtifactSha256,
    requestedParallelism,
    effectiveParallelism,
    batchWallTimeMs: performance.now() - startedAt,
    summedWorkerWallTimeMs: executions.reduce((sum, execution) =>
      sum + (execution.kind === "evaluation"
        ? execution.evaluation.wallTimeMs
        : execution.wallTimeMs), 0),
    persistedCheckpointPath: status === "passed" && checkpointOutputPath !== null
      ? portableRepositoryPathV1(checkpointOutputPath)
      : null,
    persistedCheckpointSha256: status === "passed"
      ? coldCheckpoint?.checkpointSha256 ?? null
      : null,
    restObjectives,
    initializationAgreement,
    refinedDtAgreement,
    safety: Object.freeze({ hr70: hr70Safety, afterload: afterloadSafety }),
    formalPreloadReserve: preload,
    executions: Object.freeze(executions.map(compactExecutionForReportV1)),
    claim: Object.freeze({
      evidenceRole: "construction" as const,
      selectedBaselineClaimed: false as const,
      uniqueParameterVectorClaimed: false as const,
      pulmonaryWaveformValidationClaimed: false as const,
    }),
  });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

async function runWorkerV1(encoded: string): Promise<void> {
  const job = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  ) as WorkerJobV1;
  if (job.kind === "evaluation") {
    const evaluation = await evaluateMainWireBaselineCalibrationCandidateV1({
      hemodynamicResearchInputs: job.candidate.hemodynamicResearchInputs,
      mechanismResearchInputs: job.candidate.mechanismResearchInputs,
      ventricularContractilityScale: job.candidate.ventricularContractilityScale,
      nominalDtSec: job.nominalDtSec,
      initialization: job.initialization,
    });
    process.stdout.write(JSON.stringify(Object.freeze({
      kind: "evaluation" as const,
      label: job.label,
      evaluation: compactEvaluationV1(evaluation),
      checkpoint: job.returnCheckpoint && evaluation.status === "accepted"
        ? evaluation.exactResult.checkpoint
        : null,
    })));
    return;
  }
  const startedAt = performance.now();
  try {
    const checkpoint =
      await validateMainWireIntegratedModelStandard68CheckpointV1(
        job.checkpoint,
      );
    const session = await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
      .restoreStandard68ExactCheckpoint(
        checkpoint,
        job.candidate.hemodynamicResearchInputs,
        job.candidate.ventricularContractilityScale,
        undefined,
        job.candidate.mechanismResearchInputs,
      );
    const qualification =
      await qualifyMainWireIntegratedModelFormalPreloadReserveV1(
        session,
        job.candidate.hemodynamicResearchInputs,
      );
    assertMainWireStandard69PreloadReservePassedV1(qualification);
    process.stdout.write(JSON.stringify(Object.freeze({
      kind: "formal-preload-reserve" as const,
      label: job.label,
      status: "passed" as const,
      wallTimeMs: performance.now() - startedAt,
      qualification,
      message: null,
    })));
  } catch (error) {
    process.stdout.write(JSON.stringify(Object.freeze({
      kind: "formal-preload-reserve" as const,
      label: job.label,
      status: "failed" as const,
      wallTimeMs: performance.now() - startedAt,
      qualification: null,
      message: error instanceof Error ? error.message : String(error),
    })));
  }
}

function compactEvaluationV1(
  evaluation: MainWireBaselineCalibrationEvaluationV1,
): CompactEvaluationV1 {
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      status: evaluation.status,
      phase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      exactModelIdentitySha256: null,
      analysisMethodId: null,
      constructionPolicyRevisionId: null,
      initializationKind: null,
      nominalDtSec: null,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      classificationStatus: evaluation.partial?.classificationStatus ?? null,
      constructionGateStatus: null,
      failedConstructionCheckIds: Object.freeze([]),
      checks: Object.freeze([]),
      measurements: null,
      checkpointSha256: null,
      message: evaluation.message,
    });
  }
  return Object.freeze({
    status: evaluation.status,
    phase: null,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    exactModelIdentitySha256: evaluation.exactModelIdentitySha256,
    analysisMethodId: evaluation.analysisMethodId,
    constructionPolicyRevisionId: evaluation.constructionPolicyRevisionId,
    initializationKind: evaluation.initializationKind,
    nominalDtSec: evaluation.nominalDtSec,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    checks: evaluation.exactResult.checks,
    measurements: evaluation.exactResult.measurements,
    checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
    message: null,
  });
}

function objectiveV1(
  evaluation: CompactEvaluationV1,
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[],
): MainWireBaselineCandidateObjectiveV1 | null {
  return evaluation.status === "accepted"
    ? scoreMainWireBaselineCandidateObjectiveV1({
        checks: evaluation.checks,
        candidate,
        numericalFloors,
      })
    : null;
}

function compareEvaluationsV1(
  reference: CompactEvaluationV1,
  comparison: CompactEvaluationV1,
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[],
) {
  if (reference.status !== "accepted" || comparison.status !== "accepted") {
    return Object.freeze({
      status: "failed" as const,
      reason: "one-or-both-evaluations-were-not-accepted" as const,
      differences: Object.freeze([]),
    });
  }
  const comparisonById = new Map(comparison.checks.map((check) =>
    [check.checkId, check] as const));
  const floorById = new Map(numericalFloors.map((floor) =>
    [floor.checkId, floor] as const));
  const differences = reference.checks.map((check) => {
    const other = comparisonById.get(check.checkId);
    const floor = floorById.get(check.checkId);
    if (other === undefined || floor === undefined) {
      throw new Error(`comparison contract missing ${check.checkId}`);
    }
    if (
      other.unit !== check.unit
      || floor.unit !== check.unit
      || other.minimum !== check.minimum
      || other.maximum !== check.maximum
      || floor.constructionMinimum !== check.minimum
      || floor.constructionMaximum !== check.maximum
    ) {
      throw new Error(`comparison contract differs for ${check.checkId}`);
    }
    const absoluteDifference = Math.abs(other.actual - check.actual);
    const machineTolerance = 32 * Number.EPSILON * Math.max(
      1,
      Math.abs(other.actual),
      Math.abs(check.actual),
    );
    const corridorTolerance = (check.maximum - check.minimum)
      * MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
        .finalistComparisonCorridorFraction;
    const admittedTolerance =
      composeMainWireBaselineFinalistComparisonToleranceV1(
        floor.numericalFloorAbsolute,
        check.maximum - check.minimum,
        MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
          .finalistComparisonCorridorFraction,
        machineTolerance,
      );
    return Object.freeze({
      checkId: check.checkId,
      unit: check.unit,
      referenceActual: check.actual,
      comparisonActual: other.actual,
      absoluteDifference,
      numericalFloorAbsolute: floor.numericalFloorAbsolute,
      corridorTolerance,
      admittedTolerance,
      machineTolerance,
      status: absoluteDifference <= admittedTolerance
        ? "passed" as const
        : "failed" as const,
    });
  });
  return Object.freeze({
    status: differences.every(({ status }) => status === "passed")
      ? "passed" as const
      : "failed" as const,
    reason: null,
    differences: Object.freeze(differences),
  });
}

function safetyQualificationV1(evaluation: CompactEvaluationV1) {
  const requiredCheckIds = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .objectivePolicy.safetyCheckIds;
  const byId = new Map(evaluation.checks.map((check) =>
    [check.checkId, check] as const));
  const checks = requiredCheckIds.map((checkId) => {
    const check = byId.get(checkId);
    return Object.freeze({
      checkId,
      status: check?.status ?? "failed" as const,
      actual: check?.actual ?? null,
      minimum: check?.minimum ?? null,
      maximum: check?.maximum ?? null,
      unit: check?.unit ?? null,
    });
  });
  return Object.freeze({
    status: evaluation.status === "accepted"
        && checks.every(({ status }) => status === "passed")
      ? "passed" as const
      : "failed" as const,
    evaluationStatus: evaluation.status,
    checks: Object.freeze(checks),
  });
}

async function loadSearchCandidateV1(input: Readonly<{
  artifactPath: string;
  candidateId: string;
  numericalFloorArtifactSha256: string;
  requireFinalist: boolean;
}>): Promise<SearchCandidateV1> {
  const json = JSON.parse(await readFile(input.artifactPath, "utf8")) as unknown;
  const report = recordV1(json, "search report");
  const searchArtifactSha256 = await sha256CanonicalJsonHex(json);
  const searchId = stringFieldV1(report, "searchId", "search report");
  const searchExecutionCommit = digestFieldV1(
    report,
    "executionCommit",
    40,
    "search report",
  );
  const studyIdentitySha256 = digestFieldV1(
    report,
    "studyIdentitySha256",
    64,
    "search report",
  );
  const numericalFloorArtifactSha256 = digestFieldV1(
    report,
    "numericalFloorArtifactSha256",
    64,
    "search report",
  );
  if (numericalFloorArtifactSha256 !== input.numericalFloorArtifactSha256) {
    throw new Error("search and finalist numerical-floor artifacts differ");
  }
  if (gitV1(["merge-base", searchExecutionCommit, "HEAD"])
    !== searchExecutionCommit) {
    throw new Error("search execution commit is not an ancestor of HEAD");
  }
  const changedExactSources = gitV1([
    "diff",
    "--name-only",
    `${searchExecutionCommit}..HEAD`,
    "--",
    "engine",
    "analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1.ts",
    "analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1.ts",
    "data/physiology/main-wire-normal-reference-evidence-v1.json",
    "studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json",
  ]);
  if (changedExactSources !== "") {
    throw new Error(
      "search compatibility guard detected changed exact/evaluator sources: "
        + changedExactSources.replaceAll("\n", ", "),
    );
  }
  if (input.requireFinalist) {
    const finalists = stringArrayV1(report.finalistCandidateIds, "finalist IDs");
    if (!finalists.includes(input.candidateId)) {
      throw new Error(`${input.candidateId} is not a search finalist`);
    }
  }
  if (!Array.isArray(report.evaluations)) {
    throw new Error("search report has no evaluations");
  }
  const rawCandidate = report.evaluations.find((value) =>
    value !== null && typeof value === "object"
      && (value as Record<string, unknown>).candidateId === input.candidateId);
  const candidate = recordV1(rawCandidate, `candidate ${input.candidateId}`);
  const coordinateRecord = recordV1(
    candidate.coordinateValues,
    `candidate ${input.candidateId} coordinates`,
  );
  const coordinateIds = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.coordinateIds;
  if (
    JSON.stringify(Object.keys(coordinateRecord).sort())
      !== JSON.stringify([...coordinateIds].sort())
  ) {
    throw new Error("search candidate coordinate set differs from policy");
  }
  const coordinateValues = Object.freeze(Object.fromEntries(coordinateIds.map(
    (parameterId) => [
      parameterId,
      finiteNumberFieldV1(
        coordinateRecord,
        parameterId,
        `candidate ${input.candidateId} coordinates`,
      ),
    ],
  )));
  const candidateInputs = applyMainWireBaselineCalibrationParametersV1(
    baselineCandidateV1(),
    coordinateIds.map((parameterId) => Object.freeze({
      parameterId,
      value: coordinateValues[parameterId],
    })),
  );
  return Object.freeze({
    searchArtifactPath: input.artifactPath,
    searchArtifactSha256,
    searchId,
    searchExecutionCommit,
    studyIdentitySha256,
    numericalFloorArtifactSha256,
    candidateId: input.candidateId,
    coordinateValues,
    candidateInputs,
  });
}

async function runPoolV1(
  jobs: readonly WorkerJobV1[],
  parallelism: number,
  onCompleted: (execution: WorkerExecutionV1) => void,
): Promise<readonly WorkerExecutionV1[]> {
  let nextIndex = 0;
  const results = new Array<WorkerExecutionV1>(jobs.length);
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
        let execution: WorkerExecutionV1;
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

function spawnWorkerV1(job: WorkerJobV1): Readonly<{
  process: ChildProcessWithoutNullStreams;
  result: Promise<WorkerExecutionV1>;
}> {
  const executable = resolve(process.cwd(), "node_modules/.bin/vite-node");
  const script = fileURLToPath(import.meta.url);
  const encoded = Buffer.from(JSON.stringify(job), "utf8").toString("base64url");
  const child = spawn(executable, ["--script", script, "--worker-job", encoded], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const result = new Promise<WorkerExecutionV1>((resolveResult, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 3_000_000) {
        child.kill("SIGTERM");
        reject(new Error(`finalist worker output overflow: ${job.label}`));
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
          `finalist worker ${job.label} exited ${code ?? signal}: ${stderr.trim()}`,
        ));
        return;
      }
      try {
        resolveResult(JSON.parse(stdout) as WorkerExecutionV1);
      } catch (error) {
        reject(new Error(
          `finalist worker ${job.label} returned invalid JSON: `
            + (error instanceof Error ? error.message : String(error)),
        ));
      }
    });
  });
  return Object.freeze({ process: child, result });
}

function progressV1(execution: WorkerExecutionV1): void {
  if (execution.kind === "evaluation") {
    process.stderr.write(
      `[baseline-finalist] ${execution.label}: ${execution.evaluation.status}, `
        + `${Math.round(execution.evaluation.wallTimeMs)} ms, `
        + `${execution.evaluation.completedCycleCount ?? "-"} cycles\n`,
    );
    return;
  }
  process.stderr.write(
    `[baseline-finalist] ${execution.label}: ${execution.status}, `
      + `${Math.round(execution.wallTimeMs)} ms\n`,
  );
}

function requiredEvaluationV1(
  evaluations: ReadonlyMap<EvaluationLabelV1, EvaluationExecutionV1>,
  label: EvaluationLabelV1,
): EvaluationExecutionV1 {
  const evaluation = evaluations.get(label);
  if (evaluation === undefined) throw new Error(`missing evaluation ${label}`);
  return evaluation;
}

function compactExecutionForReportV1(execution: WorkerExecutionV1) {
  if (execution.kind === "formal-preload-reserve") return execution;
  return Object.freeze({
    kind: execution.kind,
    label: execution.label,
    evaluation: execution.evaluation,
    returnedCheckpointSha256: execution.checkpoint?.checkpointSha256 ?? null,
  });
}

function baselineCandidateV1(): MainWireBaselineCalibrationCandidateInputsV1 {
  return Object.freeze({
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
    ventricularContractilityScale: 1,
  });
}

function parseNumericalFloorV1(input: unknown): MainWireBaselineNumericalFloorAuditV1 {
  const record = recordV1(input, "numerical-floor artifact");
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

function digestFieldV1(
  record: Record<string, unknown>,
  key: string,
  length: 40 | 64,
  label: string,
): string {
  const value = stringFieldV1(record, key, label);
  if (!new RegExp(`^[0-9a-f]{${length}}$`).test(value)) {
    throw new Error(`${label}.${key} must be a ${length}-digit hex digest`);
  }
  return value;
}

function stringArrayV1(input: unknown, label: string): readonly string[] {
  if (!Array.isArray(input) || !input.every((value) => typeof value === "string")) {
    throw new Error(`${label} must be a string array`);
  }
  return input;
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

function parseScopeV1(value: string): "full" | "preload-only" {
  if (value !== "full" && value !== "preload-only") {
    throw new Error(`unsupported finalist qualification scope: ${value}`);
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

function gitV1(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}
