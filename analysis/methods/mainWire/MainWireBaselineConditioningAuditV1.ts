import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import type {
  MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import {
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  mainWireBaselineCalibrationParameterV1,
  readMainWireBaselineCalibrationParameterV1,
  transformMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
  type MainWireBaselineConditioningConditionV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_AUDIT_V1_ID =
  "main-wire-baseline-conditioning-audit-v1" as const;

export type MainWireBaselineConditioningStepFractionV1 = 0 | 0.5 | 1;
export type MainWireBaselineConditioningDirectionV1 = -1 | 0 | 1;

export type MainWireBaselineConditioningTaskV1 = Readonly<{
  taskId: string;
  conditionId: string;
  coordinateId: MainWireBaselineCalibrationParameterIdV1 | null;
  direction: MainWireBaselineConditioningDirectionV1;
  stepFraction: MainWireBaselineConditioningStepFractionV1;
}>;

export type MainWireBaselineConditioningCompactCheckV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  status: "passed" | "failed";
  actual: number;
  minimum: number;
  maximum: number;
  unit: string;
}>;

export type MainWireBaselineConditioningTaskResultV1 = Readonly<{
  task: MainWireBaselineConditioningTaskV1;
  sourceAnchorKind:
    | "cold"
    | "standard-baseline"
    | "condition-center"
    | "verified-condition-cache";
  sourceCheckpointSha256: string | null;
  targetCoordinateValue: number | null;
  transformedCoordinateValue: number | null;
  evaluationStatus:
    MainWireStandard70BaselineCalibrationEvaluationV1["status"];
  evaluationPhase: string | null;
  requestIdentitySha256: string | null;
  initializationKind: string | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  classificationStatus: string | null;
  constructionGateStatus: string | null;
  objectiveGateStatus: string | null;
  safetySentinelStatus: string | null;
  failedConstructionCheckIds: readonly string[];
  failedObjectiveCheckIds: readonly string[];
  failedSafetySentinelCheckIds: readonly string[];
  checks: readonly MainWireBaselineConditioningCompactCheckV1[];
  message: string | null;
}>;

export type MainWireBaselineConditioningTaskExecutionV1 = Readonly<{
  result: MainWireBaselineConditioningTaskResultV1;
  acceptedCheckpoint: MainWireIntegratedModelStandard70CheckpointV1 | null;
}>;

export type MainWireBaselineConditioningSensitivityV1 = Readonly<{
  conditionId: string;
  coordinateId: MainWireBaselineCalibrationParameterIdV1;
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  constructionCorridorWidth: number;
  fullStepNormalizedDerivative: number | null;
  halfStepNormalizedDerivative: number | null;
  fullToHalfAbsoluteDifference: number | null;
  fullToHalfRelativeDifference: number | null;
  signStable: boolean | null;
  status: "resolved" | "unresolved";
}>;

export type MainWireBaselineConditioningSpectrumV1 = Readonly<{
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  candidateRowCount: number;
  rowCount: number;
  rowAdmissionPolicy: "complete-and-step-sign-stable";
  excludedRows: readonly Readonly<{
    conditionId: string;
    checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
    reason: "unresolved-sensitivity" | "step-sign-unstable";
  }>[];
  singularValues: readonly number[];
  singularValueRatiosToMaximum: readonly number[];
  numericalRank: number;
  numericalRankTolerance: number;
  conditionNumber: number | null;
  practicalRank: number;
  practicalRankTolerance: number;
  practicalRankToleranceComposition:
    "maximum-of-machine-and-observed-step-halving-frobenius";
  practicalConditionNumber: number | null;
  observedStepHalvingPerturbationFrobeniusNorm: number;
  columnNorms: Readonly<Record<string, number>>;
  columnCosines: readonly Readonly<{
    leftCoordinateId: MainWireBaselineCalibrationParameterIdV1;
    rightCoordinateId: MainWireBaselineCalibrationParameterIdV1;
    cosine: number | null;
  }>[];
  weighting:
    "construction-corridor-and-equal-mass-within-evidence-group";
  inferentialClaimed: false;
}>;

export type MainWireBaselineConditioningSubsetSpectrumV1 = Readonly<{
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  spectrum: MainWireBaselineConditioningSpectrumV1;
  practicalRankStatus: "full" | "deficient";
}>;

export type MainWireBaselineConditioningAuditV1 = Readonly<{
  auditId: typeof MAIN_WIRE_BASELINE_CONDITIONING_AUDIT_V1_ID;
  studyIdentitySha256: string;
  status: "completed" | "unresolved";
  mode: "rest-pilot" | "primary-envelope" | "full-envelope";
  protocolCommit: string;
  executionCommit: string;
  requestedParallelism: number;
  effectiveParallelism: number;
  batchWallTimeMs: number;
  summedEvaluationWallTimeMs: number;
  observedThroughputSpeedup: number;
  taskCount: number;
  acceptedTaskCount: number;
  centerCheckpointCache: Readonly<{
    policy: "content-addressed-validated-and-exactly-reconfirmed";
    requested: boolean;
    effective: boolean;
    hitCount: number;
    missCount: number;
    rejectedEntryCount: number;
    reconfirmationFallbackCount: number;
    writeCount: number;
    writeFailureCount: number;
  }>;
  evaluations: readonly MainWireBaselineConditioningTaskResultV1[];
  sensitivities: readonly MainWireBaselineConditioningSensitivityV1[];
  primarySpectrum: MainWireBaselineConditioningSpectrumV1 | null;
  primaryAlternativeSubsetSpectra:
    readonly MainWireBaselineConditioningSubsetSpectrumV1[];
  allCoordinateSpectrum: MainWireBaselineConditioningSpectrumV1 | null;
  positiveControls: readonly Readonly<{
    controlId: string;
    conditionId: "rest-hr60";
    coordinateId: MainWireBaselineCalibrationParameterIdV1;
    checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
    expectedSign: -1 | 1;
    observedHalfStepDerivative: number | null;
    status: "passed" | "failed" | "unresolved";
  }>[];
  claim: Readonly<{
    evidenceRole: "construction";
    localDiagnosticOnly: true;
    uniqueParameterVectorClaimed: false;
    parameterSubsetAutomaticallySelected: false;
    standard70SafetySentinelsRequired: true;
    pulmonaryWaveformValidationClaimed: false;
    numericalFloorApplied: false;
    reason: string;
  }>;
}>;

export function buildMainWireBaselineConditioningTasksV1(input: Readonly<{
  mode: MainWireBaselineConditioningAuditV1["mode"];
}>): readonly MainWireBaselineConditioningTaskV1[] {
  const study = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1;
  const conditions = input.mode === "rest-pilot"
    ? study.conditions.filter(({ conditionId }) => conditionId === "rest-hr60")
    : study.conditions;
  const coordinateIds = input.mode === "primary-envelope"
    ? study.primaryCoordinateIds
    : uniqueV1([
        ...study.primaryCoordinateIds,
        ...study.negativeControlCoordinateIds,
        ...study.diagnosticCoordinateIds,
      ]);
  const tasks: MainWireBaselineConditioningTaskV1[] = [];
  for (const condition of conditions) {
    tasks.push(taskV1(condition.conditionId, null, 0, 0));
    for (const coordinateId of coordinateIds) {
      for (const stepFraction of [1, 0.5] as const) {
        tasks.push(taskV1(condition.conditionId, coordinateId, -1, stepFraction));
        tasks.push(taskV1(condition.conditionId, coordinateId, 1, stepFraction));
      }
    }
  }
  return Object.freeze(tasks);
}

export async function evaluateMainWireBaselineConditioningTaskV1(
  task: MainWireBaselineConditioningTaskV1,
  sourceCheckpoint: MainWireIntegratedModelStandard70CheckpointV1,
  sourceAnchorKind:
    MainWireBaselineConditioningTaskResultV1["sourceAnchorKind"] =
      "standard-baseline",
): Promise<MainWireBaselineConditioningTaskResultV1> {
  return (await executeMainWireBaselineConditioningTaskV1(
    task,
    sourceCheckpoint,
    sourceAnchorKind,
  )).result;
}

export async function executeMainWireBaselineConditioningTaskV1(
  task: MainWireBaselineConditioningTaskV1,
  sourceCheckpoint: MainWireIntegratedModelStandard70CheckpointV1,
  sourceAnchorKind:
    MainWireBaselineConditioningTaskResultV1["sourceAnchorKind"],
): Promise<MainWireBaselineConditioningTaskExecutionV1> {
  if (
    sourceAnchorKind === "verified-condition-cache"
    && task.coordinateId !== null
  ) {
    throw new Error("verified condition cache may initialize only a center task");
  }
  const resolved = resolveTaskV1(task);
  const sourceCandidate = sourceAnchorKind === "condition-center"
    || sourceAnchorKind === "verified-condition-cache"
    ? buildMainWireBaselineConditioningCenterCandidateV1(task.conditionId)
    : baselineCandidateV1();
  const isExactBaseline = sourceAnchorKind === "standard-baseline"
    && task.conditionId === "rest-hr60"
    && task.coordinateId === null;
  const useExactCheckpoint = isExactBaseline
    || sourceAnchorKind === "verified-condition-cache";
  const evaluation =
    await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
      hemodynamicResearchInputs:
        resolved.target.hemodynamicResearchInputs,
      mechanismResearchInputs: resolved.target.mechanismResearchInputs,
      ventricularContractilityScale:
        resolved.target.ventricularContractilityScale,
      nominalDtSec:
        MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
          .explorationNominalDtSec,
      initialization: sourceAnchorKind === "cold"
        ? Object.freeze({ kind: "cold" as const })
        : useExactCheckpoint
          ? Object.freeze({
            kind: "standard70-exact-checkpoint" as const,
            checkpoint: sourceCheckpoint,
          })
          : Object.freeze({
            kind: "standard70-parameter-continuation" as const,
            sourceCheckpoint,
            sourceHemodynamicResearchInputs:
              sourceCandidate.hemodynamicResearchInputs,
            sourceVentricularContractilityScale:
              sourceCandidate.ventricularContractilityScale,
            sourceMechanismResearchInputs:
              sourceCandidate.mechanismResearchInputs,
          }),
    });
  return Object.freeze({
    result: compactEvaluationV1(
      task,
      sourceAnchorKind,
      sourceAnchorKind === "cold" ? null : sourceCheckpoint.checkpointSha256,
      resolved,
      evaluation,
    ),
    acceptedCheckpoint: evaluation.status === "accepted"
      ? evaluation.exactResult.checkpoint
      : null,
  });
}

