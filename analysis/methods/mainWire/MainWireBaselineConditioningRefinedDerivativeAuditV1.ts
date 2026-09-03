import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  assertMainWireBaselineConditioningTaskResultV1,
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  buildMainWireBaselineConditioningSensitivitiesV1,
  buildMainWireBaselineConditioningSingularValuesV1,
  buildMainWireBaselineConditioningTasksV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningSensitivityV1,
  type MainWireBaselineConditioningSpectrumV1,
  type MainWireBaselineConditioningTaskResultV1,
  type MainWireBaselineConditioningTaskV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  buildMainWireBaselineConditioningCenterConstructionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningCenterCacheV1";
import type {
  MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_AUDIT_V1_ID =
  "main-wire-baseline-conditioning-refined-derivative-audit-v1" as const;

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ARTERIAL_STIFFNESS = "hemodynamics.arterial-stiffness" as const;
const ACTIVE_TENSION =
  "myocardium.common-ventricular-active-tension-scale" as const;

export const MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1 =
  Object.freeze({
    coarseNominalDtSec:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
        .explorationNominalDtSec,
    refinedNominalDtSec:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
        .finalistRefinedDtSec,
    derivativeEstimate: "central-half-parameter-step" as const,
    rowAdmission:
      "intersection-of-coarse-and-refined-complete-step-sign-stable" as const,
    practicalRankToleranceComposition:
      "maximum-of-machine-coarse-step-refined-step-and-coarse-refined-frobenius" as const,
    declaredPairCoordinateIds: Object.freeze([
      Object.freeze([TBV, ARTERIAL_STIFFNESS]),
      Object.freeze([TBV, ACTIVE_TENSION]),
    ]),
    reportedCoordinateSubsets: Object.freeze([
      Object.freeze([TBV]),
      Object.freeze([ARTERIAL_STIFFNESS]),
      Object.freeze([ACTIVE_TENSION]),
      Object.freeze([TBV, ARTERIAL_STIFFNESS]),
      Object.freeze([TBV, ACTIVE_TENSION]),
    ]),
  });

export type MainWireBaselineConditioningRefinedCenterSourceV1 = Readonly<{
  conditionId: string;
  coarseConstructionIdentitySha256: string;
  coarseCheckpointSha256: string;
  refinedCheckpointSha256: string;
}>;

export type MainWireBaselineConditioningRefinedTaskEvaluationV1 = Readonly<{
  nominalDtSec: number;
  taskResult: MainWireBaselineConditioningTaskResultV1;
}>;

export type MainWireBaselineConditioningRefinedDerivativeSubsetV1 = Readonly<{
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  candidateRowCount: number;
  commonAdmittedRowCount: number;
  coarseAdmittedRowCount: number;
  refinedAdmittedRowCount: number;
  coarseOnlyAdmittedRows: readonly Readonly<{
    conditionId: string;
    checkId: string;
  }>[];
  refinedOnlyAdmittedRows: readonly Readonly<{
    conditionId: string;
    checkId: string;
  }>[];
  coarseExcludedRows: MainWireBaselineConditioningSpectrumV1["excludedRows"];
  refinedExcludedRows: MainWireBaselineConditioningSpectrumV1["excludedRows"];
  refinedSingularValues: readonly number[];
  numericalRank: number;
  numericalRankTolerance: number;
  coarseStepHalvingPerturbationFrobeniusNorm: number;
  refinedStepHalvingPerturbationFrobeniusNorm: number;
  coarseRefinedDerivativePerturbationFrobeniusNorm: number;
  coarseRefinedDerivativeRelativeFrobeniusNorm: number | null;
  practicalRank: number;
  practicalRankTolerance: number;
  singularValueRatiosToPracticalTolerance: readonly (number | null)[];
  practicalConditionNumber: number | null;
  resolutionStatus: "supported" | "deficient";
}>;

export type MainWireBaselineConditioningRefinedDerivativeAuditV1 = Readonly<{
  auditId:
    typeof MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_AUDIT_V1_ID;
  status: "completed" | "unresolved";
  source: Readonly<{
    coarseAuditId: string;
    coarseArtifactIdentitySha256: string;
    studyIdentitySha256: string;
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
    coarseNominalDtSec: number;
    refinedNominalDtSec: number;
    protocolCommit: string;
    executionCommit: string;
    requestedParallelism: number;
    effectiveParallelism: number;
    batchWallTimeMs: number;
    centerSources:
      readonly MainWireBaselineConditioningRefinedCenterSourceV1[];
  }>;
  policy:
    typeof MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1;
  taskCount: number;
  acceptedTaskCount: number;
  fineEvaluations:
    readonly MainWireBaselineConditioningRefinedTaskEvaluationV1[];
  fineSensitivities: readonly MainWireBaselineConditioningSensitivityV1[];
  subsetDiagnostics:
    readonly MainWireBaselineConditioningRefinedDerivativeSubsetV1[];
  summary: Readonly<{
    failedTaskIds: readonly string[];
    safetyFailedTaskIds: readonly string[];
    supportedCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
    supportedDeclaredPairCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
  }>;
  claim: Readonly<{
    localDiagnosticOnly: true;
    directCoarseRefinedDerivativesEvaluated: boolean;
    refinedDtConvergenceClaimed: false;
    parameterSubsetAutomaticallySelected: false;
    structuralIdentifiabilityClaimed: false;
    inferentialUncertaintyClaimed: false;
  }>;
}>;

export function buildMainWireBaselineConditioningRefinedTasksV1():
  readonly MainWireBaselineConditioningTaskV1[] {
  const coordinateIds = new Set<MainWireBaselineCalibrationParameterIdV1>(
    MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
      .reportedCoordinateSubsets.flat(),
  );
  return Object.freeze(
    buildMainWireBaselineConditioningTasksV1({ mode: "primary-envelope" })
      .filter(({ coordinateId }) =>
        coordinateId === null || coordinateIds.has(coordinateId)),
  );
}

export async function buildMainWireBaselineConditioningRefinedDerivativeAuditV1(
  input: Readonly<{
    coarseAudit: unknown;
    fineEvaluations:
      readonly MainWireBaselineConditioningRefinedTaskEvaluationV1[];
    centerSources:
      readonly MainWireBaselineConditioningRefinedCenterSourceV1[];
    protocolCommit: string;
    executionCommit: string;
    requestedParallelism: number;
    effectiveParallelism: number;
    batchWallTimeMs: number;
    refinedNominalDtSec: number;
  }>,
): Promise<MainWireBaselineConditioningRefinedDerivativeAuditV1> {
  const coarse = await verifyMainWireBaselineConditioningAuditV1(
    input.coarseAudit,
  );
  if (
    coarse.status !== "completed"
    || coarse.mode !== "primary-envelope"
    || coarse.primarySpectrum === null
  ) {
    throw new Error(
      "refined derivative audit requires a completed primary-envelope audit",
    );
  }
  if (
    input.refinedNominalDtSec
      !== MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
        .refinedNominalDtSec
  ) {
    throw new Error("refined derivative audit dt differs from policy");
  }
  assertExecutionMetadataV1(input);
  assertDeclaredPairsWereStepStableV1(coarse);

  const expectedTasks = buildMainWireBaselineConditioningRefinedTasksV1();
  const expectedById = new Map(expectedTasks.map((task) =>
    [task.taskId, task] as const));
  const fineEvaluations = [...input.fineEvaluations].sort((left, right) =>
    left.taskResult.task.taskId.localeCompare(right.taskResult.task.taskId));
  if (fineEvaluations.some(({ nominalDtSec }) =>
    nominalDtSec !== input.refinedNominalDtSec)) {
    throw new Error("refined task evaluation dt differs from policy");
  }
  const evaluations = fineEvaluations.map(({ taskResult }) => taskResult);
  evaluations.forEach(assertMainWireBaselineConditioningTaskResultV1);
  if (
    evaluations.length !== expectedTasks.length
    || new Set(evaluations.map(({ task }) => task.taskId)).size
      !== evaluations.length
    || evaluations.some(({ task }) =>
      canonicalJsonStringify(task)
        !== canonicalJsonStringify(expectedById.get(task.taskId)))
  ) {
    throw new Error("refined derivative evaluations differ from the task plan");
  }

  const centerSources = await assertAndOwnCenterSourcesV1(
    input.centerSources,
    expectedTasks,
    evaluations,
    coarse.evaluations,
  );
  const study = await compileMainWireBaselineConditioningStudyV1();
  const constructionPolicy =
    await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  const fineSensitivities =
    buildMainWireBaselineConditioningSensitivitiesV1(evaluations);
  const failedTaskIds = evaluations
    .filter(({ evaluationStatus }) => evaluationStatus !== "accepted")
    .map(({ task }) => task.taskId);
  const safetyFailedTaskIds = evaluations
    .filter(({ safetySentinelStatus }) => safetySentinelStatus !== "passed")
    .map(({ task }) => task.taskId);
  const complete = failedTaskIds.length === 0
    && safetyFailedTaskIds.length === 0;
  const subsetDiagnostics = complete
    ? MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
      .reportedCoordinateSubsets.map((coordinateIds) =>
        buildSubsetDiagnosticV1(
          coarse.sensitivities,
          fineSensitivities,
          coordinateIds,
        ))
    : [];
  const supportedCoordinateSubsets = subsetDiagnostics
    .filter(({ resolutionStatus }) => resolutionStatus === "supported")
    .map(({ coordinateIds }) => coordinateIds);
  const declaredPairKeys = new Set(
    MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
      .declaredPairCoordinateIds.map(coordinateKeyV1),
  );
  const supportedDeclaredPairCoordinateSubsets = supportedCoordinateSubsets
    .filter((coordinateIds) => declaredPairKeys.has(coordinateKeyV1(coordinateIds)));
  return Object.freeze({
    auditId:
      MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_AUDIT_V1_ID,
    status: complete ? "completed" as const : "unresolved" as const,
    source: Object.freeze({
      coarseAuditId: coarse.auditId,
      coarseArtifactIdentitySha256: await sha256CanonicalJsonHex(coarse),
      studyIdentitySha256: study.studyIdentitySha256,
      exactModelIdentitySha256: await sha256CanonicalJsonHex(
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
      ),
      constructionPolicyIdentitySha256:
        constructionPolicy.constructionPolicyIdentitySha256,
      coarseNominalDtSec:
        MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
          .coarseNominalDtSec,
      refinedNominalDtSec: input.refinedNominalDtSec,
      protocolCommit: input.protocolCommit,
      executionCommit: input.executionCommit,
      requestedParallelism: input.requestedParallelism,
      effectiveParallelism: input.effectiveParallelism,
      batchWallTimeMs: input.batchWallTimeMs,
      centerSources,
    }),
    policy:
      MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1,
    taskCount: evaluations.length,
    acceptedTaskCount: evaluations.length - failedTaskIds.length,
    fineEvaluations: Object.freeze(fineEvaluations.map((evaluation) =>
      Object.freeze({ ...evaluation }))),
    fineSensitivities,
    subsetDiagnostics: Object.freeze(subsetDiagnostics),
    summary: Object.freeze({
      failedTaskIds: Object.freeze(failedTaskIds),
      safetyFailedTaskIds: Object.freeze(safetyFailedTaskIds),
      supportedCoordinateSubsets: Object.freeze(supportedCoordinateSubsets),
      supportedDeclaredPairCoordinateSubsets: Object.freeze(
        supportedDeclaredPairCoordinateSubsets,
      ),
    }),
    claim: Object.freeze({
      localDiagnosticOnly: true as const,
      directCoarseRefinedDerivativesEvaluated: complete,
      refinedDtConvergenceClaimed: false as const,
      parameterSubsetAutomaticallySelected: false as const,
      structuralIdentifiabilityClaimed: false as const,
      inferentialUncertaintyClaimed: false as const,
    }),
  });
}

export async function verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
  input: unknown,
  coarseAudit: unknown,
): Promise<MainWireBaselineConditioningRefinedDerivativeAuditV1> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("refined derivative audit artifact must be an object");
  }
  const record = input as Partial<
    MainWireBaselineConditioningRefinedDerivativeAuditV1
  >;
  if (
    record.source === null
    || typeof record.source !== "object"
    || !Array.isArray(record.fineEvaluations)
  ) {
    throw new Error("refined derivative audit artifact is incomplete");
  }
  const rebuilt =
    await buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
      coarseAudit,
      fineEvaluations: record.fineEvaluations,
      centerSources: record.source.centerSources,
      protocolCommit: record.source.protocolCommit,
      executionCommit: record.source.executionCommit,
      requestedParallelism: record.source.requestedParallelism,
      effectiveParallelism: record.source.effectiveParallelism,
      batchWallTimeMs: record.source.batchWallTimeMs,
      refinedNominalDtSec: record.source.refinedNominalDtSec,
    });
  if (canonicalJsonStringify(rebuilt) !== canonicalJsonStringify(input)) {
    throw new Error(
      "refined derivative audit artifact differs from its reconstruction",
    );
  }
  return input as MainWireBaselineConditioningRefinedDerivativeAuditV1;
}

