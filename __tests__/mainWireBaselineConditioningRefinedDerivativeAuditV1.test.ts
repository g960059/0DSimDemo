import { describe, expect, it } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";
import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  buildMainWireBaselineConditioningRefinedDerivativeAuditV1,
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
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
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  buildMainWireBaselineConditioningSyntheticFineRequestIdentityV1 as
    fineRequestIdentityV1,
  buildMainWireBaselineConditioningSyntheticFixtureV1 as syntheticFixtureV1,
} from "@/__tests__/fixtures/mainWireBaselineConditioningSyntheticFixtureV1";

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