export async function buildMainWireBaselineConditioningAuditV1(input: Readonly<{
  mode: MainWireBaselineConditioningAuditV1["mode"];
  protocolCommit: string;
  executionCommit: string;
  requestedParallelism: number;
  effectiveParallelism: number;
  batchWallTimeMs: number;
  evaluations: readonly MainWireBaselineConditioningTaskResultV1[];
  centerCheckpointCache: MainWireBaselineConditioningAuditV1[
    "centerCheckpointCache"
  ];
}>): Promise<MainWireBaselineConditioningAuditV1> {
  if (!/^[0-9a-f]{7,64}$/.test(input.protocolCommit)) {
    throw new Error("conditioning audit requires a protocol commit hash");
  }
  if (!/^[0-9a-f]{7,64}$/.test(input.executionCommit)) {
    throw new Error("conditioning audit requires an execution commit hash");
  }
  const expectedTasks = buildMainWireBaselineConditioningTasksV1({
    mode: input.mode,
  });
  assertCenterCheckpointCacheSummaryV1(
    input.centerCheckpointCache,
    expectedTasks.filter(({ coordinateId }) => coordinateId === null).length,
  );
  const expectedIds = expectedTasks.map(({ taskId }) => taskId);
  const received = [...input.evaluations]
    .sort((left, right) => left.task.taskId.localeCompare(right.task.taskId));
  const receivedIds = received.map(({ task }) => task.taskId);
  if (
    new Set(receivedIds).size !== receivedIds.length
    || expectedIds.length !== receivedIds.length
    || [...expectedIds].sort().some((id, index) => id !== receivedIds[index])
  ) {
    throw new Error("conditioning audit evaluations do not match the task set");
  }
  const study = await compileMainWireBaselineConditioningStudyV1();
  const sensitivities = buildSensitivitiesV1(received);
  const primarySpectrum = buildMainWireBaselineConditioningSpectrumV1(
    sensitivities,
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.primaryCoordinateIds,
  );
  const primaryAlternativeSubsetSpectra =
    buildMainWireBaselineConditioningAlternativeSubsetSpectraV1(
      sensitivities,
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.primaryCoordinateIds,
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditioningPolicy
        .maximumAdmittedCoordinateCount,
    );
  const allCoordinateIds = uniqueV1(received.flatMap(({ task }) =>
    task.coordinateId === null ? [] : [task.coordinateId]));
  const allCoordinateSpectrum = buildMainWireBaselineConditioningSpectrumV1(
    sensitivities,
    allCoordinateIds,
  );
  const positiveControls = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .positiveControls.map((control) => {
      const sensitivity = sensitivities.find((candidate) =>
        candidate.conditionId === "rest-hr60"
        && candidate.coordinateId === control.coordinateId
        && candidate.checkId === control.checkId);
      const observed = sensitivity?.halfStepNormalizedDerivative ?? null;
      return Object.freeze({
        controlId: control.controlId,
        conditionId: "rest-hr60" as const,
        coordinateId: control.coordinateId,
        checkId: control.checkId,
        expectedSign: control.expectedCentralSensitivitySign,
        observedHalfStepDerivative: observed,
        status: observed === null
          ? "unresolved" as const
          : Math.sign(observed) === control.expectedCentralSensitivitySign
            ? "passed" as const
            : "failed" as const,
      });
    });
  const acceptedTaskCount = received.filter(({ evaluationStatus }) =>
    evaluationStatus === "accepted").length;
  const summedEvaluationWallTimeMs = received.reduce(
    (sum, evaluation) => sum + evaluation.wallTimeMs,
    0,
  );
  const completed = acceptedTaskCount === received.length
    && received.every(({ safetySentinelStatus }) =>
      safetySentinelStatus === "passed")
    && sensitivities.every(({ status }) => status === "resolved")
    && positiveControls.every(({ status }) => status === "passed");
  return Object.freeze({
    auditId: MAIN_WIRE_BASELINE_CONDITIONING_AUDIT_V1_ID,
    studyIdentitySha256: study.studyIdentitySha256,
    status: completed ? "completed" as const : "unresolved" as const,
    mode: input.mode,
    protocolCommit: input.protocolCommit,
    executionCommit: input.executionCommit,
    requestedParallelism: input.requestedParallelism,
    effectiveParallelism: input.effectiveParallelism,
    batchWallTimeMs: input.batchWallTimeMs,
    summedEvaluationWallTimeMs,
    observedThroughputSpeedup: input.batchWallTimeMs > 0
      ? summedEvaluationWallTimeMs / input.batchWallTimeMs
      : 0,
    taskCount: received.length,
    acceptedTaskCount,
    centerCheckpointCache: Object.freeze({ ...input.centerCheckpointCache }),
    evaluations: Object.freeze(received),
    sensitivities,
    primarySpectrum,
    primaryAlternativeSubsetSpectra,
    allCoordinateSpectrum,
    positiveControls: Object.freeze(positiveControls),
    claim: Object.freeze({
      evidenceRole: "construction" as const,
      localDiagnosticOnly: true as const,
      uniqueParameterVectorClaimed: false as const,
      parameterSubsetAutomaticallySelected: false as const,
      standard70SafetySentinelsRequired: true as const,
      pulmonaryWaveformValidationClaimed: false as const,
      numericalFloorApplied: false as const,
      reason:
        "This first conditioning audit measures local response and execution throughput; numerical-floor-scaled admission follows the recorded floor artifact.",
    }),
  });
}

