import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import { cloneAndFreezeStudioJson } from "@/domain/json/CanonicalJson";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  validateMainWireIntegratedModelStandard70CheckpointV1,
  type MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";

import {
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  buildMainWireBaselineConditioningCenterCandidateV1,
  verifyMainWireBaselineConditioningAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  verifyMainWireBaselineConditioningPerturbationAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  verifyMainWireBaselineConditioningStageAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningStageAuditV1";
import {
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  mainWireBaselineCalibrationParameterV1,
  projectMainWireBaselineCalibrationParameterToReleaseLatticeV1,
  transformMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ACTIVE_TENSION =
  "myocardium.common-ventricular-active-tension-scale" as const;
const coordinateIds = [TBV, ACTIVE_TENSION] as const;
const center = buildMainWireBaselineConditioningCenterCandidateV1("rest-hr60");
const activeDirection = process.argv.includes("--active-minus") ? -1 : 1;
const truthTotalBloodVolumeMl = 4950;
const truthActiveTensionScale = 1.24 + activeDirection * 0.01;
const truth = applyMainWireBaselineCalibrationParametersV1(center, [
  { parameterId: TBV, value: truthTotalBloodVolumeMl },
  { parameterId: ACTIVE_TENSION, value: truthActiveTensionScale },
]);
const sourceCheckpoint =
  await validateMainWireIntegratedModelStandard70CheckpointV1(
    cloneAndFreezeStudioJson(settledBaselineCheckpointJson),
  );
const probeExecutionCommit = execFileSync(
  "git",
  ["rev-parse", "HEAD"],
  { encoding: "utf8" },
).trim();

const coarseSource = await jsonArtifactV1(
  "/tmp/main-wire-standard70-conditioning-primary-envelope-v1.json",
);
const refinedSource = await jsonArtifactV1(
  "/tmp/main-wire-standard70-conditioning-refined-derivatives-v1.json",
);
const attributionSource = await jsonArtifactV1(
  "/tmp/main-wire-standard70-conditioning-perturbation-attribution-v1.json",
);
const stageSource = await jsonArtifactV1(
  "/tmp/main-wire-standard70-conditioning-stage-v1.json",
);
const coarse = await verifyMainWireBaselineConditioningAuditV1(
  coarseSource.input,
);
const refined =
  await verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
    refinedSource.input,
    coarse,
  );
const attribution =
  await verifyMainWireBaselineConditioningPerturbationAttributionV1(
    attributionSource.input,
    coarse,
    refined,
  );
const stage = await verifyMainWireBaselineConditioningStageAuditV1(
  stageSource.input,
  coarse,
  refined,
  attribution,
);
const subset = stage.subsets.find((candidate) =>
  candidate.coordinateIds.join("::") === coordinateIds.join("::"));
if (
  subset === undefined
  || subset.compositionRobustnessStatus
    !== "supported-across-reported-compositions"
) {
  throw new Error("TBV plus active tension is not admitted for recovery");
}
const expectedKeys = subset.identificationRows.map(
  ({ conditionId, checkId }) => `${conditionId}::${checkId}`,
);
const expectedKeySet = new Set<string>(expectedKeys);
const admitted = buildMainWireBaselineConditioningAdmittedMatrixV1(
  refined.fineSensitivities.filter(({ conditionId, checkId }) =>
    expectedKeySet.has(`${conditionId}::${checkId}`)),
  coordinateIds,
);
const rowByKey = new Map<string, (typeof admitted.rows)[number]>(
  admitted.rows.map((row) =>
  [`${row.conditionId}::${row.checkId}`, row] as const));
const rows = expectedKeys.map((key) => rowByKey.get(key));
if (
  admitted.excludedRows.length > 0
  || rows.some((row) => row === undefined)
) {
  throw new Error("exact nonlinear recovery estimator rows are incomplete");
}
const estimatorRows = rows.map((row) =>
  row!.halfStepRow.map((value) => value / row!.weightDivisor));
const centerEvaluation = refined.fineEvaluations.find(({ taskResult }) =>
  taskResult.task.conditionId === "rest-hr60"
  && taskResult.task.coordinateId === null);
if (centerEvaluation === undefined) {
  throw new Error("refined rest center evaluation is missing");
}
const centerCheckById = new Map(centerEvaluation.taskResult.checks.map(
  (check) => [check.checkId, check] as const,
));

const target = await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
  hemodynamicResearchInputs: truth.hemodynamicResearchInputs,
  ventricularContractilityScale: truth.ventricularContractilityScale,
  mechanismResearchInputs: truth.mechanismResearchInputs,
  nominalDtSec: 0.001,
  initialization: Object.freeze({ kind: "cold" as const }),
});
if (target.status !== "accepted") {
  throw new Error(`target failed: ${target.status}/${target.message}`);
}
assertAllGatesPassedV1(target, "cold target");
const targetCheckById = new Map<
  string,
  (typeof target.objectiveChecks)[number]
