import { describe, expect, it } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";
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
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
  type MainWireBaselineConditioningRefinedCenterSourceV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  buildMainWireBaselineConditioningPerturbationAttributionV1,
  verifyMainWireBaselineConditioningPerturbationAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  buildMainWireBaselineConditioningStageAuditV1,
  verifyMainWireBaselineConditioningStageAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningStageAuditV1";
import {
  buildMainWireBaselineLocalRecoveryAuditV1,
  verifyMainWireBaselineLocalRecoveryAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineLocalRecoveryAuditV1";
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

    const attribution =
      await buildMainWireBaselineConditioningPerturbationAttributionV1(
        fixture.coarse,
        audit,
      );
    expect(attribution.status).toBe("completed");
    expect(attribution.subsets).toHaveLength(audit.subsetDiagnostics.length);
    expect(attribution.claim).toEqual({
      attributionOnly: true,
      changesSourceAdmission: false,
      observationRoleAssigned: false,
      parameterSubsetAutomaticallySelected: false,
      causalExplanationClaimed: false,
    });
    for (const subset of attribution.subsets) {
      const source = audit.subsetDiagnostics.find(({ coordinateIds }) =>
        coordinateIds.join("::") === subset.coordinateIds.join("::"));
      expect(source).toBeDefined();
      expect(subset.rows).toHaveLength(source!.commonAdmittedRowCount);
      expect(subset.aggregate.coarseStepHalving).toBeCloseTo(
        source!.coarseStepHalvingPerturbationFrobeniusNorm,
        12,
      );
      expect(subset.aggregate.refinedStepHalving).toBeCloseTo(
        source!.refinedStepHalvingPerturbationFrobeniusNorm,
        12,
      );
      expect(subset.aggregate.coarseRefinedDerivative).toBeCloseTo(
        source!.coarseRefinedDerivativePerturbationFrobeniusNorm,
        12,
      );
      expect(Math.hypot(...subset.byCheckId.map(
        ({ coarseRefinedDerivative }) => coarseRefinedDerivative,
      ))).toBeCloseTo(subset.aggregate.coarseRefinedDerivative, 12);
      expect(Math.hypot(...subset.byConditionId.map(
        ({ coarseRefinedDerivative }) => coarseRefinedDerivative,
      ))).toBeCloseTo(subset.aggregate.coarseRefinedDerivative, 12);
    }

    const serializedAttribution = JSON.parse(JSON.stringify(attribution));
    await expect(
      verifyMainWireBaselineConditioningPerturbationAttributionV1(
        serializedAttribution,
        fixture.coarse,
        audit,
      ),
    ).resolves.toEqual(serializedAttribution);
    const driftedAttribution = structuredClone(serializedAttribution);
    driftedAttribution.subsets[0].rows[0].coarseRefinedDerivative += 1;
    await expect(
      verifyMainWireBaselineConditioningPerturbationAttributionV1(
        driftedAttribution,
        fixture.coarse,
        audit,
      ),
    ).rejects.toThrow(/differs from its reconstruction/);

    const stageAudit = await buildMainWireBaselineConditioningStageAuditV1(
      fixture.coarse,
      audit,
      attribution,
    );
    expect(
      stageAudit.summary
        .primaryMaximumComponentSupportedDeclaredPairCoordinateSubsets,
    )
      .toEqual([
        [TBV, ARTERIAL_STIFFNESS],
        [TBV, ACTIVE_TENSION],
      ]);
    expect(stageAudit.claim).toEqual(expect.objectContaining({
      rolePolicyRetrospectivelyAppliedToExistingSources: true,
      confirmatoryRoleSelectionClaimed: false,
      parameterFittingExecuted: false,
      parameterSubsetAutomaticallySelected: false,
      independentObservationCountClaimed: false,
      measurementCovarianceApplied: false,
      qualificationGatesRemoved: false,
      rightHeartOrPulmonaryFitClaimed: false,
    }));
    const observationInventory = normalReferenceEvidenceV1.checkGroups.map(
      ({ groupId, checkIds }) => ({ groupId, checkIds }),
    );
    expect(stageAudit.stagePolicy.observationInventoryIdentitySha256).toBe(
      await sha256CanonicalJsonHex(observationInventory),
    );
    for (const pair of stageAudit.subsets.filter(({ coordinateIds }) =>
      coordinateIds.length === 2)) {
      expect(pair.sourceAllRows.candidateRowCount).toBe(125);
      expect(pair.sourceAllRows.commonAdmittedRowCount).toBe(125);
      expect(pair.allConditionsOperatingPointGroups.candidateRowCount)
        .toBe(45);
      expect(pair.allConditionsOperatingPointGroups.commonAdmittedRowCount)
        .toBe(45);
      expect(pair.restConditionsAllGroups.candidateRowCount).toBe(25);
      expect(pair.restConditionsAllGroups.commonAdmittedRowCount).toBe(25);
      expect(pair.operatingPointIdentification.candidateRowCount).toBe(9);
      expect(pair.operatingPointIdentification.commonAdmittedRowCount).toBe(9);
      expect(pair.gateOnlyCommonRowCount).toBe(116);
      expect(pair.operatingPointIdentification.missingCandidateRows)
        .toEqual([]);
      expect(pair.identificationRows.every(({ conditionId }) =>
        conditionId === "rest-hr60")).toBe(true);
      expect(pair.primaryMaximumComponentResolutionStatus).toBe("supported");
      expect(pair.sourceResolutionStatus).toBe("supported");
      expect(pair.identificationByObservationGroup).toHaveLength(4);
      expect(pair.identificationByObservationGroup.reduce((sum, group) =>
        sum + group.refinedHalfStepSignalSquaredShare!, 0)).toBeCloseTo(1, 12);
    }
    const activePair = stageAudit.subsets.find(({ coordinateIds }) =>
      coordinateIds.join("::") === [TBV, ACTIVE_TENSION].join("::"))!;
    expect(activePair.identificationRows).toContainEqual(
      expect.objectContaining({
        checkId: "left-ventricle.ejection-fraction",
      }),
    );
    expect(activePair.identificationRows).not.toContainEqual(
      expect.objectContaining({
        checkId: "left-ventricle.maximum-dpdt",
      }),
    );
    expect(activePair.identificationRows).not.toContainEqual(
      expect.objectContaining({
        checkId: "pulmonary-artery-pressure.maximum",
      }),
    );
    const serializedStageAudit = JSON.parse(JSON.stringify(stageAudit));
    await expect(verifyMainWireBaselineConditioningStageAuditV1(
      serializedStageAudit,
      fixture.coarse,
      audit,
      attribution,
    )).resolves.toEqual(serializedStageAudit);
    const driftedStageAudit = structuredClone(serializedStageAudit);
    driftedStageAudit.subsets[0].operatingPointIdentification
      .toleranceCompositions[0].practicalRank += 1;
    await expect(verifyMainWireBaselineConditioningStageAuditV1(
      driftedStageAudit,
      fixture.coarse,
      audit,
      attribution,
    )).rejects.toThrow(/differs from its reconstruction/);

    const recovery = await buildMainWireBaselineLocalRecoveryAuditV1(
      fixture.coarse,
      audit,
      attribution,
      stageAudit,
    );
    expect(recovery.summary.controlCount).toBe(12);
    expect(recovery.summary.passedControlCount).toBe(12);
    expect(recovery.summary.allControlsRecoverTruthLatticePoint).toBe(true);
    expect(
      recovery.summary.maximumAbsoluteRecoveryErrorInReleaseLatticeSteps,
    ).toBeLessThan(0.5);
    expect(recovery.summary.unsupportedComparisonRefusalRequired).toBe(false);
    expect(recovery.summary.unsupportedComparisonRefused).toBe(false);
    expect(recovery.unsupportedComparisonRefusal.refusalStatus)
      .toBe("not-required");
    expect(recovery.controls.every(({ boundCheckStatus }) =>
      boundCheckStatus === "passed")).toBe(true);
    expect(recovery.claim).toEqual({
      localLinearizedRecoveryOnly: true,
      crossEstimateRatherThanSelfEstimateControls: true,
      exactNonlinearSyntheticTargetsEvaluated: false,
      optimizerExecuted: false,
      parameterSubsetAutomaticallySelected: false,
      uniqueParameterVectorClaimed: false,
      rawParameterConfoundRefusalClaimed: false,
      measurementOrModelDiscrepancyApplied: false,
      presetOrCaseFittingQualified: false,
    });
    const serializedRecovery = JSON.parse(JSON.stringify(recovery));
    await expect(verifyMainWireBaselineLocalRecoveryAuditV1(
      serializedRecovery,
      fixture.coarse,
      audit,
      attribution,
      stageAudit,
    )).resolves.toEqual(serializedRecovery);
    const driftedRecovery = structuredClone(serializedRecovery);
    driftedRecovery.controls[0].recoveredCoordinateValues[TBV] += 1;
    await expect(verifyMainWireBaselineLocalRecoveryAuditV1(
      driftedRecovery,
      fixture.coarse,
      audit,
      attribution,
      stageAudit,
    )).rejects.toThrow(/differs from its reconstruction/);

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
    const attribution =
      await buildMainWireBaselineConditioningPerturbationAttributionV1(
        fixture.coarse,
        audit,
      );
    const stageAudit = await buildMainWireBaselineConditioningStageAuditV1(
      fixture.coarse,
      audit,
      attribution,
    );
    const pairs = stageAudit.subsets.filter(({ coordinateIds }) =>
      coordinateIds.length === 2);
    expect(pairs.every(({ sourceResolutionStatus }) =>
      sourceResolutionStatus === "deficient")).toBe(true);
    expect(
      stageAudit.summary.sourceAllRowsDeficientDeclaredPairCoordinateSubsets,
    ).toEqual([
      [TBV, ARTERIAL_STIFFNESS],
      [TBV, ACTIVE_TENSION],
    ]);
    await expect(buildMainWireBaselineLocalRecoveryAuditV1(
      fixture.coarse,
      audit,
      attribution,
      stageAudit,
    )).rejects.toThrow(/not supported on a complete primary basis/);
  });

  it("recovers the supported pair and refuses the unsupported comparison", async () => {
    const fixture = await syntheticFixtureV1(1.02, -1);
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
    const attribution =
      await buildMainWireBaselineConditioningPerturbationAttributionV1(
        fixture.coarse,
        audit,
      );
    const stageAudit = await buildMainWireBaselineConditioningStageAuditV1(
      fixture.coarse,
      audit,
      attribution,
    );
    const recovery = await buildMainWireBaselineLocalRecoveryAuditV1(
      fixture.coarse,
      audit,
      attribution,
      stageAudit,
    );

    expect(recovery.summary.allControlsRecoverTruthLatticePoint).toBe(true);
    expect(recovery.summary.unsupportedComparisonRefusalRequired).toBe(true);
    expect(recovery.summary.unsupportedComparisonRefused).toBe(true);
    expect(recovery.unsupportedComparisonRefusal).toEqual(
      expect.objectContaining({
        coordinateIds: [TBV, ARTERIAL_STIFFNESS],
        refusalRequired: true,
        recoveryAttempted: false,
        refusalStatus: "passed",
      }),
    );
  });

  it("attributes only rows admitted by both source resolutions", async () => {
    const fixture = await syntheticFixtureV1(1.02);
    const excludedConditionId = "rest-hr60";
    const excludedCheckId = "left-ventricle.edv-index";
    const fineEvaluations = fixture.fineEvaluations.map((evaluation) => {
      const { task } = evaluation.taskResult;
      if (
        task.conditionId !== excludedConditionId
        || task.coordinateId !== TBV
        || task.stepFraction !== 0.5
      ) return evaluation;
      return Object.freeze({
        ...evaluation,
        taskResult: Object.freeze({
          ...evaluation.taskResult,
          checks: Object.freeze(evaluation.taskResult.checks.map((check) =>
            check.checkId === excludedCheckId
              ? Object.freeze({
                  ...check,
                  actual: check.minimum + check.maximum - check.actual,
                })
              : check)),
        }),
      });
    });
    const audit =
      await buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
        coarseAudit: fixture.coarse,
        fineEvaluations,
        centerSources: fixture.centerSources,
        protocolCommit: "abcdef0",
        executionCommit: "abcdef1",
        requestedParallelism: 8,
        effectiveParallelism: 8,
        batchWallTimeMs: 50,
        refinedNominalDtSec: 0.001,
      });
    const source = audit.subsetDiagnostics.find(({ coordinateIds }) =>
      coordinateIds.length === 1 && coordinateIds[0] === TBV)!;
    expect(source.coarseAdmittedRowCount).toBe(125);
    expect(source.refinedAdmittedRowCount).toBe(124);
    expect(source.commonAdmittedRowCount).toBe(124);

    const attribution =
      await buildMainWireBaselineConditioningPerturbationAttributionV1(
        fixture.coarse,
        audit,
      );
    const subset = attribution.subsets.find(({ coordinateIds }) =>
      coordinateIds.length === 1 && coordinateIds[0] === TBV)!;
    expect(subset.rows).toHaveLength(124);
    expect(subset.rows).not.toContainEqual(expect.objectContaining({
      conditionId: excludedConditionId,
      checkId: excludedCheckId,
    }));
    expect(subset.aggregate.coarseRefinedDerivative).toBeCloseTo(
      source.coarseRefinedDerivativePerturbationFrobeniusNorm,
      12,
    );
    const stageAudit = await buildMainWireBaselineConditioningStageAuditV1(
      fixture.coarse,
      audit,
      attribution,
    );
    const stageSubset = stageAudit.subsets.find(({ coordinateIds }) =>
      coordinateIds.length === 1 && coordinateIds[0] === TBV)!;
    expect(stageSubset.operatingPointIdentification.candidateRowCount).toBe(9);
    expect(stageSubset.operatingPointIdentification.commonAdmittedRowCount)
      .toBe(8);
    expect(stageSubset.operatingPointIdentification.missingCandidateRows)
      .toEqual([{
      conditionId: excludedConditionId,
      checkId: excludedCheckId,
    }]);
    expect(stageSubset.primaryMaximumComponentResolutionStatus)
      .toBe("unresolved");
    expect(stageSubset.compositionRobustnessStatus).toBe("unresolved");
    const stagePair = stageAudit.subsets.find(({ coordinateIds }) =>
      coordinateIds.join("::") === [TBV, ACTIVE_TENSION].join("::"))!;
    expect(stagePair.operatingPointIdentification.candidateRowCount).toBe(9);
    expect(stagePair.operatingPointIdentification.commonAdmittedRowCount)
      .toBe(8);
    expect(stagePair.primaryMaximumComponentResolutionStatus)
      .toBe("unresolved");
    expect(
      stageAudit.summary
        .primaryMaximumComponentSupportedDeclaredPairCoordinateSubsets,
    ).not.toContainEqual([TBV, ACTIVE_TENSION]);
    await expect(buildMainWireBaselineLocalRecoveryAuditV1(
      fixture.coarse,
      audit,
      attribution,
      stageAudit,
    )).rejects.toThrow(/not supported on a complete primary basis/);
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
          index === 0 ? { ...evaluation, nominalDtSec: 0.002 } : evaluation),
        refinedNominalDtSec: 0.001,
      }),
    ).rejects.toThrow(/task evaluation dt differs/);
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
    await expect(
      buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
        ...common,
        fineEvaluations: common.fineEvaluations.map((evaluation, index) =>
          index === 0
            ? {
                ...evaluation,
                taskResult: {
                  ...evaluation.taskResult,
                  requestIdentitySha256: "9".repeat(64),
                },
              }
            : evaluation),
        refinedNominalDtSec: 0.001,
      }),
    ).rejects.toThrow(/request identity differs/);
    const relabeledTask = common.fineEvaluations[0]!.taskResult.task;
    const relabeledSource = fixture.centerSources.find(({ conditionId }) =>
      conditionId === relabeledTask.conditionId)!;
    const constructionPolicy =
      await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
    const coarseDtRequestIdentity = await fineRequestIdentityV1(
      relabeledTask,
      relabeledSource,
      constructionPolicy.constructionPolicyIdentitySha256,
      0.002,
    );
    await expect(
      buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
        ...common,
        fineEvaluations: common.fineEvaluations.map((evaluation, index) =>
          index === 0
            ? {
                ...evaluation,
                taskResult: {
                  ...evaluation.taskResult,
                  requestIdentitySha256: coarseDtRequestIdentity,
                },
              }
            : evaluation),
        refinedNominalDtSec: 0.001,
      }),
    ).rejects.toThrow(/request identity differs/);
  });
});

async function syntheticFixtureV1(
  refinedScale: number,
  arterialStiffnessRefinedScale = refinedScale,
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
        constructions[index].constructionIdentitySha256,
      coarseCheckpointSha256: "d".repeat(64),
      refinedCheckpointSha256: "e".repeat(64),
    }) satisfies MainWireBaselineConditioningRefinedCenterSourceV1));
  const sourceByCondition = new Map(centerSources.map((source) =>
    [source.conditionId, source] as const));
  const constructionPolicy =
    await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  const fineEvaluations = Object.freeze(await Promise.all(fineTasks.map(
    async (task) => {
      const taskResult = taskResultV1(
        task,
        task.coordinateId === ARTERIAL_STIFFNESS
          ? arterialStiffnessRefinedScale
          : refinedScale,
        true,
      );
      const source = sourceByCondition.get(task.conditionId)!;
      const requestIdentitySha256 = await fineRequestIdentityV1(
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
  return Object.freeze({
    coarse,
    centerSources,
    fineEvaluations,
  });
}

async function fineRequestIdentityV1(
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
  if (
    coordinateId === ACTIVE_TENSION
    && checkId === "left-ventricle.ejection-fraction"
  ) {
    return 0.06;
  }
  return 0;
}