function resolveTaskV1(task: MainWireBaselineConditioningTaskV1): Readonly<{
  target: MainWireBaselineCalibrationCandidateInputsV1;
  targetCoordinateValue: number | null;
  transformedCoordinateValue: number | null;
}> {
  const condition = conditionByIdV1(task.conditionId);
  const base = baselineCandidateV1();
  let candidate = base;
  let targetCoordinateValue: number | null = null;
  let transformedCoordinateValue: number | null = null;
  if (task.coordinateId === null) {
    if (task.direction !== 0 || task.stepFraction !== 0) {
      throw new Error("conditioning center task is malformed");
    }
  } else {
    if (task.direction === 0 || task.stepFraction === 0) {
      throw new Error("conditioning perturbation task is malformed");
    }
    targetCoordinateValue = perturbationValueV1(
      base,
      task.coordinateId,
      task.direction,
      task.stepFraction,
    );
    transformedCoordinateValue =
      transformMainWireBaselineCalibrationParameterV1(
        task.coordinateId,
        targetCoordinateValue,
      );
    candidate = applyMainWireBaselineCalibrationParametersV1(base, [{
      parameterId: task.coordinateId,
      value: targetCoordinateValue,
    }]);
  }
  return Object.freeze({
    target: applyConditionV1(candidate, condition),
    targetCoordinateValue,
    transformedCoordinateValue,
  });
}