>(target.objectiveChecks.map((check) =>
  [check.checkId, check] as const));
const response = rows.map((row) => {
  const centerCheck = centerCheckById.get(row!.checkId);
  const targetCheck = targetCheckById.get(row!.checkId);
  if (centerCheck === undefined || targetCheck === undefined) {
    throw new Error(`target row is missing: ${row!.checkId}`);
  }
  return (targetCheck.actual - centerCheck.actual)
    / row!.constructionCorridorWidth
    / row!.weightDivisor;
});
const offsets = solveTwoColumnLeastSquaresV1(estimatorRows, response);
const centerTransformed = coordinateIds.map((coordinateId) =>
  transformMainWireBaselineCalibrationParameterV1(
    coordinateId,
    coordinateId === TBV ? 4900 : 1.24,
  ));
const recoveredContinuous = coordinateIds.map((coordinateId, index) => {
  const descriptor = mainWireBaselineCalibrationParameterV1(coordinateId);
  const transformed = centerTransformed[index]! + offsets[index]!;
  return descriptor.transform === "log" ? Math.exp(transformed) : transformed;
});
const recoveredProjected = coordinateIds.map((coordinateId, index) =>
  projectMainWireBaselineCalibrationParameterToReleaseLatticeV1(
    coordinateId,
    recoveredContinuous[index]!,
  ));
const recoveredCandidate = applyMainWireBaselineCalibrationParametersV1(
  center,
  coordinateIds.map((parameterId, index) => ({
    parameterId,
    value: recoveredProjected[index]!,
  })),
);
const fitted = estimatorRows.map((row) => dotV1(row, offsets));
const residual = response.map((value, index) => value - fitted[index]!);

const direct = acceptedV1(
  await continueV1(recoveredCandidate, center, sourceCheckpoint),
  "direct baseline continuation",
);
const tbvIntermediateCandidate = applyMainWireBaselineCalibrationParametersV1(
  center,
  [{ parameterId: TBV, value: truthTotalBloodVolumeMl }],
);
const tbvIntermediate = acceptedV1(
  await continueV1(tbvIntermediateCandidate, center, sourceCheckpoint),
  "TBV-first intermediate",
);
const tbvFirst = acceptedV1(
  await continueV1(
    recoveredCandidate,
    tbvIntermediateCandidate,
    tbvIntermediate.exactResult.checkpoint,
  ),
  "TBV-first final",
);
const activeIntermediateCandidate =
  applyMainWireBaselineCalibrationParametersV1(
    center,
    [{ parameterId: ACTIVE_TENSION, value: truthActiveTensionScale }],
  );
const activeIntermediate = acceptedV1(
  await continueV1(activeIntermediateCandidate, center, sourceCheckpoint),
  "active-first intermediate",
);
const activeFirst = acceptedV1(
  await continueV1(
    recoveredCandidate,
    activeIntermediateCandidate,
    activeIntermediate.exactResult.checkpoint,
  ),
  "active-first final",
);
const replayRecords = [
  replayV1("direct-baseline", direct),
  replayV1("tbv-first", tbvFirst),
  replayV1("active-first", activeFirst),
];