function buildSubsetDiagnosticV1(
  coarseSensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  refinedSensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): MainWireBaselineConditioningRefinedDerivativeSubsetV1 {
  const coarseRaw = buildMainWireBaselineConditioningAdmittedMatrixV1(
    coarseSensitivities,
    coordinateIds,
  );
  const refinedRaw = buildMainWireBaselineConditioningAdmittedMatrixV1(
    refinedSensitivities,
    coordinateIds,
  );
  if (coarseRaw.candidateRowCount !== refinedRaw.candidateRowCount) {
    throw new Error("coarse and refined derivative row inventories differ");
  }
  const coarseKeys = new Set(coarseRaw.rows.map(matrixRowKeyV1));
  const refinedKeys = new Set(refinedRaw.rows.map(matrixRowKeyV1));
  const commonKeys = new Set([...coarseKeys].filter((key) =>
    refinedKeys.has(key)));
  if (commonKeys.size === 0) {
    throw new Error("refined derivative audit has no common admitted rows");
  }
  const coarseCommon = buildMainWireBaselineConditioningAdmittedMatrixV1(
    coarseSensitivities.filter((sensitivity) =>
      commonKeys.has(sensitivityRowKeyV1(sensitivity))),
    coordinateIds,
  );
  const refinedCommon = buildMainWireBaselineConditioningAdmittedMatrixV1(
    refinedSensitivities.filter((sensitivity) =>
      commonKeys.has(sensitivityRowKeyV1(sensitivity))),
    coordinateIds,
  );
  const refinedRowByKey = new Map(refinedCommon.rows.map((row) =>
    [matrixRowKeyV1(row), row] as const));
  const aligned = coarseCommon.rows.map((coarseRow) => {
    const refinedRow = refinedRowByKey.get(matrixRowKeyV1(coarseRow));
    if (
      refinedRow === undefined
      || coarseRow.unit !== refinedRow.unit
      || coarseRow.constructionCorridorWidth
        !== refinedRow.constructionCorridorWidth
      || coarseRow.weightDivisor !== refinedRow.weightDivisor
    ) {
      throw new Error("coarse and refined admitted-row contracts differ");
    }
    return Object.freeze({ coarseRow, refinedRow });
  });
  if (
    aligned.length !== commonKeys.size
    || refinedCommon.rows.length !== commonKeys.size
  ) {
    throw new Error("coarse and refined admitted rows do not align");
  }

  const coarseHalf = aligned.map(({ coarseRow }) =>
    weightedRowV1(coarseRow.halfStepRow, coarseRow.weightDivisor));
  const coarseFull = aligned.map(({ coarseRow }) =>
    weightedRowV1(coarseRow.fullStepRow, coarseRow.weightDivisor));
  const refinedHalf = aligned.map(({ refinedRow }) =>
    weightedRowV1(refinedRow.halfStepRow, refinedRow.weightDivisor));
  const refinedFull = aligned.map(({ refinedRow }) =>
    weightedRowV1(refinedRow.fullStepRow, refinedRow.weightDivisor));
  const refinedSingularValues =
    buildMainWireBaselineConditioningSingularValuesV1(
      refinedHalf,
      coordinateIds.length,
    );
  const maximum = refinedSingularValues[0] ?? 0;
  const numericalRankTolerance = maximum
    * Math.max(refinedHalf.length, coordinateIds.length)
    * Number.EPSILON;
  const coarseStep = differenceFrobeniusV1(coarseHalf, coarseFull);
  const refinedStep = differenceFrobeniusV1(refinedHalf, refinedFull);
  const coarseRefined = differenceFrobeniusV1(coarseHalf, refinedHalf);
  const practicalRankTolerance = Math.max(
    numericalRankTolerance,
    coarseStep,
    refinedStep,
    coarseRefined,
  );
  const numericalRank = refinedSingularValues.filter((value) =>
    value > numericalRankTolerance).length;
  const practicalRank = refinedSingularValues.filter((value) =>
    value > practicalRankTolerance).length;
  const refinedNorm = frobeniusNormV1(refinedHalf);
  return Object.freeze({
    coordinateIds: Object.freeze([...coordinateIds]),
    candidateRowCount: coarseRaw.candidateRowCount,
    commonAdmittedRowCount: commonKeys.size,
    coarseAdmittedRowCount: coarseRaw.rows.length,
    refinedAdmittedRowCount: refinedRaw.rows.length,
    coarseOnlyAdmittedRows: rowKeyDifferenceV1(coarseKeys, refinedKeys),
    refinedOnlyAdmittedRows: rowKeyDifferenceV1(refinedKeys, coarseKeys),
    coarseExcludedRows: coarseRaw.excludedRows,
    refinedExcludedRows: refinedRaw.excludedRows,
    refinedSingularValues: Object.freeze(refinedSingularValues),
    numericalRank,
    numericalRankTolerance,
    coarseStepHalvingPerturbationFrobeniusNorm: coarseStep,
    refinedStepHalvingPerturbationFrobeniusNorm: refinedStep,
    coarseRefinedDerivativePerturbationFrobeniusNorm: coarseRefined,
    coarseRefinedDerivativeRelativeFrobeniusNorm: refinedNorm > 0
      ? coarseRefined / refinedNorm
      : null,
    practicalRank,
    practicalRankTolerance,
    singularValueRatiosToPracticalTolerance: Object.freeze(
      refinedSingularValues.map((value) => practicalRankTolerance > 0
        ? value / practicalRankTolerance
        : null),
    ),
    practicalConditionNumber: practicalRank === coordinateIds.length
      ? refinedSingularValues[0]! / refinedSingularValues.at(-1)!
      : null,
    resolutionStatus: practicalRank === coordinateIds.length
      ? "supported" as const
      : "deficient" as const,
  });
}