function perturbationValueV1(
  base: MainWireBaselineCalibrationCandidateInputsV1,
  coordinateId: MainWireBaselineCalibrationParameterIdV1,
  direction: -1 | 1,
  stepFraction: 0.5 | 1,
): number {
  const descriptor = mainWireBaselineCalibrationParameterV1(coordinateId);
  const center = readMainWireBaselineCalibrationParameterV1(base, coordinateId);
  const lowerProbe = center - descriptor.finiteDifferenceStep;
  const upperProbe = center + descriptor.finiteDifferenceStep;
  if (lowerProbe < descriptor.minimum || upperProbe > descriptor.maximum) {
    throw new Error(`${coordinateId} lacks a central finite-difference step`);
  }
  const centerTransformed =
    transformMainWireBaselineCalibrationParameterV1(coordinateId, center);
  const lowerTransformed =
    transformMainWireBaselineCalibrationParameterV1(coordinateId, lowerProbe);
  const upperTransformed =
    transformMainWireBaselineCalibrationParameterV1(coordinateId, upperProbe);
  const transformedStep = Math.min(
    centerTransformed - lowerTransformed,
    upperTransformed - centerTransformed,
  ) * stepFraction;
  const targetTransformed = centerTransformed + direction * transformedStep;
  return descriptor.transform === "log"
    ? Math.exp(targetTransformed)
    : targetTransformed;
}

function applyConditionV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  condition: MainWireBaselineConditioningConditionV1,
): MainWireBaselineCalibrationCandidateInputsV1 {
  return Object.freeze({
    ...candidate,
    hemodynamicResearchInputs:
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
        ...candidate.hemodynamicResearchInputs,
        heartRateBpm: condition.heartRateBpm,
        totalBloodVolumeMl:
          candidate.hemodynamicResearchInputs.totalBloodVolumeMl
          * condition.totalBloodVolumeMultiplier,
        systemicResistance:
          candidate.hemodynamicResearchInputs.systemicResistance
          * condition.systemicResistanceMultiplier,
      }),
  });
}

export function buildMainWireBaselineConditioningCenterCandidateV1(
  conditionId: string,
): MainWireBaselineCalibrationCandidateInputsV1 {
  return applyConditionV1(baselineCandidateV1(), conditionByIdV1(conditionId));
}

