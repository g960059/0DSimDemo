import { MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import standard70ValidationJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import type {
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  buildMainWireBaselineConditioningAuditV1,
  buildMainWireBaselineConditioningCenterCandidateV1,
  buildMainWireBaselineConditioningTasksV1,
  resolveMainWireBaselineConditioningTaskV1,
  type MainWireBaselineConditioningTaskResultV1,
  type MainWireBaselineConditioningTaskV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  buildMainWireBaselineConditioningCenterConstructionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningCenterCacheV1";
import {
  buildMainWireBaselineConditioningRefinedDerivativeAuditV1,
  buildMainWireBaselineConditioningRefinedTasksV1,
  type MainWireBaselineConditioningRefinedCenterSourceV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  buildMainWireBaselineConditioningPerturbationAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  buildMainWireBaselineConditioningStageAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningStageAuditV1";
import {
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
  buildMainWireStandard70BaselineCalibrationRequestIdentityV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import type {
  MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ARTERIAL_STIFFNESS = "hemodynamics.arterial-stiffness" as const;
const ACTIVE_TENSION =
  "myocardium.common-ventricular-active-tension-scale" as const;

export async function buildMainWireBaselineConditioningSyntheticFixtureV1(
  refinedScale: number,
) {
  const coarseTasks = buildMainWireBaselineConditioningTasksV1({
    mode: "primary-envelope",
  });
  const fineTasks = buildMainWireBaselineConditioningRefinedTasksV1();
  const coarse = await buildMainWireBaselineConditioningAuditV1({
    mode: "primary-envelope",
    protocolCommit: "abcdef0",
    executionCommit: "abcdef1",
    requestedParallelism: 8,
    effectiveParallelism: 8,
    batchWallTimeMs: 100,
    evaluations: coarseTasks.map((task) => taskResultV1(task, 1, false)),
    centerCheckpointCache: Object.freeze({
      policy: "content-addressed-validated-and-exactly-reconfirmed" as const,
      requested: true,
      effective: true,
      hitCount: 5,
      missCount: 0,
      rejectedEntryCount: 0,
      reconfirmationFallbackCount: 0,
      writeCount: 0,
      writeFailureCount: 0,
    }),
  });
  const conditionIds = fineTasks
    .filter(({ coordinateId }) => coordinateId === null)
    .map(({ conditionId }) => conditionId);
  const constructions = await Promise.all(conditionIds.map((conditionId) =>
    buildMainWireBaselineConditioningCenterConstructionV1(conditionId)));
  const centerSources = Object.freeze(conditionIds.map((conditionId, index) =>
    Object.freeze({
      conditionId,
      coarseConstructionIdentitySha256:
        constructions[index]!.constructionIdentitySha256,
      coarseCheckpointSha256: "d".repeat(64),
      refinedCheckpointSha256: "e".repeat(64),
    }) satisfies MainWireBaselineConditioningRefinedCenterSourceV1));
  const sourceByCondition = new Map(centerSources.map((source) =>
    [source.conditionId, source] as const));
  const constructionPolicy =
    await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  const fineEvaluations = Object.freeze(await Promise.all(fineTasks.map(
    async (task) => {
      const taskResult = taskResultV1(task, refinedScale, true);
      const source = sourceByCondition.get(task.conditionId)!;
      const requestIdentitySha256 =
        await buildMainWireBaselineConditioningSyntheticFineRequestIdentityV1(
          task,
          source,
          constructionPolicy.constructionPolicyIdentitySha256,
          0.001,
        );
      return Object.freeze({
        nominalDtSec: 0.001,
        taskResult: Object.freeze({
          ...taskResult,
          requestIdentitySha256,
        }),
      });
    },
  )));
  return Object.freeze({ coarse, centerSources, fineEvaluations });
}

export async function buildMainWireBaselineConditioningSyntheticArtifactsV1(
  refinedScale: number,
) {
  const fixture =
    await buildMainWireBaselineConditioningSyntheticFixtureV1(refinedScale);
  const refined =
    await buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
      coarseAudit: fixture.coarse,
      fineEvaluations: fixture.fineEvaluations,
      centerSources: fixture.centerSources,
      protocolCommit: "abcdef0",
      executionCommit: "abcdef1",
      requestedParallelism: 8,
      effectiveParallelism: 8,
      batchWallTimeMs: 50,
      refinedNominalDtSec: 0.001,
    });
  const attribution =
    await buildMainWireBaselineConditioningPerturbationAttributionV1(
      fixture.coarse,
      refined,
    );
  const stage = await buildMainWireBaselineConditioningStageAuditV1(
    fixture.coarse,
    refined,
    attribution,
  );
  return Object.freeze({
    coarse: fixture.coarse,
    refined,
    attribution,
    stage,
  });
}

export async function buildMainWireBaselineConditioningSyntheticFineRequestIdentityV1(
  task: MainWireBaselineConditioningTaskV1,
  source: MainWireBaselineConditioningRefinedCenterSourceV1,
  constructionPolicyIdentitySha256: string,
  nominalDtSec: number,
): Promise<string> {
  const resolved = resolveMainWireBaselineConditioningTaskV1(task);
  const centerCandidate =
    buildMainWireBaselineConditioningCenterCandidateV1(task.conditionId);
  return buildMainWireStandard70BaselineCalibrationRequestIdentityV1({
    constructionPolicyIdentitySha256,
    hemodynamicResearchInputs: resolved.target.hemodynamicResearchInputs,
    ventricularContractilityScale:
      resolved.target.ventricularContractilityScale,
    mechanismResearchInputs: resolved.target.mechanismResearchInputs,
    nominalDtSec,
    initialization: task.coordinateId === null
      ? Object.freeze({
          kind: "standard70-exact-checkpoint" as const,
          checkpointSha256: source.coarseCheckpointSha256,
        })
      : Object.freeze({
          kind: "standard70-parameter-continuation" as const,
          sourceCheckpointSha256: source.refinedCheckpointSha256,
          sourceHemodynamicResearchInputs:
            centerCandidate.hemodynamicResearchInputs,
          sourceVentricularContractilityScale:
            centerCandidate.ventricularContractilityScale,
          sourceMechanismResearchInputs:
            centerCandidate.mechanismResearchInputs,
        }),
  });
}

function taskResultV1(
  task: MainWireBaselineConditioningTaskV1,
  derivativeScale: number,
  refined: boolean,
): MainWireBaselineConditioningTaskResultV1 {
  const resolved = resolveMainWireBaselineConditioningTaskV1(task);
  const checks = objectiveChecksV1().map((check) => {
    const width = check.maximum - check.minimum;
    const derivative = effectV1(task.coordinateId, check.checkId)
      * derivativeScale;
    const actual = (check.minimum + check.maximum) / 2
      + derivative * task.direction * task.stepFraction * width;
    return Object.freeze({
      checkId: check.checkId,
      status: "passed" as const,
      actual,
      minimum: check.minimum,
      maximum: check.maximum,
      unit: check.unit,
    });
  });
  const center = task.coordinateId === null;
  return Object.freeze({
    task,
    sourceAnchorKind: center
      ? "verified-condition-cache" as const
      : "condition-center" as const,
    sourceCheckpointSha256: refined
      ? center ? "d".repeat(64) : "e".repeat(64)
      : "d".repeat(64),
    targetCoordinateValue: resolved.targetCoordinateValue,
    transformedCoordinateValue: resolved.transformedCoordinateValue,
    evaluationStatus: "accepted" as const,
    evaluationPhase: null,
    requestIdentitySha256: "c".repeat(64),
    initializationKind: center
      ? "standard70-exact-checkpoint"
      : "standard70-parameter-continuation",
    wallTimeMs: 1,
    completedCycleCount: 3,
    classificationStatus: "period1-converged",
    constructionGateStatus: "passed" as const,
    objectiveGateStatus: "passed" as const,
    safetySentinelStatus: "passed" as const,
    failedConstructionCheckIds: Object.freeze([]),
    failedObjectiveCheckIds: Object.freeze([]),
    failedSafetySentinelCheckIds: Object.freeze([]),
    checks: Object.freeze(checks),
    message: null,
  });
}

function objectiveChecksV1():
  readonly MainWireIntegratedModelBaselineValidationCheckV1[] {
  const ids = new Set(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap(
    ({ checkIds }) => checkIds,
  ));
  return standard70ValidationJson.checks.filter(({ checkId }) =>
    ids.has(checkId)) as MainWireIntegratedModelBaselineValidationCheckV1[];
}

function effectV1(
  coordinateId: MainWireBaselineCalibrationParameterIdV1 | null,
  checkId: string,
): number {
  if (coordinateId === TBV && checkId === "left-ventricle.edv-index") {
    return 0.08;
  }
  if (
    coordinateId === ARTERIAL_STIFFNESS
    && checkId === "aortic-pressure.maximum"
  ) return 0.07;
  if (
    coordinateId === ACTIVE_TENSION
    && checkId === "left-ventricle.maximum-dpdt"
  ) return 0.09;
  if (
    coordinateId === ACTIVE_TENSION
    && checkId === "left-ventricle.ejection-fraction"
  ) return 0.06;
  return 0;
}