const artifact = {
  experimentId: "main-wire-standard70-exact-diagonal-recovery-probe-v1",
  controlId: activeDirection === 1
    ? "tbv-plus-active-plus"
    : "tbv-plus-active-minus",
  source: {
    probeExecutionCommit,
    coarseArtifactRawSha256: coarseSource.rawSha256,
    coarseArtifactCanonicalSha256: await sha256CanonicalJsonHex(coarse),
    refinedArtifactRawSha256: refinedSource.rawSha256,
    refinedArtifactCanonicalSha256: await sha256CanonicalJsonHex(refined),
    attributionArtifactRawSha256: attributionSource.rawSha256,
    attributionArtifactCanonicalSha256:
      await sha256CanonicalJsonHex(attribution),
    stageArtifactRawSha256: stageSource.rawSha256,
    stageArtifactCanonicalSha256: await sha256CanonicalJsonHex(stage),
    studyIdentitySha256: stage.source.studyIdentitySha256,
    exactModelIdentitySha256: stage.source.exactModelIdentitySha256,
    stagePolicyIdentitySha256: stage.stagePolicy.policyIdentitySha256,
    refinedAuditExecutionCommit: refined.source.executionCommit,
    baselineCheckpointSha256: sourceCheckpoint.checkpointSha256,
  },
  target: {
    values: {
      totalBloodVolumeMl: truthTotalBloodVolumeMl,
      activeTensionScale: truthActiveTensionScale,
    },
    initializationKind: target.initializationKind,
    completedCycleCount: target.exactResult.completedCycleCount,
    classificationStatus: target.exactResult.classification.status,
    constructionGateStatus: target.constructionGateStatus,
    objectiveGateStatus: target.objectiveGateStatus,
    safetySentinelStatus: target.safetySentinelStatus,
    failedConstructionCheckIds: target.failedConstructionCheckIds,
    failedObjectiveCheckIds: target.failedObjectiveCheckIds,
    failedSafetySentinelCheckIds: target.failedSafetySentinelCheckIds,
    requestIdentitySha256: target.requestIdentitySha256,
    checkpointSha256: target.exactResult.checkpoint.checkpointSha256,
  },
  estimate: {
    transformedOffsets: offsets,
    continuousValues: recoveredContinuous,
    projectedValues: recoveredProjected,
    errorsInReleaseLatticeSteps: coordinateIds.map((coordinateId, index) =>
      (recoveredContinuous[index]!
        - (coordinateId === TBV
          ? truthTotalBloodVolumeMl
          : truthActiveTensionScale))
        / mainWireBaselineCalibrationParameterV1(coordinateId)
          .finiteDifferenceStep),
    responseNorm: normV1(response),
    fittedResidualNorm: normV1(residual),
    fittedResidualFraction: normV1(residual) / normV1(response),
  },
  intermediateStarts: [
    summaryV1("tbv-first-intermediate", tbvIntermediate),
    summaryV1("active-first-intermediate", activeIntermediate),
  ],
  replays: replayRecords,
  replaySummary: {
    replayCount: replayRecords.length,
    passedConstructionGateCount: replayRecords.filter(
      ({ constructionGateStatus }) => constructionGateStatus === "passed",
    ).length,
    passedSafetySentinelCount: replayRecords.filter(
      ({ safetySentinelStatus }) => safetySentinelStatus === "passed",
    ).length,
    maximumPrimaryNormalizedResidual: Math.max(
      ...replayRecords.map(({ primaryResidual }) =>
        primaryResidual.maximumAbsoluteNormalizedResidual),
    ),
  },
  targetPrimaryChecks: subset.identificationRows.map(({ checkId }) => {
    const check = targetCheckById.get(checkId)!;
    return { checkId, actual: check.actual, minimum: check.minimum,
      maximum: check.maximum, unit: check.unit };
  }),
  claim: {
    exactNonlinearSyntheticTargetEvaluated: true,
    independentColdTarget: true,
    localJacobianEstimateEvaluated: true,
    releaseLatticeRecoveryEvaluated: true,
    continuationOrderCompared: true,
    optimizerExecuted: false,
    multipleInteriorTargetControlsEvaluated: false,
    deliberatelyConfoundedRawParametersEvaluated: false,
    presetOrCaseFittingQualified: false,
  },
} as const;
const outputPath =
  activeDirection === 1
    ? "/tmp/main-wire-standard70-exact-diagonal-recovery-probe-v1.json"
    : "/tmp/main-wire-standard70-exact-diagonal-recovery-active-minus-probe-v1.json";
await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
process.stdout.write(`${outputPath}\n`);

async function jsonArtifactV1(path: string) {
  const raw = await readFile(path, "utf8");
  return Object.freeze({
    input: JSON.parse(raw) as unknown,
    rawSha256: createHash("sha256").update(raw).digest("hex"),
  });
}