function compactEvaluationV1(
  task: MainWireBaselineConditioningTaskV1,
  sourceAnchorKind: MainWireBaselineConditioningTaskResultV1["sourceAnchorKind"],
  sourceCheckpointSha256: string | null,
  resolved: ReturnType<typeof resolveTaskV1>,
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
): MainWireBaselineConditioningTaskResultV1 {
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      task,
      sourceAnchorKind,
      sourceCheckpointSha256,
      targetCoordinateValue: resolved.targetCoordinateValue,
      transformedCoordinateValue: resolved.transformedCoordinateValue,
      evaluationStatus: evaluation.status,
      evaluationPhase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      initializationKind: null,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      classificationStatus: evaluation.partial?.classificationStatus ?? null,
      constructionGateStatus: null,
      objectiveGateStatus: null,
      safetySentinelStatus: null,
      failedConstructionCheckIds: Object.freeze([]),
      failedObjectiveCheckIds: Object.freeze([]),
      failedSafetySentinelCheckIds: Object.freeze([]),
      checks: Object.freeze([]),
      message: evaluation.message,
    });
  }
  return Object.freeze({
    task,
    sourceAnchorKind,
    sourceCheckpointSha256,
    targetCoordinateValue: resolved.targetCoordinateValue,
    transformedCoordinateValue: resolved.transformedCoordinateValue,
    evaluationStatus: evaluation.status,
    evaluationPhase: null,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    initializationKind: evaluation.initializationKind,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    objectiveGateStatus: evaluation.objectiveGateStatus,
    safetySentinelStatus: evaluation.safetySentinelStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    failedObjectiveCheckIds: evaluation.failedObjectiveCheckIds,
    failedSafetySentinelCheckIds: evaluation.failedSafetySentinelCheckIds,
    checks: Object.freeze(evaluation.objectiveChecks.map((check) =>
      Object.freeze({
        checkId: check.checkId,
        status: check.status,
        actual: check.actual,
        minimum: check.minimum,
        maximum: check.maximum,
        unit: check.unit,
      }))),
    message: null,
  });
}

function buildSensitivitiesV1(
  evaluations: readonly MainWireBaselineConditioningTaskResultV1[],
): readonly MainWireBaselineConditioningSensitivityV1[] {
  const taskById = new Map(evaluations.map((evaluation) =>
    [evaluation.task.taskId, evaluation] as const));
  const conditionIds = uniqueV1(evaluations.map(({ task }) => task.conditionId));
  const coordinateIds = uniqueV1(evaluations.flatMap(({ task }) =>
    task.coordinateId === null ? [] : [task.coordinateId]));
  const sensitivities: MainWireBaselineConditioningSensitivityV1[] = [];
  for (const conditionId of conditionIds) {
    for (const coordinateId of coordinateIds) {
      const fullMinus = taskById.get(
        taskV1(conditionId, coordinateId, -1, 1).taskId,
      );
      const fullPlus = taskById.get(
        taskV1(conditionId, coordinateId, 1, 1).taskId,
      );
      const halfMinus = taskById.get(
        taskV1(conditionId, coordinateId, -1, 0.5).taskId,
      );
      const halfPlus = taskById.get(
        taskV1(conditionId, coordinateId, 1, 0.5).taskId,
      );
      const reference = fullMinus?.checks.length
        ? fullMinus.checks
        : fullPlus?.checks.length
          ? fullPlus.checks
          : halfMinus?.checks.length
            ? halfMinus.checks
            : halfPlus?.checks ?? [];
      for (const check of reference) {
        const width = check.maximum - check.minimum;
        if (!(width > 0)) continue;
        const full = centralNormalizedDerivativeV1(
          fullMinus,
          fullPlus,
          check.checkId,
          width,
        );
        const half = centralNormalizedDerivativeV1(
          halfMinus,
          halfPlus,
          check.checkId,
          width,
        );
        const difference = full === null || half === null
          ? null
          : Math.abs(full - half);
        const magnitude = full === null || half === null
          ? 0
          : Math.max(Math.abs(full), Math.abs(half));
        sensitivities.push(Object.freeze({
          conditionId,
          coordinateId,
          checkId: check.checkId,
          unit: check.unit,
          constructionCorridorWidth: width,
          fullStepNormalizedDerivative: full,
          halfStepNormalizedDerivative: half,
          fullToHalfAbsoluteDifference: difference,
          fullToHalfRelativeDifference: difference === null || magnitude === 0
            ? null
            : difference / magnitude,
          signStable: full === null || half === null
            ? null
            : Math.sign(full) === Math.sign(half),
          status: full === null || half === null
            ? "unresolved" as const
            : "resolved" as const,
        }));
      }
    }
  }
  return Object.freeze(sensitivities);
}