function assertDeclaredPairsWereStepStableV1(
  coarse: MainWireBaselineConditioningAuditV1,
): void {
  for (const coordinateIds of
    MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
      .declaredPairCoordinateIds) {
    const candidate = coarse.primaryAlternativeSubsetSpectra.find((subset) =>
      coordinateKeyV1(subset.coordinateIds) === coordinateKeyV1(coordinateIds));
    if (
      candidate === undefined
      || candidate.practicalRankStatus !== "full"
    ) {
      throw new Error(
        `declared refinement pair was not coarse step-stable: `
          + coordinateIds.join(", "),
      );
    }
  }
}

async function assertAndOwnCenterSourcesV1(
  sources: readonly MainWireBaselineConditioningRefinedCenterSourceV1[],
  tasks: readonly MainWireBaselineConditioningTaskV1[],
  evaluations: readonly MainWireBaselineConditioningTaskResultV1[],
  coarseEvaluations: readonly MainWireBaselineConditioningTaskResultV1[],
): Promise<readonly MainWireBaselineConditioningRefinedCenterSourceV1[]> {
  const expectedConditionIds = tasks
    .filter(({ coordinateId }) => coordinateId === null)
    .map(({ conditionId }) => conditionId)
    .sort();
  const received = [...sources].sort((left, right) =>
    left.conditionId.localeCompare(right.conditionId));
  if (
    received.length !== expectedConditionIds.length
    || new Set(received.map(({ conditionId }) => conditionId)).size
      !== received.length
    || received.some((source, index) =>
      source.conditionId !== expectedConditionIds[index]
      || !sha256V1(source.coarseConstructionIdentitySha256)
      || !sha256V1(source.coarseCheckpointSha256)
      || !sha256V1(source.refinedCheckpointSha256))
  ) {
    throw new Error("refined derivative center sources are invalid");
  }
  const expectedConstructions = await Promise.all(received.map(({ conditionId }) =>
    buildMainWireBaselineConditioningCenterConstructionV1(conditionId)));
  if (received.some((source, index) =>
    source.coarseConstructionIdentitySha256
      !== expectedConstructions[index]!.constructionIdentitySha256)) {
    throw new Error("refined derivative center construction identity differs");
  }
  const sourceByCondition = new Map(received.map((source) =>
    [source.conditionId, source] as const));
  for (const evaluation of evaluations) {
    const source = sourceByCondition.get(evaluation.task.conditionId)!;
    if (
      (evaluation.task.coordinateId === null
        && (evaluation.sourceAnchorKind !== "verified-condition-cache"
          || evaluation.sourceCheckpointSha256
            !== source.coarseCheckpointSha256))
      || (evaluation.task.coordinateId !== null
        && (evaluation.sourceAnchorKind !== "condition-center"
          || evaluation.sourceCheckpointSha256
            !== source.refinedCheckpointSha256))
    ) {
      throw new Error(
        `refined derivative source chain differs: ${evaluation.task.taskId}`,
      );
    }
  }
  for (const evaluation of coarseEvaluations) {
    if (evaluation.task.coordinateId === null) continue;
    const source = sourceByCondition.get(evaluation.task.conditionId);
    if (
      source === undefined
      || evaluation.sourceAnchorKind !== "condition-center"
      || evaluation.sourceCheckpointSha256 !== source.coarseCheckpointSha256
    ) {
      throw new Error(
        `coarse derivative source chain differs: ${evaluation.task.taskId}`,
      );
    }
  }
  return Object.freeze(received.map((source) => Object.freeze({ ...source })));
}

