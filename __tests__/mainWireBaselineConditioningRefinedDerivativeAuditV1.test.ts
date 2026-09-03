import { describe, expect, it } from "vitest";

import standard70ValidationJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import type {
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  buildMainWireBaselineConditioningAuditV1,
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
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
  type MainWireBaselineConditioningRefinedCenterSourceV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import type {
  MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ARTERIAL_STIFFNESS = "hemodynamics.arterial-stiffness" as const;
const ACTIVE_TENSION =
  "myocardium.common-ventricular-active-tension-scale" as const;

describe("direct refined-dt conditioning derivatives", () => {
  it("reports supported declared pairs when coarse and refined Jacobians agree", async () => {
    const fixture = await syntheticFixtureV1(1.02);
    const audit =
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

    expect(audit.status).toBe("completed");
    expect(audit.taskCount).toBe(65);
    expect(audit.acceptedTaskCount).toBe(65);
    expect(audit.subsetDiagnostics).toHaveLength(5);
    expect(audit.summary.supportedDeclaredPairCoordinateSubsets).toEqual([
      [TBV, ARTERIAL_STIFFNESS],
      [TBV, ACTIVE_TENSION],
    ]);
    for (const pair of audit.subsetDiagnostics.filter(({ coordinateIds }) =>
      coordinateIds.length === 2)) {
      expect(pair.commonAdmittedRowCount).toBe(125);
      expect(pair.practicalRank).toBe(2);
      expect(pair.coarseRefinedDerivativePerturbationFrobeniusNorm)
        .toBeGreaterThan(0);
      expect(pair.resolutionStatus).toBe("supported");
    }

    const serialized = JSON.parse(JSON.stringify(audit));
    await expect(
      verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
        serialized,
        fixture.coarse,
      ),
    ).resolves.toEqual(serialized);
    const drifted = structuredClone(serialized);
    drifted.subsetDiagnostics[0].practicalRank += 1;
    await expect(
      verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
        drifted,
        fixture.coarse,
      ),
    ).rejects.toThrow(/differs from its reconstruction/);
  });

  it("does not support pairs whose refined Jacobian reverses from coarse", async () => {
    const fixture = await syntheticFixtureV1(-1);
    const audit =
      await buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
        coarseAudit: fixture.coarse,
        fineEvaluations: fixture.fineEvaluations,
        centerSources: fixture.centerSources,
        protocolCommit: "abcdef0",
        executionCommit: "abcdef1",
        requestedParallelism: 1,
        effectiveParallelism: 1,
        batchWallTimeMs: 50,
        refinedNominalDtSec: 0.001,
      });

    expect(audit.status).toBe("completed");
    expect(audit.summary.supportedDeclaredPairCoordinateSubsets).toEqual([]);
    expect(audit.subsetDiagnostics.filter(({ coordinateIds }) =>
      coordinateIds.length === 2).every(({ resolutionStatus }) =>
        resolutionStatus === "deficient")).toBe(true);
  });

  it("rejects the wrong dt and a broken coarse-to-refined source chain", async () => {
    const fixture = await syntheticFixtureV1(1.02);
    const common = {
      coarseAudit: fixture.coarse,
      fineEvaluations: fixture.fineEvaluations,
      centerSources: fixture.centerSources,
      protocolCommit: "abcdef0",
      executionCommit: "abcdef1",
      requestedParallelism: 1,
      effectiveParallelism: 1,
      batchWallTimeMs: 50,
    } as const;
    await expect(
      buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
        ...common,
        refinedNominalDtSec: 0.002,
      }),
    ).rejects.toThrow(/dt differs/);
    await expect(
      buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
        ...common,
        fineEvaluations: common.fineEvaluations.map((evaluation, index) =>
          index === 0
            ? {
                ...evaluation,
                taskResult: {
                  ...evaluation.taskResult,
                  sourceCheckpointSha256: "9".repeat(64),
                },
              }
            : evaluation),
        refinedNominalDtSec: 0.001,
      }),
    ).rejects.toThrow(/source chain differs/);
  });
});

async function syntheticFixtureV1(refinedScale: number) {
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
        constructions[index].constructionIdentitySha256,
      coarseCheckpointSha256: "d".repeat(64),
      refinedCheckpointSha256: "e".repeat(64),
    }) satisfies MainWireBaselineConditioningRefinedCenterSourceV1));
  return Object.freeze({
    coarse,
    centerSources,
    fineEvaluations: Object.freeze(fineTasks.map((task) => Object.freeze({
      nominalDtSec: 0.001,
      taskResult: taskResultV1(task, refinedScale, true),
    }))),
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
  const ids = new Set(normalReferenceEvidenceV1.checkGroups.flatMap(
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
  ) {
    return 0.07;
  }
  if (
    coordinateId === ACTIVE_TENSION
    && checkId === "left-ventricle.maximum-dpdt"
  ) {
    return 0.09;
  }
  return 0;
}