function centralNormalizedDerivativeV1(
  minus: MainWireBaselineConditioningTaskResultV1 | undefined,
  plus: MainWireBaselineConditioningTaskResultV1 | undefined,
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  corridorWidth: number,
): number | null {
  if (
    minus?.evaluationStatus !== "accepted"
    || plus?.evaluationStatus !== "accepted"
    || minus.transformedCoordinateValue === null
    || plus.transformedCoordinateValue === null
  ) return null;
  const minusCheck = minus.checks.find((check) => check.checkId === checkId);
  const plusCheck = plus.checks.find((check) => check.checkId === checkId);
  if (minusCheck === undefined || plusCheck === undefined) return null;
  const transformedSpan = plus.transformedCoordinateValue
    - minus.transformedCoordinateValue;
  if (!(transformedSpan > 0)) return null;
  return (plusCheck.actual - minusCheck.actual)
    / corridorWidth
    / transformedSpan;
}

export function buildMainWireBaselineConditioningSpectrumV1(
  sensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): MainWireBaselineConditioningSpectrumV1 | null {
  if (coordinateIds.length === 0) return null;
  if (new Set(coordinateIds).size !== coordinateIds.length) {
    throw new Error("conditioning spectrum coordinate IDs are duplicated");
  }
  const groupByCheckId = new Map<string, string>();
  for (const group of normalReferenceEvidenceV1.checkGroups) {
    for (const checkId of group.checkIds) groupByCheckId.set(checkId, group.groupId);
  }
  const sensitivityByKey = new Map<
    string,
    MainWireBaselineConditioningSensitivityV1
  >();
  for (const sensitivity of sensitivities) {
    const key = sensitivityKeyV1(
      sensitivity.conditionId,
      sensitivity.checkId,
      sensitivity.coordinateId,
    );
    if (sensitivityByKey.has(key)) {
      throw new Error(`conditioning sensitivity is duplicated: ${key}`);
    }
    sensitivityByKey.set(key, sensitivity);
  }
  const rowKeys = uniqueV1(sensitivities.map(({ conditionId, checkId }) =>
    `${conditionId}::${checkId}`));
  const admitted: Readonly<{
    conditionId: string;
    checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
    groupKey: string;
    fullStepRow: readonly number[];
    halfStepRow: readonly number[];
  }>[] = [];
  const excludedRows:
    MainWireBaselineConditioningSpectrumV1["excludedRows"][number][] = [];
  let candidateRowCount = 0;
  for (const rowKey of rowKeys) {
    const [conditionId, checkId] = rowKey.split("::");
    const groupId = groupByCheckId.get(checkId);
    if (groupId === undefined) continue;
    candidateRowCount += 1;
    const rowSensitivities = coordinateIds.map((coordinateId) =>
      sensitivityByKey.get(sensitivityKeyV1(
        conditionId,
        checkId as MainWireIntegratedModelBaselineValidationCheckIdV1,
        coordinateId,
      )));
    if (rowSensitivities.some((sensitivity) =>
      sensitivity?.status !== "resolved"
      || sensitivity.fullStepNormalizedDerivative === null
      || sensitivity.halfStepNormalizedDerivative === null)) {
      excludedRows.push(Object.freeze({
        conditionId,
        checkId: checkId as MainWireIntegratedModelBaselineValidationCheckIdV1,
        reason: "unresolved-sensitivity" as const,
      }));
      continue;
    }
    if (rowSensitivities.some((sensitivity) =>
      sensitivity?.signStable !== true)) {
      excludedRows.push(Object.freeze({
        conditionId,
        checkId: checkId as MainWireIntegratedModelBaselineValidationCheckIdV1,
        reason: "step-sign-unstable" as const,
      }));
      continue;
    }
    const resolved = rowSensitivities as readonly MainWireBaselineConditioningSensitivityV1[];
    admitted.push(Object.freeze({
      conditionId,
      checkId: checkId as MainWireIntegratedModelBaselineValidationCheckIdV1,
      groupKey: `${conditionId}::${groupId}`,
      fullStepRow: Object.freeze(resolved.map((sensitivity) =>
        sensitivity.fullStepNormalizedDerivative!)),
      halfStepRow: Object.freeze(resolved.map((sensitivity) =>
        sensitivity.halfStepNormalizedDerivative!)),
    }));
  }
  const admittedCountByGroup = new Map<string, number>();
  for (const candidate of admitted) {
    admittedCountByGroup.set(
      candidate.groupKey,
      (admittedCountByGroup.get(candidate.groupKey) ?? 0) + 1,
    );
  }
  const weightedRows = admitted.map((candidate) => {
    const scale = Math.sqrt(admittedCountByGroup.get(candidate.groupKey)!);
    return Object.freeze({
      fullStepRow: candidate.fullStepRow.map((value) => value / scale),
      halfStepRow: candidate.halfStepRow.map((value) => value / scale),
    });
  });
  const rows = weightedRows.map(({ halfStepRow }) => halfStepRow);
  const fullStepRows = weightedRows.map(({ fullStepRow }) => fullStepRow);
  const singularValues = buildMainWireBaselineConditioningSingularValuesV1(
    rows,
    coordinateIds.length,
  );
  const maximum = singularValues[0] ?? 0;
  const numericalRankTolerance = maximum
    * Math.max(rows.length, coordinateIds.length)
    * Number.EPSILON;
  const numericalPositive = singularValues.filter((value) =>
    value > numericalRankTolerance);
  // The Frobenius norm bounds the spectral norm of the observed Jacobian
  // difference. It is used without assuming a finite-difference error order.
  const observedStepHalvingPerturbationFrobeniusNorm = Math.sqrt(
    rows.reduce((sum, row, rowIndex) => sum + row.reduce(
      (rowSum, value, columnIndex) => rowSum
        + (value - fullStepRows[rowIndex][columnIndex]) ** 2,
      0,
    ), 0),
  );
  const practicalRankTolerance = Math.max(
    numericalRankTolerance,
    observedStepHalvingPerturbationFrobeniusNorm,
  );
  const practicalPositive = singularValues.filter((value) =>
    value > practicalRankTolerance);
  const columnVectors = coordinateIds.map((_, columnIndex) =>
    rows.map((row) => row[columnIndex]));
  return Object.freeze({
    coordinateIds: Object.freeze([...coordinateIds]),
    candidateRowCount,
    rowCount: rows.length,
    rowAdmissionPolicy:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditioningPolicy
        .spectrumRowAdmission,
    excludedRows: Object.freeze(excludedRows),
    singularValues: Object.freeze(singularValues),
    singularValueRatiosToMaximum: Object.freeze(singularValues.map((value) =>
      maximum > 0 ? value / maximum : 0)),
    numericalRank: numericalPositive.length,
    numericalRankTolerance,
    conditionNumber: numericalPositive.length < coordinateIds.length
      ? null
      : numericalPositive[0] / numericalPositive.at(-1)!,
    practicalRank: practicalPositive.length,
    practicalRankTolerance,
    practicalRankToleranceComposition:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditioningPolicy
        .practicalRankToleranceComposition,
    practicalConditionNumber: practicalPositive.length < coordinateIds.length
      ? null
      : practicalPositive[0] / practicalPositive.at(-1)!,
    observedStepHalvingPerturbationFrobeniusNorm,
    columnNorms: Object.freeze(Object.fromEntries(coordinateIds.map(
      (coordinateId, index) => [coordinateId, normV1(columnVectors[index])],
    ))),
    columnCosines: Object.freeze(coordinateIds.flatMap((left, leftIndex) =>
      coordinateIds.slice(leftIndex + 1).map((right, offset) => {
        const rightIndex = leftIndex + 1 + offset;
        const leftVector = columnVectors[leftIndex];
        const rightVector = columnVectors[rightIndex];
        const denominator = normV1(leftVector) * normV1(rightVector);
        return Object.freeze({
          leftCoordinateId: left,
          rightCoordinateId: right,
          cosine: denominator > 0
            ? dotV1(leftVector, rightVector) / denominator
            : null,
        });
      }))),
    weighting:
      "construction-corridor-and-equal-mass-within-evidence-group" as const,
    inferentialClaimed: false as const,
  });
}