function assertExecutionMetadataV1(input: Readonly<{
  protocolCommit: string;
  executionCommit: string;
  requestedParallelism: number;
  effectiveParallelism: number;
  batchWallTimeMs: number;
}>): void {
  if (
    !/^[0-9a-f]{7,64}$/.test(input.protocolCommit)
    || !/^[0-9a-f]{7,64}$/.test(input.executionCommit)
    || !Number.isSafeInteger(input.requestedParallelism)
    || input.requestedParallelism < 1
    || !Number.isSafeInteger(input.effectiveParallelism)
    || input.effectiveParallelism < 1
    || input.effectiveParallelism > input.requestedParallelism
    || !Number.isFinite(input.batchWallTimeMs)
    || input.batchWallTimeMs < 0
  ) {
    throw new Error("refined derivative execution metadata is invalid");
  }
}

function rowKeyDifferenceV1(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): readonly Readonly<{ conditionId: string; checkId: string }>[] {
  return Object.freeze([...left]
    .filter((key) => !right.has(key))
    .map((key) => {
      const separator = key.indexOf("::");
      return Object.freeze({
        conditionId: key.slice(0, separator),
        checkId: key.slice(separator + 2),
      });
    }));
}

function weightedRowV1(
  values: readonly number[],
  divisor: number,
): readonly number[] {
  return Object.freeze(values.map((value) => value / divisor));
}

function differenceFrobeniusV1(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  if (
    left.length !== right.length
    || left.some((row, index) => row.length !== right[index]?.length)
  ) {
    throw new Error("derivative matrices have incompatible shapes");
  }
  return Math.sqrt(left.reduce((sum, row, rowIndex) =>
    sum + row.reduce((rowSum, value, columnIndex) =>
      rowSum + (value - right[rowIndex]![columnIndex]!) ** 2, 0), 0));
}

function frobeniusNormV1(rows: readonly (readonly number[])[]): number {
  return Math.sqrt(rows.reduce((sum, row) =>
    sum + row.reduce((rowSum, value) => rowSum + value * value, 0), 0));
}

function matrixRowKeyV1(row: Readonly<{
  conditionId: string;
  checkId: string;
}>): string {
  return `${row.conditionId}::${row.checkId}`;
}

function sensitivityRowKeyV1(
  sensitivity: MainWireBaselineConditioningSensitivityV1,
): string {
  return `${sensitivity.conditionId}::${sensitivity.checkId}`;
}

function coordinateKeyV1(
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): string {
  return [...coordinateIds].sort().join("::");
}

function sha256V1(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
