import { MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { describe, expect, it } from "vitest";

import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import standard70ValidationJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import type {
  MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type {
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  buildMainWireBaselineConditioningCenterConstructionV1,
  createMainWireBaselineConditioningCenterCacheArtifactV1,
  validateMainWireBaselineConditioningCenterCacheArtifactV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningCenterCacheV1";
import {
  buildMainWireBaselineConditioningAlternativeSubsetSpectraV1,
  buildMainWireBaselineConditioningAuditV1,
  buildMainWireBaselineConditioningSpectrumV1,
  buildMainWireBaselineConditioningTasksV1,
  assertMainWireBaselineConditioningTaskResultV1,
  evaluateMainWireBaselineConditioningTaskV1,
  resolveMainWireBaselineConditioningTaskV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningSensitivityV1,
  type MainWireBaselineConditioningTaskResultV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
  lintMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";
import {
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";

const coordinates = [
  "hemodynamics.total-blood-volume-ml",
  "hemodynamics.systemic-resistance",
] as const;

describe("baseline conditioning spectrum", () => {
  it("binds new study evidence to evaluation roles without relabelling a historical numerical policy", async () => {
    const study = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1;
    const currentPolicy = await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
    expect(study.constructionPolicyRevisionId)
      .toBe(normalReferenceEvidenceV1.evaluationPolicyId);
    expect(study.constructionPolicyRevisionId)
      .toBe(currentPolicy.constructionPolicyRevisionId);
    expect(study.protocolRevision.revision).toBe(18);
    const historicalPolicy = normalReferenceEvidenceV1.policyRevisions.at(-1)!;
    const stale = { ...study, constructionPolicyRevisionId: historicalPolicy.revisionId };
    expect(lintMainWireBaselineConditioningStudyV1(stale)).toContainEqual({
      code: "policy-revision-stale",
      path: "constructionPolicyRevisionId",
      message: expect.any(String),
    });
    await expect(compileMainWireBaselineConditioningStudyV1(stale)).rejects.toThrow();
    expect(stale.constructionPolicyRevisionId).toBe(historicalPolicy.revisionId);
  });

  it("retains finite pressure-rate reference warnings without failing conditioning admission", async () => {
    const audit = await syntheticCompletedAuditV1();
    const source = audit.evaluations[0]!;
    const warningValues = {
      "left-ventricle.maximum-dpdt": 2502,
      "left-ventricle.minimum-dpdt": -1864,
    };
    const result = {
      ...source,
      checks: source.checks.map((check) => check.checkId in warningValues
        ? { ...check, actual: warningValues[check.checkId as keyof typeof warningValues],
          status: "failed" as const }
        : check),
    };
    expect(() => assertMainWireBaselineConditioningTaskResultV1(result)).not.toThrow();
    expect(result.checks.filter(({ status }) => status === "failed")).toHaveLength(2);
    expect(result.failedObjectiveCheckIds).toEqual([]);
    for (const actual of [NaN, Infinity, 0, -1]) {
      const invalid = { ...result, checks: result.checks.map((check) =>
        check.checkId === "left-ventricle.maximum-dpdt" ? { ...check, actual } : check) };
      expect(() => assertMainWireBaselineConditioningTaskResultV1(invalid)).toThrow();
    }
    const wronglyRejected = { ...result, constructionGateStatus: "failed",
      objectiveGateStatus: "failed", failedConstructionCheckIds: Object.keys(warningValues),
      failedObjectiveCheckIds: Object.keys(warningValues) };
    expect(() => assertMainWireBaselineConditioningTaskResultV1(wronglyRejected))
      .toThrow(/gates are inconsistent/);
  });

  it("uses observed step-halving perturbation as a practical rank tolerance", () => {
    const spectrum = buildMainWireBaselineConditioningSpectrumV1([
      sensitivityV1("aortic-valve.mean-gradient", coordinates[0], 3, 3),
      sensitivityV1("aortic-valve.mean-gradient", coordinates[1], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[0], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[1], 0.03, 0.01),
    ], coordinates)!;

    expect(spectrum.candidateRowCount).toBe(2);
    expect(spectrum.rowCount).toBe(2);
    expect(spectrum.rowAdmissionPolicy).toBe(
      "complete-and-step-sign-stable",
    );
    expect(spectrum.excludedRows).toEqual([]);
    expect(spectrum.singularValues[0]).toBeCloseTo(3);
    expect(spectrum.singularValues[1]).toBeCloseTo(0.01);
    expect(spectrum.numericalRank).toBe(2);
    expect(spectrum.observedStepHalvingPerturbationFrobeniusNorm)
      .toBeCloseTo(0.02);
    expect(spectrum.practicalRankTolerance).toBeCloseTo(0.02);
    expect(spectrum.practicalRankToleranceComposition).toBe(
      "maximum-of-machine-and-observed-step-halving-frobenius",
    );
    expect(spectrum.practicalRank).toBe(1);
    expect(spectrum.conditionNumber).toBeCloseTo(300);
    expect(spectrum.practicalConditionNumber).toBeNull();
  });

  it("excludes a whole observation row when any coordinate changes sign", () => {
    const spectrum = buildMainWireBaselineConditioningSpectrumV1([
      sensitivityV1("aortic-valve.mean-gradient", coordinates[0], 3, 3),
      sensitivityV1("aortic-valve.mean-gradient", coordinates[1], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[0], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[1], 1, 1),
      sensitivityV1("aortic-pressure.minimum", coordinates[0], 1, -1),
      sensitivityV1("aortic-pressure.minimum", coordinates[1], 1, 1),
    ], coordinates)!;

    expect(spectrum.candidateRowCount).toBe(3);
    expect(spectrum.rowCount).toBe(2);
    expect(spectrum.excludedRows).toEqual([{
      conditionId: "rest-hr60",
      checkId: "aortic-pressure.minimum",
      reason: "step-sign-unstable",
    }]);
  });

  it("rejects duplicate coordinates or sensitivity identities", () => {
    const sensitivity = sensitivityV1(
      "aortic-pressure.maximum",
      coordinates[0],
      1,
      1,
    );
    expect(() => buildMainWireBaselineConditioningSpectrumV1(
      [sensitivity],
      [coordinates[0], coordinates[0]],
    )).toThrow(/coordinate IDs are duplicated/);
    expect(() => buildMainWireBaselineConditioningSpectrumV1(
      [sensitivity, sensitivity],
      [coordinates[0]],
    )).toThrow(/sensitivity is duplicated/);
  });

  it("reports every proper coordinate subset without selecting one", () => {
    const sensitivities = [
      sensitivityV1("aortic-valve.mean-gradient", coordinates[0], 3, 3),
      sensitivityV1("aortic-valve.mean-gradient", coordinates[1], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[0], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[1], 1, 1),
    ];
    const subsets =
      buildMainWireBaselineConditioningAlternativeSubsetSpectraV1(
        sensitivities,
        coordinates,
        2,
      );

    expect(subsets.map(({ coordinateIds }) => coordinateIds)).toEqual([
      [coordinates[0]],
      [coordinates[1]],
    ]);
    expect(subsets.map(({ practicalRankStatus }) => practicalRankStatus))
      .toEqual(["full", "full"]);
    expect(() =>
      buildMainWireBaselineConditioningAlternativeSubsetSpectraV1(
        sensitivities,
        coordinates,
        3,
      )).toThrow(/subset request is invalid/);
  });

  it("binds cached center checkpoints to the complete construction identity", async () => {
    const first =
      await buildMainWireBaselineConditioningCenterConstructionV1("rest-hr60");
    const second =
      await buildMainWireBaselineConditioningCenterConstructionV1("rest-hr60");
    const highPreload =
      await buildMainWireBaselineConditioningCenterConstructionV1(
        "fixed-control-high-preload",
      );
    expect(second).toEqual(first);
    expect(highPreload.constructionIdentitySha256)
      .not.toBe(first.constructionIdentitySha256);

    const artifact =
      await createMainWireBaselineConditioningCenterCacheArtifactV1(
        first,
        settledBaselineCheckpointJson,
      );
    await expect(
      validateMainWireBaselineConditioningCenterCacheArtifactV1(
        artifact,
        first,
      ),
    ).resolves.toEqual(artifact);
    await expect(
      validateMainWireBaselineConditioningCenterCacheArtifactV1({
        ...artifact,
        constructionIdentitySha256: "0".repeat(64),
      }, first),
    ).rejects.toThrow(/construction identity differs/);
  });

  it("evaluates the current center through Standard70 and retains safety status", async () => {
    const center = buildMainWireBaselineConditioningTasksV1({
      mode: "rest-pilot",
    }).find(({ coordinateId }) => coordinateId === null)!;
    const result = await evaluateMainWireBaselineConditioningTaskV1(
      center,
      settledBaselineCheckpointJson as unknown as
        MainWireIntegratedModelStandard70CheckpointV1,
    );

    expect(result.evaluationStatus).toBe("accepted");
    expect(result.initializationKind).toBe("standard70-exact-checkpoint");
    expect(result.completedCycleCount).toBe(3);
    expect(result.objectiveGateStatus).toBe("passed");
    expect(result.safetySentinelStatus).toBe("passed");
    expect(result.failedSafetySentinelCheckIds).toEqual([]);
    expect(result.checks).toHaveLength(28);
  }, 15_000);

  it("rebuilds a serialized audit and rejects derived or endpoint drift", async () => {
    const audit = await syntheticCompletedAuditV1();
    const serialized = JSON.parse(JSON.stringify(audit));

    await expect(verifyMainWireBaselineConditioningAuditV1(serialized))
      .resolves.toEqual(serialized);
    await expect(verifyMainWireBaselineConditioningAuditV1({
      ...serialized,
      primarySpectrum: {
        ...serialized.primarySpectrum,
        practicalRank: serialized.primarySpectrum.practicalRank + 1,
      },
    })).rejects.toThrow(/differs from its reconstruction/);
    const perturbationIndex = serialized.evaluations.findIndex(
      ({ task }: MainWireBaselineConditioningTaskResultV1) =>
        task.coordinateId !== null,
    );
    const impossibleAnchor = [...serialized.evaluations];
    impossibleAnchor[perturbationIndex] = {
      ...impossibleAnchor[perturbationIndex],
      sourceAnchorKind: "verified-condition-cache",
      initializationKind: "standard70-exact-checkpoint",
    };
    await expect(verifyMainWireBaselineConditioningAuditV1({
      ...serialized,
      evaluations: impossibleAnchor,
    })).rejects.toThrow(/provenance is invalid/);
    await expect(verifyMainWireBaselineConditioningAuditV1({
      ...serialized,
      centerCheckpointCache: null,
    })).rejects.toThrow(/artifact is incomplete/);

    const phaseOnlyRoundnessFailure = [...serialized.evaluations];
    const roundnessIndex = phaseOnlyRoundnessFailure.findIndex(
      ({ checks }: MainWireBaselineConditioningTaskResultV1) =>
        checks.some(({ checkId }) =>
          checkId === "waveform.LVP.rounded-not-plateau"),
    );
    const roundnessCheckId = "waveform.LVP.rounded-not-plateau";
    phaseOnlyRoundnessFailure[roundnessIndex] = {
      ...phaseOnlyRoundnessFailure[roundnessIndex],
      constructionGateStatus: "failed",
      objectiveGateStatus: "failed",
      failedConstructionCheckIds: [roundnessCheckId],
      failedObjectiveCheckIds: [roundnessCheckId],
      checks: phaseOnlyRoundnessFailure[roundnessIndex].checks.map((check) =>
        check.checkId === roundnessCheckId
          ? { ...check, status: "failed" }
          : check),
    };
    const phaseOnlyArtifact = await buildMainWireBaselineConditioningAuditV1({
      mode: serialized.mode,
      protocolCommit: serialized.protocolCommit,
      executionCommit: serialized.executionCommit,
      requestedParallelism: serialized.requestedParallelism,
      effectiveParallelism: serialized.effectiveParallelism,
      batchWallTimeMs: serialized.batchWallTimeMs,
      evaluations: phaseOnlyRoundnessFailure,
      centerCheckpointCache: serialized.centerCheckpointCache,
    });
    await expect(verifyMainWireBaselineConditioningAuditV1(
      JSON.parse(JSON.stringify(phaseOnlyArtifact)),
    )).resolves.toEqual(JSON.parse(JSON.stringify(phaseOnlyArtifact)));
  });
});

async function syntheticCompletedAuditV1() {
  const objectiveIds = new Set(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap(
    ({ checkIds }) => checkIds,
  ));
  const objectiveChecks = standard70ValidationJson.checks.filter(({ checkId }) =>
    objectiveIds.has(checkId)) as
      MainWireIntegratedModelBaselineValidationCheckV1[];
  const evaluations = buildMainWireBaselineConditioningTasksV1({
    mode: "rest-pilot",
  }).map((task): MainWireBaselineConditioningTaskResultV1 => {
    const resolved = resolveMainWireBaselineConditioningTaskV1(task);
    const activeDpDtEffect = task.coordinateId
        === "myocardium.common-ventricular-active-tension-scale"
      ? (resolved.transformedCoordinateValue ?? 0) * 0.05
      : 0;
    const checks = objectiveChecks.map((check) => {
      const width = check.maximum - check.minimum;
      const actual = (check.minimum + check.maximum) / 2
        + (check.checkId === "left-ventricle.maximum-dpdt"
          ? activeDpDtEffect * width
          : 0);
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
        ? "standard-baseline" as const
        : "condition-center" as const,
      sourceCheckpointSha256: center ? "a".repeat(64) : "b".repeat(64),
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
  });
  return buildMainWireBaselineConditioningAuditV1({
    mode: "rest-pilot",
    protocolCommit: "abcdef0",
    executionCommit: "abcdef1",
    requestedParallelism: 1,
    effectiveParallelism: 1,
    batchWallTimeMs: 25,
    evaluations,
    centerCheckpointCache: Object.freeze({
      policy:
        MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditioningPolicy
          .centerCheckpointReuse,
      requested: false,
      effective: false,
      hitCount: 0,
      missCount: 0,
      rejectedEntryCount: 0,
      reconfirmationFallbackCount: 0,
      writeCount: 0,
      writeFailureCount: 0,
    }),
  });
}

function sensitivityV1(
  checkId: MainWireBaselineConditioningSensitivityV1["checkId"],
  coordinateId: MainWireBaselineConditioningSensitivityV1["coordinateId"],
  fullStepNormalizedDerivative: number,
  halfStepNormalizedDerivative: number,
): MainWireBaselineConditioningSensitivityV1 {
  const difference = Math.abs(
    fullStepNormalizedDerivative - halfStepNormalizedDerivative,
  );
  const magnitude = Math.max(
    Math.abs(fullStepNormalizedDerivative),
    Math.abs(halfStepNormalizedDerivative),
  );
  return Object.freeze({
    conditionId: "rest-hr60",
    coordinateId,
    checkId,
    unit: "test-unit",
    constructionCorridorWidth: 1,
    fullStepNormalizedDerivative,
    halfStepNormalizedDerivative,
    fullToHalfAbsoluteDifference: difference,
    fullToHalfRelativeDifference: magnitude === 0 ? null : difference / magnitude,
    signStable: Math.sign(fullStepNormalizedDerivative)
      === Math.sign(halfStepNormalizedDerivative),
    status: "resolved",
  });
}