export function buildMainWireBaselineConditioningAlternativeSubsetSpectraV1(
  sensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
  maximumCoordinateCount: number,
): readonly MainWireBaselineConditioningSubsetSpectrumV1[] {
  if (
    !Number.isSafeInteger(maximumCoordinateCount)
    || maximumCoordinateCount < 1
    || maximumCoordinateCount > coordinateIds.length
    || coordinateIds.length > 30
    || new Set(coordinateIds).size !== coordinateIds.length
  ) {
    throw new Error("conditioning subset request is invalid");
  }
  const subsets: MainWireBaselineCalibrationParameterIdV1[][] = [];
  const upperMask = 2 ** coordinateIds.length;
  for (let mask = 1; mask < upperMask - 1; mask += 1) {
    const subset = coordinateIds.filter((_, index) =>
      (mask & (2 ** index)) !== 0);
    if (subset.length <= maximumCoordinateCount) subsets.push(subset);
  }
  subsets.sort((left, right) =>
    left.length - right.length
    || coordinateIds.reduce((order, coordinateId) => {
      if (order !== 0) return order;
      return left.includes(coordinateId) === right.includes(coordinateId)
        ? 0
        : left.includes(coordinateId) ? -1 : 1;
    }, 0));
  return Object.freeze(subsets.map((coordinateSubset) => {
    const spectrum = buildMainWireBaselineConditioningSpectrumV1(
      sensitivities,
      coordinateSubset,
    )!;
    return Object.freeze({
      coordinateIds: Object.freeze([...coordinateSubset]),
      spectrum,
      practicalRankStatus: spectrum.practicalRank === coordinateSubset.length
        ? "full" as const
        : "deficient" as const,
    });
  }));
}

function sensitivityKeyV1(
  conditionId: string,
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  coordinateId: MainWireBaselineCalibrationParameterIdV1,
): string {
  return `${conditionId}::${checkId}::${coordinateId}`;
}