function solveTwoColumnLeastSquaresV1(
  matrix: readonly (readonly number[])[],
  vector: readonly number[],
): readonly [number, number] {
  const left = matrix.map((row) => row[0]!);
  const right = matrix.map((row) => row[1]!);
  const ll = dotV1(left, left);
  const lr = dotV1(left, right);
  const rr = dotV1(right, right);
  const ly = dotV1(left, vector);
  const ry = dotV1(right, vector);
  const determinant = ll * rr - lr * lr;
  if (!(determinant > 0)) throw new Error("estimator is rank deficient");
  return [(rr * ly - lr * ry) / determinant,
    (ll * ry - lr * ly) / determinant];
}

function dotV1(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index]!, 0);
}

function normV1(vector: readonly number[]): number {
  return Math.hypot(...vector);
}

async function continueV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  sourceCandidate: MainWireBaselineCalibrationCandidateInputsV1,
  checkpoint: MainWireIntegratedModelStandard70CheckpointV1,
) {
  return evaluateMainWireStandard70BaselineCalibrationCandidateV1({
    hemodynamicResearchInputs: candidate.hemodynamicResearchInputs,
    ventricularContractilityScale: candidate.ventricularContractilityScale,
    mechanismResearchInputs: candidate.mechanismResearchInputs,
    nominalDtSec: 0.001,
    initialization: Object.freeze({
      kind: "standard70-parameter-continuation" as const,
      sourceCheckpoint: checkpoint,
      sourceHemodynamicResearchInputs:
        sourceCandidate.hemodynamicResearchInputs,
      sourceVentricularContractilityScale:
        sourceCandidate.ventricularContractilityScale,
      sourceMechanismResearchInputs:
        sourceCandidate.mechanismResearchInputs,
    }),
  });
}

function acceptedV1<T extends Awaited<ReturnType<typeof continueV1>>>(
  evaluation: T,
  label: string,
): Extract<T, { status: "accepted" }> {
  if (evaluation.status !== "accepted") {
    throw new Error(`${label} failed: ${evaluation.status}/${evaluation.message}`);
  }
  assertAllGatesPassedV1(evaluation, label);
  return evaluation as Extract<T, { status: "accepted" }>;
}

function assertAllGatesPassedV1(
  evaluation: Extract<
    Awaited<ReturnType<typeof continueV1>>,
    { status: "accepted" }
  >,
  label: string,
): void {
  if (
    evaluation.constructionGateStatus !== "passed"
    || evaluation.objectiveGateStatus !== "passed"
    || evaluation.safetySentinelStatus !== "passed"
    || evaluation.failedConstructionCheckIds.length > 0
    || evaluation.failedObjectiveCheckIds.length > 0
    || evaluation.failedSafetySentinelCheckIds.length > 0
  ) {
    throw new Error(`${label} did not pass every retained gate`);
  }
}

function summaryV1(
  label: string,
  evaluation: Extract<
    Awaited<ReturnType<typeof continueV1>>,
    { status: "accepted" }
  >,
) {
  return {
    label,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    objectiveGateStatus: evaluation.objectiveGateStatus,
    safetySentinelStatus: evaluation.safetySentinelStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    failedObjectiveCheckIds: evaluation.failedObjectiveCheckIds,
    failedSafetySentinelCheckIds: evaluation.failedSafetySentinelCheckIds,
  } as const;
}

function replayV1(
  label: string,
  evaluation: Extract<
    Awaited<ReturnType<typeof continueV1>>,
    { status: "accepted" }
  >,
) {
  const replayCheckById = new Map(evaluation.objectiveChecks.map((check) =>
    [check.checkId, check] as const));
  const normalizedResiduals = rows.map((row) => {
    const replayCheck = replayCheckById.get(row!.checkId)!;
    const targetCheck = targetCheckById.get(row!.checkId)!;
    return {
      checkId: row!.checkId,
      normalizedResidual: (replayCheck.actual - targetCheck.actual)
        / row!.constructionCorridorWidth
        / row!.weightDivisor,
    } as const;
  });
  return {
    ...summaryV1(label, evaluation),
    primaryResidual: {
      l2Norm: normV1(normalizedResiduals.map(({ normalizedResidual }) =>
        normalizedResidual)),
      maximumAbsoluteNormalizedResidual: Math.max(
        ...normalizedResiduals.map(({ normalizedResidual }) =>
          Math.abs(normalizedResidual)),
      ),
      rows: normalizedResiduals,
    },
  } as const;
}