function assertCenterCheckpointCacheSummaryV1(
  summary: MainWireBaselineConditioningAuditV1["centerCheckpointCache"],
  centerTaskCount: number,
): void {
  if (
    summary.policy
      !== "content-addressed-validated-and-exactly-reconfirmed"
    || typeof summary.requested !== "boolean"
    || typeof summary.effective !== "boolean"
    || (!summary.requested && summary.effective)
  ) {
    throw new Error("conditioning center checkpoint cache policy is invalid");
  }
  const counts = [
    summary.hitCount,
    summary.missCount,
    summary.rejectedEntryCount,
    summary.reconfirmationFallbackCount,
    summary.writeCount,
    summary.writeFailureCount,
  ];
  if (counts.some((count) =>
    !Number.isSafeInteger(count) || count < 0)) {
    throw new Error("conditioning center checkpoint cache counts are invalid");
  }
  if (!summary.effective) {
    if (counts.some((count) => count !== 0)) {
      throw new Error("disabled conditioning center cache recorded activity");
    }
    return;
  }
  if (
    summary.hitCount + summary.missCount + summary.rejectedEntryCount
      !== centerTaskCount
    || summary.reconfirmationFallbackCount > summary.hitCount
    || summary.writeCount + summary.writeFailureCount
      !== summary.missCount
        + summary.rejectedEntryCount
        + summary.reconfirmationFallbackCount
  ) {
    throw new Error("conditioning center checkpoint cache accounting differs");
  }
}

export function buildMainWireBaselineConditioningSingularValuesV1(
  rows: readonly (readonly number[])[],
  n: number,
): number[] {
  if (!Number.isSafeInteger(n) || n < 1 || rows.some((row) =>
    row.length !== n || row.some((value) => !Number.isFinite(value)))) {
    throw new Error("conditioning singular-value matrix is invalid");
  }
  const gram = Array.from({ length: n }, (_, left) =>
    Array.from({ length: n }, (_, right) => rows.reduce(
      (sum, row) => sum + row[left] * row[right],
      0,
    )));
  const scale = Math.max(1, ...gram.map((row) =>
    Math.max(...row.map((value) => Math.abs(value)))));
  const threshold = Number.EPSILON * scale * n * n;
  for (let iteration = 0; iteration < 100 * n * n; iteration += 1) {
    let p = 0;
    let q = 0;
    let maximum = 0;
    for (let left = 0; left < n; left += 1) {
      for (let right = left + 1; right < n; right += 1) {
        const candidate = Math.abs(gram[left][right]);
        if (candidate > maximum) {
          maximum = candidate;
          p = left;
          q = right;
        }
      }
    }
    if (maximum <= threshold) break;
    const angle = 0.5 * Math.atan2(
      2 * gram[p][q],
      gram[q][q] - gram[p][p],
    );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const pp = gram[p][p];
    const qq = gram[q][q];
    const pq = gram[p][q];
    gram[p][p] = cosine * cosine * pp
      - 2 * sine * cosine * pq
      + sine * sine * qq;
    gram[q][q] = sine * sine * pp
      + 2 * sine * cosine * pq
      + cosine * cosine * qq;
    gram[p][q] = 0;
    gram[q][p] = 0;
    for (let index = 0; index < n; index += 1) {
      if (index === p || index === q) continue;
      const ip = gram[index][p];
      const iq = gram[index][q];
      gram[index][p] = cosine * ip - sine * iq;
      gram[p][index] = gram[index][p];
      gram[index][q] = sine * ip + cosine * iq;
      gram[q][index] = gram[index][q];
    }
  }
  return gram.map((row, index) => Math.sqrt(Math.max(0, row[index])))
    .sort((left, right) => right - left);
}

function conditionByIdV1(
  conditionId: string,
): MainWireBaselineConditioningConditionV1 {
  const condition = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .conditions.find((candidate) => candidate.conditionId === conditionId);
  if (condition === undefined) {
    throw new Error(`conditioning condition is unregistered: ${conditionId}`);
  }
  return condition;
}

function baselineCandidateV1(): MainWireBaselineCalibrationCandidateInputsV1 {
  return Object.freeze({
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
    ventricularContractilityScale: 1,
  });
}

function taskV1(
  conditionId: string,
  coordinateId: MainWireBaselineCalibrationParameterIdV1 | null,
  direction: MainWireBaselineConditioningDirectionV1,
  stepFraction: MainWireBaselineConditioningStepFractionV1,
): MainWireBaselineConditioningTaskV1 {
  const coordinate = coordinateId ?? "center";
  const directionLabel = direction === -1
    ? "minus"
    : direction === 1
      ? "plus"
      : "center";
  return Object.freeze({
    taskId: `${conditionId}__${coordinate}__${directionLabel}__${stepFraction}`,
    conditionId,
    coordinateId,
    direction,
    stepFraction,
  });
}

function uniqueV1<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function normV1(values: readonly number[]): number {
  return Math.sqrt(dotV1(values, values));
}

function dotV1(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}
